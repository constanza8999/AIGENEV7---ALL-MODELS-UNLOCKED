/**
 * AIGENEV7 Payment Worker (Cloudflare Workers)
 * ─────────────────────────────────────────────
 * High Security Protocol — Rate limiting, input validation,
 * CORS hardening, webhook signature verification, security headers.
 *
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
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins (e.g. https://constanza8999.github.io)
 * - RATE_LIMIT_WINDOW: Rate limit window in seconds (default: 60)
 * - RATE_LIMIT_MAX: Max requests per window (default: 30)
 *
 * Deploy:
 *   npx wrangler deploy --env production
 *
 * @author CONSTANZA (José Jaime Juliá)
 */

// ── Rate Limiting (using Cloudflare KV or in-memory fallback) ────────
const rateLimitStore = new Map()

function getRateLimitKey(ip, path) {
  return `${ip}:${path}`
}

async function checkRateLimit(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
  const path = new URL(request.url).pathname
  const key = getRateLimitKey(ip, path)
  const window = parseInt(env.RATE_LIMIT_WINDOW) || 60
  const maxRequests = parseInt(env.RATE_LIMIT_MAX) || 30

  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (record && (now - record.start) < window * 1000) {
    if (record.count >= maxRequests) {
      return { allowed: false, retryAfter: Math.ceil((record.start + window * 1000 - now) / 1000) }
    }
    record.count++
  } else {
    rateLimitStore.set(key, { count: 1, start: now })
  }

  // Clean up old entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore) {
      if ((now - v.start) > window * 1000 * 2) rateLimitStore.delete(k)
    }
  }

  return { allowed: true }
}

// ── Input Validation ─────────────────────────────────────────────────
const VALID_TIERS = ['pro', 'elite', 'enterprise']
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const MAX_EMAIL_LENGTH = 254
const MAX_NAME_LENGTH = 200
const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']

function validateCreateChargeInput(body) {
  const errors = []

  if (!body.tier || !VALID_TIERS.includes(body.tier)) {
    errors.push(`Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}`)
  }

  if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0 || body.amount > 10000) {
    errors.push('Invalid amount. Must be a positive number up to 10,000.')
  }

  if (!body.email || typeof body.email !== 'string') {
    errors.push('Email is required.')
  } else if (body.email.length > MAX_EMAIL_LENGTH) {
    errors.push(`Email exceeds maximum length of ${MAX_EMAIL_LENGTH} characters.`)
  } else if (!EMAIL_REGEX.test(body.email)) {
    errors.push('Invalid email format.')
  }

  if (body.name && typeof body.name === 'string' && body.name.length > MAX_NAME_LENGTH) {
    errors.push(`Name exceeds maximum length of ${MAX_NAME_LENGTH} characters.`)
  }

  if (body.currency && !VALID_CURRENCIES.includes(body.currency)) {
    errors.push(`Invalid currency. Must be one of: ${VALID_CURRENCIES.join(', ')}`)
  }

  return { valid: errors.length === 0, errors }
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

// ── Security Headers ─────────────────────────────────────────────────
function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.commerce.coinbase.com https://api.github.com; frame-ancestors 'none';",
  }
}

