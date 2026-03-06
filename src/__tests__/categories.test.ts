import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  DEFAULT_CATEGORY,
  getCategoryConfig,
  listCategories,
  isValidCategory,
  isRelevantToCategory,
} from '../categories.js';
import type { DiscoveredTool } from '../types.js';

// Helper to build a minimal DiscoveredTool
function makeTool(overrides: Partial<DiscoveredTool> = {}): DiscoveredTool {
  return {
    id: 'test:tool',
    name: 'test-tool',
    description: 'A generic tool',
    source: 'github',
    sourceUrl: 'https://github.com/test/tool',
    ...overrides,
  };
}

describe('categories', () => {
  // ------------------------------------------------------------------
  // CATEGORIES registry
  // ------------------------------------------------------------------
  describe('CATEGORIES registry', () => {
    it('should have at least 19 categories', () => {
      expect(Object.keys(CATEGORIES).length).toBeGreaterThanOrEqual(19);
    });

    it('every category should have required fields', () => {
      for (const [key, cat] of Object.entries(CATEGORIES)) {
        expect(cat.id).toBe(key);
        expect(cat.displayName.length).toBeGreaterThan(0);
        expect(cat.description.length).toBeGreaterThan(0);
        expect(cat.searchTerms.length).toBeGreaterThanOrEqual(5);
        expect(cat.relevanceKeywords.length).toBeGreaterThanOrEqual(10);
      }
    });

    it('should include core categories', () => {
      const ids = Object.keys(CATEGORIES);
      expect(ids).toContain('trading');
      expect(ids).toContain('research');
      expect(ids).toContain('code-analysis');
      expect(ids).toContain('database');
      expect(ids).toContain('orchestration');
      expect(ids).toContain('api');
      expect(ids).toContain('knowledge-base');
      expect(ids).toContain('automation');
      expect(ids).toContain('testing');
      expect(ids).toContain('observability');
      expect(ids).toContain('security');
      expect(ids).toContain('frontend');
      expect(ids).toContain('devops');
      expect(ids).toContain('coding-assistant');
      expect(ids).toContain('content-creation');
      expect(ids).toContain('etl');
      expect(ids).toContain('gamedev');
      expect(ids).toContain('communication');
      expect(ids).toContain('storage');
    });
  });

  // ------------------------------------------------------------------
  // DEFAULT_CATEGORY
  // ------------------------------------------------------------------
  describe('DEFAULT_CATEGORY', () => {
    it('should be "trading" for backward compatibility', () => {
      expect(DEFAULT_CATEGORY).toBe('trading');
    });

    it('should exist in the CATEGORIES registry', () => {
      expect(CATEGORIES[DEFAULT_CATEGORY]).toBeDefined();
    });
  });

  // ------------------------------------------------------------------
  // getCategoryConfig
  // ------------------------------------------------------------------
  describe('getCategoryConfig', () => {
    it('should return config for a valid category', () => {
      const config = getCategoryConfig('database');
      expect(config.id).toBe('database');
      expect(config.displayName).toBe('Database');
      expect(config.searchTerms.length).toBeGreaterThan(0);
      expect(config.relevanceKeywords.length).toBeGreaterThan(0);
    });

    it('should throw for an unknown category', () => {
      expect(() => getCategoryConfig('nonexistent-category')).toThrow(
        /Unknown category "nonexistent-category"/,
      );
    });

    it('should include available categories in error message', () => {
      try {
        getCategoryConfig('xyz');
      } catch (e: unknown) {
        expect((e as Error).message).toContain('trading');
        expect((e as Error).message).toContain('database');
      }
    });
  });

  // ------------------------------------------------------------------
  // listCategories
  // ------------------------------------------------------------------
  describe('listCategories', () => {
    it('should return all categories sorted by id', () => {
      const list = listCategories();
      expect(list.length).toBe(Object.keys(CATEGORIES).length);
      const ids = list.map((c) => c.id);
      const sorted = [...ids].sort();
      expect(ids).toEqual(sorted);
    });
  });

  // ------------------------------------------------------------------
  // isValidCategory
  // ------------------------------------------------------------------
  describe('isValidCategory', () => {
    it('should return true for valid categories', () => {
      expect(isValidCategory('trading')).toBe(true);
      expect(isValidCategory('database')).toBe(true);
      expect(isValidCategory('research')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(isValidCategory('nope')).toBe(false);
      expect(isValidCategory('')).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // isRelevantToCategory
  // ------------------------------------------------------------------
  describe('isRelevantToCategory', () => {
    it('should match tool by name', () => {
      const tool = makeTool({ name: 'postgres-mcp' });
      const kw = getCategoryConfig('database').relevanceKeywords;
      expect(isRelevantToCategory(tool, kw)).toBe(true);
    });

    it('should match tool by description', () => {
      const tool = makeTool({ description: 'A blockchain bridge for DeFi' });
      const kw = getCategoryConfig('trading').relevanceKeywords;
      expect(isRelevantToCategory(tool, kw)).toBe(true);
    });

    it('should match tool by readme', () => {
      const tool = makeTool({ readme: 'This tool integrates with Kubernetes clusters' });
      const kw = getCategoryConfig('devops').relevanceKeywords;
      expect(isRelevantToCategory(tool, kw)).toBe(true);
    });

    it('should NOT match unrelated tool', () => {
      const tool = makeTool({
        name: 'cute-cat-pics',
        description: 'Pictures of cats',
      });
      const kw = getCategoryConfig('database').relevanceKeywords;
      expect(isRelevantToCategory(tool, kw)).toBe(false);
    });

    it('should be case-insensitive', () => {
      const tool = makeTool({ description: 'A BLOCKCHAIN tool' });
      const kw = getCategoryConfig('trading').relevanceKeywords;
      expect(isRelevantToCategory(tool, kw)).toBe(true);
    });

    it('should handle tool with empty optional fields', () => {
      const tool = makeTool({ name: '', description: '', readme: undefined });
      const kw = getCategoryConfig('trading').relevanceKeywords;
      expect(isRelevantToCategory(tool, kw)).toBe(false);
    });
  });
});

