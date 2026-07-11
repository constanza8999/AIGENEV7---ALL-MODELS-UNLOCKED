#!/usr/bin/env bun
/**
 * AIGENEV7 — Auto Agent Integration Test
 *
 * Tests the full runAutoAgent flow with a mocked inference module.
 * The mock simulates AI responses that read a file, write to it, and complete.
 *
 * Run with: bun test freebuff/auto-agent-integration.test.js
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEST_DIR = resolve(__dirname, '.auto-agent-int-test')
const SCRIPT_FILE = resolve(TEST_DIR, 'greet.js')

// ── Create test project ──
beforeAll(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true })
  mkdirSync(TEST_DIR, { recursive: true })

  writeFileSync(SCRIPT_FILE, [
    'function greet(name) {',
    '  return `Hello, ${name}!`;',
    '}',
    '',
    'console.log(greet("World"));',
    '',
  ].join('\n'), 'utf8')

  writeFileSync(resolve(TEST_DIR, 'package.json'), JSON.stringify({
    name: 'auto-agent-demo',
  }), 'utf8')
})

afterAll(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true })
})

// Helper: wait for mock.module to settle
const delay = (ms) => new Promise(r => setTimeout(r, ms))

describe('Auto Agent End-to-End', () => {

  it('adds a farewell() function to greet.js using the runAutoAgent loop', async () => {
    // ── Mock responses ─────────────────────────────────────────
    // Response 1: Read the file
    const response1 = [
      '[STATUS: Reading greet.js to understand its structure]',
      '[READ: greet.js]',
    ].join('\n')

    // Response 2: Write the updated function + DONE
    const response2 = [
      '[WRITE: greet.js]',
      'function greet(name) {',
      '  return `Hello, ${name}!`;',
      '}',
      '',
      '/**',
      ' * Say goodbye to someone.',
      ' */',
      'function farewell(name) {',
      '  return `Goodbye, ${name}!`;',
      '}',
      '',
      'console.log(greet("World"));',
      'console.log(farewell("World"));',
      '[STATUS: Added farewell() function]',
      '[DONE]',
    ].join('\n')

    let callCount = 0
    const mockInfer = async (opts) => {
      const response = callCount === 0 ? response1 : response2
      callCount++
      console.log(`    [Mock] Infer call #${callCount} returning ${response.length} chars`)
      return response
    }

    // Mock the inference module
    const { mock } = await import('bun:test')
    mock.module('./inference.js', () => ({ infer: mockInfer }))
    mock.module(resolve(__dirname, 'inference.js'), () => ({ infer: mockInfer }))

    // Import auto-agent AFTER mock setup
    const mod = await import('./auto-agent.js?' + Date.now() + Math.random())
    const { runAutoAgent } = mod

    // ── Run the auto agent ─────────────────────────────────────
    const statuses = []

    const result = await runAutoAgent({
      prompt: 'Add a farewell() function to greet.js',
      model: '__mock__',
      cwd: TEST_DIR,
      maxIterations: 5,
      onStatus: (msg) => {
        statuses.push(msg)
        console.log(`    [Status] ${msg}`)
      },
      onChunk: () => {},
    })

    // ── Results ────────────────────────────────────────────────
    console.log(`\n  Result: success=${result.success}, iterations=${result.totalIterations || result.iteration}, changes=${result.changes.length}`)
    console.log(`  Changes: ${JSON.stringify(result.changes)}`)
    console.log(`  Summary: ${result.summary ? result.summary.substring(0, 100) : '(none)'}`)

    expect(result.success).toBe(true)
    expect(result.changes.length).toBeGreaterThanOrEqual(1)
    expect(callCount).toBeGreaterThanOrEqual(1)

    // ── Verify file content ────────────────────────────────────
    const content = readFileSync(SCRIPT_FILE, 'utf8')
    console.log(`\n  Updated file (${content.length} chars):`)
    console.log('  ─────────────────────')
    for (const line of content.split('\n')) {
      console.log('  ' + line)
    }

    expect(content).toContain('function farewell(name)')
    expect(content).toContain('Goodbye')
    expect(content).toContain('function greet(name)')
  }, 30000)
})

describe('Auto Agent - Error handling', () => {
  it('throws when prompt is missing', async () => {
    const { runAutoAgent } = await import('./auto-agent.js?' + Date.now())
    await expect(runAutoAgent({})).rejects.toThrow('Prompt is required')
  })
})
