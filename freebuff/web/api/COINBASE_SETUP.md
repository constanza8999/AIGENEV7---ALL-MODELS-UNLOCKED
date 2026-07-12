# Coinbase Commerce Setup Guide for AIGENEV7

## Step 1: Create Coinbase Commerce Account

1. Go to [commerce.coinbase.com](https://commerce.coinbase.com/)
2. Click **Get Started** or **Sign Up**
3. Create an account with your email
4. Verify your email and complete KYC if required

## Step 2: Get Your API Key

1. Log in to your Coinbase Commerce dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Copy the API key immediately (it won't be shown again)
5. Store it securely

## Step 3: Configure Webhooks

1. In **Settings** → **Webhooks**, click **Add an endpoint**
2. Enter your webhook URL:
   ```
   https://aigenev7-payment-worker.<your-subdomain>.workers.dev/api/webhook
   ```
3. Click **Add**
4. Copy the **Webhook Shared Secret** (hex string)

## Step 4: Authenticate with Cloudflare

```bash
# If not already authenticated, run:
npx wrangler login
```

## Step 5: Set Cloudflare Worker Secrets

```bash
# Navigate to the worker directory
cd freebuff/web/api

# Set the Coinbase Commerce API key
echo "your_api_key_here" | npx wrangler secret put COINBASE_COMMERCE_API_KEY

# Set the webhook secret
echo "your_webhook_secret_here" | npx wrangler secret put WEBHOOK_SECRET

# Set the GitHub token (for triggering key generation)
echo "ghp_your_github_token_here" | npx wrangler secret put GITHUB_TOKEN

# Verify all secrets are set (shows names only, not values)
npx wrangler secret list
```

## Step 6: Deploy the Worker

```bash
npx wrangler deploy
```

## Step 7: Update Premium Page

Set the worker URL in **both** data.js files:

1. `docs/web/js/data.js`
2. `freebuff/web/js/data.js`

```javascript
window.AIGENEV7_PAYMENT_WORKER_URL = 'https://aigenev7-payment-worker.<your-subdomain>.workers.dev'
```

> ⚠️ Replace `<your-subdomain>` with your Cloudflare account subdomain.
> Find it in the Cloudflare dashboard → Workers & Pages.

## Step 8: Test the Integration

1. Go to the premium page
2. Click **Pay with Crypto** on any tier
3. Enter your email
4. You should be redirected to Coinbase Commerce checkout
5. Complete a test payment (requires cryptocurrency in your Coinbase wallet)

> 💡 Coinbase Commerce does not have a sandbox mode for testing.
> Use a small amount of cryptocurrency (e.g., $1 USDC) for testing.

## Troubleshooting

- **401 Unauthorized**: Check your API key is correct (`npx wrangler secret list`)
- **Webhook not received**: Verify the webhook URL matches your deployed worker URL
- **Payment not processed**: Check Cloudflare Worker logs in the dashboard
- **Worker not found**: Run `npx wrangler deploy` to deploy/update the worker

## Security Notes

- Never commit API keys to git
- Use Cloudflare Worker secrets for production
- Keep your webhook secret secure
- Rotate keys if compromised via Coinbase Commerce dashboard
