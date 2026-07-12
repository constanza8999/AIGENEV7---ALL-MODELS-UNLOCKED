# Getting Started

## Installation

### Option 1: npm (Recommended)

```bash
npm install -g aigenev7
```

### Option 2: Download Binary

Download the latest release from [GitHub Releases](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/releases).

### Option 3: Build from Source

```bash
# Clone the repository
git clone https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED.git
cd AIGENEV7---ALL-MODELS-UNLOCKED

# Install dependencies
bun install

# Build the AIGENEV7 binary
bun run build:aigenev7
```

## Configuration

### 1. Set Up Your API Key

Copy `.env.example` to `.env` in the `freebuff/` directory:

```bash
cp freebuff/.env.example freebuff/.env
```

Edit `.env` and add at least **one** API key:

```bash
# Free options (no credit card required!)
DEEPSEEK_API_KEY=sk-...          # Free tier available
OPENROUTER_API_KEY=sk-or-...     # Free tier available

# Paid options
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Local (no API key needed!)
OLLAMA_API_KEY=ollama
```

### 2. Get Your Free API Keys

| Provider | Free Tier? | Sign Up URL |
|----------|------------|-------------|
| **DeepSeek** | ✅ Yes | https://platform.deepseek.com |
| **OpenRouter** | ✅ Yes | https://openrouter.ai/keys |
| **Moonshot** | ✅ Yes | https://platform.moonshot.cn |
| **xAI (Grok)** | ✅ Yes | https://console.x.ai |
| **Ollama** | ✅ Yes (Local) | https://ollama.com/ |
| OpenAI | ❌ No | https://platform.openai.com |
| Anthropic | ❌ No | https://console.anthropic.com |
| Google | ❌ No | https://ai.google.dev |

## First Run

### Interactive Mode

```bash
# Navigate to your project
cd ~/my-project

# Start AIGENEV7
aigenev7
```

### Quick Commands

```bash
# Start with a specific model
aigenev7 --model deepseek-v4-pro

# Ask a quick question
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
```

## What You Can Do

Once AIGENEV7 is running, you can:

1. **Edit files** — "Add error handling to server.js"
2. **Search code** — "Find all functions that use the database"
3. **Run commands** — "Run the test suite and fix any failures"
4. **Create files** — "Create a new React component for user profiles"
5. **Debug issues** — "Why is this API returning 500 errors?"
6. **Refactor code** — "Refactor this class to use dependency injection"
7. **Write documentation** — "Generate a README for this module"
8. **Use agents** — `/agent quantum-dev "help me write a quantum circuit"`

## Next Steps

- [Models](Models) — Learn about all available AI models
- [Commands](Commands) — Full CLI command reference
- [Auto Agent](Auto-Agent) — Autonomous coding with 17 tools
- [Defensive-Offensive Framework](Defensive-Offensive-Framework) — Specialized agent personas

---

*Having issues? Check the [Configuration](Configuration) page or open a [GitHub Issue](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/issues).*
