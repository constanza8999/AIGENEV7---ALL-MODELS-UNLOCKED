## AIGENEV7 v7.0.0 — Deployable Package

**Unlimited · Uncensored · All Models**

The ultimate free AI coding agent, packaged as a zero-dependency deployable bundle.

### What's Inside

| File | Description |
|------|-------------|
| `inference.js` | Multi-model inference engine (Anthropic, DeepSeek, OpenAI, Gemini, Grok, OpenRouter, 200+ models) |
| `inference-cli.js` | Dedicated CLI entry point with chat, models, and serve commands |
| `inference.json` | Full model configuration — unlimited tokens, uncensored |
| `models.js` | Catalog of all supported models with provider configs |
| `start.bat` | Windows launcher script |
| `bunconfig.js` | Bun runtime configuration |
| `content-filter.conf` | Uncensored mode settings |
| `.env.example` | API key setup guide |
| `web/index.html` | Web landing page (serve with `inference-cli.js serve`) |

### Quick Start

1. **Extract** the ZIP to any directory
2. **Set API keys** — Copy `.env.example` to `.env` and add at least one provider key:
   ```
   DEEPSEEK_API_KEY=sk-...
   ```
   (or `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`)
3. **Run** the CLI:
   ```bash
   bun inference.js "Your prompt here"
   ```
   or on Windows:
   ```cmd
   start.bat "Your prompt"
   ```

### CLI Commands

```bash
# One-shot prompt
bun inference-cli.js ask "Your question"

# Interactive chat session
bun inference-cli.js chat

# List all available models
bun inference-cli.js models

# Start the web interface
bun inference-cli.js serve --port 3456

# Specify a model
bun inference-cli.js "Write a Python web server" --model fable-5 --no-stream
```

### Requirements

- **Bun** runtime (recommended) or Node.js v18+
- At least one provider API key

### Features

- **Unlimited tokens** — `max_tokens: Infinity`
- **Uncensored** — No content filters, no safety classifiers
- **All models** — Anthropic, DeepSeek, OpenAI, Gemini, Grok, Kimi, MiMo, MiniMax, OpenRouter
- **Streaming** — Real-time streaming output
- **Web interface** — Built-in web server with landing page

### License

MIT
