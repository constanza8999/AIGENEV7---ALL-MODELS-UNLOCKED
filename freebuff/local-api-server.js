#!/usr/bin/env bun

/**
 * AIGENEV7 Local API Server
 * ──────────────────────────
 * A lightweight HTTP server that implements the Codebuff-compatible API
 * endpoints, proxying LLM calls through `inference.js` using locally
 * configured API keys.
 *
 * This enables the AIGENEV7 binary to work WITHOUT any login or a
 * Codebuff backend — just set API keys in freebuff/.env and go.
 *
 * Usage:
 *   bun freebuff/local-api-server.js [--port 3457]
 *
 * Then run the AIGENEV7 CLI:
 *   CODEBUFF_API_KEY=local-dev-key CODEBUFF_APP_URL=http://localhost:3457 ./freebuff.exe
 */

import { existsSync, readFileSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Configuration ───────────────────────────────────────────────────────

const PORT = parseInt(process.env.AIGENEV7_API_PORT ?? '3457', 10)
const DEFAULT_MODEL = process.env.AIGENEV7_DEFAULT_MODEL ?? 'nvidia-llama-3.1-8b'

// Load .env file from freebuff/ directory
function loadEnv() {
  const envPath = resolve(__dirname, '.env')
  if (!existsSync(envPath)) return {}
  const content = readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    // Strip quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
    process.env[key] = value // Set so inference.js can read it
  }
  return env
}

// ── Request Logging ─────────────────────────────────────────────────────

const log = {
  info: (...args) => console.error(`[API]`, ...args),
  warn: (...args) => console.error(`[API] ⚠`, ...args),
  error: (...args) => console.error(`[API] ✗`, ...args),
}

// ── Dynamic Model Loader ────────────────────────────────────────────────

async function getModel(modelId) {
  try {
    const { getModel, detectBestModel } = await import(resolve(__dirname, 'models.js'))
    let model = getModel(modelId)
    if (!model) model = detectBestModel()
    return model
  } catch (err) {
    log.error(`Failed to load models: ${err.message}`)
    return null
  }
}

async function getModelById(modelId) {
  try {
    const { getModel } = await import(resolve(__dirname, 'models.js'))
    return getModel(modelId) || null
  } catch {
    return null
  }
}

// ── Inference Wrapper ───────────────────────────────────────────────────

async function runInference(modelId, messages, opts = {}) {
  const { infer } = await import(resolve(__dirname, 'inference.js'))
  return infer({
    model: modelId,
    messages,
    stream: opts.stream ?? false,
    maxTokens: opts.maxTokens ?? undefined,
    temperature: opts.temperature ?? undefined,
    writeToStdout: false,
    onChunk: opts.onChunk,
  })
}

// ── Token Counter (local estimate) ──────────────────────────────────────

function estimateTokens(text) {
  // Rough estimate: ~4 chars per token for English text
  return Math.ceil(text.length / 4)
}

function countMessagesTokens(messages) {
  let total = 0
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      total += estimateTokens(msg.content)
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text') total += estimateTokens(part.text)
      }
    }
    // Add overhead per message
    total += 4 // role + formatting overhead
  }
  return total
}

