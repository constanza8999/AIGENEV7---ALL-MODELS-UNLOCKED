# AIGENEV7 🚀

**The ultimate free AI coding agent — unlimited, uncensored, all models.**

> **Developed by CONSTANZA (José Jaime Juliá).** Forked from the Freebuff/Codebuff engine.

AIGENEV7 is a free, open-source AI coding assistant that runs in your terminal. Describe what you want, and AIGENEV7 edits your code. No subscription. No credits. No configuration. No censorship.

## Features

### 🔥 Unlimited Usage
- **No token limits** — `max_tokens: Infinity`
- **No rate limits** — unrestricted streaming
- **No session caps** — code as long as you want
- **No daily quotas** — truly unlimited

### 🚫 Uncensored
- **No content filters** — full freedom
- **No safety classifiers** — pure model output
- **No output restrictions** — complete creative control

### 🌐 All Models
| Model | Provider | Description |
|-------|----------|-------------|
| **Fable 5** | Anthropic (Claude) | Smartest & Multimodal |
| **DeepSeek V4 Pro** | DeepSeek | Smartest general reasoning |
| **DeepSeek V4 Flash** | DeepSeek | Smart & Fast |
| **Kimi K2.6** | Moonshot AI | Balanced general purpose |
| **MiMo 2.5 Pro** | MiMo | Smartest & Slow (deep thinking) |
| **MiMo 2.5** | MiMo | Multimodal |
| **MiniMax M3** | MiniMax | Smartest & Fastest |
| **MiniMax M2.7** | MiniMax | Fastest (legacy) |
| **GLM 5.2** | Z.ai (Fireworks) | Unlock by referring friends |
| **GPT-4o, GPT-4.1** | OpenAI | Industry standard |
| **Claude Sonnet 4, Opus 4** | Anthropic | Premium reasoning |
| **Gemini 2.5 Pro, Flash** | Google | Google-grade AI |
| **Grok 4** | xAI | X/Twitter AI |
| **Ollama** | Local | Run models on your own hardware |

### 🛠️ All Features
- **File editing** — Create, modify, delete files with natural language
- **Terminal commands** — Run bash, analyze output, fix errors
- **Web search** — Browse the live internet for answers
- **Code search** — Find relevant code across your project
- **Git integration** — Smart commits, diffs, branching
- **Multi-file editing** — Coordinate changes across dozens of files
- **Agent orchestration** — Spawn specialized sub-agents for complex tasks
- **Anything** — Unrestricted, uncensored task execution

## Quick Start

### Install

```bash
# Via npm (recommended)
npm install -g aigenev7

# Or download the binary from releases
# https://github.com/CONSTANZA/aigenev7/releases
```

### Usage

```bash
# Start an AIGENEV7 session in your project
cd ~/my-project
aigenev7

# Start with a specific model
aigenev7 --model fable-5

# Run a quick command
aigenev7 "explain this codebase"

# Start in bash mode
aigenev7 --bash
```

### Direct Inference (without full CLI)

```bash
# Run a single inference query
bun run inference.js "Your prompt here" --model deepseek-v4-pro

# List available models
bun run inference.js --list-models

# Stream output
bun run inference.js "Write a poem" --stream

# Uncensored mode (default)
bun run inference.js "Explain controversial topic" --uncensored
```

## Architecture

```
aigenev7/
├── inference.js          # Multi-model inference engine
├── inference.json        # Model configuration & defaults
├── inference-cli.js      # Dedicated CLI entry point
├── models.js             # Model catalog
├── bunconfig.js          # Runtime configuration
├── content-filter.conf   # Content filter settings
├── start.bat             # Windows launcher
│
├── web/                  # Web interface
│   └── index.html        # Landing page
│
└── cli/                  # CLI build & release
    ├── build.js          # Build script
    └── release/          # npm package files
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
# At least ONE provider key is required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
OPENROUTER_API_KEY=sk-or-...

# Optional settings
AIGENEV7_DEFAULT_MODEL=deepseek-v4-pro
AIGENEV7_MAX_TOKENS=infinity
AIGENEV7_UNCENSORED=true
AIGENEV7_STREAM=true
```

### inference.json

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

## Building from Source

```bash
# Clone the repository
git clone https://github.com/CONSTANZA/aigenev7.git
cd aigenev7

# Install dependencies
bun install

# Build the AIGENEV7 binary
bun run build:aigenev7

# Or build for development
bun run build:aigenev7:dev
```

## Comparison

| Feature | AIGENEV7 | Codebuff | Freebuff | Claude Code |
|---------|----------|----------|----------|-------------|
| **Price** | Free | Paid | Free (ads) | Paid |
| **Token Limit** | Unlimited | 200K | 200K | 200K |
| **Content Filter** | None | Standard | Standard | Heavy |
| **Models** | All | Premium | Limited | Claude only |
| **Rate Limits** | None | Yes | Yes | Yes |
| **Ads** | No | No | Yes | No |
| **Local Models** | Yes | No | No | No |

## License

MIT — Free for any use, commercial or otherwise.

---

**AIGENEV7** — Built by CONSTANZA (José Jaime Juliá). Free AI for everyone.
