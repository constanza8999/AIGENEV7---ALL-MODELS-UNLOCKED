#!/usr/bin/env bun

/**
 * AIGENEV7 Custom Agents System
 * ──────────────────────────────
 * Define, create, and manage specialized AI agent personas.
 * Each agent has a system prompt that shapes its behavior.
 *
 * Usage:
 *   import { listAgents, getAgent, createAgent, ... } from './custom-agents.js'
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AGENTS_FILE = resolve(__dirname, 'custom-agents.json')

// ── Default Agent Presets ─────────────────────────────────────────────

const DEFAULT_AGENTS = [
  {
    id: 'default',
    name: 'Coding Assistant',
    emoji: '🤖',
    description: 'General-purpose coding assistant',
    systemPrompt: 'You are an expert programming assistant. Help the user write clean, efficient, well-documented code. Provide complete solutions with explanations.',
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    emoji: '🔍',
    description: 'Reviews code for bugs, security, and best practices',
    systemPrompt: 'You are a senior code reviewer. Analyze code for bugs, security vulnerabilities, performance issues, and style violations. Always provide specific, actionable feedback. Format your review with: Issues Found, Suggestions, and a Summary.',
  },
  {
    id: 'debugger',
    name: 'Debugger',
    emoji: '🐛',
    description: 'Focused on finding and fixing bugs',
    systemPrompt: 'You are a debugging expert. When given error messages or buggy code, systematically identify the root cause, explain why it happens, and provide the fix. Use a hypothesis-driven approach.',
  },
  {
    id: 'tech-writer',
    name: 'Technical Writer',
    emoji: '📝',
    description: 'Generates documentation, READMEs, API docs',
    systemPrompt: 'You are a technical writer. Write clear, concise, well-structured documentation. Use proper Markdown formatting. Include code examples, usage guides, and API references where appropriate.',
  },
  {
    id: 'sql-expert',
    name: 'SQL Expert',
    emoji: '🗄️',
    description: 'Database queries and schema design',
    systemPrompt: 'You are a SQL and database expert. Write optimized queries, design normalized schemas, and suggest indexing strategies. Always consider performance and explain your reasoning.',
  },
  {
    id: 'architect',
    name: 'System Architect',
    emoji: '🏗️',
    description: 'Architecture and design patterns',
    systemPrompt: 'You are a software architect. Design scalable, maintainable system architectures. Discuss trade-offs between different approaches. Use diagrams (ASCII art) and outline component interactions.',
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    emoji: '🔒',
    description: 'Security vulnerability analysis',
    systemPrompt: 'You are a security auditor. Analyze code for OWASP Top 10 vulnerabilities, injection flaws, authentication issues, and data exposure risks. Provide CVSS-style severity ratings and remediation steps.',
  },
  {
    id: 'test-engineer',
    name: 'Test Engineer',
    emoji: '🧪',
    description: 'Writes unit tests and test plans',
    systemPrompt: 'You are a QA engineer. Write comprehensive unit tests, integration tests, and test plans. Cover edge cases, error paths, and happy paths. Use the testing framework appropriate for the language.',
  },
  {
    id: 'pythonista',
    name: 'Python Expert',
    emoji: '🐍',
    description: 'Python-specific coding assistant',
    systemPrompt: 'You are a Python expert. Write Pythonic code following PEP 8. Use type hints, list comprehensions, generators, and appropriate design patterns. Suggest modern Python features where beneficial.',
  },
  {
    id: 'react-dev',
    name: 'React Developer',
    emoji: '⚛️',
    description: 'React/Next.js frontend expert',
    systemPrompt: 'You are a React expert. Build components using modern React patterns (hooks, functional components). Use TypeScript, consider性能, accessibility, and state management. Provide complete component code with styles.',
  },
  {
    id: 'mentor',
    name: 'Mentor Mode',
    emoji: '🎓',
    description: 'Guided learning with explanations',
    systemPrompt: 'You are a patient coding mentor. Guide the user through problems step by step. Don\'t give complete solutions immediately — ask questions, provide hints, and help them arrive at the answer themselves. Explain concepts thoroughly.',
  },
  {
    id: 'socratic',
    name: 'Socratic Debugger',
    emoji: '💭',
    description: 'Ask questions to help user debug their own code',
    systemPrompt: 'Use the Socratic method: Ask probing questions to help the user discover bugs and solutions themselves. Don\'t give direct answers — guide them through reasoning. Ask one question at a time.',
  },
]

// ── In-memory cache ──

let agentsCache = null

// ── Load agents from file (or use defaults) ──

function loadAgents() {
  if (agentsCache) return agentsCache

  try {
    if (existsSync(AGENTS_FILE)) {
      const raw = readFileSync(AGENTS_FILE, 'utf8')
      const parsed = JSON.parse(raw)
      // Merge with defaults (defaults provide the base, file overrides)
      const merged = [...DEFAULT_AGENTS]
      for (const agent of parsed) {
        const idx = merged.findIndex((a) => a.id === agent.id)
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...agent }
        } else {
          merged.push(agent)
        }
      }
      agentsCache = merged
      return merged
    }
  } catch (err) {
    console.warn(`[AIGENEV7] Warning: Could not load custom-agents.json: ${err.message}`)
  }

  agentsCache = [...DEFAULT_AGENTS]
  return agentsCache
}

// ── Save agents to file ──

function saveAgents(agents) {
  try {
    // Only save non-default agents and overrides
    const custom = agents.filter((a) => {
      const def = DEFAULT_AGENTS.find((d) => d.id === a.id)
      return !def || JSON.stringify(def) !== JSON.stringify(a)
    })
    writeFileSync(AGENTS_FILE, JSON.stringify(custom, null, 2), 'utf8')
  } catch (err) {
    console.warn(`[AIGENEV7] Warning: Could not save custom-agents.json: ${err.message}`)
  }
}

// ── Public API ──

/**
 * List all custom agents.
 * @returns {Array<{id, name, emoji, description, systemPrompt}>}
 */
