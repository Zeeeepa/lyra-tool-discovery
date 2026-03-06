import type { DiscoveredTool } from '../types.js';

const GITHUB_API = 'https://api.github.com';

/**
 * GitHub search API caps at 1 000 results per query (10 pages × 100).
 * We fetch ALL pages for every query so the caller gets the full picture.
 */
const PER_PAGE = 100;
const MAX_PAGES_PER_QUERY = 10; // GitHub hard-limit: 1 000 results

/** Delay between search API requests to stay within rate limits */
const SEARCH_DELAY_MS = 2_200; // GitHub allows ~30 search requests/min (2s between)
const RATE_LIMIT_BACKOFF_MS = 60_000; // Wait 60s when rate-limited
const MAX_RATE_LIMIT_RETRIES = 3;

interface GitHubSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
    id: number;
    full_name: string;
    name: string;
    description: string;
    html_url: string;
    homepage: string;
    license: { spdx_id: string } | null;
    owner: { login: string };
    stargazers_count: number;
    topics: string[];
  }>;
}

interface GitHubContent {
  name: string;
  content: string;
  encoding: string;
}

export class GitHubSource {
  private token?: string;
  
  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;
  }
  
  private get headers(): HeadersInit {
    const h: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'lyra-tool-discovery'
    };
    if (this.token) {
      h['Authorization'] = `Bearer ${this.token}`;
    }
    return h;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Search GitHub for MCP servers — **exhaustively**.
   *
   * Every search term is queried. Every available page is fetched (up to
   * GitHub's 1 000-result-per-query cap). Results are deduplicated by repo
   * full_name. There is NO internal result cap — the caller receives
   * everything GitHub returns.
   *
   * @param searchTerms  Category-specific search terms.
   *                     Falls back to legacy crypto terms when omitted.
   * @param _limit       Ignored — kept for backward compat signature.
   * @param maxAgeMonths Only consider repos pushed within this many months.
   */
  async searchMCPServers(searchTerms?: string[], _limit?: number, maxAgeMonths = 12): Promise<DiscoveredTool[]> {
    // Calculate date filter
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - maxAgeMonths);
    const dateFilter = `pushed:>${cutoffDate.toISOString().split('T')[0]}`;

    // Fall back to legacy crypto terms when no search terms are provided.
    const terms = searchTerms && searchTerms.length > 0
      ? searchTerms
      : [
          'crypto mcp', 'defi mcp server', 'blockchain mcp', 'web3 mcp',
          'ethereum mcp', 'solana mcp', 'bitcoin mcp', 'wallet mcp',
          'token mcp', 'nft mcp server', 'dex mcp', 'swap mcp',
          'staking mcp', 'trading mcp server',
        ];

    const queries = [
      // MCP servers with category focus
      ...terms.map(term => `${term} in:name,description,readme ${dateFilter}`),
      // Also search with modelcontextprotocol prefix for each base keyword
      ...terms.map(term => `modelcontextprotocol ${term.split(' ')[0]} in:name,description ${dateFilter}`),
    ];
    
    const tools: DiscoveredTool[] = [];
    const seen = new Set<string>();

    console.log(`  [GitHub] Running ${queries.length} queries (exhaustive, all pages)…`);

    // Run EVERY query, fetch ALL pages — no early break.
    for (let qi = 0; qi < queries.length; qi++) {
      const query = queries[qi];
      try {
        const results = await this.searchReposExhaustive(query, qi, queries.length);
        for (const tool of results) {
          if (!seen.has(tool.id)) {
            seen.add(tool.id);
            tools.push(tool);
          }
        }
      } catch (error) {
        // Log but continue — don't abort remaining queries
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`  [GitHub] Query ${qi + 1}/${queries.length} failed: ${msg}`);
      }
    }

    console.log(`  [GitHub] ${queries.length} queries → ${tools.length} unique repos`);
    return tools;
  }
  
  /**
   * Search for OpenAPI/Swagger specs — exhaustively.
   */
  async searchOpenAPISpecs(): Promise<DiscoveredTool[]> {
    const queries = [
      'openapi spec in:name,description',
      'swagger api in:name,description',
      'openapi.json in:path'
    ];
    
    const tools: DiscoveredTool[] = [];
    const seen = new Set<string>();
    
    for (let qi = 0; qi < queries.length; qi++) {
      try {
        const results = await this.searchReposExhaustive(queries[qi], qi, queries.length);
        for (const tool of results) {
          if (!seen.has(tool.id)) {
            seen.add(tool.id);
            tool.hasOpenAPI = true;
            tools.push(tool);
          }
        }
      } catch (error) {
        console.error(`Search failed for "${queries[qi]}":`, error);
      }
    }
    
    return tools;
  }

  /**
   * Fetch ALL pages for a single GitHub search query (up to 1 000 results).
   *
   * Does NOT fetch README/package.json — that would be thousands of extra
   * API calls. Use enrichTool() selectively after filtering.
   *
   * Respects rate limits:
   *  - Pauses SEARCH_DELAY_MS between requests
   *  - Backs off RATE_LIMIT_BACKOFF_MS on 403/429 and retries
   */
  private async searchReposExhaustive(
    query: string,
    queryIndex: number,
    totalQueries: number,
  ): Promise<DiscoveredTool[]> {
    const allTools: DiscoveredTool[] = [];
    let page = 1;
    let rateLimitRetries = 0;

    while (page <= MAX_PAGES_PER_QUERY) {
      const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${PER_PAGE}&page=${page}`;

      const response = await fetch(url, { headers: this.headers });

      // ── Rate-limit handling ──────────────────────────────────
      if (response.status === 403 || response.status === 429) {
        rateLimitRetries++;
        if (rateLimitRetries > MAX_RATE_LIMIT_RETRIES) {
          console.error(`  [GitHub] Query ${queryIndex + 1}/${totalQueries}: rate-limit retries exhausted, moving on`);
          break;
        }
        const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10);
        const waitMs = retryAfter > 0 ? retryAfter * 1000 : RATE_LIMIT_BACKOFF_MS;
        console.error(`  [GitHub] Rate limited (${response.status}), waiting ${Math.round(waitMs / 1000)}s (retry ${rateLimitRetries}/${MAX_RATE_LIMIT_RETRIES})…`);
        await this.sleep(waitMs);
        continue; // Retry the same page
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API ${response.status}: ${text.slice(0, 200)}`);
      }

      const data = await response.json() as GitHubSearchResult;
      allTools.push(...this.mapItems(data.items));

      // Check remaining rate limit
      const remaining = parseInt(response.headers.get('x-ratelimit-remaining') || '999', 10);
      if (remaining <= 1) {
        const resetAt = parseInt(response.headers.get('x-ratelimit-reset') || '0', 10);
        const waitMs = resetAt > 0 ? (resetAt * 1000 - Date.now() + 1000) : RATE_LIMIT_BACKOFF_MS;
        if (waitMs > 0) {
          console.error(`  [GitHub] Rate limit nearly exhausted (${remaining} left), waiting ${Math.round(waitMs / 1000)}s…`);
          await this.sleep(waitMs);
        }
      }

      // Stop if we've exhausted all results for this query
      if (data.items.length < PER_PAGE || allTools.length >= data.total_count) {
        break;
      }

      page++;

      // Throttle between pages
      await this.sleep(SEARCH_DELAY_MS);
    }

    return allTools;
  }

  /**
   * Map raw GitHub search items to DiscoveredTool objects.
   * Lightweight — no extra API calls.
   */
  private mapItems(items: GitHubSearchResult['items']): DiscoveredTool[] {
    return items.map(item => ({
      id: `github:${item.full_name}`,
      name: item.name,
      description: item.description || '',
      source: 'github' as const,
      sourceUrl: item.html_url,
      license: item.license?.spdx_id,
      author: item.owner.login,
      homepage: item.homepage || undefined,
      repository: item.html_url,
      stars: item.stargazers_count,
      hasMCPSupport: item.topics?.includes('mcp') || 
                     item.name.includes('mcp') ||
                     item.description?.toLowerCase().includes('mcp') || false,
      hasNpmPackage: item.topics?.includes('npm') ||
                     item.topics?.includes('nodejs') || false,
    }));
  }

  /**
   * Enrich a tool with README + package.json data (expensive — 2 API calls per tool).
   * Call AFTER filtering to avoid burning rate limit on irrelevant repos.
   */
  async enrichTool(tool: DiscoveredTool): Promise<DiscoveredTool> {
    const repoFullName = tool.repository?.replace('https://github.com/', '') || '';
    if (!repoFullName) return tool;

    try {
      const [readme, packageJson] = await Promise.all([
        this.getFileContent(repoFullName, 'README.md').catch(() => null),
        this.getFileContent(repoFullName, 'package.json').catch(() => null)
      ]);

      if (readme) {
        tool.readme = readme;
      }

      if (packageJson) {
        try {
          tool.packageJson = JSON.parse(packageJson);
          tool.hasNpmPackage = true;

          const pkg = tool.packageJson as Record<string, unknown>;
          const deps = { 
            ...(pkg.dependencies as Record<string, string> || {}),
            ...(pkg.devDependencies as Record<string, string> || {})
          };

          if (deps['@modelcontextprotocol/sdk']) {
            tool.hasMCPSupport = true;
          }
        } catch {
          // Ignore parse errors
        }
      }
    } catch {
      // Continue without extra info
    }

    return tool;
  }
  
  private async getFileContent(repo: string, path: string): Promise<string | null> {
    const url = `${GITHUB_API}/repos/${repo}/contents/${path}`;
    
    const response = await fetch(url, { headers: this.headers });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as GitHubContent;
    
    if (data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    
    return null;
  }
  
  /**
   * Get a specific repo as a discovered tool (with enrichment).
   */
  async getRepo(owner: string, repo: string): Promise<DiscoveredTool | null> {
    const url = `${GITHUB_API}/repos/${owner}/${repo}`;
    
    const response = await fetch(url, { headers: this.headers });
    
    if (!response.ok) {
      return null;
    }
    
    const item = await response.json();
    
    const tool: DiscoveredTool = {
      id: `github:${item.full_name}`,
      name: item.name,
      description: item.description || '',
      source: 'github',
      sourceUrl: item.html_url,
      license: item.license?.spdx_id,
      author: item.owner.login,
      homepage: item.homepage || undefined,
      repository: item.html_url,
    };
    
    // Fetch README and package.json
    const [readme, packageJson] = await Promise.all([
      this.getFileContent(item.full_name, 'README.md').catch(() => null),
      this.getFileContent(item.full_name, 'package.json').catch(() => null)
    ]);
    
    if (readme) {
      tool.readme = readme;
      tool.hasMCPSupport = readme.toLowerCase().includes('mcp') ||
                           readme.includes('@modelcontextprotocol');
    }
    
    if (packageJson) {
      try {
        tool.packageJson = JSON.parse(packageJson);
        tool.hasNpmPackage = true;
      } catch {
        // Ignore
      }
    }
    
    return tool;
  }
}

