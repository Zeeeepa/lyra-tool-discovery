/**
 * Category Registry for MCP Server Discovery
 *
 * Each category defines search terms used to query GitHub / npm / PyPI,
 * plus broader relevance keywords for post-search filtering.
 */

export interface Category {
  /** Machine-readable identifier */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Short description shown in CLI help */
  description: string;
  /** Terms injected into source search queries (concise, high-signal) */
  searchTerms: string[];
  /** Superset of searchTerms – used for relevance filtering after search */
  relevanceKeywords: string[];
}

// ────────────────────────────────────────────
// Built-in categories
// ────────────────────────────────────────────

const CODE_ANALYSIS: Category = {
  id: 'code-analysis',
  name: 'CodeAnalysis',
  description: 'AST parsing, code indexing, RAG for code',
  searchTerms: [
    'ast', 'code-analysis', 'code-indexing', 'tree-sitter',
    'code-search', 'code-graph', 'code-rag', 'lsp',
    'static-analysis', 'sourcegraph', 'scip',
  ],
  relevanceKeywords: [
    'ast', 'abstract syntax tree', 'tree-sitter', 'code-analysis',
    'code-indexing', 'code index', 'code search', 'code graph',
    'code rag', 'lsp', 'language server', 'static analysis',
    'sourcegraph', 'scip', 'semantic code', 'code intelligence',
    'code navigation', 'symbol', 'call graph', 'codebase',
  ],
};

const DATABASE: Category = {
  id: 'database',
  name: 'DataBase',
  description: 'Database clients, ORMs, migrations',
  searchTerms: [
    'database', 'postgres', 'mysql', 'sqlite', 'mongodb',
    'redis', 'orm', 'sql', 'prisma', 'drizzle',
    'supabase', 'neo4j', 'graphdb',
  ],
  relevanceKeywords: [
    'database', 'postgres', 'postgresql', 'mysql', 'sqlite',
    'mongodb', 'redis', 'orm', 'sql', 'prisma', 'drizzle',
    'supabase', 'neo4j', 'graph database', 'graphdb',
    'migration', 'schema', 'query', 'db', 'vector database',
    'vectordb', 'chromadb', 'pinecone', 'qdrant', 'weaviate',
    'duckdb', 'clickhouse', 'timescale',
  ],
};

const MCP: Category = {
  id: 'mcp',
  name: 'MCP',
  description: 'Model Context Protocol implementations',
  searchTerms: [
    'mcp', 'mcp-server', 'model-context-protocol',
    'modelcontextprotocol', 'mcp-client', 'mcp-tool',
  ],
  relevanceKeywords: [
    'mcp', 'mcp-server', 'mcp server', 'model context protocol',
    'modelcontextprotocol', 'mcp-client', 'mcp tool',
    '@modelcontextprotocol/sdk', 'mcp-proxy', 'mcp gateway',
  ],
};

const WEB2API: Category = {
  id: 'web2api',
  name: 'Web2Api',
  description: 'Browser automation, scraping, stealth',
  searchTerms: [
    'browser-automation', 'web-scraping', 'playwright',
    'puppeteer', 'crawlee', 'stealth', 'headless',
    'scraper', 'browser-use', 'web2api',
  ],
  relevanceKeywords: [
    'browser automation', 'web scraping', 'playwright', 'puppeteer',
    'crawlee', 'stealth', 'headless', 'scraper', 'browser-use',
    'web2api', 'crawl', 'spider', 'selenium', 'chromium',
    'anti-detect', 'fingerprint', 'browserforge', 'drissionpage',
    'botasaurus', 'patchright',
  ],
};

const CODE_MODIFY: Category = {
  id: 'code-modify',
  name: 'CodeModify',
  description: 'Reverse engineering, symbol manipulation',
  searchTerms: [
    'reverse-engineering', 'decompiler', 'disassembler',
    'binary-analysis', 'code-transform', 'refactor',
    'ts-morph', 'codemod', 'ida', 'ghidra',
  ],
  relevanceKeywords: [
    'reverse engineering', 'decompiler', 'disassembler',
    'binary analysis', 'code transform', 'refactor', 'refactoring',
    'ts-morph', 'codemod', 'ida pro', 'ghidra', 'radare2',
    'symbol', 'symbol manipulation', 'code modification',
    'patch', 'instrumentation', 'frida', 'angr',
  ],
};

