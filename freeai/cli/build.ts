#!/usr/bin/env bun

/**
 * Freebuff CLI build script.
 *
 * Builds a free-only variant of the Codebuff CLI with FREEBUFF_MODE=true
 * AND next-public env vars baked in at compile time, so the produced
 * `cli/bin/freebuff[.exe]` binary doesn't need any NEXT_PUBLIC_* exported
 * to pass `common/src/env.ts` runtime validation.
 *
 * Usage:
 *   bun freebuff/cli/build.ts <version> [dev|test|prod]
 *
 * Examples:
 *   bun freebuff/cli/build.ts 1.0.0          # dev defaults (LOCAL DEV)
 *   bun freebuff/cli/build.ts 1.0.0 prod     # prod placeholders (override via .env.freebuff)
 *   bun freebuff/cli/build.ts 0.0.0-dev dev  # matches root package.json build:freebuff
 *
 * Env-value source precedence (high → low):
 *   1. Shell env (any pre-set value wins; CI secrets stay out of source)
 *   2. .env.freebuff at the repo root (gitignored — local overrides)
 *   3. Built-in defaults for the requested env (dev / test / prod)
 *
 * The resolved env is validated against clientEnvSchema before invoking
 * the builder; failures print zod issues and exit non-zero so we never
 * produce a binary that nukes itself on first launch.
 *
 * Backend host sanity check: after zod validation, this wrapper warns (or,
 * with FREEBUFF_STRICT_HOST_CHECK=true, fails non-zero) when one of
 * NEXT_PUBLIC_FREEBUFF_APP_URL / NEXT_PUBLIC_CODEBUFF_APP_URL is a loopback
 * dev URL while the other is a real domain. That's the exact "login works,
 * then Unable to connect on every /api/v1/* call" half-config that this
 * check exists to catch.
 */

import { spawnSync } from 'child_process'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import z from 'zod/v4'

import { clientEnvSchema } from '../../common/src/env-schema'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..', '..')

const [, , versionArg, envArg] = process.argv
const version = versionArg
if (!version) {
  console.error('Usage: bun freebuff/cli/build.ts <version> [dev|test|prod]')
  process.exit(1)
}
const targetEnv = envArg ?? 'dev'
if (!['dev', 'test', 'prod'].includes(targetEnv)) {
  console.error(`Invalid env: ${targetEnv}. Must be dev, test, or prod.`)
  process.exit(1)
}

/**
 * Built-in defaults per env. dev/test inherit test-stub values from
 * sdk/test/setup-env.ts; prod placeholders are intentionally obvious so
 * they fail fast if someone ships a real prod-binary without overrides.
 */
const BUILTIN_DEFAULTS: Record<'dev' | 'test' | 'prod', Record<string, string>> = {
  dev: {
    NEXT_PUBLIC_CB_ENVIRONMENT: 'dev',
    NEXT_PUBLIC_CODEBUFF_APP_URL: 'http://localhost:3000',
    // Freebuff web app dev server. Override in .env.freebuff or via shell env
    // (e.g. NEXT_PUBLIC_FREEBUFF_APP_URL=https://staging.example.com) to point
    // a dev binary at a non-local backend without rebuilding the web app.
    //
    // For an *already-built* binary, the runtime env var FREEBUFF_APP_URL
    // (read in cli/src/login/constants.ts) takes precedence over whatever
    // value is baked in here, so a stale binary can be redirected without
    // rebuilding — see the comment block in cli/src/login/constants.ts.
    NEXT_PUBLIC_FREEBUFF_APP_URL: 'http://localhost:3002',
    NEXT_PUBLIC_SUPPORT_EMAIL: 'support@codebuff.com',
    NEXT_PUBLIC_POSTHOG_API_KEY: 'test-posthog-key',
    NEXT_PUBLIC_POSTHOG_HOST_URL: 'https://us.i.posthog.com',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
    NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL:
      'https://billing.stripe.com/p/login/test_placeholder',
    NEXT_PUBLIC_WEB_PORT: '3000',
  },
  test: {
    NEXT_PUBLIC_CB_ENVIRONMENT: 'test',
    NEXT_PUBLIC_CODEBUFF_APP_URL: 'http://localhost:3000',
    // Tests use the same dev port for the freebuff web app; override per
    // test-runner harness via shell env if a different host is required.
    // Note: the runtime env var FREEBUFF_APP_URL (see cli/src/login/constants.ts)
    // also takes precedence over this baked-in value at runtime.
    NEXT_PUBLIC_FREEBUFF_APP_URL: 'http://localhost:3002',
    NEXT_PUBLIC_SUPPORT_EMAIL: 'support@codebuff.com',
    NEXT_PUBLIC_POSTHOG_API_KEY: 'test-posthog-key',
    NEXT_PUBLIC_POSTHOG_HOST_URL: 'https://us.i.posthog.com',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
    NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL:
      'https://billing.stripe.com/p/login/test_placeholder',
    NEXT_PUBLIC_WEB_PORT: '3000',
  },
  prod: {
    NEXT_PUBLIC_CB_ENVIRONMENT: 'prod',
    NEXT_PUBLIC_CODEBUFF_APP_URL: 'https://placeholder.codebuff.com',
    // Prod intentionally has no default — every prod build must set this via
    // .env.freebuff / shell env, otherwise zod validation below will reject
    // the build (z.url() requires a real URL).
    NEXT_PUBLIC_SUPPORT_EMAIL: 'set_at_build_time@example.com',
    // PostHog fields intentionally omitted: freebuff's analytics calls are
    // fire-and-forget, and the posthog-js client silently no-ops when the
    // API key is undefined. The schema below marks them optional so a prod
    // build doesn't need real PostHog credentials. If you ever want real
    // freebuff telemetry, set NEXT_PUBLIC_POSTHOG_API_KEY in .env.freebuff
    // and the host URL falls back to https://us.i.posthog.com below.
    NEXT_PUBLIC_POSTHOG_HOST_URL: 'https://us.i.posthog.com',
    // Stripe fields intentionally omitted: freebuff is ad-supported and has no
    // subscription model, so it never reads NEXT_PUBLIC_STRIPE_*. The schema
    // below marks them optional so a prod build doesn't need real Stripe
    // credentials. If you ever add a paid Freebuff tier, put the keys back.
    NEXT_PUBLIC_WEB_PORT: '3000',
  },
}

