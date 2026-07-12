# AIGENEV7 Payment Worker — Deployment Guide

## Overview

The AIGENEV7 Payment Worker is a Cloudflare Worker that handles:

1. **Creating Coinbase Commerce checkout charges** — POST `/api/create-charge`
2. **Receiving Coinbase Commerce webhooks** — POST `/api/webhook`
3. **Triggering GitHub Actions** to generate and email premium keys

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- A [Cloudflare account](https://dash.cloudflare.com) (free tier works)
- A [Coinbase Commerce](https://commerce.coinbase.com) account
- A [GitHub personal access token](https://github.com/settings/tokens) with `repo` scope

## Quick Start

### 1. Install Wrangler CLI

```bash
cd freebuff/web/api
npm install -g wrangler
# or use npx without installing
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

This opens a browser window. Log in and authorize the CLI.

### 3. Set Secrets

```bash
./deploy.sh secrets
```

Or manually:

```bash
# Coinbase Commerce API key
npx wrangler secret put COINBASE_COMMERCE_API_KEY

# GitHub token (needs repo scope)
npx wrangler secret put GITHUB_TOKEN

# Coinbase Commerce webhook signature secret
npx wrangler secret put WEBHOOK_SECRET
```

### 4. Deploy

```bash
./deploy.sh production
# or
npx wrangler deploy
```

### 5. Test

```bash
# Health check
curl https://aigenev7-payment-worker.<your-subdomain>.workers.dev/health

# Create a charge (test mode)
curl -X POST https://aigenev7-payment-worker.<your-subdomain>.workers.dev/api/create-charge \
  -H "Content-Type: application/json" \
  -d '{"tier":"pro","amount":5,"email":"test@example.com"}'
```

## Environment Variables

| Secret | Where to Get | Purpose |
|--------|-------------|---------|
| `COINBASE_COMMERCE_API_KEY` | [Coinbase Commerce Settings → API](https://dashboard.commerce.coinbase.com/settings/api) | Create checkout charges |
| `GITHUB_TOKEN` | [GitHub Settings → Tokens](https://github.com/settings/tokens) | Trigger key generation workflow |
| `WEBHOOK_SECRET` | [Coinbase Commerce Settings → Webhooks](https://dashboard.commerce.coinbase.com/settings/webhooks) | Verify webhook signatures |

## Setting Up Coinbase Commerce

### 1. Create a Coinbase Commerce Account

1. Go to [commerce.coinbase.com](https://commerce.coinbase.com)
2. Sign up and verify your account
3. Complete KYC if required for your region

### 2. Get API Key

1. Go to **Settings → API Keys**
2. Click **Create API Key**
3. Copy the key (shown only once)

### 3. Configure Webhooks

1. Go to **Settings → Webhooks**
2. Click **Add Endpoint**
3. Enter your worker URL: `https://aigenev7-payment-worker.<subdomain>.workers.dev/api/webhook`
4. Select events: `charge:confirmed`, `charge:resolved`
5. Copy the **Signing Secret** → this is your `WEBHOOK_SECRET`

## Setting Up GitHub Actions

The worker triggers a `repository_dispatch` event when a payment is confirmed. You need a GitHub Actions workflow to handle it.

### Workflow File: `.github/workflows/payment-webhook.yml`

```yaml
name: Payment Webhook — Generate Premium Key

on:
  repository_dispatch:
    types: [payment_received]

jobs:
  generate-key:
    runs-on: ubuntu-latest
    if: github.event.client_payload.event_type == 'payment_received'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Generate premium key
        id: generate
        env:
          TIER: ${{ github.event.client_payload.tier }}
          EMAIL: ${{ github.event.client_payload.email }}
          CHARGE_ID: ${{ github.event.client_payload.charge_id }}
          COINBASE_COMMERCE_API_KEY: ${{ secrets.COINBASE_COMMERCE_API_KEY }}
        run: |
          KEY="ag7_${TIER}_$(openssl rand -hex 16)"
          echo "Generated key: $KEY"
          echo "Tier: $TIER"
          echo "Email: $EMAIL"
          echo "Charge: $CHARGE_ID"
          echo "key=$KEY" >> $GITHUB_OUTPUT

      - name: Send key via email
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 587
          username: ${{ secrets.EMAIL_USERNAME }}
          password: ${{ secrets.EMAIL_PASSWORD }}
          subject: "Your AIGENEV7 Premium Key — ${{ github.event.client_payload.tier }}"
          to: ${{ github.event.client_payload.email }}
          from: "AIGENEV7 <noreply@aigenev7.com>"
          body: |
            Thank you for your purchase!

            Tier: ${{ github.event.client_payload.tier }}
            Key: ${{ steps.generate.outputs.key }}

            To activate, run:
            export AIGENEV7_PREMIUM_KEY=${{ steps.generate.outputs.key }}

            Or add it to your premium.lic file.
```

## Local Development

### 1. Configure Local Secrets

Edit `.dev.vars` with your real values:

```bash
COINBASE_COMMERCE_API_KEY=your_key_here
GITHUB_TOKEN=ghp_your_token_here
WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Start Dev Server

```bash
./deploy.sh dev
# or
npx wrangler dev
```

The worker runs at `http://localhost:8787`.

### 3. Test Locally

```bash
# Health check
curl http://localhost:8787/health

# Create a charge
curl -X POST http://localhost:8787/api/create-charge \
  -H "Content-Type: application/json" \
  -d '{"tier":"pro","amount":5,"email":"test@example.com"}'
```

## Custom Domain (Optional)

After deploying, you can add a custom domain:

1. Go to Cloudflare Dashboard → Workers
2. Click your worker → **Settings → Triggers**
3. Click **Add Custom Domain**
4. Enter: `payment.aigenev7.com` (or similar)
5. The domain must be on a Cloudflare-managed zone

Or use `wrangler.toml`:

```toml
routes = [
  { pattern = "payment.aigenev7.com/*", zone_name = "aigenev7.com" }
]
```

Then deploy:

```bash
npx wrangler deploy
```

## Troubleshooting

### "WEBHOOK_SECRET not configured"

The worker rejects webhooks if `WEBHOOK_SECRET` is not set. Run:

```bash
npx wrangler secret put WEBHOOK_SECRET
```

### "Coinbase charge creation failed"

- Check your `COINBASE_COMMERCE_API_KEY` is valid
- Ensure your Coinbase Commerce account is verified
- Check the worker logs: `npx wrangler tail`

### "GitHub dispatch failed"

- Verify `GITHUB_TOKEN` has `repo` scope
- Ensure the repository name matches `GITHUB_REPO`
- Check the token hasn't expired

### Worker not responding

```bash
# Check deployment status
npx wrangler deployments list

# Tail live logs
npx wrangler tail

# Test health endpoint
curl https://aigenev7-payment-worker.<subdomain>.workers.dev/health
```

## Cost

Cloudflare Workers free tier includes:

- **100,000 requests/day** (more than enough for this use case)
- **10ms CPU time per request**
- **No credit card required**

The free tier is sufficient for most small-to-medium payment volumes. Upgrade to the Workers Paid plan ($5/month) for higher limits if needed.

## Rollback

If something goes wrong, roll back to a previous deployment:

```bash
# List recent deployments
npx wrangler deployments list

# Roll back to a specific version
npx wrangler rollback <deployment-id>

# Or re-deploy a known-good version
git checkout <commit-hash> -- freebuff/web/api/worker.js
npx wrangler deploy
```

## Architecture

```
User clicks "Pay with Crypto"
        │
        ▼
┌─────────────────────┐
│  Frontend (data.js)  │
│  AIGENEV7_PAYMENT_   │
│  WORKER_URL          │
└─────────┬───────────┘
          │ POST /api/create-charge
          ▼
┌─────────────────────┐
│  Cloudflare Worker   │
│  aigenev7-payment-   │
│  worker              │
└─────────┬───────────┘
          │ Creates charge
          ▼
┌─────────────────────┐
│  Coinbase Commerce   │
│  Checkout Page       │
└─────────┬───────────┘
          │ Webhook: charge:confirmed
          ▼
┌─────────────────────┐
│  Cloudflare Worker   │
│  POST /api/webhook   │
└─────────┬───────────┘
          │ repository_dispatch
          ▼
┌─────────────────────┐
│  GitHub Actions      │
│  Generate key &      │
│  email to user       │
└─────────────────────┘
```
