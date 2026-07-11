<div align="center">
  <img src="freebuff/web/icon.png" width="120" alt="AIGENEV7 Logo">

  # 🚀 AIGENEV7

  **Free AI Coding Agent — All Models Unlocked. No Subscription. No Censorship.**

  [![GitHub release](https://img.shields.io/badge/version-7.0.0-00ff88?style=flat-square&logo=github)](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/releases)
  [![License](https://img.shields.io/badge/license-MIT-8855ff?style=flat-square)](LICENSE)
  [![GitHub](https://img.shields.io/badge/by-constanza8999-ff4466?style=flat-square&logo=github)](https://github.com/constanza8999)
  [![Release](https://img.shields.io/badge/download-EXE-00ccff?style=flat-square)](https://github.com/constanza8999/aigenev7.com/releases/tag/v7.0.0)

  ---

  **AIGENEV7** is a powerful AI coding assistant that runs entirely on your machine. Connect it to your preferred LLM provider and get full coding agent capabilities — without paying monthly fees.

  🔥 **Unlimited** · 🚫 **Uncensored** · 🌐 **All Models** · ⚡ **Zero Config** · 🔓 **Open Source**

  ---

  <p align="center">
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-supported-models">Models</a> •
    <a href="#-configuration">Configuration</a> •
    <a href="#-contributor-rewards">Contributor Rewards</a> •
    <a href="#-download">Download</a>
  </p>

  ---
</div>

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Multi-Model AI Agent** | DeepSeek, OpenAI, Anthropic, Google, Grok, Kimi, MiMo, MiniMax, NVIDIA, OpenRouter — 10+ providers |
| 💻 **100% Local** | Everything runs on your machine. Your code never leaves your computer |
| 🔥 **Unlimited Usage** | No token limits, no rate limits, no session caps. Code as long as you want |
| 🚫 **Uncensored** | No content filters, no safety classifiers, no output restrictions |
| 🛠️ **Full Agent Capabilities** | Edits files, runs terminal commands, searches code, browses the web |
| 🎨 **Beautiful TUI** | Terminal UI with syntax highlighting, diffs, interactive elements, and typing animations |
| 🌐 **Web UI** | Built-in web interface at `http://localhost:3457` |
| 🔑 **No Subscription** | Just bring your own API keys — free forever |
| 📦 **Single Binary** | One executable file, no dependencies to install |

## 🚀 Quick Start

### 1. Get API Keys

Pick at least one provider and get your API key:

| Provider | Sign Up | Recommended For |
|----------|---------|-----------------|
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com/) | Best balance of speed & quality |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/) | GPT-4o, GPT-5, o3, o4-mini |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) | Claude Sonnet 4, Opus 4, Fable 5 |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/) | Gemini 2.5 Pro (free tier available) |
| **NVIDIA NIM** | [build.nvidia.com](https://build.nvidia.com/) | Free tier available |
| **OpenRouter** | [openrouter.ai](https://openrouter.ai/) | Access 200+ models through one API |

### 2. Set Up Environment

Create a `.env` file next to the binary with your API key:

```env
# Pick at least one:
DEEPSEEK_API_KEY=sk-your-deepseek-key-here
# OPENAI_API_KEY=sk-your-openai-key-here
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
# GOOGLE_API_KEY=your-google-key-here

# Optional: Choose your default model
AIGENEV7_DEFAULT_MODEL=deepseek-v4-flash
```

### 3. Start the API Server

```bash
bun freebuff/local-api-server.js
```

You'll see:
```
  ╔══════════════════════════════════════════════╗
  ║     AIGENEV7 Local API Server v7.0.0        ║
  ╚══════════════════════════════════════════════╝
  🚀  Server:  http://localhost:3457
  🔑  Token:   local-dev-key
  🤖  Model:   deepseek-v4-flash
```

### 4. Launch AIGENEV7

Open a **new terminal** and run:

```bash
CODEBUFF_API_KEY=local-dev-key CODEBUFF_APP_URL=http://localhost:3457 ./aigenev7.exe
```

You're in! Start coding with AI.

### 🎯 Example Usage

```bash
# Build something
"Create a Python script that fetches weather data from an API"

# Explore a new codebase
"Explain how this project is structured"

# Refactor code
"Refactor this function to use async/await"

# Debug issues
"Find the bug in this authentication flow"

# Install dependencies
"Set up a React project with Tailwind and routing"
```

## 🤖 Supported Models

| Model | Provider | Best For |
|-------|----------|----------|
| **Fable 5** | Anthropic | Smartest & multimodal |
| **DeepSeek V4 Pro** | DeepSeek | Best overall balance |
| **DeepSeek V4 Flash** | DeepSeek | Fastest option |
| **DeepSeek Reasoner** | DeepSeek | Deep reasoning (chain-of-thought) |
| **GPT-5** | OpenAI | Latest flagship |
| **GPT-4o** | OpenAI | Fast & capable |
| **o3-mini / o4-mini** | OpenAI | Fast reasoning |
| **Claude Sonnet 4** | Anthropic | Excellent coding |
| **Claude Opus 4** | Anthropic | Deep reasoning |
| **Claude Haiku 3.5** | Anthropic | Fast & cheap |
| **Gemini 2.5 Pro** | Google | Strong all-around |
| **Gemini 2.5 Flash** | Google | Fast & free tier |
| **Grok 4** | xAI | Uncensored by design |
| **Kimi K2.6** | Moonshot | Long contexts |
| **MiMo 2.5 Pro** | MiMo | Deep thinking |
| **MiniMax M3** | MiniMax | Smartest & fastest |
| **OpenRouter** | — | 200+ models via one API |
| **Ollama** | Local | Run on your hardware |

## 🛠️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AIGENEV7_DEFAULT_MODEL` | `nvidia-llama-3.1-8b` | Default LLM model |
| `AIGENEV7_API_PORT` | `3457` | Local API server port |
| `CODEBUFF_API_KEY` | `local-dev-key` | Auth key for local mode |
| `CODEBUFF_APP_URL` | — | API server URL (`http://localhost:3457`) |

### API Keys (set at least one)

| Variable | Provider |
|----------|----------|
| `DEEPSEEK_API_KEY` | DeepSeek |
| `OPENAI_API_KEY` | OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic Claude |
| `GOOGLE_API_KEY` | Google Gemini |
| `NVIDIA_API_KEY` | NVIDIA NIM |
| `XAI_API_KEY` | xAI Grok |
| `MOONSHOT_API_KEY` | Moonshot (Kimi) |
| `MIMO_API_KEY` | MiMo |
| `MINIMAX_API_KEY` | MiniMax |
| `OPENROUTER_API_KEY` | OpenRouter |

## 🏗️ Architecture

```
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│                  │     │                     │     │              │
│  AIGENEV7 CLI    │────▶│  Local API Server   │────▶│  LLM APIs    │
│  (aigenev7.exe)  │     │  (Bun - :3457)      │     │  (DeepSeek,  │
│                  │◀────│  inference.js        │◀────│  OpenAI, etc)│
│  Terminal UI     │     │                     │     │              │
│  Tool Execution  │     │  models.js          │     │              │
└──────────────────┘     └─────────────────────┘     └──────────────┘
```

## 🌟 Contributor Rewards

AIGENEV7 has a **contribution-based rewards system**. Earn points by contributing and unlock tiers with recognition and perks:

| Tier | Points | Key Rewards |
|------|--------|-------------|
| 🥉 **Bronze** | 25+ | Name in CONTRIBUTORS.md, badge |
| 🥈 **Silver** | 100+ | Priority issues, early access, feature voting |
| 🥇 **Gold** | 500+ | Roadmap input, private core chat |
| 💎 **Diamond** | 2K+ | Direct line to maintainer, priority support |
| 👑 **Legend** | 10K+ | Maintainer access, co-creator credit |

👉 **[Read the full guide →](./CONTRIBUTING.md)**

## 📥 Download

### Latest Release: v7.0.0

| Asset | Size | Link |
|-------|------|------|
| `aigenev7-v7.0.0.exe` | ~124 MB | [⬇️ Download EXE](https://github.com/constanza8999/aigenev7.com/releases/download/v7.0.0/aigenev7-v7.0.0.exe) |
| Full Package (tar.gz) | ~47 MB | [⬇️ Download Package](https://github.com/constanza8999/aigenev7.com/releases/download/v7.0.0/aigenev7-v7.0.0-package.tar.gz) |

The full package includes:
- `aigenev7.exe` + `tree-sitter.wasm` — Standalone binary
- `local-api-server.js` + `inference.js` — API server & inference engine
- `models.js` + `inference.json` — Model catalog (28 models, 10 providers)
- `aigenev7.bat` + `aigenev7-local.bat` — Windows launchers
- `icon.ico` + `generate-icon.js` + `convert-icon.js` — Icon assets
- `web/index.html` + icons — Landing page
- `.env.example` + `README.md` — Setup guide & docs

## 🔒 Security

We take security seriously. See our **[Security Policy](./SECURITY.md)** for vulnerabilities reporting and best practices.

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>
    Built by <strong>CONSTANZA</strong> —
    <a href="https://github.com/constanza8999">@constanza8999</a>
  </p>
  <p>
    <a href="https://github.com/constanza8999/aigenev7.com">AIGENEV7</a> —
    Free AI for everyone. Free forever.
  </p>
  <p>
    <sub>Forked from Freebuff/Codebuff engine — rebuilt for freedom and accessibility.</sub>
  </p>
</div>
