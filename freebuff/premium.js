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

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Premium feature map ────────────────────────────────────────────────
// Each feature can be gated independently by tier
export const PREMIUM_FEATURES = {
  export_agent_file: { tier: 'pro', label: 'Export agents to file' },
  import_agent_file: { tier: 'pro', label: 'Import agents from file' },
  custom_quantum: { tier: 'pro', label: 'Custom quantum circuits (1024+ shots)' },
  premium_models: { tier: 'elite', label: 'Premium model access (GPT-4.1, Opus 4, O3 Pro)' },
  api_access: { tier: 'elite', label: 'Full API access' },
  batch_inference: { tier: 'enterprise', label: 'Batch inference (multi-file processing)' },
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
