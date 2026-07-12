#!/usr/bin/env bun
/**
 * AIGENEV7 Premium License Check
 *
 * Checks for premium access via:
 *   1. AIGENEV7_PREMIUM_KEY environment variable
 *   2. premium.lic license file in the freebuff/ directory
 *
 * Premium features unlocked:
 *   - Export agents to file
 *   - Import agents from file
 *   - Custom quantum circuits (beyond demos)
 *   - Premium-tier model access (GPT-4.1, Claude Opus 4, O3 Pro, etc.)
 *   - Full API access
 *
 * Usage:
 *   import { isPremium, getPremiumTier } from './premium.js'
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Premium feature map ────────────────────────────────────────────────
// Each feature can be gated independently by tier
export const PREMIUM_FEATURES = {
  // ── Pro Features ($5/mo) ──
  export_agent_file: { tier: 'pro', label: 'Export agents to file' },
  import_agent_file: { tier: 'pro', label: 'Import agents from file' },
  code_completion: { tier: 'pro', label: 'AI code completion (context-aware suggestions)' },
  code_analytics: { tier: 'pro', label: 'Code analytics & complexity metrics' },
  pro_models: { tier: 'pro', label: 'Pro model access (Claude Sonnet 4, DeepSeek V4 Pro, MiMo 2.5 Pro)' },
  typescript_agent: { tier: 'pro', label: 'TypeScript Expert agent' },
  golang_agent: { tier: 'pro', label: 'Go Expert agent' },
  rust_agent: { tier: 'pro', label: 'Rust Expert agent' },
  java_agent: { tier: 'pro', label: 'Java/Spring Expert agent' },
  // ── Elite Features ($15/mo) ──
  custom_quantum: { tier: 'elite', label: 'Custom quantum circuits (unlimited shots)' },
  premium_models: { tier: 'elite', label: 'Elite model access (GPT-5, GPT-5 Plus, Opus 4, O3 Pro)' },
  api_access: { tier: 'elite', label: 'Full API access via local server' },
  project_context: { tier: 'elite', label: 'Project-aware AI context (full codebase understanding)' },
  fullstack_agent: { tier: 'elite', label: 'Full Stack Developer agent' },
  devops_agent: { tier: 'elite', label: 'DevOps Engineer agent' },
  mobile_agent: { tier: 'elite', label: 'Mobile Developer agent' },
  blockchain_agent: { tier: 'elite', label: 'Blockchain Developer agent' },
  // ── Enterprise Features ($35/mo) ──
  batch_inference: { tier: 'enterprise', label: 'Batch inference (multi-file processing)' },
  enterprise_models: { tier: 'enterprise', label: 'Enterprise model access (GPT-5.1, Claude Ultra, Gemini Ultra)' },
  long_context: { tier: 'enterprise', label: '1M context window for massive projects' },
  ai_research_agent: { tier: 'enterprise', label: 'AI Research agent' },
  data_science_agent: { tier: 'enterprise', label: 'Data Science agent' },
  performance_agent: { tier: 'enterprise', label: 'Performance Engineer agent' },
  refactoring_agent: { tier: 'enterprise', label: 'Refactoring Expert agent' },
  team_collaboration: { tier: 'enterprise', label: 'Team collaboration & shared workspaces' },
  custom_integrations: { tier: 'enterprise', label: 'Custom integrations (webhooks, CI/CD, IDE plugins)' },
}

// ── Token balances per tier ────────────────────────────────────────────
// Each tier has a maximum token allowance and a reset period.
// Enterprise: 500B tokens, Elite: 50B, Pro: 5B, Free: 100M
// Balances are persisted to token-balance.json

export const TOKEN_LIMITS = {
  free: {
    max: 100_000_000,          // 100M tokens for free tier
    label: '100M',
    resetDays: 30,
  },
  pro: {
    max: 5_000_000_000,        // 5B tokens for pro
    label: '5B',
    resetDays: 30,
  },
  elite: {
    max: 50_000_000_000,       // 50B tokens for elite
    label: '50B',
    resetDays: 30,
  },
  enterprise: {
    max: 500_000_000_000,      // 500B tokens for enterprise
    label: '500B',
    resetDays: 30,
  },
}

// ── Token balance path ──
const BALANCE_FILE = resolve(__dirname, 'token-balance.json')

// ── In-memory balance cache ──
let balanceCache = null

function loadBalance() {
  if (balanceCache) return { ...balanceCache }
  try {
    if (existsSync(BALANCE_FILE)) {
      const raw = readFileSync(BALANCE_FILE, 'utf8')
      const data = JSON.parse(raw)
      balanceCache = {
        used: data.used || 0,
        lastReset: data.lastReset || new Date().toISOString(),
        tier: data.tier || 'free',
      }
      return { ...balanceCache }
    }
  } catch (err) {
    console.warn(`[AIGENEV7] Warning: Could not load token-balance.json: ${err.message}`)
  }
  balanceCache = { used: 0, lastReset: new Date().toISOString(), tier: 'free' }
  return { ...balanceCache }
}

function saveBalance(data) {
  balanceCache = { ...data }
  try {
    writeFileSync(BALANCE_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (err) {
    console.warn(`[AIGENEV7] Warning: Could not save token-balance.json: ${err.message}`)
  }
}

function ensureBalanceFileExists(tier) {
  const balance = loadBalance()
  if (balance.tier !== tier) {
    // Tier changed — reset balance for new tier
    balance.used = 0
    balance.tier = tier
    balance.lastReset = new Date().toISOString()
    saveBalance(balance)
  }
  // Check if balance should be reset (periodic reset)
  const limit = TOKEN_LIMITS[tier] || TOKEN_LIMITS.free
  if (limit.resetDays) {
    const lastReset = new Date(balance.lastReset)
    const daysSinceReset = (Date.now() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceReset >= limit.resetDays) {
      balance.used = 0
      balance.lastReset = new Date().toISOString()
      saveBalance(balance)
    }
  }
  return balance
}

/**
 * Get remaining token balance for the current tier.
 * @returns {{ remaining: number, used: number, max: number, pct: number, tier: string, label: string }}
 */
