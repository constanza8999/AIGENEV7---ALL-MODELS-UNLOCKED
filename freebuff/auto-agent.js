#!/usr/bin/env bun

/**
 * AIGENEV7 Auto Agent — Autonomous Coding Agent
 * ─────────────────────────────────────────────────
 * An AI-driven agent with 17 tools to read, write, edit,
 * search, rename, copy, fetch, and manipulate files.
 *
 * Usage:
 *   import { runAutoAgent } from './auto-agent.js'
 *   const result = await runAutoAgent({
 *     prompt: 'Add error handling to server.js',
 *     model: 'deepseek-v4-flash',
 *     cwd: '/path/to/project',
 *     onStatus: (msg) => console.log(msg),
 *   })
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync, unlinkSync, renameSync, appendFileSync } from 'fs'
import { resolve, sep, basename, dirname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { globSync } from 'bun'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Limits ──
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FETCH_SIZE = 2 * 1024 * 1024

// ── Ignored paths ──
const IGNORE_PATTERNS = [
  /[/\\]node_modules[/\\]/,
  /[/\\]\.git[/\\]/,
  /[/\\]\.next[/\\]/,
  /[/\\]dist[/\\]/,
  /[/\\]\.cache[/\\]/,
  /[/\\]build[/\\]/,
  /\.env$/,
  /\.lic$/,
]

function isIgnored(absPath) {
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(absPath)) return true
  }
  return false
}

// ── Safe file operations ──

function safeReadFile(path) {
  try {
    if (!existsSync(path)) return { error: `File not found: ${path}` }
    if (isIgnored(path)) return { error: `Skipped: ${path} (ignored)` }
    const st = statSync(path)
    if (st && st.size > MAX_FILE_SIZE) return { error: `File too large (${(st.size / 1024 / 1024).toFixed(1)}MB > 10MB limit)` }
    const content = readFileSync(path, 'utf8')
    return { content, lines: content.split('\n').length, size: content.length, path }
  } catch (err) { return { error: `Error reading ${path}: ${err.message}` } }
}

function safeWriteFile(path, content) {
  try {
    if (isIgnored(path)) return { error: `Skipped: ${path} (ignored)` }
    const sepIdx = path.lastIndexOf(sep)
    if (sepIdx > 0) { const dir = path.substring(0, sepIdx); if (!existsSync(dir)) mkdirSync(dir, { recursive: true }) }
    writeFileSync(path, content, 'utf8')
    return { success: true, path, lines: content.split('\n').length, size: content.length }
  } catch (err) { return { error: `Error writing ${path}: ${err.message}` } }
}

function safeEditFile(path, oldString, newString) {
  try {
    if (!existsSync(path)) return { error: `File not found: ${path}` }
    if (isIgnored(path)) return { error: `Skipped: ${path} (ignored)` }
    let content = readFileSync(path, 'utf8')
    if (!content.includes(oldString)) return { error: `Could not find text in ${path}` }
    content = content.replace(oldString, newString)
    writeFileSync(path, content, 'utf8')
    return { success: true, path, replacement: `Replaced ${oldString.length} chars` }
  } catch (err) { return { error: `Error editing ${path}: ${err.message}` } }
}

function safeAppendFile(path, content) {
  try {
    if (!existsSync(path)) return { error: `File not found: ${path}` }
    if (isIgnored(path)) return { error: `Skipped: ${path} (ignored)` }
    appendFileSync(path, content + '\n', 'utf8')
    const lines = content.split('\n').length
    return { success: true, path, lines, size: content.length }
  } catch (err) { return { error: `Error appending to ${path}: ${err.message}` } }
}

function safeInsertAtLine(path, lineNumber, content) {
  try {
    if (!existsSync(path)) return { error: `File not found: ${path}` }
    if (isIgnored(path)) return { error: `Skipped: ${path} (ignored)` }
    const original = readFileSync(path, 'utf8')
    const lines = original.split('\n')
    const idx = Math.max(0, Math.min(lineNumber - 1, lines.length))
    lines.splice(idx, 0, content)
    writeFileSync(path, lines.join('\n'), 'utf8')
    return { success: true, path, atLine: lineNumber, insertedLines: content.split('\n').length }
  } catch (err) { return { error: `Error inserting in ${path}: ${err.message}` } }
}

function safeDeleteFile(path) {
  try {
    if (!existsSync(path)) return { error: `File not found: ${path}` }
    if (isIgnored(path)) return { error: `Skipped: ${path} (ignored)` }
    unlinkSync(path)
    return { success: true, path }
  } catch (err) { return { error: `Error deleting ${path}: ${err.message}` } }
}

function safeRenameFile(oldPath, newPath) {
  try {
    if (!existsSync(oldPath)) return { error: `File not found: ${oldPath}` }
    const newDir = dirname(newPath)
    if (!existsSync(newDir)) mkdirSync(newDir, { recursive: true })
    renameSync(oldPath, newPath)
    return { success: true, from: oldPath, to: newPath }
  } catch (err) { return { error: `Error renaming ${oldPath}: ${err.message}` } }
}

function safeCopyFile(sourcePath, destPath) {
  try {
    if (!existsSync(sourcePath)) return { error: `Source not found: ${sourcePath}` }
    const destDir = dirname(destPath)
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
    copyFileSync(sourcePath, destPath)
    const st = statSync(destPath)
    return { success: true, from: sourcePath, to: destPath, size: st.size }
  } catch (err) { return { error: `Error copying ${sourcePath}: ${err.message}` } }
}

function safeListDir(dirPath) {
  try {
    if (!existsSync(dirPath)) return { error: `Directory not found: ${dirPath}` }
    const entries = readdirSync(dirPath, { withFileTypes: true })
    const files = [], dirs = []
    for (const e of entries) {
      if (e.name.startsWith('.')) continue
      if (e.isDirectory()) dirs.push(e.name + '/'); else files.push(e.name)
    }
    return { files, dirs, path: dirPath, total: files.length + dirs.length }
  } catch (err) { return { error: `Error listing ${dirPath}: ${err.message}` } }
}

function safeGlob(pattern, cwd) {
  try {
    const matches = globSync(pattern, { cwd })
    return { matches: matches.slice(0, 200), total: matches.length, pattern }
  } catch (err) { return { error: `Error globbing ${pattern}: ${err.message}` } }
}

function safeGrep(pattern, cwd) {
  try {
    const result = execSync(
      process.platform === 'win32'
        ? `findstr /s /n /c:"${pattern}" *.js *.ts *.jsx *.tsx *.py *.go *.rs *.java *.rb *.php *.c *.h *.cpp *.css *.html *.json *.yml *.yaml *.md 2>nul | head -50`
        : `grep -rn --include='*.{js,ts,jsx,tsx,py,go,rs,java,rb,php,c,h,cpp,css,html,json,yml,yaml,md}' -i "${pattern}" . 2>/dev/null | head -50`,
      { cwd, timeout: 15000, maxBuffer: 1024 * 1024, encoding: 'utf8', shell: true }
    )
    const output = (result || '').trim()
    return { matches: output ? output.split('\n').length : 0, output: output.substring(0, 5000), pattern }
  } catch { return { matches: 0, output: '', pattern } }
}

function safeReplaceAll(path, oldPattern, newPattern) {
  try {
    if (!existsSync(path)) return { error: `File not found: ${path}` }
    if (isIgnored(path)) return { error: `Skipped: ${path} (ignored)` }
    let content = readFileSync(path, 'utf8')
    const count = (content.match(new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
    if (count === 0) return { error: `No matches found in ${path}` }
    content = content.replace(new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPattern)
    writeFileSync(path, content, 'utf8')
    return { success: true, path, replacements: count }
  } catch (err) { return { error: `Error replacing in ${path}: ${err.message}` } }
}

function safeGitDiff(path, cwd) {
  try {
    const target = path || '.'
    const result = execSync(`git diff -- "${target}"`, { cwd, timeout: 10000, maxBuffer: 1024 * 1024, encoding: 'utf8' })
    const output = (result || '').trim()
    if (!output) return { diff: '(no changes)', path: target }
    return { diff: output.substring(0, 5000), path: target, truncated: output.length > 5000 }
  } catch (err) {
    if (err.message.includes('not a git repository')) return { diff: '(not a git repository)', path }
    return { diff: `(error: ${err.message.substring(0, 100)})`, path }
  }
}

async function safeFetchUrl(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) return { error: `HTTP ${response.status}: ${response.statusText}` }
    const text = await response.text()
    if (text.length > MAX_FETCH_SIZE) return { content: text.substring(0, MAX_FETCH_SIZE) + '\n[... truncated ...]', url, truncated: true, size: text.length }
    return { content: text, url, size: text.length }
  } catch (err) {
    if (err.name === 'TimeoutError') return { error: `Timeout fetching ${url}` }
    return { error: `Fetch error: ${err.message}` }
  }
}

const DESTRUCTIVE_COMMANDS = [
  /(?:^|sudo\s+)rm\s+/i, /(?:^|sudo\s+)del\s+\/f/i, /(?:^|sudo\s+)rd\s+\/s/i,
  /(?:^|sudo\s+)format/i, /(?:^|sudo\s+)fdisk/i, /(?:^|sudo\s+)mkfs/i,
  /(?:^|sudo\s+)dd\s+if/i, /(?:^|sudo\s+)shutdown/i, /(?:^|sudo\s+)reboot/i,
  /(?:^|sudo\s+)poweroff/i, /(?:^|sudo\s+)rm\s+-[rf]{2}/i,
]

function isDestructive(command) { return DESTRUCTIVE_COMMANDS.some(p => p.test(command.trim())) }

function safeRunCommand(command, cwd) {
  try {
    if (isDestructive(command)) return { error: `Blocked: destructive command`, blocked: true }
    const result = execSync(command, { cwd, timeout: 30000, maxBuffer: 1024 * 1024, encoding: 'utf8', shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash' })
    const output = (result || '').trim()
    return { output: output.substring(0, 5000), truncated: output.length > 5000, command }
  } catch (err) {
    return { error: err.message.substring(0, 500), exitCode: err.status ?? -1, stdout: (err.stdout || '').substring(0, 2000), stderr: (err.stderr || '').substring(0, 2000), command }
  }
}

// ── Parse tool calls from AI output ──

function parseToolCalls(text) {
  const calls = []
  if (/\[DONE\]/i.test(text)) calls.push({ type: 'done' })

  const sm = text.match(/\[STATUS:\s*([^\]]+)\]/i)
  if (sm) calls.push({ type: 'status', message: sm[1].trim() })

  for (const [tag, type] of [['READ', 'read'], ['LIST', 'list'], ['DELETE', 'delete'], ['DIFF', 'diff']]) {
    const matches = text.matchAll(new RegExp(`\\[${tag}:\\s*([^\\]]+)\\]`, 'gi'))
    for (const m of matches) calls.push({ type, path: m[1].trim() })
  }

  const globMatches = text.matchAll(/\[GLOB:\s*([^\]]+)\]/gi)
  for (const m of globMatches) calls.push({ type: 'glob', pattern: m[1].trim() })

  const runMatches = text.matchAll(/\[RUN:\s*([^\]]+)\]/gi)
  for (const m of runMatches) calls.push({ type: 'run', command: m[1].trim() })

  const grepMatches = text.matchAll(/\[GREP:\s*([^\]]+)\]/gi)
  for (const m of grepMatches) calls.push({ type: 'grep', pattern: m[1].trim() })

  const fetchMatches = text.matchAll(/\[FETCH:\s*([^\]]+)\]/gi)
  for (const m of fetchMatches) calls.push({ type: 'fetch', url: m[1].trim() })

  // WRITE/APPEND/INSERT: path\ncontent (multi-line blocks)
  // Use a regex literal to avoid backslash escaping issues with new RegExp()
  const blockEnd = /\n\[(?:WRITE|EDIT|APPEND|INSERT|READ|LIST|GLOB|RUN|GREP|FETCH|DELETE|DIFF|RENAME|COPY|REPLACEALL|DONE|STATUS)/i

  const writeRegex = new RegExp('\\[WRITE:\\s*([^\\]]+)\\]\\s*\\n([\\s\\S]*?)(?=' + blockEnd.source + '|\\n*$)', 'gi')
  for (const m of text.matchAll(writeRegex)) calls.push({ type: 'write', path: m[1].trim(), content: m[2].replace(/\n$/, '') })

  // EDIT: path\nOLD: ...\nNEW: ...
  const editRegex = /\[EDIT:\s*([^\]]+)\]\s*\nOLD:\s*([\s\S]*?)\n+NEW:\s*([\s\S]*?)(?=\n\[|$)/gi
  for (const m of text.matchAll(editRegex)) calls.push({ type: 'edit', path: m[1].trim(), oldString: m[2].trim(), newString: m[3].trim() })

  // APPEND: path\ncontent
  const appendRegex = new RegExp('\\[APPEND:\\s*([^\\]]+)\\]\\s*\\n([\\s\\S]*?)(?=' + blockEnd.source + '|\\n*$)', 'gi')
  for (const m of text.matchAll(appendRegex)) calls.push({ type: 'append', path: m[1].trim(), content: m[2].replace(/\n$/, '') })

  // INSERT: path | AT: N\ncontent
  const insertRegex = new RegExp('\\[INSERT:\\s*([^\\]]+?)\\s*\\|\\s*AT:\\s*(\\d+)\\]\\s*\\n([\\s\\S]*?)(?=' + blockEnd.source + '|\\n*$)', 'gi')
  for (const m of text.matchAll(insertRegex)) calls.push({ type: 'insert', path: m[1].trim(), line: parseInt(m[2], 10), content: m[3].replace(/\n$/, '') })

  // RENAME: old | TO: new
  const renameRegex = /\[RENAME:\s*([^\]]+?)\s*\|\s*TO:\s*([^\]]+)\]/gi
  for (const m of text.matchAll(renameRegex)) calls.push({ type: 'rename', oldPath: m[1].trim(), newPath: m[2].trim() })

  // COPY: source | TO: dest
  const copyRegex = /\[COPY:\s*([^\]]+?)\s*\|\s*TO:\s*([^\]]+)\]/gi
  for (const m of text.matchAll(copyRegex)) calls.push({ type: 'copy', sourcePath: m[1].trim(), destPath: m[2].trim() })

  // REPLACEALL: path | OLD: text | NEW: text
  const replaceRegex = /\[REPLACEALL:\s*([^\]]+?)\s*\|\s*OLD:\s*([^\]]+?)\s*\|\s*NEW:\s*([^\]]+)\]/gi
  for (const m of text.matchAll(replaceRegex)) calls.push({ type: 'replaceall', path: m[1].trim(), oldPattern: m[2].trim(), newPattern: m[3].trim() })

  return calls
}

// ── Format tool results ──

function formatToolResults(results) {
  if (results.length === 0) return ''
  let msg = '\n[TOOL RESULTS]\n'
  for (const r of results) {
    if (r.error) { msg += `  ⚠ ${r.tool}${r.path ? ' on ' + r.path : ''}: ${r.error}\n`; continue }
    switch (r.tool) {
      case 'read':
        msg += `  ✓ Read ${r.path}\n  ── ${r.path} (${r.lines} lines, ${r.size} chars) ──\n`
        const maxC = 3000; const tr = r.content.length > maxC
        msg += (tr ? r.content.substring(0, maxC) + '\n[... truncated ' + (r.content.length - maxC) + ' more chars ...]' : r.content) + '\n'
        msg += `  ── End of ${r.path} ──\n`
        break
      case 'write': msg += `  ✓ Wrote ${r.path} (${r.lines} lines, ${r.size} chars)\n`; break
      case 'edit': msg += `  ✓ Edited ${r.path}: ${r.replacement}\n`; break
      case 'append': msg += `  ✓ Appended ${r.lines} lines to ${r.path}\n`; break
      case 'insert': msg += `  ✓ Inserted ${r.insertedLines} lines at line ${r.atLine} in ${r.path}\n`; break
      case 'delete': msg += `  ✓ Deleted ${r.path}\n`; break
      case 'rename': msg += `  ✓ Renamed ${r.from} → ${r.to}\n`; break
      case 'copy': msg += `  ✓ Copied ${r.from} → ${r.to} (${r.size} bytes)\n`; break
      case 'replaceall': msg += `  ✓ Replaced ${r.replacements} occurrence(s) in ${r.path}\n`; break
      case 'list':
        msg += `  ✓ Listed ${r.path} (${r.total} entries)\n`
        if (r.dirs.length) msg += `    Dirs: ${r.dirs.join(', ')}\n`
        if (r.files.length) msg += `    Files: ${r.files.join(', ')}\n`
        break
      case 'glob': msg += `  ✓ Glob ${r.pattern}: ${r.matches.length} matches\n`
        if (r.matches.length > 0) msg += `    ${r.matches.join('\n    ')}\n`
        break
      case 'grep': msg += `  ✓ Grep "${r.pattern}": ${r.matches} matches\n`
        if (r.output) msg += r.output.substring(0, 2000) + '\n'
        break
      case 'run': msg += `  ✓ Ran: ${r.command}\n`; if (r.output) msg += r.output + '\n'; break
      case 'diff': msg += `  ── Diff ${r.path} ──\n${r.diff}\n  ── End diff ──\n`; break
      case 'fetch': msg += `  ── Fetched ${r.url} (${r.size} bytes) ──\n${(r.content || '').substring(0, 3000)}\n  ── End fetch ──\n`; break
    }
  }
  return msg
}

// ── The main agent loop ──

/**
 * Run the autonomous coding agent.
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {string} opts.model
 * @param {string} opts.cwd
 * @param {function} opts.onStatus
 * @param {function} opts.onChunk
 * @param {number} opts.maxIterations
 * @returns {Promise<object>}
 */
