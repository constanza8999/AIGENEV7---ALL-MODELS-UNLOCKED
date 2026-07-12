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

// ════════════════════════════════════════════════════════════════════════
// Continuous Testing Loop — modify → test → fix → retest → pass
// ════════════════════════════════════════════════════════════════════════
describe('Continuous Testing Loop', () => {
  const CT_DIR = resolve(__dirname, '.auto-agent-ct-test')
  const CT_GREET = resolve(CT_DIR, 'greet.js')
  const CT_TEST = resolve(CT_DIR, 'greet.test.js')

  beforeAll(() => {
    if (existsSync(CT_DIR)) rmSync(CT_DIR, { recursive: true, force: true })
    mkdirSync(CT_DIR, { recursive: true })

    // Start with a stub farewell() that returns empty string (fails the test)
    writeFileSync(CT_GREET, [
      'export function greet(name) {',
      '  return `Hello, ${name}!`;',
      '}',
      '',
      'export function farewell(name) {',
      '  return ""; // stub — will fail the test',
      '}',
    ].join('\n'), 'utf8')

    // Test expects farewell("World") === "Goodbye, World!"
    writeFileSync(CT_TEST, [
      'import { describe, it, expect } from "bun:test"',
      '',
      'describe("greet", () => {',
      '  it("says hello with name", async () => {',
      '    const mod = await import("./greet.js");',
      '    expect(mod.greet("World")).toBe("Hello, World!");',
      '  });',
      '});',
      '',
      'describe("farewell", () => {',
      '  it("says goodbye with name", async () => {',
      '    const mod = await import("./greet.js");',
      '    expect(mod.farewell("World")).toBe("Goodbye, World!");',
      '  });',
      '});',
    ].join('\n'), 'utf8')
  })

  afterAll(() => {
    if (existsSync(CT_DIR)) rmSync(CT_DIR, { recursive: true, force: true })
  })

  it('loops: modify code → run tests (fail) → fix → retest (pass)', async () => {
    // ── Mock responses: a 4-round TDD-like loop ─────────────────

    // Round 1: Explore — read the source and test files
    const explore = [
      '[STATUS: Reading project files to understand the structure]',
      '[READ: greet.js]',
      '[READ: greet.test.js]',
    ].join('\n')

    // Round 2: Write a first attempt that is TOO SIMPLE (fails the test),
    // then run the test suite to verify.
    const buggyWriteAndTest = [
      '[STATUS: Adding farewell() implementation]',
      '[WRITE: greet.js]',
      'export function greet(name) {',
      '  return `Hello, ${name}!`;',
      '}',
      '',
      'export function farewell(name) {',
      '  return "Goodbye!";',
      '}',
      '[RUN: bun test greet.test.js]',
    ].join('\n')

    // Round 3: Tests failed. Re-read the files, fix the implementation,
    // and re-run tests.
    const fixAndRetest = [
      '[STATUS: Test failed — farewell must include the name parameter. Fixing...]',
      '[READ: greet.test.js]',
      '[READ: greet.js]',
      '[EDIT: greet.js]',
      'OLD:   return "Goodbye!";',
      'NEW:   return `Goodbye, ${name}!`;',
      '[RUN: bun test greet.test.js]',
    ].join('\n')

    // Round 4: All tests pass. Complete.
    const allPass = [
      '[STATUS: All tests pass. The farewell() function now correctly includes the name.]',
      '[DONE]',
    ].join('\n')

    let callCount = 0
    const responses = [explore, buggyWriteAndTest, fixAndRetest, allPass]
    const mockInfer = async (opts) => {
      const response = responses[callCount] || '[DONE]'
      callCount++
      console.log(`    [Mock] Round ${callCount}/4 returning ${response.length} chars`)
      return response
    }

    // ── Set up mock ────────────────────────────────────────────
    const { mock } = await import('bun:test')
    mock.module('./inference.js', () => ({ infer: mockInfer }))
    mock.module(resolve(__dirname, 'inference.js'), () => ({ infer: mockInfer }))

    const mod = await import('./auto-agent.js?' + Date.now() + Math.random())
    const { runAutoAgent } = mod

    // ── Run the auto agent ─────────────────────────────────────
    const statuses = []
    const changes = []

    const result = await runAutoAgent({
      prompt: 'Implement the farewell() function in greet.js so that ALL tests pass. The test expects farewell("World") to return "Goodbye, World!". Make sure the function includes the name parameter in the output.',
      model: '__mock__',
      cwd: CT_DIR,
      maxIterations: 10,
      onStatus: (msg) => {
        statuses.push(msg)
        console.log(`    [Status] ${msg.substring(0, 120)}`)
      },
      onChunk: () => {},
    })

    // ── Verify results ─────────────────────────────────────────
    console.log(`\n  Result: success=${result.success}, iterations=${result.totalIterations || result.iteration}, changes=${result.changes.length}`)
    for (const c of result.changes) {
      console.log(`    Change: ${c.type} — ${c.path || c.from || ''}`)
    }

    expect(result.success).toBe(true)
    expect(callCount).toBeGreaterThanOrEqual(3) // At least 3 rounds (explore, buggy, fix)
    expect(result.changes.length).toBeGreaterThanOrEqual(2) // At least write + edit

    // ── Verify the file was correctly updated ──────────────────
    const content = readFileSync(CT_GREET, 'utf8')
    console.log(`\n  Final greet.js (${content.length} chars):`)
    console.log('  ─────────────────────')
    for (const line of content.split('\n')) {
      console.log('  ' + line)
    }

    expect(content).toContain('Goodbye')
    expect(content).toContain('${name}')
    expect(content).not.toContain('return "Goodbye!";')

    // ── Confirm tests actually pass now (real execution) ───────
    const { execSync } = await import('child_process')
    // Verify the test files still exist
    expect(existsSync(CT_TEST)).toBe(true)
    expect(existsSync(CT_GREET)).toBe(true)
    // Final assertion: running bun test exits with code 0 = all pass
    // If any test fails, execSync throws, causing this test to fail
    execSync('bun test greet.test.js --no-color', { cwd: CT_DIR, timeout: 15000, stdio: ['pipe', 'inherit', 'inherit'] })
  }, 60000)
})

