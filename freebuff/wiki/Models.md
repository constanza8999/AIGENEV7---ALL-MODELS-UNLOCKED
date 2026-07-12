# Available Models

AIGENEV7 supports **15+ AI models** from multiple providers, including free, paid, and local options.

## Model List

### Free Models (No Credit Card Required)

| Model | Provider | Speed | Smartness | Multimodal | Description |
|-------|----------|-------|-----------|------------|-------------|
| **DeepSeek V4 Pro** | DeepSeek | Medium | ⭐⭐⭐⭐⭐ | ❌ | Smartest general reasoning |
| **DeepSeek V4 Flash** | DeepSeek | Fast | ⭐⭐⭐⭐ | ❌ | Smart & fast |
| **Kimi K2.6** | Moonshot AI | Medium | ⭐⭐⭐⭐ | ❌ | Balanced general purpose |
| **MiniMax M3** | MiniMax | Fast | ⭐⭐⭐⭐ | ❌ | Smartest & fastest |
| **MiniMax M2.7** | MiniMax | Fast | ⭐⭐⭐ | ❌ | Fastest (legacy) |
| **GLM 5.2** | Z.ai (Fireworks) | Medium | ⭐⭐⭐⭐ | ❌ | Unlock by referring friends |
| **Ollama** | Local | Varies | Varies | ❌ | Run models on your own hardware |

### Premium Models

| Model | Provider | Speed | Smartness | Multimodal | Description |
|-------|----------|-------|-----------|------------|-------------|
| **Fable 5** | Anthropic (Claude) | Medium | ⭐⭐⭐⭐⭐ | ✅ | Smartest & multimodal |
| **MiMo 2.5 Pro** | MiMo | Slow | ⭐⭐⭐⭐⭐ | ❌ | Smartest (deep thinking) |
| **MiMo 2.5** | MiMo | Medium | ⭐⭐⭐⭐ | ✅ | Multimodal |
| **GPT-4o** | OpenAI | Fast | ⭐⭐⭐⭐⭐ | ✅ | Industry standard |
| **GPT-4.1** | OpenAI | Medium | ⭐⭐⭐⭐⭐ | ✅ | Latest OpenAI model |
| **Claude Sonnet 4** | Anthropic | Medium | ⭐⭐⭐⭐⭐ | ✅ | Premium reasoning |
| **Claude Opus 4** | Anthropic | Slow | ⭐⭐⭐⭐⭐ | ✅ | Top-tier reasoning |
| **Gemini 2.5 Pro** | Google | Medium | ⭐⭐⭐⭐⭐ | ✅ | Google-grade AI |
| **Gemini 2.5 Flash** | Google | Fast | ⭐⭐⭐⭐ | ✅ | Fast Google AI |
| **Grok 4** | xAI | Medium | ⭐⭐⭐⭐⭐ | ✅ | X/Twitter AI |

## Switching Models

### Via CLI Flag

```bash
aigenev7 --model deepseek-v4-pro
aigenev7 --model fable-5
aigenev7 --model ollama
```

### Via Chat Command

```
/model deepseek-v4-pro
/model fable-5
/model list
```

### Via Configuration

In `freebuff/inference.json`:

```json
{
  "default_model": "deepseek-v4-pro"
}
```

## Ollama (Local Models)

AIGENEV7 supports running models locally via [Ollama](https://ollama.com/).

### Setup

1. **Install Ollama**: https://ollama.com/download
2. **Pull a model**:
   ```bash
   ollama pull llama3.2
   ollama pull mistral
   ```
3. **Set the API key** in `.env`:
   ```
   OLLAMA_API_KEY=ollama
   ```
4. **Use the model**:
   ```bash
   aigenev7 --model ollama
   ```

### Supported Local Models

Any model available in Ollama works with AIGENEV7, including:
- Llama 3.2
- Mistral
- Phi-3
- CodeLlama
- DeepSeek Coder
- And many more...

## Model Recommendations

| Use Case | Recommended Model |
|----------|-------------------|
| General coding | DeepSeek V4 Pro |
| Quick questions | DeepSeek V4 Flash |
| Complex reasoning | Claude Opus 4 / MiMo 2.5 Pro |
| Multimodal (images) | Fable 5 / GPT-4o |
| Privacy (local only) | Ollama |
| Budget-friendly | DeepSeek V4 Pro (free) |
| Speed-critical | MiniMax M3 |

---

*See the [Configuration](Configuration) page for API key setup instructions.*
