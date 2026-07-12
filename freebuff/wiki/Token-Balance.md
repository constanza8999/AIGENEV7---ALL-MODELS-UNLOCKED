# Token Balance

AIGENEV7 includes a built-in token tracking system that monitors your API usage across all providers.

## Overview

The token balance system tracks:
- **Tokens used** across all API calls
- **Last reset** timestamp
- **Current tier** (free or premium)

## Storage

Token usage is stored in `freebuff/token-balance.json`:

```json
{
  "used": 15236,
  "lastReset": "2026-07-11T14:15:52.528Z",
  "tier": "free"
}
```

## Viewing Your Balance

### Via CLI Command

```
/balance
```

This displays your current token usage, tier, and when the balance was last reset.

### Via Chat

Just ask:
```
What's my token balance?
How many tokens have I used?
```

## Tiers

| Tier | Token Limit | Features |
|------|-------------|----------|
| **Free** | Unlimited | All models, no restrictions |
| **Premium** | Unlimited | All models, priority support |

> AIGENEV7 is designed to be **truly unlimited** — `max_tokens: Infinity` with no rate limits.

## How Tokens Are Counted

Tokens are counted per API call and include:
- **Input tokens** — Your prompt and system message
- **Output tokens** — The AI's response

### Token Counting by Provider

| Provider | Counting Method |
|----------|-----------------|
| DeepSeek | Per-request token count |
| OpenAI | Standard GPT tokenization |
| Anthropic | Claude tokenization |
| Google | Gemini tokenization |
| Ollama | Local tokenization (no API cost) |

## Rate Limits

AIGENEV7 has **no rate limits** by design:
- No daily token caps
- No requests per minute limits
- No session duration limits
- No cooldown periods

The token balance is for **informational purposes only** — it doesn't block usage.

## API Usage

```javascript
import { readFileSync, writeFileSync, existsSync } from 'fs'

// Read current balance
const balance = JSON.parse(readFileSync('token-balance.json', 'utf8'))
console.log(balance)
// { used: 15236, lastReset: '2026-07-11T...', tier: 'free' }

// Reset balance
balance.used = 0
balance.lastReset = new Date().toISOString()
writeFileSync('token-balance.json', JSON.stringify(balance, null, 2))
```

## Premium Features

Premium users get:
- ✅ All free features
- ✅ Priority support
- ✅ Early access to new models
- ✅ Extended context windows

To upgrade, use the `/pay` command in the CLI.

## Privacy

- Token counts are stored **locally** on your machine
- No usage data is sent to external servers
- You can reset your balance at any time
- Deleting `token-balance.json` resets the counter to zero

---

*See [Configuration](Configuration) for environment settings and [Models](Models) for available AI models.*