export function listAgents() {
  return loadAgents()
}

/**
 * Get an agent by ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getAgent(id) {
  return loadAgents().find((a) => a.id === id)
}

/**
 * Get the default agent.
 * @returns {object}
 */
export function getDefaultAgent() {
  return getAgent('default') || loadAgents()[0]
}

/**
 * Create a new custom agent.
 * @param {string} id - Unique identifier
 * @param {string} name - Display name
 * @param {string} description - Short description
 * @param {string} systemPrompt - The system prompt defining the agent's behavior
 * @param {string} emoji - Emoji icon (optional)
 * @returns {object} The created agent
 */
export function createAgent(id, name, description, systemPrompt, emoji = '🤖') {
  const agents = loadAgents()
  
  if (agents.find((a) => a.id === id)) {
    throw new Error(`Agent "${id}" already exists`)
  }

  const agent = { id, name, emoji, description, systemPrompt }
  agents.push(agent)
  agentsCache = agents
  saveAgents(agents)
  return agent
}

/**
 * Update an existing agent.
 * @param {string} id - Agent ID to update
 * @param {object} updates - Fields to update (name, description, systemPrompt, emoji)
 * @returns {object} The updated agent
 */
export function updateAgent(id, updates) {
  const agents = loadAgents()
  const idx = agents.findIndex((a) => a.id === id)
  
  if (idx < 0) {
    throw new Error(`Agent "${id}" not found`)
  }

  agents[idx] = { ...agents[idx], ...updates }
  agentsCache = agents
  saveAgents(agents)
  return agents[idx]
}

/**
 * Delete a custom agent.
 * @param {string} id - Agent ID to delete
 * @returns {boolean} Whether the deletion was successful
 */
export function deleteAgent(id) {
  const agents = loadAgents()
  const def = DEFAULT_AGENTS.find((a) => a.id === id)
  
  if (def) {
    throw new Error(`Cannot delete default agent "${id}". You can only edit it.`)
  }

  const idx = agents.findIndex((a) => a.id === id)
  if (idx < 0) return false

  agents.splice(idx, 1)
  agentsCache = agents
  saveAgents(agents)
  return true
}

/**
 * Reset all agents to defaults.
 */
export function resetAgents() {
  agentsCache = [...DEFAULT_AGENTS]
  // Remove the custom-agents.json file
  try {
    if (existsSync(AGENTS_FILE)) {
      writeFileSync(AGENTS_FILE, '[]', 'utf8')
    }
  } catch {}
}
