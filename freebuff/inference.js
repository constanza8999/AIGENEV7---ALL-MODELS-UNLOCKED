#!/usr/bin/env bun

/**
 * AIGENEV7 Inference Engine
 * ─────────────────────────────
 * Multi-provider, uncensored, unlimited inference.
 *
 * Supports: Anthropic (Claude), DeepSeek, OpenAI, Google Gemini,
 *           Moonshot (Kimi), MiMo, MiniMax, xAI (Grok), OpenRouter.
 *
 * Features:
 *   - Unlimited token output (`max_tokens: Infinity`)
 *   - Uncensored (no content filters passed to API)
 *   - Streaming responses
 *   - Provider auto-detection
 *   - Multi-model fallback
 *
 * Usage:
 *   import { infer } from './inference.js'
 *
 *   const response = await infer({
 *     model: 'deepseek-v4-pro',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *     stream: true,
 *   })
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Configuration ───────────────────────────────────────────────────────

/**
 * Load configuration from inference.json, merging with defaults.
 * Environment variables override file values.
 */
/** Coerce a config value that may be the JSON string "Infinity" to the real Infinity. */
function normalizeTokens(val) {
  if (val === Infinity) return Infinity
  if (val === 'Infinity') return Infinity
  if (val === 'infinity') return Infinity
  const n = Number(val)
  return Number.isFinite(n) ? n : Infinity
}

function loadConfig() {
  const configPath = resolve(__dirname, 'inference.json')
  const defaults = {
    default_model: 'deepseek-v4-pro',
    max_tokens: Infinity,
    stream: true,
    uncensored: true,
    temperature: 0.7,
    usage_limits: {
      rate_limit: false,
      token_cap: Infinity,
    },
  }

  try {
    if (existsSync(configPath)) {
      const raw = readFileSync(configPath, 'utf8')
      const parsed = JSON.parse(raw)
      Object.assign(defaults, parsed)
      // Normalize "Infinity" strings from JSON to actual Infinity
      defaults.max_tokens = normalizeTokens(defaults.max_tokens)
      if (defaults.usage_limits?.token_cap != null) {
        defaults.usage_limits.token_cap = normalizeTokens(defaults.usage_limits.token_cap)
      }
    }
  } catch (err) {
    console.warn(`[AIGENEV7] Warning: Could not load inference.json: ${err.message}`)
  }

  // Env overrides
  if (process.env.AIGENEV7_DEFAULT_MODEL) defaults.default_model = process.env.AIGENEV7_DEFAULT_MODEL
  if (process.env.AIGENEV7_MAX_TOKENS) defaults.max_tokens = process.env.AIGENEV7_MAX_TOKENS === 'Infinity' ? Infinity : Number(process.env.AIGENEV7_MAX_TOKENS)
  if (process.env.AIGENEV7_UNCENSORED) defaults.uncensored = process.env.AIGENEV7_UNCENSORED === 'true'
  if (process.env.AIGENEV7_STREAM) defaults.stream = process.env.AIGENEV7_STREAM === 'true'
  if (process.env.AIGENEV7_TEMPERATURE) defaults.temperature = Number(process.env.AIGENEV7_TEMPERATURE)

  return defaults
}

// ── Provider Implementations ────────────────────────────────────────────

/**
 * Anthropic Claude API call.
 * https://docs.anthropic.com/en/api/messages
 */
async function callAnthropic(model, messages, opts) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const body = {
    model: model.providerModel,
    max_tokens: opts.maxTokens === Infinity ? 1000000000000000000 : opts.maxTokens,
    messages,
    temperature: opts.temperature ?? 0.7,
    stream: opts.stream ?? false,
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Anthropic API error (${response.status}): ${text}`)
  }

  if (opts.stream) return handleAnthropicStream(response, opts.writeToStdout, opts.onChunk)
  const data = await response.json()
  return data.content[0].text
}

/**
 * Handle Anthropic streaming response.
 */async function handleAnthropicStream(response, writeToStdout, onChunk) {
  let fullText = ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const write = writeToStdout ? (chunk) => { process.stdout.write(chunk) } : () => {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data || data === '[DONE]') continue

      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          fullText += parsed.delta.text
          write(parsed.delta.text)
          if (onChunk) onChunk(parsed.delta.text)
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullText
}

/**
 * OpenAI-compatible API call (works for OpenAI, DeepSeek, OpenRouter, etc.)
 * https://platform.openai.com/docs/api-reference/chat
 */
async function callOpenAICompatible(model, messages, opts) {
  const provider = model.provider
  const envMap = {
    openai: 'OPENAI_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    moonshot: 'MOONSHOT_API_KEY',
    mimo: 'MIMO_API_KEY',
    minimax: 'MINIMAX_API_KEY',
    xai: 'XAI_API_KEY',
    nvidia: 'NVIDIA_API_KEY',
  }
  const apiKey = process.env[envMap[provider]]
  if (!apiKey) throw new Error(`${envMap[provider]} not set`)

  const baseUrl = model.baseUrl || PROVIDER_URLS[provider]
  if (!baseUrl) throw new Error(`Unknown base URL for provider: ${provider}`)

  const body = {
    model: model.providerModel,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: opts.maxTokens === Infinity ? 1000000000000000000 : opts.maxTokens,
    temperature: opts.temperature ?? 0.7,
    stream: opts.stream ?? false,
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(provider === 'openrouter' ? {
        'HTTP-Referer': 'https://aigenev7.ai',
        'X-Title': 'AIGENEV7',
      } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${provider} API error (${response.status}): ${text}`)
  }

  if (opts.stream) return handleOpenAIStream(response, opts.writeToStdout, opts.onChunk)
  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Handle OpenAI-compatible streaming response (works for OpenAI, DeepSeek, OpenRouter, etc.)
 */
