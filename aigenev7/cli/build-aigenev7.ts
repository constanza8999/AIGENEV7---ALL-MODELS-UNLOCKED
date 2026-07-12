#!/usr/bin/env bun

/**
 * AIGENEV7 build wrapper.
 *
 * Builds the AIGENEV7 binary using the AIGENEV7 engine, with
 * `FREEBUFF_MODE=true` set at compile time. Produces TWO artifacts, in
 * DIFFERENT directories (so the engine's distributable dir stays pristine):
 *
 *   1. <AIGENEV7_DIR>/dist/cli.mjs  - the bundled ESM (the engine's own
 *                                       `scripts/build.ts` writes it there;
 *                                       this wrapper does not move it).
 *   2. <repoRoot>/dist/<exeName>      - a native executable produced via
 *                                       `bun build --compile`,
 *                                       i.e. codebuff-main/aigenev7/dist/aigenev7.exe
 *                                       (or aigenev7 on non-Windows).
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
 * The AIGENEV7 binary wraps the AIGENEV7 engine: same multi-provider CLI (OpenAI,
 * Gemini, DeepSeek, Ollama, 200+ models), but the CLI name, terminal title,
 * brand constants, and developer attribution use "AIGENEV7"/"aigenev7" with
 * "developed by CONSTANZA (José Jaime Juliá)" in --help.
 *
 * Usage:
 *   bun aigenev7/cli/build-aigenev7.ts [version]            # build only
 *   bun aigenev7/cli/build-aigenev7.ts [version] --no-exe   # skip the exe step
 *
 * Env overrides:
 *   AIGENEV7_DIR    - path to the aigenev7 checkout (default: sibling at
 *                       the user's Desktop)
 *   AIGENEV7_TARGET     - bun compile target (default: auto-detected from
 *                       process.platform/process.arch, e.g. bun-windows-x64)
 *   AIGENEV7_EXE_NAME   - output filename (default: aigenev7[.exe])
 *
 * The standalone exe is the deliverable for "build the whole app as an
 * installer-ready binary" workflows. The ESM is the deliverable for the npm
 * tarball (which the existing aigenev7/cli/release.ts workflow packages).
 */

import { spawnSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

// Resolve the script's own location AND its parent (aigenev7/) as absolute
// paths. Using `join(__dirname, '..', '..')` earlier produced a relative
// path that depended on the spawning process's cwd, which silently broke
// `aigenev7DistDir` (the new code) and the aigenev7 lookup (worked by
// accident). `resolve()` makes both absolute and cwd-independent.
const __dirname = resolve(dirname(fileURLToPath(import.meta.url)))
const repoRoot = resolve(__dirname, '..') // aigenev7/ (parent of cli/)

const args = process.argv.slice(2)
const skipExe = args.includes('--no-exe')
const positional = args.filter((a) => !a.startsWith('--'))
const version = positional[0] ?? '0.0.0-dev'

// ---------------------------------------------------------------------------
// 1. Resolve AIGENEV7 engine location
// ---------------------------------------------------------------------------

const aigenev7Dir = process.env.AIGENEV7_DIR
  ? resolve(process.env.AIGENEV7_DIR)
  : resolve(repoRoot, '..', '..', '..', 'aigenev7-0.22.0')

if (!existsSync(aigenev7Dir)) {
  console.error(
    `❌ AIGENEV7 engine not found at ${aigenev7Dir}\n` +
      `   Set AIGENEV7_DIR to the path of an aigenev7 checkout, or place\n` +
      `   it at C:\\Users\\josej\\Desktop\\aigenev7-0.22.0.`,
  )
  process.exit(1)
}

const buildScript = join(aigenev7Dir, 'scripts', 'build.ts')
if (!existsSync(buildScript)) {
  console.error(
    `❌ AIGENEV7 build script not found at ${buildScript}\n` +
      `   The engine checkout looks incomplete. Re-clone or fix AIGENEV7_DIR.`,
  )
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 2. Run the AIGENEV7 build (bundles to dist/cli.mjs with FREEBUFF_MODE=true)
// ---------------------------------------------------------------------------

console.log(
  `[1/2] Building AIGENEV7 v${version} (engine: AIGENEV7 at ${aigenev7Dir})...`,
)

const buildResult = spawnSync('bun', ['run', 'scripts/build.ts'], {
  cwd: aigenev7Dir,
  stdio: 'inherit',
  env: {
    ...process.env,
    FREEBUFF_MODE: 'true',
  },
})

if (buildResult.status !== 0) {
  console.error('AIGENEV7 build failed')
  process.exit(buildResult.status ?? 1)
}

const distFile = join(aigenev7Dir, 'dist', 'cli.mjs')
if (!existsSync(distFile)) {
  console.error(
    `❌ Build reported success but ${distFile} was not produced. ` +
      `Check the AIGENEV7 build log above.`,
  )
  process.exit(1)
}

console.log(`✅ AIGENEV7 v${version} ESM bundle built: ${distFile}`)

// ---------------------------------------------------------------------------
// 2b. Run `bun install` in the AIGENEV7 directory.
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
  `\n[2b] Running 'bun install' in ${aigenev7Dir} to make sure all transitive deps are resolvable for the standalone exe bundle...`,
)

const installResult = spawnSync('bun', ['install'], {
  cwd: aigenev7Dir,
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
// the AIGENEV7 build, with all build-time plugins (productionReact,
// featureFlagPreprocess, etc.) already applied. Re-compiling from the
// TypeScript source would skip those plugins and is not what we want.

function detectBunTarget(): string {
  if (process.env.AIGENEV7_TARGET) return process.env.AIGENEV7_TARGET
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
        `Set AIGENEV7_TARGET explicitly (e.g. bun-windows-x64, bun-linux-x64).`,
    )
  }
  return t
}

function defaultExeName(): string {
  if (process.env.AIGENEV7_EXE_NAME) return process.env.AIGENEV7_EXE_NAME
  return process.platform === 'win32' ? 'aigenev7.exe' : 'aigenev7'
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
 * Why the stubbed file lives in the engine's dist/ tree (not aigenev7/):
 * `bun build --compile` walks up from the entry point looking for
 * `node_modules/`. If the entry is outside aigenev7's tree, the
 * resolver can't reach aigenev7's node_modules and fails to resolve
 * even the non-stubbed imports. So the stubbed bundle MUST be inside
 * the aigenev7 dir tree for resolution to work.
 *
 * The stubbed file is written to `<aigenev7Dir>/dist/.aigenev7-stub/`
 * — a hidden subdir (the leading `.` keeps it out of casual `ls`; the
 * `aigenev7-stub` name makes the purpose explicit) that is cleaned up
 * after the build via the returned `cleanup` function (callers should
 * use `try { ... } finally { cleanup() }`).
 *
 * Returns `{ entryPath, cleanup }`. `entryPath` is ready to be passed
 * to `bun build --compile`. `cleanup` removes the stubbed file and
 * the .aigenev7-stub/ dir; safe to call on success or failure.
 */
function stubProblemImportsInBundle(): { entryPath: string; cleanup: () => void } {
  const originalDist = resolve(aigenev7Dir, 'dist', 'cli.mjs')
  const stubDir = resolve(aigenev7Dir, 'dist', '.aigenev7-stub')
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
    return `Promise.resolve({ /* ${pkg} stubbed in AIGENEV7 exe — Bedrock/Vertex/Orama features disabled */ })`
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
        // happen, but be defensive). The .aigenev7-stub/ prefix keeps
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

// Output path: <repoRoot>/dist/<exeName>, i.e. codebuff-main/aigenev7/dist/aigenev7.exe.
// We deliberately keep the AIGENEV7 dist/ directory's MAIN contents pristine
// (the engine's distributable artifacts: dist/cli.mjs, dist/sdk.mjs). The
// only AIGENEV7-owned file that lands in the engine's tree is the transient
// stubbed bundle in `dist/.aigenev7-stub/` (hidden subdir; cleaned up after
// the build). See stubProblemImportsInBundle() for why it has to live there.
const aigenev7DistDir = resolve(repoRoot, 'dist')
const exePath = join(aigenev7DistDir, exeName)

mkdirSync(aigenev7DistDir, { recursive: true })

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
// didn't get to its own cleanup step. Same for any orphan `cli-aigenev7.mjs`
// the old pre-rename code path might have left behind in the engine's dist/.
for (const stale of [
  resolve(aigenev7Dir, 'dist', '.aigenev7-stub', 'cli-stubbed.mjs'),
  resolve(aigenev7Dir, 'dist', 'cli-aigenev7.mjs'),
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
  `\n[2/2] Compiling AIGENEV7 v${version} to native exe (target: ${bunTarget})...`,
)

const compileStart = Date.now()

// Post-process dist/cli.mjs to remove dynamic imports of packages whose
// layout bun's static resolver can't traverse cleanly (@aws-sdk, @orama,
// google-auth-library). This is the only path that actually works:
// --external alone doesn't suppress bun's static resolve check,
// --no-bundle isn't valid with --compile, and pre-bundling with esbuild
// would duplicate the build pipeline. The stubbed file is written to
// <aigenev7Dir>/dist/.aigenev7-stub/ so bun's resolver can walk up and
// find aigenev7/node_modules/ — the location is load-bearing for
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
      // <repoRoot>/dist/ (codebuff-main/aigenev7/dist/) instead of the engine's
      // own dist/. See the aigenev7DistDir definition above for the rationale.
      `--outfile=${exePath}`,
    ],
    {
      cwd: aigenev7Dir,
      stdio: 'inherit',
    },
  )
} finally {
  // Always clean up the stubbed bundle, regardless of compile success.
  stubCleanup()
}

if (compileResult.status !== 0) {
  console.error('AIGENEV7 exe compilation failed')
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
  `\n✅ AIGENEV7 v${version} standalone exe built in ${elapsedSec}s (${sizeMB} MB)`,
)
console.log(`   Binary:  ${exePath}`)
console.log(`   Target:  ${bunTarget}`)
console.log(
  `   Brand:   AIGENEV7 — developed by CONSTANZA (José Jaime Juliá)\n` +
    `            (CLI: 'aigenev7', process.title: 'aigenev7', BRAND_NAME: 'AIGENEV7')`,
)
console.log(
  `\nTry it: ${exePath} --version\n` +
    `         ${exePath} --help  | head -5\n` +
    `\nNext: package into the npm tarball via\n` +
    `  bun aigenev7/cli/release/build.ts ${version}`,
)
