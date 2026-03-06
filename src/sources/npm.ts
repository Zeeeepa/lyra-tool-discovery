import type { DiscoveredTool } from '../types.js';

const NPM_REGISTRY = 'https://registry.npmjs.org';
const NPM_SEARCH = 'https://registry.npmjs.org/-/v1/search';

/**
 * npm search API supports `size` up to 250 and `from` for pagination.
 * We paginate through ALL results for every query.
 */
const NPM_PAGE_SIZE = 250;

/** Delay between requests — npm registry is strict on rate limits */
const NPM_MIN_DELAY_MS = 1_000;
const NPM_INTER_QUERY_DELAY_MS = 2_000;

/** Backoff when rate-limited */
const NPM_RATE_LIMIT_BACKOFF_MS = 30_000;
const NPM_MAX_RETRIES = 3;

interface NpmSearchResult {
  total: number;
  objects: Array<{
    package: {
      name: string;
      version: string;
      description: string;
      keywords?: string[];
      author?: { name: string } | string;
      links: {
        npm: string;
        homepage?: string;
        repository?: string;
      };
      publisher: { username: string };
    };
  }>;
}

interface NpmPackage {
  name: string;
  description: string;
  version: string;
  license?: string;
  author?: { name: string } | string;
  homepage?: string;
  repository?: { url: string } | string;
  keywords?: string[];
  bin?: Record<string, string> | string;
  dependencies?: Record<string, string>;
  readme?: string;
}

