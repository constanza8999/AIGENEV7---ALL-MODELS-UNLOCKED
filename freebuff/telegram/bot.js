#!/usr/bin/env node

/**
 * AIGENEV7 Telegram Bot — Store, Subscriptions & Channel Updates
 *
 * Usage (CLI — posting):
 *   node bot.js post-release <version>   — Post a release announcement
 *   node bot.js post-update <message>    — Post a general update
 *   node bot.js post-feature <name>      — Post a new feature announcement
 *   node bot.js post <message>           — Post a custom message
 *   node bot.js test                     — Send a test message
 *
 * Usage (Server — webhooks):
 *   node bot.js serve                    — Start webhook server for payments
 *
 * Environment variables:
 *   TELEGRAM_BOT_TOKEN   — Bot token from @BotFather (required)
 *   TELEGRAM_CHANNEL_ID  — Channel @username or numeric chat_id (required)
 *   PORT                 — Webhook server port (default: 3000)
 *   WEBHOOK_URL          — Public URL for webhooks (e.g. https://your-domain.com)
 *
 * @author CONSTANZA (José Jaime Juliá)
 */

import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const API_BASE = 'https://api.telegram.org/bot'

// ── Subscription Plans ───────────────────────────────────────────────

const PLANS = [
  {
    id: 'pro',
    name: '⭐ Pro',
    price: 100, // 100 Telegram Stars (~$2)
    period: 30, // days
    description: 'AIGENEV7 Pro — Premium AI coding agent',
    features: [
      '23 AI agents unlocked',
      '23 models (GPT-4.1, Claude Opus 4, O3 Pro)',
      '27 premium features',
      'Agent export/import',
      'Quantum circuits',
      'Priority support',
    ],
    tier: 'pro',
  },
  {
    id: 'elite',
    name: '💎 Elite',
    price: 300, // 300 Telegram Stars (~$6)
    period: 30,
    description: 'AIGENEV7 Elite — Full power AI coding suite',
    features: [
      'Everything in Pro',
      'All premium models',
      'Full API access',
      'Custom agent personas',
      'Batch inference',
      'Priority support',
    ],
    tier: 'elite',
  },
  {
    id: 'enterprise',
    name: '🏢 Enterprise',
    price: 700, // 700 Telegram Stars (~$14)
    period: 30,
    description: 'AIGENEV7 Enterprise — Team-scale AI coding',
    features: [
      'Everything in Elite',
      'Multi-user support',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Early access to features',
    ],
    tier: 'enterprise',
  },
]

// ── In-memory subscription store (replace with DB in production) ─────

const subscriptions = new Map()

function getSubscription(userId) {
  return subscriptions.get(String(userId)) || null
}

function setSubscription(userId, planId, chargeId, expiresAt) {
  subscriptions.set(String(userId), {
    planId,
    chargeId,
    expiresAt: new Date(expiresAt),
    activatedAt: new Date(),
  })
}

function isSubscriptionActive(userId) {
  const sub = getSubscription(userId)
  if (!sub) return false
  return new Date() < sub.expiresAt
}

// ── Helpers ──────────────────────────────────────────────────────────

function getToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not set. Get one from @BotFather on Telegram.')
    process.exit(1)
  }
  return token
}

function getChannelId() {
  return process.env.TELEGRAM_CHANNEL_ID || '@AIGENEV7Updates'
}

