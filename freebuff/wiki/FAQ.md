# Frequently Asked Questions

Common questions and troubleshooting tips for AIGENEV7.

## General

### What is AIGENEV7?

AIGENEV7 is a free, open-source AI coding assistant that runs in your terminal. It supports 15+ AI models from multiple providers, including free options like DeepSeek and Ollama (local). No subscription, no credits, no censorship.

### Is AIGENEV7 really free?

Yes! The core product is completely free with:
- Unlimited token usage (`max_tokens: Infinity`)
- No rate limits
- No session caps
- No daily quotas
- Uncensored mode (no content filters)

Premium tiers are optional and provide additional features like agent export/import and premium model access.

### How is this different from Claude Code or ChatGPT?

| Feature | AIGENEV7 | Claude Code | ChatGPT |
|---------|----------|-------------|---------|
| Price | Free | $20/mo | $20/mo |
| Token limit | Unlimited | 200K | Varies |
| Content filter | None | Heavy | Standard |
| Models | 15+ | Claude only | GPT only |
| Rate limits | None | Yes | Yes |
| Local models | Yes (Ollama) | No | No |
| Terminal UI | Yes | Yes | No |

### What models are supported?

See the [Models](Models) page for the full list. Key models include:
- DeepSeek V4 Pro (free, smart)
- Fable 5 / Claude Sonnet 4 (multimodal)
- GPT-4o, GPT-5 (OpenAI)
- Gemini 2.5 Pro (Google)
- Ollama (local, free)

---

## Installation & Setup

### How do I install AIGENEV7?

```bash
npm install -g aigenev7
```

See the [CLI Installation Guide](CLI-Installation-Guide) for detailed instructions.

### "Command not found" after installation

Add AIGENEV7 to your PATH:

```bash
# Find npm global bin directory
npm root -g

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$(npm root -g)/../bin:$PATH"

# Reload shell
source ~/.bashrc
```

### "API key not set" error

Ensure your `.env` file is in the `freebuff/` directory:

```bash
# Copy the example file
cp freebuff/.env.example freebuff/.env

# Edit with your API key
nano freebuff/.env
```

At least one API key is required. See [Getting Started](Getting-Started) for free API key options.

### How do I get a free API key?

| Provider | URL | Free Tier |
|----------|-----|-----------|
| DeepSeek | https://platform.deepseek.com | ✅ Yes |
| OpenRouter | https://openrouter.ai/keys | ✅ Yes |
| Moonshot | https://platform.moonshot.cn | ✅ Yes |
| xAI (Grok) | https://console.x.ai | ✅ Yes |
| Ollama | https://ollama.com/ | ✅ Local |

### How do I use Ollama (local models)?

1. Install Ollama: https://ollama.com/download
2. Pull a model: `ollama pull llama3.2`
3. Set `OLLAMA_API_KEY=ollama` in your `.env`
4. Use: `aigenev7 --model ollama`

---

## Usage

### How do I switch models?

```bash
# Via CLI flag
aigenev7 --model deepseek-v4-pro

# Via chat command
/model fable-5

# List all models
/model list
```

### How do I use agents?

```bash
# List all agents
/agent

# Use a specific agent
/agent quantum-dev Help me write a quantum circuit

# Use a framework agent
/defensive security-auditor Review this code for vulnerabilities
```

### How do I run the Auto Agent?

```bash
# Start auto agent with a task
/auto Add error handling to server.js

# Check status
/auto-status

# Stop
/auto-stop
```

### How do I save code snippets?

```bash
# Save a snippet
/snippet save "React Button" --lang=jsx --tags=react,ui

# List all snippets
/snippet list

# Search snippets
/snippet search "button"

# Insert a snippet
/snippet "React Button"
```

### How do I check my token balance?

```
/balance
```

This shows your current tier, token usage, and remaining balance.

---

## Troubleshooting

### Command fails with "Provider not configured"

**Cause:** The model requires an API key that isn't set.

**Solution:** Add the required API key to `freebuff/.env`:
```bash
# For DeepSeek
DEEPSEEK_API_KEY=sk-...

# For OpenAI
OPENAI_API_KEY=sk-...

# For Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### "Rate limit exceeded" error

**Cause:** Provider is rate-limiting your requests.

**Solutions:**
1. Wait a few minutes and retry
2. Switch to a different model: `/model deepseek-v4-flash`
3. Use a free provider like DeepSeek or Ollama
4. AIGENEV7 has automatic retry with backoff

### "Model not found" error

**Cause:** The model ID doesn't exist or isn't configured.

**Solutions:**
```bash
# List available models
/model list

