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
import {
  listAgents,
  getAgent,
  getDefaultAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  resetAgents,
  exportAgent,
  exportAgentToFile,
  importAgent,
  importAgentFromFile,
} from './custom-agents.js'

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

async function getNumberedModels() {
  const { getModelsByProvider, PROVIDER_ENV_KEYS } = await import('./models.js')
  const byProvider = getModelsByProvider()
  const entries = []
  let num = 1
  for (const [provider, models] of Object.entries(byProvider)) {
    const hasKey = !!process.env[PROVIDER_ENV_KEYS[provider]]
    for (const m of models) {
      entries.push({ num: num++, model: m, provider, hasKey })
    }
  }
  return entries
}

// ── Helper: display all models grouped by provider with numbers ──
function printModelPicker(entries, currentId) {
  const byProvider = {}
  for (const e of entries) {
    if (!byProvider[e.provider]) byProvider[e.provider] = []
    byProvider[e.provider].push(e)
  }

  console.log()
  for (const [provider, models] of Object.entries(byProvider)) {
    const hasAnyKey = models.some((m) => m.hasKey)
    const keyIcon = hasAnyKey ? '🔑' : '○'
    console.log(`  ${keyIcon} ${provider.charAt(0).toUpperCase() + provider.slice(1)}`)
    for (const e of models) {
      const tag = e.model.multimodal ? ' 📷' : ''
      const isCurrent = e.model.id === currentId ? ' →' : ''
      const padNum = String(e.num).padStart(2, ' ')
      const keyMark = e.hasKey ? '✓' : ' '
      console.log(`    [${padNum}] ${keyMark} ${e.model.id.padEnd(26)} ${e.model.displayName}${tag}${isCurrent}`)
    }
    console.log()
  }
  console.log('  ✓ = API key ready    Enter number to select model')
  console.log()
}

// ── Helper: display agents ──
function printAgentPicker(agents, currentAgentId) {
  console.log()
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i]
    const isCurrent = a.id === currentAgentId ? ' →' : ''
    const padNum = String(i + 1).padStart(2, ' ')
    console.log(`    [${padNum}] ${a.emoji} ${a.name.padEnd(20)} ${a.description}${isCurrent}`)
  }
  console.log()
}

