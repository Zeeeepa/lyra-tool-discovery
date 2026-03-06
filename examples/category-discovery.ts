/**
 * Multi-Category Discovery Example
 *
 * Demonstrates how to discover MCP servers across different categories:
 * research, database, orchestration, security, and more.
 *
 * Run with: npx tsx examples/category-discovery.ts
 *
 * Prerequisites:
 * - OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable (for full analysis)
 */

import { ToolDiscovery, listCategories, getCategoryConfig } from '../src/index.js';

async function main() {
  console.log('🔮 Lyra Tool Discovery - Multi-Category Discovery\n');

  // ===========================================
  // List All Available Categories
  // ===========================================
  console.log('═'.repeat(60));
  console.log('🏷️  Available Categories');
  console.log('═'.repeat(60));

  const allCategories = listCategories();
  for (const cat of allCategories) {
    console.log(`  ${cat.id.padEnd(22)} ${cat.displayName}`);
  }
  console.log(`\nTotal: ${allCategories.length} categories\n`);

  // ===========================================
  // Discover Research MCP Servers
  // ===========================================
  console.log('═'.repeat(60));
  console.log('🔬 Discovering: Research');
  console.log('═'.repeat(60));

  const discovery = new ToolDiscovery();

  const researchResults = await discovery.discover({
    sources: ['github', 'npm'],
    limit: 3,
    category: 'research',
    dryRun: true, // Set to false if you have an API key
  });

  // ===========================================
  // Discover Database MCP Servers
  // ===========================================
  console.log('\n' + '═'.repeat(60));
  console.log('🗄️  Discovering: Database');
  console.log('═'.repeat(60));

  const dbResults = await discovery.discover({
    sources: ['github', 'npm'],
    limit: 3,
    category: 'database',
    dryRun: true,
  });

  // ===========================================
  // Discover Security MCP Servers
  // ===========================================
  console.log('\n' + '═'.repeat(60));
  console.log('🔒 Discovering: Security / Pentest');
  console.log('═'.repeat(60));

  const secResults = await discovery.discover({
    sources: ['github'],
    limit: 3,
    category: 'security',
    dryRun: true,
  });

  // ===========================================
  // Category Config Details
  // ===========================================
  console.log('\n' + '═'.repeat(60));
  console.log('📋 Category Config Example: "orchestration"');
  console.log('═'.repeat(60));

  const orchConfig = getCategoryConfig('orchestration');
  console.log(`  ID:           ${orchConfig.id}`);
  console.log(`  Display:      ${orchConfig.displayName}`);
  console.log(`  Description:  ${orchConfig.description}`);
  console.log(`  Search Terms: ${orchConfig.searchTerms.slice(0, 5).join(', ')}...`);
  console.log(`  Keywords:     ${orchConfig.relevanceKeywords.slice(0, 8).join(', ')}...`);

  // ===========================================
  // Still works with default (trading / crypto)
  // ===========================================
  console.log('\n' + '═'.repeat(60));
  console.log('💰 Default Category: Trading / Crypto (backward compatible)');
  console.log('═'.repeat(60));

  const tradingResults = await discovery.discover({
    sources: ['github'],
    limit: 3,
    dryRun: true,
    // No category specified → defaults to 'trading'
  });

  console.log('\n✅ Multi-category discovery example complete!');
}

main().catch(console.error);

