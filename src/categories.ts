/**
 * Category definitions for multi-category MCP server discovery.
 *
 * Each category has:
 *  - searchTerms: used in GitHub/npm/PyPI API queries
 *  - relevanceKeywords: used in post-fetch relevance filtering
 */

import type { DiscoveredTool } from './types.js';

// ============================================
// Category Configuration
// ============================================

export interface CategoryConfig {
  /** Machine-readable identifier (kebab-case) */
  id: string;
  /** Human-readable display name */
  displayName: string;
  /** Short description shown in CLI listings */
  description: string;
  /** Terms used as API search queries (8-15 per category) */
  searchTerms: string[];
  /** Keywords matched against tool name/description/readme for relevance filtering */
  relevanceKeywords: string[];
}

// ============================================
// Default Category
// ============================================

/** Backward-compatible default – same behaviour as the original crypto-only mode */
export const DEFAULT_CATEGORY = 'trading';

// ============================================
// Category Registry
// ============================================

export const CATEGORIES: Record<string, CategoryConfig> = {
  // ------------------------------------------------------------------
  // 1. Trading / Crypto / DeFi / Web3
  // ------------------------------------------------------------------
  trading: {
    id: 'trading',
    displayName: 'Trading / Crypto / DeFi',
    description: 'Crypto, DeFi, blockchain, and Web3 MCP servers',
    searchTerms: [
      'crypto mcp', 'defi mcp server', 'blockchain mcp', 'web3 mcp',
      'ethereum mcp', 'solana mcp', 'bitcoin mcp', 'wallet mcp',
      'token mcp', 'nft mcp server', 'dex mcp', 'swap mcp',
      'staking mcp', 'trading mcp server',
    ],
    relevanceKeywords: [
      'crypto', 'cryptocurrency', 'defi', 'blockchain', 'web3',
      'ethereum', 'eth', 'solana', 'sol', 'bitcoin', 'btc',
      'wallet', 'token', 'nft', 'dex', 'swap', 'staking',
      'yield', 'bridge', 'chain', 'smart contract', 'erc20',
      'erc721', 'uniswap', 'aave', 'compound', 'lending',
      'liquidity', 'vault', 'protocol', 'onchain', 'on-chain',
      'web3.js', 'ethers', 'viem', 'wagmi', 'rainbowkit',
      'trading', 'exchange', 'binance', 'coinbase',
    ],
  },

  // ------------------------------------------------------------------
  // 2. Research
  // ------------------------------------------------------------------
  research: {
    id: 'research',
    displayName: 'Research',
    description: 'Research, deep-research, academic, and knowledge discovery MCP servers',
    searchTerms: [
      'research mcp server', 'deep research mcp', 'academic mcp',
      'arxiv mcp', 'scholar mcp', 'literature mcp', 'paper mcp',
      'knowledge graph mcp', 'semantic search mcp', 'citation mcp',
      'science mcp server', 'data analysis mcp',
    ],
    relevanceKeywords: [
      'research', 'deep research', 'academic', 'paper', 'literature',
      'citation', 'scholar', 'arxiv', 'semantic', 'knowledge graph',
      'pubmed', 'science', 'analysis', 'survey', 'review',
      'bibliography', 'journal', 'conference', 'preprint',
      'information retrieval', 'search engine', 'discovery',
      'summarize', 'summarization', 'rag', 'retrieval',
    ],
  },

  // ------------------------------------------------------------------
  // 3. Code Analysis
  // ------------------------------------------------------------------
  'code-analysis': {
    id: 'code-analysis',
    displayName: 'Code Analysis',
    description: 'Static analysis, linting, AST, and code-quality MCP servers',
    searchTerms: [
      'code analysis mcp', 'linter mcp server', 'static analysis mcp',
      'ast mcp', 'code quality mcp', 'code review mcp',
      'semgrep mcp', 'eslint mcp', 'sonarqube mcp',
      'code metrics mcp', 'complexity mcp server',
    ],
    relevanceKeywords: [
      'code analysis', 'static analysis', 'lint', 'linter', 'ast',
      'syntax tree', 'code quality', 'code review', 'semgrep',
      'eslint', 'sonarqube', 'sonar', 'complexity', 'code smell',
      'refactor', 'code metrics', 'cyclomatic', 'dead code',
      'type check', 'typecheck', 'code scan', 'sast',
      'code search', 'codemod', 'tree-sitter',
    ],
  },

  // ------------------------------------------------------------------
  // 4. Database
  // ------------------------------------------------------------------
  database: {
    id: 'database',
    displayName: 'Database',
    description: 'SQL, NoSQL, vector DB, and data-store MCP servers',
    searchTerms: [
      'database mcp server', 'sql mcp', 'postgres mcp',
      'mongodb mcp', 'redis mcp', 'mysql mcp',
      'sqlite mcp server', 'vector database mcp',
      'supabase mcp', 'prisma mcp', 'drizzle mcp',
    ],
    relevanceKeywords: [
      'database', 'sql', 'postgres', 'postgresql', 'mysql',
      'mongodb', 'redis', 'sqlite', 'mariadb', 'dynamodb',
      'cassandra', 'neo4j', 'graph database', 'vector database',
      'pinecone', 'weaviate', 'qdrant', 'milvus', 'chroma',
      'supabase', 'prisma', 'drizzle', 'orm', 'query',
      'migration', 'schema', 'nosql', 'datastore', 'db',
    ],
  },

  // ------------------------------------------------------------------
  // 5. Orchestration
  // ------------------------------------------------------------------
  orchestration: {
    id: 'orchestration',
    displayName: 'Orchestration',
    description: 'Multi-agent orchestration, workflow, and coordination MCP servers',
    searchTerms: [
      'orchestration mcp', 'multi-agent mcp', 'workflow mcp server',
      'agent mcp', 'coordinator mcp', 'pipeline mcp',
      'task queue mcp', 'scheduler mcp', 'swarm mcp',
      'langgraph mcp', 'crew ai mcp',
    ],
    relevanceKeywords: [
      'orchestration', 'orchestrate', 'multi-agent', 'workflow',
      'agent', 'coordinator', 'pipeline', 'task queue', 'scheduler',
      'swarm', 'langgraph', 'crew', 'autogen', 'chain',
      'dag', 'directed acyclic', 'step', 'parallel',
      'sequential', 'fan-out', 'fan-in', 'routing',
      'dispatch', 'delegation', 'supervisor',
    ],
  },

  // ------------------------------------------------------------------
  // 6. API / Web2API
  // ------------------------------------------------------------------
  api: {
    id: 'api',
    displayName: 'API / Web2API',
    description: 'REST, GraphQL, OpenAPI, and web-to-API bridge MCP servers',
    searchTerms: [
      'api mcp server', 'rest api mcp', 'graphql mcp',
      'openapi mcp', 'swagger mcp', 'web2api mcp',
      'api gateway mcp', 'webhook mcp', 'http mcp server',
      'api integration mcp',
    ],
    relevanceKeywords: [
      'api', 'rest', 'graphql', 'openapi', 'swagger',
      'web2api', 'gateway', 'webhook', 'http', 'endpoint',
      'integration', 'connector', 'proxy', 'middleware',
      'request', 'response', 'fetch', 'axios', 'curl',
      'postman', 'insomnia', 'api key', 'oauth',
    ],
  },

  // ------------------------------------------------------------------
  // 7. Knowledge Base / RAG
  // ------------------------------------------------------------------
  'knowledge-base': {
    id: 'knowledge-base',
    displayName: 'Knowledge Base / RAG',
    description: 'RAG, embeddings, document store, and knowledge-base MCP servers',
    searchTerms: [
      'rag mcp server', 'knowledge base mcp', 'embedding mcp',
      'document store mcp', 'vector search mcp', 'retrieval mcp',
      'langchain mcp', 'llamaindex mcp', 'context mcp server',
      'memory mcp server',
    ],
    relevanceKeywords: [
      'rag', 'retrieval augmented', 'knowledge base', 'embedding',
      'vector search', 'document', 'retrieval', 'langchain',
      'llamaindex', 'context', 'memory', 'chunk', 'index',
      'semantic search', 'similarity', 'cosine', 'faiss',
      'annoy', 'knowledge graph', 'ontology', 'taxonomy',
    ],
  },

  // ------------------------------------------------------------------
  // 8. Automation
  // ------------------------------------------------------------------
  automation: {
    id: 'automation',
    displayName: 'Automation',
    description: 'Workflow automation, RPA, and task-automation MCP servers',
    searchTerms: [
      'automation mcp server', 'workflow automation mcp',
      'rpa mcp', 'browser automation mcp', 'playwright mcp',
      'puppeteer mcp', 'zapier mcp', 'n8n mcp',
      'make mcp server', 'cron mcp', 'schedule mcp',
    ],
    relevanceKeywords: [
      'automation', 'automate', 'rpa', 'browser automation',
      'playwright', 'puppeteer', 'selenium', 'zapier', 'n8n',
      'make', 'ifttt', 'cron', 'schedule', 'trigger',
      'action', 'bot', 'scrape', 'crawl', 'task runner',
      'workflow', 'no-code', 'low-code',
    ],
  },

  // ------------------------------------------------------------------
  // 9. Testing
  // ------------------------------------------------------------------
  testing: {
    id: 'testing',
    displayName: 'Testing',
    description: 'Unit test, integration test, and QA MCP servers',
    searchTerms: [
      'testing mcp server', 'test automation mcp', 'qa mcp',
      'unit test mcp', 'e2e test mcp', 'vitest mcp',
      'jest mcp', 'cypress mcp', 'playwright test mcp',
      'test runner mcp',
    ],
    relevanceKeywords: [
      'testing', 'test', 'unit test', 'integration test', 'e2e',
      'end-to-end', 'qa', 'quality assurance', 'vitest', 'jest',
      'mocha', 'cypress', 'playwright', 'selenium', 'assertion',
      'mock', 'stub', 'fixture', 'snapshot', 'coverage',
      'test runner', 'test suite', 'benchmark', 'regression',
    ],
  },

  // ------------------------------------------------------------------
  // 10. Observability / Monitoring
  // ------------------------------------------------------------------
  observability: {
    id: 'observability',
    displayName: 'Observability',
    description: 'Logging, metrics, tracing, and monitoring MCP servers',
    searchTerms: [
      'observability mcp server', 'monitoring mcp', 'logging mcp',
      'metrics mcp', 'tracing mcp', 'opentelemetry mcp',
      'prometheus mcp', 'grafana mcp', 'datadog mcp',
      'sentry mcp server',
    ],
    relevanceKeywords: [
      'observability', 'monitoring', 'logging', 'log', 'metrics',
      'tracing', 'trace', 'opentelemetry', 'otel', 'prometheus',
      'grafana', 'datadog', 'sentry', 'newrelic', 'apm',
      'alerting', 'alert', 'dashboard', 'health check',
      'uptime', 'latency', 'span', 'telemetry',
    ],
  },

  // ------------------------------------------------------------------
  // 11. Security / Pentest
  // ------------------------------------------------------------------
  security: {
    id: 'security',
    displayName: 'Security / Pentest',
    description: 'Security scanning, pentesting, and vulnerability MCP servers',
    searchTerms: [
      'security mcp server', 'pentest mcp', 'vulnerability mcp',
      'scanner mcp', 'sast mcp', 'dast mcp',
      'trivy mcp', 'nuclei mcp', 'burp mcp',
      'osint mcp server', 'threat mcp',
    ],
    relevanceKeywords: [
      'security', 'pentest', 'penetration test', 'vulnerability',
      'scanner', 'sast', 'dast', 'trivy', 'nuclei', 'nmap',
      'burp', 'osint', 'threat', 'exploit', 'cve', 'audit',
      'compliance', 'hardening', 'firewall', 'waf', 'xss',
      'sqli', 'injection', 'authentication', 'authorization',
    ],
  },

  // ------------------------------------------------------------------
  // 12. Frontend / UI
  // ------------------------------------------------------------------
  frontend: {
    id: 'frontend',
    displayName: 'Frontend / UI',
    description: 'React, Vue, Svelte, CSS, and UI component MCP servers',
    searchTerms: [
      'frontend mcp server', 'react mcp', 'vue mcp',
      'svelte mcp', 'css mcp', 'ui component mcp',
      'tailwind mcp', 'design system mcp', 'figma mcp',
      'storybook mcp server',
    ],
    relevanceKeywords: [
      'frontend', 'react', 'vue', 'svelte', 'angular', 'nextjs',
      'nuxt', 'css', 'tailwind', 'ui component', 'design system',
      'figma', 'storybook', 'component', 'layout', 'responsive',
      'animation', 'theme', 'style', 'html', 'jsx', 'tsx',
      'shadcn', 'radix', 'material ui', 'chakra',
    ],
  },

  // ------------------------------------------------------------------
  // 13. DevOps / Infrastructure
  // ------------------------------------------------------------------
  devops: {
    id: 'devops',
    displayName: 'DevOps / Infrastructure',
    description: 'CI/CD, Docker, Kubernetes, and cloud infra MCP servers',
    searchTerms: [
      'devops mcp server', 'docker mcp', 'kubernetes mcp',
      'ci cd mcp', 'terraform mcp', 'ansible mcp',
      'github actions mcp', 'aws mcp server', 'cloud mcp',
      'infrastructure mcp',
    ],
    relevanceKeywords: [
      'devops', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'ci',
      'cd', 'terraform', 'ansible', 'pulumi', 'helm',
      'github actions', 'gitlab ci', 'jenkins', 'aws', 'gcp',
      'azure', 'cloud', 'infrastructure', 'deploy', 'deployment',
      'container', 'pod', 'cluster', 'serverless', 'lambda',
    ],
  },

  // ------------------------------------------------------------------
  // 14. Coding Assistant
  // ------------------------------------------------------------------
  'coding-assistant': {
    id: 'coding-assistant',
    displayName: 'Coding Assistant',
    description: 'AI coding, code generation, and pair-programming MCP servers',
    searchTerms: [
      'coding assistant mcp', 'code generation mcp', 'copilot mcp',
      'ai code mcp', 'code completion mcp', 'pair programming mcp',
      'ide mcp server', 'editor mcp', 'vscode mcp',
      'cursor mcp server',
    ],
    relevanceKeywords: [
      'coding assistant', 'code generation', 'copilot', 'ai code',
      'code completion', 'pair programming', 'ide', 'editor',
      'vscode', 'cursor', 'windsurf', 'cline', 'aider',
      'autocomplete', 'snippet', 'boilerplate', 'scaffold',
      'refactor', 'suggestion', 'intellisense', 'language server',
    ],
  },

  // ------------------------------------------------------------------
  // 15. Content Creation
  // ------------------------------------------------------------------
  'content-creation': {
    id: 'content-creation',
    displayName: 'Content Creation',
    description: 'Writing, image gen, video, and multimedia MCP servers',
    searchTerms: [
      'content creation mcp', 'writing mcp server', 'image generation mcp',
      'video mcp', 'markdown mcp', 'blog mcp',
      'social media mcp', 'copywriting mcp', 'dalle mcp',
      'stable diffusion mcp',
    ],
    relevanceKeywords: [
      'content creation', 'writing', 'image generation', 'video',
      'markdown', 'blog', 'social media', 'copywriting',
      'dalle', 'stable diffusion', 'midjourney', 'image',
      'audio', 'podcast', 'text-to-speech', 'tts',
      'speech-to-text', 'stt', 'transcription', 'translation',
    ],
  },

  // ------------------------------------------------------------------
  // 16. Data / ETL
  // ------------------------------------------------------------------
  etl: {
    id: 'etl',
    displayName: 'Data / ETL',
    description: 'Data pipeline, ETL, transformation, and ingestion MCP servers',
    searchTerms: [
      'etl mcp server', 'data pipeline mcp', 'data transformation mcp',
      'data ingestion mcp', 'csv mcp', 'parquet mcp',
      'dbt mcp', 'airflow mcp', 'spark mcp',
      'data processing mcp',
    ],
    relevanceKeywords: [
      'etl', 'data pipeline', 'data transformation', 'ingestion',
      'csv', 'parquet', 'json', 'dbt', 'airflow', 'spark',
      'pandas', 'polars', 'data processing', 'batch',
      'stream', 'kafka', 'rabbitmq', 'message queue',
      'data warehouse', 'snowflake', 'bigquery', 'redshift',
    ],
  },

  // ------------------------------------------------------------------
  // 17. Game Development
  // ------------------------------------------------------------------
  gamedev: {
    id: 'gamedev',
    displayName: 'Game Development',
    description: 'Game engine, assets, physics, and game-dev MCP servers',
    searchTerms: [
      'game development mcp', 'game engine mcp', 'unity mcp',
      'unreal mcp', 'godot mcp', 'game assets mcp',
      'physics engine mcp', 'game server mcp',
      'gamedev mcp server',
    ],
    relevanceKeywords: [
      'game', 'game development', 'gamedev', 'unity', 'unreal',
      'godot', 'game engine', 'game assets', 'physics',
      'sprite', 'tilemap', '3d', '2d', 'shader', 'rendering',
      'opengl', 'vulkan', 'webgl', 'bevy', 'pixi',
      'three.js', 'babylon', 'game server', 'multiplayer',
    ],
  },

  // ------------------------------------------------------------------
  // 18. Communication / Messaging
  // ------------------------------------------------------------------
  communication: {
    id: 'communication',
    displayName: 'Communication',
    description: 'Email, chat, Slack, Discord, and messaging MCP servers',
    searchTerms: [
      'communication mcp server', 'email mcp', 'slack mcp',
      'discord mcp', 'chat mcp', 'telegram mcp',
      'notification mcp', 'sms mcp', 'messaging mcp server',
      'webhook mcp server',
    ],
    relevanceKeywords: [
      'communication', 'email', 'slack', 'discord', 'chat',
      'telegram', 'notification', 'sms', 'messaging',
      'webhook', 'irc', 'matrix', 'teams', 'whatsapp',
      'push notification', 'inbox', 'mail', 'smtp', 'imap',
    ],
  },

  // ------------------------------------------------------------------
  // 19. File / Storage
  // ------------------------------------------------------------------
  storage: {
    id: 'storage',
    displayName: 'File / Storage',
    description: 'File system, S3, cloud storage, and document MCP servers',
    searchTerms: [
      'file system mcp server', 's3 mcp', 'storage mcp',
      'filesystem mcp', 'cloud storage mcp', 'blob mcp',
      'document mcp server', 'file manager mcp',
      'upload mcp server', 'drive mcp',
    ],
    relevanceKeywords: [
      'file', 'filesystem', 'storage', 's3', 'blob', 'bucket',
      'upload', 'download', 'cloud storage', 'gcs', 'azure blob',
      'minio', 'drive', 'dropbox', 'ftp', 'sftp',
      'directory', 'folder', 'path', 'archive', 'zip',
    ],
  },
};