async function apiCall(method, body) {
  const token = getToken()
  const url = `${API_BASE}${token}/${method}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.ok) {
    console.error(`⚠️  Telegram API error (${method}): ${data.description || JSON.stringify(data)}`)
    return null
  }
  return data.result
}

async function sendMessage(chatId, text, options = {}) {
  return apiCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: false,
    ...options,
  })
}

async function sendPhoto(chatId, photoUrl, caption, options = {}) {
  return apiCall('sendPhoto', {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
    ...options,
  })
}

async function answerPreCheckoutQuery(preCheckoutQueryId, ok = true, errorMessage) {
  return apiCall('answerPreCheckoutQuery', {
    pre_checkout_query_id: preCheckoutQueryId,
    ok,
    error_message: errorMessage,
  })
}

async function sendInvoice(chatId, plan) {
  return apiCall('sendInvoice', {
    chat_id: chatId,
    title: plan.name,
    description: plan.description,
    payload: `aigenev7_${plan.id}_${Date.now()}`,
    currency: 'XTR',
    prices: [{ label: plan.name, amount: plan.price }],
    subscription_period: plan.period * 24 * 60 * 60, // seconds
    provider_data: JSON.stringify({}),
  })
}

async function getStarsSubscriptions(providerToken) {
  return apiCall('getStarsSubscriptions', {
    provider_token: providerToken || '',
  })
}

async function cancelStarsSubscription(providerToken, userId, chargeId) {
  return apiCall('cancelStarsSubscription', {
    provider_token: providerToken || '',
    user_id: userId,
    charge_id: chargeId,
  })
}

// ── Message Templates ────────────────────────────────────────────────

function plansMessage() {
  let text = '🛒 <b>AIGENEV7 Premium Store</b>\n\n'
  text += 'Choose a plan to unlock the full power of AIGENEV7:\n\n'

  for (const plan of PLANS) {
    text += `<b>${plan.name}</b> — ${plan.price} ⭐/mo\n`
    text += `<i>${plan.description}</i>\n`
    for (const f of plan.features.slice(0, 4)) {
      text += `  ✓ ${f}\n`
    }
    text += '\n'
  }

  text += '💡 Tap a plan below to subscribe with Telegram Stars!'
  return text
}

function planKeyboard() {
  return {
    inline_keyboard: PLANS.map((plan) => [
      {
        text: `${plan.name} — ${plan.price} ⭐`,
        callback_data: `buy_${plan.id}`,
      },
    ]),
  }
}

function statusMessage(userId) {
  const sub = getSubscription(userId)
  if (!sub) {
    return '📋 <b>Your Subscription</b>\n\nYou don\'t have an active subscription.\n\n🛒 Use /plans to see available plans.'
  }
  const plan = PLANS.find((p) => p.id === sub.planId)
  const active = isSubscriptionActive(userId)
  const status = active ? '✅ Active' : '❌ Expired'
  const expires = sub.expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `📋 <b>Your Subscription</b>\n\n` +
    `<b>Plan:</b> ${plan ? plan.name : sub.planId}\n` +
    `<b>Status:</b> ${status}\n` +
    `<b>Expires:</b> ${expires}\n\n` +
    (active ? '🎁 Your premium features are unlocked!' : '🔄 Use /plans to resubscribe.')
}

function releaseMessage(version) {
  return `🚀 <b>AIGENEV7 v${version}</b> — Now Available!\n\n` +
    `🎉 <b>What's New:</b>\n` +
    `• Expanded AI agents & models\n` +
    `• Improved premium features\n` +
    `• Enhanced accessibility\n` +
    `• Bug fixes & performance improvements\n\n` +
    `📥 <b>Download:</b>\n` +
    `<a href="https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/releases/latest">Get the latest release</a>\n\n` +
    `🌐 <b>Web:</b> <a href="https://constanza8999.github.io/AIGENEV7---ALL-MODELS-UNLOCKED/">Visit our site</a>\n\n` +
    `💡 Run <code>aigenev7 --version</code> to check your installed version.\n\n` +
    `<i>Built with ❤️ by CONSTANZA</i>`
}

function featureMessage(featureName) {
  return `✨ <b>New Feature: ${featureName}</b>\n\n` +
    `AIGENEV7 just got an upgrade! Check out the latest addition to make your coding workflow even better.\n\n` +
    `📥 Update now: <code>aigenev7 --update</code>\n` +
    `🌐 Learn more: <a href="https://constanza8999.github.io/AIGENEV7---ALL-MODELS-UNLOCKED/premium/">Premium Features</a>\n\n` +
    `<i>— AIGENEV7 Team</i>`
}

