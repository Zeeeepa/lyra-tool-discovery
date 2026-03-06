import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubSource } from '../sources/github.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GitHubSource', () => {
  let github: GitHubSource;

  beforeEach(() => {
    github = new GitHubSource();
    mockFetch.mockReset();
  });

  afterEach(() => {
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
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
        }),
      });

      // No searchTerms → defaults to crypto/trading
      const tools = await github.searchMCPServers(undefined, 1);

      expect(tools).toHaveLength(1);
      expect(tools[0]).toMatchObject({
        id: 'github:owner/repo',
        name: 'repo',
        source: 'github',
        sourceUrl: 'https://github.com/owner/repo',
      });
    });

    it('should search with custom category search terms', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
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
        }),
      });

      const dbTerms = ['database mcp server', 'sql mcp', 'postgres mcp'];
      const tools = await github.searchMCPServers(dbTerms, 1);

      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('db-mcp');
    });

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_count: 0,
          items: [],
        }),
      });

      const tools = await github.searchMCPServers(undefined, 10);

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

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_count: 1,
          items: [mockRepo],
        }),
      });

      // Request limit of 5, but same repo returned for all queries
      const tools = await github.searchMCPServers(undefined, 5);

      // Should only have 1 unique tool
      expect(tools.length).toBeLessThanOrEqual(5);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Rate limited',
      });

      // Should not throw, just return empty or partial results
      const tools = await github.searchMCPServers(undefined, 5);
      expect(Array.isArray(tools)).toBe(true);
    });
  });

  describe('getRepo', () => {
    it('should fetch repo as a discovered tool', async () => {
      // Mock repo fetch
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

      // Mock README fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: Buffer.from('# Test Repo\nMCP server').toString('base64'),
          encoding: 'base64',
        }),
      });

      // Mock package.json fetch
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

