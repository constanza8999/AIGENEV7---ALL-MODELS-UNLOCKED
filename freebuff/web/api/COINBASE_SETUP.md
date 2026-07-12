# Coinbase Commerce Integration — Setup Guide

## Overview

This guide walks you through setting up crypto payments for AIGENEV7 using Coinbase Commerce.

## Step 1: Create a Coinbase Commerce Account

1. Go to [commerce.coinbase.com](https://commerce.coinbase.com)
2. Click **"Get Started"** and sign up with your business email
3. Complete identity verification (KYC) if required
4. Once verified, you'll have access to your dashboard

## Step 2: Get Your API Key

1. Log into your [Coinbase Commerce dashboard](https://commerce.coinbase.com)
2. Go to **Settings** → **Security**
3. Find the **API Keys** section
4. Click **"Create an API Key"**
5. **Important:** Copy the key immediately — it won't be shown again!

## Step 3: Get Your Store ID

The Store ID (also called "Merchant ID") can be found:

1. Go to **Settings** → **Business Information**
2. Look for **"Store ID"** or **"Merchant ID"**
3. It's typically a UUID format like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

## Step 4: Configure Webhooks

1. Go to **Settings** → **Webhooks**
2. Click **"Add an endpoint"**
3. Enter your worker URL: `https://aigenev7-payment-worker.<your-subdomain>.workers.dev/api/webhook`
4. Select events: `charge:confirmed`, `charge:resolved`
5. Click **Save**
6. Copy the **Webhook Shared Secret** (this is your `WEBHOOK_SECRET`)

## Step 5: Deploy the Cloudflare Worker

Follow the instructions in `freebuff/web/api/DEPLOYMENT.md` to deploy the worker.

## Step 6: Update data.js

Once you have your credentials, update both `docs/web/js/data.js` and `freebuff/web/js/data.js`:

```javascript
// Line 768 - Set your Coinbase Commerce Store ID
window.AIGENEV7_COINCOMMERCE_STORE_ID = 'your-store-id-here'

// Line 769 - Set your Cloudflare Worker URL
window.AIGENEV7_PAYMENT_WORKER_URL = 'https://aigenev7-payment-worker.<your-subdomain>.workers.dev'
```

## Step 7: Set Worker Secrets

Run the deploy script to set your secrets:

```bash
cd freebuff/web/api
./deploy.sh secrets
```

Enter these values when prompted:
- **COINBASE_COMMERCE_API_KEY**: Your API key from Step 2
- **GITHUB_TOKEN**: Your GitHub personal access token (needs `repo` scope)
- **WEBHOOK_SECRET**: Your webhook signing secret from Step 4

## Step 8: Test

1. Deploy the worker: `./deploy.sh production`
2. Visit your premium page
3. Click **"₿ Pay with Crypto"** on any tier
4. Enter your email
5. You should be redirected to a Coinbase Commerce checkout page

## Troubleshooting

### "Crypto checkout is being configured"
- Your `AIGENEV7_COINCOMMERCE_STORE_ID` or `AIGENEV7_PAYMENT_WORKER_URL` is empty
- Make sure both are set in `data.js`

### "Could not create automatic checkout"
- Check your worker is deployed and accessible
- Verify `COINBASE_COMMERCE_API_KEY` is set in the worker
- Check worker logs: `./deploy.sh logs`

### Webhook not receiving events
- Verify the webhook URL is correct in Coinbase Commerce settings
- Make sure `WEBHOOK_SECRET` is set in the worker
- Check that the events `charge:confirmed` and `charge:resolved` are selected

### Key not received after payment
- Check the GitHub Actions workflow is triggered
- Verify `GITHUB_TOKEN` has `repo` scope
- Check the workflow logs in your GitHub repository

## Security Notes

- Never commit API keys or secrets to git
- Use environment variables or Cloudflare Worker secrets
- Always verify webhook signatures before processing payments
- The worker uses HMAC-SHA256 to verify webhook authenticity