function updateMessage(message) {
  return `📢 <b>AIGENEV7 Update</b>\n\n${message}\n\n` +
    `🌐 <a href="https://constanza8999.github.io/AIGENEV7---ALL-MODELS-UNLOCKED/">Check it out</a>\n\n` +
    `<i>— Built by CONSTANZA</i>`
}

function testMessage() {
  return `✅ <b>AIGENEV7 Telegram Bot</b> is connected!\n\n` +
    `This channel will receive:\n` +
    `• 🚀 Release announcements\n` +
    `• ✨ Feature updates\n` +
    `• 📢 General news & tips\n` +
    `• 🔧 Bug fix notifications\n\n` +
    `Stay tuned for the latest AIGENEV7 updates!\n\n` +
    `<i>Built with ❤️ by CONSTANZA</i>`
}

// ── Command Handlers ─────────────────────────────────────────────────

async function handleCommand(chatId, text, userId, firstName) {
  const cmd = text.split(' ')[0].toLowerCase()
  const args = text.split(' ').slice(1).join(' ')

  switch (cmd) {
    case '/start':
    case '/help': {
      const helpText = `👋 <b>Welcome to AIGENEV7 Bot!</b>\n\n` +
        `I'm your AI coding assistant bot. Here's what I can do:\n\n` +
        `🛒 <b>/plans</b> — View subscription plans & buy\n` +
        `📋 <b>/status</b> — Check your subscription status\n` +
        `❌ <b>/cancel</b> — Cancel your subscription\n` +
        `ℹ️ <b>/help</b> — Show this message\n\n` +
        `🌐 <a href="https://constanza8999.github.io/AIGENEV7---ALL-MODELS-UNLOCKED/">Visit our website</a>\n\n` +
        `<i>Built by CONSTANZA</i>`
      await sendMessage(chatId, helpText)
      break
    }

    case '/plans': {
      const isActive = isSubscriptionActive(userId)
      if (isActive) {
        const sub = getSubscription(userId)
        const plan = PLANS.find((p) => p.id === sub.planId)
        await sendMessage(chatId,
          `✅ You already have an active <b>${plan ? plan.name : 'subscription'}</b>!\n\n` +
          `Use /status to see details or /cancel to change plans.`
        )
      } else {
        await sendMessage(chatId, plansMessage(), {
          reply_markup: planKeyboard(),
        })
      }
      break
    }

    case '/status': {
      await sendMessage(chatId, statusMessage(userId))
      break
    }

    case '/cancel': {
      const sub = getSubscription(userId)
      if (!sub) {
        await sendMessage(chatId, '📋 You don\'t have an active subscription.')
        return
      }
      const result = await cancelStarsSubscription('', userId, sub.chargeId)
      if (result) {
        subscriptions.delete(String(userId))
        await sendMessage(chatId, '✅ Your subscription has been cancelled.')
      } else {
        await sendMessage(chatId, '❌ Could not cancel subscription. Please try again or contact support.')
      }
      break
    }

    case '/post-release': {
      // Admin only — post to channel
      const version = args || '7.0.0'
      const channelId = getChannelId()
      await sendMessage(channelId, releaseMessage(version))
      await sendMessage(chatId, `✅ Posted release v${version} to channel!`)
      break
    }

    case '/post-feature': {
      const featureName = args || 'New Feature'
      const channelId = getChannelId()
      await sendMessage(channelId, featureMessage(featureName))
      await sendMessage(chatId, `✅ Posted feature: ${featureName} to channel!`)
      break
    }

    default:
      // Unknown command — show help
      await sendMessage(chatId,
        `🤔 Unknown command: <code>${cmd}</code>\n\nUse /help to see available commands.`
      )
  }
}

// ── Callback Query Handler ───────────────────────────────────────────

