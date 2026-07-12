import { FREEBUFF_WEB_URL_PROD } from '@codebuff/common/constants/hosts'
import { env, IS_DEV } from '@codebuff/common/env'

import { IS_FREEBUFF } from '../utils/constants'

// Get the website URL from environment or use default
export const WEBSITE_URL = env.NEXT_PUBLIC_CODEBUFF_APP_URL

// Runtime override: a stale dev-built Freebuff binary can be redirected at a
// real backend without rebuilding by setting FREEBUFF_APP_URL in the shell.
//
// Resolution order (highest → lowest):
//   1. FREEBUFF_APP_URL             — read from process.env at runtime, so
//      a built binary can be pointed at any backend (staging, local
//      :3000, freebuff.com, etc.) without a rebuild. Trimmed and
//      treated as unset if empty/whitespace. Wins over the baked-in
//      value on purpose: that's the whole point of the override.
//   2. NEXT_PUBLIC_FREEBUFF_APP_URL — baked into the binary at build time
//      (driven by aigenev7/cli/build.ts or the .env.freebuff it reads).
//   3. Built-in default              — localhost:3002 in dev, freebuff.com in
//      prod (FREEBUFF_WEB_URL_PROD).
//
// This is intentionally NOT a NEXT_PUBLIC_* var: those are replaced at
// compile time by `bun --define` and can't be overridden at runtime.
const RUNTIME_FREEBUFF_APP_URL = process.env.FREEBUFF_APP_URL?.trim()

// Freebuff login flow uses the freebuff web app instead of codebuff.com
const FREEBUFF_WEB_URL =
  RUNTIME_FREEBUFF_APP_URL ||
  env.NEXT_PUBLIC_FREEBUFF_APP_URL ||
  (IS_DEV ? 'http://localhost:3002' : FREEBUFF_WEB_URL_PROD)
export const LOGIN_WEBSITE_URL = IS_FREEBUFF ? FREEBUFF_WEB_URL : WEBSITE_URL

// Codebuff ASCII Logo - compact version for 80-width terminals
const LOGO_CODEBUFF = `
  ██████╗ ██████╗ ██████╗ ███████╗██████╗ ██╗   ██╗███████╗███████╗
 ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗██║   ██║██╔════╝██╔════╝
 ██║     ██║   ██║██║  ██║█████╗  ██████╔╝██║   ██║█████╗  █████╗
 ██║     ██║   ██║██║  ██║██╔══╝  ██╔══██╗██║   ██║██╔══╝  ██╔══╝
 ╚██████╗╚██████╔╝██████╔╝███████╗██████╔╝╚██████╔╝██║     ██║
  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═════╝  ╚═════╝ ╚═╝     ╚═╝
`

const LOGO_SMALL_CODEBUFF = `
  ██████╗ ██████╗
 ██╔════╝ ██╔══██╗
 ██║      ██████╔╝
 ██║      ██╔══██╗
 ╚██████╗ ██████╔╝
  ╚═════╝ ╚═════╝
`

// Modern hacker/cyberpunk ASCII art logo for AIGEN7EV.
// Uses block characters (█), box drawing, and half-blocks (▄▀)
// for a clean, angular, digital aesthetic.
// All lines are padded to exactly 66 characters wide for clean rendering.
// Modern hacker-style block-letter ASCII art logo for AIGEN7EV.
// Uses █ (full block), ╗╚╝╔║═ (box drawing) for a clean cyber aesthetic.
// Each letter-segment is padded to exactly 7 chars with 1-space separators
// = 8*7+7=63 chars per line, then truncated to 57 by the renderer.
const LOGO_FREEBUFF = `
 █████╗  ██╗  ██████╗ ███████╗███╗   ██╗███████╗██╗   ██╗
██╔══██╗ ██║ ██╔════╝ ██╔════╝████╗  ██║██╔════╝██║   ██║
███████║ ██║ ██║  ███╗█████╗  ██╔██╗ ██║█████╗  ██║   ██║
██╔══██║ ██║ ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ╚██╗ ██╔╝
██║  ██║ ██║ ╚██████╔╝███████╗██║ ╚████║███████╗ ╚████╔╝
╚═╝  ╚═╝ ╚═╝  ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝  ╚═══╝
`

// Compact logo for narrow terminals (5 rows, all lines at 48 chars wide).
// Condensed block-letter design with consistent per-letter padding.
const LOGO_SMALL_FREEBUFF = `
 █████╗ ██╗ ██████╗ ███████╗██╗   ██╗███████╗██╗   ██╗
██╔══██╗██║██╔════╝ ██╔════╝██║   ██║██╔════╝██║   ██║
███████║██║██║  ███╗█████╗  ██║   ██║█████╗  ██║   ██║
██╔══██║██║██║   ██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ╚██╗ ██╔╝
██║  ██║██║╚██████╔╝███████╗ ╚████╔╝ ███████╗ ╚████╔╝
╚═╝  ╚═╝╚═╝ ╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝  ╚═══╝
`

export const LOGO = IS_FREEBUFF ? LOGO_FREEBUFF : LOGO_CODEBUFF
export const LOGO_SMALL = IS_FREEBUFF ? LOGO_SMALL_FREEBUFF : LOGO_SMALL_CODEBUFF

// Shadow/border characters that receive the sheen animation effect
export const SHADOW_CHARS = new Set([
  '╚',
  '═',
  '╝',
  '║',
  '╔',
  '╗',
  '╠',
  '╣',
  '╦',
  '╩',
  '╬',
])

// Modal sizing constants
export const DEFAULT_TERMINAL_HEIGHT = 24
export const MODAL_VERTICAL_MARGIN = 2 // Space for top positioning (1) + bottom margin (1)
export const MAX_MODAL_BASE_HEIGHT = 22 // Maximum height when no warning banner
export const WARNING_BANNER_HEIGHT = 3 // Height of invalid credentials banner (padding + text + padding)

// Sheen animation constants
export const SHEEN_WIDTH = 5
export const SHEEN_STEP = 2 // Advance 2 positions per frame for efficiency
export const SHEEN_INTERVAL_MS = 150