/** Minimal KEY=VALUE file parser (no quoting tricks beyond strip-double/single). */
function parseEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!existsSync(path)) return out
  const text = readFileSync(path, 'utf8')
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

/**
 * Parse a URL string into its origin parts, or null if it's not a valid URL.
 * Used by the localhost-vs-remote check below.
 *
 * Default ports are normalized away: `https://x.com:443` and `https://x.com`
 * both return host `x.com`, so explicit default ports in one URL but not the
 * other don't cause a false mismatch.
 */
function parseUrl(url: string): { host: string; hostname: string; protocol: string } | null {
  try {
    const u = new URL(url)
    let host = u.host
    if (
      (u.protocol === 'https:' && host.endsWith(':443')) ||
      (u.protocol === 'http:' && host.endsWith(':80'))
    ) {
      host = host.replace(/:443$/, '').replace(/:80$/, '')
    }
    return { host, hostname: u.hostname, protocol: u.protocol }
  } catch {
    return null
  }
}

/**
 * True if the parsed hostname is a loopback address.
 * MUST be called with `URL.hostname` (port already stripped), not `URL.host`.
 * `https://localhost:3000` → hostname is `localhost` (no port) → true.
 * `https://[::1]:3000`     → hostname is `[::1]` (no port, brackets kept) → true after bracket strip.
 */
function isLocalhost(hostname: string): boolean {
  const bare = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname
  return (
    bare === 'localhost' ||
    bare.startsWith('127.') ||
    bare === '::1' ||
    bare === '0.0.0.0'
  )
}

// 1. Built-in defaults for the requested env
// 2. .env.freebuff overrides (repo root, then cwd)
// 3. Existing process.env wins (CI / shell exports)
const resolved: Record<string, string> = {
  ...BUILTIN_DEFAULTS[targetEnv],
  ...parseEnvFile(join(repoRoot, '.env.freebuff')),
  ...parseEnvFile(join(process.cwd(), '.env.freebuff')),
}
for (const key of Object.keys(resolved)) {
  const fromShell = process.env[key]
  if (fromShell !== undefined && fromShell !== '') {
    resolved[key] = fromShell
  }
}

// Freebuff is ad-supported and has no subscription model, so the Stripe
// fields in clientEnvSchema are never read by freebuff code paths. Make them
// optional for the freebuff build so a prod build doesn't need real Stripe
// credentials. (The base clientEnvSchema is shared with the paid Codebuff CLI,
// which DOES need Stripe — we only relax the requirement here, in the freebuff
// wrapper, where it's safe to do so.)
const freebuffEnvSchema = clientEnvSchema.extend({
  // Stripe: freebuff is ad-supported, never reads these.
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL: z.url().optional(),
  // PostHog: freebuff analytics calls are fire-and-forget; the posthog client
  // silently no-ops with undefined values, so we don't need a real key.
  NEXT_PUBLIC_POSTHOG_API_KEY: z.string().optional(),
})

const parsed = freebuffEnvSchema.safeParse(resolved)
if (!parsed.success) {
  console.error(
    `❌ Freebuff env validation failed for env='${targetEnv}' (schema: clientEnvSchema in common/src/env-schema.ts):`,
  )
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
  }
  console.error(
    `\nProvide values via shell exports, .env.freebuff, or rebuild with env=dev.`,
  )
  process.exit(1)
}

