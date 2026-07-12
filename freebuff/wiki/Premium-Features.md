# Premium Features

AIGENEV7 offers a tiered premium system with additional features and higher limits.

## Overview

| Tier | Token Limit | Price | Features |
|------|-------------|-------|----------|
| **Free** | 100M tokens | $0 | Core features |
| **Pro** | 5B tokens | $/mo | + Agent export/import, custom quantum |
| **Elite** | 50B tokens | $/mo | + Premium models, full API access |
| **Enterprise** | 500B tokens | Custom | + Batch inference, priority support |

## Premium Features by Tier

### Free Tier (Default)

All core features are available:
- ✅ All 15+ AI models
- ✅ Unlimited usage (`max_tokens: Infinity`)
- ✅ Uncensored mode
- ✅ Auto Agent with 17 tools
- ✅ Custom agents
- ✅ Defensive/Offensive framework
- ✅ Quantum simulator (demo circuits)
- ✅ Snippets manager
- ✅ Debug agent

### Pro Tier

Everything in Free, plus:
- ✅ Export agents to file (`/agent-export`)
- ✅ Import agents from file (`/agent-import`)
- ✅ Custom quantum circuits (1024+ shots)
- ✅ 5B token allowance

### Elite Tier

Everything in Pro, plus:
- ✅ Premium model access (GPT-4.1, Claude Opus 4, O3 Pro)
- ✅ Full API access
- ✅ 50B token allowance

### Enterprise Tier

Everything in Elite, plus:
- ✅ Batch inference (multi-file processing)
- ✅ 500B token allowance
- ✅ Priority support

## Activating Premium

### Option 1: Environment Variable

```bash
# Set in your .env file
AIGENEV7_PREMIUM_KEY=ag7_pro_your_key_here
```

Key format: `ag7_<tier>_<key>`
- `ag7_pro_xxxxx` — Pro tier
- `ag7_elite_xxxxx` — Elite tier
- `ag7_enterprise_xxxxx` — Enterprise tier

### Option 2: License File

Create `freebuff/premium.lic`:

```
pro:your_key_here
```

Or:

```
elite:your_key_here
```

## Checking Your Status

### Via CLI

```
/balance
```

Shows your current tier, token usage, and remaining balance.

### Via API

```javascript
import { checkPremium, isPremium, getPremiumTier, hasFeature } from './premium.js'

// Check full status
const status = checkPremium()
console.log(status)
// { isPremium: true, tier: 'pro', features: [...], message: '...' }

// Quick boolean check
if (isPremium()) { /* premium user */ }

// Get tier string
const tier = getPremiumTier() // 'free', 'pro', 'elite', or 'enterprise'

// Check specific feature
if (hasFeature('export_agent_file')) {
  // Feature available
}
```

## Token Limits

| Tier | Max Tokens | Reset Period |
|------|------------|--------------|
| Free | 100M | 30 days |
| Pro | 5B | 30 days |
| Elite | 50B | 30 days |
| Enterprise | 500B | 30 days |

Token usage is tracked in `freebuff/token-balance.json` and resets automatically every 30 days.

## Feature Gating

Features are gated by tier using the `PREMIUM_FEATURES` map:

```javascript
export const PREMIUM_FEATURES = {
  export_agent_file: { tier: 'pro', label: 'Export agents to file' },
  import_agent_file: { tier: 'pro', label: 'Import agents from file' },
  custom_quantum: { tier: 'pro', label: 'Custom quantum circuits (1024+ shots)' },
  premium_models: { tier: 'elite', label: 'Premium model access' },
  api_access: { tier: 'elite', label: 'Full API access' },
  batch_inference: { tier: 'enterprise', label: 'Batch inference' },
}
```

## Getting a Premium Key

Use the `/pay` command in the CLI to purchase a premium key.

Or visit: [https://aigenev7.com/premium](https://aigenev7.com/premium)

---

*See [Token Balance](Token-Balance) for usage tracking and [Configuration](Configuration) for environment settings.*
