---
title: AIGENEV7 — Documentation
description: AIGENEV7 - Free AI Coding Agent. All models unlocked, no subscription, no censorship.
---

# 🚀 AIGENEV7 Documentation

Welcome to the AIGENEV7 documentation. AIGENEV7 is a free, local-first AI coding agent that supports **10+ LLM providers** and **28+ models** with no subscription required.

> **Quick links:** [GitHub Repo](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED) · [Landing Page](https://constanza8999.github.io/aigenev7.com/) · [Download v7.0.0](https://github.com/constanza8999/aigenev7.com/releases/tag/v7.0.0)

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Supported Models](#supported-models)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Contributor Rewards](#contributor-rewards)
- [Security](#security)

---

## 🚀 Quick Start

### 1. Get API Keys

| Provider | Sign Up | Best For |
|----------|---------|----------|
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com/) | Best balance of speed & quality |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/) | GPT-4o, GPT-5, o3, o4-mini |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) | Claude Sonnet 4, Opus 4, Fable 5 |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/) | Gemini 2.5 Pro (free tier) |
| **NVIDIA NIM** | [build.nvidia.com](https://build.nvidia.com/) | Free tier available |
| **OpenRouter** | [openrouter.ai](https://openrouter.ai/) | 200+ models through one API |

### 2. Start the API Server

```bash
bun local-api-server.js
```

### 3. Launch AIGENEV7

```bash
CODEBUFF_API_KEY=local-dev-key CODEBUFF_APP_URL=http://localhost:3457 ./aigenev7.exe
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Multi-Model** | DeepSeek, OpenAI, Anthropic, Google, Grok, Kimi, MiMo, MiniMax, NVIDIA, OpenRouter |
| 💻 **100% Local** | Your code never leaves your machine |
| 🔥 **Unlimited** | No token limits, rate limits, or session caps |
| 🚫 **Uncensored** | No filters, no restrictions |
| 🛠️ **Full Agent** | Edits files, runs commands, searches code, browses web |
| 🎨 **Beautiful TUI** | Terminal UI with syntax highlighting |
| 🔑 **No Subscription** | Just bring your own API key |

---

## 🤖 Supported Models

### 🟢 Configured & Tested ✅

| Model ID | Model | Provider | Description |
|----------|-------|----------|-------------|
| `nvidia-llama-3.1-8b` | Llama 3.1 8B | NVIDIA | ✅ Meta Llama 3.1 8B via NIM |
| `nvidia-llama-3.1-70b` | Llama 3.1 70B | NVIDIA | ✅ Meta Llama 3.1 70B via NIM |
| `nvidia-llama-3.1-405b` | Llama 3.1 405B | NVIDIA | ✅ Meta Llama 3.1 405B via NIM |
| `nvidia-nemotron-4-340b` | Nemotron 4 340B | NVIDIA | ✅ NVIDIA Nemotron via NIM |
| `nvidia-mistral-large` | Mistral Large | NVIDIA | ✅ Mistral Large via NIM |
| `deepseek-v4-pro` | DeepSeek V4 Pro | DeepSeek | ✅ Smartest general reasoning |
| `deepseek-v4-flash` | DeepSeek V4 Flash | DeepSeek | ✅ Smart & Fast |
| `deepseek-chat` | DeepSeek Chat | DeepSeek | ✅ General purpose |
| `deepseek-reasoner` | DeepSeek Reasoner | DeepSeek | ✅ Chain-of-thought reasoning |
| `fable-5` | Fable 5 | Anthropic | ✅ Smartest & Multimodal |
| `claude-sonnet-4` | Claude Sonnet 4 | Anthropic | ✅ Premium reasoning |
| `claude-opus-4` | Claude Opus 4.1 | Anthropic | ✅ Maximum intelligence |
| `claude-sonnet-4.5` | Claude Sonnet 4.5 | Anthropic | ✅ Balanced power & speed |
| `claude-haiku-3.5` | Claude 3.5 Haiku | Anthropic | ✅ Fast & affordable |
| `gemini-2.5-pro` | Gemini 2.5 Pro | Google | ✅ Google flagship reasoning |
| `gemini-2.5-flash` | Gemini 2.5 Flash | Google | ✅ Fast Google AI |
| `gpt-5` | GPT-5 | OpenAI ¹ | ✅ Latest flagship |
| `gpt-4.1` | GPT-4.1 | OpenAI ¹ | ✅ Strong general reasoning |
| `gpt-4o` | GPT-4o | OpenAI ¹ | ✅ Omni modal |
| `gpt-4o-mini` | GPT-4o Mini | OpenAI ¹ | ✅ Fast & cheap |
| `o3` | O3 | OpenAI ¹ | ✅ Deep reasoning |
| `o3-mini` | O3 Mini | OpenAI ¹ | ✅ Fast reasoning |
| `o4-mini` | O4 Mini | OpenAI ¹ | ✅ Multimodal reasoning |
| `o3-pro` | O3 Pro | OpenAI ¹ | ✅ Maximum reasoning |
| `openrouter-claude-sonnet-4.5` | OR Claude Sonnet 4.5 | OpenRouter | ✅ Sonnet 4.5 via OR |
| `openrouter-gpt-5` | OR GPT-5 | OpenRouter | ✅ GPT-5 via OR |
| `openrouter-gemini-2.5-pro` | OR Gemini 2.5 Pro | OpenRouter | ✅ Gemini 2.5 Pro via OR |

> ¹ OpenAI models are routed through **OpenRouter** using the OpenRouter API key.

### ⏳ Need API Key

| Model ID | Model | Provider | Description |
|----------|-------|----------|-------------|
| `grok-4` | Grok 4 | xAI | ⏳ xAI flagship — needs `XAI_API_KEY` |
| `kimi-k2.6` | Kimi K2.6 | Moonshot | ⏳ Balanced general purpose — needs `MOONSHOT_API_KEY` |
| `mimo-v2.5-pro` | MiMo 2.5 Pro | MiMo | ⏳ Deep thinking — needs `MIMO_API_KEY` |
| `mimo-v2.5` | MiMo 2.5 | MiMo | ⏳ Multimodal — needs `MIMO_API_KEY` |
| `minimax-m3` | MiniMax M3 | MiniMax | ⏳ Smartest & fastest — needs `MINIMAX_API_KEY` |
| `minimax-m2.7` | MiniMax M2.7 | MiniMax | ⏳ Fast legacy — needs `MINIMAX_API_KEY` |

**Total: 33 models — 27 configured ✅ · 6 need keys ⏳**

To enable all models, add the corresponding API key to your `.env` file (see [Configuration](#%EF%B8%8F-configuration) below).

---

## 🛠️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AIGENEV7_DEFAULT_MODEL` | `nvidia-llama-3.1-8b` | Default LLM model |
| `AIGENEV7_API_PORT` | `3457` | Local API server port |
| `CODEBUFF_API_KEY` | `local-dev-key` | Auth key for local mode |

### API Keys

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

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│                  │     │                     │     │              │
│  AIGENEV7 CLI    │────▶│  Local API Server   │────▶│  LLM APIs    │
│  (aigenev7.exe)  │     │  (Bun - :3457)      │     │  (DeepSeek,  │
│                  │◀────│  inference.js        │◀────│  OpenAI, etc)│
│  Terminal UI     │     │                     │     │              │
└──────────────────┘     └─────────────────────┘     └──────────────┘
```

---

## 🌟 Contributor Rewards

AIGENEV7 rewards contributors with recognition and perks:

| Tier | Points | Key Rewards |
|------|--------|-------------|
| 🥉 Bronze | 25+ | Name in CONTRIBUTORS.md, badge |
| 🥈 Silver | 100+ | Priority issues, early access, voting |
| 🥇 Gold | 500+ | Roadmap input, private chat |
| 💎 Diamond | 2K+ | Direct line to maintainer |
| 👑 Legend | 10K+ | Maintainer access, co-creator credit |

👉 **[View the full guide →](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/blob/main/CONTRIBUTING.md)**

---

## 🔒 Security

Report vulnerabilities privately via [GitHub Security Advisories](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/security/advisories/new).

---

## 📥 Download

| Asset | Size | Link |
|-------|------|------|
| aigenev7-v7.0.0.exe | ~124 MB | [Download](https://github.com/constanza8999/aigenev7.com/releases/download/v7.0.0/aigenev7-v7.0.0.exe) |
| Full Package (tar.gz) | ~47 MB | [Download](https://github.com/constanza8999/aigenev7.com/releases/download/v7.0.0/aigenev7-v7.0.0-package.tar.gz) |

---

<div align="center">
  <p>Built by <strong>CONSTANZA</strong> — <a href="https://github.com/constanza8999">@constanza8999</a></p>
  <p><a href="https://github.com/constanza8999/aigenev7.com">AIGENEV7</a> — Free AI for everyone. Free forever.</p>
</div>
