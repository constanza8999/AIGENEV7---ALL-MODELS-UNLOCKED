#!/usr/bin/env bun

/**
 * AIGENEV7 Auto-Debug Agent
 * ──────────────────────────
 * An extreme-level feature that runs a command, captures errors,
 * feeds them to the AI model, receives a fix, applies it, and
 * retries — all automatically.
 *
 * Usage:
 *   import { runDebugLoop } from './debug-agent.js'
 *   const result = await runDebugLoop({
 *     command: 'bun run build',
 *     model: 'deepseek-v4-flash',
 *     cwd: '/path/to/project',
 *     maxIterations: 5,
 *     onStatus: (msg) => console.log(msg),
 *   })
 */

import { execSync } from 'child_process'
import { resolve, dirname, basename, sep } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Run the auto-debug loop.
 * 
 * @param {object} opts
 * @param {string} opts.command        - Command to run (e.g., "bun run build")
 * @param {string} opts.model          - Model ID for AI fix suggestions
 * @param {string} opts.cwd            - Working directory
 * @param {function} opts.onStatus     - Status callback
 * @param {function} opts.onChunk      - Stream chunk callback
 * @param {number} opts.maxIterations  - Max fix attempts (default 5)
 * @returns {Promise<object>}
 */
export async function runDebugLoop(opts = {}) {
  const {
    command,
    model: modelId,
    cwd = process.cwd(),
    onStatus = () => {},
    onChunk = () => {},
    maxIterations = 5,
  } = opts

  if (!command) throw new Error('Command is required')

  onStatus(`⚙️ Running: ${command}`)

  // First run the command to see what happens
  let firstRun
  try {
    const out = execSync(command, {
      cwd,
      timeout: 60000,
      maxBuffer: 2 * 1024 * 1024,
      encoding: 'utf8',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
    })
    firstRun = { success: true, exitCode: 0, stdout: (out || '').trim(), stderr: '' }
  } catch (err) {
    firstRun = {
      success: false,
      exitCode: err.status ?? -1,
      stdout: (err.stdout || '').trim().substring(0, 5000),
      stderr: (err.stderr || '').trim().substring(0, 5000),
      error: err.message.substring(0, 500),
    }
  }

  if (firstRun.success) {
    onStatus('✅ Command succeeded on first try — no debugging needed')
    return {
      success: true,
      fixApplied: false,
      iterations: 0,
      summary: 'Command completed successfully without errors',
      output: firstRun.stdout.substring(0, 2000),
      exitCode: 0,
    }
  }

  onStatus(`🔴 Command failed (exit ${firstRun.exitCode}). Starting auto-debug loop...`)

  // ── Import infer dynamically ──
  let infer
  try {
    const inf = await import('./inference.js')
    infer = inf.infer
  } catch {
    const inf = await import(resolve(__dirname, 'inference.js'))
    infer = inf.infer
  }

  const projectName = basename(cwd)
  const messages = []
  let fixApplied = false
  let totalIterations = 0

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    totalIterations++
    onStatus(`🔍 Debug iteration ${iteration + 1}/${maxIterations}`)

    // Build the prompt with error context
    const debugPrompt = `I'm trying to run this command in my project "${projectName}" at ${cwd}:

\`\`\`
${command}
\`\`\`

But it failed with exit code ${firstRun.exitCode}.

## Error Output
### stderr:
${firstRun.stderr || '(no stderr output)'}

### stdout:
${firstRun.stdout || '(no stdout output)'}

### Error message:
${firstRun.error || 'Unknown error'}

## Rules
1. Analyze the error and suggest a fix.
2. Suggest ONLY the specific code changes needed (file paths, old/new content).
3. Use [WRITE: path] or [EDIT: path] format for changes.
4. Keep fixes minimal and targeted — don't rewrite unrelated code.
5. If you can't determine the fix, say [DONE: Could not determine fix]`

    let response
    try {
      response = await infer({
        model: modelId,
        messages: [
          { role: 'system', content: 'You are an expert debugger. Analyze error output, identify root causes, and provide minimal targeted fixes. Use [WRITE: relative/path] or [EDIT: relative/path]\nOLD:\n...\nNEW:\n... format to suggest changes.' },
          { role: 'user', content: debugPrompt },
        ],
        stream: false,
        maxTokens: 4096,
        temperature: 0.2,
      })
    } catch (err) {
      onStatus(`⚠ AI error: ${err.message}`)
      continue
    }

    if (!response) {
      onStatus('⚠ No response from AI')
      continue
    }

    // Check if AI gave up
    if (/\[DONE[^\]]*\]/i.test(response)) {
      onStatus('🤷 AI could not determine a fix')
      return {
        success: false,
        fixApplied: false,
        iterations: totalIterations,
        summary: response.substring(0, 500),
        output: firstRun,
        exitCode: firstRun.exitCode,
        gaveUp: true,
      }
    }

    // Parse and apply fixes
    const changes = []
    const writeRegex = /\[WRITE:\s*([^\]]+)\]\s*\n([\s\S]*?)(?=\n\[|\n*$)/gi
    const editRegex = /\[EDIT:\s*([^\]]+)\]\s*\nOLD:\s*([\s\S]*?)\nNEW:\s*([\s\S]*?)(?=\n\[|\n*$)/gi

    let writeMatch
    while ((writeMatch = writeRegex.exec(response)) !== null) {
      const filePath = writeMatch[1].trim()
      const content = writeMatch[2].trim()
      const absPath = resolve(cwd, filePath)
      try {
        const sepIdx = filePath.lastIndexOf(sep)
        if (sepIdx > 0) {
          const dir = absPath.substring(0, absPath.lastIndexOf(sep))
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        }
        writeFileSync(absPath, content, 'utf8')
        changes.push({ type: 'write', path: filePath })
        onStatus(`✏️ Applied fix: Wrote ${filePath}`)
        fixApplied = true
      } catch (err) {
        onStatus(`⚠ Failed to write ${filePath}: ${err.message}`)
      }
    }

    let editMatch
    while ((editMatch = editRegex.exec(response)) !== null) {
      const filePath = editMatch[1].trim()
      const oldStr = editMatch[2].trim()
      const newStr = editMatch[3].trim()
      const absPath = resolve(cwd, filePath)
      try {
        if (!existsSync(absPath)) {
          onStatus(`⚠ File not found: ${filePath}`)
          continue
        }
        let content = readFileSync(absPath, 'utf8')
        if (!content.includes(oldStr)) {
          onStatus(`⚠ Could not find text to replace in ${filePath}`)
          continue
        }
        content = content.replace(oldStr, newStr)
        writeFileSync(absPath, content, 'utf8')
        changes.push({ type: 'edit', path: filePath })
        onStatus(`✏️ Applied fix: Edited ${filePath}`)
        fixApplied = true
      } catch (err) {
        onStatus(`⚠ Failed to edit ${filePath}: ${err.message}`)
      }
    }

    if (changes.length === 0) {
      onStatus('⚠ AI did not suggest any file changes')
    }

    // Re-run the command
    onStatus(`⚙️ Re-running: ${command}`)
    try {
      const out = execSync(command, {
        cwd,
        timeout: 60000,
        maxBuffer: 2 * 1024 * 1024,
        encoding: 'utf8',
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
      })
      onStatus('✅ Command succeeded after fix!')
      return {
        success: true,
        fixApplied: true,
        iterations: totalIterations,
        changes,
        summary: `Fixed in ${totalIterations} iteration(s). ${changes.length} file(s) modified.`,
        output: (out || '').trim().substring(0, 2000),
        exitCode: 0,
      }
    } catch (err) {
      firstRun = {
        success: false,
        exitCode: err.status ?? -1,
        stdout: (err.stdout || '').trim().substring(0, 3000),
        stderr: (err.stderr || '').trim().substring(0, 3000),
        error: err.message.substring(0, 500),
      }
      onStatus(`🔴 Still failing (exit ${firstRun.exitCode})`)
    }
  }

  onStatus(`⚠ Max iterations (${maxIterations}) reached without success`)
  return {
    success: false,
    fixApplied,
    iterations: totalIterations,
    summary: `Could not fix after ${totalIterations} iterations. Last error: ${firstRun.error || 'Unknown'}`,
    output: firstRun,
    exitCode: firstRun.exitCode,
    maxedOut: true,
  }
}