// ── CORS Hardening ───────────────────────────────────────────────────
function getAllowedOrigins(env) {
  const allowed = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['https://constanza8999.github.io', 'https://aigenev7.com', 'http://localhost:3000']
  return allowed
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin')
  const allowedOrigins = getAllowedOrigins(env)
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

// ── Main Handler ─────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method
    const securityHeaders = getSecurityHeaders()
    const corsHeaders = getCorsHeaders(request, env)

    // Enforce HTTPS in production
    if (url.protocol === 'http:' && !url.hostname.includes('localhost')) {
      return Response.json(
        { error: 'HTTPS required' },
        { status: 301, headers: { ...securityHeaders, 'Location': url.toString().replace('http:', 'https:') } }
      )
    }

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...corsHeaders, ...securityHeaders } })
    }

    // Rate limiting (skip for health checks)
    if (path !== '/health') {
      const rateCheck = await checkRateLimit(request, env)
      if (!rateCheck.allowed) {
        return Response.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          {
            status: 429,
            headers: {
              ...corsHeaders,
              ...securityHeaders,
              'Retry-After': String(rateCheck.retryAfter),
              'X-RateLimit-Limit': env.RATE_LIMIT_MAX || '30',
              'X-RateLimit-Remaining': '0',
            },
          }
        )
      }
    }

    try {
      // ── POST /api/create-charge ──
      if (method === 'POST' && path === '/api/create-charge') {
        const body = await request.json()

        // Input validation
        const validation = validateCreateChargeInput(body)
        if (!validation.valid) {
          return Response.json(
            { error: 'Validation failed', details: validation.errors },
            { status: 400, headers: { ...corsHeaders, ...securityHeaders } }
          )
        }

        if (!env.COINBASE_COMMERCE_API_KEY) {
          return Response.json(
            { error: 'Coinbase Commerce API key not configured' },
            { status: 500, headers: { ...corsHeaders, ...securityHeaders } }
          )
        }

        // Sanitize inputs
        const sanitizedTier = sanitizeInput(body.tier)
        const sanitizedEmail = sanitizeInput(body.email)
        const sanitizedName = sanitizeInput(body.name || `AIGENEV7 ${sanitizedTier} Subscription`)

        // Create a Coinbase Commerce charge
        const chargeResponse = await fetch('https://api.commerce.coinbase.com/charges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CC-Api-Key': env.COINBASE_COMMERCE_API_KEY,
          },
          body: JSON.stringify({
            name: sanitizedName,
            description: `AIGENEV7 Premium ${sanitizedTier} tier — ${sanitizedEmail}`,
            pricing_type: 'fixed_price',
            local_price: {
              amount: String(body.amount),
              currency: body.currency || 'USD',
            },
            metadata: {
              tier: sanitizedTier,
              email: sanitizedEmail,
              product_name: `aigenev7-${sanitizedTier}`,
            },
          }),
        })

        const chargeData = await chargeResponse.json()

        if (!chargeResponse.ok) {
          console.error('Coinbase charge creation failed:', chargeData)
          return Response.json(
            { error: chargeData.message || 'Failed to create charge' },
            { status: chargeResponse.status, headers: { ...corsHeaders, ...securityHeaders } }
          )
        }

        const hostedUrl = chargeData.data?.hosted_url
        if (!hostedUrl) {
          return Response.json(
            { error: 'No hosted URL returned from Coinbase' },
            { status: 500, headers: { ...corsHeaders, ...securityHeaders } }
          )
        }

        return Response.json({
          hosted_url: hostedUrl,
          charge_id: chargeData.data?.id,
        }, { headers: { ...corsHeaders, ...securityHeaders } })
      }

      // ── POST /api/webhook ──
      if (method === 'POST' && path === '/api/webhook') {
        // Verify webhook signature (fail closed)
        const signature = request.headers.get('X-CC-Webhook-Signature')
        if (!env.WEBHOOK_SECRET) {
          console.error('WEBHOOK_SECRET not configured — rejecting webhook')
          return Response.json(
            { error: 'Webhook secret not configured' },
            { status: 500, headers: { ...corsHeaders, ...securityHeaders } }
          )
        }
        if (!signature) {
          return Response.json(
            { error: 'Missing webhook signature' },
            { status: 401, headers: { ...corsHeaders, ...securityHeaders } }
          )
        }

        const rawBody = await request.text()

        // Verify body size limit (1MB max)
        if (rawBody.length > 1024 * 1024) {
          return Response.json(
            { error: 'Request body too large' },
            { status: 413, headers: { ...corsHeaders, ...securityHeaders } }
          )
        }

        const isValid = await verifyWebhookSignature(rawBody, signature, env.WEBHOOK_SECRET)
        if (!isValid) {
          console.error('Invalid webhook signature')
          return Response.json(
            { error: 'Invalid signature' },
            { status: 401, headers: { ...corsHeaders, ...securityHeaders } }
          )
        }

        // Parse verified body
        let webhookBody
        try {
          webhookBody = JSON.parse(rawBody)
        } catch (e) {
          return Response.json(
            { error: 'Invalid JSON' },
            { status: 400, headers: { ...corsHeaders, ...securityHeaders } }
          )
        }

        const eventType = webhookBody.type
        const eventData = webhookBody.event?.data || webhookBody.data

        console.log(`Webhook received: ${eventType}`, JSON.stringify(eventData, null, 2))

        // Handle successful payment
        if (eventType === 'charge:confirmed' || eventType === 'charge:resolved') {
          const metadata = eventData.metadata || {}
          const tier = metadata.tier
          const email = metadata.email

          if (tier && email && VALID_TIERS.includes(tier)) {
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

        return Response.json({ received: true }, { headers: { ...corsHeaders, ...securityHeaders } })
      }

      // ── GET /health ──
      if (method === 'GET' && path === '/health') {
        return Response.json(
          { status: 'ok', service: 'AIGENEV7 Payment Worker', version: '1.1.0-security' },
          { headers: { ...corsHeaders, ...securityHeaders } }
        )
      }

      return Response.json(
        { error: 'Not found' },
        { status: 404, headers: { ...corsHeaders, ...securityHeaders } }
      )

    } catch (err) {
      console.error('Worker error:', err)
      return Response.json(
        { error: 'Internal server error' }, // Don't leak error details
        { status: 500, headers: { ...corsHeaders, ...securityHeaders } }
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
 * Verify Coinbase Commerce webhook signature using constant-time comparison
 */
async function verifyWebhookSignature(rawBody, signature, secret) {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // Convert hex signature to bytes
    const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))

    // Use crypto.subtle.verify for constant-time comparison (prevents timing attacks)
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(rawBody)
    )

    return isValid
  } catch (err) {
    console.error('Signature verification error:', err)
    return false
  }
}
