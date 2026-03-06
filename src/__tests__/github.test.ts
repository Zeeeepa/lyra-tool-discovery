import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubSource } from '../sources/github.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

/** Helper: build a mock Response with headers.get() support */
function mockGitHubResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: {
      get: (key: string) => {
        if (key === 'x-ratelimit-remaining') return '100';
        if (key === 'x-ratelimit-reset') return '0';
        if (key === 'retry-after') return '0';
        return null;
      },
    },
  };
}

/**
 * Helper: run an async function while advancing fake timers so
 * setTimeout-based sleeps don't hang.
 */
async function runWithFakeTimers<T>(promise: Promise<T>): Promise<T> {
  let resolved = false;
  let result: T;
  let error: unknown;

  promise
    .then(r => { result = r; resolved = true; })
    .catch(e => { error = e; resolved = true; });

  while (!resolved) {
    await vi.advanceTimersByTimeAsync(5000);
  }

  if (error) throw error;
  return result!;
}

describe('GitHubSource', () => {
  let github: GitHubSource;

  beforeEach(() => {
    vi.useFakeTimers();
    github = new GitHubSource();
    mockFetch.mockReset();
    // Suppress console.log/error in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize without token', () => {
      const source = new GitHubSource();
      expect(source).toBeDefined();
    });

    it('should initialize with token', () => {
      const source = new GitHubSource('test-token');
      expect(source).toBeDefined();
    });

    it('should use GITHUB_TOKEN from env', () => {
      const originalEnv = process.env.GITHUB_TOKEN;
      process.env.GITHUB_TOKEN = 'env-token';
      
      const source = new GitHubSource();
      expect(source).toBeDefined();
      
      process.env.GITHUB_TOKEN = originalEnv;
    });
  });

  describe('searchMCPServers', () => {
    it('should search for MCP servers with default (trading) terms', async () => {
      mockFetch.mockResolvedValue(mockGitHubResponse({
        total_count: 1,
        items: [
          {
            id: 123,
            full_name: 'owner/repo',
            name: 'repo',
            description: 'A crypto MCP server',
            html_url: 'https://github.com/owner/repo',
            homepage: 'https://example.com',
            license: { spdx_id: 'MIT' },
            owner: { login: 'owner' },
            stargazers_count: 100,
            topics: ['mcp', 'crypto'],
          },
        ],
      }));

      const tools = await runWithFakeTimers(github.searchMCPServers());

      expect(tools).toHaveLength(1);
      expect(tools[0]).toMatchObject({
        id: 'github:owner/repo',
        name: 'repo',
        source: 'github',
        sourceUrl: 'https://github.com/owner/repo',
      });
    });

    it('should search with custom category search terms', async () => {
      mockFetch.mockResolvedValue(mockGitHubResponse({
        total_count: 1,
        items: [
          {
            id: 456,
            full_name: 'owner/db-mcp',
            name: 'db-mcp',
            description: 'A database MCP server',
            html_url: 'https://github.com/owner/db-mcp',
            homepage: null,
            license: null,
            owner: { login: 'owner' },
            stargazers_count: 50,
            topics: ['mcp', 'database'],
          },
        ],
      }));

      const dbTerms = ['database mcp server', 'sql mcp', 'postgres mcp'];
      const tools = await runWithFakeTimers(github.searchMCPServers(dbTerms));

      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('db-mcp');
    });

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValue(mockGitHubResponse({
        total_count: 0,
        items: [],
      }));

      const tools = await runWithFakeTimers(github.searchMCPServers());
      expect(tools).toHaveLength(0);
    });

    it('should deduplicate results across queries', async () => {
      const mockRepo = {
        id: 123,
        full_name: 'owner/repo',
        name: 'repo',
        description: 'Test',
        html_url: 'https://github.com/owner/repo',
        homepage: null,
        license: null,
        owner: { login: 'owner' },
        stargazers_count: 50,
        topics: [],
      };

      mockFetch.mockResolvedValue(mockGitHubResponse({
        total_count: 1,
        items: [mockRepo],
      }));

      const tools = await runWithFakeTimers(github.searchMCPServers());
      expect(tools).toHaveLength(1);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue(mockGitHubResponse('Validation Failed', 422));

      const tools = await runWithFakeTimers(github.searchMCPServers());
      expect(Array.isArray(tools)).toBe(true);
    });

    it('should return multiple unique repos from different queries', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(async () => {
        callCount++;
        return mockGitHubResponse({
          total_count: 1,
          items: [
            {
              id: callCount,
              full_name: `owner/repo-${callCount}`,
              name: `repo-${callCount}`,
              description: `MCP server ${callCount}`,
              html_url: `https://github.com/owner/repo-${callCount}`,
              homepage: null,
              license: null,
              owner: { login: 'owner' },
              stargazers_count: 10,
              topics: ['mcp'],
            },
          ],
        });
      });

      const terms = ['term1', 'term2', 'term3'];
      const tools = await runWithFakeTimers(github.searchMCPServers(terms));

      // 3 search terms × 2 query variants (direct + modelcontextprotocol) = 6 queries
      expect(tools.length).toBe(6);
    });

    it('should handle pagination (stop when items < PER_PAGE)', async () => {
      mockFetch.mockResolvedValue(mockGitHubResponse({
        total_count: 50,
        items: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          full_name: `owner/repo-${i}`,
          name: `repo-${i}`,
          description: 'Test',
          html_url: `https://github.com/owner/repo-${i}`,
          homepage: null,
          license: null,
          owner: { login: 'owner' },
          stargazers_count: 10,
          topics: [],
        })),
      }));

      const tools = await runWithFakeTimers(github.searchMCPServers(['single-term']));
      // 2 queries, each returns 50 repos, deduped to 50
      expect(tools.length).toBe(50);
    });

    it('should handle rate limiting with backoff', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return mockGitHubResponse('rate limited', 403);
        }
        return mockGitHubResponse({ total_count: 0, items: [] });
      });

      const tools = await runWithFakeTimers(github.searchMCPServers(['test']));
      expect(Array.isArray(tools)).toBe(true);
    });
  });

  describe('getRepo', () => {
    it('should fetch repo as a discovered tool', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          full_name: 'owner/repo',
          name: 'repo',
          description: 'A test repo',
          html_url: 'https://github.com/owner/repo',
          homepage: 'https://example.com',
          license: { spdx_id: 'MIT' },
          owner: { login: 'owner' },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: Buffer.from('# Test Repo\nMCP server').toString('base64'),
          encoding: 'base64',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: Buffer.from(JSON.stringify({
            name: 'test-package',
            dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
          })).toString('base64'),
          encoding: 'base64',
        }),
      });

      const result = await github.getRepo('owner', 'repo');

      expect(result).toBeDefined();
      expect(result?.readme).toContain('Test Repo');
      expect(result?.packageJson).toHaveProperty('name', 'test-package');
    });

    it('should return null for non-existent repo', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await github.getRepo('owner', 'nonexistent');
      expect(result).toBeNull();
    });
  });
});