// ════════════════════════════════════════════════════════════════════════
// Multi-Tool File Operations — EDIT, APPEND, INSERT, DELETE, RENAME
// ════════════════════════════════════════════════════════════════════════
describe('Multi-Tool File Operations', () => {
  const MT_DIR = resolve(__dirname, '.auto-agent-mt-test')
  const MT_CONFIG = resolve(MT_DIR, 'config.js')
  const MT_HELPERS = resolve(MT_DIR, 'utils', 'helpers.js')
  const MT_DEPRECATED = resolve(MT_DIR, 'deprecated.txt')

  beforeAll(() => {
    if (existsSync(MT_DIR)) rmSync(MT_DIR, { recursive: true, force: true })
    mkdirSync(resolve(MT_DIR, 'utils'), { recursive: true })

    writeFileSync(MT_CONFIG, [
      'const CONFIG = {',
      '  port: 3000,',
      '  debug: false,',
      '};',
      'module.exports = CONFIG;',
    ].join('\n'), 'utf8')

    writeFileSync(MT_HELPERS, [
      'function capitalize(str) {',
      '  return str.charAt(0).toUpperCase() + str.slice(1);',
      '}',
      'function reverse(str) {',
      '  return str.split(\'\').reverse().join(\'\');',
      '}',
      'module.exports = { capitalize, reverse };',
    ].join('\n'), 'utf8')

    writeFileSync(MT_DEPRECATED, [
      'This file is deprecated and will be removed in the next release.',
    ].join('\n'), 'utf8')
  })

  afterAll(() => {
    if (existsSync(MT_DIR)) rmSync(MT_DIR, { recursive: true, force: true })
  })

  it('uses all 5 tools: EDIT, APPEND, INSERT, DELETE, RENAME', async () => {
    // ── Mock responses: 7 rounds covering all tools ────────────

    // Round 1: Explore project structure
    const explore = [
      '[STATUS: Exploring project structure]',
      '[LIST: .]',
      '[LIST: utils]',
      '[READ: config.js]',
      '[READ: utils/helpers.js]',
      '[READ: deprecated.txt]',
    ].join('\n')

    // Round 2: EDIT — change config value
    const editConfig = [
      '[STATUS: Updating server port from 3000 to 8080]',
      '[EDIT: config.js]',
      'OLD:   port: 3000,',
      'NEW:   port: 8080,',
    ].join('\n')

    // Round 3: APPEND — add new config option
    const appendConfig = [
      '[STATUS: Adding host configuration option]',
      '[APPEND: config.js]',
      "    host: 'localhost',",
    ].join('\n')

    // Round 4: INSERT — add a new utility function at a specific line
    const insertFunction = [
      '[STATUS: Adding trim() utility function]',
      '[INSERT: utils/helpers.js | AT: 4]',
      'function trim(str) {',
      '  return str.trim();',
      '}',
    ].join('\n')

    // Round 5: RENAME — rename helpers file
    const renameFile = [
      '[STATUS: Renaming helpers.js to string-utils.js]',
      '[RENAME: utils/helpers.js | TO: utils/string-utils.js]',
    ].join('\n')

    // Round 6: DELETE — remove deprecated file
    const deleteFile = [
      '[STATUS: Cleaning up deprecated file]',
      '[DELETE: deprecated.txt]',
    ].join('\n')

    // Round 7: Verify and complete
    const verifyAndDone = [
      '[STATUS: All 5 operations completed successfully. Verifying...]',
      '[LIST: utils]',
      '[DONE]',
    ].join('\n')

    let callCount = 0
    const responses = [explore, editConfig, appendConfig, insertFunction, renameFile, deleteFile, verifyAndDone]
    const mockInfer = async (opts) => {
      const response = responses[callCount] || '[DONE]'
      callCount++
      console.log(`    [Mock] Round ${callCount}/${responses.length} returning ${response.length} chars`)
      return response
    }

    // ── Set up mock ────────────────────────────────────────────
    const { mock } = await import('bun:test')
    mock.module('./inference.js', () => ({ infer: mockInfer }))
    mock.module(resolve(__dirname, 'inference.js'), () => ({ infer: mockInfer }))

    const mod = await import('./auto-agent.js?' + Date.now() + Math.random())
    const { runAutoAgent } = mod

    // ── Run the auto agent ─────────────────────────────────────
    const statuses = []

    const result = await runAutoAgent({
      prompt: 'Perform several file operations: 1) Change the port in config.js from 3000 to 8080. 2) Append a host config. 3) Insert a trim() function into utils/helpers.js. 4) Rename utils/helpers.js to utils/string-utils.js. 5) Delete deprecated.txt.',
      model: '__mock__',
      cwd: MT_DIR,
      maxIterations: 15,
      onStatus: (msg) => {
        statuses.push(msg)
        console.log(`    [Status] ${msg.substring(0, 120)}`)
      },
      onChunk: () => {},
    })

    // ── Results ────────────────────────────────────────────────
    console.log(`\n  Result: success=${result.success}, iterations=${result.totalIterations || result.iteration}, changes=${result.changes.length}`)
    for (const c of result.changes) {
      console.log(`    Change: ${c.type} — ${c.path || c.from || ''} ${c.to ? '→ ' + c.to : ''}`)
    }

    expect(result.success).toBe(true)
    expect(callCount).toBeGreaterThanOrEqual(6) // At least 6 rounds
    expect(result.changes.length).toBeGreaterThanOrEqual(5) // 5 operations

    // ── Verify EDIT: port changed from 3000 to 8080 ───────────
    const configContent = readFileSync(MT_CONFIG, 'utf8')
    console.log(`\n  Final config.js:\n${configContent}`)
    expect(configContent).toContain('port: 8080')
    expect(configContent).not.toContain('port: 3000')

    // ── Verify APPEND: host config added ──────────────────────
    expect(configContent).toContain("host: 'localhost'")

    // ── Verify INSERT: trim function added at correct position ─
    const newUtilsFile = resolve(MT_DIR, 'utils', 'string-utils.js')
    const helpersExists = existsSync(MT_HELPERS)
    const stringUtilsExists = existsSync(newUtilsFile)
    console.log(`\n  File state:`)
    console.log(`    utils/helpers.js exists: ${helpersExists}`)
    console.log(`    utils/string-utils.js exists: ${stringUtilsExists}`)

    expect(stringUtilsExists).toBe(true) // Renamed file exists
    expect(helpersExists).toBe(false) // Original file gone

    const utilsContent = readFileSync(newUtilsFile, 'utf8')
    console.log(`\n  Final utils/string-utils.js:\n${utilsContent}`)
    expect(utilsContent).toContain('function trim(str)')
    expect(utilsContent).toContain('return str.trim();')
    expect(utilsContent).toContain('function capitalize(str)')
    expect(utilsContent).toContain('function reverse(str)')

    // ── Verify DELETE: deprecated.txt removed ─────────────────
    expect(existsSync(MT_DEPRECATED)).toBe(false)

    // ── Verify helper files unchanged ─────────────────────────
    // The trim function should be inserted at line 4 (before reverse),
    // so line 4 of the file should be the trim function
    const lines = utilsContent.split('\n')
    const trimLineIndex = lines.findIndex(l => l.includes('function trim(str)'))
    expect(trimLineIndex).toBeGreaterThanOrEqual(0)
    // capitalize should come before trim which comes before reverse
    const capIdx = lines.findIndex(l => l.includes('function capitalize'))
    const revIdx = lines.findIndex(l => l.includes('function reverse'))
    expect(capIdx).toBeLessThan(trimLineIndex)
    expect(trimLineIndex).toBeLessThan(revIdx)
  }, 30000)
})

describe('Auto Agent - Error handling', () => {
  it('throws when prompt is missing', async () => {
    const { runAutoAgent } = await import('./auto-agent.js?' + Date.now())
    await expect(runAutoAgent({})).rejects.toThrow('Prompt is required')
  })
})
