/**
 * AIGENEV7 Model Catalog
 *
 * Every model AIGENEV7 supports — uncensored, unlimited, available.
 * Add your own by appending to this list.
 *
 * Each entry has:
 *   id            – Stable identifier used in the wire protocol
 *   displayName   – Human-readable label
 *   provider      – API provider (determines auth + endpoint)
 *   providerModel – Model name passed to the provider's API
 *   baseUrl       – Override endpoint (optional; falls back to provider default)
 *   multimodal    – Accepts image input
 *   description   – One-line tagline
 *   premium       – Requires a premium-tier provider key
 */

export const MODELS = [
  // ── Anthropic ────────────────────────────────────────────────────────
  {
    id: 'fable-5',
    displayName: 'Fable 5',
    provider: 'anthropic',
    providerModel: 'claude-fable-5-20260305',
    multimodal: true,
    description: 'Smartest & Multimodal',
    premium: false,
  },
  {
    id: 'claude-sonnet-4',
    displayName: 'Claude Sonnet 4',
    provider: 'anthropic',
    providerModel: 'claude-4-sonnet-20250522',
    multimodal: true,
    description: 'Premium reasoning',
    premium: false,
  },
  {
    id: 'claude-opus-4',
    displayName: 'Claude Opus 4.1',
    provider: 'anthropic',
    providerModel: 'claude-opus-4.1-20250204',
    multimodal: true,
    description: 'Maximum intelligence',
    premium: false,
  },
  {
    id: 'claude-sonnet-4.5',
    displayName: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    providerModel: 'claude-sonnet-4.5-20250317',
    multimodal: true,
    description: 'Balanced power & speed',
    premium: false,
  },
  {
    id: 'claude-haiku-3.5',
    displayName: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    providerModel: 'claude-3.5-haiku-20241022',
    multimodal: true,
    description: 'Fast & affordable',
    premium: false,
  },

  // ── DeepSeek ─────────────────────────────────────────────────────────
  {
    id: 'deepseek-v4-pro',
    displayName: 'DeepSeek V4 Pro',
    provider: 'deepseek',
    providerModel: 'deepseek/deepseek-v4-pro',
    baseUrl: 'https://api.deepseek.com/v1',
    multimodal: false,
    description: 'Smartest general reasoning',
    premium: false,
    dataCollection: true,
  },
  {
    id: 'deepseek-v4-flash',
    displayName: 'DeepSeek V4 Flash',
    provider: 'deepseek',
    providerModel: 'deepseek/deepseek-v4-flash',
    baseUrl: 'https://api.deepseek.com/v1',
    multimodal: false,
    description: 'Smart & Fast',
    premium: false,
    dataCollection: true,
  },
  {
    id: 'deepseek-chat',
    displayName: 'DeepSeek Chat',
    provider: 'deepseek',
    providerModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
    multimodal: false,
    description: 'General purpose',
    premium: false,
  },
  {
    id: 'deepseek-reasoner',
    displayName: 'DeepSeek Reasoner',
    provider: 'deepseek',
    providerModel: 'deepseek-reasoner',
    baseUrl: 'https://api.deepseek.com/v1',
    multimodal: false,
    description: 'Chain-of-thought reasoning',
    premium: false,
  },

  // ── OpenAI ───────────────────────────────────────────────────────────
  {
    id: 'gpt-5',
    displayName: 'GPT-5',
    provider: 'openai',
    providerModel: 'gpt-5-2025-05-01',
    multimodal: true,
    description: 'Latest OpenAI flagship',
    premium: false,
  },
  {
    id: 'gpt-4.1',
    displayName: 'GPT-4.1',
    provider: 'openai',
    providerModel: 'gpt-4.1-2025-04-14',
    multimodal: true,
    description: 'Strong general reasoning',
    premium: false,
  },
  {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    providerModel: 'gpt-4o-2024-11-20',
    multimodal: true,
    description: 'Omni modal',
    premium: false,
  },
  {
    id: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'openai',
    providerModel: 'gpt-4o-mini-2024-07-18',
    multimodal: true,
    description: 'Fast & cheap',
    premium: false,
  },
  {
    id: 'o3',
    displayName: 'O3',
    provider: 'openai',
    providerModel: 'o3-2025-04-16',
    multimodal: false,
    description: 'Deep reasoning',
    premium: false,
  },
  {
    id: 'o3-mini',
    displayName: 'O3 Mini',
    provider: 'openai',
    providerModel: 'o3-mini-2025-01-31',
    multimodal: false,
    description: 'Fast reasoning',
    premium: false,
  },
  {
    id: 'o4-mini',
    displayName: 'O4 Mini',
    provider: 'openai',
    providerModel: 'o4-mini-2025-04-16',
    multimodal: true,
    description: 'Multimodal reasoning',
    premium: false,
  },
  {
    id: 'o3-pro',
    displayName: 'O3 Pro',
    provider: 'openai',
    providerModel: 'o3-pro-2025-06-10',
    multimodal: false,
    description: 'Maximum OpenAI reasoning',
    premium: false,
  },

  // ── Google Gemini ────────────────────────────────────────────────────
  {
    id: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'google',
    providerModel: 'gemini-2.5-pro-03-25',
    multimodal: true,
    description: 'Google flagship reasoning',
    premium: false,
  },
  {
    id: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    provider: 'google',
    providerModel: 'gemini-2.5-flash-03-25',
    multimodal: true,
    description: 'Fast Google AI',
    premium: false,
  },

  // ── Moonshot / Kimi ──────────────────────────────────────────────────
  {
    id: 'kimi-k2.6',
    displayName: 'Kimi K2.6',
    provider: 'moonshot',
    providerModel: 'moonshotai/kimi-k2.6',
    multimodal: true,
    description: 'Balanced general purpose',
    premium: false,
  },

  // ── MiMo ─────────────────────────────────────────────────────────────
  {
    id: 'mimo-v2.5-pro',
    displayName: 'MiMo 2.5 Pro',
    provider: 'mimo',
    providerModel: 'mimo/mimo-v2.5-pro',
    multimodal: true,
    description: 'Smartest & Slow (deep thinking)',
    premium: false,
  },
  {
    id: 'mimo-v2.5',
    displayName: 'MiMo 2.5',
    provider: 'mimo',
    providerModel: 'mimo/mimo-v2.5',
    multimodal: true,
    description: 'Multimodal',
    premium: false,
  },

  // ── MiniMax ──────────────────────────────────────────────────────────
  {
    id: 'minimax-m3',
    displayName: 'MiniMax M3',
    provider: 'minimax',
    providerModel: 'minimax/minimax-m3',
    multimodal: true,
    description: 'Smartest & Fastest',
    premium: false,
  },
  {
    id: 'minimax-m2.7',
    displayName: 'MiniMax M2.7',
    provider: 'minimax',
    providerModel: 'minimax/minimax-m2.7',
    multimodal: false,
    description: 'Fastest (legacy)',
    premium: false,
  },

  // ── Grok (xAI) ───────────────────────────────────────────────────────
  {
    id: 'grok-4',
    displayName: 'Grok 4',
    provider: 'xai',
    providerModel: 'grok-4-07-09',
    baseUrl: 'https://api.x.ai/v1',
    multimodal: true,
    description: 'xAI flagship',
    premium: false,
  },

  // ── OpenRouter (meta-provider) ───────────────────────────────────────
  {
    id: 'openrouter-claude-sonnet-4.5',
    displayName: 'OR Claude Sonnet 4.5',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-sonnet-4.5',
    description: 'Sonnet 4.5 via OpenRouter',
    premium: false,
  },
  {
    id: 'openrouter-gpt-5',
    displayName: 'OR GPT-5',
    provider: 'openrouter',
    providerModel: 'openai/gpt-5.1',
    description: 'GPT-5 via OpenRouter',
    premium: false,
  },
  {
    id: 'openrouter-gemini-2.5-pro',
    displayName: 'OR Gemini 2.5 Pro',
    provider: 'openrouter',
    providerModel: 'google/gemini-2.5-pro',
    description: 'Gemini 2.5 Pro via OpenRouter',
    premium: false,
  },

  // ── NVIDIA NIM ────────────────────────────────────────────────────────
  {
    id: 'nvidia-llama-3.1-8b',
    displayName: 'Llama 3.1 8B',
    provider: 'nvidia',
    providerModel: 'meta/llama-3.1-8b-instruct',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'Meta Llama 3.1 8B via NVIDIA NIM',
    premium: false,
  },
  {
    id: 'nvidia-llama-3.1-70b',
    displayName: 'Llama 3.1 70B',
    provider: 'nvidia',
    providerModel: 'meta/llama-3.1-70b-instruct',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'Meta Llama 3.1 70B via NVIDIA NIM',
    premium: false,
  },
  {
    id: 'nvidia-llama-3.1-405b',
    displayName: 'Llama 3.1 405B',
    provider: 'nvidia',
    providerModel: 'meta/llama-3.1-405b-instruct',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'Meta Llama 3.1 405B via NVIDIA NIM',
    premium: false,
  },
  {
    id: 'nvidia-nemotron-4-340b',
    displayName: 'Nemotron 4 340B',
    provider: 'nvidia',
    providerModel: 'nvidia/nemotron-4-340b-instruct',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'NVIDIA Nemotron 4 340B via NIM',
    premium: false,
  },
  {
    id: 'nvidia-mistral-large',
    displayName: 'Mistral Large',
    provider: 'nvidia',
    providerModel: 'mistralai/mistral-large',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'Mistral Large via NVIDIA NIM',
    premium: false,
  },
] // MODELS

