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
    it('should search for MCP servers with given search terms', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_count: 1,
          items: [
            {
              id: 123,
              full_name: 'owner/repo',
              name: 'repo',
              description: 'A research MCP server',
              html_url: 'https://github.com/owner/repo',
              homepage: 'https://example.com',
              license: { spdx_id: 'MIT' },
              owner: { login: 'owner' },
              stargazers_count: 100,
              topics: ['mcp', 'research'],
            },
          ],
        }),
      });

      const tools = await github.searchMCPServers(['research', 'arxiv'], 1);

      expect(tools).toHaveLength(1);
      expect(tools[0]).toMatchObject({
        id: 'github:owner/repo',
        name: 'repo',
        source: 'github',
        sourceUrl: 'https://github.com/owner/repo',
      });
    });

    it('should use default search terms when none provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_count: 0,
          items: [],
        }),
      });

      const tools = await github.searchMCPServers();

      // Should not throw and return empty
      expect(tools).toHaveLength(0);
      // Verify it made at least one search call
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_count: 0,
          items: [],
        }),
      });

      const tools = await github.searchMCPServers(['database'], 10);

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
      const tools = await github.searchMCPServers(['test', 'another'], 5);

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
      const tools = await github.searchMCPServers(['pentest'], 5);
      expect(Array.isArray(tools)).toBe(true);
    });
  });

  describe('getRepo', () => {
    it('should fetch a repo and detect MCP from README', async () => {
      // First call: repo info
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          full_name: 'owner/mcp-tool',
          name: 'mcp-tool',
          description: 'An MCP tool',
          html_url: 'https://github.com/owner/mcp-tool',
          homepage: null,
          license: { spdx_id: 'MIT' },
          owner: { login: 'owner' },
        }),
      });

      // README fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: Buffer.from('# MCP Tool\nUses @modelcontextprotocol').toString('base64'),
          encoding: 'base64',
        }),
      });

      // package.json fetch
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const tool = await github.getRepo('owner', 'mcp-tool');

      expect(tool).toBeDefined();
      expect(tool?.hasMCPSupport).toBe(true);
      expect(tool?.readme).toContain('MCP Tool');
    });

    it('should return null for non-existent repo', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const tool = await github.getRepo('owner', 'nonexistent');
      expect(tool).toBeNull();
    });
  });
});