export class NpmSource {
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Search npm for MCP servers — **exhaustively**.
   *
   * Every search term is queried.  Every page is fetched.
   * Results are deduplicated by package name.
   * There is NO cap — the caller receives everything npm returns.
   *
   * @param searchTerms  Category-specific search terms.
   *                     Falls back to legacy crypto terms when omitted.
   * @param _limit       Ignored — kept for backward compat signature.
   */
  async searchMCPServers(searchTerms?: string[], _limit?: number): Promise<DiscoveredTool[]> {
    const terms = searchTerms && searchTerms.length > 0
      ? searchTerms
      : [
          'crypto mcp', 'defi mcp server', 'blockchain mcp', 'web3 mcp',
          'ethereum mcp', 'solana mcp', 'bitcoin mcp', 'wallet mcp',
          'token mcp', 'nft mcp server', 'dex mcp', 'swap mcp',
          'staking mcp', 'trading mcp server',
        ];

    const queries = [
      ...terms.map(term => `mcp ${term.split(' ')[0]}`),
      ...terms.map(term => `mcp-server ${term.split(' ')[0]}`),
      ...terms.map(term => `modelcontextprotocol ${term.split(' ')[0]}`),
    ];
    
    const tools: DiscoveredTool[] = [];
    const seen = new Set<string>();

    console.log(`  [npm] Running ${queries.length} queries (exhaustive, all pages)…`);

    for (let qi = 0; qi < queries.length; qi++) {
      const query = queries[qi];
      try {
        const results = await this.searchExhaustive(query, qi, queries.length);
        for (const tool of results) {
          if (!seen.has(tool.id)) {
            seen.add(tool.id);
            tools.push(tool);
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`  [npm] Query ${qi + 1}/${queries.length} failed: ${msg}`);
      }

      // Polite delay between queries to avoid npm rate limits
      if (qi < queries.length - 1) {
        await this.sleep(NPM_INTER_QUERY_DELAY_MS);
      }
    }

    console.log(`  [npm] ${queries.length} queries → ${tools.length} unique packages`);
    return tools;
  }

  /**
   * Fetch ALL pages for a single npm search query.
   * Lightweight — does NOT fetch full package info during search.
   * Includes retry logic for rate limits (429).
   */
  private async searchExhaustive(
    query: string,
    queryIndex: number,
    totalQueries: number,
  ): Promise<DiscoveredTool[]> {
    const allTools: DiscoveredTool[] = [];
    let from = 0;
    let retries = 0;

    while (true) {
      const url =
        `${NPM_SEARCH}?text=${encodeURIComponent(query)}` +
        `&size=${NPM_PAGE_SIZE}&from=${from}`;

      const response = await fetch(url);

      // ── Rate-limit handling ──────────────────────────────────
      if (response.status === 429) {
        retries++;
        if (retries > NPM_MAX_RETRIES) {
          console.error(
            `  [npm] Q${queryIndex + 1}/${totalQueries}: ` +
            `rate-limit retries exhausted`,
          );
          break;
        }
        const retryAfter = parseInt(
          response.headers.get('retry-after') || '0', 10,
        );
        const waitMs = retryAfter > 0
          ? retryAfter * 1000
          : NPM_RATE_LIMIT_BACKOFF_MS;
        console.error(
          `  [npm] Rate limited (429), waiting ${Math.round(waitMs / 1000)}s ` +
          `(retry ${retries}/${NPM_MAX_RETRIES})…`,
        );
        await this.sleep(waitMs);
        continue; // retry same page
      }

      if (!response.ok) {
        throw new Error(`npm search error: ${response.status}`);
      }

      retries = 0; // reset on success

      const data = await response.json() as NpmSearchResult;

      for (const obj of data.objects) {
        const pkg = obj.package;
        allTools.push({
          id: `npm:${pkg.name}`,
          name: pkg.name,
          description: pkg.description || '',
          source: 'npm',
          sourceUrl: pkg.links.npm,
          author: typeof pkg.author === 'string'
            ? pkg.author
            : pkg.author?.name,
          homepage: pkg.links.homepage,
          repository: pkg.links.repository,
          hasNpmPackage: true,
          hasMCPSupport:
            pkg.keywords?.includes('mcp') ||
            pkg.name.includes('mcp') ||
            (pkg.description?.toLowerCase().includes('mcp') ?? false),
        });
      }

      // Stop if we've exhausted all results
      if (
        data.objects.length < NPM_PAGE_SIZE ||
        allTools.length >= data.total
      ) {
        break;
      }
      from += NPM_PAGE_SIZE;

      await this.sleep(NPM_MIN_DELAY_MS);
    }

    return allTools;
  }

  /**
   * Enrich a tool with full npm package metadata (bin, deps, readme).
   * Expensive — 1 API call per package.  Call AFTER filtering.
   */
  async enrichTool(tool: DiscoveredTool): Promise<DiscoveredTool> {
    const fullPkg = await this.getPackage(tool.name).catch(() => null);
    if (!fullPkg) return tool;

    tool.license = fullPkg.license;
    tool.packageJson = fullPkg as unknown as Record<string, unknown>;

    if (fullPkg.readme) tool.readme = fullPkg.readme;

    if (fullPkg.dependencies?.['@modelcontextprotocol/sdk']) {
      tool.hasMCPSupport = true;
    }

    if (fullPkg.bin) {
      tool.mcpConfig = {
        type: 'stdio',
        command: 'npx',
        args: ['-y', fullPkg.name],
        env: {},
      };
    }

    return tool;
  }

  private async getPackage(name: string): Promise<NpmPackage | null> {
    const url = `${NPM_REGISTRY}/${encodeURIComponent(name)}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();
    const latest = data['dist-tags']?.latest;
    if (latest && data.versions?.[latest]) {
      return { ...data.versions[latest], readme: data.readme };
    }
    return data;
  }

  /**
   * Get a specific package as a discovered tool (with enrichment).
   */
  async getPackageAsTool(name: string): Promise<DiscoveredTool | null> {
    const pkg = await this.getPackage(name);
    if (!pkg) return null;

    const repoUrl = typeof pkg.repository === 'string'
      ? pkg.repository
      : pkg.repository?.url
          ?.replace(/^git\+/, '')
          .replace(/\.git$/, '');

    const tool: DiscoveredTool = {
      id: `npm:${pkg.name}`,
      name: pkg.name,
      description: pkg.description || '',
      source: 'npm',
      sourceUrl: `https://www.npmjs.com/package/${pkg.name}`,
      license: pkg.license,
      author: typeof pkg.author === 'string'
        ? pkg.author
        : pkg.author?.name,
      homepage: pkg.homepage,
      repository: repoUrl,
      hasNpmPackage: true,
      hasMCPSupport:
        pkg.keywords?.includes('mcp') ||
        pkg.name.includes('mcp') ||
        pkg.dependencies?.['@modelcontextprotocol/sdk'] !== undefined,
      packageJson: pkg as unknown as Record<string, unknown>,
      readme: pkg.readme,
    };

    if (pkg.bin) {
      tool.mcpConfig = {
        type: 'stdio',
        command: 'npx',
        args: ['-y', pkg.name],
        env: {},
      };
    }

    return tool;
  }
}