/**
 * Provider API base URLs.
 * Used as defaults; individual models can override via `baseUrl`.
 */
export const PROVIDER_URLS = {
  anthropic: 'https://api.anthropic.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  openai: 'https://api.openai.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  moonshot: 'https://api.moonshot.cn/v1',
  mimo: 'https://api.mimo.com/v1',
  minimax: 'https://api.minimax.chat/v1',
  xai: 'https://api.x.ai/v1',
  nvidia: 'https://integrate.api.nvidia.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
}

/**
 * Provider API key environment variable names.
 */
export const PROVIDER_ENV_KEYS = {
  anthropic: 'ANTHROPIC_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_API_KEY',
  moonshot: 'MOONSHOT_API_KEY',
  mimo: 'MIMO_API_KEY',
  minimax: 'MINIMAX_API_KEY',
  xai: 'XAI_API_KEY',
  nvidia: 'NVIDIA_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
}

/**
 * Find a model by its ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getModel(id) {
  return MODELS.find((m) => m.id === id)
}

/**
 * List all models grouped by provider.
 * @returns {object} { providerName: [models] }
 */
export function getModelsByProvider() {
  const groups = {}
  for (const model of MODELS) {
    const provider = model.provider
    if (!groups[provider]) groups[provider] = []
    groups[provider].push(model)
  }
  return groups
}

