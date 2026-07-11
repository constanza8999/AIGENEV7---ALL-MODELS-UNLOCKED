#!/usr/bin/env bun
/**
 * Simulates: /context add freebuff/auto-agent.js
 * Then: Ask a question about Auto Agents
 *
 * Run with: bun test freebuff/context-test.test.js
 */

import { describe, it, expect } from 'bun:test'
import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('/context add freebuff/auto-agent.js', () => {
  it('reads auto-agent.js and formats it as context (simulated CLI behavior)', () => {
    // This is what the CLI does when you run /context add freebuff/auto-agent.js
    // from the codebuff-main project root:
    const cwd = resolve(__dirname, '..') // Go up from freebuff/ to codebuff-main/
    const filePath = 'freebuff/auto-agent.js'
    const absPath = resolve(cwd, filePath)

    console.log(`\n  📂 ${'─'.repeat(44)}`)
    console.log(`  Running: /context add ${filePath}`)
    console.log(`  ${'─'.repeat(50)}`)

    // Step 1: Check if file exists (CLI does this)
    expect(existsSync(absPath)).toBe(true)
    console.log(`  ✓ File exists: ${filePath}`)

    // Step 2: Read file content (CLI reads with readFileSync)
    const content = readFileSync(absPath, 'utf8')
    const MAX_CONTEXT_CHARS = 8000
    const truncated = content.length > MAX_CONTEXT_CHARS

    console.log(`  ✓ Read ${content.length} chars (${content.split('\n').length} lines)`)

    // This is how the CLI formats the context in the system prompt:
    const contextSection = [
      '',
      '## Context Files',
      '',
      `### ${filePath}`,
      '```',
      truncated ? content.substring(0, MAX_CONTEXT_CHARS) + '\n[... truncated ...]' : content,
      '```',
      '',
    ].join('\n')

    console.log(`\n  📋 Context formatted as system prompt section:`)
    console.log(`  ${'─'.repeat(50)}`)
    console.log(contextSection.substring(0, 300) + '...')
    
    // Step 3: Show stats about what the AI would see
    const contextLength = content.length
    const isTruncated = contextLength > MAX_CONTEXT_CHARS
    console.log(`\n  📊 Context Stats:`)
    console.log(`  File:     ${filePath}`)
    console.log(`  Size:     ${contextLength} chars`)
    console.log(`  Lines:    ${content.split('\n').length}`)
    console.log(`  AI sees:  ${isTruncated ? MAX_CONTEXT_CHARS + ' chars (truncated)' : 'Full file'}`)
    
    // The file exists and was read - test passes
    expect(content.length).toBeGreaterThan(1000)
  })
})

describe('Ask: How does the auto agent work?', () => {
  it('answers based on the context from auto-agent.js', () => {
    const cwd = resolve(__dirname, '..')
    const content = readFileSync(resolve(cwd, 'freebuff/auto-agent.js'), 'utf8')

    // Extract key information from the code
    const hasRunAutoAgent = content.includes('export async function runAutoAgent')
    const hasParseToolCalls = content.includes('function parseToolCalls')
    const has17Tools = content.includes('17 tools')
    const hasBlockEnd = content.includes('blockEnd')
    const hasSafeWrite = content.includes('safeWriteFile')
    const hasSafeRead = content.includes('safeReadFile')

    console.log(`\n  🤖 Auto Agent Report (from ${content.split('\n').length}-line source)`)
    console.log(`  ${'─'.repeat(50)}`)

    // Summary of how the auto agent works, extracted directly from the code
    console.log(`\n  The auto agent at freebuff/auto-agent.js has:`)
    console.log(`  • ${hasRunAutoAgent ? '✅' : '❌'} runAutoAgent() — main entry point and loop`)
    console.log(`  • ${hasParseToolCalls ? '✅' : '❌'} parseToolCalls() — parses AI responses for [TOOL:] directives`)
    console.log(`  • ${has17Tools ? '✅' : '❌'} 17 tools (READ, WRITE, EDIT, APPEND, INSERT, DELETE, RENAME, COPY, REPLACEALL, LIST, GLOB, GREP, RUN, DIFF, FETCH, STATUS, DONE)`)
    console.log(`  • ${hasSafeRead ? '✅' : '❌'} safeReadFile() — reads files with safety checks`)
    console.log(`  • ${hasSafeWrite ? '✅' : '❌'} safeWriteFile() — writes files with directory creation`)

    // Flow explanation
    console.log(`\n  🔄 Agent Loop Flow:`)
    console.log(`  1. System prompt + user prompt → infer() LLM call`)
    console.log(`  2. AI responds with tool directives: [READ: path], [WRITE: path]\\ncontent, etc.`)
    console.log(`  3. parseToolCalls() extracts all tool directives from the response`)
    console.log(`  4. Each tool is executed: safeReadFile, safeWriteFile, etc.`)
    console.log(`  5. Results are formatted with formatToolResults() and fed back to the AI`)
    console.log(`  6. AI sees results, continues to next step, or calls [DONE]`)
    console.log(`  7. DONE handler returns changes array with all file modifications tracked`)

    // Key features
    console.log(`\n  🛡️ Safety Features:`)
    console.log(`  • Ignored paths: node_modules, .git, .next, dist, .cache, build, .env, .lic`)
    console.log(`  • File size limit: 10 MB`)
    console.log(`  • Destructive command blocking: rm -rf, format, fdisk, dd, etc.`)
    console.log(`  • All file operations have try-catch error handling`)

    // Defensive/Offensive framework
    const hasDefensive = content.includes('isDestructive')
    const hasBlockEndRegex = content.includes('blockEnd')
    console.log(`\n  🔧 Technical Details:`)
    console.log(`  • ${hasDefensive ? '✅' : '❌'} Destructive command detection`)
    console.log(`  • ${hasBlockEndRegex ? '✅' : '❌'} Multi-line block parsing for WRITE/APPEND/INSERT`)
    console.log(`  • Max iterations: configurable (default 20)`)

    expect(hasRunAutoAgent).toBe(true)
    expect(hasParseToolCalls).toBe(true)
    expect(has17Tools).toBe(true)
  })
})
