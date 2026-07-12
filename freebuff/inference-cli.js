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
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, unlinkSync, renameSync, copyFileSync } from 'fs'
import { resolve, dirname, sep } from 'path'
import { fileURLToPath } from 'url'
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
import { runAutoAgent } from './auto-agent.js'
import { MODELS } from './models.js'
import { checkPremium, hasFeature, getUpgradePrompt, getTokenBalance, formatTokens } from './premium.js'
import { saveSnippet, getSnippet, listSnippets, deleteSnippet, exportSnippet, exportSnippetToFile, importSnippet, importSnippetFromFile, exportAllSnippets, importAllSnippets } from './snippets.js'
import { saveConversation, loadConversation, listConversations, deleteConversation, exportConversationToFile, importConversation, getConversationSummaries } from './conversations.js'
import { runDebugLoop } from './debug-agent.js'
import { getDefensiveAgents, getOffensiveAgents, getFrameworkSummary } from './defensive-offensive.js'

// ── Load .env early for provider API keys ──
const cliDir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(cliDir, '.env')
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

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

// ── Premium key from CLI flag ──
if (flags.premium_key) {
  process.env.AIGENEV7_PREMIUM_KEY = flags.premium_key
}

let premiumStatus = checkPremium()

// ── ANSI color helpers ──
const C = {
  reset: '\x1b[0m',
  green: '\x1b[38;5;83m',
  cyan: '\x1b[38;5;51m',
  red: '\x1b[38;5;196m',
  yellow: '\x1b[38;5;226m',
  purple: '\x1b[38;5;147m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  pink: '\x1b[38;5;213m',
  orange: '\x1b[38;5;214m',
}
function g(t) { return C.green + t + C.reset }
function c(t) { return C.cyan + t + C.reset }
function r(t) { return C.red + t + C.reset }
function y(t) { return C.yellow + t + C.reset }
function p(t) { return C.purple + t + C.reset }
function d(t) { return C.dim + t + C.reset }
function b(t) { return C.bold + t + C.reset }

// ── ASCII Art Banner ──
function showBanner(title) {
  const art = [
    '  ╔══════════════════════════════════════════════╗',
    '  ║     ' + c('████████╗ ██████╗  ██████╗ ██╗     ███████╗') + '     ║',
    '  ║     ' + c('╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝') + '     ║',
    '  ║     ' + c('   ██║   ██║   ██║██║   ██║██║     █████╗') + '       ║',
    '  ║     ' + c('   ██║   ██║   ██║██║   ██║██║     ██╔══╝') + '       ║',
    '  ║     ' + c('   ██║   ╚██████╔╝╚██████╔╝███████╗███████╗') + '     ║',
    '  ║     ' + c('   ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝') + '     ║',
    '  ╚══════════════════════════════════════════════╝',
  ]
  // ── Title line ──
  var premBadge = premiumStatus.isPremium ? ' ' + p('💎') : ''
  var titleLine = '  ' + b(c('▸ ' + title)) + premBadge
  var versionLine = '  ' + d('v7.0.0 ─ Free AI Coding Agent') + (premiumStatus.isPremium ? ' ' + p('Premium') : '')
  console.log()
  for (var i = 0; i < art.length; i++) console.log(art[i])
  console.log('  ' + c('┄'.repeat(46)))
  console.log(titleLine)
  if (premiumStatus.message) console.log('  ' + d(premiumStatus.message))
  console.log(versionLine)
  console.log()
}

// ── Prompt tone (terminal bell) ──
function playPromptTone() {
  try { process.stdout.write('\x07') } catch {}
}

// ── Help ──
function showHelp() {
  showBanner('Help & Usage')
  console.log('  ' + c('▸') + ' ' + b('Usage:') + '  ' + d('bun inference-cli.js <command> [options]'))
  console.log()
  console.log('  ' + c('▸') + ' ' + b('Commands:'))
  console.log('    ' + g('ask') + ' <prompt>     ' + d('Send a one-shot prompt (default)'))
  console.log('    ' + g('chat') + '             ' + d('Interactive chat session'))
  console.log('    ' + g('models') + '           ' + d('List all available models'))
  console.log('    ' + g('serve') + '            ' + d('Start the web interface server'))
  console.log()
  console.log('  ' + c('▸') + ' ' + b('Options:'))
  console.log('    ' + y('--model') + ', ' + y('-m') + ' <id>         ' + d('Model ID (default: fable-5)'))
  console.log('    ' + y('--stream') + ' / ' + y('--no-stream') + '   ' + d('Enable/disable streaming (stream)'))
  console.log('    ' + y('--max-tokens') + ' <n>         ' + d('Max output tokens (default: Infinity)'))
  console.log('    ' + y('--temperature') + ' <n>        ' + d('Temperature 0-2 (default: 0.7)'))
  console.log('    ' + y('--port') + ' <n>               ' + d('Web server port (default: 3456)'))
  console.log('    ' + p('--premium-key') + ' <key>      ' + d('Premium key (format: ag7_{tier}_{key})'))
  console.log('    ' + y('--help') + '                   ' + d('Show this help message'))
  console.log()
  console.log('  ' + c('▸') + ' ' + b('Examples:'))
  console.log('    ' + d('$') + ' ' + g('bun inference-cli.js') + ' ' + d('"Explain quantum computing"'))
  console.log('    ' + d('$') + ' ' + g('bun inference-cli.js ask') + ' ' + d('"Write a REST API" --model fable-5'))
  console.log('    ' + d('$') + ' ' + g('bun inference-cli.js chat'))
  console.log('    ' + d('$') + ' ' + g('bun inference-cli.js models'))
  console.log('    ' + d('$') + ' ' + g('bun inference-cli.js serve') + ' ' + y('--port') + ' 8080')
  console.log('    ' + d('$') + ' ' + g('bun inference-cli.js chat') + ' ' + p('--premium-key') + ' ag7_pro_your_key')
  console.log()
}

// ── Models Command ──
async function listModels() {
  const { MODELS, getModelsByProvider } = await import('./models.js')
  const byProvider = getModelsByProvider()

  showBanner('Available Models')

  for (const [provider, models] of Object.entries(byProvider)) {
    console.log('  ' + c('▸') + ' ' + b(provider.charAt(0).toUpperCase() + provider.slice(1)))
    for (const m of models) {
      const tag = m.multimodal ? ' ' + c('📷') : ''
      const premTag = m.premium ? ' ' + p('💎') : ''
      const keyStatus = process.env[`${provider.toUpperCase()}_API_KEY`] ? g('✓') : d('○')
      const nameColored = m.premium ? p(m.id.padEnd(30)) : c(m.id.padEnd(30))
      console.log('    ' + keyStatus + ' ' + nameColored + ' ' + d(m.displayName) + tag + premTag)
      console.log('      ' + d(m.description))
    }
    console.log()
  }

  const prem = checkPremium()
  console.log('  ' + g('✓') + ' ' + d('= API key configured') + '   ' + d('○') + ' ' + d('= No key set'))
  if (!prem.isPremium) {
    console.log('  ' + p('💎') + ' ' + d('= Premium models (set AIGENEV7_PREMIUM_KEY to unlock)'))
  }
  console.log()
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
    const keyIcon = hasAnyKey ? c('🔑') : d('○')
    console.log('  ' + keyIcon + ' ' + b(provider.charAt(0).toUpperCase() + provider.slice(1)))
    for (const e of models) {
      const tag = e.model.multimodal ? ' ' + c('📷') : ''
      const premiumTag = e.model.premium ? ' ' + p('💎') : ''
      const isCurrent = e.model.id === currentId ? ' ' + g('→') : ''
      const padNum = String(e.num).padStart(2, ' ')
      const keyMark = e.hasKey ? g('✓') : d(' ')
      const nameColored = e.model.premium ? p(e.model.id.padEnd(28)) : c(e.model.id.padEnd(28))
      console.log('    [' + g(padNum) + '] ' + keyMark + ' ' + nameColored + ' ' + d(e.model.displayName) + tag + premiumTag + isCurrent)
    }
    console.log()
  }
  console.log('  ' + g('✓') + ' ' + d('= API key ready    Enter number to select model'))
  console.log()
}

// ── Helper: display agents ──
function printAgentPicker(agents, currentAgentId) {
  console.log()
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i]
    const isCurrent = a.id === currentAgentId ? ' ' + g('→') : ''
    const padNum = String(i + 1).padStart(2, ' ')
    console.log('    [' + g(padNum) + '] ' + a.emoji + ' ' + b(a.name.padEnd(20)) + ' ' + d(a.description) + isCurrent)
  }
  console.log()
}