const API: Category = {
  id: 'api',
  name: 'API',
  description: 'REST/GraphQL APIs, model inference',
  searchTerms: [
    'openai', 'anthropic', 'gemini', 'llm-api',
    'rest-api', 'graphql', 'api-gateway', 'inference',
    'openapi', 'swagger', 'fastapi', 'hono',
  ],
  relevanceKeywords: [
    'openai', 'anthropic', 'gemini', 'llm api', 'llm-api',
    'rest api', 'graphql', 'api gateway', 'inference',
    'openapi', 'swagger', 'fastapi', 'hono', 'express',
    'api proxy', 'model inference', 'embedding', 'completion',
    'chat api', 'function calling', 'tool calling',
  ],
};

const CONTROL_PLANE: Category = {
  id: 'control-plane',
  name: 'ControlPlane',
  description: 'Agent orchestrators, task managers',
  searchTerms: [
    'agent-orchestrator', 'multi-agent', 'task-manager',
    'workflow', 'swarm', 'orchestration', 'langgraph',
    'autogen', 'crewai', 'magentic-one',
  ],
  relevanceKeywords: [
    'agent orchestrator', 'multi-agent', 'task manager',
    'workflow', 'swarm', 'orchestration', 'langgraph',
    'autogen', 'crewai', 'magentic', 'agent framework',
    'agent loop', 'planning', 'task queue', 'dag',
    'pipeline', 'scheduler', 'coordinator',
  ],
};

const CC: Category = {
  id: 'cc',
  name: 'CC',
  description: 'Claude Code related tools',
  searchTerms: [
    'claude-code', 'claude-skill', 'claude-agent',
    'claude-hook', 'claude-command', 'openclaw',
    'clawdbot', 'moltbot', 'claude-mpm',
  ],
  relevanceKeywords: [
    'claude code', 'claude-code', 'claude skill', 'claude agent',
    'claude hook', 'claude command', 'openclaw', 'clawdbot',
    'moltbot', 'claude-mpm', 'claude subagent', 'claude session',
    'claude extension', 'claude plugin', 'superpowers',
    'context engineering', 'CLAUDE.md',
  ],
};

const TRADING: Category = {
  id: 'trading',
  name: 'Trading',
  description: 'Crypto, stocks, algorithmic trading',
  searchTerms: [
    'crypto', 'defi', 'blockchain', 'web3', 'ethereum',
    'solana', 'bitcoin', 'trading', 'stock', 'algorithmic',
    'dex', 'swap', 'wallet', 'token', 'nft',
  ],
  relevanceKeywords: [
    'crypto', 'cryptocurrency', 'defi', 'blockchain', 'web3',
    'ethereum', 'eth', 'solana', 'sol', 'bitcoin', 'btc',
    'wallet', 'token', 'nft', 'dex', 'swap', 'staking',
    'yield', 'bridge', 'chain', 'smart contract', 'erc20',
    'trading', 'stock', 'algorithmic trading', 'hedge fund',
    'quant', 'backtest', 'market data', 'ticker',
    'uniswap', 'aave', 'hyperliquid',
  ],
};

const RESEARCH: Category = {
  id: 'research',
  name: 'Research',
  description: 'Research assistants, deep research',
  searchTerms: [
    'deep-research', 'research-agent', 'arxiv',
    'paper', 'scholar', 'literature', 'citation',
    'semantic-search', 'knowledge-graph', 'rag',
  ],
  relevanceKeywords: [
    'deep research', 'research agent', 'arxiv', 'paper',
    'scholar', 'literature', 'citation', 'semantic search',
    'knowledge graph', 'rag', 'retrieval augmented',
    'information retrieval', 'search engine', 'web research',
    'fact checking', 'summarization', 'survey',
  ],
};

