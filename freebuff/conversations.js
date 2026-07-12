#!/usr/bin/env bun

/**
 * AIGENEV7 Conversation Manager
 * ───────────────────────────────
 * Save, load, list, resume, and delete chat conversations.
 * Conversations are stored in freebuff/conversations.json
 *
 * Usage:
 *   import { saveConversation, loadConversation, listConversations, deleteConversation } from './conversations.js'
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONVERSATIONS_FILE = resolve(__dirname, 'conversations.json')

// ── In-memory cache ──
let conversationsCache = null

function loadStore() {
  if (conversationsCache) return conversationsCache
  try {
    if (existsSync(CONVERSATIONS_FILE)) {
      const raw = readFileSync(CONVERSATIONS_FILE, 'utf8')
      conversationsCache = JSON.parse(raw)
      return conversationsCache
    }
  } catch (err) {
    console.warn(`[AIGENEV7] Warning: Could not load conversations.json: ${err.message}`)
  }
  conversationsCache = []
  return conversationsCache
}

function saveStore(conversations) {
  try {
    writeFileSync(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2), 'utf8')
  } catch (err) {
    console.warn(`[AIGENEV7] Warning: Could not save conversations.json: ${err.message}`)
  }
}

/**
 * Save a conversation.
 * @param {string} name - Short identifier for the conversation
 * @param {Array} messages - Array of { role, content } message objects
 * @param {object} meta - Optional metadata: { model, agent, agentName }
 * @returns {object} The saved conversation
 */
export function saveConversation(name, messages, meta = {}) {
  const conversations = loadStore()
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const existing = conversations.findIndex(c => c.id === id)
  const conversation = {
    id,
    name,
    messages: [...messages],
    model: meta.model || '',
    agent: meta.agent || '',
    agentName: meta.agentName || '',
    messageCount: messages.length,
    createdAt: existing >= 0 ? conversations[existing].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  if (existing >= 0) {
    conversations[existing] = conversation
  } else {
    conversations.push(conversation)
  }
  conversationsCache = conversations
  saveStore(conversations)
  return conversation
}

/**
 * Load a conversation by ID or name.
 * @param {string} idOrName
 * @returns {object|undefined}
 */
export function loadConversation(idOrName) {
  const conversations = loadStore()
  return conversations.find(c => c.id === idOrName || c.name.toLowerCase() === idOrName.toLowerCase())
}

/**
 * List all saved conversations, optionally filtered.
 * @param {object} filters - { search? }
 * @returns {Array}
 */
export function listConversations(filters = {}) {
  let conversations = loadStore()
  if (filters.search) {
    const q = filters.search.toLowerCase()
    conversations = conversations.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.messages.some(m => m.content.toLowerCase().includes(q))
    )
  }
  // Sort by updatedAt descending
  return [...conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

/**
 * Delete a conversation by ID or name.
 * @param {string} idOrName
 * @returns {boolean}
 */
export function deleteConversation(idOrName) {
  const conversations = loadStore()
  const idx = conversations.findIndex(c => c.id === idOrName || c.name.toLowerCase() === idOrName.toLowerCase())
  if (idx < 0) return false
  conversations.splice(idx, 1)
  conversationsCache = conversations
  saveStore(conversations)
  return true
}

/**
 * Export a conversation to a JSON string.
 * @param {string} idOrName
 * @returns {{ conversation: object, json: string }}
 */
export function exportConversation(idOrName) {
  const conv = loadConversation(idOrName)
  if (!conv) throw new Error(`Conversation "${idOrName}" not found`)
  return {
    conversation: conv,
    json: JSON.stringify(conv, null, 2),
  }
}

/**
 * Export a conversation to a file.
 * @param {string} idOrName
 * @param {string} filePath - File path (defaults to conversation-<name>.json)
 * @returns {string} The path written to
 */
export function exportConversationToFile(idOrName, filePath) {
  const { conversation, json } = exportConversation(idOrName)
  if (!filePath) {
    const sanitizedName = conversation.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    filePath = resolve(process.cwd(), `conversation-${sanitizedName}.json`)
  }
  writeFileSync(filePath, json, 'utf8')
  return filePath
}

/**
 * Import a conversation from a JSON string or object.
 * @param {string|object} input
 * @returns {object} The imported conversation
 */
export function importConversation(input) {
  let data
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input)
    } catch {
      throw new Error('Invalid JSON. Expected a conversation object.')
    }
  } else if (typeof input === 'object' && input !== null) {
    data = input
  } else {
    throw new Error('Invalid input: expected JSON string or object')
  }

  if (!data.name || !Array.isArray(data.messages)) {
    throw new Error('Conversation must have "name" and "messages" fields')
  }

  return saveConversation(data.name, data.messages, {
    model: data.model,
    agent: data.agent,
    agentName: data.agentName,
  })
}

/**
 * Get a summary of all conversations (without message content).
 * @returns {Array}
 */
export function getConversationSummaries() {
  return listConversations().map(c => ({
    id: c.id,
    name: c.name,
    messageCount: c.messageCount,
    model: c.model,
    agentName: c.agentName,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }))
}
