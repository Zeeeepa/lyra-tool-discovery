#!/usr/bin/env node
import { Command } from 'commander';
import { ToolDiscovery } from './index.js';
import { CATEGORIES } from './categories.js';
import type { DiscoverySource } from './types.js';
import type { AIProvider } from './ai.js';
import { getAvailableProviders } from './ai.js';

const program = new Command();

program
  .name('lyra-discover')
  .description('Discover MCP tools and APIs across categories, generate SperaxOS plugin configs')
  .version('0.2.0');

program
  .command('discover')
  .description('Search for MCP tools across GitHub, npm, and PyPI — filterable by category')
  .option('-s, --sources <sources>', 'Comma-separated sources: github,npm,pypi', 'github,npm,pypi')
  .option('-c, --category <category>', 'Category filter (comma-separated). Use "categories" command to list. Default: all', 'all')
  .option('-k, --keywords <keywords>', 'Custom search keywords (comma-separated) — overrides --category')
  .option('-l, --limit <number>', 'Max tools to discover', '5')
  .option('-a, --max-age <months>', 'Max age in months (default: 12)', '12')
  .option('-d, --dry-run', 'List discovered tools without AI analysis')
  .option('--skip-filter', 'Skip post-search relevance filtering')
  .option('-p, --provider <provider>', 'AI provider: openai or anthropic')
  .option('-m, --model <model>', 'AI model to use (e.g., gpt-4o, claude-sonnet-4-20250514)')
  .action(async (options) => {
    const discovery = new ToolDiscovery({
      provider: options.provider as AIProvider,
      model: options.model
    });
    
    const sources = options.sources.split(',') as DiscoverySource[];
    const limit = parseInt(options.limit, 10);
    const maxAgeMonths = parseInt(options.maxAge, 10);
    const keywords = options.keywords
      ? options.keywords.split(',').map((k: string) => k.trim())
      : undefined;
    
    const results = await discovery.discover({
      sources,
      category: options.category,
      keywords,
      limit,
      maxAgeMonths,
      dryRun: options.dryRun,
      skipFilter: options.skipFilter,
    });
    
    if (results.length > 0) {
      console.log(`\n✅ Analyzed ${results.length} tools`);
      
      // Output summary
      console.log('\n📦 Generated Configs:\n');
      for (const result of results) {
        console.log(`--- ${result.tool.name} ---`);
        console.log(`Template: ${result.decision.template}`);
        console.log(`Config: ${JSON.stringify(result.generated.pluginConfig, null, 2)}`);
        console.log('');
      }
    }
  });

program
  .command('categories')
  .description('List all available discovery categories')
  .action(() => {
    console.log('\n🗂️  Available Discovery Categories\n');
    console.log('┌──────────────────┬─────────────────────────────────────────────────┐');
    console.log('│ ID               │ Description                                     │');
    console.log('├──────────────────┼─────────────────────────────────────────────────┤');
    for (const cat of CATEGORIES) {
      const id = cat.id.padEnd(16);
      const desc = cat.description.padEnd(47);
      console.log(`│ ${id} │ ${desc} │`);
    }
    console.log('└──────────────────┴─────────────────────────────────────────────────┘');
    console.log(`\nUsage:  lyra-discover discover --category <id>`);
    console.log(`        lyra-discover discover --category research`);
    console.log(`        lyra-discover discover --category database,etl`);
    console.log(`        lyra-discover discover --keywords "rag,retrieval,semantic"`);
    console.log('');
  });

program
  .command('analyze-repo <owner> <repo>')
  .description('Analyze a specific GitHub repository')
  .option('-p, --provider <provider>', 'AI provider: openai or anthropic')
  .option('-m, --model <model>', 'AI model to use')
  .action(async (owner: string, repo: string, options) => {
    const discovery = new ToolDiscovery({
      provider: options.provider as AIProvider,
      model: options.model
    });
    await discovery.analyzeGitHubRepo(owner, repo);
  });

program
  .command('analyze-npm <package>')
  .description('Analyze a specific npm package')
  .option('-p, --provider <provider>', 'AI provider: openai or anthropic')
  .option('-m, --model <model>', 'AI model to use')
  .action(async (packageName: string, options) => {
    const discovery = new ToolDiscovery({
      provider: options.provider as AIProvider,
      model: options.model
    });
    await discovery.analyzeNpmPackage(packageName);
  });

program
  .command('analyze-pypi <package>')
  .description('Analyze a specific PyPI (Python) package')
  .option('-p, --provider <provider>', 'AI provider: openai or anthropic')
  .option('-m, --model <model>', 'AI model to use')
  .action(async (packageName: string, options) => {
    const discovery = new ToolDiscovery({
      provider: options.provider as AIProvider,
      model: options.model
    });
    await discovery.analyzePyPIPackage(packageName);
  });

program
  .command('providers')
  .description('Show available AI providers')
  .action(() => {
    const available = getAvailableProviders();
    console.log('\n🤖 AI Provider Configuration\n');
    console.log('Available providers (based on env vars):');
    if (available.length === 0) {
      console.log('  ⚠️  No API keys found!\n');
      console.log('Set one of these environment variables:');
      console.log('  - OPENAI_API_KEY     → Use OpenAI (gpt-4o, gpt-4-turbo, etc.)');
      console.log('  - ANTHROPIC_API_KEY  → Use Anthropic (claude-sonnet-4-20250514, etc.)\n');
    } else {
      for (const p of available) {
        console.log(`  ✅ ${p}`);
      }
      console.log('');
    }
    console.log('Override with env vars or CLI flags:');
    console.log('  AI_PROVIDER=openai|anthropic');
    console.log('  AI_MODEL=gpt-4o|claude-sonnet-4-20250514|etc.');
    console.log('  --provider openai --model gpt-4o');
    console.log('');
  });

program
  .command('templates')
  .description('List available plugin templates')
  .action(() => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                     plugin.delivery Plugin Templates                          ║
╠════════════╦════════════╦═══════════════════════════════╦════════════════════╣
║ Template   ║ Type       ║ Description                   ║ Use Case           ║
╠════════════╬════════════╬═══════════════════════════════╬════════════════════╣
║ basic      ║ Default    ║ Standard plugin with API      ║ Simple data lookups║
║ default    ║ Default    ║ Plugin with settings UI       ║ Configurable tools ║
║ markdown   ║ Markdown   ║ Rich text output              ║ Formatted reports  ║
║ openapi    ║ OpenAPI    ║ Auto-generated from spec      ║ Existing APIs      ║
║ settings   ║ Default    ║ Plugin with user preferences  ║ Personalized tools ║
║ standalone ║ Standalone ║ Full React application        ║ Interactive UIs    ║
╠════════════╬════════════╬═══════════════════════════════╬════════════════════╣
║ mcp-http   ║ MCP        ║ Streamable HTTP MCP server    ║ Remote MCP tools   ║
║ mcp-stdio  ║ MCP        ║ STDIO-based MCP server        ║ Local npm MCP      ║
╚════════════╩════════════╩═══════════════════════════════╩════════════════════╝

MCP Templates:
  - mcp-http:  For remote MCP servers accessible via HTTP URL
  - mcp-stdio: For npm packages that run locally via npx

Standard Templates:
  - basic:      Simple API endpoint, no UI
  - default:    Has settings/configuration UI
  - markdown:   Outputs rich formatted text
  - openapi:    Generated from OpenAPI/Swagger spec
  - settings:   Stores user preferences
  - standalone: Full React app for complex UIs
`);
  });

program.parse();

