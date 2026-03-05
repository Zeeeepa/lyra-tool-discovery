import { GitHubSource } from './sources/github.js';
import { NpmSource } from './sources/npm.js';
import { PyPISource } from './sources/pypi.js';
import { AIAnalyzer, type AIConfig } from './ai.js';
import {
  CATEGORIES,
  resolveCategories,
  mergeSearchTerms,
  mergeRelevanceKeywords,
  getGeneralSearchTerms,
  type Category,
} from './categories.js';
import type { 
  DiscoveredTool, 
  DiscoveryResult, 
  DiscoverySource,
  CustomPlugin,
  PluginIndexEntry
} from './types.js';

export interface DiscoveryOptions {
  sources?: DiscoverySource[];
  /** One or more category ids (e.g. 'research', 'database'). Omit or pass 'all' for general search. */
  category?: string | string[];
  /** Custom search keywords – overrides category search terms when provided */
  keywords?: string[];
  limit?: number;
  dryRun?: boolean;
  outputDir?: string;
  maxAgeMonths?: number;
  /** When true, skip the post-search relevance filter (useful with custom keywords) */
  skipFilter?: boolean;
}

export class ToolDiscovery {
  private github: GitHubSource;
  private npm: NpmSource;
  private pypi: PyPISource;
  private ai: AIAnalyzer;
  
  constructor(aiConfig?: AIConfig) {
    this.github = new GitHubSource();
    this.npm = new NpmSource();
    this.pypi = new PyPISource();
    this.ai = new AIAnalyzer(aiConfig);
  }
  
  /**
   * Discover MCP tools from configured sources, optionally filtered by category.
   *
   * Examples:
   *   discover()                                      // general MCP discovery
   *   discover({ category: 'research' })              // research MCP servers
   *   discover({ category: ['database', 'etl'] })     // database + ETL
   *   discover({ keywords: ['rag', 'retrieval'] })    // custom keyword search
   */
  async discover(options: DiscoveryOptions = {}): Promise<DiscoveryResult[]> {
    const {
      sources = ['github', 'npm', 'pypi'],
      category,
      keywords,
      limit = 10,
      dryRun = false,
      maxAgeMonths = 12,
      skipFilter = false,
    } = options;

    // ── Resolve search terms & relevance keywords ──────────────────
    let searchTerms: string[];
    let relevanceKeywords: string[] | null = null;
    let resolvedCategories: Category[] = [];
    let categoryLabel = 'all';

    if (keywords && keywords.length > 0) {
      // Custom keywords override category
      searchTerms = keywords;
      categoryLabel = `custom(${keywords.slice(0, 3).join(',')})`;
      // No relevance filter for custom keywords unless user wants it
      if (!skipFilter) {
        relevanceKeywords = keywords.map(k => k.toLowerCase());
      }
    } else if (category && category !== 'all') {
      resolvedCategories = resolveCategories(category);
      if (resolvedCategories.length === 0) {
        console.error('❌ No valid categories resolved. Falling back to general search.');
        searchTerms = getGeneralSearchTerms();
      } else {
        searchTerms = mergeSearchTerms(resolvedCategories);
        relevanceKeywords = mergeRelevanceKeywords(resolvedCategories);
        categoryLabel = resolvedCategories.map(c => c.name).join(', ');
      }
    } else {
      // "all" — general MCP discovery, no category filter
      searchTerms = getGeneralSearchTerms();
    }

    console.log(`🔍 Discovering MCP tools [${categoryLabel}] from: ${sources.join(', ')}`);
    console.log(`📅 Max age: ${maxAgeMonths} months | Search terms: ${searchTerms.slice(0, 6).join(', ')}${searchTerms.length > 6 ? '…' : ''}`);
    
    const tools: DiscoveredTool[] = [];
    
    // ── Collect from each source ───────────────────────────────────
    for (const source of sources) {
      try {
        const discovered = await this.discoverFromSource(source, searchTerms, limit, maxAgeMonths);
        console.log(`  Found ${discovered.length} from ${source}`);

        // Tag tools with resolved categories
        if (resolvedCategories.length > 0) {
          for (const t of discovered) {
            t.categories = resolvedCategories.map(c => c.id);
          }
        }

        tools.push(...discovered);
      } catch (error) {
        console.error(`  Error from ${source}:`, error);
      }
    }
    
    console.log(`\n📊 Total discovered: ${tools.length} tools`);
    
    if (tools.length === 0) {
      return [];
    }
    
    // ── Relevance filter ───────────────────────────────────────────
    let filtered = tools;
    if (relevanceKeywords && !skipFilter) {
      filtered = tools.filter(t => this.isRelevant(t, relevanceKeywords!));
      console.log(`🎯 Category-relevant: ${filtered.length} tools`);
    }

    // ── MCP filter ─────────────────────────────────────────────────
    const mcpTools = filtered.filter(t => t.hasMCPSupport);
    console.log(`🔌 MCP-compatible: ${mcpTools.length} tools`);
    
    // ── AI analysis ────────────────────────────────────────────────
    const results: DiscoveryResult[] = [];
    
    for (const tool of mcpTools.slice(0, limit)) {
      if (dryRun) {
        console.log(`\n[DRY RUN] Would analyze: ${tool.name}`);
        console.log(`  Source: ${tool.source}`);
        console.log(`  URL: ${tool.sourceUrl}`);
        console.log(`  MCP: ${tool.hasMCPSupport ? 'Yes' : 'No'}`);
        continue;
      }
      
      console.log(`\n🤖 Analyzing: ${tool.name}...`);
      
      try {
        const decision = await this.ai.analyzeAndDecide(tool);
        
        console.log(`  Template: ${decision.template}`);
        console.log(`  Reasoning: ${decision.reasoning}`);
        
        const quickImport = this.ai.generateQuickImport(decision);
        if (quickImport) {
          console.log(`  Quick Import:\n${quickImport}`);
        }
        
        results.push({
          tool,
          decision,
          generated: {
            pluginConfig: decision.config
          }
        });
      } catch (error) {
        console.error(`  Failed to analyze: ${error}`);
      }
    }
    
    return results;
  }
  