export function getTokenBalance() {
  const status = checkPremium()
  const tier = status.tier || 'free'
  const limit = TOKEN_LIMITS[tier] || TOKEN_LIMITS.free
  const balance = ensureBalanceFileExists(tier)
  const remaining = Math.max(0, limit.max - balance.used)
  return {
    remaining,
    used: balance.used,
    max: limit.max,
    pct: limit.max > 0 ? +((balance.used / limit.max) * 100).toFixed(2) : 0,
    tier,
    label: limit.label,
    exhausted: remaining <= 0,
  }
}

/**
 * Check if there are enough tokens for a given request.
 * @param {number} estimatedTokens - Estimated tokens the request will use
 * @returns {boolean}
 */
export function hasEnoughTokens(estimatedTokens = 0) {
  const balance = getTokenBalance()
  if (balance.max === Infinity) return true // No limit
  return balance.remaining >= estimatedTokens
}

/**
 * Deduct tokens from the balance.
 * @param {number} tokens - Number of tokens to deduct
 * @returns {{ remaining: number, deducted: boolean, exhausted: boolean }}
 */
export function deductTokens(tokens) {
  if (tokens <= 0) {
    const balance = getTokenBalance()
    return { remaining: balance.remaining, deducted: false, exhausted: balance.exhausted }
  }
  const status = checkPremium()
  const tier = status.tier || 'free'
  const limit = TOKEN_LIMITS[tier] || TOKEN_LIMITS.free
  if (limit.max === Infinity) {
    return { remaining: Infinity, deducted: false, exhausted: false }
  }
  const balance = ensureBalanceFileExists(tier)
  balance.used += tokens
  if (balance.used > limit.max) {
    balance.used = limit.max // Clamp to max
  }
  saveBalance(balance)
  const remaining = Math.max(0, limit.max - balance.used)
  return {
    remaining,
    deducted: true,
    exhausted: remaining <= 0,
    used: balance.used,
    max: limit.max,
  }
}

