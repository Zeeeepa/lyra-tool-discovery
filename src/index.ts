import { GitHubSource } from './sources/github.js';
import { NpmSource } from './sources/npm.js';
import { AIAnalyzer, type AIConfig } from './ai.js';
import type { 
  DiscoveredTool, 
  DiscoveryResult, 
  DiscoverySource,
  CustomPlugin,
  PluginIndexEntry
} from './types.js';
import {
  getCategoryConfig,
  isRelevantToCategory,
  DEFAULT_CATEGORY,
} from './categories.js';

export interface DiscoveryOptions {
  sources?: DiscoverySource[];
  /** How many results to analyze/display (does NOT limit fetching) */
  limit?: number;
  dryRun?: boolean;
  outputDir?: string;
  maxAgeMonths?: number;
  /** Category to discover for (default: 'trading' — same as legacy crypto mode) */
  category?: string;
}

export class ToolDiscovery {
  private github: GitHubSource;
  private npm: NpmSource;
  private ai: AIAnalyzer;
  
  constructor(aiConfig?: AIConfig) {
    this.github = new GitHubSource();
    this.npm = new NpmSource();
    this.ai = new AIAnalyzer(aiConfig);
  }
  
  /**
   * Discover MCP tools from configured sources for the given category.
   *
   * Sources are queried **exhaustively** — every search term, every page.
   * `limit` only controls how many results get analyzed/displayed at the end.
   */
  async discover(options: DiscoveryOptions = {}): Promise<DiscoveryResult[]> {
    const {
      sources = ['github', 'npm'],
      limit = 20,
      dryRun = false,
      maxAgeMonths = 12,
      category = DEFAULT_CATEGORY,
    } = options;

    // Resolve category config (throws on unknown category)
    const categoryConfig = getCategoryConfig(category);
    
    console.log(`🔍 Discovering ${categoryConfig.displayName} tools from: ${sources.join(', ')}`);
    console.log(`📅 Max age: ${maxAgeMonths} months`);
    
    const tools: DiscoveredTool[] = [];
    
    // Collect from each source — exhaustively, NO limit passed.
    for (const source of sources) {
      try {
        const discovered = await this.discoverFromSource(
          source, maxAgeMonths, categoryConfig.searchTerms,
        );
        console.log(`  Found ${discovered.length} from ${source}`);
        tools.push(...discovered);
      } catch (error) {
        console.error(`  Error from ${source}:`, error);
      }
    }
    
    console.log(`\n📊 Total discovered: ${tools.length} tools`);
    
    if (tools.length === 0) {
      return [];
    }
    
    // Filter to only category-relevant tools
    const relevantTools = tools.filter(t =>
      isRelevantToCategory(t, categoryConfig.relevanceKeywords),
    );
    console.log(`🏷️  ${categoryConfig.displayName}-related: ${relevantTools.length} tools`);

    // Tag each tool with its category
    for (const tool of relevantTools) {
      tool.category = category;
    }
    
    // Filter to only tools with MCP support
    const mcpTools = relevantTools.filter(t => t.hasMCPSupport);
    console.log(`🔌 MCP-compatible: ${mcpTools.length} tools`);
    
    // Analyze each tool with AI — only the top `limit` results
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
  
  /**
   * Fetch tools from a single source — exhaustively. No limit.
   */
  private async discoverFromSource(
    source: DiscoverySource, 
    maxAgeMonths: number,
    searchTerms: string[],
  ): Promise<DiscoveredTool[]> {
    switch (source) {
      case 'github':
        return this.github.searchMCPServers(searchTerms, undefined, maxAgeMonths);
      case 'npm':
        return this.npm.searchMCPServers(searchTerms, undefined);
      default:
        console.warn(`Source "${source}" not yet implemented`);
        return [];
    }
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
}

// Export all types
export * from './types.js';
export { AIAnalyzer } from './ai.js';
export { GitHubSource } from './sources/github.js';
export { NpmSource } from './sources/npm.js';

// Export category system
export {
  getCategoryConfig,
  listCategories,
  isRelevantToCategory,
  isValidCategory,
  CATEGORIES,
  DEFAULT_CATEGORY,
} from './categories.js';
export type { CategoryConfig } from './categories.js';

// Export error classes
export * from './errors.js';

// Export schemas for validation
export * from './schemas.js';

// Export utilities
export { withRetry, fetchWithRetry, sleep, calculateBackoff } from './utils/retry.js';