// ============================================
// Category Lookup Functions
// ============================================

/**
 * Get a category configuration by ID.
 * @throws Error if the category does not exist.
 */
export function getCategoryConfig(categoryId: string): CategoryConfig {
  const config = CATEGORIES[categoryId];
  if (!config) {
    const available = Object.keys(CATEGORIES).join(', ');
    throw new Error(
      `Unknown category "${categoryId}". Available categories: ${available}`,
    );
  }
  return config;
}

/**
 * List all available categories, sorted by ID.
 */
export function listCategories(): CategoryConfig[] {
  return Object.values(CATEGORIES).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Check whether a category ID exists.
 */
export function isValidCategory(categoryId: string): boolean {
  return categoryId in CATEGORIES;
}

// ============================================
// Relevance Filtering
// ============================================

/**
 * Check if a discovered tool is relevant to the given category.
 *
 * This is the generalised replacement for the old `isCryptoRelated()`.
 * It checks the tool's name, description, and first 5 000 chars of README
 * against the category's relevance keywords.
 */
export function isRelevantToCategory(
  tool: DiscoveredTool,
  relevanceKeywords: string[],
): boolean {
  const searchText = [
    tool.name,
    tool.description,
    tool.readme?.slice(0, 5000) || '',
  ]
    .join(' ')
    .toLowerCase();

  return relevanceKeywords.some((keyword) =>
    searchText.includes(keyword.toLowerCase()),
  );
}