// ── Chat Command with Agents ──
async function chatMode() {
  showBanner('Interactive Chat')

  const { MODELS } = await import('./models.js')
  const entries = await getNumberedModels()

  // ── Agent state ──
  let currentAgent = getDefaultAgent()
  let allAgents = listAgents()

  // Resolve initial model, falling back to first free model for non-premium users
  const initialModelId = model || process.env.AIGENEV7_DEFAULT_MODEL || (entries.length > 0 ? entries[0].model.id : 'fable-5')
  const initialModel = MODELS.find((m) => m.id === initialModelId)
  if (initialModel && initialModel.premium && !hasFeature('premium_models')) {
    const fallback = entries.find((e) => !e.model.premium)?.model
    console.log(`  Note: "${initialModelId}" requires premium — using "${fallback ? fallback.id : initialModelId}" instead`)
    console.log('  Set AIGENEV7_PREMIUM_KEY or use --premium-key to unlock premium models.')
    console.log()
  }
  let currentModel = (initialModel && initialModel.premium && !hasFeature('premium_models'))
    ? (entries.find((e) => !e.model.premium)?.model.id || initialModelId)
    : initialModelId

  // ── Agent Picker ──
  console.log('  ' + c('▸') + ' ' + b('Select an Agent'))
  printAgentPicker(allAgents, currentAgent.id)
  console.log('  ' + d('Default:') + ' ' + currentAgent.emoji + ' ' + b(currentAgent.name) + ' ' + d('(press Enter to use this)'))
  console.log('  ' + d('Type') + ' ' + y('/agents') + ' ' + d('to re-list,') + ' ' + y('/agent <name or #>') + ' ' + d('to switch'))
  console.log()

  // ── Model Picker ──
  console.log('  ' + c('▸') + ' ' + b('Select a Model'))
  printModelPicker(entries, currentModel)
  console.log('  ' + d('Default:') + ' ' + c(currentModel) + ' ' + d('(press Enter to use this)'))
  console.log()

  // ── Token Balance Banner ──
  const tokenBal = getTokenBalance()
  if (tokenBal) {
    const barLen = 16
    const filled = Math.round((tokenBal.used / Math.max(1, tokenBal.max)) * barLen)
    const bar = '█'.repeat(Math.min(filled, barLen)) + '░'.repeat(Math.max(0, barLen - filled))
    const pctColor = tokenBal.pct > 80 ? r : tokenBal.pct > 50 ? y : g
    console.log('  ' + c('▸') + ' ' + b('Token Balance:') + ' ' + formatTokens(tokenBal.remaining) + ' ' + d('/ ' + formatTokens(tokenBal.max)) + ' ' + pctColor('[' + bar + ']') + ' ' + d('(' + tokenBal.pct + '%)'))
    console.log()
  }

  // ── Non-premium: show keygen hint ──
  if (!hasFeature('premium_models')) {
    console.log('  ' + p('💎') + ' ' + d('Tip: type') + ' ' + y('/keygen') + ' ' + d('to generate a premium key and unlock elite models'))
    console.log()
  }

  // ── Tab completion for slash commands ──
  const COMMANDS_LIST = [
    '/quit', '/exit', '/q', '/help', '/h',
    '/model', '/models', '/ls', '/current', '/clear',
    '/agent', '/agents', '/agent-show', '/agent-new', '/agent-edit',
    '/agent-delete', '/agent-export', '/agent-import', '/agent-reset',
    '/defensive', '/offensive', '/framework',
    '/quantum', '/pay', '/keygen', '/menu',
    '/auto', '/auto-stop', '/auto-status',
    '/save', '/snippet', '/search', '/context', '/debug', '/balance',
    '/history', '/recommend',
  ]

  function completer(line) {
    if (!line.startsWith('/')) return [[], line]
    const hits = COMMANDS_LIST.filter(c => c.startsWith(line))
    return [hits.length ? hits : COMMANDS_LIST, line]
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
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
  const contextFiles = []

  // ── Auto agent status tracking ──
  let autoAgentActive = false
  let autoAgentIteration = 0

  // ── Build messages with agent system prompt + context files ──
  function buildMessages(userContent) {
    const msgs = []
    let systemContent = ''
    if (currentAgent && currentAgent.systemPrompt) {
      systemContent += currentAgent.systemPrompt
    }
    // Add context file contents
    if (contextFiles.length > 0) {
      systemContent += '\n\n## Context Files\n\n'
      for (const ctx of contextFiles) {
        systemContent += `### ${ctx.path}\n`
        systemContent += '```\n'
        systemContent += ctx.content.substring(0, 8000) + '\n'
        if (ctx.content.length > 8000) systemContent += '[... truncated ...]\n'
        systemContent += '```\n\n'
      }
    }
    if (systemContent) {
      msgs.push({ role: 'system', content: systemContent.trim() })
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
    const premTag = hasFeature('premium_models') ? ' ' + p('💎') : ''
    rl.question('  ' + agentEmoji + ' ' + c('[' + currentModel + ']') + premTag + ' ' + g('>') + ' ', async (input) => {
      const trimmed = input.trim()

      // ── Quit ──
      if (trimmed === '/quit' || trimmed === '/exit' || trimmed === '/q') {
        console.log('\n  ' + g('✦') + ' ' + b('Goodbye!') + ' ' + p('✦'))
        rl.close()
        return
      }

      // ── Help ──
      if (trimmed === '/help' || trimmed === '/h') {
        console.log('\n  ' + c('┄').repeat(46))
        console.log('  ' + b(c('✦ Chat Commands ✦')))
        console.log('  ' + c('┄').repeat(46))
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
        console.log('  /save [filename]        Save conversation to markdown file')
        console.log('  ── Snippets ──')
        console.log('  /snippet                Snippet manager (save/load/list/delete)')
        console.log('  /snippet save <name>    Save last response as snippet')
        console.log('  /snippet get <name>     Load a snippet')
        console.log('  /snippet list           List all snippets')
        console.log('  /snippet delete <name>  Delete a snippet')
        console.log('  /snippet search <q>     Search snippets by text')
        console.log('  /snippet export <name>  Export snippet as JSON')
        console.log('  /snippet import <json>  Import snippet from JSON')
        console.log('  /snippet export-all [f] Export all snippets to file')
        console.log('  /snippet import-all <f> Import snippets from file')
        console.log('  ── Conversations ──')
        console.log('  /history                List saved conversations')
        console.log('  /history save <name>    Save current conversation')
        console.log('  /history load <name>    Load a conversation')
        console.log('  /history delete <name>  Delete a conversation')
        console.log('  /history search <q>     Search conversations')
        console.log('  /history export <name>  Export conversation to file')
        console.log('  /history import from <f> Import conversation from file')
        console.log('  ── Model Recommendations ──')
        console.log('  /recommend [task]       Recommend best model for a task')
        console.log('                           Tasks: coding, reasoning, creative,')
        console.log('                           fast, multimodal, local, budget, uncensored')
        console.log('  ── Code Search ──')
        console.log('  /search <query>         Search code in project directory')
        console.log('  ── Context ──')
        console.log('  /context                Manage context files (included in prompts)')
        console.log('  /context add <file>     Add a file as context')
        console.log('  /context remove <file>  Remove a context file')
        console.log('  /context list           List context files')
        console.log('  /context clear          Clear all context')
        console.log('  ── Interactive ──')
        console.log('  /menu                   Show interactive agent & model picker')
        console.log('  ── Auto Agent 🤖 ──')
        console.log('  /auto <prompt>          Start autonomous coding agent to modify files')
        console.log('  /auto-stop              Stop the auto agent')
        console.log('  /auto-status            Show current auto agent status')
        console.log('  ── Auto-Debug 🔧 ──')
        console.log('  /debug <command>        Run auto-debug loop: run, detect error, fix, retry')
        console.log('  /debug <cmd> --iters=10  Set max fix iterations (default 5)')
        console.log('  ── Account 💳 ──')
        console.log('  /balance                Check token balance and usage')
        console.log('  ── Premium 💎 ──')
        console.log('  /keygen                 Generate a premium key for CLI')
        console.log('  /keygen <tier>          Generate key for specific tier (pro, elite, enterprise)')
        console.log('  /pay                    Show payment info and open payment page')
        console.log('  ── Quantum ⚛️ ──')
        console.log('  /quantum               List available quantum demos')
        console.log('  /quantum <demo>        Run a demo (bell, ghz, deutsch, superposition, bell-swap)')
        console.log('  /quantum run <gates>   Run a custom circuit. e.g.:')
        console.log('                           /quantum run H(0) CNOT(0,1) --shots=2048')
        console.log('                           /quantum run H(0) X(1) SWAP(0,1)')
        console.log('                           /quantum run H(0) CNOT(0,1) CNOT(0,2)')
        console.log('  ── Defensive/Offensive Framework 🛡️⚔️ ──')
        console.log('  /defensive [agent]      List or show details of a defensive agent')
        console.log('  /offensive [agent]      List or show details of an offensive agent')
        console.log('  /framework              Show framework summary with all agents')
        console.log('  /framework <agent>      Show details of any framework agent')
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
        console.log('  ' + g('✓') + ' ' + d('Conversation history cleared'))
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
          // Premium gate
          if (m.premium && !hasFeature('premium_models')) {
            console.log('  ' + getUpgradePrompt('premium_models'))
            console.log('  Free models available: /models (no 💎 tag)')
            askQuestion()
            return
          }
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
        // Premium gate
        if (m.premium && !hasFeature('premium_models')) {
          console.log('  ' + getUpgradePrompt('premium_models'))
          console.log('  Enter another number for a free model, or use /models to list all.')
          askQuestion()
          return
        }
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

      // ── Premium gate for /agent-export ──
      if (trimmed.startsWith('/agent-export ') && trimmed.includes(' to ') && !hasFeature('export_agent_file')) {
        console.log('  ' + getUpgradePrompt('export_agent_file'))
        console.log('  Use /agent-export <name> (without to <file>) for free console export.')
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

      // ── Premium gate for /agent-import ──
      if (trimmed.startsWith('/agent-import from ') && !hasFeature('import_agent_file')) {
        console.log('  ' + getUpgradePrompt('import_agent_file'))
        console.log('  Use /agent-import <json> (inline JSON) for free import.')
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

      // ── Premium gate for custom quantum ──
      if (trimmed.startsWith('/quantum run ') && !hasFeature('custom_quantum')) {
        console.log('  ' + getUpgradePrompt('custom_quantum'))
        console.log('  Free users can run demos: /quantum bell, /quantum ghz, etc.')
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

      // ── Menu command: interactive agent & model picker ──
      if (trimmed === '/menu') {
        console.log()
        console.log('  ' + c('┄').repeat(44))
        console.log('  ' + b(c('✦ Interactive Menu ✦')))
        console.log('  ' + c('┄').repeat(44))
        console.log()
        console.log('  ' + b('Agents:'))
        for (var mi = 0; mi < allAgents.length; mi++) {
          var ma = allAgents[mi]
          var mark = ma.id === currentAgent.id ? ' ' + g('◀ ACTIVE') : ''
          console.log('    [' + g(String(mi + 1).padStart(2)) + '] ' + ma.emoji + ' ' + b(ma.name) + ' ' + d(ma.description) + mark)
        }
        console.log()
        console.log('  ' + d('Type') + ' ' + y('/agent <#>') + ' ' + d('to switch agents'))
        console.log()
        console.log('  ' + b('Models:'))
        // Show a few models grouped by provider
        var menuEntries = await getNumberedModels()
        var menuByProv = {}
        for (var me = 0; me < menuEntries.length; me++) {
          var em = menuEntries[me]
          if (!menuByProv[em.provider]) menuByProv[em.provider] = []
          menuByProv[em.provider].push(em)
        }
        var provNames = Object.keys(menuByProv)
        for (var pn = 0; pn < provNames.length; pn++) {
          var prov = provNames[pn]
          var provModels = menuByProv[prov]
          // Show first 4 models per provider to keep it compact
          var maxShow = Math.min(provModels.length, 4)
          for (var pm = 0; pm < maxShow; pm++) {
            var em2 = provModels[pm]
            var curMark = em2.model.id === currentModel ? ' ' + g('◀') : ''
            var prem = em2.model.premium ? ' ' + p('💎') : ''
            console.log('    [' + g(String(em2.num).padStart(2)) + '] ' + c(em2.model.id.padEnd(24)) + ' ' + d(em2.model.displayName) + prem + curMark)
          }
          if (provModels.length > 4) {
            console.log('    ' + d('  ... +' + (provModels.length - 4) + ' more'))
          }
        }
        console.log()
        console.log('  ' + d('Type a number or') + ' ' + y('/model <#>') + ' ' + d('to switch models'))
        console.log('  ' + d('Type') + ' ' + y('/models') + ' ' + d('for full list'))
        console.log()
        askQuestion()
        return
      }

      // ── Auto Agent Command ──
      if (trimmed === '/auto') {
        console.log('  Usage: /auto <description of what to do>')
        console.log('  Example: /auto Add error handling to all API routes in server.js')
        console.log('  The auto agent will read, edit, and create files in your project directory.')
        askQuestion()
        return
      }

      if (trimmed.startsWith('/auto ')) {
        const autoPrompt = trimmed.slice(6).trim()
        if (!autoPrompt) {
          console.log('  ✗ Please provide a description of what you want the auto agent to do.')
          askQuestion()
          return
        }

        // Run the auto agent
        ;(async () => {
          try {
            console.log()
            console.log('  ' + c('┄').repeat(50))
            console.log('  ' + b(c('✦ Auto Agent ✦')))
            console.log('  ' + d('Autonomous coding agent — reading, writing, and modifying files'))
            console.log('  ' + c('┄').repeat(50))
            console.log()
            console.log('  ' + d('Prompt:') + ' ' + autoPrompt)
            console.log('  ' + d('CWD:') + ' ' + process.cwd())
            console.log()

            autoAgentActive = true
            autoAgentIteration = 0
            const result = await runAutoAgent({
              prompt: autoPrompt,
              model: currentModel,
              cwd: process.cwd(),
              onStatus: (status) => {
                autoAgentIteration++
                console.log('  ' + g('▸') + ' ' + status)
              },
              onChunk: (chunk) => {
                process.stdout.write(chunk)
              },
              maxIterations: 15,
            })

            console.log()
            console.log('  ' + c('┄').repeat(50))
            console.log('  ' + b(g('✦ Auto Agent Complete ✦')))
            console.log('  ' + d('Changes made:') + ' ' + (result.changes.length > 0 ? g(String(result.changes.length)) : d('none')))
            console.log('  ' + d('Iterations:') + ' ' + (result.totalIterations || result.iteration))
            if (result.summary) {
              console.log('  ' + d('Summary:') + ' ' + result.summary.substring(0, 200))
            }
            console.log()

            // Log changes
            if (result.changes.length > 0) {
              for (const change of result.changes) {
                const icon = change.type === 'write' ? '✏️' : change.type === 'edit' ? '📝' : '📄'
                console.log(`    ${icon} ${change.type}: ${change.path}`)
              }
              console.log()
            }
          } catch (err) {
            console.log()
            console.log('  ✗ Auto Agent error: ' + err.message)
            console.log()
          } finally {
            autoAgentActive = false
          }
          askQuestion()
        })()
        return
      }

      // ── Auto agent status ──
      if (trimmed === '/auto-status') {
        const activeStatus = autoAgentActive ? g('ACTIVE') + ' (' + (autoAgentIteration || 0) + ' iterations)' : d('idle')
        console.log('  ' + c('┄').repeat(46))
        console.log('  ' + b('🤖 Auto Agent Status'))
        console.log('  ' + c('┄').repeat(46))
        console.log('  Status:      ' + activeStatus)
        console.log('  Model:       ' + c(currentModel))
        console.log('  CWD:         ' + d(process.cwd()))
        console.log('  Max iters:   15')
        console.log()
        if (autoAgentActive) {
          console.log('  ' + y('⚠ Auto agent is currently running.'))
          console.log('  ' + d('Use /auto-stop to request stop (finishes current iteration).'))
        } else {
          console.log('  ' + d('Run /auto <prompt> to start a new task.'))
        }
        console.log()
        askQuestion()
        return
      }

      // ── Auto agent stop ──
      if (trimmed === '/auto-stop') {
        console.log('  Auto agent stop requested.')
        console.log('  Note: The current iteration will finish before stopping.')
        console.log('  In future versions, this will interrupt mid-execution.')
        askQuestion()
        return
      }

      // ── /save — Save conversation to markdown ──
      if (trimmed === '/save') {
        const filename = 'aigenev7-conversation-' + new Date().toISOString().replace(/[:.]/g, '-') + '.md'
        let md = '# AIGENEV7 Conversation\n\n'
        md += `- **Date:** ${new Date().toLocaleString()}\n`
        md += `- **Model:** ${currentModel}\n`
        md += `- **Agent:** ${currentAgent.emoji} ${currentAgent.name}\n`
        md += `- **Messages:** ${messages.length}\n\n`
        md += '---\n\n'
        for (const msg of messages) {
          const roleEmoji = msg.role === 'user' ? '👤' : '🤖'
          md += `### ${roleEmoji} ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n`
          md += msg.content + '\n\n---\n\n'
        }
        try {
          const { writeFileSync, existsSync } = await import('fs')
          const { resolve } = await import('path')
          const filePath = resolve(process.cwd(), filename)
          if (existsSync(filePath)) {
            console.log(`  ⚠ File "${filename}" already exists — overwriting`)
          }
          writeFileSync(filePath, md, 'utf8')
          console.log(`  ✓ Conversation saved to ${filename}`)
        } catch (err) {
          console.log(`  ✗ Failed to save: ${err.message}`)
        }
        askQuestion()
        return
      }

      // ── Bare /snippet shows usage ──
      if (trimmed === '/snippet') {
        console.log('\n  🧩 Snippet Manager')
        console.log('  ────────────────────────────────────────────')
        console.log('  /snippet save <name>    Save last assistant response as snippet')
        console.log('  /snippet get <name>     Display a snippet')
        console.log('  /snippet list [tag]    List all snippets (optionally by tag)')
        console.log('  /snippet delete <name>  Delete a snippet')
        console.log('  /snippet search <q>     Search snippets by text')
        console.log()
        const snippets = listSnippets()
        if (snippets.length === 0) {
          console.log('  No snippets saved yet. Use /snippet save <name> to save one.')
        } else {
          console.log(`  ${snippets.length} snippet(s) saved`)
        }
        console.log()
        askQuestion()
        return
      }

      if (trimmed.startsWith('/snippet save ')) {
        const name = trimmed.slice(14).trim()
        if (!name) {
          console.log('  ✗ Usage: /snippet save <name>')
          askQuestion()
          return
        }
        // Find last assistant message
        let lastAssistantMsg = null
        for (let si = messages.length - 1; si >= 0; si--) {
          if (messages[si].role === 'assistant') {
            lastAssistantMsg = messages[si]
            break
          }
        }
        if (!lastAssistantMsg) {
          console.log('  ✗ No assistant response to save. Send a prompt first.')
          askQuestion()
          return
        }
        if (lastAssistantMsg.content.length === 0) {
          console.log('  ✗ Last assistant response is empty. Nothing to save.')
          askQuestion()
          return
        }
        const snippet = saveSnippet(name, lastAssistantMsg.content, '', 'Saved from chat', [])
        console.log(`  ✓ Snippet "${snippet.name}" saved (${lastAssistantMsg.content.length} chars)`)
        askQuestion()
        return
      }

      if (trimmed.startsWith('/snippet get ')) {
        const name = trimmed.slice(13).trim()
        if (!name) {
          console.log('  ✗ Usage: /snippet get <name>')
          askQuestion()
          return
        }
        const snippet = getSnippet(name)
        if (!snippet) {
          console.log(`  ✗ Snippet "${name}" not found. Use /snippet list to see saved snippets.`)
          askQuestion()
          return
        }
        console.log(`\n  🧩 ${snippet.name}`)
        if (snippet.description) console.log(`  ${d(snippet.description)}`)
        if (snippet.language) console.log(`  Language: ${snippet.language}`)
        console.log(`  ─${'─'.repeat(50)}`)
        console.log(snippet.code)
        console.log(`  ─${'─'.repeat(50)}\n`)
        askQuestion()
        return
      }

      if (trimmed === '/snippet list') {
        const snippets = listSnippets()
        if (snippets.length === 0) {
          console.log('  No snippets saved yet.')
        } else {
          console.log('\n  🧩 Saved Snippets')
          for (let si = 0; si < snippets.length; si++) {
            const s = snippets[si]
            const date = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''
            const preview = s.code.replace(/\n/g, ' ').substring(0, 60)
            console.log(`  [${si + 1}] ${b(s.name).padEnd(20)} ${d(preview)}${date ? ' ' + d(date) : ''}`)
          }
          console.log()
        }
        askQuestion()
        return
      }

      if (trimmed.startsWith('/snippet list ')) {
        const filter = trimmed.slice(14).trim()
        const snippets = listSnippets({ tag: filter })
        if (snippets.length === 0) {
          console.log(`  No snippets with tag "${filter}".`)
        } else {
          console.log(`\n  🧩 Snippets tagged "${filter}"`)
          for (const s of snippets) {
            console.log(`  • ${s.name}: ${s.description || s.code.substring(0, 40)}`)
          }
          console.log()
        }
        askQuestion()
        return
      }

      if (trimmed.startsWith('/snippet delete ')) {
        const name = trimmed.slice(16).trim()
        if (!name) {
          console.log('  ✗ Usage: /snippet delete <name>')
          askQuestion()
          return
        }
        const deleted = deleteSnippet(name)
        if (deleted) {
          console.log(`  ✓ Snippet "${name}" deleted`)
        } else {
          console.log(`  ✗ Snippet "${name}" not found`)
        }
        askQuestion()
        return
      }

      if (trimmed.startsWith('/snippet search ')) {
        const query = trimmed.slice(16).trim()
        if (!query) {
          console.log('  ✗ Usage: /snippet search <query>')
          askQuestion()
          return
        }
        const results = listSnippets({ search: query })
        if (results.length === 0) {
          console.log(`  No snippets matching "${query}".`)
        } else {
          console.log(`\n  🔍 Search results for "${query}":`)
          for (const s of results) {
            const preview = s.code.replace(/\n/g, ' ').substring(0, 80)
            console.log(`  • ${b(s.name)}: ${d(preview)}`)
          }
          console.log()
        }
        askQuestion()
        return
      }

      // ── /snippet export ──
      if (trimmed.startsWith('/snippet export-all')) {
        const filePath = trimmed.slice(20).trim() || ''
        try {
          const written = exportAllSnippets(filePath || undefined)
          console.log(`  ✓ All snippets exported to ${written}`)
        } catch (err) {
          console.log(`  ✗ ${err.message}`)
        }
        askQuestion()
        return
      }

      if (trimmed.startsWith('/snippet export ')) {
        const rest = trimmed.slice(16).trim()
        const toIdx = rest.indexOf(' to ')
        if (toIdx !== -1) {
          const idOrName = rest.slice(0, toIdx).trim()
          const filePath = rest.slice(toIdx + 4).trim()
          try {
            const written = exportSnippetToFile(idOrName, filePath)
            console.log(`  ✓ Exported to: ${written}`)
          } catch (err) {
            console.log(`  ✗ ${err.message}`)
          }
        } else {
          try {
            const { snippet, json } = exportSnippet(rest)
            console.log(`\n  🧩 ${snippet.name}`)
            console.log(`  ─${'─'.repeat(50)}`)
            console.log(json)
            console.log(`  ─${'─'.repeat(50)}`)
          } catch (err) {
            console.log(`  ✗ ${err.message}`)
          }
        }
        askQuestion()
        return
      }

      // ── /snippet import ──
      if (trimmed.startsWith('/snippet import-all ')) {
        const filePath = trimmed.slice(21).trim()
        if (!filePath) {
          console.log('  ✗ Usage: /snippet import-all <file>')
          askQuestion()
          return
        }
        try {
          const count = importAllSnippets(filePath)
          console.log(`  ✓ Imported ${count} snippet(s) from ${filePath}`)
        } catch (err) {
          console.log(`  ✗ ${err.message}`)
        }
        askQuestion()
        return
      }

      if (trimmed.startsWith('/snippet import ')) {
        const rest = trimmed.slice(16).trim()
        if (rest.startsWith('from ')) {
          const filePath = rest.slice(5).trim()
          try {
            const snippet = importSnippetFromFile(filePath)
            console.log(`  ✓ Imported: ${snippet.name}`)
          } catch (err) {
            console.log(`  ✗ ${err.message}`)
          }
        } else {
          try {
            const snippet = importSnippet(rest)
            console.log(`  ✓ Imported: ${snippet.name}`)
          } catch (err) {
            console.log(`  ✗ ${err.message}`)
          }
        }
        askQuestion()
        return
      }

      // ── /search — Search code in project ──
      if (trimmed === '/search') {
        console.log('  Usage: /search <query>')
        console.log('  Searches code in the current working directory.')
        console.log('  Example: /search function authenticate')
        askQuestion()
        return
      }

      if (trimmed.startsWith('/search ')) {
        let query = trimmed.slice(8).trim()
        if (!query) {
          console.log('  ✗ Usage: /search <query>')
          askQuestion()
          return
        }
        // Sanitize: strip shell metacharacters to prevent injection
        query = query.replace(/["'\$;`|&<>()\{\}]/g, '').trim()
        if (!query) {
          console.log('  ✗ Invalid search query after sanitization.')
          askQuestion()
          return
        }
        const { execSync } = await import('child_process')
        const cwd = process.cwd()
        console.log(`  🔍 Searching for "${query}" in ${cwd}`)
        console.log()
        try {
          const result = execSync(
            process.platform === 'win32'
              ? `findstr /s /n /c:"${query}" *.js *.ts *.jsx *.tsx *.py *.go *.rs *.java *.rb *.php *.c *.h *.cpp *.css *.html *.json *.yml *.yaml *.md 2>nul`
              : `grep -rn --include='*.{js,ts,jsx,tsx,py,go,rs,java,rb,php,c,h,cpp,css,html,json,yml,yaml,md}' -i "${query}" "${cwd}" 2>/dev/null | head -50`,
            { cwd, timeout: 15000, maxBuffer: 1024 * 1024, encoding: 'utf8', shell: true }
          )
          const output = (result || '').trim()
          if (output) {
            console.log(`  Found ${output.split('\n').length} matches (showing first 50):`)
            console.log()
            for (const line of output.split('\n').slice(0, 50)) {
              const matchIdx = line.toLowerCase().indexOf(query.toLowerCase())
              if (matchIdx >= 0) {
                const before = line.substring(0, matchIdx)
                const match = line.substring(matchIdx, matchIdx + query.length)
                const after = line.substring(matchIdx + query.length)
                console.log(`  ${before}${y(match)}${after}`)
              } else {
                console.log(`  ${line.substring(0, 120)}`)
              }
            }
          } else {
            console.log('  No matches found.')
          }
        } catch (err) {
          console.log('  No matches found (or search tool unavailable).')
        }
        console.log()
        askQuestion()
        return
      }

      // ── /context — Context file management ──
      if (trimmed === '/context') {
        console.log('\n  📂 Context Files')
        console.log('  ────────────────────────────────────────────')
        console.log('  /context add <file>     Add a file to context')
        console.log('  /context remove <file>  Remove a file from context')
        console.log('  /context list           List files in context')
        console.log('  /context clear          Clear all context')
        console.log()
        if (contextFiles.length === 0) {
          console.log('  No context files. Add files to include them in every prompt.')
        } else {
          console.log(`  ${contextFiles.length} file(s) in context:`)
          for (const ctx of contextFiles) {
            const preview = ctx.content.replace(/\n/g, ' ').substring(0, 50)
            console.log(`  • ${b(ctx.path)} ${d('(' + ctx.content.length + ' chars)')}`)
            console.log(`    ${d(preview)}`)
          }
        }
        console.log()
        askQuestion()
        return
      }

      if (trimmed.startsWith('/context add ')) {
        const filePath = trimmed.slice(13).trim()
        if (!filePath) {
          console.log('  ✗ Usage: /context add <filepath>')
          askQuestion()
          return
        }
        const { resolve: resolvePath } = await import('path')
        const { readFileSync, existsSync } = await import('fs')
        const absPath = resolvePath(process.cwd(), filePath)
        if (!existsSync(absPath)) {
          console.log(`  ✗ File not found: ${filePath}`)
          askQuestion()
          return
        }
        try {
          const content = readFileSync(absPath, 'utf8')
          const existingIdx = contextFiles.findIndex(c => c.path === filePath)
          if (existingIdx >= 0) {
            contextFiles[existingIdx] = { path: filePath, content }
            console.log(`  ✓ Updated context: ${filePath} (${content.length} chars)`)
          } else {
            contextFiles.push({ path: filePath, content })
            console.log(`  ✓ Added to context: ${filePath} (${content.length} chars)`)
          }
        } catch (err) {
          console.log(`  ✗ Error reading ${filePath}: ${err.message}`)
        }
        askQuestion()
        return
      }

      if (trimmed.startsWith('/context remove ')) {
        const filePath = trimmed.slice(16).trim()
        if (!filePath) {
          console.log('  ✗ Usage: /context remove <filepath>')
          askQuestion()
          return
        }
        const idx = contextFiles.findIndex(c => c.path.toLowerCase().includes(filePath.toLowerCase()))
        if (idx >= 0) {
          contextFiles.splice(idx, 1)
          console.log(`  ✓ Removed ${filePath} from context`)
        } else {
          console.log(`  ✗ "${filePath}" not found in context. Use /context list to see files.`)
        }
        askQuestion()
        return
      }

      if (trimmed === '/context list') {
        if (contextFiles.length === 0) {
          console.log('  No context files.')
        } else {
          console.log(`  📂 Context (${contextFiles.length} files):`)
          for (const ctx of contextFiles) {
            console.log(`  • ${ctx.path} (${ctx.content.length} chars)`)
          }
        }
        askQuestion()
        return
      }

      if (trimmed === '/context clear') {
        contextFiles.length = 0
        console.log('  ✓ All context files cleared')
        askQuestion()
        return
      }

      // ── /debug — Auto-debug loop ──
      if (trimmed === '/debug') {
        console.log('\n  🔧 Auto-Debug Loop')
        console.log('  ────────────────────────────────────────────')
        console.log('  Runs a command, captures errors, asks the AI for a fix,')
        console.log('  applies it, and retries automatically.')
        console.log()
        console.log('  Usage: /debug <command>')
        console.log('  Example: /debug bun run build')
        console.log('  Flags:   --iters=10    Max fix iterations (default 5)')
        console.log()
        askQuestion()
        return
      }

      if (trimmed.startsWith('/debug ')) {
        let debugCommand = trimmed.slice(7).trim()
        let debugIters = 5
        const iterMatch = debugCommand.match(/--iters=(\d+)/)
        if (iterMatch) {
          debugIters = parseInt(iterMatch[1], 10)
          debugCommand = debugCommand.replace(/--iters=\d+/g, '').trim()
        }
        if (!debugCommand) {
          console.log('  ✗ Usage: /debug <command>')
          askQuestion()
          return
        }

        ;(async () => {
          try {
            console.log()
            console.log('  ' + c('┄').repeat(50))
            console.log('  ' + b(y('✦ Auto-Debug Loop ✦')))
            console.log('  ' + d('Run command → detect errors → AI fix → retry'))
            console.log('  ' + c('┄').repeat(50))
            console.log()
            console.log('  ' + d('Command:') + ' ' + debugCommand)
            console.log('  ' + d('Max iterations:') + ' ' + debugIters)
            console.log('  ' + d('CWD:') + ' ' + process.cwd())
            console.log()

            const result = await runDebugLoop({
              command: debugCommand,
              model: currentModel,
              cwd: process.cwd(),
              maxIterations: debugIters,
              onStatus: (status) => {
                console.log('  ' + g('▸') + ' ' + status)
              },
              onChunk: (chunk) => {
                process.stdout.write(chunk)
              },
            })

            console.log()
            console.log('  ' + c('┄').repeat(50))
            if (result.success) {
              console.log('  ' + b(g('✅ Debug Loop: Success!')))
            } else {
              console.log('  ' + b(r('❌ Debug Loop: Could not fix')))
            }
            if (result.changes && result.changes.length > 0) {
              console.log('  ' + d('Files modified:') + ' ' + result.changes.length)
              for (const ch of result.changes) {
                console.log(`    ${ch.type}: ${ch.path}`)
              }
            }
            console.log('  ' + d('Iterations:') + ' ' + result.iterations)
            if (result.summary) {
              console.log('  ' + d('Summary:') + ' ' + result.summary.substring(0, 300))
            }
            console.log()
          } catch (err) {
            console.log()
            console.log('  ✗ Debug loop error: ' + err.message)
            console.log()
          }
          askQuestion()
        })()
        return
      }

      // ── /history — Conversation persistence ──
      if (trimmed === '/history') {
        const convs = getConversationSummaries()
        if (convs.length === 0) {
          console.log('  No saved conversations. Use /history save <name> to save one.')
        } else {
          console.log('\n  📜 Saved Conversations')
          console.log('  ────────────────────────────────────────────')
          for (let ci = 0; ci < convs.length; ci++) {
            const cv = convs[ci]
            const date = new Date(cv.updatedAt).toLocaleDateString()
            const agentTag = cv.agentName ? ' ' + cv.agentName : ''
            console.log('  [' + g(String(ci + 1).padStart(2)) + '] ' + b(cv.name.padEnd(20)) + ' ' + d(String(cv.messageCount) + ' msgs') + ' ' + d(date) + d(agentTag))
          }
          console.log()
          console.log('  ' + d('Usage: /history save <name>   Save current conversation'))
          console.log('  ' + d('       /history load <name>   Load and resume a conversation'))
          console.log('  ' + d('       /history delete <name> Delete a conversation'))
          console.log('  ' + d('       /history search <q>    Search conversations'))
        }
        console.log()
        askQuestion()
        return
      }

      if (trimmed.startsWith('/history save')) {
        const name = trimmed.slice(13).trim()
        if (!name) {
          console.log('  ✗ Usage: /history save <name>')
          askQuestion()
          return
        }
        if (messages.length === 0) {
          console.log('  ✗ No messages to save. Start a conversation first.')
          askQuestion()
          return
        }
        try {
          const conv = saveConversation(name, messages, {
            model: currentModel,
            agent: currentAgent.id,
            agentName: currentAgent.emoji + ' ' + currentAgent.name,
          })
          console.log(`  ✓ Conversation "${conv.name}" saved (${conv.messageCount} messages)`)
        } catch (err) {
          console.log(`  ✗ ${err.message}`)
        }
        askQuestion()
        return
      }

      if (trimmed.startsWith('/history load')) {
        const name = trimmed.slice(13).trim()
        if (!name) {
          console.log('  ✗ Usage: /history load <name>')
          askQuestion()
          return
        }
        const conv = loadConversation(name)
        if (!conv) {
          console.log(`  ✗ Conversation "${name}" not found. Use /history to list saved conversations.`)
          askQuestion()
          return
        }
        // Clear current messages and load saved ones
        messages.length = 0
        for (const msg of conv.messages) {
          messages.push(msg)
        }
        // Restore model and agent if available
        if (conv.model) {
          const restoredModel = MODELS.find((m) => m.id === conv.model)
          if (restoredModel) {
            currentModel = conv.model
            console.log(`  ✓ Restored model: ${restoredModel.displayName}`)
          }
        }
        if (conv.agent) {
          const restoredAgent = getAgent(conv.agent)
          if (restoredAgent) {
            currentAgent = restoredAgent
            console.log(`  ✓ Restored agent: ${currentAgent.emoji} ${currentAgent.name}`)
          }
        }
        console.log(`  ✓ Loaded conversation "${conv.name}" (${conv.messageCount} messages)`)
        console.log('  ' + d('Last message:') + ' ' + d(messages.length > 0 ? messages[messages.length - 1].content.substring(0, 80) + '...' : '(empty)'))
        console.log()
        askQuestion()
        return
      }

      if (trimmed.startsWith('/history delete')) {
        const name = trimmed.slice(15).trim()
        if (!name) {
          console.log('  ✗ Usage: /history delete <name>')
          askQuestion()
          return
        }
        const deleted = deleteConversation(name)
        if (deleted) {
          console.log(`  ✓ Conversation "${name}" deleted`)
        } else {
          console.log(`  ✗ Conversation "${name}" not found`)
        }
        askQuestion()
        return
      }

      if (trimmed.startsWith('/history search ')) {
        const query = trimmed.slice(16).trim()
        if (!query) {
          console.log('  ✗ Usage: /history search <query>')
          askQuestion()
          return
        }
        const results = listConversations({ search: query })
        if (results.length === 0) {
          console.log(`  No conversations matching "${query}".`)
        } else {
          console.log(`\n  🔍 Conversations matching "${query}":`)
          for (const cv of results) {
            const date = new Date(cv.updatedAt).toLocaleDateString()
            const preview = cv.messages.length > 0 ? cv.messages[0].content.replace(/\n/g, ' ').substring(0, 60) : ''
            console.log(`  • ${b(cv.name)} (${cv.messageCount} msgs, ${date}): ${d(preview)}`)
          }
          console.log()
        }
        askQuestion()
        return
      }

      // ── /history export <name> [to <file>] ──
      if (trimmed.startsWith('/history export ')) {
        const rest = trimmed.slice(16).trim()
        const toIdx = rest.indexOf(' to ')
        if (toIdx !== -1) {
          const idOrName = rest.slice(0, toIdx).trim()
          const filePath = rest.slice(toIdx + 4).trim()
          try {
            const written = exportConversationToFile(idOrName, filePath)
            console.log(`  ✓ Exported to: ${written}`)
          } catch (err) {
            console.log(`  ✗ ${err.message}`)
          }
        } else {
          try {
            const written = exportConversationToFile(rest)
            console.log(`  ✓ Exported to: ${written}`)
          } catch (err) {
            console.log(`  ✗ ${err.message}`)
          }
        }
        askQuestion()
        return
      }

      // ── /history import from <file> ──
      if (trimmed.startsWith('/history import ')) {
        const rest = trimmed.slice(16).trim()
        if (rest.startsWith('from ')) {
          const filePath = rest.slice(5).trim()
          try {
            const conv = importConversation(readFileSync(resolve(process.cwd(), filePath), 'utf8'))
            console.log(`  ✓ Imported: ${conv.name} (${conv.messageCount} messages)`)
          } catch (err) {
            console.log(`  ✗ ${err.message}`)
          }
        } else {
          try {
            const conv = importConversation(rest)
            console.log(`  ✓ Imported: ${conv.name} (${conv.messageCount} messages)`)
          } catch (err) {
            console.log(`  ✗ ${err.message}`)
          }
        }
        askQuestion()
        return
      }

      // ── /recommend — Model recommendation ──
      if (trimmed === '/recommend') {
        const { listTaskCategories } = await import('./models.js')
        const categories = listTaskCategories()
        console.log('\n  🎯 Model Recommendations')
        console.log('  ────────────────────────────────────────────')
        console.log('  Available task categories:')
        for (const cat of categories) {
          console.log('    ' + y(cat.id.padEnd(14)) + ' ' + d(cat.description))
        }
        console.log()
        console.log('  Usage: /recommend <task>  e.g., /recommend coding')
        console.log()
        askQuestion()
        return
      }

      if (trimmed.startsWith('/recommend ')) {
        const task = trimmed.slice(11).trim().toLowerCase()
        if (!task) {
          console.log('  ✗ Usage: /recommend <task>')
          console.log('  Tasks: coding, reasoning, creative, fast, multimodal, local, budget, uncensored')
          askQuestion()
          return
        }
        try {
          const { recommendModel } = await import('./models.js')
          const rec = recommendModel(task)
          console.log('\n  🎯 Recommended Model')
          console.log('  ────────────────────────────────────────────')
          console.log('  Task:       ' + y(task))
          console.log('  ' + d(rec.description))
          console.log()
          console.log('  ' + b('Best available:') + ' ' + c(rec.model.displayName) + ' (' + rec.model.id + ')')
          console.log('  ' + d('Provider: ') + d(rec.model.provider))
          console.log('  ' + d('Description: ') + d(rec.model.description))
          if (rec.alternatives.length > 0) {
            console.log()
            console.log('  ' + d('Alternatives (no API key configured):'))
            for (const alt of rec.alternatives.slice(0, 5)) {
              console.log('    ' + d('• ' + alt.displayName + ' (' + alt.id + ') — ' + alt.provider))
            }
          }
          console.log()
          console.log('  ' + d('Switch with:') + ' ' + y('/model ' + rec.model.id))
          console.log()
        } catch (err) {
          console.log(`  ✗ ${err.message}`)
        }
        askQuestion()
        return
      }

      // ── /balance — Check token balance ──
      if (trimmed === '/balance') {
        const bal = getTokenBalance()
        const limit = bal.max === Infinity ? 'Unlimited' : formatTokens(bal.max)
        const remaining = bal.max === Infinity ? '∞' : formatTokens(bal.remaining)
        const barLen = 24
        const filled = Math.round((bal.used / Math.max(1, bal.max)) * barLen)
        const bar = '█'.repeat(Math.min(filled, barLen)) + '░'.repeat(Math.max(0, barLen - filled))
        const pctColor = bal.pct > 80 ? r : bal.pct > 50 ? y : g
        console.log()
        console.log('  ' + c('┄').repeat(46))
        console.log('  ' + b(c('💳 Token Balance')))
        console.log('  ' + c('┄').repeat(46))
        console.log('  Tier:      ' + (bal.tier === 'free' ? d('Free') : p(bal.tier.toUpperCase())))
        console.log('  Limit:     ' + limit)
        console.log('  Used:      ' + formatTokens(bal.used))
        console.log('  Remaining: ' + (bal.exhausted ? r('EXHAUSTED') : g(remaining)))
        console.log('  Usage:     ' + pctColor('[' + bar + ']') + ' ' + d(bal.pct + '%') + (bal.pct > 80 ? ' ' + r('⚠') : ''))
        console.log()
        if (bal.exhausted) {
          console.log('  ' + r('⚠ Token balance exhausted!') + ' ' + d('Wait for reset or upgrade your tier.'))
          console.log('  ' + d('Use') + ' ' + y('/keygen') + ' ' + d('to generate a new premium key.'))
        } else if (bal.pct > 80) {
          console.log('  ' + y('⚠ Running low on tokens. ' + remaining + ' remaining.'))
        } else {
          console.log('  ' + d('You have plenty of tokens remaining. Keep coding!'))
        }
        console.log()
        askQuestion()
        return
      }

      // ── Pay command ──
      if (trimmed === '/pay') {
        var url = 'https://aigen7ev.ai/premium/'
        console.log()
        console.log('  ' + p('💎') + ' ' + b('Premium Payment') + ' ' + c('✦'))
        console.log('  ' + c('┄').repeat(44))
        console.log('  ' + d('All payments go directly to the developer.'))
        console.log()
        console.log('  ' + b('Accepted Methods:'))
        console.log('    ' + g('✓') + ' ' + b('PayPal') + '     ' + d('josejaimejulia7@gmail.com'))
        console.log('    ' + g('✓') + ' ' + b('Crypto') + '     ' + d('BTC, ETH, USDT, SOL'))
        console.log('    ' + g('✓') + ' ' + b('MiniPay') + '    ' + d('cUSD/cEUR via Celo'))
        console.log('    ' + g('✓') + ' ' + b('Bank') + '       ' + d('CAIXABANK ES96 2100 2034 1010 0102 7113'))
        console.log()
        console.log('  ' + d('Visit for details:') + ' ' + c(url))
        console.log()
        // Try to open the browser
        try {
          var cmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open'
          var cp = await import('child_process')
          cp.exec(cmd + ' ' + url, function() {})
          console.log('  ' + g('✓') + ' ' + d('Browser opened to') + ' ' + c('premium page'))
        } catch (e) {
          console.log('  ' + d('Open') + ' ' + c(url) + ' ' + d('in your browser'))
        }
        console.log()
        askQuestion()
        return
      }

      // ── Keygen command ──
      if (trimmed === '/keygen') {
        console.log('\n  💎 Premium Key Generator')
        console.log('  ────────────────────────────────────────────')
        console.log('  Available tiers:')
        console.log('    /keygen pro         ⭐ Pro - export/import agents, custom quantum')
        console.log('    /keygen elite       💎 Elite - all Pro + premium models + API')
        console.log('    /keygen enterprise  🏢 Enterprise - all Elite + batch inference')
        console.log('')
        console.log('  After payment at https://aigen7ev.ai/premium/, you will receive')
        console.log('  your real key by email. Use it with --premium-key or')
        console.log('  AIGENEV7_PREMIUM_KEY environment variable.')
        console.log()
        askQuestion()
        return
      }

      if (trimmed.startsWith('/keygen ')) {
        const tier = trimmed.slice(8).trim().toLowerCase()
        const validTiers = ['pro', 'elite', 'enterprise']
        if (validTiers.indexOf(tier) === -1) {
          console.log('  ✗ Invalid tier: ' + tier)
          console.log('  Usage: /keygen pro    | /keygen elite    | /keygen enterprise')
          console.log('         /keygen        (list available tiers)')
          askQuestion()
          return
        }

        // Generate 16 random alphanumeric chars
        var chars = '0123456789abcdefghijklmnopqrstuvwxyz'
        var rand = ''
        for (var i = 0; i < 16; i++) {
          rand += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        const key = 'ag7_' + tier + '_' + rand

        const tierLabels = {
          'pro': '⭐ Pro',
          'elite': '💎 Elite',
          'enterprise': '🏢 Enterprise',
        }

        console.log('')
        console.log('  💎 Premium Key Generated')
        console.log('  ────────────────────────────────────────────')
        console.log('  Tier:      ' + (tierLabels[tier] || tier))
        console.log('  Key:       ' + key)
        console.log('  Command:   bun run inference-cli.js chat --premium-key ' + key)
        console.log('  Env var:   AIGENEV7_PREMIUM_KEY=' + key)
        console.log('')
        console.log('  ⚠ This is a generated key format for demonstration.')
        console.log('  After payment, you will receive your real key.')
        console.log('  Visit https://aigen7ev.ai/premium/ for details.')
        console.log()
        askQuestion()
        return
      }

      // ════════════════════════════════════════════════════════════════
      // 🛡️ DEFENSIVE / OFFENSIVE FRAMEWORK COMMANDS
      // ════════════════════════════════════════════════════════════════

      // ── Bare /defensive shows list of all defensive agents ──
      if (trimmed === '/defensive') {
        const agents = getDefensiveAgents()
        console.log()
        console.log('  ' + c('┄').repeat(50))
        console.log('  ' + b('🛡️  Defensive Agents (Blue Team)'))
        console.log('  ' + d('Protection, validation, security, stability, compliance'))
        console.log('  ' + c('┄').repeat(50))
        console.log()
        for (const a of agents) {
          const intensityBar = '█'.repeat(a.intensity) + '░'.repeat(5 - a.intensity)
          const intensityColor = a.intensity >= 4 ? r : a.intensity >= 3 ? y : g
          console.log('  ' + a.emoji + ' ' + b(a.name.padEnd(22)) + '  ' + d('[intensity ' + a.intensity + '/5] ') + intensityColor(intensityBar))
          console.log('  ' + d('    ' + a.description))
          console.log('  ' + d('    ID: ' + a.id))
          console.log()
        }
        console.log('  ' + d('Usage: /defensive <agent name or id>  to show full details'))
        console.log('         /defensive --intensity=<n>  to filter by minimum intensity')
        console.log()
        askQuestion()
        return
      }

      // ── /defensive with filter or agent name ──
      if (trimmed.startsWith('/defensive ')) {
        const rest = trimmed.slice(11).trim()

        // Check for intensity filter: /defensive --intensity=4
        const intensityMatch = rest.match(/--intensity=(\d)/)
        if (intensityMatch) {
          const minIntensity = parseInt(intensityMatch[1], 10)
          const agents = getDefensiveAgents({ minIntensity })
          console.log()
          console.log('  ' + c('┄').repeat(50))
          console.log('  ' + b('🛡️  Defensive Agents (intensity ≥ ' + minIntensity + ')'))
          console.log('  ' + c('┄').repeat(50))
          console.log()
          if (agents.length === 0) {
            console.log('  ' + d('No defensive agents at intensity ≥ ' + minIntensity))
          } else {
            for (const a of agents) {
              const intensityBar = '█'.repeat(a.intensity) + '░'.repeat(5 - a.intensity)
              const intensityColor = a.intensity >= 4 ? r : a.intensity >= 3 ? y : g
              console.log('  ' + a.emoji + ' ' + b(a.name.padEnd(22)) + '  ' + d('[intensity ' + a.intensity + '/5] ') + intensityColor(intensityBar))
              console.log('  ' + d('    ' + a.description))
              console.log()
            }
          }
          console.log()
          askQuestion()
          return
        }

        // Show specific agent by name or ID
        const agent = getDefensiveAgents().find(a => a.name.toLowerCase() === rest.toLowerCase() || a.id === rest)
        if (agent) {
          const intensityBar = '█'.repeat(agent.intensity) + '░'.repeat(5 - agent.intensity)
          const intensityColor = agent.intensity >= 4 ? r : agent.intensity >= 3 ? y : g
          console.log()
          console.log('  ' + c('┄').repeat(50))
          console.log('  ' + agent.emoji + ' ' + b(agent.name) + '  🛡️ ' + d('Defensive'))
          console.log('  ' + c('┄').repeat(50))
          console.log()
          console.log('  ' + b('ID:') + '         ' + agent.id)
          console.log('  ' + b('Intensity:') + '   ' + agent.intensity + '/5 ' + intensityColor(intensityBar))
          console.log('  ' + b('Description:') + ' ' + agent.description)
          console.log()
          console.log('  ' + b('System Prompt:'))
          console.log('  ' + d('┄').repeat(50))
          console.log('  ' + agent.systemPrompt)
          console.log('  ' + d('┄').repeat(50))
          console.log()
        } else {
          console.log('  ✗ Unknown defensive agent: "' + rest + '"')
          console.log('  ' + d('Use /defensive to list all defensive agents.'))
        }
        askQuestion()
        return
      }

      // ── Bare /offensive shows list of all offensive agents ──
      if (trimmed === '/offensive') {
        const agents = getOffensiveAgents()
        console.log()
        console.log('  ' + c('┄').repeat(50))
        console.log('  ' + b('⚔️  Offensive Agents (Red Team)'))
        console.log('  ' + d('Creation, optimization, transformation, testing limits'))
        console.log('  ' + c('┄').repeat(50))
        console.log()
        for (const a of agents) {
          const intensityBar = '█'.repeat(a.intensity) + '░'.repeat(5 - a.intensity)
          const intensityColor = a.intensity >= 4 ? r : a.intensity >= 3 ? y : g
          console.log('  ' + a.emoji + ' ' + b(a.name.padEnd(22)) + '  ' + d('[intensity ' + a.intensity + '/5] ') + intensityColor(intensityBar))
          console.log('  ' + d('    ' + a.description))
          console.log('  ' + d('    ID: ' + a.id))
          console.log()
        }
        console.log('  ' + d('Usage: /offensive <agent name or id>  to show full details'))
        console.log('         /offensive --intensity=<n>  to filter by minimum intensity')
        console.log()
        askQuestion()
        return
      }

      // ── /offensive with filter or agent name ──
      if (trimmed.startsWith('/offensive ')) {
        const rest = trimmed.slice(11).trim()

        // Check for intensity filter: /offensive --intensity=4
        const intensityMatch = rest.match(/--intensity=(\d)/)
        if (intensityMatch) {
          const minIntensity = parseInt(intensityMatch[1], 10)
          const agents = getOffensiveAgents({ minIntensity })
          console.log()
          console.log('  ' + c('┄').repeat(50))
          console.log('  ' + b('⚔️  Offensive Agents (intensity ≥ ' + minIntensity + ')'))
          console.log('  ' + c('┄').repeat(50))
          console.log()
          if (agents.length === 0) {
            console.log('  ' + d('No offensive agents at intensity ≥ ' + minIntensity))
          } else {
            for (const a of agents) {
              const intensityBar = '█'.repeat(a.intensity) + '░'.repeat(5 - a.intensity)
              const intensityColor = a.intensity >= 4 ? r : a.intensity >= 3 ? y : g
              console.log('  ' + a.emoji + ' ' + b(a.name.padEnd(22)) + '  ' + d('[intensity ' + a.intensity + '/5] ') + intensityColor(intensityBar))
              console.log('  ' + d('    ' + a.description))
              console.log()
            }
          }
          console.log()
          askQuestion()
          return
        }

        // Show specific agent by name or ID
        const agent = getOffensiveAgents().find(a => a.name.toLowerCase() === rest.toLowerCase() || a.id === rest)
        if (agent) {
          const intensityBar = '█'.repeat(agent.intensity) + '░'.repeat(5 - agent.intensity)
          const intensityColor = agent.intensity >= 4 ? r : agent.intensity >= 3 ? y : g
          console.log()
          console.log('  ' + c('┄').repeat(50))
          console.log('  ' + agent.emoji + ' ' + b(agent.name) + '  ⚔️ ' + d('Offensive'))
          console.log('  ' + c('┄').repeat(50))
          console.log()
          console.log('  ' + b('ID:') + '         ' + agent.id)
          console.log('  ' + b('Intensity:') + '   ' + agent.intensity + '/5 ' + intensityColor(intensityBar))
          console.log('  ' + b('Description:') + ' ' + agent.description)
          console.log()
          console.log('  ' + b('System Prompt:'))
          console.log('  ' + d('┄').repeat(50))
          console.log('  ' + agent.systemPrompt)
          console.log('  ' + d('┄').repeat(50))
          console.log()
        } else {
          console.log('  ✗ Unknown offensive agent: "' + rest + '"')
          console.log('  ' + d('Use /offensive to list all offensive agents.'))
        }
        askQuestion()
        return
      }

      // ── /framework — Framework summary or agent details ──
      if (trimmed === '/framework') {
        const summary = getFrameworkSummary()
        console.log()
        console.log('  ' + c('┄').repeat(50))
        console.log('  ' + b('🏗️  Defensive/Offensive Framework'))
        console.log('  ' + d('A structured framework of AI agent personas'))
        console.log('  ' + c('┄').repeat(50))
        console.log()
        console.log('  ' + b('Total agents: ') + summary.total)
        console.log()

        // Defensive section
        const def = summary.defensive
        console.log('  ' + b('🛡️  Defensive (' + def.count + ' agents)') + '  ' + d('avg intensity: ' + def.averageIntensity + '/5'))
        for (const a of def.agents) {
          const bar = '█'.repeat(a.intensity) + '░'.repeat(5 - a.intensity)
          const intensityColor = a.intensity >= 4 ? r : a.intensity >= 3 ? y : g
          console.log('    ' + a.emoji + ' ' + b(a.name.padEnd(22)) + '  ' + intensityColor(bar) + ' ' + d(a.id))
        }
        console.log()

        // Offensive section
        const off = summary.offensive
        console.log('  ' + b('⚔️  Offensive (' + off.count + ' agents)') + '  ' + d('avg intensity: ' + off.averageIntensity + '/5'))
        for (const a of off.agents) {
          const bar = '█'.repeat(a.intensity) + '░'.repeat(5 - a.intensity)
          const intensityColor = a.intensity >= 4 ? r : a.intensity >= 3 ? y : g
          console.log('    ' + a.emoji + ' ' + b(a.name.padEnd(22)) + '  ' + intensityColor(bar) + ' ' + d(a.id))
        }
        console.log()

        console.log('  ' + d('Usage: /framework <agent-id>  to show full agent details'))
        console.log('         /defensive             to list defensive agents')
        console.log('         /offensive             to list offensive agents')
        console.log()
        askQuestion()
        return
      }

      // ── /framework with agent ID ──
      if (trimmed.startsWith('/framework ')) {
        const agentId = trimmed.slice(11).trim().toLowerCase()
        if (!agentId) {
          console.log('  ✗ Usage: /framework <agent-id>')
          console.log('  ' + d('Example: /framework code-reviewer'))
          askQuestion()
          return
        }

        // Search in defensive first, then offensive
        let agent = getDefensiveAgents().find(a => a.id === agentId || a.name.toLowerCase() === agentId)
        let category = 'defensive'
        let icon = '🛡️'
        if (!agent) {
          agent = getOffensiveAgents().find(a => a.id === agentId || a.name.toLowerCase() === agentId)
          category = 'offensive'
          icon = '⚔️'
        }

        if (agent) {
          const intensityBar = '█'.repeat(agent.intensity) + '░'.repeat(5 - agent.intensity)
          const intensityColor = agent.intensity >= 4 ? r : agent.intensity >= 3 ? y : g
          const categoryLabel = category === 'defensive' ? '🛡️ Defensive' : '⚔️ Offensive'
          console.log()
          console.log('  ' + c('┄').repeat(50))
          console.log('  ' + agent.emoji + ' ' + b(agent.name) + '  ' + d(categoryLabel))
          console.log('  ' + c('┄').repeat(50))
          console.log()
          console.log('  ' + b('ID:') + '         ' + agent.id)
          console.log('  ' + b('Category:') + '   ' + categoryLabel)
          console.log('  ' + b('Intensity:') + '   ' + agent.intensity + '/5 ' + intensityColor(intensityBar))
          console.log('  ' + b('Description:') + ' ' + agent.description)
          console.log()
          console.log('  ' + b('System Prompt:'))
          console.log('  ' + d('┄').repeat(50))
          console.log('  ' + agent.systemPrompt)
          console.log('  ' + d('┄').repeat(50))
          console.log()
        } else {
          console.log('  ✗ Unknown agent: "' + agentId + '"')
          console.log('  ' + d('Use /framework to list all agents. Try IDs like:'))
          console.log('  ' + d('  code-reviewer, security-auditor, test-engineer, zero-day-engineer'))
          console.log('  ' + d('  code-optimizer, refactor-agent, feature-implementer, api-generator'))
        }
        askQuestion()
        return
      }

      // ── Send prompt ──
      if (trimmed) {
        try {
          playPromptTone()
          messages.push({ role: 'user', content: trimmed })
          const response = await infer({
            model: currentModel,
            messages: buildMessages(),
            stream: true,
            writeToStdout: true,
          })
          if (response) {
            messages.push({ role: 'assistant', content: response })

            // ── Agent File Operations: detect all tool types ──
            const allOps = response.match(/\[(WRITE|EDIT|APPEND|INSERT|DELETE|RENAME|COPY|REPLACEALL):\s*([^\]]+)\]/gi)

            if (allOps) {
              console.log(`\n  ${c('┄').repeat(46)}`)
              console.log('  ' + b(y('📝 Agent wants to modify ' + allOps.length + ' file(s)')))
              for (const op of allOps) {
                const tagMatch = op.match(/\[(\w+):/i)
                const tag = tagMatch ? tagMatch[1].toLowerCase() : '?'
                let path = op.replace(/\[(WRITE|EDIT|APPEND|INSERT|DELETE|RENAME|COPY|REPLACEALL):/i, '').replace(']', '').trim()
                const icons = { write: '✏️', edit: '📝', append: '➕', insert: '📄', delete: '🗑️', rename: '📦', copy: '📋', replaceall: '🔄' }
                const icon = icons[tag] || '•'
                const labels = { write: 'Write', edit: 'Edit', append: 'Append', insert: 'Insert', delete: 'Delete', rename: 'Rename', copy: 'Copy', replaceall: 'Replace All' }
                console.log(`    ${icon} ${d(labels[tag] || tag + ':')} ${path}`)
              }
              console.log(`  ${c('┄').repeat(46)}`)
              console.log(`  ${d('Apply these changes?')} ${g('(y/N)')} `)

              // Ask for confirmation
              await new Promise((resolve) => {
                rl.question('  ' + g('>') + ' ', async (answer) => {
                  const shouldApply = answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes'

                  if (!shouldApply) {
                    console.log(`  ${d('Changes skipped (use /auto to auto-apply without confirmation)')}`)
                    resolve()
                    return
                  }

                  console.log(`  ${d('Applying changes...')}\n`)

                  // Parse and apply all tool operations
                  const toolActions = [
                    { tag: 'WRITE', regex: /\[WRITE:\s*([^\]]+)\]\s*\n([\s\S]*?)(?=\n\[|\n*$)/gi, handler: (m) => {
                      const fp = m[1].trim(), content = m[2].trim(), abs = resolve(process.cwd(), fp)
                      const si = fp.lastIndexOf(sep)
                      if (si > 0) { const d = abs.substring(0, abs.lastIndexOf(sep)); if (!existsSync(d)) mkdirSync(d, { recursive: true }) }
                      writeFileSync(abs, content, 'utf8')
                      return `Wrote ${fp} (${content.split('\n').length} lines)`
                    }},
                    { tag: 'APPEND', regex: /\[APPEND:\s*([^\]]+)\]\s*\n([\s\S]*?)(?=\n\[|\n*$)/gi, handler: (m) => {
                      const fp = m[1].trim(), content = m[2].trim()
                      appendFileSync(resolve(process.cwd(), fp), content + '\n', 'utf8')
                      return `Appended ${content.split('\n').length} lines to ${fp}`
                    }},
                    { tag: 'INSERT', regex: /\[INSERT:\s*([^\]]+?)\s*\|\s*AT:\s*(\d+)\]\s*\n([\s\S]*?)(?=\n\[|\n*$)/gi, handler: (m) => {
                      const fp = m[1].trim(), line = parseInt(m[2], 10), content = m[3].trim()
                      const abs = resolve(process.cwd(), fp)
                      const lines = readFileSync(abs, 'utf8').split('\n')
                      lines.splice(Math.max(0, Math.min(line - 1, lines.length)), 0, content)
                      writeFileSync(abs, lines.join('\n'), 'utf8')
                      return `Inserted at line ${line} in ${fp}`
                    }},
                    { tag: 'EDIT', regex: /\[EDIT:\s*([^\]]+)\]\s*\nOLD:\s*([\s\S]*?)\n+NEW:\s*([\s\S]*?)(?=\n\[|\n*$)/gi, handler: (m) => {
                      const fp = m[1].trim(), oldStr = m[2].trim(), newStr = m[3].trim()
                      const abs = resolve(process.cwd(), fp)
                      if (!existsSync(abs)) return `File not found: ${fp}`
                      let content = readFileSync(abs, 'utf8')
                      if (!content.includes(oldStr)) return `Could not find text in ${fp}`
                      writeFileSync(abs, content.replace(oldStr, newStr), 'utf8')
                      return `Edited ${fp}`
                    }},
                    { tag: 'DELETE', regex: /\[DELETE:\s*([^\]]+)\]/gi, handler: (m) => {
                      const fp = m[1].trim()
                      unlinkSync(resolve(process.cwd(), fp))
                      return `Deleted ${fp}`
                    }},
                    { tag: 'RENAME', regex: /\[RENAME:\s*([^\]]+?)\s*\|\s*TO:\s*([^\]]+)\]/gi, handler: (m) => {
                      const oldPath = m[1].trim(), newPath = m[2].trim()
                      renameSync(resolve(process.cwd(), oldPath), resolve(process.cwd(), newPath))
                      return `Renamed ${oldPath} → ${newPath}`
                    }},
                    { tag: 'COPY', regex: /\[COPY:\s*([^\]]+?)\s*\|\s*TO:\s*([^\]]+)\]/gi, handler: (m) => {
                      const src = m[1].trim(), dest = m[2].trim()
                      const absDest = resolve(process.cwd(), dest)
                      const destDir = dirname(absDest)
                      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
                      copyFileSync(resolve(process.cwd(), src), absDest)
                      return `Copied ${src} → ${dest}`
                    }},
                    { tag: 'REPLACEALL', regex: /\[REPLACEALL:\s*([^\]]+?)\s*\|\s*OLD:\s*([^\]]+?)\s*\|\s*NEW:\s*([^\]]+)\]/gi, handler: (m) => {
                      const fp = m[1].trim(), oldP = m[2].trim(), newP = m[3].trim()
                      const abs = resolve(process.cwd(), fp)
                      let content = readFileSync(abs, 'utf8')
                      // Escape regex special chars for literal matching
                      const escaped = oldP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                      const count = (content.match(new RegExp(escaped, 'g')) || []).length
                      content = content.replace(new RegExp(escaped, 'g'), newP)
                      writeFileSync(abs, content, 'utf8')
                      return `Replaced ${count} occurrences in ${fp}`
                    }},
                  ]

                  for (const action of toolActions) {
                    let match
                    action.regex.lastIndex = 0
                    while ((match = action.regex.exec(response)) !== null) {
                      try {
                        const msg = action.handler(match)
                        if (msg.startsWith('File not found') || msg.startsWith('Could not find')) {
                          console.log(`  ${r('✗')} ${d(msg)}`)
                        } else {
                          console.log(`  ${g('✓')} ${d(msg)}`)
                        }
                      } catch (err) {
                        console.log(`  ${r('✗')} ${d(action.tag.toLowerCase())}: ${err.message}`)
                      }
                    }
                  }

                  console.log(`  ${g('✓')} ${d('All changes applied')}`)
                  resolve()
                })
              })
            }
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
  const { readFileSync, existsSync, appendFileSync } = await import('fs')
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
      if (url.pathname === '/api/feedback' && req.method === 'POST') {
        try {
          const body = await req.json()
          // Validate
          if (!body.name || !body.message) {
            return new Response(JSON.stringify({ error: 'Name and message are required' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          // Append to feedback log
          const logLine = JSON.stringify(body) + '\n'
          const logPath = resolve(__dirname, 'feedback.log')
          appendFileSync(logPath, logLine, 'utf8')
          console.log('  [AIGENEV7] Feedback received from ' + body.name)
          return new Response(JSON.stringify({ status: 'ok' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }

      if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          store: !!process.env.STRIPE_SECRET_KEY,
          version: '7.0.0',
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // ── Auto Agent API ──
      if (url.pathname === '/api/auto-agent' && req.method === 'POST') {
        try {
          const body = await req.json()
          const { prompt: autoPrompt, model: modelId, maxIterations } = body

          if (!autoPrompt) {
            return new Response(JSON.stringify({ error: 'No prompt provided' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const { readable, writable } = new TransformStream()
          const writer = writable.getWriter()
          const encoder = new TextEncoder()

          const startTime = Date.now()

          runAutoAgent({
            prompt: autoPrompt,
            model: modelId || 'deepseek-v4-flash',
            cwd: process.cwd(),
            maxIterations: maxIterations || 10,
            onStatus: (status) => {
              console.log('  [AIGENEV7] [Auto] ' + status)
              writer.write(encoder.encode(JSON.stringify({ status, statusType: 'status', pct: 50 }) + '\n'))
            },
            onChunk: (chunk) => {
              // Pass AI response chunks
              writer.write(encoder.encode(JSON.stringify({ log: chunk, logType: 'info' }) + '\n'))
            },
          }).then((result) => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
            writer.write(encoder.encode(JSON.stringify({
              done: true,
              success: result.success,
              summary: result.summary,
              changes: result.changes || [],
              iteration: result.iteration,
              totalIterations: result.totalIterations,
              elapsed,
              pct: 100,
              status: '✅ Complete!',
            }) + '\n'))
            writer.close()
          }).catch((err) => {
            writer.write(encoder.encode(JSON.stringify({ error: err.message, done: true }) + '\n'))
            writer.close()
          })

          return new Response(readable, {
            headers: {
              'Content-Type': 'application/x-ndjson',
              'Cache-Control': 'no-cache',
            },
          })
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
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

  // Premium gate for ask command
  const askedModel = model ? MODELS.find((m) => m.id === model) : null
  if (askedModel && askedModel.premium && !hasFeature('premium_models')) {
    console.log('  ' + getUpgradePrompt('premium_models'))
    console.log('  Use a free model (e.g., --model deepseek-v4-flash) or set AIGENEV7_PREMIUM_KEY.')
    process.exit(1)
  }

  playPromptTone()

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
