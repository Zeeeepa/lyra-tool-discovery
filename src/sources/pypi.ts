import type { DiscoveredTool } from '../types.js';

const PYPI_SEARCH = 'https://pypi.org/search/';
const PYPI_JSON_API = 'https://pypi.org/pypi';

/**
 * PyPI JSON API response for a single package
 */
interface PyPIPackageInfo {
  info: {
    name: string;
    version: string;
    summary: string;
    description: string;
    description_content_type: string;
    license: string;
    author: string;
    author_email: string;
    home_page: string;
    project_url: string;
    project_urls: Record<string, string> | null;
    keywords: string;
    classifiers: string[];
    requires_dist: string[] | null;
    package_url: string;
  };
  urls: Array<{
    filename: string;
    url: string;
    packagetype: string;
  }>;
}

/**
 * PyPI XML-RPC is deprecated; we use the JSON API per-package
 * and fall back to a simple HTML scrape of the search page
 * for discovery queries.
 *
 * Strategy:
 *   1. Search via pypi.org/search/?q=<term> (HTML) — extract package names
 *   2. Fetch full metadata via pypi.org/pypi/<name>/json
 */
export class PyPISource {

  /**
   * Search PyPI for MCP-related Python packages matching search terms.
   */
  async searchMCPServers(
    searchTerms: string[] = ['mcp-server'],
    limit = 10,
  ): Promise<DiscoveredTool[]> {
    const queries: string[] = [];

    for (const term of searchTerms) {
      queries.push(`mcp ${term}`);
    }
    // Also search raw term + python-specific patterns
    for (const term of searchTerms.slice(0, 5)) {
      queries.push(`mcp-server-${term}`);
    }

    const tools: DiscoveredTool[] = [];
    const seen = new Set<string>();

    for (const query of queries) {
      if (tools.length >= limit) break;

      try {
        const names = await this.searchPackageNames(query, limit - tools.length);
        for (const name of names) {
          if (seen.has(name)) continue;
          seen.add(name);

          const tool = await this.getPackageAsTool(name);
          if (tool) {
            tools.push(tool);
          }
          if (tools.length >= limit) break;
        }
      } catch (error) {
        console.error(`PyPI search failed for "${query}":`, error);
      }
    }

    return tools.slice(0, limit);
  }

  /**
   * Scrape package names from pypi.org/search HTML.
   * PyPI doesn't have a public JSON search API, so we parse
   * the HTML search results page.
   */
  private async searchPackageNames(query: string, maxResults = 10): Promise<string[]> {
    const url = `${PYPI_SEARCH}?q=${encodeURIComponent(query)}&o=`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'lyra-tool-discovery',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`PyPI search error: ${response.status}`);
    }

    const html = await response.text();

    // Extract package names from search result links:
    //   <a class="package-snippet" href="/project/PACKAGE_NAME/">
    const nameRegex = /class="package-snippet"[^>]*href="\/project\/([^/"]+)\/?"/g;
    const names: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = nameRegex.exec(html)) !== null) {
      if (names.length >= maxResults) break;
      names.push(match[1]);
    }

    return names;
  }

  /**
   * Fetch full package metadata from PyPI JSON API
   */
  private async getPackageInfo(name: string): Promise<PyPIPackageInfo | null> {
    const url = `${PYPI_JSON_API}/${encodeURIComponent(name)}/json`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'lyra-tool-discovery' },
    });

    if (!response.ok) {
      return null;
    }

    return response.json() as Promise<PyPIPackageInfo>;
  }

  /**
   * Convert a PyPI package into a DiscoveredTool
   */
  async getPackageAsTool(name: string): Promise<DiscoveredTool | null> {
    const pkg = await this.getPackageInfo(name);
    if (!pkg) return null;

    const info = pkg.info;

    const repoUrl =
      info.project_urls?.['Source'] ||
      info.project_urls?.['Repository'] ||
      info.project_urls?.['GitHub'] ||
      info.project_urls?.['Homepage'] ||
      info.home_page ||
      undefined;

    const keywords = info.keywords
      ? info.keywords.split(/[,\s]+/).filter(Boolean)
      : [];

    const deps = info.requires_dist || [];
    const hasMCP =
      keywords.some(k => k.toLowerCase().includes('mcp')) ||
      info.name.toLowerCase().includes('mcp') ||
      info.summary?.toLowerCase().includes('mcp') ||
      deps.some(d => d.toLowerCase().includes('mcp'));

    const tool: DiscoveredTool = {
      id: `pypi:${info.name}`,
      name: info.name,
      description: info.summary || '',
      source: 'pypi',
      sourceUrl: info.package_url || `https://pypi.org/project/${info.name}/`,
      license: info.license || undefined,
      author: info.author || undefined,
      homepage: info.home_page || undefined,
      repository: repoUrl,
      hasPyPIPackage: true,
      hasMCPSupport: hasMCP,
      readme: info.description || undefined,
    };

    // Python MCP servers typically run via `python -m` or `uvx`
    if (hasMCP) {
      tool.mcpConfig = {
        type: 'stdio',
        command: 'uvx',
        args: [info.name],
        env: {},
      };
    }

    return tool;
  }
}