# Use a known model
/model deepseek-v4-pro
```

### CLI is slow to respond

**Causes & Solutions:**
1. **Large context** — Reduce context with `/context clear`
2. **Slow model** — Switch to a faster model like `deepseek-v4-flash`
3. **Network issues** — Check your internet connection
4. **Provider overload** — Try a different provider

### Auto Agent gets stuck

**Solutions:**
1. Press `Ctrl+C` to stop
2. Use `/auto-stop`
3. Reduce `maxIterations` in the API call
4. Check if the task is too complex — break it into smaller steps

### "Connection refused" with Ollama

**Cause:** Ollama isn't running.

**Solution:**
```bash
# Start Ollama
ollama serve

# Or run a model (starts server automatically)
ollama run llama3.2
```

### Web interface not loading

**Solutions:**
1. Ensure the server is running: `bun freebuff/local-api-server.js`
2. Check the port: `http://localhost:3457`
3. Try a different port: `AIGENEV7_API_PORT=8080 bun freebuff/local-api-server.js`
4. Check firewall settings

### Git push fails

**Cause:** Authentication or permission issues.

**Solutions:**
```bash
# Check remote URL
git remote -v

# Update credentials
git remote set-url origin https://<token>@github.com/user/repo.git

# Or use SSH
git remote set-url origin git@github.com:user/repo.git
```

### Wiki sync workflow fails

**Cause:** `WIKI_PAT` secret not configured.

**Solution:**
1. Create a PAT at https://github.com/settings/tokens
2. Add as repository secret named `WIKI_PAT`
3. See [Configuration](Configuration) for details

---

## Features

### Does AIGENEV7 support images?

Yes! Models with `multimodal: true` support images:
- Fable 5
- GPT-4o, GPT-5
- Claude Sonnet 4, Opus 4
- Gemini 2.5 Pro, Flash
- MiMo 2.5

### Does AIGENEV7 support code execution?

Yes! The Auto Agent can execute terminal commands:
```bash
/auto Run the test suite and fix any failures
```

The Debug Agent automatically runs commands and fixes errors:
```bash
/debug bun run build
```

### Can I create custom agents?

Yes! Use `/agent-new` to create custom agents:
```bash
/agent-new
# Enter name, description, and system prompt
```

Or use the API:
```javascript
import { createAgent } from './custom-agents.js'

createAgent(
  'my-expert',
  'My Expert',
  'Does something specific',
  'You are an expert in...'
)
```

### Can I export/import agents?

With Pro tier:
```bash
/agent-export my-agent
/agent-import my-agent.json
```

### How does the Defensive/Offensive framework work?

The framework provides 18 specialized AI personas:
- **Defensive (Blue Team):** Security, testing, compliance, validation
- **Offensive (Red Team):** Optimization, generation, migration, deployment

```bash
/defensive security-auditor Review this code
/offensive code-optimizer Optimize this function
/framework List all framework agents
```

---

## Advanced

### How do I run AIGENEV7 as a local API server?

```bash
bun freebuff/local-api-server.js

# Custom port
bun freebuff/local-api-server.js --port 8080
```

The server provides OpenAI-compatible endpoints at `http://localhost:3457`.

### How do I use the quantum simulator?

```bash
/quantum run H(0) CNOT(0,1)
```

Or use the quantum agent for complex circuits:
```bash
/agent quantum-dev Help me implement Shor's algorithm
```

### How do I configure content filtering?

In `freebuff/inference.json`:
```json
{
  "content_filter": {
    "enabled": false,
    "safety_checkers": false
  }
}
```

Set `enabled: true` to enable content filtering.

### How do I set up the wiki auto-sync workflow?

1. Initialize the wiki on GitHub (create first page)
2. Create a PAT with `repo` scope
3. Add as repository secret `WIKI_PAT`
4. Push changes to `freebuff/wiki/`

See [Configuration](Configuration) for details.

---

## Getting Help

- **Documentation:** See the [Wiki](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/wiki)
- **Issues:** [GitHub Issues](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/issues)
- **Discussions:** [GitHub Discussions](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/discussions)

---

*Have a question not answered here? Open a [GitHub Issue](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/issues).*
