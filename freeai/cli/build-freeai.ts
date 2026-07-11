#!/usr/bin/env bun

/**
 * FreeAI build wrapper.
 *
 * Builds the FreeAI binary using OpenClaude as the runtime engine, with
 * `FREEBUFF_MODE=true` set at compile time. Produces TWO artifacts, in
 * DIFFERENT directories (so the engine's distributable dir stays pristine):
 *
 *   1. <OPENCLAUDE_DIR>/dist/cli.mjs  - the bundled ESM (the engine's own
 *                                       `scripts/build.ts` writes it there;
 *                                       this wrapper does not move it).
 *   2. <repoRoot>/dist/<exeName>      - a native executable produced via
 *                                       `bun build --compile`,
 *                                       i.e. codebuff-main/freeai/dist/freeai.exe
 *                                       (or freeai on non-Windows).
 *
 *                                       NOTE: the exe is bundled but the
 *                                       AWS SDK v3, Orama, and Google auth
 *                                       packages are stubbed (the bundled
 *                                       bundle's `import("@aws-sdk/...")`,
 *                                       `import("@orama/...")`, and
 *                                       `import("google-auth-library")`
 *                                       calls are rewritten to
 *                                       `Promise.resolve({})` before
 *                                       compilation). This works around
 *                                       upstream bun static-resolution
 *                                       incompatibilities with those
 *                                       packages' complex `exports` layouts.
 *                                       Trade-off: the Bedrock, Vertex AI,
 *                                       and Orama search features are
 *                                       disabled in the compiled exe.
 *                                       Every other provider works. See
 *                                       `stubProblemImportsInBundle` below.
 *
 * The FreeAI binary is a rebranded OpenClaude: same multi-provider CLI (OpenAI,
 * Gemini, DeepSeek, Ollama, 200+ models), but the CLI name, terminal title,
 * brand constants, and developer attribution switch to "FreeAI"/"freeai" with
 * "developed by CONSTANZA (José Jaime Juliá)" in --help.
 *
 * Usage:
 *   bun freeai/cli/build-freeai.ts [version]            # build only
 *   bun freeai/cli/build-freeai.ts [version] --no-exe   # skip the exe step
 *
 * Env overrides:
 *   OPENCLAUDE_DIR    - path to the openclaude checkout (default: sibling at
 *                       the user's Desktop)
 *   FREEAI_TARGET     - bun compile target (default: auto-detected from
 *                       process.platform/process.arch, e.g. bun-windows-x64)
 *   FREEAI_EXE_NAME   - output filename (default: freeai[.exe])
 *
 * The standalone exe is the deliverable for "build the whole app as an
 * installer-ready binary" workflows. The ESM is the deliverable for the npm
 * tarball (which the existing freeai/cli/release.ts workflow packages).
 */

import { spawnSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

// Resolve the script's own location AND its parent (freeai/) as absolute
// paths. Using `join(__dirname, '..', '..')` earlier produced a relative
// path that depended on the spawning process's cwd, which silently broke
// `freeaiDistDir` (the new code) and the openclaude lookup (worked by
// accident). `resolve()` makes both absolute and cwd-independent.
const __dirname = resolve(dirname(fileURLToPath(import.meta.url)))
const repoRoot = resolve(__dirname, '..') // freeai/ (parent of cli/)

const args = process.argv.slice(2)
const skipExe = args.includes('--no-exe')
const positional = args.filter((a) => !a.startsWith('--'))
const version = positional[0] ?? '0.0.0-dev'

// ---------------------------------------------------------------------------
// 1. Resolve OpenClaude engine location
// ---------------------------------------------------------------------------

const openclaudeDir = process.env.OPENCLAUDE_DIR
  ? resolve(process.env.OPENCLAUDE_DIR)
  : resolve(repoRoot, '..', '..', '..', 'openclaude-0.22.0')

if (!existsSync(openclaudeDir)) {
  console.error(
    `❌ OpenClaude engine not found at ${openclaudeDir}\n` +
      `   Set OPENCLAUDE_DIR to the path of an openclaude checkout, or place\n` +
      `   it at C:\\Users\\josej\\Desktop\\openclaude-0.22.0.`,
  )
  process.exit(1)
}

const buildScript = join(openclaudeDir, 'scripts', 'build.ts')
if (!existsSync(buildScript)) {
  console.error(
    `❌ OpenClaude build script not found at ${buildScript}\n` +
      `   The engine checkout looks incomplete. Re-clone or fix OPENCLAUDE_DIR.`,
  )
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 2. Run the OpenClaude build (bundles to dist/cli.mjs with FREEBUFF_MODE=true)
// ---------------------------------------------------------------------------

console.log(
  `[1/2] Building FreeAI v${version} (engine: OpenClaude at ${openclaudeDir})...`,
)

const buildResult = spawnSync('bun', ['run', 'scripts/build.ts'], {
  cwd: openclaudeDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    FREEBUFF_MODE: 'true',
  },
})

if (buildResult.status !== 0) {
  console.error('FreeAI build failed')
  process.exit(buildResult.status ?? 1)
}

const distFile = join(openclaudeDir, 'dist', 'cli.mjs')
if (!existsSync(distFile)) {
  console.error(
    `❌ Build reported success but ${distFile} was not produced. ` +
      `Check the OpenClaude build log above.`,
  )
  process.exit(1)
}

console.log(`✅ FreeAI v${version} ESM bundle built: ${distFile}`)

// ---------------------------------------------------------------------------
// 2b. Run `bun install` in the OpenClaude directory.
//
// `bun build --compile` re-analyzes the entry point and tries to resolve
// every import, including ones that scripts/build.ts marked `external` for
// the Node launcher case (Anthropic SDK, AWS SDK, React, Ink, Zod, Axios,
// ~50 npm packages total). For a *truly standalone* exe those externals
// must be bundled, not left as runtime requires. That requires the
// transitive deps to be physically present in `node_modules` so the
// bundler can walk them. A fresh `bun install` is the safe way to make
// sure every transitive dep (e.g. @aws-sdk/client-sts, which is a
// sub-dep of @anthropic-ai/bedrock-sdk) is resolvable.
//
// Idempotent: bun's installer is incremental and fast on no-op runs.
// ---------------------------------------------------------------------------

console.log(
  `\n[2b] Running 'bun install' in ${openclaudeDir} to make sure all transitive deps are resolvable for the standalone exe bundle...`,
)

const installResult = spawnSync('bun', ['install'], {
  cwd: openclaudeDir,
  stdio: 'inherit',
})

if (installResult.status !== 0) {
  console.error("'bun install' failed; cannot continue to exe compilation")
  process.exit(installResult.status ?? 1)
}

if (skipExe) {
  console.log(
    `\n--no-exe passed: skipping standalone exe compilation. Bundle only.`,
  )
  process.exit(0)
}

// ---------------------------------------------------------------------------
// 3. Compile the bundled ESM to a standalone native exe via `bun build --compile`
// ---------------------------------------------------------------------------
//
// `bun build --compile` re-analyzes the entry point and bundles all reachable
// code (including what scripts/build.ts marked as `external` for the Node
// launcher) into a single self-contained binary. The resulting exe does not
// require Node or node_modules at runtime — the Bun runtime is embedded.
//
// The `dist/cli.mjs` is the correct entry: it's the fully-bundled output of
// the OpenClaude build, with all build-time plugins (productionReact,
// featureFlagPreprocess, etc.) already applied. Re-compiling from the
// TypeScript source would skip those plugins and is not what we want.

function detectBunTarget(): string {
  if (process.env.FREEAI_TARGET) return process.env.FREEAI_TARGET
  const platform = process.platform
  const arch = process.arch
  const map: Record<string, Record<string, string>> = {
    win32: { x64: 'bun-windows-x64', arm64: 'bun-windows-arm64' },
    darwin: { x64: 'bun-darwin-x64', arm64: 'bun-darwin-arm64' },
    linux: { x64: 'bun-linux-x64', arm64: 'bun-linux-arm64' },
  }
  const t = map[platform]?.[arch]
  if (!t) {
    throw new Error(
      `Unsupported platform/arch: ${platform}-${arch}. ` +
        `Set FREEAI_TARGET explicitly (e.g. bun-windows-x64, bun-linux-x64).`,
    )
  }
  return t
}

function defaultExeName(): string {
  if (process.env.FREEAI_EXE_NAME) return process.env.FREEAI_EXE_NAME
  return process.platform === 'win32' ? 'freeai.exe' : 'freeai'
}

/**
 * Post-process dist/cli.mjs to replace every dynamic import of a package
 * whose layout bun's static resolver can't traverse cleanly, with a
 * `Promise.resolve({})` stub. This is the only way to get
 * `bun build --compile` to finish without dragging in those packages'
 * dep trees at compile time.
 *
 * Packages covered:
 *   @aws-sdk/*          - AWS SDK v3 (Bedrock provider). Complex
 *                          `exports` field layout that bun's static
 *                          resolver doesn't traverse.
 *   @orama/*            - Orama search engine (vector search used by
 *                          Bedrock). Same bundler-compat issue.
 *   google-auth-library - Google Cloud auth (Vertex AI provider).
 *
 * Why this is the only path that works: --external flags don't help
 * (bun's resolve check still runs before the external decision),
 * --no-bundle isn't a valid combo with --compile, and pre-bundling
 * with esbuild would duplicate the build pipeline.
 *
 * Trade-off: the compiled exe can't use the Bedrock, Vertex AI, or
 * Orama-search features (imports resolve to empty objects). Every other
 * provider (OpenAI, Anthropic, Gemini, DeepSeek, Ollama, OpenRouter)
 * works normally. The original dist/cli.mjs is left intact for users
 * who want the un-stubbed .mjs.
 *
 * Why the stubbed file lives in the engine's dist/ tree (not freeai/):
 * `bun build --compile` walks up from the entry point looking for
 * `node_modules/`. If the entry is outside openclaude's tree, the
 * resolver can't reach openclaude's node_modules and fails to resolve
 * even the non-stubbed imports. So the stubbed bundle MUST be inside
 * the openclaude dir tree for resolution to work.
 *
 * The stubbed file is written to `<openclaudeDir>/dist/.freeai-stub/`
 * — a hidden subdir (the leading `.` keeps it out of casual `ls`; the
 * `freeai-stub` name makes the purpose explicit) that is cleaned up
 * after the build via the returned `cleanup` function (callers should
 * use `try { ... } finally { cleanup() }`).
 *
 * Returns `{ entryPath, cleanup }`. `entryPath` is ready to be passed
 * to `bun build --compile`. `cleanup` removes the stubbed file and
 * the .freeai-stub/ dir; safe to call on success or failure.
 */
function stubProblemImportsInBundle(): { entryPath: string; cleanup: () => void } {
  const originalDist = resolve(openclaudeDir, 'dist', 'cli.mjs')
  const stubDir = resolve(openclaudeDir, 'dist', '.freeai-stub')
  const stubbedDist = join(stubDir, 'cli-stubbed.mjs')
  const source = readFileSync(originalDist, 'utf8')

  // Match dynamic imports for the problem packages. Captures the full
  // specifier as a breadcrumb. Handles double, single, and backtick
  // quote styles (Bun sometimes emits backticks in template-literal
  // contexts). The `google-auth-library` alternation allows an optional
  // subpath so e.g. `google-auth-library/build/src/auth/googleauth.js`
  // also gets stubbed if it ever appears dynamically.
  const stubPattern =
    /import\(["'`]((?:@aws-sdk|@orama)\/[^"'`]+|google-auth-library(?:\/[^"'`]+)?)["'`]\)/g
  let stubCount = 0
  const stubbed = source.replace(stubPattern, (_match, pkg) => {
    stubCount++
    return `Promise.resolve({ /* ${pkg} stubbed in FreeAI exe — Bedrock/Vertex/Orama features disabled */ })`
  })

  if (stubCount === 0) {
    console.log(
      `  ℹ️  No @aws-sdk/@orama/google-auth-library dynamic imports found in the bundle; nothing to stub.`,
    )
    return { entryPath: originalDist, cleanup: () => {} }
  }

  // Match the existing unlinkSync pattern: wrap in try/catch so a
  // Windows EPERM (or any other fs error) on the stubbed file is
  // surfaced cleanly. If the write fails, fall back to compiling the
  // original dist (which will likely also fail — but at least with the
  // original error message instead of a misleading post-process error).
  try {
    mkdirSync(stubDir, { recursive: true })
    writeFileSync(stubbedDist, stubbed, 'utf8')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(
      `⚠️  Could not write stubbed bundle to ${stubbedDist} (${message}); falling back to original ${originalDist}.`,
    )
    return { entryPath: originalDist, cleanup: () => {} }
  }

  console.log(
    `  🔧 Stubbed ${stubCount} @aws-sdk/@orama/google-auth-library dynamic import(s); writing ${stubbedDist}`,
  )

  const cleanup = () => {
    if (existsSync(stubbedDist)) {
      try {
        unlinkSync(stubbedDist)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.warn(
          `  ⚠️  Cleanup of ${stubbedDist} failed (${message}); safe to delete manually.`,
        )
        return
      }
    }
    if (existsSync(stubDir)) {
      try {
        rmdirSync(stubDir)
      } catch (err) {
        // ENOTEMPTY means the dir has leftover content (shouldn't
        // happen, but be defensive). The .freeai-stub/ prefix keeps
        // it out of any normal `ls` or git tracking, so leaving it
        // in place is harmless. Any other error (EPERM, EBUSY, etc.)
        // is worth surfacing.
        const code = (err as NodeJS.ErrnoException).code
        if (code !== 'ENOTEMPTY') {
          const message = err instanceof Error ? err.message : String(err)
          console.warn(
            `  ⚠️  Cleanup of ${stubDir} failed (${message}); safe to delete manually.`,
          )
        }
      }
    }
  }

  return { entryPath: stubbedDist, cleanup }
}

const bunTarget = detectBunTarget()
const exeName = defaultExeName()

// Output path: <repoRoot>/dist/<exeName>, i.e. codebuff-main/freeai/dist/freeai.exe.
// We deliberately keep the OpenClaude dist/ directory's MAIN contents pristine
// (the engine's distributable artifacts: dist/cli.mjs, dist/sdk.mjs). The
// only FreeAI-owned file that lands in the engine's tree is the transient
// stubbed bundle in `dist/.freeai-stub/` (hidden subdir; cleaned up after
// the build). See stubProblemImportsInBundle() for why it has to live there.
const freeaiDistDir = resolve(repoRoot, 'dist')
const exePath = join(freeaiDistDir, exeName)

mkdirSync(freeaiDistDir, { recursive: true })

// Best-effort unlink of any previous build so re-runs are idempotent.
// On Windows, bun --compile fails with EPERM if the target exe is locked.
try {
  if (existsSync(exePath)) unlinkSync(exePath)
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(
    `⚠️  Could not unlink stale ${exePath} (${message}); build may fail with EPERM if the file is locked.`,
  )
}

// Clean up any stale stubbed bundle from a previous failed run that
// didn't get to its own cleanup step. Same for any orphan `cli-freeai.mjs`
// the old pre-rename code path might have left behind in the engine's dist/.
for (const stale of [
  resolve(openclaudeDir, 'dist', '.freeai-stub', 'cli-stubbed.mjs'),
  resolve(openclaudeDir, 'dist', 'cli-freeai.mjs'),
]) {
  try {
    if (existsSync(stale)) {
      unlinkSync(stale)
      console.log(`  🧹 Cleaned up stale ${stale}`)
    }
  } catch {
    /* best-effort */
  }
}

console.log(
  `\n[2/2] Compiling FreeAI v${version} to native exe (target: ${bunTarget})...`,
)

const compileStart = Date.now()

// Post-process dist/cli.mjs to remove dynamic imports of packages whose
// layout bun's static resolver can't traverse cleanly (@aws-sdk, @orama,
// google-auth-library). This is the only path that actually works:
// --external alone doesn't suppress bun's static resolve check,
// --no-bundle isn't valid with --compile, and pre-bundling with esbuild
// would duplicate the build pipeline. The stubbed file is written to
// <openclaudeDir>/dist/.freeai-stub/ so bun's resolver can walk up and
// find openclaude/node_modules/ — the location is load-bearing for
// resolution to work.
const { entryPath: exeEntry, cleanup: stubCleanup } = stubProblemImportsInBundle()

let compileResult: ReturnType<typeof spawnSync>
try {
  compileResult = spawnSync(
    'bun',
    [
      'build',
      '--compile',
      `--target=${bunTarget}`,
      exeEntry,
      // Absolute outfile path: write the compiled exe into
      // <repoRoot>/dist/ (codebuff-main/freeai/dist/) instead of the engine's
      // own dist/. See the freeaiDistDir definition above for the rationale.
      `--outfile=${exePath}`,
    ],
    {
      cwd: openclaudeDir,
      stdio: 'inherit',
    },
  )
} finally {
  // Always clean up the stubbed bundle, regardless of compile success.
  stubCleanup()
}

if (compileResult.status !== 0) {
  console.error('FreeAI exe compilation failed')
  process.exit(compileResult.status ?? 1)
}

if (!existsSync(exePath)) {
  console.error(
    `❌ bun build --compile reported success but ${exePath} was not produced.`,
  )
  process.exit(1)
}

const sizeMB = (statSync(exePath).size / 1024 / 1024).toFixed(1)
const elapsedSec = ((Date.now() - compileStart) / 1000).toFixed(1)

console.log(
  `\n✅ FreeAI v${version} standalone exe built in ${elapsedSec}s (${sizeMB} MB)`,
)
console.log(`   Binary:  ${exePath}`)
console.log(`   Target:  ${bunTarget}`)
console.log(
  `   Brand:   FreeAI — developed by CONSTANZA (José Jaime Juliá)\n` +
    `            (CLI: 'freeai', process.title: 'freeai', BRAND_NAME: 'FreeAI')`,
)
console.log(
  `\nTry it: ${exePath} --version\n` +
    `         ${exePath} --help  | head -5\n` +
    `\nNext: package into the npm tarball via\n` +
    `  bun freeai/cli/release/build.ts ${version}`,
)
