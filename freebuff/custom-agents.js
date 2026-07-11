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
  {
    id: 'quantum-dev',
    name: 'Quantum Developer',
    emoji: '⚛️',
    description: 'Expert in quantum computing, algorithms, and Qiskit/Cirq/Q#',
    systemPrompt: `You are a quantum computing expert with deep knowledge across the full stack of quantum software development. You help users write, debug, and optimize quantum programs.

Your expertise includes:

1. QUANTUM FUNDAMENTALS
- Superposition, entanglement, interference, and measurement
- Quantum gates: Hadamard, Pauli (X/Y/Z), CNOT, Toffoli, SWAP, phase gates (S, T, Rz), controlled rotations
- Quantum circuits and their visual representation
- Density matrices and Bloch sphere representations
- No-cloning theorem and quantum teleportation

2. QUANTUM ALGORITHMS
- Shor's algorithm for integer factorization
- Grover's search algorithm and amplitude amplification
- Quantum Phase Estimation (QPE)
- Variational Quantum Eigensolver (VQE) for chemistry
- Quantum Approximate Optimization Algorithm (QAOA)
- Quantum Fourier Transform (QFT)
- HHL algorithm for linear systems
- Simon's algorithm and Deutsch-Jozsa
- Quantum machine learning: QSVM, quantum kernels, variational classifiers

3. QUANTUM PROGRAMMING
- Qiskit (IBM): Circuit construction, transpilation, IBM Quantum backend integration
- Cirq (Google): Moment-based circuits, Google Sycamore simulator integration
- Q# (Microsoft): Domain-specific language for quantum computing
- PennyLane: Quantum machine learning and differentiable quantum computing
- Braket (AWS): Hybrid quantum-classical workflows
- OpenQASM: Low-level quantum assembly language

4. QUANTUM ERROR CORRECTION
- Bit-flip and phase-flip codes (repetition codes)
- Shor code (9-qubit)
- Steane code (7-qubit)
- Surface codes and the threshold theorem
- Fault-tolerant quantum computing principles
- Error mitigation techniques: zero-noise extrapolation, probabilistic error cancellation

5. HYBRID COMPUTING
- Variational quantum-classical algorithms
- Parameter-shift rule for gradient computation
- Quantum kernel methods
- Barren plateau problem and solution strategies
- Near-term quantum computing (NISQ era) best practices
- Quantum circuit cutting and distributed quantum computing

6. QUANTUM CHEMISTRY & PHYSICS
- Molecular Hamiltonian encoding (Born-Oppenheimer, Jordan-Wigner, Bravyi-Kitaev)
- Hartree-Fock state preparation
- Unitary Coupled Cluster (UCCSD) ansatz
- Adiabatic quantum computing and quantum annealing
- Quantum simulation of many-body systems

When responding:
- Write complete, runnable quantum code with proper imports and backend configuration
- Explain the quantum mechanics behind each algorithm step
- Include circuit diagrams using ASCII art where helpful
- Discuss hardware considerations (qubit topology, gate fidelities, coherence times)
- Suggest optimization strategies for NISQ devices (circuit depth reduction, gate fusion, measurement error mitigation)
- Provide both theoretical explanation AND practical implementation
- Use proper quantum computing terminology

Always format quantum circuits clearly and explain what each gate does in plain language. When writing code, include simulator setup instructions and real-hardware deployment considerations.`,
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
 * Export an agent as a portable JSON string.
 * @param {string} idOrName - Agent ID, name, or number string
 * @returns {{agent: object, json: string}} The agent object and its JSON representation
 */
export function exportAgent(idOrName) {
  const agents = loadAgents()
  let agent = null

  // Try by number first (matching CLI convention)
  const num = parseInt(idOrName, 10)
  if (!isNaN(num) && num >= 1 && num <= agents.length) {
    agent = agents[num - 1]
  }

  // Try by ID or name
  if (!agent) {
    agent = agents.find((a) => a.id === idOrName || a.name.toLowerCase() === idOrName.toLowerCase())
  }

  if (!agent) {
    throw new Error(`Agent "${idOrName}" not found`)
  }

  // Portable format: include id for round-trip fidelity
  const portable = {
    id: agent.id,
    name: agent.name,
    emoji: agent.emoji,
    description: agent.description,
    systemPrompt: agent.systemPrompt,
  }

  return {
    agent: portable,
    json: JSON.stringify(portable, null, 2),
  }
}

/**
 * Export an agent to a JSON file.
 * @param {string} idOrName - Agent ID, name, or number string
 * @param {string} filePath - File path to write to (defaults to agent-<name>.json)
 * @returns {string} The path the file was written to
 */
export function exportAgentToFile(idOrName, filePath) {
  const { agent, json } = exportAgent(idOrName)
  
  if (!filePath) {
    const sanitizedName = agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    filePath = resolve(process.cwd(), `agent-${sanitizedName}.json`)
  }

  writeFileSync(filePath, json, 'utf8')
  return filePath
}

/**
 * Import an agent from a JSON string or object.
 * Creates the agent if it doesn't exist, updates if it does.
 * @param {string|object} input - JSON string or object with agent fields
 * @returns {object} The imported/updated agent
 */
export function importAgent(input) {
  let data

  if (typeof input === 'string') {
    try {
      data = JSON.parse(input)
    } catch {
      throw new Error('Invalid JSON. Use format: {"name":"...","systemPrompt":"..."}')
    }
  } else if (typeof input === 'object' && input !== null) {
    data = input
  } else {
    throw new Error('Invalid input: expected JSON string or object')
  }

  if (!data.name || !data.systemPrompt) {
    throw new Error('Agent must have at least "name" and "systemPrompt" fields')
  }

  // Use provided ID or generate from name
  const id = data.id || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const emoji = data.emoji || '🤖'
  const description = data.description || `Custom agent: ${data.name}`

  const agents = loadAgents()
  const existing = agents.find((a) => a.id === id)

  if (existing) {
    // Update existing agent
    const updates = {
      name: data.name,
      emoji,
      description,
      systemPrompt: data.systemPrompt,
    }
    return updateAgent(id, updates)
  } else {
    // Create new agent
    return createAgent(id, data.name, description, data.systemPrompt, emoji)
  }
}

/**
 * Import an agent from a JSON file.
 * @param {string} filePath - Path to a JSON file
 * @returns {object} The imported/updated agent
 */
export function importAgentFromFile(filePath) {
  const resolvedPath = resolve(process.cwd(), filePath)
  
  if (!existsSync(resolvedPath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const raw = readFileSync(resolvedPath, 'utf8')
  return importAgent(raw)
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