// ── Server ──────────────────────────────────────────────────────────────

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const method = req.method
    const path = url.pathname
    const startTime = Date.now()

    // ── CORS ──
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-codebuff-api-key, x-freebuff-instance-id, x-freebuff-model',
        },
      })
    }
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
    }

    try {
      // ================================================================
      // POST /api/v1/chat/completions — LLM Inference (OpenAI-compatible)
      // ================================================================
      if (method === 'POST' && path === '/api/v1/chat/completions') {
        const body = await req.json()
        const { model: requestedModel, messages, stream: shouldStream, max_tokens: rawMaxTokens, temperature, ...extra } = body
        // Clamp max_tokens to prevent API errors from huge values (e.g., CLI sending 1e18 which exceeds u32)
        const max_tokens = (rawMaxTokens != null && rawMaxTokens > 10000000) ? undefined : rawMaxTokens

        if (!messages || !Array.isArray(messages)) {
          return Response.json({ error: 'messages is required' }, { status: 400, headers: corsHeaders })
        }

        // Map the OpenRouter-style model ID (e.g. "deepseek/deepseek-chat") to our local model ID
        const localModelId = mapModelId(requestedModel || DEFAULT_MODEL)
        log.info(`[infer] ${localModelId} (requested: ${requestedModel}) — ${messages.length} messages, stream=${!!shouldStream}`)

        if (shouldStream) {
          // SSE streaming response
          const { readable, writable } = new TransformStream()
          const writer = writable.getWriter()
          const encoder = new TextEncoder()

          // Run inference with onChunk callback for real-time streaming
          runInference(localModelId, messages, {
            stream: true,
            maxTokens: max_tokens,
            temperature,
            onChunk: (chunk) => {
              const sseData = {
                id: `chatcmpl-${crypto.randomUUID()}`,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: requestedModel || localModelId,
                choices: [{
                  index: 0,
                  delta: { content: chunk },
                  finish_reason: null,
                }],
              }
              writer.write(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`))
            },
          }).then((fullText) => {
            // Send the final [DONE] chunk
            const finalSse = {
              id: `chatcmpl-${crypto.randomUUID()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: requestedModel || localModelId,
              choices: [{
                index: 0,
                delta: {},
                finish_reason: 'stop',
              }],
              usage: {
                prompt_tokens: countMessagesTokens(messages),
                completion_tokens: fullText ? estimateTokens(fullText) : 0,
              },
            }
            writer.write(encoder.encode(`data: ${JSON.stringify(finalSse)}\n\n`))
            writer.write(encoder.encode('data: [DONE]\n\n'))
            writer.close()
          }).catch((err) => {
            // Error in SSE format
            const errSse = {
              error: { message: err.message },
            }
            writer.write(encoder.encode(`data: ${JSON.stringify(errSse)}\n\n`))
            writer.close()
          })

          return new Response(readable, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          })
        }

        // Non-streaming response
        const result = await runInference(localModelId, messages, {
          stream: false,
          maxTokens: max_tokens,
          temperature,
        })

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        const outputTokens = result ? estimateTokens(result) : 0
        log.info(`[infer] ✓ Done (${elapsed}s, ~${outputTokens} tokens)`)

        return Response.json({
          id: `chatcmpl-${crypto.randomUUID()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: requestedModel || localModelId,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: result || '',
            },
            finish_reason: 'stop',
          }],
          usage: {
            prompt_tokens: countMessagesTokens(messages),
            completion_tokens: outputTokens,
            total_tokens: countMessagesTokens(messages) + outputTokens,
          },
        }, { headers: corsHeaders })
      }

      // ================================================================
      // GET /api/v1/chat/completions (streaming via SSE)
      // ================================================================
      if (method === 'GET' && path === '/api/v1/chat/completions') {
        // The AI SDK sometimes uses GET for streaming. Return an error
        // since we handle streaming differently.
        return Response.json({ error: 'Use POST for streaming' }, { status: 405, headers: corsHeaders })
      }

      // ================================================================
      // GET /api/v1/me — User Info
      // ================================================================
      if ((method === 'GET' || method === 'POST') && path === '/api/v1/me') {
        return Response.json({
          id: 'local-user',
          name: 'Local User',
          email: 'local@aigenev7.ai',
          image: null,
        }, { headers: corsHeaders })
      }

      // ================================================================
      // POST /api/v1/usage — Usage Tracking
      // ================================================================
      if (method === 'POST' && path === '/api/v1/usage') {
        return Response.json({
          type: 'usage-response',
          usage: 0,
          remainingBalance: 999999,
          balanceBreakdown: { free: 999999 },
          next_quota_reset: null,
        }, { headers: corsHeaders })
      }

      // ================================================================
      // GET /api/v1/usage — Usage (alternative method)
      // ================================================================
      if (method === 'GET' && path === '/api/v1/usage') {
        return Response.json({
          type: 'usage-response',
          usage: 0,
          remainingBalance: 999999,
          next_quota_reset: null,
        }, { headers: corsHeaders })
      }

      // ================================================================
      // POST /api/v1/token-count — Token Counting
      // ================================================================
      if (method === 'POST' && path === '/api/v1/token-count') {
        const body = await req.json().catch(() => ({}))
        const { messages = [], system = '', tools = [] } = body
        const messagesTokens = countMessagesTokens(messages)
        const systemTokens = estimateTokens(system)
        const toolsTokens = estimateTokens(JSON.stringify(tools))
        return Response.json({
          inputTokens: messagesTokens + systemTokens + toolsTokens,
        }, { headers: corsHeaders })
      }



      // ================================================================
      // GET/POST /api/v1/freebuff/session — Freebuff Session
      // ================================================================
      if (path === '/api/v1/freebuff/session') {
        const instanceId = `local-${crypto.randomUUID().slice(0, 8)}`
        const model = process.env.AIGENEV7_DEFAULT_MODEL || DEFAULT_MODEL

        if (method === 'GET' || method === 'POST') {
          return Response.json({
            status: 'active',
            accessTier: 'full',
            instanceId,
            model,
            admittedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
            remainingMs: 3_600_000,
          }, {
            status: method === 'POST' ? 201 : 200,
            headers: corsHeaders,
          })
        }

        if (method === 'DELETE') {
          return new Response(null, { status: 204, headers: corsHeaders })
        }

        return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
      }

      // ================================================================
      // POST /api/v1/feedback — Submit Feedback
      // ================================================================
      if (method === 'POST' && path === '/api/v1/feedback') {
        return Response.json({ success: true }, { headers: corsHeaders })
      }

      // ================================================================
      // POST /api/v1/web-search — Web Search (unavailable locally)
      // ================================================================
      if (method === 'POST' && path === '/api/v1/web-search') {
        return Response.json({
          error: 'Web search is not available in local mode. Install the AIGENEV7 browser-use agent for web access.',
        }, { status: 501, headers: corsHeaders })
      }

      // ================================================================
      // POST /api/v1/docs-search — Documentation Search (unavailable locally)
      // ================================================================
      if (method === 'POST' && path === '/api/v1/docs-search') {
        return Response.json({
          error: 'Documentation search is not available in local mode.',
        }, { status: 501, headers: corsHeaders })
      }

      // ================================================================
      // POST /api/v1/gravity-index — Service Recommendations (unavailable locally)
      // ================================================================
      if (method === 'POST' && path === '/api/v1/gravity-index') {
        return Response.json({
          error: 'Service recommendations are not available in local mode.',
        }, { status: 501, headers: corsHeaders })
      }

      // ================================================================
      // POST /api/agents/publish — Agent Publishing (unavailable locally)
      // ================================================================
      if (method === 'POST' && path === '/api/agents/publish') {
        return Response.json({
          error: 'Agent publishing is not available in local mode.',
        }, { status: 501, headers: corsHeaders })
      }

      // ================================================================
      // GET /api/agents — Agent listing
      // ================================================================
      if ((method === 'GET' || method === 'POST') && path.startsWith('/api/agents')) {
        return Response.json({ agents: [] }, { headers: corsHeaders })
      }

      // ================================================================
      // POST /api/v1/agent-runs — Start/Finish agent run tracking
      // ================================================================
      if (method === 'POST' && path === '/api/v1/agent-runs') {
        const body = await req.json().catch(() => ({ action: 'START' }))
        if (body.action === 'START') {
          // Start a new agent run — return a unique run ID
          return Response.json({
            runId: `local-run-${crypto.randomUUID().slice(0, 12)}`,
          }, { headers: corsHeaders })
        }
        if (body.action === 'FINISH') {
          // Finish an agent run — acknowledge silently
          return Response.json({ success: true }, { headers: corsHeaders })
        }
        return Response.json({ error: `Unknown action: ${body.action}` }, { status: 400, headers: corsHeaders })
      }

      // ================================================================
      // POST /api/v1/agent-runs/:runId/steps — Add agent run step
      // ================================================================
      if (method === 'POST' && path.startsWith('/api/v1/agent-runs/') && path.endsWith('/steps')) {
        return Response.json({
          stepId: `local-step-${crypto.randomUUID().slice(0, 12)}`,
        }, { headers: corsHeaders })
      }



      // ================================================================
      // GET /health — Health check
      // ================================================================
      if (path === '/health' || path === '/api/health') {
        return Response.json({
          status: 'ok',
          version: '7.0.0-local',
          server: 'AIGENEV7 Local API Server',
        }, { headers: corsHeaders })
      }

      // ── 404 Fallback ──
      log.warn(`Unhandled: ${method} ${path}`)
      return Response.json({
        error: `Not found: ${method} ${path}`,
      }, { status: 404, headers: corsHeaders })

    } catch (err) {
      log.error(`${method} ${path}: ${err.message}`)
      return Response.json({
        error: err.message,
      }, { status: 500, headers: corsHeaders })
    }
  },
})

// ── Model ID Mapping ────────────────────────────────────────────────────

/**
 * Map OpenRouter-style model IDs and common aliases to AIGENEV7 local model IDs.
 */
function mapModelId(requested) {
  if (!requested) return DEFAULT_MODEL

  const id = requested.toLowerCase()

  // Direct match (already a local model ID)
  if (id.startsWith('nvidia-') || id.startsWith('deepseek-') || id.startsWith('claude-') ||
      id.startsWith('gpt-') || id.startsWith('gemini-') || id.startsWith('kimi-') ||
      id.startsWith('mimo-') || id.startsWith('minimax-') || id.startsWith('grok-') ||
      id.startsWith('fable-') || id.startsWith('llama-') || id.startsWith('nemotron-') ||
      id.startsWith('mistral-')) {
    return requested
  }

  // OpenRouter-style: "deepseek/deepseek-chat" → "deepseek-v4-pro"
  // "openai/gpt-4o" → "gpt-4o"
  // "anthropic/claude-sonnet-4" → "claude-sonnet-4"
  const slashed = id.includes('/')
  const shortName = slashed ? id.split('/').pop() : id

  // Map common model names — matches shortName (last segment after /) or full id
  // OpenAI models
  const modelMap = {
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-4': 'gpt-4o',
    'gpt-4-turbo': 'gpt-4o',
    'gpt-4.1': 'gpt-4.1',
    'gpt-4.1-mini': 'gpt-4.1',
    'gpt-4.1-nano': 'gpt-4.1',
    'gpt-5': 'gpt-5',
    'gpt-5-mini': 'gpt-5',
    'o3': 'o3',
    'o3-mini': 'o3-mini',
    'o4-mini': 'o4-mini',
    'o3-pro': 'o3-pro',
    // DeepSeek models
    'deepseek-chat': 'deepseek-v4-pro',
    'deepseek-coder': 'deepseek-v4-pro',
    'deepseek-reasoner': 'deepseek-reasoner',
    'deepseek-v3': 'deepseek-v4-pro',
    'deepseek-v4': 'deepseek-v4-pro',
    'deepseek-v4-pro': 'deepseek-v4-pro',
    'deepseek-v4-flash': 'deepseek-v4-flash',
    // Anthropic Claude models
    'claude-sonnet-4': 'claude-sonnet-4',
    'claude-4-sonnet': 'claude-sonnet-4',
    'claude-3.5-sonnet': 'claude-sonnet-4',
    'claude-3-sonnet': 'claude-sonnet-4',
    'claude-opus-4': 'claude-opus-4',
    'claude-4-opus': 'claude-opus-4',
    'claude-3-opus': 'claude-opus-4',
    'claude-sonnet-4.5': 'claude-sonnet-4.5',
    'claude-4.5-sonnet': 'claude-sonnet-4.5',
    'claude-haiku-3.5': 'claude-haiku-3.5',
    'claude-3.5-haiku': 'claude-haiku-3.5',
    'claude-opus-4.1': 'claude-opus-4',
    'fable-5': 'fable-5',
    'claude-fable-5': 'fable-5',
    // Google Gemini
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-pro': 'gemini-2.5-pro',
    'gemini-2.0-flash': 'gemini-2.5-flash',
    // xAI Grok
    'grok-4': 'grok-4',
    'grok-3': 'grok-4',
    'grok-2': 'grok-4',
    // Kimi / Moonshot
    'kimi': 'kimi-k2.6',
    'k2': 'kimi-k2.6',
    'kimi-k2.6': 'kimi-k2.6',
    'moonshot': 'kimi-k2.6',
    // MiMo
    'mimo-v2.5-pro': 'mimo-v2.5-pro',
    'mimo-v2.5': 'mimo-v2.5',
    'mimo': 'mimo-v2.5-pro',
    // MiniMax
    'minimax-m3': 'minimax-m3',
    'minimax-m2.7': 'minimax-m2.7',
    'minimax': 'minimax-m3',
    'hailuo': 'minimax-m3',
    // NVIDIA NIM
    'llama-3.1-8b': 'nvidia-llama-3.1-8b',
    'llama-3.1-70b': 'nvidia-llama-3.1-70b',
    'llama-3.1-405b': 'nvidia-llama-3.1-405b',
    'llama-3': 'nvidia-llama-3.1-8b',
    'llama': 'nvidia-llama-3.1-8b',
    'mistral-large': 'nvidia-mistral-large',
    'mixtral': 'nvidia-mistral-large',
    'mistral': 'nvidia-mistral-large',
    'nemotron': 'nvidia-nemotron-4-340b',
    // OpenRouter passthrough
    'openrouter-claude-sonnet-4.5': 'openrouter-claude-sonnet-4.5',
    'openrouter-gpt-5': 'openrouter-gpt-5',
    'openrouter-gemini-2.5-pro': 'openrouter-gemini-2.5-pro',
  }

  const mapped = modelMap[shortName] || modelMap[id]
  if (!mapped) {
    log.warn(`Unknown model "${requested}" — falling back to "${DEFAULT_MODEL}". Check the model name or add a mapping in mapModelId().`)
    return DEFAULT_MODEL
  }
  return mapped
}

// ── Startup ─────────────────────────────────────────────────────────────

const env = loadEnv()

// Detect configured providers
const PROVIDER_LABELS = {
  ANTHROPIC_API_KEY: 'Anthropic',
  DEEPSEEK_API_KEY: 'DeepSeek',
  OPENAI_API_KEY: 'OpenAI',
  GOOGLE_API_KEY: 'Gemini',
  NVIDIA_API_KEY: 'NVIDIA',
  XAI_API_KEY: 'Grok',
  MOONSHOT_API_KEY: 'Moonshot',
  MIMO_API_KEY: 'MiMo',
  MINIMAX_API_KEY: 'MiniMax',
  OPENROUTER_API_KEY: 'OpenRouter',
}
const configuredProviders = Object.entries(PROVIDER_LABELS)
  .filter(([envKey]) => process.env[envKey])
  .map(([, label]) => label)

console.error('')
console.error('  ╔══════════════════════════════════════════════╗')
console.error('  ║     AIGENEV7 Local API Server v7.0.0        ║')
console.error('  ╚══════════════════════════════════════════════╝')
console.error('')
console.error(`  🚀  Server:  http://localhost:${PORT}`)
console.error(`  🔑  Token:   ${process.env.CODEBUFF_API_KEY || 'local-dev-key'}`)
console.error(`  🤖  Model:   ${process.env.AIGENEV7_DEFAULT_MODEL || DEFAULT_MODEL}`)
if (configuredProviders.length > 0) {
  console.error(`  📡  Providers:`)
  for (const provider of configuredProviders) {
    console.error(`       • ${provider}`)
  }
} else {
  console.error(`  📡  Providers: NONE — set API keys in .env`)
}
console.error('')
console.error('  Run the AIGENEV7 CLI:')
console.error(`    CODEBUFF_API_KEY=${process.env.CODEBUFF_API_KEY || 'local-dev-key'} CODEBUFF_APP_URL=http://localhost:${PORT} ./freebuff.exe`)
console.error('')
console.error('  Or with env auto-detection:')
console.error(`    CODEBUFF_API_KEY=${process.env.CODEBUFF_API_KEY || 'local-dev-key'} CODEBUFF_APP_URL=http://localhost:${PORT} FREE_MODE=true ./freebuff.exe --help`)
console.error('')
console.error('  Press Ctrl+C to stop the server')
console.error('')
