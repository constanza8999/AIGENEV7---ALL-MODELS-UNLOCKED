#!/usr/bin/env bun
/**
 * AIGENEV7 — Auto-Debug Loop Integration Test
 *
 * Tests the full runDebugLoop flow with a mocked inference module.
 * The debug loop:
 *   1. Runs a command (e.g., `node app.js`)
 *   2. Captures errors when it fails
 *   3. Asks the AI to analyze the error and suggest a fix
 *   4. Applies the fix (WRITE or EDIT)
 *   5. Re-runs the command
 *   6. Reports success if it passes, or loops again
 *
 * Run with: bun test freebuff/debug-agent-integration.test.js
 */

import { describe, it, expect, beforeAll, afterAll, mock } from 'bun:test'
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEST_DIR = resolve(__dirname, '.debug-agent-test')
const APP_FILE = resolve(TEST_DIR, 'app.js')

// ── Create test project: a deliberately broken JS file ──
beforeAll(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true })
  mkdirSync(TEST_DIR, { recursive: true })

  // Create app.js with a deliberate syntax error:
  // "consol.log" (typo) instead of "console.log"
  writeFileSync(APP_FILE, [
    'function greet(name) {',
    "  return `Hello, ${name}!`;",
    '}',
    '',
    "consol.log(greet('World'));",   // BUG: 'consol' is not defined
    '',
  ].join('\n'), 'utf8')
})

afterAll(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true })
})

describe('Debug Agent End-to-End', () => {
  it('detects the consol.log error and fixes it via auto-debug loop', async () => {
    // ── The command that will fail ────────────────────────────
    // `node app.js` will throw a ReferenceError: consol is not defined
    const debugCommand = 'node app.js'

    // ── Mock AI response ─────────────────────────────────────
    // When the debug agent sends the error to the AI, the mock
    // returns a [WRITE:] directive that fixes the typo.
    const mockAiResponse = [
      'The error is a typo: "consol" should be "console". Fixing:',
      '',
      '[WRITE: app.js]',
      'function greet(name) {',
      "  return `Hello, ${name}!`;",
      '}',
      '',
      "console.log(greet('World'));",
    ].join('\n')

    let inferCallCount = 0
    const mockInfer = async (opts) => {
      inferCallCount++
      console.log(`    [Mock] Infer call #${inferCallCount}: returning fix`)
      return mockAiResponse
    }

    // Mock the inference module BEFORE importing debug-agent
    mock.module('./inference.js', () => ({ infer: mockInfer }))
    mock.module(resolve(__dirname, 'inference.js'), () => ({ infer: mockInfer }))

    // Import debug agent
    const { runDebugLoop } = await import('./debug-agent.js?' + Date.now() + Math.random())

    // ── Run the debug loop ────────────────────────────────────
    const statuses = []

    const result = await runDebugLoop({
      command: debugCommand,
      model: '__mock__',
      cwd: TEST_DIR,
      maxIterations: 3,
      onStatus: (msg) => {
        statuses.push(msg)
        console.log(`    [Status] ${msg}`)
      },
      onChunk: () => {},
    })

    // ── Results ───────────────────────────────────────────────
    console.log(`\n  Result: success=${result.success}, iterations=${result.iterations}, fixApplied=${result.fixApplied}`)
    console.log(`  Changes: ${JSON.stringify(result.changes)}`)
    console.log(`  Summary: ${result.summary ? result.summary.substring(0, 150) : '(none)'}`)
    console.log(`  Infer calls: ${inferCallCount}`)

    // Verify debug loop succeeded
    expect(result.success).toBe(true)
    expect(result.fixApplied).toBe(true)
    expect(result.iterations).toBeGreaterThanOrEqual(1)
    expect(result.exitCode).toBe(0)
    expect(inferCallCount).toBeGreaterThanOrEqual(1)

    // ── Verify file was fixed ─────────────────────────────────
    const fixedContent = readFileSync(APP_FILE, 'utf8')
    console.log(`\n  📄 Fixed app.js:`)
    console.log('  ─────────────────────────────')
    for (const line of fixedContent.split('\n')) {
      console.log('  ' + line)
    }

    // Should now have 'console.log' instead of 'consol.log'
    expect(fixedContent).toContain('console.log(greet')
    // The bug should be gone
    expect(fixedContent).not.toContain('consol.log')

    console.log('\n  ✅ Debug loop integration test passed!')
  }, 30000)
})

describe('Debug Agent - Command succeeds on first try', () => {
  it('returns success immediately when the command works', async () => {
    // Create a valid JS file
    const validFile = resolve(TEST_DIR, 'valid.js')
    writeFileSync(validFile, 'console.log("hello");\n', 'utf8')

    // Import debug agent (no mock needed — command succeeds on first try)
    const { runDebugLoop } = await import('./debug-agent.js?' + Date.now() + Math.random())
    const result = await runDebugLoop({
      command: 'node valid.js',
      model: '__mock__',
      cwd: TEST_DIR,
      maxIterations: 3,
      onStatus: () => {},
      onChunk: () => {},
    })

    // Should succeed without any fixes
    expect(result.success).toBe(true)
    expect(result.fixApplied).toBe(false)
    expect(result.iterations).toBe(0)
  })
})

describe('Debug Agent - AI cannot fix', () => {
  it('returns gaveUp when AI responds with [DONE: Could not determine fix]', async () => {
    // Create a file with an unfixable error
    writeFileSync(resolve(TEST_DIR, 'unfixable.js'), 'some undecipherable mess $%^&*\n')

    const mockGiveUp = async () => {
      return '[DONE: Could not determine fix] The error is incomprehensible.'
    }

    mock.module('./inference.js', () => ({ infer: mockGiveUp }))
    mock.module(resolve(__dirname, 'inference.js'), () => ({ infer: mockGiveUp }))

    const { runDebugLoop } = await import('./debug-agent.js?' + Date.now() + Math.random())

    const result = await runDebugLoop({
      command: 'node unfixable.js',
      model: '__mock__',
      cwd: TEST_DIR,
      maxIterations: 3,
      onStatus: () => {},
      onChunk: () => {},
    })

    expect(result.success).toBe(false)
    expect(result.gaveUp).toBe(true)
    expect(result.fixApplied).toBe(false)
  })
})