/**
 * Format a token count for display.
 * @param {number} tokens
 * @returns {string}
 */
export function formatTokens(tokens) {
  if (tokens === Infinity) return '∞'
  if (tokens >= 1_000_000_000_000) return (tokens / 1_000_000_000_000).toFixed(1) + 'T'
  if (tokens >= 1_000_000_000) return (tokens / 1_000_000_000).toFixed(1) + 'B'
  if (tokens >= 1_000_000) return (tokens / 1_000_000).toFixed(1) + 'M'
  if (tokens >= 1_000) return (tokens / 1_000).toFixed(1) + 'K'
  return String(tokens)
}

// ── Premium tier definitions ───────────────────────────────────────────
const TIER_RANKS = {
  free: 0,
  pro: 1,
  elite: 2,
  enterprise: 3,
}

/**
 * Check if premium access is available.
 * @returns {{ isPremium: boolean, tier: string, features: string[], message: string }}
 */
export function checkPremium() {
  // 1. Check env var
  const envKey = process.env.AIGENEV7_PREMIUM_KEY
  if (envKey) {
    // Simple validation: a premium key must be non-empty and look like a key
    const trimmed = envKey.trim()
    if (trimmed.length >= 16 && trimmed.startsWith('ag7_')) {
      // Extract tier from key: ag7_pro_xxx, ag7_elite_xxx, ag7_enterprise_xxx
      const parts = trimmed.split('_')
      const tier = parts.length >= 2 ? parts[1] : 'pro'
      const normalizedTier = ['pro', 'elite', 'enterprise'].includes(tier) ? tier : 'pro'
      const tierRank = TIER_RANKS[normalizedTier] || 1
      const features = Object.entries(PREMIUM_FEATURES)
        .filter(([, def]) => TIER_RANKS[def.tier] <= tierRank)
        .map(([key]) => key)
      return {
        isPremium: true,
        tier: normalizedTier,
        features,
        message: `Premium ${normalizedTier} — ${features.length} features unlocked`,
      }
    }
  }

  // 2. Check license file
  const licPath = resolve(__dirname, 'premium.lic')
  if (existsSync(licPath)) {
    try {
      const lic = readFileSync(licPath, 'utf8').trim()
      const parts = lic.split(':')
      const tier = parts.length >= 2 ? parts[1] : parts[0] || 'pro'
      const normalizedTier = ['pro', 'elite', 'enterprise'].includes(tier) ? tier : 'pro'
      const tierRank = TIER_RANKS[normalizedTier] || 1
      const features = Object.entries(PREMIUM_FEATURES)
        .filter(([, def]) => TIER_RANKS[def.tier] <= tierRank)
        .map(([key]) => key)
      return {
        isPremium: true,
        tier: normalizedTier,
        features,
        message: `Premium ${normalizedTier} (file) — ${features.length} features unlocked`,
      }
    } catch {}
  }

  return {
    isPremium: false,
    tier: 'free',
    features: [],
    message: 'Free tier — set AIGENEV7_PREMIUM_KEY or add premium.lic to upgrade',
  }
}

/**
 * Quick boolean check for any premium access.
 * @returns {boolean}
 */
export function isPremium() {
  return checkPremium().isPremium
}

/**
 * Get the current premium tier string.
 * @returns {string}
 */
export function getPremiumTier() {
  return checkPremium().tier
}

/**
 * Check if a specific feature is available.
 * @param {string} feature - Feature key from PREMIUM_FEATURES
 * @returns {boolean}
 */
export function hasFeature(feature) {
  const status = checkPremium()
  const def = PREMIUM_FEATURES[feature]
  if (!def) return true // Unknown features are free
  return TIER_RANKS[status.tier] >= TIER_RANKS[def.tier]
}

/**
 * Get the label for a missing feature upgrade prompt.
 * @param {string} feature
 * @returns {string}
 */
export function getUpgradePrompt(feature) {
  const def = PREMIUM_FEATURES[feature]
  if (!def) return ''
  return `✗ Premium feature: ${def.label}. Set AIGENEV7_PREMIUM_KEY=ag7_${def.tier}_your_key to unlock.`
}
