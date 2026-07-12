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
  // ── Anthropic (via OpenRouter) ────────────────────────────────────────
  {
    id: 'fable-5',
    displayName: 'Fable 5',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-fable-5',
    multimodal: true,
    description: 'Smartest & Multimodal (via OpenRouter)',
    premium: true,
  },
  {
    id: 'claude-sonnet-4',
    displayName: 'Claude Sonnet 4',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-sonnet-4',
    multimodal: true,
    description: 'Premium reasoning (via OpenRouter)',
    premium: false,
  },
  {
    id: 'claude-opus-4',
    displayName: 'Claude Opus 4.1',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-opus-4',
    multimodal: true,
    description: 'Maximum intelligence (via OpenRouter)',
    premium: true,
  },
  {
    id: 'claude-sonnet-4.5',
    displayName: 'Claude Sonnet 4.5',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-sonnet-4.5',
    multimodal: true,
    description: 'Balanced power & speed (via OpenRouter)',
    premium: false,
  },
  {
    id: 'claude-haiku-3.5',
    displayName: 'Claude 3.5 Haiku',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-3.5-haiku',
    multimodal: true,
    description: 'Fast & affordable (via OpenRouter)',
    premium: false,
  },
  {
    id: 'claude-3-5-sonnet',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-3.5-sonnet-20241022',
    multimodal: true,
    description: 'Previous gen balanced (via OpenRouter)',
    premium: false,
  },
  {
    id: 'claude-3-5-haiku',
    displayName: 'Claude 3.5 Haiku',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-3.5-haiku-20241022',
    multimodal: true,
    description: 'Previous gen fast (via OpenRouter)',
    premium: false,
  },
  {
    id: 'claude-3-opus',
    displayName: 'Claude 3 Opus',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-3-opus-20240229',
    multimodal: true,
    description: 'Previous gen top-tier (via OpenRouter)',
    premium: true,
  },
  {
    id: 'claude-3-sonnet',
    displayName: 'Claude 3 Sonnet',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-3-sonnet-20240229',
    multimodal: true,
    description: 'Previous gen balanced (via OpenRouter)',
    premium: false,
  },
  {
    id: 'claude-3-haiku',
    displayName: 'Claude 3 Haiku',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-3-haiku-20240307',
    multimodal: true,
    description: 'Previous gen fast (via OpenRouter)',
    premium: false,
  },
  {
    id: 'claude-4-sonnet',
    displayName: 'Claude 4 Sonnet',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-4-sonnet-20250522',
    multimodal: true,
    description: 'Claude 4 Sonnet (via OpenRouter)',
    premium: true,
  },
  {
    id: 'claude-4-opus',
    displayName: 'Claude 4 Opus',
    provider: 'openrouter',
    providerModel: 'anthropic/claude-opus-4-20250514',
    multimodal: true,
    description: 'Claude 4 Opus (via OpenRouter)',
    premium: true,
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
  {
    id: 'deepseek-v3',
    displayName: 'DeepSeek V3',
    provider: 'deepseek',
    providerModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
    multimodal: false,
    description: 'Previous gen general purpose',
    premium: false,
  },
  {
    id: 'deepseek-coder',
    displayName: 'DeepSeek Coder',
    provider: 'deepseek',
    providerModel: 'deepseek-coder',
    baseUrl: 'https://api.deepseek.com/v1',
    multimodal: false,
    description: 'Code-specialized model',
    premium: false,
  },
  {
    id: 'deepseek-v2.5',
    displayName: 'DeepSeek V2.5',
    provider: 'deepseek',
    providerModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
    multimodal: false,
    description: 'Balanced performance',
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
    premium: true,
  },
  // NOTE: gpt-5-plus not yet available via API — uncomment when released
  // {
  //   id: 'gpt-5-plus',
  //   displayName: 'GPT-5 Plus',
  //   provider: 'openai',
  //   providerModel: 'gpt-5-plus-2025-06-01',
  //   multimodal: true,
  //   description: 'Enhanced GPT-5 reasoning',
  //   premium: true,
  // },
  {
    id: 'gpt-4.1',
    displayName: 'GPT-4.1',
    provider: 'openai',
    providerModel: 'gpt-4.1-2025-04-14',
    multimodal: true,
    description: 'Strong general reasoning',
    premium: true,
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
    id: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    provider: 'openai',
    providerModel: 'gpt-4-turbo-2024-04-09',
    multimodal: true,
    description: 'Previous gen flagship',
    premium: false,
  },
  {
    id: 'gpt-4',
    displayName: 'GPT-4',
    provider: 'openai',
    providerModel: 'gpt-4-0613',
    multimodal: false,
    description: 'Previous gen standard',
    premium: false,
  },
  {
    id: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    provider: 'openai',
    providerModel: 'gpt-3.5-turbo-0125',
    multimodal: false,
    description: 'Fast & affordable',
    premium: false,
  },
  {
    id: 'o3',
    displayName: 'O3',
    provider: 'openai',
    providerModel: 'o3-2025-04-16',
    multimodal: false,
    description: 'Deep reasoning',
    premium: true,
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
    premium: true,
  },
  // NOTE: o4 not yet available via API — uncomment when released
  // {
  //   id: 'o4',
  //   displayName: 'O4',
  //   provider: 'openai',
  //   providerModel: 'o4-2025-07-01',
  //   multimodal: true,
  //   description: 'Latest reasoning model',
  //   premium: true,
  // },

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
  {
    id: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    provider: 'google',
    providerModel: 'gemini-2.0-flash-001',
    multimodal: true,
    description: 'Previous gen fast',
    premium: false,
  },
  {
    id: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    provider: 'google',
    providerModel: 'gemini-1.5-pro-002',
    multimodal: true,
    description: 'Previous gen balanced',
    premium: false,
  },
  {
    id: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    provider: 'google',
    providerModel: 'gemini-1.5-flash-002',
    multimodal: true,
    description: 'Previous gen fast',
    premium: false,
  },
  {
    id: 'gemini-2.5-ultra',
    displayName: 'Gemini 2.5 Ultra',
    provider: 'google',
    providerModel: 'gemini-2.5-ultra-03-25',
    multimodal: true,
    description: 'Maximum Google capability',
    premium: true,
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
  {
    id: 'kimi-k2',
    displayName: 'Kimi K2',
    provider: 'moonshot',
    providerModel: 'moonshotai/kimi-k2',
    multimodal: true,
    description: 'Previous gen balanced',
    premium: false,
  },
  {
    id: 'kimi-vl-a3b',
    displayName: 'Kimi VL A3B',
    provider: 'moonshot',
    providerModel: 'moonshotai/kimi-vl-a3b',
    multimodal: true,
    description: 'Vision-language model',
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
  {
    id: 'mimo-v2.5-max',
    displayName: 'MiMo 2.5 Max',
    provider: 'mimo',
    providerModel: 'mimo/mimo-v2.5-max',
    multimodal: true,
    description: 'Maximum thinking depth',
    premium: true,
  },
  {
    id: 'mimo-v2',
    displayName: 'MiMo V2',
    provider: 'mimo',
    providerModel: 'mimo/mimo-v2',
    multimodal: true,
    description: 'Previous gen multimodal',
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
  {
    id: 'minimax-m2.5',
    displayName: 'MiniMax M2.5',
    provider: 'minimax',
    providerModel: 'minimax/minimax-m2.5',
    multimodal: false,
    description: 'Previous gen',
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
    premium: true,
  },
  {
    id: 'grok-3',
    displayName: 'Grok 3',
    provider: 'xai',
    providerModel: 'grok-3-02-24',
    baseUrl: 'https://api.x.ai/v1',
    multimodal: true,
    description: 'Previous gen xAI',
    premium: false,
  },
  {
    id: 'grok-3-mini',
    displayName: 'Grok 3 Mini',
    provider: 'xai',
    providerModel: 'grok-3-mini-02-24',
    baseUrl: 'https://api.x.ai/v1',
    multimodal: true,
    description: 'Fast xAI',
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

  // ── Ollama (Local) ───────────────────────────────────────────────────
  {
    id: 'claude-fable-5q',
    displayName: 'Claude Fable 5Q (Local)',
    provider: 'ollama',
    providerModel: 'oroboroslabs/claude-fable-5Q',
    multimodal: false,
    description: 'Local open-weights via Ollama — free & unlimited',
    premium: false,
  },
  {
    id: 'llama3.1-8b',
    displayName: 'Llama 3.1 8B (Local)',
    provider: 'ollama',
    providerModel: 'llama3.1:8b',
    multimodal: false,
    description: 'Meta Llama 3.1 8B local',
    premium: false,
  },
  {
    id: 'llama3.1-70b',
    displayName: 'Llama 3.1 70B (Local)',
    provider: 'ollama',
    providerModel: 'llama3.1:70b',
    multimodal: false,
    description: 'Meta Llama 3.1 70B local',
    premium: false,
  },
  {
    id: 'llama3.2',
    displayName: 'Llama 3.2 (Local)',
    provider: 'ollama',
    providerModel: 'llama3.2',
    multimodal: true,
    description: 'Meta Llama 3.2 with vision',
    premium: false,
  },
  {
    id: 'llama3.3',
    displayName: 'Llama 3.3 (Local)',
    provider: 'ollama',
    providerModel: 'llama3.3',
    multimodal: false,
    description: 'Meta Llama 3.3',
    premium: false,
  },
  {
    id: 'llama4-maverick',
    displayName: 'Llama 4 Maverick (Local)',
    provider: 'ollama',
    providerModel: 'llama4-maverick',
    multimodal: true,
    description: 'Meta Llama 4 Maverick 17B MoE',
    premium: false,
  },
  {
    id: 'codellama-34b',
    displayName: 'CodeLlama 34B (Local)',
    provider: 'ollama',
    providerModel: 'codellama:34b',
    multimodal: false,
    description: 'Code-specialized Llama',
    premium: false,
  },
  {
    id: 'deepseek-coder-v2',
    displayName: 'DeepSeek Coder V2 (Local)',
    provider: 'ollama',
    providerModel: 'deepseek-coder-v2:16b',
    multimodal: false,
    description: 'DeepSeek code model local',
    premium: false,
  },
  {
    id: 'qwen2.5-coder-32b',
    displayName: 'Qwen 2.5 Coder 32B (Local)',
    provider: 'ollama',
    providerModel: 'qwen2.5-coder:32b',
    multimodal: false,
    description: 'Alibaba Qwen code model',
    premium: false,
  },
  {
    id: 'mistral-large',
    displayName: 'Mistral Large (Local)',
    provider: 'ollama',
    providerModel: 'mistral-large:latest',
    multimodal: false,
    description: 'Mistral AI large model',
    premium: false,
  },
  {
    id: 'mixtral-8x22b',
    displayName: 'Mixtral 8x22B (Local)',
    provider: 'ollama',
    providerModel: 'mixtral:8x22b',
    multimodal: false,
    description: 'Mistral MoE model',
    premium: false,
  },
  {
    id: 'phi-3.5',
    displayName: 'Phi-3.5 (Local)',
    provider: 'ollama',
    providerModel: 'phi3.5:latest',
    multimodal: false,
    description: 'Microsoft Phi-3.5',
    premium: false,
  },
  {
    id: 'gemma2-27b',
    displayName: 'Gemma 2 27B (Local)',
    provider: 'ollama',
    providerModel: 'gemma2:27b',
    multimodal: false,
    description: 'Google Gemma 2',
    premium: false,
  },
  {
    id: 'command-r-plus',
    displayName: 'Command R+ (Local)',
    provider: 'ollama',
    providerModel: 'command-r-plus:latest',
    multimodal: false,
    description: 'Cohere Command R+',
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
    id: 'nvidia-llama-3.3-70b',
    displayName: 'Llama 3.3 70B',
    provider: 'nvidia',
    providerModel: 'meta/llama-3.3-70b-instruct',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'Meta Llama 3.3 70B via NVIDIA NIM',
    premium: false,
  },
  {
    id: 'nvidia-llama-4-maverick',
    displayName: 'Llama 4 Maverick',
    provider: 'nvidia',
    providerModel: 'meta/llama-4-maverick-17b-128e-instruct',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: true,
    description: 'Meta Llama 4 Maverick 17B MoE via NVIDIA NIM',
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
    id: 'nvidia-nemotron-super-49b',
    displayName: 'Nemotron Super 49B',
    provider: 'nvidia',
    providerModel: 'nvidia/llama-3.3-nemotron-super-49b-v1',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'NVIDIA Llama 3.3 Nemotron Super 49B via NIM',
    premium: false,
  },
  {
    id: 'nvidia-nemotron-ultra-253b',
    displayName: 'Nemotron Ultra 253B',
    provider: 'nvidia',
    providerModel: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'NVIDIA Llama 3.1 Nemotron Ultra 253B via NIM',
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
  {
    id: 'nvidia-mistral-large-3',
    displayName: 'Mistral Large 3 675B',
    provider: 'nvidia',
    providerModel: 'mistralai/mistral-large-3-675b-instruct-2512',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'Mistral Large 3 675B via NVIDIA NIM',
    premium: false,
  },
  {
    id: 'nvidia-mistral-nemotron',
    displayName: 'Mistral Nemotron',
    provider: 'nvidia',
    providerModel: 'mistralai/mistral-nemotron',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'Mistral Nemotron via NVIDIA NIM',
    premium: false,
  },
  {
    id: 'nvidia-deepseek-v4-flash',
    displayName: 'DeepSeek V4 Flash (NVIDIA)',
    provider: 'nvidia',
    providerModel: 'deepseek-ai/deepseek-v4-flash',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'DeepSeek V4 Flash via NVIDIA NIM',
    premium: false,
  },
  {
    id: 'nvidia-deepseek-v4-pro',
    displayName: 'DeepSeek V4 Pro (NVIDIA)',
    provider: 'nvidia',
    providerModel: 'deepseek-ai/deepseek-v4-pro',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    multimodal: false,
    description: 'DeepSeek V4 Pro via NVIDIA NIM',
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
  openai: 'https://openrouter.ai/api/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  moonshot: 'https://api.moonshot.cn/v1',
  mimo: 'https://api.mimo.com/v1',
  minimax: 'https://api.minimax.chat/v1',
  xai: 'https://api.x.ai/v1',
  nvidia: 'https://integrate.api.nvidia.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  ollama: 'http://localhost:11434/v1',
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
  ollama: 'OLLAMA_API_KEY',
}

/**
 * Find a model by its ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getModel(id) {
  return MODELS.find((m) => m.id === id)
}

// ── Model Recommendation System ────────────────────────────────────────

/**
 * Task categories for model recommendations.
 * Each maps a use-case to the best model attributes.
 */
const TASK_PROFILES = {
  coding: {
    description: 'General-purpose coding, debugging, and code generation',
    preferredProviders: ['deepseek', 'anthropic', 'openai', 'openrouter'],
    preferredIds: ['deepseek-v4-pro', 'claude-sonnet-4', 'gpt-4.1', 'fable-5', 'deepseek-coder', 'deepseek-v4-flash'],
    traits: ['reasoning', 'code', 'fast'],
  },
  reasoning: {
    description: 'Complex reasoning, analysis, and multi-step problem solving',
    preferredProviders: ['openai', 'anthropic', 'google', 'deepseek'],
    preferredIds: ['o3', 'o3-pro', 'claude-opus-4', 'fable-5', 'gemini-2.5-pro', 'deepseek-reasoner', 'gpt-5'],
    traits: ['reasoning', 'intelligence'],
  },
  creative: {
    description: 'Creative writing, brainstorming, and content generation',
    preferredProviders: ['anthropic', 'openai', 'google', 'xai'],
    preferredIds: ['claude-sonnet-4.5', 'gpt-4o', 'gemini-2.5-pro', 'grok-4', 'fable-5'],
    traits: ['creative', 'multimodal'],
  },
  fast: {
    description: 'Quick responses for simple tasks — speed over depth',
    preferredProviders: ['deepseek', 'openai', 'google', 'anthropic', 'minimax'],
    preferredIds: ['deepseek-v4-flash', 'gpt-4o-mini', 'gemini-2.5-flash', 'claude-haiku-3.5', 'minimax-m3', 'gpt-4o-mini'],
    traits: ['fast', 'affordable'],
  },
  multimodal: {
    description: 'Image understanding and vision-language tasks',
    preferredProviders: ['openai', 'google', 'anthropic', 'xai'],
    preferredIds: ['gpt-4o', 'gemini-2.5-pro', 'claude-sonnet-4', 'grok-4', 'fable-5'],
    traits: ['multimodal'],
  },
  local: {
    description: 'Run locally with Ollama — free, private, no API calls',
    preferredProviders: ['ollama'],
    preferredIds: ['llama3.3', 'llama4-maverick', 'qwen2.5-coder-32b', 'mistral-large', 'codellama-34b'],
    traits: ['local', 'free', 'private'],
  },
  budget: {
    description: 'Most affordable option — minimize cost',
    preferredProviders: ['deepseek', 'google', 'openai', 'minimax'],
    preferredIds: ['deepseek-chat', 'gemini-2.5-flash', 'gpt-4o-mini', 'minimax-m2.7', 'gpt-3.5-turbo'],
    traits: ['affordable'],
  },
  uncensored: {
    description: 'Maximum freedom — no content filters or restrictions',
    preferredProviders: ['xai', 'deepseek', 'ollama'],
    preferredIds: ['grok-4', 'grok-3', 'deepseek-v4-pro', 'llama3.3', 'deepseek-chat'],
    traits: ['uncensored'],
  },
}

/**
 * Recommend the best available model for a given task.
 * Checks provider availability and returns the first matching model
 * that has an API key configured.
 *
 * @param {string} task - Task category: 'coding', 'reasoning', 'creative',
 *                        'fast', 'multimodal', 'local', 'budget', 'uncensored'
 * @returns {{ model: object, task: string, description: string, alternatives: Array }}
 */
export function recommendModel(task = 'coding') {
  const profile = TASK_PROFILES[task.toLowerCase()]
  if (!profile) {
    throw new Error(
      `Unknown task: "${task}". Available: ${Object.keys(TASK_PROFILES).join(', ')}`
    )
  }

  // Try preferred IDs first (most specific match)
  const alternatives = []
  for (const preferredId of profile.preferredIds) {
    const model = getModel(preferredId)
    if (model) {
      if (isProviderAvailable(model.provider) || model.provider === 'ollama') {
        return {
          model,
          task,
          description: profile.description,
          alternatives: alternatives.slice(0, 5),
        }
      }
      alternatives.push(model)
    }
  }

  // Fallback: any available model from preferred providers
  for (const provider of profile.preferredProviders) {
    if (isProviderAvailable(provider) || provider === 'ollama') {
      const providerModels = MODELS.filter((m) => m.provider === provider)
      if (providerModels.length > 0) {
        return {
          model: providerModels[0],
          task,
          description: profile.description,
          alternatives: alternatives.slice(0, 5),
        }
      }
    }
  }

  // Last resort: auto-detect any available model
  const detected = detectBestModel()
  return {
    model: detected,
    task,
    description: profile.description,
    alternatives: alternatives.slice(0, 5),
  }
}

/**
 * List all available task categories for recommendations.
 * @returns {Array<{ id, description }>}
 */
export function listTaskCategories() {
  return Object.entries(TASK_PROFILES).map(([id, profile]) => ({
    id,
    description: profile.description,
  }))
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
  const val = process.env[envKey]
  return typeof val === 'string' && val.trim().length > 0
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
    'ollama',
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