async function handleCallbackQuery(callbackQuery) {
  const { id, data, from } = callbackQuery
  const chatId = from.id

  // Answer the callback query to remove loading state
  await apiCall('answerCallbackQuery', {
    callback_query_id: id,
    text: '',
  })

  if (data.startsWith('buy_')) {
    const planId = data.replace('buy_', '')
    const plan = PLANS.find((p) => p.id === planId)
    if (!plan) {
      await sendMessage(chatId, '❌ Plan not found. Use /plans to see available options.')
      return
    }

    if (isSubscriptionActive(chatId)) {
      const sub = getSubscription(chatId)
      const currentPlan = PLANS.find((p) => p.id === sub.planId)
      await sendMessage(chatId,
        `⚠️ You already have an active <b>${currentPlan ? currentPlan.name : 'subscription'}</b>.\n\n` +
        `Use /cancel first to change plans.`
      )
      return
    }

    // Send invoice
    await sendInvoice(chatId, plan)
  }
}

// ── Webhook Server (for payment processing) ──────────────────────────

function createWebhookServer() {
  const PORT = process.env.PORT || 3000

  const server = createServer(async (req, res) => {
    // Health check
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', bot: 'AIGENEV7 Telegram Bot' }))
      return
    }

    // Webhook endpoint
    if (req.method === 'POST' && req.url === '/webhook') {
      let body = ''
      for await (const chunk of req) {
        body += chunk
      }

      try {
        const update = JSON.parse(body)

        // Handle pre-checkout query (payment verification)
        if (update.pre_checkout_query) {
          const query = update.pre_checkout_query
          console.log(`💳 Pre-checkout from user ${query.from.id}: ${query.invoice_payload}`)

          // Verify the payment — always accept for now
          await answerPreCheckoutQuery(query.id, true)
          console.log(`✅ Pre-checkout approved`)
        }

        // Handle successful payment
        if (update.message?.successful_payment) {
          const payment = update.message.successful_payment
          const userId = update.message.from.id
          const firstName = update.message.from.first_name
          const payload = payment.invoice_payload

          console.log(`💰 Payment received from ${firstName} (${userId}): ${payment.total_amount} ${payment.currency}`)
          console.log(`   Payload: ${payload}`)

          // Parse payload to get plan info
          const planMatch = payload.match(/aigenev7_(\w+)_/)
          const planId = planMatch ? planMatch[1] : 'pro'
          const plan = PLANS.find((p) => p.id === planId) || PLANS[0]

          // Calculate expiration (30 days from now)
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + plan.period)

          // Store subscription
          setSubscription(userId, planId, payment.telegram_payment_charge_id, expiresAt)

          // Send confirmation
          await sendMessage(userId,
            `🎉 <b>Payment Successful!</b>\n\n` +
            `You've subscribed to <b>${plan.name}</b>!\n\n` +
            `<b>Plan:</b> ${plan.name}\n` +
            `<b>Amount:</b> ${payment.total_amount} ⭐\n` +
            `<b>Valid until:</b> ${expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n` +
            `🎁 Your premium features are now unlocked!\n\n` +
            `💡 Use /status to check your subscription anytime.\n\n` +
            `<i>Thank you for supporting AIGENEV7! ❤️</i>`
          )

          // Post to channel (optional announcement)
          const channelId = getChannelId()
          await sendMessage(channelId,
            `🎉 <b>${firstName}</b> just subscribed to <b>${plan.name}</b>! 🚀\n\n` +
            `Join them — use /plans to get started!`
          )

          console.log(`✅ Subscription activated for ${firstName} (${userId})`)
        }

        // Handle regular messages / commands
        if (update.message?.text) {
          const chatId = update.message.chat.id
          const userId = update.message.from.id
          const firstName = update.message.from.first_name || 'User'
          const text = update.message.text

          // Handle callback queries (inline keyboard buttons)
          if (update.callback_query) {
            await handleCallbackQuery(update.callback_query)
          }

          // Handle commands
          if (text.startsWith('/')) {
            await handleCommand(chatId, text, userId, firstName)
          }
        }

        // Handle callback queries from inline keyboards
        if (update.callback_query) {
          await handleCallbackQuery(update.callback_query)
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (err) {
        console.error('❌ Webhook error:', err.message)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: err.message }))
      }
      return
    }

    // 404 for everything else
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  })

  server.listen(PORT, () => {
    console.log(`\n🤖 AIGENEV7 Telegram Bot — Store Server`)
    console.log(`   Listening on port ${PORT}`)
    console.log(`   Webhook: http://localhost:${PORT}/webhook`)
    console.log(`   Health:  http://localhost:${PORT}/health`)
    console.log(`\n   Plans:`)
    for (const plan of PLANS) {
      console.log(`     ${plan.name} — ${plan.price} ⭐/mo`)
    }
    console.log(`\n   Configure webhook URL in @BotFather:`)
    console.log(`   /setwebhook → https://your-domain.com:${PORT}/webhook`)
    console.log(`\n   Or test locally with @BotFather's /setwebhook → ngrok\n`)
  })
}

