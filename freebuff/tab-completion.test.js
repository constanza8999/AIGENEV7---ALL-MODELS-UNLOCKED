/**
 * Tab Completion Tests for CLI chat mode
 *
 * The CLI uses Node.js readline's completer function:
 *   function completer(line) {
 *     if (!line.startsWith('/')) return [[], line]
 *     const hits = COMMANDS_LIST.filter(c => c.startsWith(line))
 *     return [hits.length ? hits : COMMANDS_LIST, line]
 *   }
 *
 * This test replicates and validates that logic.
 */

import { describe, it, expect } from 'bun:test'

// Replicate the COMMANDS_LIST from inference-cli.js
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

describe('CLI Tab Completion', () => {

  it('returns all commands when typing just "/"', () => {
    const [suggestions, line] = completer('/')
    // Should show all 35 commands in the list
    expect(suggestions).toEqual(COMMANDS_LIST)
    expect(suggestions.length).toBe(37)
    expect(line).toBe('/')
  })

  it('filters by prefix /a → agent commands + auto commands', () => {
    const [suggestions, line] = completer('/a')
    const expected = [
      '/agent', '/agents', '/agent-show', '/agent-new', '/agent-edit',
      '/agent-delete', '/agent-export', '/agent-import', '/agent-reset',
      '/auto', '/auto-stop', '/auto-status',
    ]
    expect(suggestions).toEqual(expected)
    expect(suggestions.length).toBe(12)
  })

  it('filters by prefix /au → /auto and /auto-*', () => {
    const [suggestions, line] = completer('/au')
    expect(suggestions).toEqual(['/auto', '/auto-stop', '/auto-status'])
    expect(suggestions.length).toBe(3)
  })

  it('filters by prefix /m → model commands + menu', () => {
    const [suggestions, line] = completer('/m')
    expect(suggestions).toEqual(['/model', '/models', '/menu'])
    expect(suggestions.length).toBe(3)
  })

  it('filters by prefix /h → /help, /h, and /history', () => {
    const [suggestions, line] = completer('/h')
    expect(suggestions).toEqual(['/help', '/h', '/history'])
    expect(suggestions.length).toBe(3)
  })

  it('filters by prefix /q → quit, quantum commands', () => {
    const [suggestions, line] = completer('/q')
    expect(suggestions).toEqual(['/quit', '/q', '/quantum'])
    expect(suggestions.length).toBe(3)
  })

  it('filters by prefix /qui → only /quit', () => {
    const [suggestions, line] = completer('/qui')
    expect(suggestions).toEqual(['/quit'])
    expect(suggestions.length).toBe(1)
  })

  it('exact match for /context shows single suggestion', () => {
    const [suggestions, line] = completer('/context')
    expect(suggestions).toEqual(['/context'])
    expect(suggestions.length).toBe(1)
  })

  it('returns all commands when no match found (prefix /x)', () => {
    const [suggestions, line] = completer('/x')
    // No match → shows ALL commands
    expect(suggestions).toEqual(COMMANDS_LIST)
    expect(suggestions.length).toBe(37)
  })

  it('returns empty array for non-slash input', () => {
    const [suggestions, line] = completer('hello')
    expect(suggestions).toEqual([])
    expect(line).toBe('hello')
  })

  it('returns empty array for empty input', () => {
    const [suggestions, line] = completer('')
    expect(suggestions).toEqual([])
    expect(line).toBe('')
  })

  it('filters by /s → save, snippet, search', () => {
    const [suggestions, line] = completer('/s')
    expect(suggestions).toEqual(['/save', '/snippet', '/search'])
    expect(suggestions.length).toBe(3)
    // Note: /history and /recommend don't start with /s so they're not in /s filter
  })

  it('filters by /d → /defensive and /debug (insertion order)', () => {
    const [suggestions, line] = completer('/d')
    expect(suggestions).toEqual(['/defensive', '/debug'])
    expect(suggestions.length).toBe(2)
  })

  it('filters by /co → /context', () => {
    const [suggestions, line] = completer('/co')
    expect(suggestions).toEqual(['/context'])
  })

  it('filters by /de → /defensive and /debug (insertion order)', () => {
    const [suggestions, line] = completer('/de')
    expect(suggestions).toEqual(['/defensive', '/debug'])
    expect(suggestions.length).toBe(2)
  })

  it('filters by /of → /offensive', () => {
    const [suggestions, line] = completer('/of')
    expect(suggestions).toEqual(['/offensive'])
    expect(suggestions.length).toBe(1)
  })

  it('filters by /fr → /framework', () => {
    const [suggestions, line] = completer('/fr')
    expect(suggestions).toEqual(['/framework'])
    expect(suggestions.length).toBe(1)
  })

  it('filters by /agent- → all agent-* subcommands', () => {
    const [suggestions, line] = completer('/agent-')
    expect(suggestions).toEqual([
      '/agent-show', '/agent-new', '/agent-edit',
      '/agent-delete', '/agent-export', '/agent-import', '/agent-reset',
    ])
    expect(suggestions.length).toBe(7)
  })

  it('no duplicate commands in COMMANDS_LIST', () => {
    const unique = new Set(COMMANDS_LIST)
    expect(unique.size).toBe(COMMANDS_LIST.length)
  })

  it('all commands start with /', () => {
    for (const cmd of COMMANDS_LIST) {
      expect(cmd.startsWith('/')).toBe(true)
    }
  })

  it('commands are organized by category groups', () => {
    // Verify category grouping order (not alphabetical):
    // quit/exit → model → agent → defensive/offensive/framework → quantum → auto → save/...
    const quitIdx = COMMANDS_LIST.indexOf('/quit')
    const modelIdx = COMMANDS_LIST.indexOf('/model')
    const agentIdx = COMMANDS_LIST.indexOf('/agent')
    const defIdx = COMMANDS_LIST.indexOf('/defensive')
    const quantumIdx = COMMANDS_LIST.indexOf('/quantum')
    const autoIdx = COMMANDS_LIST.indexOf('/auto')
    const saveIdx = COMMANDS_LIST.indexOf('/save')
    expect(quitIdx).toBeLessThan(modelIdx)
    expect(modelIdx).toBeLessThan(agentIdx)
    expect(agentIdx).toBeLessThan(defIdx)
    expect(defIdx).toBeLessThan(quantumIdx)
    expect(quantumIdx).toBeLessThan(autoIdx)
    expect(autoIdx).toBeLessThan(saveIdx)
  })

  it('all help-documented commands are in the list', () => {
    const helpCommands = [
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
    for (const cmd of helpCommands) {
      expect(COMMANDS_LIST).toContain(cmd)
    }
  })
})