const CODING_AGENTS: Category = {
  id: 'coding-agents',
  name: 'CodingA',
  description: 'Coding agents like MassGen, taskbrew',
  searchTerms: [
    'coding-agent', 'code-agent', 'swe-agent',
    'aider', 'codex', 'copilot', 'opencode',
    'massgen', 'auto-coder', 'devin',
  ],
  relevanceKeywords: [
    'coding agent', 'code agent', 'swe-agent', 'swe bench',
    'aider', 'codex', 'copilot', 'opencode', 'massgen',
    'auto coder', 'devin', 'cursor', 'windsurf', 'bolt',
    'lovable', 'v0', 'code generation', 'autonomous coding',
    'pair programming', 'code review agent',
  ],
};

const KB: Category = {
  id: 'kb',
  name: 'KB',
  description: 'Knowledge base systems',
  searchTerms: [
    'knowledge-base', 'wiki', 'documentation',
    'notion', 'obsidian', 'confluence', 'memory',
    'memvid', 'graphrag', 'lightrag',
  ],
  relevanceKeywords: [
    'knowledge base', 'wiki', 'documentation', 'notion',
    'obsidian', 'confluence', 'memory', 'memvid',
    'graphrag', 'lightrag', 'second brain', 'pkm',
    'personal knowledge', 'embeddings', 'vector store',
    'document store', 'knowledge management',
  ],
};

const AUTOMATION: Category = {
  id: 'automation',
  name: 'Automation',
  description: 'Task automation like flowtask',
  searchTerms: [
    'automation', 'n8n', 'zapier', 'workflow-automation',
    'rpa', 'task-automation', 'cron', 'scheduler',
    'make', 'pipedream',
  ],
  relevanceKeywords: [
    'automation', 'n8n', 'zapier', 'workflow automation',
    'rpa', 'task automation', 'cron', 'scheduler',
    'make', 'pipedream', 'ifttt', 'trigger', 'webhook',
    'no-code', 'low-code', 'integrations',
  ],
};

const TESTING: Category = {
  id: 'testing',
  name: 'Testing',
  description: 'Test frameworks, pytest plugins',
  searchTerms: [
    'testing', 'test-framework', 'pytest', 'vitest',
    'jest', 'playwright-test', 'cypress', 'e2e',
    'unit-test', 'test-runner',
  ],
  relevanceKeywords: [
    'testing', 'test framework', 'pytest', 'vitest', 'jest',
    'playwright test', 'cypress', 'e2e', 'unit test',
    'test runner', 'test automation', 'qa', 'quality assurance',
    'integration test', 'snapshot', 'coverage', 'mock',
    'fixture', 'assertion',
  ],
};

const OBSERVABILITY: Category = {
  id: 'observability',
  name: 'Observability',
  description: 'Logging, tracing, metrics, APM',
  searchTerms: [
    'observability', 'logging', 'tracing', 'metrics',
    'opentelemetry', 'prometheus', 'grafana', 'apm',
    'monitoring', 'alerting',
  ],
  relevanceKeywords: [
    'observability', 'logging', 'tracing', 'metrics',
    'opentelemetry', 'otel', 'prometheus', 'grafana', 'apm',
    'monitoring', 'alerting', 'datadog', 'sentry',
    'newrelic', 'jaeger', 'zipkin', 'elk', 'kibana',
    'log aggregation', 'dashboard',
  ],
};

const PENTEST: Category = {
  id: 'pentest',
  name: 'Pentest',
  description: 'Penetration testing, vulnerability scanning',
  searchTerms: [
    'pentest', 'vulnerability', 'security-scanner',
    'exploit', 'osint', 'recon', 'burp', 'nuclei',
    'nmap', 'red-team',
  ],
  relevanceKeywords: [
    'pentest', 'penetration testing', 'vulnerability', 'security scanner',
    'exploit', 'osint', 'recon', 'burp', 'nuclei', 'nmap',
    'red team', 'ctf', 'bug bounty', 'fuzzing', 'xss',
    'sqli', 'cve', 'malware', 'reverse shell', 'payload',
    'offensive security', 'hack', 'infosec',
  ],
};