// Warn (or fail) when one of the two backend URLs is a localhost dev URL
// while the other is a real domain. This is the classic "I overrode one URL
// in .env.freebuff but forgot the other" foot-gun: the login flow will
// succeed (it hits the real domain), but every subsequent /api/v1/* call
// after login will fail with "Unable to connect" because it's still
// pointing at a localhost dev server that isn't running.
//
// Note: a legitimate production setup (e.g. NEXT_PUBLIC_FREEBUFF_APP_URL
// = https://freebuff.com and NEXT_PUBLIC_CODEBUFF_APP_URL = https://codebuff.com)
// has *different* hosts on purpose — those are two genuinely different
// services. This check only flags the localhost-vs-real-domain asymmetry,
// NOT all host differences, so it won't false-positive on a correct prod
// build where both URLs point at real (different) domains.
//
// Set FREEBUFF_STRICT_HOST_CHECK=true to make this a fatal error instead
// of a warning — useful in CI to catch a half-configured .env.freebuff
// before it produces a broken binary.
const freebuffUrl = parseUrl(resolved.NEXT_PUBLIC_FREEBUFF_APP_URL ?? '')
const codebuffUrl = parseUrl(resolved.NEXT_PUBLIC_CODEBUFF_APP_URL ?? '')

if (freebuffUrl && codebuffUrl) {
  // Use hostname (port-stripped) not host, otherwise `localhost:3000` would
  // not be recognized as localhost and the original bug wouldn't be caught.
  const freebuffIsLocal = isLocalhost(freebuffUrl.hostname)
  const codebuffIsLocal = isLocalhost(codebuffUrl.hostname)

  if (freebuffIsLocal !== codebuffIsLocal) {
    const localPart = freebuffIsLocal ? freebuffUrl : codebuffUrl
    const realPart = freebuffIsLocal ? codebuffUrl : freebuffUrl
    const localVarName = freebuffIsLocal
      ? 'NEXT_PUBLIC_FREEBUFF_APP_URL'
      : 'NEXT_PUBLIC_CODEBUFF_APP_URL'
    const realVarName = freebuffIsLocal
      ? 'NEXT_PUBLIC_CODEBUFF_APP_URL'
      : 'NEXT_PUBLIC_FREEBUFF_APP_URL'
    const localRaw = freebuffIsLocal
      ? resolved.NEXT_PUBLIC_FREEBUFF_APP_URL
      : resolved.NEXT_PUBLIC_CODEBUFF_APP_URL
    const realRaw = freebuffIsLocal
      ? resolved.NEXT_PUBLIC_CODEBUFF_APP_URL
      : resolved.NEXT_PUBLIC_FREEBUFF_APP_URL

    const msg =
      `⚠️  Mixed localhost/remote backend — almost certainly a half-config:\n` +
      `   ${localVarName}  → ${localRaw}  (loopback, dev only)\n` +
      `   ${realVarName}  → ${realRaw}  (real domain)\n` +
      `   One of these is going to fail to connect. The login flow and the\n` +
      `   post-login API live on different URLs in this binary, so whichever\n` +
      `   is the loopback one will surface as "Unable to connect" on the\n` +
      `   first /api/v1/* call after a successful login.\n` +
      `   Fix: set both URLs to real domains (for a prod build) or both to\n` +
      `   localhost (for a dev build against a local backend).`
    if (process.env.FREEBUFF_STRICT_HOST_CHECK === 'true') {
      console.error(`❌ ${msg}`)
      console.error(
        `   Set FREEBUFF_STRICT_HOST_CHECK=false to allow this anyway.`,
      )
      process.exit(1)
    } else {
      console.warn(msg)
    }
  }
}

console.log(
  `Building Freebuff v${version} (env=${targetEnv}, ${Object.keys(parsed.data).length} NEXT_PUBLIC_* embedded)...`,
)

if (process.platform === 'win32') {
  // Windows-specific: `bun build --compile` fails with EPERM when the existing
  // --outfile is still mapped or otherwise locked. Best-effort unlink any
  // previous binary so re-running the wrapper is idempotent. Failures are
  // non-fatal — if the file is genuinely locked (e.g. a running freebuff.exe),
  // we let the spawn below surface the real error.
  const outfile = join(repoRoot, 'cli', 'bin', 'freebuff.exe')
  try {
    if (existsSync(outfile)) {
      unlinkSync(outfile)
      console.log(`[win32] unlinked stale ${outfile}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(
      `[win32] could not unlink stale ${outfile} (${message}); build may fail with EPERM if the binary is still locked.`,
    )
  }
}

const result = spawnSync(
  'bun',
  ['cli/scripts/build-binary.ts', 'freebuff', version],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      FREEBUFF_MODE: 'true',
      ...parsed.data,
    },
  },
)

if (result.status !== 0) {
  console.error('Freebuff build failed')
  process.exit(result.status ?? 1)
}

console.log(`✅ Freebuff v${version} (env=${targetEnv}) built successfully`)
