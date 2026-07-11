#!/usr/bin/env bun

/**
 * Freebuff CLI release script.
 *
 * Triggers the freebuff-release.yml GitHub Actions workflow
 * to build, publish, and release the Freebuff CLI to npm.
 *
 * Usage:
 *   bun freebuff/cli/release.ts [patch|minor|major] [--ref <commit-sha>] [--env dev|prod]
 *
 * Defaults to a PRODUCTION build (env=prod) so a release ship never accidentally
 * bakes dev placeholders (test Stripe keys, __SET_AT_BUILD_TIME__ values, etc.)
 * into the published npm tarball. Use --env dev to deliberately publish a dev build.
 *
 * Requires:
 *   CODEBUFF_GITHUB_TOKEN environment variable
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..', '..')

const args = process.argv.slice(2)

let versionType = 'patch'
let checkoutRef = ''
let targetEnv = 'prod'

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--ref' && args[i + 1]) {
    checkoutRef = args[i + 1]
    i++
  } else if (args[i] === '--env' && args[i + 1]) {
    targetEnv = args[i + 1]
    i++
  } else if (!args[i].startsWith('--')) {
    versionType = args[i]
  }
}

if (!['dev', 'test', 'prod'].includes(targetEnv)) {
  error(`Invalid --env '${targetEnv}'. Must be one of: dev, test, prod.`)
}

if (targetEnv === 'prod') {
  // Failsafe check: when building for prod, the wrapper needs real Stripe/PostHog values
  // (its prod defaults are obvious placeholders). On CI these come from secrets; during
  // local script runs we look for `.env.freebuff` at the same two paths the wrapper
  // reads from (repoRoot and cwd) so the warning matches what the wrapper would actually
  // pick up.
  const hasLocalEnv =
    existsSync(join(repoRoot, '.env.freebuff')) ||
    existsSync(join(process.cwd(), '.env.freebuff'))
  if (!hasLocalEnv) {
    log(
      '⚠️  WARNING: --env prod selected, but no .env.freebuff found locally.',
    )
    log(
      '   On CI this is fine (secrets are injected); locally the build will fail',
    )
    log(
      '   unless you curl copy `.env.freebuff.example` to `.env.freebuff`.',
    )
  }
}

function log(message: string) {
  console.log(`${message}`)
}

function error(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function formatTimestamp() {
  const now = new Date()
  const options = {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  } as const
  return now.toLocaleDateString('en-US', options)
}

function checkGitHubToken() {
  const token = process.env.CODEBUFF_GITHUB_TOKEN
  if (!token) {
    error(
      'CODEBUFF_GITHUB_TOKEN environment variable is required but not set.\n' +
        'Please set it with your GitHub personal access token or use the infisical setup.',
    )
  }

  process.env.GITHUB_TOKEN = token
  return token
}

async function triggerWorkflow(
  versionType: string,
  checkoutRef: string,
  targetEnv: string,
) {
  if (!process.env.GITHUB_TOKEN) {
    error('GITHUB_TOKEN environment variable is required but not set')
  }

  try {
    const inputs: Record<string, string> = {
      version_type: versionType,
      target_env: targetEnv,
    }
    if (checkoutRef) {
      inputs.checkout_ref = checkoutRef
    }
    const payload = JSON.stringify({ ref: 'main', inputs })

    const triggerCmd = `curl -s -w "HTTP Status: %{http_code}" -X POST \
      -H "Accept: application/vnd.github.v3+json" \
      -H "Authorization: token ${process.env.GITHUB_TOKEN}" \
      -H "Content-Type: application/json" \
      https://api.github.com/repos/CodebuffAI/freebuff-private/actions/workflows/freebuff-release.yml/dispatches \
      -d '${payload}'`

    const response = execSync(triggerCmd, { encoding: 'utf8' })

    if (response.includes('workflow_dispatch')) {
      log(`⚠️  Workflow dispatch failed: ${response}`)
      log(
        'Please manually trigger the workflow at: https://github.com/CodebuffAI/freebuff-private/actions/workflows/freebuff-release.yml',
      )
    } else {
      log('🎉 Freebuff release workflow triggered!')
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    log(`⚠️  Failed to trigger workflow automatically: ${message}`)
    log(
      'You may need to trigger it manually at: https://github.com/CodebuffAI/freebuff-private/actions/workflows/freebuff-release.yml',
    )
  }
}

async function main() {
  log('🚀 Initiating Freebuff release...')
  log(`Date: ${formatTimestamp()}`)

  checkGitHubToken()
  log('✅ Using local CODEBUFF_GITHUB_TOKEN')

  log(`Version bump type: ${versionType}`)
  log(`Target environment: ${targetEnv} (passes through to workflow as target_env)`)
  if (checkoutRef) {
    log(`Building from ref: ${checkoutRef}`)
  }

  await triggerWorkflow(versionType, checkoutRef, targetEnv)

  log('')
  log(
    'Monitor progress at: https://github.com/CodebuffAI/freebuff-private/actions/workflows/freebuff-release.yml',
  )
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  error(`Release failed: ${message}`)
})
