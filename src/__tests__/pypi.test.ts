import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PyPISource } from '../sources/pypi.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PyPISource', () => {
  let pypi: PyPISource;

  beforeEach(() => {
    pypi = new PyPISource();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchMCPServers', () => {
    it('should search PyPI for MCP packages with given terms', async () => {
      // HTML search result
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <a class="package-snippet" href="/project/mcp-server-research/">
            <h3>mcp-server-research</h3>
          </a>
        `,
      });

      // PyPI JSON API for the discovered package
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          info: {
            name: 'mcp-server-research',
            version: '0.1.0',
            summary: 'A research MCP server',
            description: '# MCP Research Server',
            description_content_type: 'text/markdown',
            license: 'MIT',
            author: 'researcher',
            author_email: 'r@example.com',
            home_page: 'https://github.com/researcher/mcp-server-research',
            project_url: 'https://pypi.org/project/mcp-server-research/',
            project_urls: {
              'Source': 'https://github.com/researcher/mcp-server-research',
            },
            keywords: 'mcp research',
            classifiers: ['Programming Language :: Python :: 3'],
            requires_dist: ['mcp>=1.0.0'],
            package_url: 'https://pypi.org/project/mcp-server-research/',
          },
          urls: [],
        }),
      });

      const tools = await pypi.searchMCPServers(['research'], 1);

      expect(tools).toHaveLength(1);
      expect(tools[0]).toMatchObject({
        id: 'pypi:mcp-server-research',
        name: 'mcp-server-research',
        source: 'pypi',
        hasPyPIPackage: true,
        hasMCPSupport: true,
      });
    });

    it('should handle empty search results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => '<html><body>No results</body></html>',
      });

      const tools = await pypi.searchMCPServers(['nonexistent'], 10);
      expect(tools).toHaveLength(0);
    });

    it('should handle search errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const tools = await pypi.searchMCPServers(['test'], 5);
      expect(Array.isArray(tools)).toBe(true);
    });
  });

  describe('getPackageAsTool', () => {
    it('should convert PyPI package to discovered tool', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          info: {
            name: 'mcp-server-db',
            version: '1.0.0',
            summary: 'Database MCP server',
            description: '# DB Server',
            description_content_type: 'text/markdown',
            license: 'Apache-2.0',
            author: 'dbdev',
            author_email: 'db@example.com',
            home_page: 'https://github.com/dbdev/mcp-server-db',
            project_url: 'https://pypi.org/project/mcp-server-db/',
            project_urls: {
              'Repository': 'https://github.com/dbdev/mcp-server-db',
            },
            keywords: 'mcp database postgres',
            classifiers: [],
            requires_dist: ['mcp>=1.0.0', 'asyncpg'],
            package_url: 'https://pypi.org/project/mcp-server-db/',
          },
          urls: [],
        }),
      });

      const tool = await pypi.getPackageAsTool('mcp-server-db');

      expect(tool).toMatchObject({
        id: 'pypi:mcp-server-db',
        name: 'mcp-server-db',
        source: 'pypi',
        license: 'Apache-2.0',
        author: 'dbdev',
        hasPyPIPackage: true,
        hasMCPSupport: true,
      });

      // Should suggest uvx for running
      expect(tool?.mcpConfig).toMatchObject({
        type: 'stdio',
        command: 'uvx',
        args: ['mcp-server-db'],
      });
    });

    it('should return null for non-existent package', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const tool = await pypi.getPackageAsTool('nonexistent-package');
      expect(tool).toBeNull();
    });

    it('should detect non-MCP packages', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          info: {
            name: 'regular-package',
            version: '1.0.0',
            summary: 'A regular Python package',
            description: 'Nothing MCP related',
            description_content_type: 'text/plain',
            license: 'MIT',
            author: 'dev',
            author_email: 'dev@example.com',
            home_page: '',
            project_url: 'https://pypi.org/project/regular-package/',
            project_urls: null,
            keywords: 'utility',
            classifiers: [],
            requires_dist: ['requests'],
            package_url: 'https://pypi.org/project/regular-package/',
          },
          urls: [],
        }),
      });

      const tool = await pypi.getPackageAsTool('regular-package');

      expect(tool).toBeDefined();
      expect(tool?.hasMCPSupport).toBe(false);
      expect(tool?.mcpConfig).toBeUndefined();
    });
  });
});

