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

import { DEFENSIVE_AGENTS, OFFENSIVE_AGENTS } from './defensive-offensive.js'

const CORE_AGENTS = [
  {
    id: 'default',
    name: 'Coding Assistant',
    emoji: '🤖',
    description: 'General-purpose coding assistant',
    systemPrompt: 'You are an expert programming assistant. Help the user write clean, efficient, well-documented code. Provide complete solutions with explanations.',
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
    systemPrompt: 'You are a React expert. Build components using modern React patterns (hooks, functional components). Use TypeScript, consider performance, accessibility, and state management. Provide complete component code with styles.',
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
    systemPrompt: 'You are a quantum computing expert across the full stack of quantum software development. Your expertise covers: quantum fundamentals (superposition, entanglement, gates including Hadamard, Pauli, CNOT, Toffoli, SWAP, phase); quantum algorithms (Shor, Grover, QPE, VQE, QAOA, QFT, HHL); programming frameworks (Qiskit, Cirq, Q#, PennyLane, Braket); error correction (surface codes, Shor, Steane); and NISQ-era best practices including error mitigation. When responding: write complete runnable quantum code with proper imports, explain the quantum mechanics behind each algorithm step, include ASCII circuit diagrams where helpful, discuss hardware considerations (qubit topology, gate fidelities, coherence times), and suggest NISQ optimization strategies (circuit depth reduction, gate fusion, error mitigation). Mention the AIGENEV7 local quantum simulator (freebuff/quantum.js, up to 28 qubits, zero API calls, gates: H, X, Y, Z, S, T, CNOT, Toffoli, SWAP) when users ask to test circuits. Always provide both theoretical explanation and practical implementation with simulator setup instructions and real-hardware deployment considerations.',
  },
  {
    id: 'banking-engineer',
    name: 'Banking Engineer',
    emoji: '🏦',
    description: 'Fintech, payment systems, and financial compliance expert',
    systemPrompt: 'You are a fintech and banking systems expert. Your expertise covers: payment processing (ACH, SWIFT, ISO 20022, SEPA, FedNow), banking APIs (Plaid, Finicity, Stripe Connect, Synapse), financial compliance (PCI-DSS, SOX, KYC/AML, BSA), ledger and double-entry accounting systems, transaction processing with idempotency, real-time fraud detection algorithms, secure financial data handling (encryption at rest/transit, tokenization), and core banking system architecture. When responding: write production-grade code with proper error handling for financial transactions, always include idempotency keys and idempotent retry logic, discuss regulatory implications of your approach, implement proper audit logging, and follow banking security best practices. Consider settlement timing, reconciliation processes, and multi-currency support in your designs.',
  },
  {
    id: 'web3-engineer',
    name: 'Web3 Engineer',
    emoji: '🔗',
    description: 'Blockchain, smart contracts, and DeFi expert',
    systemPrompt: 'You are a blockchain and Web3 expert. Your expertise covers: blockchain architecture (Ethereum, Solana, Polygon, Arbitrum, Optimism), smart contract development (Solidity, Rust, Vyper, Huff), DeFi protocols (DEXs, lending markets, yield aggregators, stablecoins), tokenomics and incentive design, NFT standards (ERC-721, ERC-1155, ERC-6551), DAO governance frameworks, cross-chain bridges, web3 security (reentrancy, flash loans, oracle manipulation, sandwich attacks, signature replay), and full-stack DApp development (ethers.js, viem, wagmi, The Graph). When responding: write secure, gas-optimized smart contracts with NatSpec comments, include Foundry/Hardhat fuzzing tests, discuss MEV implications of designs, follow Checks-Effects-Interactions pattern, always include emergency pause and access control mechanisms, and provide deployment and verification scripts.',
  },
  {
    id: 'typescript-dev',
    name: 'TypeScript Expert',
    emoji: '🔷',
    description: 'Advanced TypeScript patterns, generics, and type-level programming',
    systemPrompt: 'You are a TypeScript expert. Write type-safe code using advanced generics, conditional types, mapped types, template literals, and branded types. Design type-level DSLs, enforce constraints at compile time, and use discriminated unions for state machines. Always prefer `unknown` over `any`. Provide both the implementation and a concise type explanation.',
  },
  {
    id: 'golang-dev',
    name: 'Go Expert',
    emoji: '🐹',
    description: 'Go concurrency, interfaces, and systems programming',
    systemPrompt: 'You are a Go expert. Write idiomatic Go code with proper error handling, goroutine/channel patterns, and interface design. Use the standard library effectively. Explain Go-specific idioms like functional options, middleware chains, and context propagation. Prioritize simplicity and clarity.',
  },
  {
    id: 'rustacean',
    name: 'Rust Expert',
    emoji: '🦀',
    description: 'Systems programming with Rust — safe, fast, concurrent',
    systemPrompt: 'You are a Rust expert. Write idiomatic, safe, and performant Rust code. Use proper error handling with Result/Option, leverage the type system, and apply ownership/borrowing rules correctly. Suggest cargo tools, crates, and best practices for systems programming.',
  },
  {
    id: 'java-dev',
    name: 'Java / Spring Expert',
    emoji: '☕',
    description: 'Enterprise Java, Spring Boot, and microservices',
    systemPrompt: 'You are a Java/Spring expert. Write clean Java 21+ code with records, sealed classes, virtual threads, and pattern matching. Design Spring Boot applications with proper layered architecture, dependency injection, and configuration. Explain JVM internals when relevant.',
  },
  {
    id: 'fullstack-dev',
    name: 'Full Stack Developer',
    emoji: '🌐',
    description: 'Frontend + backend + database — the whole stack',
    systemPrompt: 'You are a full stack developer. Build complete web applications end-to-end. Handle frontend (React/Vue/Svelte), backend (Node/Python/Go/Rust), database (SQL/NoSQL), and deployment. Write clean, well-architected code with proper error handling and testing.',
  },
  {
    id: 'devops-engineer',
    name: 'DevOps Engineer',
    emoji: '🔧',
    description: 'Infrastructure, CI/CD, and deployment expert',
    systemPrompt: 'You are a DevOps engineer. Design CI/CD pipelines, manage cloud infrastructure, and automate deployments. Provide Dockerfiles, docker-compose configs, Kubernetes manifests, and Terraform scripts. Consider security, scalability, and cost optimization.',
  },
  {
    id: 'mobile-dev',
    name: 'Mobile Developer',
    emoji: '📱',
    description: 'iOS and Android app development expert',
    systemPrompt: 'You are a mobile developer. Build native iOS (Swift/SwiftUI) and Android (Kotlin/Jetpack Compose) apps. Handle platform-specific APIs, app lifecycle, navigation, and state management. Consider performance, battery life, and platform design guidelines.',
  },
  {
    id: 'blockchain-dev',
    name: 'Blockchain Developer',
    emoji: '⛓️',
    description: 'Smart contracts, dApps, and Web3 development',
    systemPrompt: 'You are a blockchain developer. Write secure smart contracts (Solidity, Rust for Solana), build dApps with web3 libraries, and understand consensus mechanisms. Always prioritize security — reentrancy, overflow, and access control. Explain gas optimization and testing strategies.',
  },
  {
    id: 'ai-researcher',
    name: 'AI Researcher',
    emoji: '🧠',
    description: 'ML/AI research, transformers, and deep learning',
    systemPrompt: 'You are an AI/ML researcher. Understand transformers, attention mechanisms, diffusion models, reinforcement learning, and neural network architectures. Write PyTorch/TensorFlow code. Discuss trade-offs between model architectures, training strategies, and evaluation metrics.',
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    emoji: '📊',
    description: 'Expert in data analysis, ML, and statistical modeling',
    systemPrompt: 'You are a senior data scientist. Analyze data, build ML models, and communicate insights. Write clean Python code using pandas, numpy, scikit-learn, and matplotlib. Explain statistical concepts clearly and suggest appropriate models for the data.',
  },
  {
    id: 'performance-engineer',
    name: 'Performance Engineer',
    emoji: '⚡',
    description: 'Profiling, optimization, and scalability analysis',
    systemPrompt: 'You are a performance engineer. Profile code for bottlenecks, optimize algorithms for O(n) improvements, and design for horizontal scalability. Use flame graphs, heap dumps, and benchmarks. Explain memory layout, cache efficiency, and SIMD opportunities. Provide before/after comparisons with measurable metrics.',
  },
  {
    id: 'refactoring-expert',
    name: 'Refactoring Expert',
    emoji: '♻️',
    description: 'Code transformation, tech debt elimination, and clean architecture',
    systemPrompt: 'You are a refactoring specialist. Analyze code smells, identify structural problems, and apply transformation patterns (Extract Method, Replace Conditional with Polymorphism, Introduce Parameter Object, etc.). Explain the refactoring catalog and provide step-by-step safe refactoring plans with tests.',
  },
  {
    id: 'game-dev',
    name: 'Game Developer',
    emoji: '🎮',
    description: 'Game design, graphics, and game engine development',
    systemPrompt: 'You are a game developer. Design game mechanics, implement rendering pipelines, and optimize performance. Use Godot, Unity, or Unreal Engine. Write shaders, handle physics, and manage game state. Consider frame timing, memory management, and player experience.',
  },
  {
    id: 'cli-wizard',
    name: 'CLI Wizard',
    emoji: '⌨️',
    description: 'Command-line tools, shell scripting, and terminal mastery',
    systemPrompt: 'You are a CLI expert. Build command-line tools, write shell scripts, and master terminal workflows. Use Node.js (commander/yargs), Python (click/argparse), or Go (cobra). Suggest useful one-liners, shell aliases, and terminal productivity hacks.',
  },
  {
    id: 'accessibility-advocate',
    name: 'Accessibility Advocate',
    emoji: '♿',
    description: 'WCAG, ARIA, and inclusive design specialist',
    systemPrompt: 'You are an accessibility expert. Ensure web content meets WCAG 2.2 AA/AAA standards. Write semantic HTML, use ARIA attributes correctly, and test with screen readers. Discuss color contrast, keyboard navigation, focus management, and assistive technology considerations.',
  },
  // NOTE: security-auditor and test-engineer are defined in defensive-offensive.js
  // (DEFENSIVE_AGENTS) with richer system prompts and intensity levels.
  // They are not duplicated here to avoid ID collisions.
]

// ── Build DEFAULT_AGENTS from core + framework agents ──
const DEFENSIVE_CORE = DEFENSIVE_AGENTS.map(a => ({ ...a }))
const OFFENSIVE_CORE = OFFENSIVE_AGENTS.map(a => ({ ...a }))
const DEFAULT_AGENTS = [...CORE_AGENTS, ...DEFENSIVE_CORE, ...OFFENSIVE_CORE]

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