const FRONTEND: Category = {
  id: 'frontend',
  name: 'Frontend',
  description: 'UI libraries, dashboards',
  searchTerms: [
    'ui-library', 'dashboard', 'react', 'vue', 'svelte',
    'nextjs', 'tailwind', 'shadcn', 'component',
    'design-system',
  ],
  relevanceKeywords: [
    'ui library', 'dashboard', 'react', 'vue', 'svelte',
    'nextjs', 'next.js', 'tailwind', 'shadcn', 'component',
    'design system', 'chart', 'visualization', 'frontend',
    'css', 'styling', 'layout', 'responsive', 'widget',
  ],
};

const GAMEDEV: Category = {
  id: 'gamedev',
  name: 'GameDev',
  description: 'Game development',
  searchTerms: [
    'game-engine', 'game-dev', 'unity', 'godot', 'bevy',
    'unreal', 'phaser', 'pixel', 'sprite', 'rpg',
  ],
  relevanceKeywords: [
    'game engine', 'game dev', 'game development', 'unity',
    'godot', 'bevy', 'unreal', 'phaser', 'pixel', 'sprite',
    'rpg', 'roguelike', '2d', '3d', 'physics', 'shader',
    'tilemap', 'mindustry', 'voxel', 'ecs',
  ],
};

const ETL: Category = {
  id: 'etl',
  name: 'ETL',
  description: 'Data processing, pipelines, streaming',
  searchTerms: [
    'etl', 'data-pipeline', 'streaming', 'kafka',
    'spark', 'airflow', 'dbt', 'data-processing',
    'parquet', 'arrow',
  ],
  relevanceKeywords: [
    'etl', 'data pipeline', 'streaming', 'kafka', 'spark',
    'airflow', 'dbt', 'data processing', 'parquet', 'arrow',
    'batch', 'ingestion', 'transform', 'load', 'data lake',
    'iceberg', 'delta lake', 'flink', 'beam', 'pathway',
    'data warehouse', 'data engineering',
  ],
};

// ────────────────────────────────────────────
// Registry
// ────────────────────────────────────────────

export const CATEGORIES: ReadonlyArray<Category> = [
  CODE_ANALYSIS,
  DATABASE,
  MCP,
  WEB2API,
  CODE_MODIFY,
  API,
  CONTROL_PLANE,
  CC,
  TRADING,
  RESEARCH,
  CODING_AGENTS,
  KB,
  AUTOMATION,
  TESTING,
  OBSERVABILITY,
  PENTEST,
  FRONTEND,
  GAMEDEV,
  ETL,
];

/** Lookup a category by its id (case-insensitive) */
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(c => c.id.toLowerCase() === id.toLowerCase());
}

/** Resolve one or many category ids into their Category objects */
export function resolveCategories(ids: string | string[]): Category[] {
  const idList = Array.isArray(ids) ? ids : ids.split(',').map(s => s.trim());
  const resolved: Category[] = [];
  for (const id of idList) {
    const cat = getCategoryById(id);
    if (cat) {
      resolved.push(cat);
    } else {
      console.warn(`⚠️  Unknown category: "${id}". Use 'categories' command to list available ones.`);
    }
  }
  return resolved;
}

/** Merge search terms from multiple categories (deduplicated) */
export function mergeSearchTerms(categories: Category[]): string[] {
  const set = new Set<string>();
  for (const cat of categories) {
    for (const term of cat.searchTerms) {
      set.add(term);
    }
  }
  return [...set];
}

/** Merge relevance keywords from multiple categories (deduplicated, lowercased) */
export function mergeRelevanceKeywords(categories: Category[]): string[] {
  const set = new Set<string>();
  for (const cat of categories) {
    for (const kw of cat.relevanceKeywords) {
      set.add(kw.toLowerCase());
    }
  }
  return [...set];
}

/** Get a compact set of general MCP-related search terms (used when category = 'all') */
export function getGeneralSearchTerms(): string[] {
  return [
    'mcp-server', 'mcp', 'model-context-protocol',
    'modelcontextprotocol', 'mcp-tool',
  ];
}

/** List all category ids */
export function getCategoryIds(): string[] {
  return CATEGORIES.map(c => c.id);
}

