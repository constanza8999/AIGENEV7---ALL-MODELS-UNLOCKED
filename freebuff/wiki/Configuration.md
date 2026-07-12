# Configuration

## Environment Variables

AIGENEV7 uses environment variables for configuration. Create a `.env` file in the `freebuff/` directory.

### API Keys (Required)

At least **one** API key is required:

```bash
# DeepSeek (Free tier available)
DEEPSEEK_API_KEY=sk-...

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_API_KEY=AIza...

# OpenRouter (Free tier available)
OPENROUTER_API_KEY=sk-or-...

# Moonshot (Free tier available)
MOONSHOT_API_KEY=sk-...

# xAI (Grok)
XAI_API_KEY=xai-...

# Ollama (Local, no real key needed)
OLLAMA_API_KEY=ollama
```

### Optional Settings

```bash
# Default model
AIGENEV7_DEFAULT_MODEL=deepseek-v4-pro

# Max tokens (use "Infinity" for unlimited)
AIGENEV7_MAX_TOKENS=Infinity

# Enable/disable streaming
AIGENEV7_STREAM=true

# Uncensored mode (default: true)
AIGENEV7_UNCENSORED=true
```

## inference.json

The main configuration file is `freebuff/inference.json`:

```json
{
  "default_model": "deepseek-v4-pro",
  "max_tokens": "Infinity",
  "stream": true,
  "uncensored": true,
  "usage_limits": {
    "rate_limit": false,
    "token_cap": "Infinity"
  }
}
```

## Model Configuration

Models are defined in `freebuff/models.js`. Each model has:

```javascript
{
  id: 'deepseek-v4-pro',
  displayName: 'DeepSeek V4 Pro',
  provider: 'deepseek',
  providerModel: 'deepseek-chat',
  multimodal: false,
  description: 'Smartest general reasoning',
  premium: false,
}
```

### Provider URLs

| Provider | Base URL |
|----------|----------|
| DeepSeek | `https://api.deepseek.com/v1` |
| OpenAI | `https://api.openai.com/v1` |
| Anthropic | `https://api.anthropic.com/v1` |
| Google | `https://generativelanguage.googleapis.com/v1beta` |
| OpenRouter | `https://openrouter.ai/api/v1` |
| Moonshot | `https://api.moonshot.cn/v1` |
| xAI | `https://api.x.ai/v1` |
| NVIDIA | `https://integrate.api.nvidia.com/v1` |
| Ollama | `http://localhost:11434/v1` |

## Content Filter

The content filter is configured in `freebuff/content-filter.conf`:

```conf
# Content filter settings
enabled=false
blocked_categories=
```

## Runtime Configuration

The runtime configuration is in `freebuff/bunconfig.js`:

```javascript
export default {
  // Runtime settings
  timeout: 30000,
  maxBufferSize: 1024 * 1024,
}
```

## Windows Launcher

On Windows, use the included launcher:

```bash
freebuff/start.bat
```

## Configuration Files Summary

| File | Purpose |
|------|---------|
| `.env` | API keys and secrets |
| `inference.json` | Main configuration |
| `models.js` | Model definitions |
| `content-filter.conf` | Content filter settings |
| `bunconfig.js` | Runtime configuration |
| `custom-agents.json` | Custom agent definitions |
| `token-balance.json` | Token usage tracking |

## Environment-Specific Settings

### Development

```bash
# Use faster models for development
AIGENEV7_DEFAULT_MODEL=deepseek-v4-flash

# Enable verbose logging
DEBUG=true
```

### Production

```bash
# Use most capable models
AIGENEV7_DEFAULT_MODEL=deepseek-v4-pro

# Disable debug output
DEBUG=false

# Set reasonable limits
AIGENEV7_MAX_TOKENS=4096
```

### Local/Ollama

```bash
# Use local models
AIGENEV7_DEFAULT_MODEL=ollama
OLLAMA_API_KEY=ollama

# No external API calls
DEEPSEEK_API_KEY=
OPENAI_API_KEY=
```

---

*See [Models](Models) for available models and [Getting Started](Getting-Started) for initial setup.*
