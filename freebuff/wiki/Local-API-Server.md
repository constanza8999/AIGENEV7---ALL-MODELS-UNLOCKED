# Local API Server

AIGENEV7 includes a built-in local API server that implements OpenAI-compatible endpoints, allowing you to run the AIGENEV7 binary without any cloud backend.

## Overview

The local API server:
- 🏠 Runs entirely on your machine
- 🔑 Uses your locally configured API keys
- 🔄 Proxies LLM calls through `inference.js`
- 🚀 No Google login or Codebuff backend required
- 📡 OpenAI-compatible API format

## Quick Start

### Start the Server

```bash
bun freebuff/local-api-server.js
```

Or with a custom port:

```bash
bun freebuff/local-api-server.js --port 3457
```

### Run the CLI Against It

```bash
CODEBUFF_API_KEY=local-dev-key \
CODEBUFF_APP_URL=http://localhost:3457 \
./freebuff.exe
```

## API Endpoints

### POST /api/v1/chat/completions

Main inference endpoint (OpenAI-compatible).

**Request:**
```json
{
  "model": "deepseek-v4-pro",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "stream": false,
  "max_tokens": 4096,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "model": "deepseek-v4-pro",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

### Streaming (SSE)

Set `"stream": true` for Server-Sent Events:

```json
{
  "model": "deepseek-v4-pro",
  "messages": [...],
  "stream": true
}
```

Response format:
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":"!"}}]}
data: [DONE]
```

### GET /api/v1/me

Returns user info.

```json
{
  "id": "local-user",
  "name": "Local User",
  "email": "local@aigenev7.ai"
}
```

### POST /api/v1/usage

Returns usage stats.

```json
{
  "type": "usage-response",
  "usage": 0,
  "remainingBalance": 999999
}
```

### POST /api/v1/token-count

Estimates token count for messages.

```json
{
  "messages": [...],
  "system": "...",
  "tools": [...]
}
```

**Response:**
```json
{
  "inputTokens": 150
}
```

### GET /health

Health check endpoint.

```json
{
  "status": "ok",
  "version": "7.0.0-local",
  "server": "AIGENEV7 Local API Server"
}
```

## Model Mapping

The server automatically maps OpenRouter-style model IDs to local model IDs:

| Requested | Mapped To |
|-----------|-----------|
| `deepseek/deepseek-chat` | `deepseek-v4-pro` |
| `openai/gpt-4o` | `gpt-4o` |
| `anthropic/claude-sonnet-4` | `claude-sonnet-4` |
| `google/gemini-2.5-pro` | `gemini-2.5-pro` |

## Configuration

### Environment Variables

```bash
# Server port (default: 3457)
AIGENEV7_API_PORT=3457

# Default model
AIGENEV7_DEFAULT_MODEL=deepseek-v4-pro

# API key for CLI authentication
CODEBUFF_API_KEY=local-dev-key
```

### .env File

The server automatically loads `.env` from the `freebuff/` directory.

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Local API Server                       │
├─────────────────────────────────────────────────┤
│  HTTP Request                                    │
│       ↓                                          │
│  Route Handler (OpenAI-compatible)               │
│       ↓                                          │
│  Model ID Mapping                                │
│       ↓                                          │
│  inference.js (multi-provider)                   │
│       ↓                                          │
│  Provider API (DeepSeek, OpenAI, etc.)           │
└─────────────────────────────────────────────────┘
```

## Use Cases

1. **Local development** — Test without cloud dependencies
2. **Offline mode** — Use with Ollama for fully local inference
3. **Custom integrations** — Any OpenAI-compatible client works
4. **Privacy** — All data stays on your machine

---

*See [Configuration](Configuration) for environment settings and [Models](Models) for available AI models.*