/**
 * Check if at least one model for the given provider has API keys configured.
 * @param {string} provider
 * @returns {boolean}
 */
export function isProviderAvailable(provider) {
  const envKey = PROVIDER_ENV_KEYS[provider]
  if (!envKey) return false
  return !!process.env[envKey]
}

/**
 * Get the best available model for a provider, or undefined.
 * @param {string} provider
 * @returns {object|undefined}
 */
export function getBestAvailableModel(provider) {
  const providerModels = MODELS.filter((m) => m.provider === provider)
  if (providerModels.length === 0) return undefined

  // Try to find one with configured API key
  if (isProviderAvailable(provider)) {
    return providerModels[0] // Return the first (best) one
  }
  return undefined
}

/**
 * Auto-detect the best available model from any configured provider.
 * Checks providers in priority order.
 * @returns {object|undefined}
 */
export function detectBestModel() {
  const priority = [
    'anthropic',
    'deepseek',
    'openai',
    'openrouter',
    'google',
    'moonshot',
    'mimo',
    'minimax',
    'nvidia',
    'xai',
  ]

  for (const provider of priority) {
    if (isProviderAvailable(provider)) {
      const models = MODELS.filter((m) => m.provider === provider)
      if (models.length > 0) return models[0]
    }
  }

  // Fallback: no configured provider
  return MODELS[0]
}