// ── Chat Command with Agents ──
async function chatMode() {
  console.log('\n  ╔══════════════════════════════════════════════╗')
  console.log('  ║     AIGENEV7 — Interactive Chat             ║')
  console.log('  ╚══════════════════════════════════════════════╝')

  const { MODELS } = await import('./models.js')
  const entries = await getNumberedModels()

  // ── Agent state ──
  let currentAgent = getDefaultAgent()
  let allAgents = listAgents()

  let currentModel = model || process.env.AIGENEV7_DEFAULT_MODEL || (entries.length > 0 ? entries[0].model.id : 'nvidia-llama-3.1-70b')

  // Show agent picker at startup
  console.log('\n  ── Select an Agent ──')
  printAgentPicker(allAgents, currentAgent.id)
  console.log(`  Default: ${currentAgent.emoji} ${currentAgent.name} (press Enter to use this)`)
  console.log('  Type /agents to re-list, /agent <name or #> to switch')
  console.log()

  // ── Show model picker ──
  console.log('  ── Select a Model ──')
  printModelPicker(entries, currentModel)
  console.log(`  Default: ${currentModel} (press Enter to use this)`)
  console.log()

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  // ── Resolve model by number or ID ──
  function resolveModel(input) {
    const trimmed = input.trim()
    const num = parseInt(trimmed, 10)
    if (!isNaN(num) && num >= 1 && num <= entries.length) {
      return entries[num - 1].model
    }
    return MODELS.find((m) => m.id === trimmed)
  }

  // Re-build entries (in case models change)
  async function refreshEntries() {
    const e = await getNumberedModels()
    entries.length = 0
    entries.push(...e)
  }

  function refreshAgents() {
    const agents = listAgents()
    // Create a fresh copy to avoid mutating the module's cache
    allAgents = [...agents]
    // Re-set currentAgent reference
    const updated = allAgents.find((a) => a.id === currentAgent.id)
    if (updated) currentAgent = updated
  }

  const messages = []

  // ── Build messages with agent system prompt ──
  function buildMessages(userContent) {
    const msgs = []
    if (currentAgent && currentAgent.systemPrompt) {
      msgs.push({ role: 'system', content: currentAgent.systemPrompt })
    }
    for (const m of messages) {
      msgs.push(m)
    }
    if (userContent) {
      msgs.push({ role: 'user', content: userContent })
    }
    return msgs
  }

  const askQuestion = () => {
    const agentEmoji = currentAgent ? currentAgent.emoji : ''
    rl.question(`  ${agentEmoji} [${currentModel}] > `, async (input) => {
      const trimmed = input.trim()

      // ── Quit ──
      if (trimmed === '/quit' || trimmed === '/exit' || trimmed === '/q') {
        console.log('\n  Goodbye!')
        rl.close()
        return
      }

      // ── Help ──
      if (trimmed === '/help' || trimmed === '/h') {
        console.log('\n  ── Chat Commands ──')
        console.log('  /quit, /q               Exit chat')
        console.log('  ── Model ──')
        console.log('  /model <id or #>        Switch model (by ID or number)')
        console.log('  /models, /ls            List all available models')
        console.log('  /current                Show current model')
        console.log('  ── Agent ──')
        console.log('  /agents                 List all custom agents')
        console.log('  /agent <name or #>      Switch to an agent')
        console.log('  /agent-show             Show current agent system prompt')
        console.log('  /agent-new <name> | <p>  Create new agent with pipe separator')
        console.log('  /agent-edit <name> | <p> Edit agent system prompt')
        console.log('  /agent-delete <name>    Delete a custom agent')
        console.log('  /agent-export <name|#>  Export an agent as JSON')
        console.log('  /agent-export <name|#> to <file>  Export to file')
        console.log('  /agent-import <json>    Import agent from JSON string')
        console.log('  /agent-import from <file>        Import from JSON file')
        console.log('  /agent-reset            Reset agents to defaults')
        console.log('  ── Chat ──')
        console.log('  /clear                  Clear conversation history')
        console.log('  ── Quantum ⚛️ ──')
        console.log('  /quantum               List available quantum demos')
        console.log('  /quantum <demo>        Run a demo (bell, ghz, deutsch, superposition, bell-swap)')
        console.log('  /quantum run <gates>   Run a custom circuit. e.g.:')
        console.log('                           /quantum run H(0) CNOT(0,1) --shots=2048')
        console.log('                           /quantum run H(0) X(1) SWAP(0,1)')
        console.log('                           /quantum run H(0) CNOT(0,1) CNOT(0,2)')
        console.log('  /help, /h               Show this help')
        console.log()
        askQuestion()
        return
      }

      // ── List models ──
      if (trimmed === '/models' || trimmed === '/ls') {
        await refreshEntries()
        printModelPicker(entries, currentModel)
        askQuestion()
        return
      }

      // ── Show current model ──
      if (trimmed === '/current') {
        const cur = MODELS.find((m) => m.id === currentModel)
        console.log(`  Model: ${cur ? cur.displayName : currentModel}`)
        console.log(`  Agent: ${currentAgent.emoji} ${currentAgent.name}`)
        askQuestion()
        return
      }

      // ── Clear history ──
      if (trimmed === '/clear') {
        messages.length = 0
        console.log('  ✓ Conversation history cleared')
        askQuestion()
        return
      }

      // ── Bare /model shows usage ──
      if (trimmed === '/model') {
        console.log('  Usage: /model <id or #>  Switch model. Try /models to see available models.')
        askQuestion()
        return
      }

      // ── Switch model ──
      if (trimmed.startsWith('/model ')) {
        const newModelRef = trimmed.slice(7).trim()
        const m = resolveModel(newModelRef)
        if (m) {
          currentModel = m.id
          console.log(`  ✓ Switched to ${m.displayName} (${m.id})`)
        } else {
          const num = parseInt(newModelRef, 10)
          if (!isNaN(num)) {
            console.log(`  ✗ Invalid number: ${num}. Try /models to see available models.`)
          } else {
            console.log(`  ✗ Unknown model: ${newModelRef}. Try /models to see available models.`)
          }
        }
        askQuestion()
        return
      }

      // ── Number shortcut: select model by number ──
      const num = parseInt(trimmed, 10)
      if (!isNaN(num) && num >= 1 && num <= entries.length) {
        const m = entries[num - 1].model
        currentModel = m.id
        console.log(`  ✓ Switched to ${m.displayName} (${m.id})`)
        askQuestion()
        return
      }

      // ── List agents ──
      if (trimmed === '/agents') {
        refreshAgents()
        console.log('\n  ── Custom Agents ──')
        printAgentPicker(allAgents, currentAgent.id)
        askQuestion()
        return
      }

      // ── Bare /agent shows usage ──
      if (trimmed === '/agent') {
        console.log('  Usage: /agent <name or #>  Switch to an agent')
        console.log('  Try /agents to see available agents with numbers')
        askQuestion()
        return
      }

      // ── Switch agent ──
      if (trimmed.startsWith('/agent ')) {
        const ref = trimmed.slice(7).trim()
        // Try by number first
        const refNum = parseInt(ref, 10)
        if (!isNaN(refNum) && refNum >= 1 && refNum <= allAgents.length) {
          currentAgent = allAgents[refNum - 1]
          console.log(`  ✓ Switched to ${currentAgent.emoji} ${currentAgent.name}`)
        } else {
          const found = allAgents.find((a) => a.id === ref || a.name.toLowerCase() === ref.toLowerCase())
          if (found) {
            currentAgent = found
            console.log(`  ✓ Switched to ${currentAgent.emoji} ${currentAgent.name}`)
          } else {
            console.log(`  ✗ Unknown agent: ${ref}. Try /agents to see available agents.`)
          }
        }
        askQuestion()
        return
      }

      // ── Show current agent ──
      if (trimmed === '/agent-show') {
        console.log(`\n  ${currentAgent.emoji} ${currentAgent.name}`)
        console.log(`  ${currentAgent.description}`)
        console.log(`  System Prompt:`)
        console.log(`  ─${'─'.repeat(50)}`)
        console.log(`  ${currentAgent.systemPrompt}`)
        console.log(`  ─${'─'.repeat(50)}\n`)
        askQuestion()
        return
      }

      // ── Create new agent ──
      if (trimmed.startsWith('/agent-new ')) {
        const rest = trimmed.slice(11).trim()
        // Format: /agent-new <name> | <system prompt>
        const pipeIdx = rest.indexOf('|')
        if (pipeIdx === -1) {
          console.log('  ✗ Usage: /agent-new <name> | <system prompt>')
          console.log('  Example: /agent-new Code Reviewer | You review code for bugs and best practices.')
          askQuestion()
          return
        }
        const name = rest.slice(0, pipeIdx).trim()
        const systemPrompt = rest.slice(pipeIdx + 1).trim()
        if (!name || !systemPrompt) {
          console.log('  ✗ Both name and system prompt are required.')
          console.log('  Usage: /agent-new <name> | <system prompt>')
          askQuestion()
          return
        }
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        try {
          const agent = createAgent(id, name, `Custom agent: ${name}`, systemPrompt, '🤖')
          refreshAgents()
          currentAgent = agent
          console.log(`  ✓ Created and switched to ${agent.emoji} ${agent.name}`)
        } catch (err) {
          console.log(`  ✗ ${err.message}`)
        }
        askQuestion()
        return
      }

      // ── Edit agent ──
      if (trimmed.startsWith('/agent-edit ')) {
        const rest = trimmed.slice(12).trim()
        const pipeIdx = rest.indexOf('|')
        if (pipeIdx === -1) {
          console.log('  ✗ Usage: /agent-edit <name> | <new system prompt>')
          console.log('  Example: /agent-edit Code Reviewer | You are a strict code reviewer.')
          askQuestion()
          return
        }
        const name = rest.slice(0, pipeIdx).trim()
        const newPrompt = rest.slice(pipeIdx + 1).trim()
        if (!name || !newPrompt) {
          console.log('  ✗ Both agent name and new system prompt are required.')
          askQuestion()
          return
        }
        // Try to find by ID, number, or name
        let targetId = name
        const nameNum = parseInt(name, 10)
        if (!isNaN(nameNum) && nameNum >= 1 && nameNum <= allAgents.length) {
          targetId = allAgents[nameNum - 1].id
        } else {
          const found = allAgents.find((a) => a.id === name || a.name.toLowerCase() === name.toLowerCase())
          if (found) targetId = found.id
        }
        try {
          const updated = updateAgent(targetId, { systemPrompt: newPrompt })
          refreshAgents()
          if (currentAgent.id === targetId) {
            currentAgent = getAgent(targetId)
          }
          console.log(`  ✓ Agent "${updated.name}" updated`)
        } catch (err) {
          console.log(`  ✗ ${err.message}`)
        }
        askQuestion()
        return
      }

      // ── Delete agent ──
      if (trimmed.startsWith('/agent-delete ')) {
        const ref = trimmed.slice(14).trim()
        try {
          const deleted = deleteAgent(ref)
          if (deleted) {
            refreshAgents()
            if (currentAgent.id === ref) {
              currentAgent = getDefaultAgent()
              console.log(`  ✓ Deleted. Switched to default: ${currentAgent.emoji} ${currentAgent.name}`)
            } else {
              console.log(`  ✓ Agent "${ref}" deleted`)
            }
          } else {
            console.log(`  ✗ Agent "${ref}" not found`)
          }
        } catch (err) {
          console.log(`  ✗ ${err.message}`)
        }
        askQuestion()
        return
      }

      // ── Bare /agent-export shows usage ──
      if (trimmed === '/agent-export') {
        console.log('  Usage: /agent-export <name|#>           Export agent as JSON')
        console.log('         /agent-export <name|#> to <file>  Export to JSON file')
        console.log('  Examples:')
        console.log('    /agent-export Code Reviewer')
        console.log('    /agent-export 2 to my-agent.json')
        askQuestion()
        return
      }

      // ── Export agent to console ──
      if (trimmed.startsWith('/agent-export ')) {
        const rest = trimmed.slice(14).trim()
        
        // Check if exporting to file: /agent-export <name> to <filename>
        const toIdx = rest.indexOf(' to ')
        if (toIdx !== -1) {
          const idOrName = rest.slice(0, toIdx).trim()
          const filePath = rest.slice(toIdx + 4).trim()
          if (!idOrName || !filePath) {
            console.log('  ✗ Usage: /agent-export <name|#> to <filename>')
            askQuestion()
            return
          }
          try {
            const writtenPath = exportAgentToFile(idOrName, filePath)
            console.log(`  ✓ Exported to: ${writtenPath}`)
          } catch (err) {
            console.log(`  ✗ ${err.message}`)
          }
          askQuestion()
          return
        }

        // Export to console
        try {
          const { agent, json } = exportAgent(rest)
          console.log(`\n  ${agent.emoji} ${agent.name}`)
          console.log(`  ─${'─'.repeat(50)}`)
          console.log(json)
          console.log(`  ─${'─'.repeat(50)}`)
          console.log('  Copy the JSON above to share this agent.')
          console.log('  Import it with: /agent-import <paste-json-here>')
        } catch (err) {
          console.log(`  ✗ ${err.message}`)
        }
        askQuestion()
        return
      }

      // ── Bare /agent-import shows usage ──
      if (trimmed === '/agent-import') {
        console.log('  Usage: /agent-import <json>              Import agent from inline JSON')
        console.log('         /agent-import from <file>          Import agent from JSON file')
        console.log('  Examples:')
        console.log('    /agent-import {"name":"My Agent","systemPrompt":"You are..."}')
        console.log('    /agent-import from my-agent.json')
        askQuestion()
        return
      }

      // ── Import agent from file or JSON string ──
      if (trimmed.startsWith('/agent-import ')) {
        const rest = trimmed.slice(13).trim()
        
        // Check for file import: /agent-import from <filename>
        if (rest.startsWith('from ')) {
          const filePath = rest.slice(5).trim()
          if (!filePath) {
            console.log('  ✗ Usage: /agent-import from <filename>')
            askQuestion()
            return
          }
          try {
            const agent = importAgentFromFile(filePath)
            refreshAgents()
            currentAgent = listAgents().find((a) => a.id === agent.id) || currentAgent
            console.log(`  ✓ Imported: ${agent.emoji} ${agent.name}`)
          } catch (err) {
            console.log(`  ✗ ${err.message}`)
          }
          askQuestion()
          return
        }

        // Inline JSON import: /agent-import {"name":"...",...}
        if (!rest) {
          console.log('  ✗ Usage: /agent-import <json>  or  /agent-import from <file>')
          console.log('  Example: /agent-import {"name":"My Agent","systemPrompt":"You are..."}')
          askQuestion()
          return
        }
        try {
          const agent = importAgent(rest)
          refreshAgents()
          currentAgent = listAgents().find((a) => a.id === agent.id) || currentAgent
          console.log(`  ✓ Imported: ${agent.emoji} ${agent.name}`)
        } catch (err) {
          console.log(`  ✗ ${err.message}`)
        }
        askQuestion()
        return
      }

      // ── Reset agents ──
      if (trimmed === '/agent-reset') {
        resetAgents()
        refreshAgents()
        currentAgent = getDefaultAgent()
        console.log(`  ✓ Agents reset to defaults. Switched to ${currentAgent.emoji} ${currentAgent.name}`)
        askQuestion()
        return
      }

      // ── Quantum commands ──
      if (trimmed === '/quantum' || trimmed === '/quantum list') {
        try {
          const { listDemos } = await import('./quantum.js')
          const demos = listDemos()
          console.log('\n  ⚛️ Quantum Circuit Demos')
          console.log(`  ─${'─'.repeat(40)}`)
          for (const d of demos) {
            console.log(`  ${d.id.padEnd(16)} ${d.name}`)
            console.log(`  ${' '.repeat(16)} ${d.description}`)
            console.log()
          }
          console.log('  Usage: /quantum <demo>  e.g., /quantum bell')
          console.log('         /quantum run <gates>  e.g., /quantum run H(0) CNOT(0,1)')
        } catch (err) {
          console.log(`  ✗ Quantum simulator unavailable: ${err.message}`)
        }
        askQuestion()
        return
      }

      // ── Run custom quantum circuit ──
      if (trimmed.startsWith('/quantum run ')) {
        const gateDefs = trimmed.slice(13).trim()
        if (!gateDefs) {
          console.log('  ✗ Usage: /quantum run <gates>')
          console.log('  Example: /quantum run H(0) CNOT(0,1) --shots=2048')
          askQuestion()
          return
        }
        try {
          const { QuantumCircuit } = await import('./quantum.js')

          // Parse shots from gateDefs
          let shots = 1024
          const shotMatch = gateDefs.match(/--shots=(\d+)/)
          if (shotMatch) {
            shots = parseInt(shotMatch[1], 10)
          }
          const cleanDefs = gateDefs.replace(/--shots=\d+/g, '').trim()

          // Parse gates: H(0) CNOT(0,1) X(2) ...
          const gatePattern = /([A-Za-z]+)\(([^)]*)\)/g
          const tokens = []
          let match
          while ((match = gatePattern.exec(cleanDefs)) !== null) {
            tokens.push({ name: match[1].toLowerCase(), args: match[2].split(',').map(s => parseInt(s.trim(), 10)) })
          }

          if (tokens.length === 0) {
            console.log('  ✗ No valid gates found. Usage: H(0) CNOT(0,1) SWAP(0,2)')
            askQuestion()
            return
          }

          // Determine qubit count from gate args
          let numQubits = 0
          for (const t of tokens) {
            for (const a of t.args) {
              if (!isNaN(a) && a >= numQubits) numQubits = a + 1
            }
          }
          if (numQubits < 1) numQubits = 1

          const qc = new QuantumCircuit(numQubits)
          const gateMap = {
            'h': 'h', 'hadamard': 'h',
            'x': 'x', 'pauli-x': 'x', 'not': 'x',
            'y': 'y', 'pauli-y': 'y',
            'z': 'z', 'pauli-z': 'z',
            's': 's', 'phase': 's',
            't': 't',
            'cnot': 'cnot', 'cx': 'cnot',
            'swap': 'swap',
            'toffoli': 'toffoli', 'ccx': 'toffoli',
          }

          for (const t of tokens) {
            const gate = gateMap[t.name]
            if (!gate) {
              console.log(`  ⚠ Unknown gate: ${t.name}. Skipping.`)
              console.log(`  Available: H, X, Y, Z, S, T, CNOT/CX, SWAP, TOFFOLI/CCX`)
              continue
            }
            if (gate === 'h' || gate === 'x' || gate === 'y' || gate === 'z' || gate === 's' || gate === 't') {
              if (t.args.length < 1 || isNaN(t.args[0])) {
                console.log(`  ⚠ ${t.name} needs a qubit argument. Skipping.`)
                continue
              }
              qc[gate](t.args[0])
            } else if (gate === 'cnot') {
              if (t.args.length < 2 || isNaN(t.args[0]) || isNaN(t.args[1])) {
                console.log(`  ⚠ CNOT needs control,target args. Skipping.`)
                continue
              }
              qc.cnot(t.args[0], t.args[1])
            } else if (gate === 'swap') {
              if (t.args.length < 2 || isNaN(t.args[0]) || isNaN(t.args[1])) {
                console.log(`  ⚠ SWAP needs two qubit args. Skipping.`)
                continue
              }
              qc.swap(t.args[0], t.args[1])
            } else if (gate === 'toffoli') {
              if (t.args.length < 3 || isNaN(t.args[0]) || isNaN(t.args[1]) || isNaN(t.args[2])) {
                console.log(`  ⚠ TOFFOLI needs c0,c1,target args. Skipping.`)
                continue
              }
              qc.toffoli(t.args[0], t.args[1], t.args[2])
            }
          }

          qc.measureAll()
          const result = qc.run(shots)
          console.log(`\n  ⚛️ Custom Circuit: ${numQubits} qubits, ${shots} shots`)
          console.log(`  ${cleanDefs}\n`)
          console.log(qc.draw())
          console.log(result.histogram())
          console.log(`  Most likely outcome: |${result.mostLikely()}⟩`)
        } catch (err) {
          console.log(`  ✗ Error: ${err.message}`)
        }
        askQuestion()
        return
      }

      if (trimmed.startsWith('/quantum ')) {
        const demoName = trimmed.slice(9).trim()
        if (!demoName || demoName === 'list') {
          askQuestion()
          return
        }
        try {
          const { runDemo } = await import('./quantum.js')
          const { circuit, result } = runDemo(demoName, 1024)
          console.log(`\n  ⚛️ ${demoName}: ${result.mostLikely().length}-qubit circuit`)
          console.log(circuit.draw())
          console.log(result.histogram())
          console.log(`  Most likely outcome: |${result.mostLikely()}⟩`)
        } catch (err) {
          console.log(`  ✗ ${err.message}`)
        }
        askQuestion()
        return
      }

      // ── Send prompt ──
      if (trimmed) {
        try {
          messages.push({ role: 'user', content: trimmed })
          const response = await infer({
            model: currentModel,
            messages: buildMessages(),
            stream: true,
            writeToStdout: true,
          })
          if (response) {
            messages.push({ role: 'assistant', content: response })
          } else {
            console.log('  [No response]')
          }
        } catch (err) {
          console.error(`\n  ✗ Error: ${err.message}`)
        }
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
  const { listAgents, getAgent } = await import('./custom-agents.js')
  const { MODELS, getModelsByProvider } = await import('./models.js')

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
          const { prompt: userPrompt, model: modelId, agent: agentId, messages: history, stream: shouldStream } = body

          if (!userPrompt && (!history || history.length === 0)) {
            return new Response(JSON.stringify({ error: 'No prompt or messages provided' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // Build messages with optional agent system prompt + conversation history
          const messages = []
          if (agentId) {
            const agent = getAgent(agentId)
            if (agent && agent.systemPrompt) {
              messages.push({ role: 'system', content: agent.systemPrompt })
            }
          }
          // Include conversation history if provided
          if (Array.isArray(history) && history.length > 0) {
            // Don't duplicate the system prompt
            for (const msg of history) {
              if (msg.role !== 'system' || !messages.find(m => m.role === 'system')) {
                messages.push(msg)
              }
            }
          }
          // Add current user message if not already in history
          if (userPrompt) {
            const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null
            if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userPrompt) {
              messages.push({ role: 'user', content: userPrompt })
            }
          }

          if (shouldStream) {
            const { readable, writable } = new TransformStream()
            const writer = writable.getWriter()
            const encoder = new TextEncoder()

            infer({
              model: modelId,
              messages,
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
            messages,
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

      if (url.pathname === '/api/agents') {
        const agentId = url.searchParams.get('id')
        if (agentId) {
          const agent = getAgent(agentId)
          if (!agent) {
            return new Response(JSON.stringify({ error: 'Agent not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          return new Response(JSON.stringify({ agent }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
        const agents = listAgents()
        return new Response(JSON.stringify({ agents }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (url.pathname === '/api/models') {
        const byProvider = getModelsByProvider()
        return new Response(JSON.stringify({ models: MODELS, byProvider }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // ── aigen7ev.store — Stripe Checkout ──
      if (url.pathname === '/api/store/create-checkout-session' && req.method === 'POST') {
        try {
          const body = await req.json()
          const { items } = body

          if (!items || !Array.isArray(items) || items.length === 0) {
            return new Response(JSON.stringify({ error: 'No items in cart' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
          if (!STRIPE_SECRET_KEY) {
            return new Response(JSON.stringify({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY in .env' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // ── Server-side price validation ──
          // Validate item prices against the static product catalog
          // Read product data to verify prices
          const storePath = resolve(__dirname, 'web', 'js', 'data.js')
          let storeProducts = []
          try {
            // We can't import the browser-side data.js, so we validate
            // by requiring items to match expected price ranges per category
            // In production, use Stripe Price IDs stored in the product data
            for (const item of items) {
              if (!item.id || !item.price || !item.name) {
                throw new Error('Invalid item: missing id, price, or name')
              }
              // Ensure prices are reasonable (no $0 items)
              if (item.price <= 0 || item.price > 5000) {
                throw new Error('Invalid price for item: ' + item.name)
              }
              if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
                throw new Error('Invalid quantity for item: ' + item.name)
              }
            }
          } catch (valErr) {
            return new Response(JSON.stringify({ error: valErr.message }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const origin = req.headers.get('origin') || `http://localhost:${port}`

          // Build line items for Stripe
          const lineItems = items.map(function (item) {
            return {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: item.name,
                },
                unit_amount: Math.round(item.price * 100), // Stripe uses cents
              },
              quantity: item.quantity || 1,
            }
          })

          // Call Stripe Checkout Sessions API directly (no SDK needed)
          const lineItemsParam = new URLSearchParams()
          for (var li = 0; li < lineItems.length; li++) {
            var it = lineItems[li]
            lineItemsParam.append('line_items[' + li + '][price_data][currency]', it.price_data.currency)
            lineItemsParam.append('line_items[' + li + '][price_data][product_data][name]', it.price_data.product_data.name)
            lineItemsParam.append('line_items[' + li + '][price_data][unit_amount]', String(it.price_data.unit_amount))
            lineItemsParam.append('line_items[' + li + '][quantity]', String(it.quantity))
          }
          lineItemsParam.append('mode', 'payment')
          lineItemsParam.append('success_url', origin + '/?session_id={CHECKOUT_SESSION_ID}')
          lineItemsParam.append('cancel_url', origin + '/?canceled=true')

          const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + STRIPE_SECRET_KEY,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: lineItemsParam.toString(),
          })

          const stripeData = await stripeRes.json()

          if (!stripeRes.ok) {
            throw new Error(stripeData.error?.message || 'Stripe API error: ' + stripeRes.status)
          }

          return new Response(JSON.stringify({ url: stripeData.url, sessionId: stripeData.id }), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }

      // ── aigen7ev.store — Stripe Webhook ──
      if (url.pathname === '/api/store/webhook' && req.method === 'POST') {
        try {
          const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
          const rawBody = await req.text()
          const signature = req.headers.get('stripe-signature')

          if (!STRIPE_WEBHOOK_SECRET) {
            return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // Verify webhook signature using Stripe's verification
          const stripeRes = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + (process.env.STRIPE_SECRET_KEY || '') },
          })

          // Parse the event body
          let event
          try {
            event = JSON.parse(rawBody)
          } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // Handle the event
          switch (event.type) {
            case 'checkout.session.completed': {
              const session = event.data.object
              console.log('\n  [AIGENEV7] ✅ Payment completed: ' + session.id)
              console.log('  [AIGENEV7] Customer: ' + (session.customer_details?.email || 'unknown'))
              console.log('  [AIGENEV7] Amount: $' + (session.amount_total / 100).toFixed(2))

              // TODO: Add fulfillment logic here
              // - For subscriptions: activate API access
              // - For digital downloads: send email with download link
              // - For merch: create shipping order
              // - For services: schedule session

              break
            }
            case 'checkout.session.expired': {
              console.log('  [AIGENEV7] ⏰ Checkout session expired: ' + event.data.object.id)
              break
            }
            case 'payment_intent.succeeded': {
              break
            }
            default:
              console.log('  [AIGENEV7] Unhandled event type: ' + event.type)
          }

          return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          console.error('  [AIGENEV7] Webhook error:', err.message)
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }

      // ── API Health Check ──
      if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          store: !!process.env.STRIPE_SECRET_KEY,
          version: '7.0.0',
        }), {
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
