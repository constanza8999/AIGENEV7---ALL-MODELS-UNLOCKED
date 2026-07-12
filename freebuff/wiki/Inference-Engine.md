# Inference Engine

The Inference Engine is the core of AIGENEV7 — it handles all LLM API calls across 10+ providers.

## Overview

- **Multi-provider support** — 10+ AI providers
- **Streaming responses** — Real-time token output
- **Automatic fallbacks** — Switches providers on failure
- **Token counting** — Tracks usage per request
- **Uncensored mode** — No content filters by default
- **Unlimited output** — `max_tokens: Infinity`

## Supported Providers

| Provider | Base URL | Auth Header |
|----------|----------|-------------|
| DeepSeek | `api.deepseek.com/v1` | `Authorization: Bearer <key>` |
| OpenAI | `api.openai.com/v1` | `Authorization: Bearer <key>` |
| Anthropic | `api.anthropic.com/v1` | `x-api-key: <key>` |
| Google | `generativelanguage.googleapis.com/v1beta` | `x-goog-api-key: <key>` |
| OpenRouter | `openrouter.ai/api/v1` | `Authorization: Bearer <key>` |
| Moonshot | `api.moonshot.cn/v1` | `Authorization: Bearer <key>` |
| xAI | `api.x.ai/v1` | `Authorization: Bearer <key>` |
| NVIDIA | `integrate.api.nvidia.com/v1` | `Authorization: Bearer <key>` |
| MiMo | `api.mimo.ai/v1` | `Authorization: Bearer <key>` |
| MiniMax | `api.minimax.chat/v1` | `Authorization: Bearer <key>` |
| Ollama | `localhost:11434/v1` | `Authorization: Bearer ollama` |

## Usage

### Via CLI

```bash
# Direct inference
bun run inference.js "Hello, world!" --model deepseek-v4-pro

# Stream output
bun run inference.js "Write a poem" --stream

# List models
bun run inference.js --list-models
```

### Via API

```javascript
import { infer } from './inference.js'

const result = await infer({
  model: 'deepseek-v4-pro',
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  stream: false,
  maxTokens: 4096,
  temperature: 0.7,
})

console.log(result)
// "Hello! How can I help you?"
```

### Streaming

```javascript
const result = await infer({
  model: 'deepseek-v4-pro',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
  onChunk: (chunk) => process.stdout.write(chunk),
})
```

## Configuration

### inference.json

Main configuration file:

```json
{
  "default_model": "fable-5",
  "max_tokens": "Infinity",
  "stream": true,
  "uncensored": true,
  "temperature": 0.7,
  "usage_limits": {
    "rate_limit": false,
    "token_cap": "Infinity"
  },
  "fallbacks": {
    "enabled": true,
    "order": [
      "claude-sonnet-4",
      "deepseek-v4-pro",
      "deepseek-v4-flash",
      "gpt-4o"
    ]
  }
}
```

### Environment Variables

```bash
# Override default model
AIGENEV7_DEFAULT_MODEL=deepseek-v4-pro

# Override max tokens
AIGENEV7_MAX_TOKENS=4096

# Disable streaming
AIGENEV7_STREAM=false
```

## Fallback System

If the primary model fails, the engine automatically tries the next model in the fallback chain:

```json
{
  "fallbacks": {
    "enabled": true,
    "order": [
      "claude-sonnet-4",     // Try first
      "deepseek-v4-pro",     // Try second
      "deepseek-v4-flash",   // Try third
      "gpt-4o"               // Try fourth
    ]
  }
}
```

## Uncensored Mode

By default, AIGENEV7 runs in uncensored mode:

```json
{
  "content_filter": {
    "enabled": false,
    "safety_checkers": false,
    "harm_category_threshold": "BLOCK_NONE"
  }
}
```

This means:
- No content filtering
- No safety classifiers
- No output restrictions
- Complete creative control

## Error Handling

The inference engine handles:
- **Rate limits** — Automatic retry with backoff
- **Network errors** — Automatic retry
- **API errors** — Falls back to next provider
- **Token limits** — Automatic truncation

## Token Usage

Tokens are tracked per request and deducted from your balance:

```javascript
import { getTokenBalance, hasEnoughTokens, deductTokens } from './premium.js'

// Check balance
const balance = getTokenBalance()
console.log(balance.remaining) // 95000000

// Check if request is possible
if (hasEnoughTokens(1000)) {
  // Make request
  const result = await infer({ ... })
  
  // Deduct tokens
  deductTokens(500)
}
```

---

*See [Models](Models) for the full model list and [Configuration](Configuration) for settings.*
