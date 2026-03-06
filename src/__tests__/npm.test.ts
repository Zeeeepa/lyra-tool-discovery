import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NpmSource } from '../sources/npm.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('NpmSource', () => {
  let npm: NpmSource;

  beforeEach(() => {
    vi.useFakeTimers();
    npm = new NpmSource();
    mockFetch.mockReset();
    // Suppress console.log/error in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /**
   * Helper: call an async method that uses setTimeout internally,
   * while advancing fake timers so it doesn't hang.
   */
  async function runWithFakeTimers<T>(promise: Promise<T>): Promise<T> {
    // Keep advancing timers until the promise resolves
    let resolved = false;
    let result: T;
    let error: unknown;

    promise
      .then(r => { result = r; resolved = true; })
      .catch(e => { error = e; resolved = true; });

    // Advance timers in small increments until resolved
    while (!resolved) {
      await vi.advanceTimersByTimeAsync(2000);
    }

    if (error) throw error;
    return result!;
  }

  describe('searchMCPServers', () => {
    it('should search for MCP packages with default (trading) terms', async () => {
      // All queries return the same package — exhaustive search runs them all
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total: 1,
          objects: [
            {
              package: {
                name: '@crypto/mcp-server',
                version: '1.0.0',
                description: 'A crypto MCP server',
                keywords: ['mcp', 'crypto'],
                author: { name: 'author' },
                links: {
                  npm: 'https://www.npmjs.com/package/@crypto/mcp-server',
                  homepage: 'https://example.com',
                  repository: 'https://github.com/crypto/mcp-server',
                },
                publisher: { username: 'publisher' },
              },
            },
          ],
        }),
      });

      // No searchTerms → defaults to crypto/trading (many queries)
      const tools = await runWithFakeTimers(npm.searchMCPServers());

      // Only 1 unique package even though many queries ran
      expect(tools).toHaveLength(1);
      expect(tools[0]).toMatchObject({
        id: 'npm:@crypto/mcp-server',
        name: '@crypto/mcp-server',
        source: 'npm',
      });
    });

    it('should search with custom category search terms', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total: 1,
          objects: [
            {
              package: {
                name: 'mcp-postgres',
                version: '1.0.0',
                description: 'PostgreSQL MCP server',
                keywords: ['mcp', 'postgres'],
                author: { name: 'author' },
                links: {
                  npm: 'https://www.npmjs.com/package/mcp-postgres',
                },
                publisher: { username: 'user' },
              },
            },
          ],
        }),
      });

      const dbTerms = ['database mcp server', 'sql mcp', 'postgres mcp'];
      const tools = await runWithFakeTimers(npm.searchMCPServers(dbTerms));

      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('mcp-postgres');
    });

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total: 0,
          objects: [],
        }),
      });

      const tools = await runWithFakeTimers(npm.searchMCPServers());
      expect(tools).toHaveLength(0);
    });

    it('should detect MCP support from keywords', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total: 1,
          objects: [
            {
              package: {
                name: 'my-mcp-tool',
                version: '1.0.0',
                description: 'Tool with MCP',
                keywords: ['mcp'],
                links: {
                  npm: 'https://npm.com/my-mcp-tool',
                },
                publisher: { username: 'user' },
              },
            },
          ],
        }),
      });

      const tools = await runWithFakeTimers(npm.searchMCPServers());

      expect(tools).toHaveLength(1);
      expect(tools[0].hasMCPSupport).toBe(true);
    });

    it('should detect MCP support from package name', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total: 1,
          objects: [
            {
              package: {
                name: 'some-mcp-server',
                version: '1.0.0',
                description: 'A server',
                links: {
                  npm: 'https://npm.com/some-mcp-server',
                },
                publisher: { username: 'user' },
              },
            },
          ],
        }),
      });

      const tools = await runWithFakeTimers(npm.searchMCPServers());

      expect(tools).toHaveLength(1);
      expect(tools[0].hasMCPSupport).toBe(true);
    });

    it('should return multiple unique packages from different queries', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          json: async () => ({
            total: 1,
            objects: [
              {
                package: {
                  name: `mcp-pkg-${callCount}`,
                  version: '1.0.0',
                  description: `Package ${callCount}`,
                  keywords: ['mcp'],
                  links: {
                    npm: `https://npm.com/mcp-pkg-${callCount}`,
                  },
                  publisher: { username: 'user' },
                },
              },
            ],
          }),
        };
      });

      const terms = ['term1', 'term2'];
      const tools = await runWithFakeTimers(npm.searchMCPServers(terms));

      // 2 terms × 3 query variants (mcp, mcp-server, modelcontextprotocol) = 6 queries
      // Each returns a unique package
      expect(tools.length).toBe(6);
    });

    it('should deduplicate packages across queries', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total: 1,
          objects: [
            {
              package: {
                name: 'same-package',
                version: '1.0.0',
                description: 'Always the same',
                keywords: ['mcp'],
                links: {
                  npm: 'https://npm.com/same-package',
                },
                publisher: { username: 'user' },
              },
            },
          ],
        }),
      });

      const tools = await runWithFakeTimers(npm.searchMCPServers());
      // Many queries, all return same package → should be deduplicated to 1
      expect(tools).toHaveLength(1);
    });
  });

  describe('getPackageAsTool', () => {
    it('should convert npm package to discovered tool', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'test-package',
          description: 'Test package',
          'dist-tags': { latest: '2.0.0' },
          versions: {
            '2.0.0': {
              name: 'test-package',
              version: '2.0.0',
              description: 'Test package',
              license: 'MIT',
              author: { name: 'Test Author' },
              homepage: 'https://test.com',
              repository: { url: 'https://github.com/test/test' },
              keywords: ['mcp', 'test'],
              dependencies: {},
            },
          },
          readme: '# Test Package',
        }),
      });

      const tool = await npm.getPackageAsTool('test-package');

      expect(tool).toMatchObject({
        id: 'npm:test-package',
        name: 'test-package',
        source: 'npm',
      });
      // readme is set from top-level data
      expect(tool?.readme).toContain('Test Package');
    });

    it('should return null for non-existent package', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const tool = await npm.getPackageAsTool('non-existent-package');

      expect(tool).toBeNull();
    });
  });
});

