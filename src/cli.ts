#!/usr/bin/env node
import { Command } from 'commander';
import { ToolDiscovery, listCategories, isValidCategory } from './index.js';
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
  .description('Search for MCP tools across sources for a given category')
  .option('-s, --sources <sources>', 'Comma-separated sources: github,npm', 'github,npm')
  .option('-l, --limit <number>', 'Max tools to analyze/display (fetching is always exhaustive)', '20')
  .option('-a, --max-age <months>', 'Max age in months (default: 12)', '12')
  .option('-c, --category <category>', 'Category to discover (run "categories" to see all)', 'trading')
  .option('-d, --dry-run', 'List discovered tools without AI analysis')
  .option('-p, --provider <provider>', 'AI provider: openai or anthropic')
  .option('-m, --model <model>', 'AI model to use (e.g., gpt-4o, claude-sonnet-4-20250514)')
  .action(async (options) => {
    // Validate category
    if (!isValidCategory(options.category)) {
      console.error(`❌ Unknown category: "${options.category}"`);
      console.error(`Run "lyra-discover categories" to see available categories.`);
      process.exit(1);
    }

    const discovery = new ToolDiscovery({
      provider: options.provider as AIProvider,
      model: options.model
    });
    
    const sources = options.sources.split(',') as DiscoverySource[];
    const limit = parseInt(options.limit, 10);
    const maxAgeMonths = parseInt(options.maxAge, 10);
    
    const results = await discovery.discover({
      sources,
      limit,
      maxAgeMonths,
      category: options.category,
      dryRun: options.dryRun
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
    const cats = listCategories();
    console.log('\n🏷️  Available Discovery Categories\n');
    console.log(`${'ID'.padEnd(22)} ${'Display Name'.padEnd(30)} Description`);
    console.log('─'.repeat(90));
    for (const cat of cats) {
      console.log(
        `${cat.id.padEnd(22)} ${cat.displayName.padEnd(30)} ${cat.description}`,
      );
    }
    console.log(`\nTotal: ${cats.length} categories`);
    console.log('\nUsage:  lyra-discover discover --category <id>');
    console.log('Example: lyra-discover discover --category research --dry-run\n');
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
