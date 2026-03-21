export interface LLMModel {
  id: string
  name: string
  contextWindow?: number
  supportsJsonMode?: boolean
}

export interface LLMProvider {
  id: string
  name: string
  defaultEndpoint: string
  requiresApiKey: boolean
  models: LLMModel[]
  description?: string
}

/**
 * adapterType 决定使用哪个适配器：
 * - 'openai': OpenAI Chat Completions 格式（大多数 provider）
 * - 'anthropic': Anthropic Messages API（Claude 原生）
 * - 'google-gemini': Google Gemini API（contents[] 格式）
 */
export type AdapterType = 'openai' | 'anthropic' | 'google-gemini'

export const LLM_PROVIDERS: (LLMProvider & { adapterType: AdapterType })[] = [
  // ── Anthropic（独立适配器）──────────────────────────────
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    defaultEndpoint: 'https://api.anthropic.com',
    requiresApiKey: true,
    adapterType: 'anthropic',
    description: 'Claude 原生 API，支持 prompt caching',
    models: [
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', contextWindow: 200000, supportsJsonMode: true },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000, supportsJsonMode: true },
      { id: 'claude-haiku-4-20250414', name: 'Claude Haiku 4', contextWindow: 200000, supportsJsonMode: true },
    ],
  },
  // ── Google Gemini（独立适配器）──────────────────────────
  {
    id: 'gemini',
    name: 'Google Gemini',
    defaultEndpoint: 'https://generativelanguage.googleapis.com',
    requiresApiKey: true,
    adapterType: 'google-gemini',
    description: 'Gemini API，超大上下文',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 1000000, supportsJsonMode: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1000000, supportsJsonMode: true },
    ],
  },
  // ── OpenAI 兼容（共用适配器）──────────────────────────
  {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultEndpoint: 'https://api.deepseek.com/v1',
    requiresApiKey: true,
    adapterType: 'openai',
    description: '性价比高，中文能力强',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', contextWindow: 64000, supportsJsonMode: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', contextWindow: 64000, supportsJsonMode: false },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    defaultEndpoint: 'https://api.openai.com/v1',
    requiresApiKey: true,
    adapterType: 'openai',
    models: [
      { id: 'gpt-4.1', name: 'GPT-4.1', contextWindow: 1000000, supportsJsonMode: true },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', contextWindow: 1000000, supportsJsonMode: true },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', contextWindow: 1000000, supportsJsonMode: true },
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, supportsJsonMode: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, supportsJsonMode: true },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultEndpoint: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    adapterType: 'openai',
    description: '聚合多家模型，支持 Claude / Gemini / Llama 等',
    models: [
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', contextWindow: 200000, supportsJsonMode: true },
      { id: 'anthropic/claude-haiku-4', name: 'Claude Haiku 4', contextWindow: 200000, supportsJsonMode: true },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1000000, supportsJsonMode: true },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 1000000, supportsJsonMode: true },
      { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', contextWindow: 1000000, supportsJsonMode: true },
      { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3 0324', contextWindow: 64000, supportsJsonMode: true },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    defaultEndpoint: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    adapterType: 'openai',
    description: '极速推理',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', contextWindow: 128000, supportsJsonMode: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', contextWindow: 128000, supportsJsonMode: true },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', contextWindow: 8192, supportsJsonMode: true },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    defaultEndpoint: 'https://api.mistral.ai/v1',
    requiresApiKey: true,
    adapterType: 'openai',
    description: '欧洲领先的开源模型提供商',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', contextWindow: 128000, supportsJsonMode: true },
      { id: 'mistral-medium-latest', name: 'Mistral Medium', contextWindow: 128000, supportsJsonMode: true },
      { id: 'mistral-small-latest', name: 'Mistral Small', contextWindow: 128000, supportsJsonMode: true },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    defaultEndpoint: 'https://api.perplexity.ai',
    requiresApiKey: true,
    adapterType: 'openai',
    description: '搜索增强的 AI，适合需要实时知识的叙事',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro', contextWindow: 200000, supportsJsonMode: false },
      { id: 'sonar', name: 'Sonar', contextWindow: 128000, supportsJsonMode: false },
    ],
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    defaultEndpoint: 'https://api.x.ai/v1',
    requiresApiKey: true,
    adapterType: 'openai',
    description: 'Elon Musk 的 AI 公司',
    models: [
      { id: 'grok-3', name: 'Grok 3', contextWindow: 131072, supportsJsonMode: true },
      { id: 'grok-3-mini', name: 'Grok 3 Mini', contextWindow: 131072, supportsJsonMode: true },
    ],
  },
  {
    id: 'together',
    name: 'Together AI',
    defaultEndpoint: 'https://api.together.xyz/v1',
    requiresApiKey: true,
    adapterType: 'openai',
    description: '开源模型推理平台',
    models: [
      { id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', name: 'Llama 4 Maverick', contextWindow: 1000000, supportsJsonMode: true },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', contextWindow: 32768, supportsJsonMode: true },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', contextWindow: 64000, supportsJsonMode: true },
    ],
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    defaultEndpoint: 'https://api.fireworks.ai/inference/v1',
    requiresApiKey: true,
    adapterType: 'openai',
    description: '高性能推理优化',
    models: [
      { id: 'accounts/fireworks/models/llama4-maverick-instruct-basic', name: 'Llama 4 Maverick', contextWindow: 1000000, supportsJsonMode: true },
      { id: 'accounts/fireworks/models/qwen2p5-72b-instruct', name: 'Qwen 2.5 72B', contextWindow: 32768, supportsJsonMode: true },
    ],
  },
  {
    id: 'moonshot',
    name: 'Moonshot / Kimi',
    defaultEndpoint: 'https://api.moonshot.cn/v1',
    requiresApiKey: true,
    adapterType: 'openai',
    description: '超长上下文，中文优化',
    models: [
      { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K', contextWindow: 128000, supportsJsonMode: true },
      { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', contextWindow: 32000, supportsJsonMode: true },
    ],
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    defaultEndpoint: 'https://api.siliconflow.cn/v1',
    requiresApiKey: true,
    adapterType: 'openai',
    models: [
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', contextWindow: 32000, supportsJsonMode: true },
      { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen 2.5 32B', contextWindow: 32000, supportsJsonMode: true },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', contextWindow: 64000, supportsJsonMode: true },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (本地)',
    defaultEndpoint: 'http://localhost:11434/v1',
    requiresApiKey: false,
    adapterType: 'openai',
    description: '本地模型，无需 API Key',
    models: [
      { id: 'qwen2.5:32b', name: 'Qwen 2.5 32B' },
      { id: 'qwen2.5:14b', name: 'Qwen 2.5 14B' },
      { id: 'llama3.1:8b', name: 'Llama 3.1 8B' },
      { id: 'gemma2:9b', name: 'Gemma 2 9B' },
    ],
  },
  {
    id: 'custom',
    name: '自定义 (OpenAI 兼容)',
    defaultEndpoint: '',
    requiresApiKey: false,
    adapterType: 'openai',
    description: '任何 OpenAI 兼容 API 端点',
    models: [],
  },
]

export function getProvider(id: string): LLMProvider | undefined {
  return LLM_PROVIDERS.find(p => p.id === id)
}

export function getModels(providerId: string): LLMModel[] {
  return getProvider(providerId)?.models ?? []
}