  private async discoverFromSource(
    source: DiscoverySource, 
    searchTerms: string[],
    limit: number,
    maxAgeMonths: number
  ): Promise<DiscoveredTool[]> {
    switch (source) {
      case 'github':
        return this.github.searchMCPServers(searchTerms, limit, maxAgeMonths);
      case 'npm':
        return this.npm.searchMCPServers(searchTerms, limit);
      case 'pypi':
        return this.pypi.searchMCPServers(searchTerms, limit);
      default:
        console.warn(`Source "${source}" not yet implemented`);
        return [];
    }
  }
  
  /**
   * Check if a tool is relevant to the given keywords
   */
  private isRelevant(tool: DiscoveredTool, keywords: string[]): boolean {
    const searchText = [
      tool.name,
      tool.description,
      tool.readme?.slice(0, 5000) || ''
    ].join(' ').toLowerCase();
    
    return keywords.some(keyword => searchText.includes(keyword));
  }
  
  /**
   * Analyze a specific GitHub repo
   */
  async analyzeGitHubRepo(owner: string, repo: string): Promise<DiscoveryResult | null> {
    console.log(`🔍 Fetching ${owner}/${repo}...`);
    
    const tool = await this.github.getRepo(owner, repo);
    if (!tool) {
      console.error('Repository not found');
      return null;
    }
    
    console.log(`🤖 Analyzing...`);
    const decision = await this.ai.analyzeAndDecide(tool);
    
    console.log(`\n✅ Analysis complete:`);
    console.log(`  Template: ${decision.template}`);
    console.log(`  Reasoning: ${decision.reasoning}`);
    
    const quickImport = this.ai.generateQuickImport(decision);
    if (quickImport) {
      console.log(`\n📋 Quick Import JSON:\n${quickImport}`);
    }
    
    return {
      tool,
      decision,
      generated: {
        pluginConfig: decision.config
      }
    };
  }
  
  /**
   * Analyze a specific npm package
   */
  async analyzeNpmPackage(name: string): Promise<DiscoveryResult | null> {
    console.log(`🔍 Fetching ${name}...`);
    
    const tool = await this.npm.getPackageAsTool(name);
    if (!tool) {
      console.error('Package not found');
      return null;
    }
    
    console.log(`🤖 Analyzing...`);
    const decision = await this.ai.analyzeAndDecide(tool);
    
    console.log(`\n✅ Analysis complete:`);
    console.log(`  Template: ${decision.template}`);
    console.log(`  Reasoning: ${decision.reasoning}`);
    
    const quickImport = this.ai.generateQuickImport(decision);
    if (quickImport) {
      console.log(`\n📋 Quick Import JSON:\n${quickImport}`);
    }
    
    return {
      tool,
      decision,
      generated: {
        pluginConfig: decision.config
      }
    };
  }

  /**
   * Analyze a specific PyPI package
   */
  async analyzePyPIPackage(name: string): Promise<DiscoveryResult | null> {
    console.log(`🔍 Fetching ${name} from PyPI...`);

    const tool = await this.pypi.getPackageAsTool(name);
    if (!tool) {
      console.error('Package not found on PyPI');
      return null;
    }

    console.log(`🤖 Analyzing...`);
    const decision = await this.ai.analyzeAndDecide(tool);

    console.log(`\n✅ Analysis complete:`);
    console.log(`  Template: ${decision.template}`);
    console.log(`  Reasoning: ${decision.reasoning}`);

    const quickImport = this.ai.generateQuickImport(decision);
    if (quickImport) {
      console.log(`\n📋 Quick Import JSON:\n${quickImport}`);
    }

    return {
      tool,
      decision,
      generated: {
        pluginConfig: decision.config
      }
    };
  }
}

// Export all types
export * from './types.js';
export { AIAnalyzer } from './ai.js';
export { GitHubSource } from './sources/github.js';
export { NpmSource } from './sources/npm.js';
export { PyPISource } from './sources/pypi.js';

// Export categories
export * from './categories.js';

// Export error classes
export * from './errors.js';

// Export schemas for validation
export * from './schemas.js';

// Export utilities
export { withRetry, fetchWithRetry, sleep, calculateBackoff } from './utils/retry.js';

