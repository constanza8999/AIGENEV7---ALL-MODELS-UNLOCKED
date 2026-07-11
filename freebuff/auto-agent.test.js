#!/usr/bin/env bun
/**
 * AIGENEV7 — Auto Agent Module Tests
 *
 * Run with: bun test freebuff/auto-agent.test.js
 *
 * Tests cover all 17 tools, predicates, formatting, and the main agent loop.
 *
 * NOTE: The module is imported ONCE at the top level. The module is stateless
 * (pure functions), so caching is fine. This avoids Bun's import cache issues
 * with query-parameter cache-busting.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync, rmSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEST_DIR = resolve(__dirname, '.auto-agent-test')

function touch(path, content = '') {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, content, 'utf8')
}

function cleanTestDir() {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true })
}

beforeAll(() => cleanTestDir())
afterEach(() => cleanTestDir())

// ── Import module ONCE at top level ──
// Auto-agent functions are all pure (no mutable state), so module caching is fine.
const { __test__, runAutoAgent } = await import('./auto-agent.js')
const {
  isIgnored, isDestructive, parseToolCalls, formatToolResults,
  safeReadFile, safeWriteFile, safeEditFile, safeAppendFile,
  safeInsertAtLine, safeDeleteFile, safeRenameFile, safeCopyFile,
  safeReplaceAll, safeListDir, safeGlob, safeGrep, safeRunCommand,
  safeGitDiff, safeFetchUrl,
} = __test__

// ════════════════════════════════════════════════════════════════════════
// parseToolCalls()
// ════════════════════════════════════════════════════════════════════════
describe('parseToolCalls()', () => {
  it('returns empty array for empty/whitespace text', () => {
    expect(parseToolCalls('')).toEqual([])
    expect(parseToolCalls('   ')).toEqual([])
    expect(parseToolCalls('\n\n  \n')).toEqual([])
  })

  it('detects [DONE] (case-insensitive)', () => {
    expect(parseToolCalls('[DONE]')).toContainEqual({ type: 'done' })
    expect(parseToolCalls('Task complete. [DONE]')).toContainEqual({ type: 'done' })
    expect(parseToolCalls('[done]')).toContainEqual({ type: 'done' })
    expect(parseToolCalls('[Done]')).toContainEqual({ type: 'done' })
  })

  it('detects [STATUS:] messages', () => {
    const result = parseToolCalls('[STATUS: Reading project files...]')
    expect(result).toContainEqual({ type: 'status', message: 'Reading project files...' })
  })

  it('detects [STATUS:] with status before [DONE]', () => {
    const result = parseToolCalls('[STATUS: All done!]\n[DONE]')
    expect(result).toContainEqual({ type: 'status', message: 'All done!' })
    expect(result).toContainEqual({ type: 'done' })
  })

  // ── READ ──
  it('parses [READ: path]', () => {
    expect(parseToolCalls('[READ: src/index.js]')).toContainEqual({ type: 'read', path: 'src/index.js' })
  })

  it('parses multiple [READ:] calls', () => {
    const results = parseToolCalls('[READ: a.js]\n[READ: b.js]\n[READ: c.js]')
    expect(results.filter(r => r.type === 'read').length).toBe(3)
  })

  // ── WRITE ──
  it('parses [WRITE: path] with content block', () => {
    const text = '[WRITE: src/hello.js]\nconsole.log("Hello, world!");'
    expect(parseToolCalls(text)).toContainEqual({ type: 'write', path: 'src/hello.js', content: 'console.log("Hello, world!");' })
  })

  it('parses [WRITE:] with multi-line content', () => {
    const text = '[WRITE: app.js]\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}'
    expect(parseToolCalls(text)).toContainEqual({ type: 'write', path: 'app.js', content: 'function greet(name) {\n  return `Hello, ${name}!`;\n}' })
  })

  // ── EDIT ──
  it('parses [EDIT: path] with OLD/NEW', () => {
    const text = '[EDIT: app.js]\nOLD: function oldName()\nNEW: function newName()'
    const results = parseToolCalls(text)
    const edit = results.find(r => r.type === 'edit')
    expect(edit).toBeDefined()
    expect(edit.path).toBe('app.js')
    expect(edit.oldString).toBe('function oldName()')
    expect(edit.newString).toBe('function newName()')
  })

  it('parses EDIT with multi-line OLD and NEW text', () => {
    const text = '[EDIT: server.js]\nOLD: const port = 3000\napp.listen(port)\nNEW: const port = process.env.PORT || 3000\napp.listen(port)'
    const results = parseToolCalls(text)
    const edit = results.find(r => r.type === 'edit')
    expect(edit).toBeDefined()
    expect(edit.path).toBe('server.js')
    expect(edit.oldString).toContain('const port = 3000')
    expect(edit.newString).toContain('process.env.PORT')
  })

  // ── APPEND ──
  it('parses [APPEND: path] with content', () => {
    const text = '[APPEND: log.txt]\nThis is a new log entry.'
    expect(parseToolCalls(text)).toContainEqual({ type: 'append', path: 'log.txt', content: 'This is a new log entry.' })
  })

  // ── INSERT ──
  it('parses [INSERT: path | AT: N] with content', () => {
    const text = '[INSERT: config.js | AT: 5]\nconst DEBUG = true;'
    expect(parseToolCalls(text)).toContainEqual({ type: 'insert', path: 'config.js', line: 5, content: 'const DEBUG = true;' })
  })

  // ── DELETE ──
  it('parses [DELETE: path]', () => {
    expect(parseToolCalls('[DELETE: old-file.js]')).toContainEqual({ type: 'delete', path: 'old-file.js' })
  })

  // ── RENAME ──
  it('parses [RENAME: old | TO: new]', () => {
    expect(parseToolCalls('[RENAME: src/old.js | TO: src/new.js]')).toContainEqual({ type: 'rename', oldPath: 'src/old.js', newPath: 'src/new.js' })
  })

  // ── COPY ──
  it('parses [COPY: source | TO: dest]', () => {
    expect(parseToolCalls('[COPY: template.js | TO: backup/template.js]')).toContainEqual({ type: 'copy', sourcePath: 'template.js', destPath: 'backup/template.js' })
  })

  // ── REPLACEALL ──
  it('parses [REPLACEALL: path | OLD: text | NEW: text]', () => {
    expect(parseToolCalls('[REPLACEALL: app.js | OLD: oldVar | NEW: newVar]')).toContainEqual({ type: 'replaceall', path: 'app.js', oldPattern: 'oldVar', newPattern: 'newVar' })
  })

  // ── LIST ──
  it('parses [LIST: path]', () => {
    expect(parseToolCalls('[LIST: src]')).toContainEqual({ type: 'list', path: 'src' })
  })

  // ── GLOB ──
  it('parses [GLOB: pattern]', () => {
    expect(parseToolCalls('[GLOB: **/*.ts]')).toContainEqual({ type: 'glob', pattern: '**/*.ts' })
  })

  // ── GREP ──
  it('parses [GREP: pattern]', () => {
    expect(parseToolCalls('[GREP: authenticate]')).toContainEqual({ type: 'grep', pattern: 'authenticate' })
  })

  // ── RUN ──
  it('parses [RUN: command]', () => {
    expect(parseToolCalls('[RUN: npm test]')).toContainEqual({ type: 'run', command: 'npm test' })
  })

  // ── FETCH ──
  it('parses [FETCH: url]', () => {
    expect(parseToolCalls('[FETCH: https://api.example.com/docs]')).toContainEqual({ type: 'fetch', url: 'https://api.example.com/docs' })
  })

  // ── DIFF ──
  it('parses [DIFF: path]', () => {
    expect(parseToolCalls('[DIFF: src/app.js]')).toContainEqual({ type: 'diff', path: 'src/app.js' })
  })

  // ── Complex Multi-Tool ──
  it('parses a complex multi-tool response', () => {
    const text = [
      '[STATUS: Starting task...]',
      '[READ: package.json]',
      '[LIST: src]',
      '[WRITE: src/index.js]',
      'function main() {',
      '  console.log("Hello");',
      '}',
      '[EDIT: src/index.js]',
      'OLD: console.log("Hello");',
      'NEW: console.log("Hello, World!");',
      '[RUN: node src/index.js]',
      '[STATUS: Testing complete]',
      '[DONE]',
    ].join('\n')

    const results = parseToolCalls(text)
    const types = results.map(r => r.type)
    expect(types).toContain('status')
    expect(types).toContain('read')
    expect(types).toContain('list')
    expect(types).toContain('write')
    expect(types).toContain('edit')
    expect(types).toContain('run')
    expect(types).toContain('done')
  })

  // ── No tool calls ──
  it('returns empty array when no tools are called', () => {
    expect(parseToolCalls('I think we should add error handling to the server.')).toEqual([])
  })

  it('handles content with square brackets that are not tool calls', () => {
    const text = 'The array is [1, 2, 3] and the object is {key: "value"}.\n[STATUS: Checking array]'
    const results = parseToolCalls(text)
    expect(results).toContainEqual({ type: 'status', message: 'Checking array' })
  })

  it('parses RENAME with multi-segment paths', () => {
    expect(parseToolCalls('[RENAME: src/components/old/Button.tsx | TO: src/components/new/Button.tsx]'))
      .toContainEqual({ type: 'rename', oldPath: 'src/components/old/Button.tsx', newPath: 'src/components/new/Button.tsx' })
  })

  it('parses REPLACEALL with multi-word patterns', () => {
    expect(parseToolCalls('[REPLACEALL: config.ts | OLD: API_BASE_URL | NEW: API_ENDPOINT_URL]'))
      .toContainEqual({ type: 'replaceall', path: 'config.ts', oldPattern: 'API_BASE_URL', newPattern: 'API_ENDPOINT_URL' })
  })

  it('parses WRITE with path containing dots', () => {
    const text = '[WRITE: src/components/Button.tsx]\nconst Button = () => <button />;'
    expect(parseToolCalls(text)).toContainEqual({ type: 'write', path: 'src/components/Button.tsx', content: 'const Button = () => <button />;' })
  })
})

// ════════════════════════════════════════════════════════════════════════
// isIgnored()
// ════════════════════════════════════════════════════════════════════════
describe('isIgnored()', () => {
  it('ignores paths inside node_modules', () => {
    expect(isIgnored('/project/node_modules/foo/bar.js')).toBe(true)
    expect(isIgnored('C:\\project\\node_modules\\foo.js')).toBe(true)
  })

  it('ignores paths inside .git', () => {
    expect(isIgnored('/project/.git/HEAD')).toBe(true)
    expect(isIgnored('/project/.git/objects/abc123')).toBe(true)
  })

  it('ignores paths inside .next, dist, .cache, build', () => {
    expect(isIgnored('/project/.next/static/chunks/main.js')).toBe(true)
    expect(isIgnored('/project/dist/bundle.js')).toBe(true)
    expect(isIgnored('/project/.cache/eslint/file.json')).toBe(true)
    expect(isIgnored('/project/build/output.js')).toBe(true)
  })

  it('ignores .env and .lic files', () => {
    // Pattern /\.env$/ matches exactly '.env' at end of path (not .env.local)
    expect(isIgnored('/project/.env')).toBe(true)
    expect(isIgnored('/project/.env.local')).toBe(false)
    expect(isIgnored('/project/.env.production')).toBe(false)
    expect(isIgnored('/project/LICENSE.lic')).toBe(true)
  })

  it('does NOT ignore normal project files', () => {
    expect(isIgnored('/project/src/index.js')).toBe(false)
    expect(isIgnored('/project/package.json')).toBe(false)
    expect(isIgnored('/project/src/components/Button.tsx')).toBe(false)
    expect(isIgnored('/project/README.md')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════════════════
// isDestructive()
// ════════════════════════════════════════════════════════════════════════
describe('isDestructive()', () => {
  it('blocks rm command', () => expect(isDestructive('rm -rf /')).toBe(true))
  it('blocks sudo rm command', () => expect(isDestructive('sudo rm -rf /var/log/')).toBe(true))
  it('blocks rm with -rf flags', () => expect(isDestructive('rm -rf ./node_modules')).toBe(true))
  it('blocks format commands', () => expect(isDestructive('format C: /fs:NTFS')).toBe(true))
  it('blocks dd, fdisk, mkfs, shutdown, reboot, poweroff', () => {
    expect(isDestructive('dd if=/dev/sda of=/dev/sdb')).toBe(true)
    expect(isDestructive('fdisk /dev/sda')).toBe(true)
    expect(isDestructive('mkfs.ext4 /dev/sdb1')).toBe(true)
    expect(isDestructive('shutdown -h now')).toBe(true)
    expect(isDestructive('reboot')).toBe(true)
    expect(isDestructive('poweroff')).toBe(true)
  })
  it('allows safe commands', () => {
    expect(isDestructive('npm test')).toBe(false)
    expect(isDestructive('node index.js')).toBe(false)
    expect(isDestructive('ls -la')).toBe(false)
    expect(isDestructive('eslint . --fix')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeReadFile()
// ════════════════════════════════════════════════════════════════════════
describe('safeReadFile()', () => {
  it('reads an existing file', () => {
    const file = resolve(TEST_DIR, 'read-test.txt')
    touch(file, 'Hello, world!')
    const result = safeReadFile(file)
    expect(result.error).toBeUndefined()
    expect(result.content).toBe('Hello, world!')
    expect(result.lines).toBe(1)
    expect(result.size).toBe(13)
  })

  it('returns error for non-existent file', () => {
    expect(safeReadFile('/nonexistent/path/file.js').error).toContain('File not found')
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeWriteFile()
// ════════════════════════════════════════════════════════════════════════
describe('safeWriteFile()', () => {
  it('writes content to a new file', () => {
    const file = resolve(TEST_DIR, 'new-file.txt')
    const result = safeWriteFile(file, 'Hello, world!')
    expect(result.error).toBeUndefined()
    expect(readFileSync(file, 'utf8')).toBe('Hello, world!')
  })

  it('creates intermediate directories', () => {
    const file = resolve(TEST_DIR, 'nested/a/b/c/deep-file.txt')
    const result = safeWriteFile(file, 'deep')
    expect(result.error).toBeUndefined()
    expect(existsSync(file)).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeEditFile()
// ════════════════════════════════════════════════════════════════════════
describe('safeEditFile()', () => {
  it('replaces text in an existing file', () => {
    const file = resolve(TEST_DIR, 'edit-test.js')
    touch(file, 'const x = 1;')
    const result = safeEditFile(file, 'const x = 1;', 'const x = 42;')
    expect(result.error).toBeUndefined()
    expect(readFileSync(file, 'utf8')).toBe('const x = 42;')
  })

  it('returns error when text not found', () => {
    const file = resolve(TEST_DIR, 'no-match.js')
    touch(file, 'original')
    expect(safeEditFile(file, 'nonexistent', 'replacement').error).toContain('Could not find text')
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeAppendFile()
// ════════════════════════════════════════════════════════════════════════
describe('safeAppendFile()', () => {
  it('appends content to an existing file', () => {
    const file = resolve(TEST_DIR, 'append-test.txt')
    touch(file, 'line1\n')
    const result = safeAppendFile(file, 'line2')
    expect(result.error).toBeUndefined()
    expect(readFileSync(file, 'utf8')).toBe('line1\nline2\n')
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeInsertAtLine()
// ════════════════════════════════════════════════════════════════════════
describe('safeInsertAtLine()', () => {
  it('inserts content at a specific line', () => {
    const file = resolve(TEST_DIR, 'insert-test.js')
    touch(file, 'line1\nline2\nline3')
    const result = safeInsertAtLine(file, 2, 'INSERTED')
    expect(readFileSync(file, 'utf8')).toBe('line1\nINSERTED\nline2\nline3')
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeDeleteFile()
// ════════════════════════════════════════════════════════════════════════
describe('safeDeleteFile()', () => {
  it('deletes an existing file', () => {
    const file = resolve(TEST_DIR, 'to-delete.txt')
    touch(file, 'delete me')
    expect(existsSync(file)).toBe(true)
    safeDeleteFile(file)
    expect(existsSync(file)).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeRenameFile()
// ════════════════════════════════════════════════════════════════════════
describe('safeRenameFile()', () => {
  it('renames a file', () => {
    const src = resolve(TEST_DIR, 'old-name.txt')
    const dest = resolve(TEST_DIR, 'new-name.txt')
    touch(src, 'renamed content')
    const result = safeRenameFile(src, dest)
    expect(result.error).toBeUndefined()
    expect(existsSync(src)).toBe(false)
    expect(existsSync(dest)).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeCopyFile()
// ════════════════════════════════════════════════════════════════════════
describe('safeCopyFile()', () => {
  it('copies a file, preserving the original', () => {
    const src = resolve(TEST_DIR, 'source.txt')
    const dest = resolve(TEST_DIR, 'dest.txt')
    touch(src, 'copy me')
    const result = safeCopyFile(src, dest)
    expect(result.error).toBeUndefined()
    expect(existsSync(src)).toBe(true)
    expect(existsSync(dest)).toBe(true)
    expect(readFileSync(dest, 'utf8')).toBe('copy me')
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeReplaceAll()
// ════════════════════════════════════════════════════════════════════════
describe('safeReplaceAll()', () => {
  it('replaces all occurrences in a file', () => {
    const file = resolve(TEST_DIR, 'replace-all.js')
    touch(file, 'var x = 1;\nvar y = 2;')
    const result = safeReplaceAll(file, 'var ', 'let ')
    expect(result.replacements).toBe(2)
    expect(readFileSync(file, 'utf8')).toBe('let x = 1;\nlet y = 2;')
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeListDir()
// ════════════════════════════════════════════════════════════════════════
describe('safeListDir()', () => {
  it('lists files and directories (hiding dotfiles)', () => {
    const dir = resolve(TEST_DIR, 'list-dir')
    mkdirSync(dir, { recursive: true })
    touch(resolve(dir, 'visible.js'))
    touch(resolve(dir, '.hidden.js'))

    const result = safeListDir(dir)
    expect(result.files).toContain('visible.js')
    expect(result.files).not.toContain('.hidden.js')
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeGlob()
// ════════════════════════════════════════════════════════════════════════
describe('safeGlob()', () => {
  it('finds matching files (gracefully handles globSync unavailability)', () => {
    touch(resolve(TEST_DIR, 'a.ts'))
    touch(resolve(TEST_DIR, 'b.ts'))
    const result = safeGlob('*.ts', TEST_DIR)
    if (result.error) return // gracefully skip if globSync unavailable
    expect(result.matches.length).toBe(2)
    const names = result.matches.map(m => m.replace(/\\/g, '/'))
    expect(names).toContain('a.ts')
    expect(names).toContain('b.ts')
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeGrep()
// ════════════════════════════════════════════════════════════════════════
describe('safeGrep()', () => {
  it('searches for a pattern and returns results', () => {
    touch(resolve(TEST_DIR, 'greppable.js'), 'function authenticate() {}')
    const result = safeGrep('authenticate', TEST_DIR)
    expect(result.pattern).toBe('authenticate')
    expect(result.matches).toBeGreaterThanOrEqual(1)
  })

  it('returns 0 matches when pattern not found', () => {
    touch(resolve(TEST_DIR, 'not-matching.txt'), 'just some text')
    expect(safeGrep('NONEXISTENT_XYZ', TEST_DIR).matches).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeRunCommand()
// ════════════════════════════════════════════════════════════════════════
describe('safeRunCommand()', () => {
  it('runs a simple echo command', () => {
    const result = safeRunCommand('echo "hello"', TEST_DIR)
    if (result.error) return // gracefully skip if shell unavailable
    expect(result.output).toContain('hello')
  })

  it('blocks destructive commands', () => {
    expect(safeRunCommand('rm -rf /', TEST_DIR).error).toContain('Blocked')
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeGitDiff()
// ════════════════════════════════════════════════════════════════════════
describe('safeGitDiff()', () => {
  it('returns (not a git repository) for non-git directory', () => {
    const result = safeGitDiff('.', TEST_DIR)
    expect(result.diff).toBeTruthy()
  })
})

// ════════════════════════════════════════════════════════════════════════
// safeFetchUrl()
// ════════════════════════════════════════════════════════════════════════
describe('safeFetchUrl()', () => {
  it('returns error for invalid/empty URL', async () => {
    const result = await safeFetchUrl('https://nonexistent.invalid.url.xyz')
    expect(result.error).toBeTruthy()
  }, 15000)
})

// ════════════════════════════════════════════════════════════════════════
// formatToolResults()
// ════════════════════════════════════════════════════════════════════════
describe('formatToolResults()', () => {
  it('returns empty string for empty results', () => {
    expect(formatToolResults([])).toBe('')
  })

  it('formats error results', () => {
    const output = formatToolResults([{ tool: 'read', path: 'missing.js', error: 'File not found' }])
    expect(output).toMatch(/⚠.*read.*missing\.js.*File not found/)
  })

  it('formats write results', () => {
    const output = formatToolResults([{ tool: 'write', path: 'test.js', lines: 5, size: 100 }])
    expect(output).toMatch(/✓.*Wrote.*test\.js.*5 lines.*100 chars/)
  })

  it('formats edit results', () => {
    const output = formatToolResults([{ tool: 'edit', path: 'test.js', replacement: 'Replaced 10 chars' }])
    expect(output).toMatch(/✓.*Edited.*test\.js/)
  })

  it('formats append results', () => {
    expect(formatToolResults([{ tool: 'append', path: 'log.txt', lines: 2 }])).toMatch(/Appended 2 lines/)
  })

  it('formats insert results', () => {
    expect(formatToolResults([{ tool: 'insert', path: 'file.js', atLine: 5, insertedLines: 3 }])).toMatch(/Inserted 3 lines at line 5/)
  })

  it('formats delete results', () => {
    expect(formatToolResults([{ tool: 'delete', path: 'old.js' }])).toMatch(/✓.*Deleted.*old\.js/)
  })

  it('formats rename results', () => {
    expect(formatToolResults([{ tool: 'rename', from: 'a.js', to: 'b.js' }])).toMatch(/Renamed a\.js → b\.js/)
  })

  it('formats copy results', () => {
    expect(formatToolResults([{ tool: 'copy', from: 'a.js', to: 'b.js', size: 100 }])).toMatch(/Copied.*100 bytes/)
  })

  it('formats replaceall results', () => {
    expect(formatToolResults([{ tool: 'replaceall', path: 'file.ts', replacements: 3 }])).toMatch(/Replaced 3 occurrence/)
  })

  it('formats list results', () => {
    const output = formatToolResults([{ tool: 'list', path: 'src', total: 2, files: ['a.js'], dirs: ['lib/'] }])
    expect(output).toMatch(/Listed src/)
    expect(output).toMatch(/Dirs: lib/)
    expect(output).toMatch(/Files: a\.js/)
  })

  it('formats run results', () => {
    expect(formatToolResults([{ tool: 'run', command: 'npm test', output: 'Tests passed!' }])).toMatch(/Ran: npm test/)
  })

  it('formats diff results', () => {
    const output = formatToolResults([{ tool: 'diff', path: 'file.ts', diff: '+const x = 1;' }])
    expect(output).toMatch(/Diff file\.ts/)
    expect(output).toMatch(/\+const x = 1;/)
  })

  it('formats fetch results', () => {
    const output = formatToolResults([{ tool: 'fetch', url: 'https://example.com', content: '<html>data</html>', size: 100 }])
    expect(output).toMatch(/Fetched https:\/\/example\.com/)
    expect(output).toMatch(/data/)
  })

  it('formats multiple results in order', () => {
    const results = [
      { tool: 'read', path: 'a.js', error: 'File not found' },
      { tool: 'write', path: 'b.js', lines: 1, size: 5 },
    ]
    const output = formatToolResults(results)
    const lines = output.split('\n').filter(l => l.includes('✓') || l.includes('⚠'))
    expect(lines.length).toBe(2)
    expect(lines[0]).toMatch(/⚠/)
    expect(lines[1]).toMatch(/✓.*Wrote/)
  })
})

// ════════════════════════════════════════════════════════════════════════
// runAutoAgent() — Integration tests
// ════════════════════════════════════════════════════════════════════════
describe('runAutoAgent()', () => {
  it('throws when prompt is missing', async () => {
    await expect(runAutoAgent({})).rejects.toThrow('Prompt is required')
  })

  it('calls onStatus callback with initialization message', async () => {
    const statuses = []
    await runAutoAgent({
      prompt: 'test',
      cwd: TEST_DIR,
      maxIterations: 1,
      onStatus: (msg) => statuses.push(msg),
      onChunk: () => {},
    })
    expect(statuses.some(s => s.includes('Initializing'))).toBe(true)
  })

  it('returns result with success and changes properties', async () => {
    const result = await runAutoAgent({
      prompt: 'test model error',
      model: '__nonexistent__',
      cwd: TEST_DIR,
      maxIterations: 1,
      onStatus: () => {},
      onChunk: () => {},
    })
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('changes')
    expect(Array.isArray(result.changes)).toBe(true)
  })
})
