#!/usr/bin/env bun

/**
 * AIGENEV7 CLI — Free AI Coding Agent
 *
 * Usage:
 *   bun inference-cli.js [command] [options]
 *
 * Commands:
 *   ask      Send a prompt (default)
 *   chat     Interactive chat mode
 *   models   List available models
 *   serve    Start web server
 *
 * Examples:
 *   bun inference-cli.js ask "Explain quantum computing"
 *   bun inference-cli.js ask "Write a Python web server" --model fable-5
 *   bun inference-cli.js chat
 *   bun inference-cli.js models
 *   bun inference-cli.js serve --port 3456
 */

import { createInterface } from 'readline'
import { infer } from './inference.js'

const [, , command, ...args] = process.argv

// Parse flags
const flags = {}
const positional = []
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2).replace(/-/g, '_')
    const next = args[i + 1]
    if (next && !next.startsWith('--')) {
      flags[key] = next
      i++
    } else {
      flags[key] = true
    }
  } else {
    positional.push(args[i])
  }
}

const prompt = flags.prompt || positional.join(' ')
const model = flags.model || flags.m
const stream = flags.stream !== false && flags.no_stream === undefined
const maxTokens = flags.max_tokens === 'Infinity' ? Infinity : flags.max_tokens ? Number(flags.max_tokens) : undefined
const temperature = flags.temperature ? Number(flags.temperature) : undefined
const port = flags.port ? Number(flags.port) : 3456

// ── Help ──
function showHelp() {
  console.log(`
  AIGENEV7 — Free AI Coding Agent v7.0.0

  Usage:
    bun inference-cli.js <command> [options]

  Commands:
    ask <prompt>     Send a one-shot prompt (default)
    chat             Interactive chat session
    models           List all available models
    serve            Start the web interface server

  Options:
    --model, -m <id>         Model ID (default: deepseek-v4-pro)
    --stream / --no-stream   Enable/disable streaming (default: stream)
    --max-tokens <n>         Max output tokens (default: Infinity)
    --temperature <n>        Temperature 0-2 (default: 0.7)
    --uncensored             Uncensored mode (default: true)
    --port <n>               Web server port (default: 3456)
    --help                   Show this help message

  Examples:
    bun inference-cli.js "Explain quantum computing"
    bun inference-cli.js ask "Write a REST API" --model fable-5 --no-stream
    bun inference-cli.js chat
    bun inference-cli.js models
    bun inference-cli.js serve --port 8080
`)
}

// ── Models Command ──
async function listModels() {
  const { MODELS, getModelsByProvider } = await import('./models.js')
  const byProvider = getModelsByProvider()

  console.log('\n  ╔══════════════════════════════════════════════╗')
  console.log('  ║     AIGENEV7 — Available Models             ║')
  console.log('  ╚══════════════════════════════════════════════╝\n')

  for (const [provider, models] of Object.entries(byProvider)) {
    console.log(`  ${provider.charAt(0).toUpperCase() + provider.slice(1)}:`)
    for (const m of models) {
      const tag = m.multimodal ? ' 📷' : ''
      const keyStatus = process.env[`${provider.toUpperCase()}_API_KEY`] ? '✓' : '○'
      console.log(`    ${keyStatus} ${m.id.padEnd(28)} ${m.displayName}${tag}`)
      console.log(`      ${m.description}`)
    }
    console.log()
  }

  console.log('  ✓ = API key configured   ○ = No key set\n')
}