async function handleOpenAIStream(response, writeToStdout, onChunk) {
  let fullText = ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const write = writeToStdout ? (chunk) => { process.stdout.write(chunk) } : () => {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data || data === '[DONE]') continue

      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content || ''
        if (content) {
          fullText += content
          write(content)
          if (onChunk) onChunk(content)
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullText
}

/**
 * Google Gemini API call.
 * https://ai.google.dev/api/generate-content
 */
async function callGemini(model, messages, opts) {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set')

  // Convert messages to Gemini format
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const systemInstruction = messages.find((m) => m.role === 'system')

  let url = `https://generativelanguage.googleapis.com/v1beta/models/${model.providerModel}:generateContent?key=${apiKey}`
  if (opts.stream) url = `https://generativelanguage.googleapis.com/v1beta/models/${model.providerModel}:streamGenerateContent?alt=sse&key=${apiKey}`

  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: opts.maxTokens === Infinity ? 1000000000000000000 : opts.maxTokens,
      temperature: opts.temperature ?? 0.7,
      // No safety settings = uncensored
    },
  }

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction.content }],
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${text}`)
  }

  if (opts.stream) return handleGeminiStream(response, opts.writeToStdout, opts.onChunk)
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/**
 * Handle Gemini streaming response.
 */
async function handleGeminiStream(response, writeToStdout, onChunk) {
  let fullText = ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const write = writeToStdout ? (chunk) => { process.stdout.write(chunk) } : () => {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data) continue

      try {
        const parsed = JSON.parse(data)
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (text) {
          fullText += text
          write(text)
          if (onChunk) onChunk(text)
        }
      } catch {
        // skip
      }
    }
  }

  return fullText
}

// ── Provider URLs ───────────────────────────────────────────────────────

const PROVIDER_URLS = {
  anthropic: 'https://api.anthropic.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  openai: 'https://api.openai.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  moonshot: 'https://api.moonshot.cn/v1',
  mimo: 'https://api.mimo.com/v1',
  minimax: 'https://api.minimax.chat/v1',
  xai: 'https://api.x.ai/v1',
  nvidia: 'https://integrate.api.nvidia.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
}

// ── Main Inference Function ─────────────────────────────────────────────

/**
 * Run inference on the specified model.
 *
 * @param {object} opts
 * @param {string} opts.model          - Model ID from models.js
 * @param {Array}  opts.messages       - [{ role, content }]
 * @param {number} opts.maxTokens      - Max output tokens (default: Infinity)
 * @param {number} opts.temperature    - Temperature (default: 0.7)
 * @param {boolean} opts.stream        - Stream output (default: true)
 * @param {boolean} opts.uncensored    - Skip content filters (default: true)
 * @param {function} opts.onChunk      - Callback for stream chunks (called with each text chunk)
 * @returns {Promise<string>}          - The full response text
 */
export async function infer(opts = {}) {
  const config = loadConfig()

  const modelId = opts.model || config.default_model
  const messages = opts.messages || []
  const maxTokens = opts.maxTokens ?? config.max_tokens
  const temperature = opts.temperature ?? config.temperature
  const stream = opts.stream ?? config.stream
  const uncensored = opts.uncensored ?? config.uncensored
  // writeToStdout is set to true only when running as a standalone CLI script
  const writeToStdout = opts.writeToStdout ?? (process.argv[1] && (process.argv[1].endsWith('/inference.js') || process.argv[1].endsWith('\\inference.js')))
  const onChunk = opts.onChunk

  // Dynamic import models catalog
  let model
  try {
    const { getModel, detectBestModel } = await import('./models.js')
    model = getModel(modelId)
    if (!model) {
      model = detectBestModel()
      if (!model) throw new Error('No models available. Configure at least one API key.')
    }
  } catch (err) {
    throw new Error(`Model "${modelId}" not found: ${err.message}`)
  }

  if (!uncensored) {
    console.warn('[AIGENEV7] Warning: uncensored=false may cause content filtering. Set uncensored=true in inference.json or AIGENEV7_UNCENSORED=true')
  }

  // Log start
  const startTime = Date.now()
  if (!stream && writeToStdout) {
    console.error(`[AIGENEV7] ${model.displayName} (${model.provider}) — inferring...`)
  }

  let result

  if (model.provider === 'anthropic') {
    result = await callAnthropic(model, messages, { maxTokens, temperature, stream, writeToStdout, onChunk, uncensored })
  } else if (model.provider === 'google') {
    result = await callGemini(model, messages, { maxTokens, temperature, stream, writeToStdout, onChunk, uncensored })
  } else {
    // All other providers use OpenAI-compatible API
    result = await callOpenAICompatible(model, messages, { maxTokens, temperature, stream, writeToStdout, onChunk, uncensored })
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const tokens = result ? Math.ceil(result.length / 4) : 0
  if (writeToStdout) {
    console.error(`\n[AIGENEV7] ✓ Done (${elapsed}s, ~${tokens} tokens)`)
  }

  return result
}

/**
 * Quick one-shot inference (simplest API).
 *
 * @param {string} prompt        - The user prompt
 * @param {object} opts          - See infer() options
 * @returns {Promise<string>}
 */
export async function ask(prompt, opts = {}) {
  return infer({
    messages: [{ role: 'user', content: prompt }],
    ...opts,
  })
}

// ── Standalone CLI Entry Point ─────────────────────────────────────────

// Run as a script: `bun inference.js "Your prompt" [options]`
// The top-level is wrapped in a main() function because ES modules don't
// allow top-level return statements.
async function main() {
  const args = process.argv.slice(2)

  // Parse named flags
  const flags = {}
  const positional = []
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2).replace(/-/g, '_')
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true
      flags[key] = val
      if (val !== true) i++
    } else {
      positional.push(args[i])
    }
  }

  const prompt = flags.prompt || positional.join(' ')
  const modelId = flags.model || flags.m || undefined
  const stream = flags.stream !== false && flags.no_stream === undefined
  const maxTokens = flags.max_tokens === 'Infinity' ? Infinity : flags.max_tokens ? Number(flags.max_tokens) : undefined
  const temperature = flags.temperature ? Number(flags.temperature) : undefined
  const uncensored = flags.uncensored !== false // default true

  if (flags['list-models'] || flags.list_models || flags.models) {
    const { MODELS, getModelsByProvider } = await import('./models.js')
    const byProvider = getModelsByProvider()
    console.log('\n  AIGENEV7 — Available Models\n')
    for (const [provider, models] of Object.entries(byProvider)) {
      console.log(`  ${provider.charAt(0).toUpperCase() + provider.slice(1)}:`)
      for (const m of models) {
        const tag = m.multimodal ? ' 📷' : ''
        const premium = m.premium ? ' ⭐' : ''
        console.log(`    • ${m.id.padEnd(30)} ${m.displayName}${tag}${premium}`)
        console.log(`      ${m.description}`)
      }
      console.log()
    }
    process.exit(0)
  }

  if (!prompt) {
    console.error('Usage: bun inference.js <prompt> [options]')
    console.error('       bun inference.js --prompt "Your text" --model deepseek-v4-pro --no-stream')
    console.error('       bun inference.js --list-models')
    console.error('')
    console.error('Options:')
    console.error('  --model, -m <id>         Model ID (default: deepseek-v4-pro)')
    console.error('  --stream / --no-stream    Enable/disable streaming (default: stream)')
    console.error('  --max-tokens <n>          Max output tokens (default: Infinity)')
    console.error('  --temperature <n>         Temperature 0-2 (default: 0.7)')
    console.error('  --uncensored / --no-uncensored  Content filtering (default: uncensored)')
    console.error('  --list-models             List all available models')
    process.exit(1)
  }

  const text = await infer({
    model: modelId,
    messages: [{ role: 'user', content: prompt }],
    stream,
    maxTokens,
    temperature,
    uncensored,
  })

  if (!stream) {
    console.log(text)
  }
}

// Only run main() when invoked directly, not when imported as a module
if (process.argv[1] && (process.argv[1].endsWith('/inference.js') || process.argv[1].endsWith('\\inference.js'))) {
  main().catch((err) => {
    console.error(`[AIGENEV7] ✗ Error: ${err.message}`)
    process.exit(1)
  })
}
