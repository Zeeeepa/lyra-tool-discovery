import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  getCategoryById,
  resolveCategories,
  mergeSearchTerms,
  mergeRelevanceKeywords,
  getGeneralSearchTerms,
  getCategoryIds,
} from '../categories.js';

describe('Categories', () => {
  describe('CATEGORIES registry', () => {
    it('should have 19 categories', () => {
      expect(CATEGORIES).toHaveLength(19);
    });

    it('should have unique ids', () => {
      const ids = CATEGORIES.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('each category should have non-empty searchTerms', () => {
      for (const cat of CATEGORIES) {
        expect(cat.searchTerms.length).toBeGreaterThan(0);
      }
    });

    it('each category should have non-empty relevanceKeywords', () => {
      for (const cat of CATEGORIES) {
        expect(cat.relevanceKeywords.length).toBeGreaterThan(0);
      }
    });

    it('should include expected categories', () => {
      const ids = getCategoryIds();
      expect(ids).toContain('code-analysis');
      expect(ids).toContain('database');
      expect(ids).toContain('mcp');
      expect(ids).toContain('web2api');
      expect(ids).toContain('trading');
      expect(ids).toContain('research');
      expect(ids).toContain('pentest');
      expect(ids).toContain('cc');
      expect(ids).toContain('control-plane');
      expect(ids).toContain('etl');
    });
  });

  describe('getCategoryById', () => {
    it('should find category by id', () => {
      const cat = getCategoryById('research');
      expect(cat).toBeDefined();
      expect(cat?.name).toBe('Research');
    });

    it('should be case-insensitive', () => {
      const cat = getCategoryById('RESEARCH');
      expect(cat).toBeDefined();
      expect(cat?.id).toBe('research');
    });

    it('should return undefined for unknown id', () => {
      const cat = getCategoryById('unknown-category');
      expect(cat).toBeUndefined();
    });
  });

  describe('resolveCategories', () => {
    it('should resolve a single category string', () => {
      const cats = resolveCategories('database');
      expect(cats).toHaveLength(1);
      expect(cats[0].id).toBe('database');
    });

    it('should resolve comma-separated string', () => {
      const cats = resolveCategories('database,etl');
      expect(cats).toHaveLength(2);
      expect(cats.map(c => c.id)).toEqual(['database', 'etl']);
    });

    it('should resolve array of ids', () => {
      const cats = resolveCategories(['research', 'cc']);
      expect(cats).toHaveLength(2);
    });

    it('should skip unknown categories with warning', () => {
      const cats = resolveCategories(['research', 'fake']);
      expect(cats).toHaveLength(1);
      expect(cats[0].id).toBe('research');
    });
  });

  describe('mergeSearchTerms', () => {
    it('should merge and deduplicate terms', () => {
      const cats = resolveCategories(['database', 'etl']);
      const terms = mergeSearchTerms(cats);

      expect(terms.length).toBeGreaterThan(0);
      // Should have no duplicates
      expect(new Set(terms).size).toBe(terms.length);
    });
  });

  describe('mergeRelevanceKeywords', () => {
    it('should merge and lowercase keywords', () => {
      const cats = resolveCategories(['research']);
      const kws = mergeRelevanceKeywords(cats);

      expect(kws.length).toBeGreaterThan(0);
      for (const kw of kws) {
        expect(kw).toBe(kw.toLowerCase());
      }
    });
  });

  describe('getGeneralSearchTerms', () => {
    it('should return general MCP terms', () => {
      const terms = getGeneralSearchTerms();
      expect(terms.length).toBeGreaterThan(0);
      expect(terms).toContain('mcp-server');
      expect(terms).toContain('mcp');
    });
  });
});