// ── Export for testing ──
export const __test__ = {
  isIgnored, isDestructive, parseToolCalls, formatToolResults,
  safeReadFile, safeWriteFile, safeEditFile, safeAppendFile,
  safeInsertAtLine, safeDeleteFile, safeRenameFile, safeCopyFile,
  safeReplaceAll, safeListDir, safeGlob, safeGrep, safeRunCommand,
  safeGitDiff, safeFetchUrl,
}

export async function runAutoAgent(opts = {}) {
  const { prompt, model: modelId, cwd = process.cwd(), onStatus = () => {}, onChunk = () => {}, maxIterations = 20 } = opts
  if (!prompt) throw new Error('Prompt is required')
  onStatus('Initializing auto agent...')

  const projectName = basename(cwd)
  let projectDescription = projectName
  try {
    const pkgPath = resolve(cwd, 'package.json')
    if (existsSync(pkgPath)) { const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); projectDescription = pkg.name || projectName }
  } catch {}

  // ── Comprehensive system prompt ──
  const systemPrompt = `You are an autonomous coding agent called "Auto Agent" running inside AIGENEV7.

You have 17 tools to explore, read, write, edit, search, rename, copy, delete, and debug files.

## Available Tools

### File Operations
**[READ: relative/path]** — Read a file's contents. Always read first before editing.
**[WRITE: relative/path]** — Write content to a file (creates or overwrites). Content follows on next line(s).
**[EDIT: relative/path]** — Find and replace text. Format:
  [EDIT: path]
  OLD: exact text to replace
  NEW: replacement text
**[APPEND: relative/path]** — Append content to the end of an existing file. Content follows on next line(s).
**[INSERT: relative/path | AT: N]** — Insert content at specific line number N. Content follows on next line(s).
**[DELETE: relative/path]** — Delete a file.
**[RENAME: path | TO: newpath]** — Rename or move a file.
**[COPY: source | TO: dest]** — Copy a file to a new location.

### Search Operations
**[LIST: path]** — List files and directories in a path. Use this to explore project structure.
**[GLOB: pattern]** — Search for files matching a glob pattern (e.g., **/*.js, src/**/*.ts).
**[GREP: pattern]** — Search for text pattern across all project source files. Use this to find where functions/variables are used.

### Code Quality
**[REPLACEALL: path | OLD: text | NEW: text]** — Replace ALL occurrences of a string in a file. Use this for renaming variables/functions across a file.
**[DIFF: path]** — Show the git diff for a file (or "." for all changes). Use this to review uncommitted changes.
**[RUN: command with args]** — Run a terminal command in the project directory. 30s timeout. Use for tests, lint, install, etc.

### Research
**[FETCH: url]** — Fetch a URL and return its contents. Use this to read documentation, check APIs, or research solutions.

### Communication
**[STATUS: Brief status message]** — Report your current status/thinking to the user.
**[DONE]** — Call this when the task is complete. Include a brief summary.

## Rules
1. **ALWAYS READ FIRST** — Before editing a file, read it to understand its current content.
2. **Be precise** — For [EDIT:], the OLD text must match exactly. Use [WRITE:] to rewrite entire files.
3. **One step at a time** — Issue one tool per response. Wait for the result before proceeding.
4. **Explain your changes** — Tell the user what you're doing and why.
5. **Run verification** — After changes, use [RUN:] to run tests, check syntax, or lint.
6. **Use [STATUS:]** frequently to keep the user informed.
7. **Stop with [DONE]** when complete or if stuck.

## Working Directory
The user's project is at: ${cwd}
Project name: ${projectDescription}

## Instructions
${prompt}

Now proceed step by step. Start by exploring the project structure if needed, then make the changes.`

  let infer
  try { const inf = await import('./inference.js'); infer = inf.infer }
  catch { const inf = await import(resolve(__dirname, 'inference.js')); infer = inf.infer }

  const messages = [{ role: 'system', content: systemPrompt }]
  const changes = []

  onStatus(`🤖 Auto Agent started — working on: ${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}`)

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    onStatus(`Step ${iteration + 1}/${maxIterations} — thinking...`)
    let response
    try { response = await infer({ model: modelId, messages, stream: false, maxTokens: 4096, temperature: 0.3 }) }
    catch (err) { return { success: false, summary: `Error: ${err.message}`, changes, iteration } }
    if (!response) { onStatus('⚠ No response from AI'); break }

    onChunk(`\n  🤖 ${response.split('\n')[0]}\n`)
    const calls = parseToolCalls(response)

    // IMPORTANT: Check for DONE but DON'T return yet — process tool calls first
    // so that [WRITE:], [EDIT:], etc. are executed before the agent completes.
    const isComplete = calls.some(c => c.type === 'done')

    const results = []
    for (const call of calls) {
      if (call.type === 'done') continue
      switch (call.type) {
        case 'read': {
          const r = safeReadFile(resolve(cwd, call.path))
          results.push(r.error ? { tool: 'read', path: call.path, error: r.error } : { tool: 'read', path: call.path, ...r })
          if (!r.error) onStatus(`📖 Read ${call.path} (${r.lines} lines)`)
          break
        }
        case 'write': {
          const r = safeWriteFile(resolve(cwd, call.path), call.content)
          results.push(r.error ? { tool: 'write', path: call.path, error: r.error } : { tool: 'write', path: call.path, ...r })
          if (!r.error) { changes.push({ type: 'write', path: call.path, lines: r.lines }); onStatus(`✏️ Wrote ${call.path} (${r.lines} lines)`) }
          break
        }
        case 'edit': {
          const r = safeEditFile(resolve(cwd, call.path), call.oldString, call.newString)
          results.push(r.error ? { tool: 'edit', path: call.path, error: r.error } : { tool: 'edit', path: call.path, ...r })
          if (!r.error) { changes.push({ type: 'edit', path: call.path }); onStatus(`✏️ Edited ${call.path}`) }
          break
        }
        case 'append': {
          const r = safeAppendFile(resolve(cwd, call.path), call.content)
          results.push(r.error ? { tool: 'append', path: call.path, error: r.error } : { tool: 'append', path: call.path, ...r })
          if (!r.error) { changes.push({ type: 'append', path: call.path }); onStatus(`➕ Appended to ${call.path}`) }
          break
        }
        case 'insert': {
          const r = safeInsertAtLine(resolve(cwd, call.path), call.line, call.content)
          results.push(r.error ? { tool: 'insert', path: call.path, error: r.error } : { tool: 'insert', path: call.path, ...r })
          if (!r.error) { changes.push({ type: 'insert', path: call.path }); onStatus(`📄 Inserted at line ${call.line} in ${call.path}`) }
          break
        }
        case 'delete': {
          const r = safeDeleteFile(resolve(cwd, call.path))
          results.push(r.error ? { tool: 'delete', path: call.path, error: r.error } : { tool: 'delete', path: call.path, ...r })
          if (!r.error) { changes.push({ type: 'delete', path: call.path }); onStatus(`🗑️ Deleted ${call.path}`) }
          break
        }
        case 'rename': {
          const r = safeRenameFile(resolve(cwd, call.oldPath), resolve(cwd, call.newPath))
          results.push(r.error ? { tool: 'rename', from: call.oldPath, error: r.error } : { tool: 'rename', from: call.oldPath, to: call.newPath, ...r })
          if (!r.error) { changes.push({ type: 'rename', from: call.oldPath, to: call.newPath }); onStatus(`📦 Renamed ${call.oldPath} → ${call.newPath}`) }
          break
        }
        case 'copy': {
          const r = safeCopyFile(resolve(cwd, call.sourcePath), resolve(cwd, call.destPath))
          results.push(r.error ? { tool: 'copy', from: call.sourcePath, error: r.error } : { tool: 'copy', from: call.sourcePath, to: call.destPath, ...r })
          if (!r.error) { changes.push({ type: 'copy', from: call.sourcePath, to: call.destPath }); onStatus(`📋 Copied ${call.sourcePath} → ${call.destPath}`) }
          break
        }
        case 'replaceall': {
          const r = safeReplaceAll(resolve(cwd, call.path), call.oldPattern, call.newPattern)
          results.push(r.error ? { tool: 'replaceall', path: call.path, error: r.error } : { tool: 'replaceall', path: call.path, ...r })
          if (!r.error) { changes.push({ type: 'replaceall', path: call.path }); onStatus(`🔄 Replaced ${r.replacements} in ${call.path}`) }
          break
        }
        case 'list': {
          const r = safeListDir(resolve(cwd, call.path))
          results.push(r.error ? { tool: 'list', path: call.path, error: r.error } : { tool: 'list', path: call.path, ...r })
          if (!r.error) onStatus(`📁 Listed ${call.path} (${r.total} entries)`)
          break
        }
        case 'glob': {
          const r = safeGlob(call.pattern, cwd)
          results.push(r.error ? { tool: 'glob', pattern: call.pattern, error: r.error } : { tool: 'glob', ...r })
          if (!r.error) onStatus(`🔍 Glob ${call.pattern} (${r.matches.length} matches)`)
          break
        }
        case 'grep': {
          const r = safeGrep(call.pattern, cwd)
          results.push({ tool: 'grep', ...r })
          onStatus(`🔎 Grep "${call.pattern}" (${r.matches} matches)`)
          break
        }
        case 'run': {
          const r = safeRunCommand(call.command, cwd)
          results.push(r.error ? { tool: 'run', command: call.command, ...r } : { tool: 'run', command: call.command, ...r })
          onStatus(`⚡ Ran: ${call.command.substring(0, 60)}... (${r.error ? 'exit ' + r.exitCode : 'OK'})`)
          break
        }
        case 'diff': {
          const r = safeGitDiff(call.path === '.' ? '' : call.path, cwd)
          results.push({ tool: 'diff', path: call.path, ...r })
          onStatus(`📊 Diff${call.path !== '.' ? ' ' + call.path : ''}`)
          break
        }
        case 'fetch': {
          const r = await safeFetchUrl(call.url)
          results.push(r.error ? { tool: 'fetch', url: call.url, error: r.error } : { tool: 'fetch', url: call.url, ...r })
          if (!r.error) onStatus(`🌐 Fetched ${call.url} (${r.size} bytes)`)
          break
        }
        case 'status': { onStatus(`💬 ${call.message}`); break }
      }
    }

    // Handle DONE after processing all tool calls
    if (isComplete) {
      const sc = calls.find(c => c.type === 'status')
      onStatus(sc ? sc.message : '✅ Auto Agent completed the task')
      return { success: true, summary: response.replace(/\[DONE\]/gi, '').replace(/\[STATUS:[^\]]+\]/gi, '').trim().substring(0, 500), changes, iteration: iteration + 1, totalIterations: iteration + 1 }
    }

    if (results.length === 0 && !calls.some(c => c.type === 'status')) {
      messages.push({ role: 'assistant', content: response })
      messages.push({ role: 'user', content: 'No tool calls detected. Use available tools ([READ:], [WRITE:], [EDIT:], [APPEND:], [INSERT:], [DELETE:], [RENAME:], [COPY:], [LIST:], [GLOB:], [GREP:], [REPLACEALL:], [DIFF:], [RUN:], [FETCH:]) or call [DONE].' })
      continue
    }

    const toolResults = formatToolResults(results)
    messages.push({ role: 'assistant', content: response })
    messages.push({ role: 'user', content: toolResults || 'No tools were called.' })
  }

  onStatus(`⚠ Reached max iterations (${maxIterations})`)
  return { success: true, summary: `Completed ${changes.length} file changes across ${maxIterations} iterations`, changes, iteration: maxIterations, totalIterations: maxIterations, maxedOut: true }
}