// ── Chat Command ──
async function chatMode() {
  console.log('\n  ╔══════════════════════════════════════════════╗')
  console.log('  ║     AIGENEV7 — Interactive Chat             ║')
  console.log('  ╚══════════════════════════════════════════════╝')
  console.log('  Type /quit to exit, /model <id> to switch models')
  console.log()

  // Prompt for model selection
  const { MODELS } = await import('./models.js')
  console.log('  Available models:')
  MODELS.slice(0, 10).forEach((m, i) => {
    console.log(`    ${i + 1}. ${m.id} — ${m.displayName}`)
  })
  console.log()

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  let currentModel = model || process.env.AIGENEV7_DEFAULT_MODEL || 'deepseek-v4-pro'
  const messages = []
  const askQuestion = () => {
    rl.question(`  [${currentModel}] > `, async (input) => {
      const trimmed = input.trim()

      if (trimmed === '/quit' || trimmed === '/exit' || trimmed === '/q') {
        console.log('\n  Goodbye!')
        rl.close()
        return
      }

      if (trimmed.startsWith('/model')) {
        const newModel = trimmed.slice(7).trim()
        const m = MODELS.find((m) => m.id === newModel)
        if (m) {
          currentModel = newModel
          console.log(`  ✓ Switched to ${m.displayName}`)
        } else {
          console.log(`  ✗ Unknown model: ${newModel}`)
        }
        askQuestion()
        return
      }

      if (trimmed === '/help') {
        console.log('  Commands: /quit, /model <id>, /help')
        askQuestion()
        return
      }

      try {
        messages.push({ role: 'user', content: trimmed })
        const response = await infer({
          model: currentModel,
          messages: [...messages],
          stream: true,
          writeToStdout: true,
        })
        messages.push({ role: 'assistant', content: response })
        if (!response) console.log('  [No response]')
      } catch (err) {
        console.error(`\n  ✗ Error: ${err.message}`)
      }

      askQuestion()
    })
  }

  askQuestion()
}

// ── Serve Command ──
async function serve() {
  console.log(`\n  [AIGENEV7] Starting web server on http://localhost:${port}`)
  console.log(`  [AIGENEV7] Open http://localhost:${port} in your browser\n`)

  const { fileURLToPath } = await import('url')
  const { resolve, dirname } = await import('path')
  const { readFileSync, existsSync } = await import('fs')

  const __dirname = dirname(fileURLToPath(import.meta.url))
  const htmlPath = resolve(__dirname, 'web', 'index.html')

  if (!existsSync(htmlPath)) {
    console.error(`  ✗ Web interface not found at ${htmlPath}`)
    console.error('  Run from the freebuff/ directory')
    process.exit(1)
  }

  const html = readFileSync(htmlPath, 'utf8')

  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url)

      if (url.pathname === '/') {
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        })
      }

      if (url.pathname === '/api/infer' && req.method === 'POST') {
        try {
          const body = await req.json()
          const { prompt: userPrompt, model: modelId, stream: shouldStream } = body

          if (!userPrompt) {
            return new Response(JSON.stringify({ error: 'No prompt provided' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          if (shouldStream) {
            const { readable, writable } = new TransformStream()
            const writer = writable.getWriter()
            const encoder = new TextEncoder()

            // Run inference without streaming (the stream flag in infer is for the CLI)
            infer({
              model: modelId,
              messages: [{ role: 'user', content: userPrompt }],
              stream: false,
              onChunk: (chunk) => {
                writer.write(encoder.encode(JSON.stringify({ chunk }) + '\n'))
              },
            }).then((fullText) => {
              writer.write(encoder.encode(JSON.stringify({ done: true, text: fullText }) + '\n'))
              writer.close()
            }).catch((err) => {
              writer.write(encoder.encode(JSON.stringify({ error: err.message }) + '\n'))
              writer.close()
            })

            return new Response(readable, {
              headers: { 'Content-Type': 'application/x-ndjson' },
            })
          }

          const result = await infer({
            model: modelId,
            messages: [{ role: 'user', content: userPrompt }],
            stream: false,
          })

          return new Response(JSON.stringify({ result }), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }

      if (url.pathname === '/api/models') {
        const { MODELS } = await import('./models.js')
        return new Response(JSON.stringify({ models: MODELS }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response('Not found', { status: 404 })
    },
  })
}

// ── Main ──
async function main() {
  if (command === 'help' || command === '--help' || command === '-h') {
    showHelp()
    return
  }

  if (command === 'models' || command === 'list') {
    await listModels()
    return
  }

  if (command === 'chat' || command === 'interactive') {
    await chatMode()
    return
  }

  if (command === 'serve' || command === 'server') {
    await serve()
    return
  }

  // Default: ask command
  const askPrompt = command === 'ask' ? prompt : [command, ...args.filter((a) => !a.startsWith('--'))].join(' ')

  if (!askPrompt) {
    showHelp()
    return
  }

  try {
    const result = await infer({
      model,
      messages: [{ role: 'user', content: askPrompt }],
      stream,
      writeToStdout: true,
      maxTokens,
      temperature,
    })

    if (!stream) {
      console.log(result)
    }
  } catch (err) {
    console.error(`[AIGENEV7] ✗ Error: ${err.message}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`[AIGENEV7] ✗ Fatal: ${err.message}`)
  process.exit(1)
})
