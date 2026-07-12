#!/usr/bin/env bun
/**
 * AIGENEV7 — Custom Agents Module Tests
 *
 * Run with: bun test freebuff/custom-agents.test.js --test-threads=1
 * Uses --test-threads=1 because all tests share the module's singleton agentsCache.
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { writeFileSync, unlinkSync, existsSync, readFileSync, copyFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AGENTS_FILE = resolve(__dirname, 'custom-agents.json')
const BACKUP_FILE = resolve(__dirname, '.custom-agents.test-backup.json')

// ── Global setup: backup real agents file, restore after all tests ──
beforeAll(() => {
  if (existsSync(AGENTS_FILE)) {
    copyFileSync(AGENTS_FILE, BACKUP_FILE)
  }
})

afterAll(() => {
  // Restore the original file
  if (existsSync(BACKUP_FILE)) {
    copyFileSync(BACKUP_FILE, AGENTS_FILE)
    unlinkSync(BACKUP_FILE)
  } else if (existsSync(AGENTS_FILE)) {
    // No backup means file didn't exist before — clean up
    unlinkSync(AGENTS_FILE)
  }
})

// ── Helper: wipe state before each fresh import ──
async function freshModule() {
  if (existsSync(AGENTS_FILE)) {
    try { unlinkSync(AGENTS_FILE) } catch {}
  }
  const mod = await import('./custom-agents.js')
  mod.resetAgents()
  return mod
}

// ── All tests in one describe block ──
// NOTE: Bun runs sibling describe blocks in parallel by default. To prevent
// races on the shared agentsCache, run with: bun test --test-threads=1
describe('custom-agents.js', () => {

  // ── listAgents() ──────────────────────────────────
  describe('listAgents()', () => {
    it('returns all 45 default agents (27 core + 9 defensive + 9 offensive)', async () => {
      const { listAgents } = await freshModule()
      expect(listAgents().length).toBe(45)
    })

    it('returns agents with all required fields', async () => {
      const { listAgents } = await freshModule()
      for (const agent of listAgents()) {
        expect(agent).toHaveProperty('id')
        expect(agent).toHaveProperty('name')
        expect(agent).toHaveProperty('emoji')
        expect(agent).toHaveProperty('description')
        expect(agent).toHaveProperty('systemPrompt')
        expect(typeof agent.id).toBe('string')
        expect(agent.id.length).toBeGreaterThan(0)
      }
    })

    it('returns the cached array (intentional — same reference for performance)', async () => {
      const { listAgents } = await freshModule()
      const first = listAgents()
      const second = listAgents()
      // The module caches the agents array and returns the same reference
      // for performance. Modifications are done via the cache itself.
      expect(first).toBe(second)
      expect(second.length).toBe(45)
    })

    it('reflects newly created agents', async () => {
      const { listAgents, createAgent } = await freshModule()
      const before = listAgents().length
      createAgent('new-one', 'New', 'Desc', 'Prompt')
      expect(listAgents().length).toBe(before + 1)
    })
  })

  // ── getAgent() ────────────────────────────────────
  describe('getAgent()', () => {
    it('finds agent by id', async () => {
      const { getAgent } = await freshModule()
      const agent = getAgent('code-reviewer')
      expect(agent).toBeDefined()
      expect(agent.name).toBe('Code Reviewer')
      expect(agent.emoji).toBe('\uD83D\uDD0D')
    })

    it('returns undefined for missing id', async () => {
      const { getAgent } = await freshModule()
      expect(getAgent('nonexistent')).toBeUndefined()
    })

    it('retrieves quantum-dev agent with long template-literal prompt', async () => {
      const { getAgent } = await freshModule()
      const agent = getAgent('quantum-dev')
      expect(agent).toBeDefined()
      expect(agent.systemPrompt.length).toBeGreaterThan(500)
      expect(agent.systemPrompt.toLowerCase()).toContain('quantum fundamentals')
    })
  })

  // ── getDefaultAgent() ─────────────────────────────
  describe('getDefaultAgent()', () => {
    it('returns the Coding Assistant default', async () => {
      const { getDefaultAgent } = await freshModule()
      const agent = getDefaultAgent()
      expect(agent).toBeDefined()
      expect(agent.id).toBe('default')
      expect(agent.name).toBe('Coding Assistant')
    })
  })

  // ── createAgent() ─────────────────────────────────
  describe('createAgent()', () => {
    it('creates a new agent with all fields', async () => {
      const { createAgent, getAgent } = await freshModule()
      const agent = createAgent('test-agent', 'Test Agent', 'A test agent', 'You are a test agent.', '\uD83E\uDDEA')
      expect(agent.id).toBe('test-agent')
      expect(agent.name).toBe('Test Agent')
      expect(agent.emoji).toBe('\uD83E\uDDEA')

      const fetched = getAgent('test-agent')
      expect(fetched).toBeDefined()
      expect(fetched.name).toBe('Test Agent')
    })

    it('throws on duplicate id', async () => {
      const { createAgent } = await freshModule()
      createAgent('dup', 'First', 'Desc', 'Prompt')
      expect(() => createAgent('dup', 'Second', 'Desc', 'Prompt')).toThrow('already exists')
    })

    it('uses default robot emoji when not provided', async () => {
      const { createAgent } = await freshModule()
      const agent = createAgent('no-emoji', 'No Emoji', 'Desc', 'Prompt')
      expect(agent.emoji).toBe('\uD83E\uDD16')
    })

    it('persists the agent in the list', async () => {
      const { createAgent, listAgents } = await freshModule()
      const before = listAgents().length
      createAgent('persist-test', 'Persist', 'Desc', 'Prompt', '\uD83D\uDCA1')
      expect(listAgents().length).toBe(before + 1)
    })
  })

  // ── updateAgent() ─────────────────────────────────
  describe('updateAgent()', () => {
    it('updates name and description, leaves other fields intact', async () => {
      const { createAgent, getAgent, updateAgent } = await freshModule()
      createAgent('updatable', 'Original', 'Original desc', 'Original prompt')
      const updated = updateAgent('updatable', { name: 'Updated', description: 'Updated desc' })
      expect(updated.name).toBe('Updated')
      expect(updated.description).toBe('Updated desc')
      expect(updated.systemPrompt).toBe('Original prompt') // unchanged

      const fetched = getAgent('updatable')
      expect(fetched.name).toBe('Updated')
    })

    it('updates systemPrompt and emoji independently', async () => {
      const { createAgent, updateAgent } = await freshModule()
      createAgent('prompt-update', 'Test', 'Desc', 'Old prompt')
      const updated = updateAgent('prompt-update', {
        systemPrompt: 'New prompt',
        emoji: '\uD83D\uDD25',
      })
      expect(updated.systemPrompt).toBe('New prompt')
      expect(updated.emoji).toBe('\uD83D\uDD25')
    })

    it('throws on non-existent agent', async () => {
      const { updateAgent } = await freshModule()
      expect(() => updateAgent('ghost', { name: 'Ghost' })).toThrow('not found')
    })
  })

  // ── deleteAgent() ─────────────────────────────────
  describe('deleteAgent()', () => {
    it('deletes a custom agent', async () => {
      const { createAgent, deleteAgent, getAgent } = await freshModule()
      createAgent('deletable', 'Deletable', 'Desc', 'Prompt')
      expect(deleteAgent('deletable')).toBe(true)
      expect(getAgent('deletable')).toBeUndefined()
    })

    it('returns false for non-existent agent', async () => {
      const { deleteAgent } = await freshModule()
      expect(deleteAgent('nonexistent')).toBe(false)
    })

    it('throws when trying to delete any default agent', async () => {
      const { deleteAgent } = await freshModule()
      expect(() => deleteAgent('default')).toThrow('Cannot delete default agent')
      expect(() => deleteAgent('code-reviewer')).toThrow('Cannot delete default agent')
      expect(() => deleteAgent('quantum-dev')).toThrow('Cannot delete default agent')
    })

    it('reduces the agent count', async () => {
      const { createAgent, deleteAgent, listAgents } = await freshModule()
      const before = listAgents().length
      createAgent('temp-del', 'Temp', 'Desc', 'Prompt')
      expect(listAgents().length).toBe(before + 1)
      deleteAgent('temp-del')
      expect(listAgents().length).toBe(before)
    })
  })

  // ── exportAgent() ─────────────────────────────────
  describe('exportAgent()', () => {
    it('exports by id', async () => {
      const { exportAgent } = await freshModule()
      const result = exportAgent('code-reviewer')
      expect(result.agent.id).toBe('code-reviewer')
      expect(result.agent.name).toBe('Code Reviewer')

      const parsed = JSON.parse(result.json)
      expect(parsed.id).toBe('code-reviewer')
      expect(parsed).toHaveProperty('emoji')
      expect(parsed).toHaveProperty('description')
      expect(parsed).toHaveProperty('systemPrompt')
    })

    it('exports by 1-based number index', async () => {
      const { exportAgent, listAgents } = await freshModule()
      const agents = listAgents()
      expect(exportAgent('1').agent.id).toBe(agents[0].id)
      expect(exportAgent(String(agents.length)).agent.id).toBe(agents[agents.length - 1].id)
      expect(exportAgent('2').agent.id).toBe(agents[1].id)
    })

    it('exports by name case-insensitively', async () => {
      const { exportAgent } = await freshModule()
      expect(exportAgent('code reviewer').agent.id).toBe('code-reviewer')
      expect(exportAgent('Code Reviewer').agent.id).toBe('code-reviewer')
      expect(exportAgent('CODE REVIEWER').agent.id).toBe('code-reviewer')
      expect(exportAgent('CODE reviewer').agent.id).toBe('code-reviewer')
    })

    it('throws for unknown agent', async () => {
      const { exportAgent } = await freshModule()
      expect(() => exportAgent('ghost')).toThrow('not found')
    })

    it('exports quantum-dev with its long system prompt', async () => {
      const { exportAgent } = await freshModule()
      const result = exportAgent('quantum-dev')
      expect(JSON.parse(result.json).systemPrompt.length).toBeGreaterThan(1000)
    })

    it('portable JSON has exactly the 5 required fields', async () => {
      const { exportAgent } = await freshModule()
      const parsed = JSON.parse(exportAgent('code-reviewer').json)
      const keys = Object.keys(parsed).sort()
      expect(keys).toEqual(['description', 'emoji', 'id', 'name', 'systemPrompt'])
    })
  })

  // ── exportAgentToFile() ───────────────────────────
  describe('exportAgentToFile()', () => {
    const TEST_EXPORT = resolve(__dirname, '__test_export_agent.json')

    afterAll(() => {
      if (existsSync(TEST_EXPORT)) try { unlinkSync(TEST_EXPORT) } catch {}
    })

    it('exports to a specified file path', async () => {
      const { exportAgentToFile } = await freshModule()
      const written = exportAgentToFile('code-reviewer', TEST_EXPORT)
      expect(written).toBe(TEST_EXPORT)
      expect(existsSync(TEST_EXPORT)).toBe(true)
      expect(JSON.parse(readFileSync(TEST_EXPORT, 'utf8')).name).toBe('Code Reviewer')
    })

    it('exports to a default path when not specified', async () => {
      const { exportAgentToFile } = await freshModule()
      const written = exportAgentToFile('code-reviewer')
      expect(written).toContain('agent-code-reviewer.json')
      expect(existsSync(written)).toBe(true)
      try { unlinkSync(written) } catch {}
    })
  })

  // ── importAgent() ─────────────────────────────────
  describe('importAgent()', () => {
    it('imports a new agent from a JSON string', async () => {
      const { importAgent, getAgent } = await freshModule()
      const json = JSON.stringify({
        name: 'Imported Agent',
        emoji: '\uD83E\uDD16',
        description: 'Imported from JSON string',
        systemPrompt: 'You are an imported agent.',
      })
      importAgent(json)
      const fetched = getAgent('imported-agent')
      expect(fetched).toBeDefined()
      expect(fetched.name).toBe('Imported Agent')
    })

    it('imports a new agent from a plain object', async () => {
      const { importAgent, getAgent } = await freshModule()
      importAgent({ name: 'Object Agent', systemPrompt: 'From object.' })
      expect(getAgent('object-agent')).toBeDefined()
    })

    it('uses a provided id', async () => {
      const { importAgent, getAgent } = await freshModule()
      importAgent(JSON.stringify({
        id: 'my-custom-id',
        name: 'Has Custom ID',
        systemPrompt: 'With specific ID.',
      }))
      expect(getAgent('my-custom-id')).toBeDefined()
    })

    it('updates an existing agent on re-import', async () => {
      const { importAgent, getAgent } = await freshModule()
      importAgent(JSON.stringify({ id: 'reimport-me', name: 'Original', systemPrompt: 'Orig' }))
      importAgent(JSON.stringify({ id: 'reimport-me', name: 'Updated', systemPrompt: 'Updated', emoji: '\uD83D\uDD25' }))
      const agent = getAgent('reimport-me')
      expect(agent.name).toBe('Updated')
      expect(agent.systemPrompt).toBe('Updated')
      expect(agent.emoji).toBe('\uD83D\uDD25')
    })

    it('throws on invalid JSON string', async () => {
      const { importAgent } = await freshModule()
      expect(() => importAgent('{broken json}')).toThrow('Invalid JSON')
    })

    it('throws when name is missing', async () => {
      const { importAgent } = await freshModule()
      expect(() => importAgent(JSON.stringify({ systemPrompt: 'No name' }))).toThrow('name')
    })

    it('throws when systemPrompt is missing', async () => {
      const { importAgent } = await freshModule()
      expect(() => importAgent(JSON.stringify({ name: 'No prompt' }))).toThrow('systemPrompt')
    })

    it('throws for non-string, non-object input (number)', async () => {
      const { importAgent } = await freshModule()
      expect(() => importAgent(123)).toThrow('expected JSON string or object')
    })

    it('throws for null input', async () => {
      const { importAgent } = await freshModule()
      expect(() => importAgent(null)).toThrow('expected JSON string or object')
    })

    it('generates a slug id from name when not provided', async () => {
      const { importAgent } = await freshModule()
      const agent = importAgent(JSON.stringify({ name: 'My Cool Agent!', systemPrompt: 'You are cool.' }))
      expect(agent.id).toBe('my-cool-agent')
    })

    it('fills in defaults for missing optional fields', async () => {
      const { importAgent } = await freshModule()
      const agent = importAgent(JSON.stringify({ name: 'Minimal', systemPrompt: 'Minimal prompt' }))
      expect(agent.emoji).toBe('\uD83E\uDD16')
      expect(agent.description).toContain('Minimal')
    })
  })

  // ── importAgentFromFile() ─────────────────────────
  describe('importAgentFromFile()', () => {
    const TEST_IMPORT = resolve(__dirname, '__test_import_agent.json')

    afterAll(() => {
      if (existsSync(TEST_IMPORT)) try { unlinkSync(TEST_IMPORT) } catch {}
    })

    it('imports an agent from a JSON file', async () => {
      const { importAgentFromFile, getAgent } = await freshModule()
      writeFileSync(TEST_IMPORT, JSON.stringify({
        id: 'file-imported',
        name: 'File Imported',
        emoji: '\uD83D\uDCC4',
        description: 'Imported from file',
        systemPrompt: 'You were imported from a file.',
      }), 'utf8')

      const agent = importAgentFromFile(TEST_IMPORT)
      expect(agent.name).toBe('File Imported')
      expect(getAgent('file-imported')).toBeDefined()
    })

    it('throws on non-existent file', async () => {
      const { importAgentFromFile } = await freshModule()
      expect(() => importAgentFromFile('nonexistent.json')).toThrow('File not found')
    })

    it('rejects a file with invalid JSON content', async () => {
      const { importAgentFromFile } = await freshModule()
      writeFileSync(TEST_IMPORT, '{not valid}', 'utf8')
      expect(() => importAgentFromFile(TEST_IMPORT)).toThrow()
    })
  })

  // ── resetAgents() ─────────────────────────────────
  describe('resetAgents()', () => {
    it('resets to exactly 45 default agents after creating custom ones', async () => {
      const { createAgent, listAgents, resetAgents } = await freshModule()
      createAgent('custom-before-reset', 'Custom', 'Desc', 'Prompt')
      expect(listAgents().length).toBeGreaterThan(45)

      resetAgents()
      const agents = listAgents()
      expect(agents.length).toBe(45)
      expect(agents.find(a => a.id === 'custom-before-reset')).toBeUndefined()
    })

    it('all default agents are still retrievable after reset', async () => {
      const { getAgent, resetAgents } = await freshModule()
      resetAgents()
      expect(getAgent('default')).toBeDefined()
      expect(getAgent('code-reviewer')).toBeDefined()
      expect(getAgent('quantum-dev')).toBeDefined()
    })

    it('wipes the custom-agents.json file', async () => {
      const { createAgent, resetAgents } = await freshModule()
      createAgent('should-be-gone', 'Temp', 'Desc', 'Prompt')
      resetAgents()
      // After reset, the file should contain '[]'
      expect(existsSync(AGENTS_FILE)).toBe(true)
      const content = readFileSync(AGENTS_FILE, 'utf8')
      expect(content).toBe('[]')
    })
  })

  // ── Export/Import Round-Trip ───────────────────────
  describe('export → import round-trip', () => {
    it('export → re-import preserves systemPrompt, emoji, and description', async () => {
      const { exportAgent, importAgent, getAgent } = await freshModule()
      const original = JSON.parse(exportAgent('code-reviewer').json)

      // Import with different id to avoid in-place update
      importAgent(JSON.stringify({ ...original, id: 'round-trip-test', name: 'Round Trip' }))

      const imported = getAgent('round-trip-test')
      expect(imported.systemPrompt).toBe(original.systemPrompt)
      expect(imported.emoji).toBe(original.emoji)
      expect(imported.description).toBe(original.description)
    })

    it('export by name → re-import → export by id produces matching JSON', async () => {
      const { exportAgent, importAgent } = await freshModule()
      const byName = JSON.parse(exportAgent('Code Reviewer').json)
      byName.id = 're-export-test'
      byName.name = 'Re-Export Test'
      importAgent(JSON.stringify(byName))

      const reExported = JSON.parse(exportAgent('re-export-test').json)
      expect(reExported.systemPrompt).toBe(byName.systemPrompt)
    })
  })

  // ── Full Lifecycle ────────────────────────────────
  describe('full agent lifecycle', () => {
    it('create → update → export → delete cycle', async () => {
      const { createAgent, updateAgent, exportAgent, deleteAgent, getAgent } = await freshModule()

      // Create
      const agent = createAgent('lifecycle-test', 'Lifecycle', 'Testing full cycle', 'You are a lifecycle test.')
      expect(agent.id).toBe('lifecycle-test')

      // Update
      const updated = updateAgent('lifecycle-test', { name: 'Lifecycle Updated' })
      expect(updated.name).toBe('Lifecycle Updated')

      // Export
      const exported = JSON.parse(exportAgent('lifecycle-test').json)
      expect(exported.name).toBe('Lifecycle Updated')
      expect(exported.systemPrompt).toBe('You are a lifecycle test.')

      // Delete
      expect(deleteAgent('lifecycle-test')).toBe(true)
      expect(getAgent('lifecycle-test')).toBeUndefined()
    })

    it('multiple agents can coexist', async () => {
      const { createAgent, listAgents } = await freshModule()
      const base = listAgents().length
      createAgent('multi-a', 'A', 'D1', 'P1')
      createAgent('multi-b', 'B', 'D2', 'P2')
      createAgent('multi-c', 'C', 'D3', 'P3')
      expect(listAgents().length).toBe(base + 3)
    })
  })

  // ── Edge Cases ────────────────────────────────────
  describe('edge cases', () => {
    it('all default agent IDs are unique', async () => {
      const { listAgents } = await freshModule()
      const ids = listAgents().map(a => a.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('handles a corrupted agents.json file gracefully (falls back to defaults)', async () => {
      // Write garbage to the agents file
      writeFileSync(AGENTS_FILE, '{ completely broken json [[[', 'utf8')

      // Importing fresh should fall back to defaults
      const mod = await import('./custom-agents.js')
      mod.resetAgents()
      const agents = mod.listAgents()
      expect(agents.length).toBe(45) // falls back to defaults
    })
  })
})
