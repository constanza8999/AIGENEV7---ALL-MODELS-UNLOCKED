#!/usr/bin/env bun

/**
 * AIGENEV7 Snippet Manager
 * ─────────────────────────
 * Save, load, list, and delete reusable code snippets.
 * Snippets are stored in freebuff/snippets.json
 *
 * Usage:
 *   import { saveSnippet, getSnippet, listSnippets, deleteSnippet } from './snippets.js'
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SNIPPETS_FILE = resolve(__dirname, 'snippets.json')

// ── In-memory cache ──
let snippetsCache = null

function loadSnippets() {
  if (snippetsCache) return snippetsCache
  try {
    if (existsSync(SNIPPETS_FILE)) {
      const raw = readFileSync(SNIPPETS_FILE, 'utf8')
      snippetsCache = JSON.parse(raw)
      return snippetsCache
    }
  } catch (err) {
    console.warn(`[AIGENEV7] Warning: Could not load snippets.json: ${err.message}`)
  }
  snippetsCache = []
  return snippetsCache
}

function saveSnippets(snippets) {
  try {
    writeFileSync(SNIPPETS_FILE, JSON.stringify(snippets, null, 2), 'utf8')
  } catch (err) {
    console.warn(`[AIGENEV7] Warning: Could not save snippets.json: ${err.message}`)
  }
}

/**
 * Save a code snippet.
 * @param {string} name - Short identifier for the snippet
 * @param {string} code - The code content
 * @param {string} language - Programming language (e.g. 'js', 'python', 'go')
 * @param {string} description - Optional description
 * @param {string[]} tags - Optional tags
 * @returns {object} The saved snippet
 */
export function saveSnippet(name, code, language = '', description = '', tags = []) {
  const snippets = loadSnippets()
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const existing = snippets.findIndex(s => s.id === id)
  const snippet = {
    id,
    name,
    code,
    language,
    description,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  if (existing >= 0) {
    snippet.createdAt = snippets[existing].createdAt
    snippets[existing] = snippet
  } else {
    snippets.push(snippet)
  }
  snippetsCache = snippets
  saveSnippets(snippets)
  return snippet
}

/**
 * Get a snippet by ID or name.
 * @param {string} idOrName
 * @returns {object|undefined}
 */
export function getSnippet(idOrName) {
  const snippets = loadSnippets()
  return snippets.find(s => s.id === idOrName || s.name.toLowerCase() === idOrName.toLowerCase())
}

/**
 * List all snippets, optionally filtered by tag or language.
 * @param {object} filters - { tag?, language?, search? }
 * @returns {Array}
 */
export function listSnippets(filters = {}) {
  let snippets = loadSnippets()
  if (filters.tag) {
    snippets = snippets.filter(s => s.tags.includes(filters.tag))
  }
  if (filters.language) {
    snippets = snippets.filter(s => s.language === filters.language)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    snippets = snippets.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q)
    )
  }
  return snippets
}

/**
 * Delete a snippet by ID or name.
 * @param {string} idOrName
 * @returns {boolean}
 */
export function deleteSnippet(idOrName) {
  const snippets = loadSnippets()
  const idx = snippets.findIndex(s => s.id === idOrName || s.name.toLowerCase() === idOrName.toLowerCase())
  if (idx < 0) return false
  snippets.splice(idx, 1)
  snippetsCache = snippets
  saveSnippets(snippets)
  return true
}

/**
 * Search snippets by text query.
 * @param {string} query
 * @returns {Array}
 */
export function searchSnippets(query) {
  return listSnippets({ search: query })
}

// ── Export / Import ──────────────────────────────────────────────────────

/**
 * Export a snippet to a portable JSON string.
 * @param {string} idOrName
 * @returns {{ snippet: object, json: string }}
 */
export function exportSnippet(idOrName) {
  const snippet = getSnippet(idOrName)
  if (!snippet) throw new Error(`Snippet "${idOrName}" not found`)
  const portable = {
    id: snippet.id,
    name: snippet.name,
    code: snippet.code,
    language: snippet.language,
    description: snippet.description,
    tags: snippet.tags,
  }
  return {
    snippet: portable,
    json: JSON.stringify(portable, null, 2),
  }
}

/**
 * Export a snippet to a JSON file.
 * @param {string} idOrName
 * @param {string} filePath - File path (defaults to snippet-<name>.json)
 * @returns {string} The path written to
 */
export function exportSnippetToFile(idOrName, filePath) {
  const { snippet, json } = exportSnippet(idOrName)
  if (!filePath) {
    const sanitizedName = snippet.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    filePath = resolve(process.cwd(), `snippet-${sanitizedName}.json`)
  }
  writeFileSync(filePath, json, 'utf8')
  return filePath
}

/**
 * Import a snippet from a JSON string or object.
 * Creates or updates the snippet.
 * @param {string|object} input
 * @returns {object} The imported snippet
 */
export function importSnippet(input) {
  let data
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input)
    } catch {
      throw new Error('Invalid JSON. Use format: {"name":"...","code":"..."}')
    }
  } else if (typeof input === 'object' && input !== null) {
    data = input
  } else {
    throw new Error('Invalid input: expected JSON string or object')
  }

  if (!data.name || !data.code) {
    throw new Error('Snippet must have at least "name" and "code" fields')
  }

  return saveSnippet(
    data.name,
    data.code,
    data.language || '',
    data.description || `Imported snippet: ${data.name}`,
    data.tags || [],
  )
}

/**
 * Import a snippet from a JSON file.
 * @param {string} filePath
 * @returns {object} The imported snippet
 */
export function importSnippetFromFile(filePath) {
  const resolvedPath = resolve(process.cwd(), filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  const raw = readFileSync(resolvedPath, 'utf8')
  return importSnippet(raw)
}

/**
 * Export all snippets to a single JSON file.
 * @param {string} filePath
 * @returns {string} The path written to
 */
export function exportAllSnippets(filePath) {
  const snippets = loadSnippets()
  if (!filePath) {
    filePath = resolve(process.cwd(), 'snippets-export.json')
  }
  writeFileSync(filePath, JSON.stringify(snippets, null, 2), 'utf8')
  return filePath
}

/**
 * Import multiple snippets from a JSON array file.
 * @param {string} filePath
 * @returns {number} Number of snippets imported
 */
export function importAllSnippets(filePath) {
  const resolvedPath = resolve(process.cwd(), filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  const raw = readFileSync(resolvedPath, 'utf8')
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Invalid JSON in file')
  }
  if (!Array.isArray(data)) {
    throw new Error('Expected a JSON array of snippets')
  }
  let count = 0
  for (const item of data) {
    if (item.name && item.code) {
      importSnippet(item)
      count++
    }
  }
  return count
}
