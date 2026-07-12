/**
 * AIGENEV7 Payment Worker (Cloudflare Workers)
 * ─────────────────────────────────────────────
 * Handles:
 * 1. Creating Coinbase Commerce checkout charges
 * 2. Receiving Coinbase Commerce webhooks
 * 3. Triggering GitHub Actions to generate premium keys
 *
 * Environment Variables (set in Cloudflare dashboard):
 * - COINBASE_COMMERCE_API_KEY: Your Coinbase Commerce API key
 * - GITHUB_TOKEN: Personal access token with repo scope
 * - GITHUB_REPO: Owner/repo (e.g. constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED)
 * - WEBHOOK_SECRET: Coinbase Commerce webhook signature secret
 *
 * Deploy:
 *   npx wrangler deploy --env production
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // ── POST /api/create-charge ──
      // Creates a Coinbase Commerce checkout session
      if (method === 'POST' && path === '/api/create-charge') {
        const body = await request.json()
        const { tier, amount, email, currency, name } = body

        if (!tier || !amount || !email) {
          return Response.json(
            { error: 'Missing required fields: tier, amount, email' },
            { status: 400, headers: corsHeaders }
          )
        }

        if (!env.COINBASE_COMMERCE_API_KEY) {
          return Response.json(
            { error: 'Coinbase Commerce API key not configured' },
            { status: 500, headers: corsHeaders }
          )
        }

        // Create a Coinbase Commerce charge
        const chargeResponse = await fetch('https://api.commerce.coinbase.com/charges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CC-Api-Key': env.COINBASE_COMMERCE_API_KEY,
          },
          body: JSON.stringify({
            name: name || `AIGENEV7 ${tier} Subscription`,
            description: `AIGENEV7 Premium ${tier} tier — ${email}`,
            pricing_type: 'fixed_price',
            local_price: {
              amount: String(amount),
              currency: currency || 'USD',
            },
            metadata: {
              tier: tier,
              email: email,
              product_name: `aigenev7-${tier}`,
            },
          }),
        })

        const chargeData = await chargeResponse.json()

        if (!chargeResponse.ok) {
          console.error('Coinbase charge creation failed:', chargeData)
          return Response.json(
            { error: chargeData.message || 'Failed to create charge' },
            { status: chargeResponse.status, headers: corsHeaders }
          )
        }

        const hostedUrl = chargeData.data?.hosted_url
        if (!hostedUrl) {
          return Response.json(
            { error: 'No hosted URL returned from Coinbase' },
            { status: 500, headers: corsHeaders }
          )
        }

        return Response.json({
          hosted_url: hostedUrl,
          charge_id: chargeData.data?.id,
        }, { headers: corsHeaders })
      }

      // ── POST /api/webhook ──
      // Receives Coinbase Commerce webhook events
      if (method === 'POST' && path === '/api/webhook') {
        // Verify webhook signature (fail closed — reject if secret not configured)
        const signature = request.headers.get('X-CC-Webhook-Signature')
        if (!env.WEBHOOK_SECRET) {
          console.error('WEBHOOK_SECRET not configured — rejecting webhook')
          return Response.json(
            { error: 'Webhook secret not configured' },
            { status: 500, headers: corsHeaders }
          )
        }
        if (!signature) {
          return Response.json(
            { error: 'Missing webhook signature' },
            { status: 401, headers: corsHeaders }
          )
        }
        const rawBody = await request.text()
        const isValid = await verifyWebhookSignature(
          rawBody,
          signature,
          env.WEBHOOK_SECRET
        )
        if (!isValid) {
          console.error('Invalid webhook signature')
          return Response.json(
            { error: 'Invalid signature' },
            { status: 401, headers: corsHeaders }
          )
        }
        // Parse verified body
        var webhookBody = JSON.parse(rawBody)

        const eventType = webhookBody.type
        const eventData = webhookBody.event?.data || webhookBody.data

        console.log(`Webhook received: ${eventType}`, JSON.stringify(eventData, null, 2))

        // Handle successful payment
        if (eventType === 'charge:confirmed' || eventType === 'charge:resolved') {
          const metadata = eventData.metadata || {}
          const tier = metadata.tier
          const email = metadata.email

          if (tier && email) {
            // Trigger GitHub Actions to generate and email the premium key
            await triggerGitHubAction(env, {
              event_type: 'payment_received',
              client_payload: {
                tier: tier,
                email: email,
                charge_id: eventData.id,
                amount: eventData.pricing?.local?.amount || 'unknown',
                currency: eventData.pricing?.local?.currency || 'USD',
                payment_method: 'coinbase_commerce',
              },
            })

            console.log(`Payment confirmed for ${email} — ${tier} tier`)
          }
        }

        return Response.json({ received: true }, { headers: corsHeaders })
      }

      // ── GET /health ──
      if (method === 'GET' && path === '/health') {
        return Response.json({ status: 'ok', service: 'AIGENEV7 Payment Worker' }, { headers: corsHeaders })
      }

      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders })

    } catch (err) {
      console.error('Worker error:', err)
      return Response.json(
        { error: err.message || 'Internal error' },
        { status: 500, headers: corsHeaders }
      )
    }
  },
}

/**
 * Trigger a GitHub Actions repository_dispatch event
 */
async function triggerGitHubAction(env, payload) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    console.error('GITHUB_TOKEN or GITHUB_REPO not configured')
    return
  }

  const response = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    console.error(`GitHub dispatch failed (${response.status}):`, text)
  } else {
    console.log('GitHub Actions triggered successfully')
  }
}

/**
 * Verify Coinbase Commerce webhook signature
 */
async function verifyWebhookSignature(rawBody, signature, secret) {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
    const expectedSignature = Array.from(new Uint8Array(signed))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    return expectedSignature === signature
  } catch (err) {
    console.error('Signature verification error:', err)
    return false
  }
}