// ── CLI Entry Point ──────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  // Server mode
  if (command === 'serve') {
    createWebhookServer()
    return
  }

  // CLI posting mode
  try {
    switch (command) {
      case 'post-release': {
        const version = args[1] || '7.0.0'
        console.log(`📤 Posting release v${version}...`)
        const result = await sendMessage(getChannelId(), releaseMessage(version))
        console.log(`✅ Posted! Message ID: ${result?.message_id}`)
        break
      }

      case 'post-feature': {
        const featureName = args.slice(1).join(' ') || 'New Feature'
        console.log(`📤 Posting feature: ${featureName}...`)
        const result = await sendMessage(getChannelId(), featureMessage(featureName))
        console.log(`✅ Posted! Message ID: ${result?.message_id}`)
        break
      }

      case 'post-update': {
        const message = args.slice(1).join(' ') || 'AIGENEV7 has been updated!'
        console.log(`📤 Posting update...`)
        const result = await sendMessage(getChannelId(), updateMessage(message))
        console.log(`✅ Posted! Message ID: ${result?.message_id}`)
        break
      }

      case 'post': {
        const message = args.slice(1).join(' ')
        if (!message) {
          console.error('Usage: node bot.js post <message>')
          process.exit(1)
        }
        console.log(`📤 Posting custom message...`)
        const result = await sendMessage(getChannelId(), message)
        console.log(`✅ Posted! Message ID: ${result?.message_id}`)
        break
      }

      case 'plans': {
        console.log('🛒 AIGENEV7 Subscription Plans:\n')
        for (const plan of PLANS) {
          console.log(`  ${plan.name} — ${plan.price} ⭐/mo`)
          console.log(`    ${plan.description}`)
          for (const f of plan.features) {
            console.log(`      ✓ ${f}`)
          }
          console.log('')
        }
        break
      }

      case 'test': {
        console.log('📤 Sending test message...')
        const result = await sendMessage(getChannelId(), testMessage())
        console.log(`✅ Test message sent! Message ID: ${result?.message_id}`)
        break
      }

      default:
        console.log(`
AIGENEV7 Telegram Bot — Store & Updates

Usage (CLI):
  node bot.js post-release <version>   Post a release announcement
  node bot.js post-update <message>    Post a general update
  node bot.js post-feature <name>      Post a new feature announcement
  node bot.js post <message>           Post a custom message
  node bot.js plans                    Show subscription plans
  node bot.js test                     Send a test message

Usage (Server):
  node bot.js serve                    Start webhook server for payments

Environment:
  TELEGRAM_BOT_TOKEN    Bot token from @BotFather
  TELEGRAM_CHANNEL_ID   Channel @username or numeric ID
  PORT                  Server port (default: 3000)
`)
        break
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    process.exit(1)
  }
}

main()
