# Debug Agent

AIGENEV7 includes an **auto-debug agent** that automatically detects errors, analyzes them with AI, applies fixes, and retries — all without human intervention.

## Overview

The Debug Agent works in a loop:
1. **Run** the command
2. **Capture** errors (exit code, stdout, stderr)
3. **Analyze** with AI model
4. **Apply** suggested fixes
5. **Retry** the command
6. **Repeat** until success or max iterations reached

## Usage

### Via CLI Command

```bash
# Debug a build command
/debug bun run build

# Debug with specific model
/debug --model deepseek-v4-pro npm test

# Debug a Python script
/debug python app.py
```

### Via API

```javascript
import { runDebugLoop } from './debug-agent.js'

const result = await runDebugLoop({
  command: 'bun run build',
  model: 'deepseek-v4-pro',
  cwd: '/path/to/project',
  maxIterations: 5,
  onStatus: (msg) => console.log(msg),
})

console.log(result)
// {
//   success: true,
//   fixApplied: true,
//   iterations: 2,
//   changes: [
//     { type: 'edit', path: 'src/app.ts' }
//   ],
//   summary: 'Fixed in 2 iteration(s). 1 file(s) modified.',
//   exitCode: 0
// }
```

## How It Works

### Example: Fixing a TypeScript Build Error

```
⚙️ Running: bun run build
🔴 Command failed (exit 1). Starting auto-debug loop...

🔍 Debug iteration 1/5
  📖 Reading error output...
  🤖 AI analyzing...
  ✏️ Applied fix: Edited src/app.ts
  ⚙️ Re-running: bun run build
  🔴 Still failing (exit 1)

🔍 Debug iteration 2/5
  📖 Reading error output...
  🤖 AI analyzing...
  ✏️ Applied fix: Edited src/utils.ts
  ⚙️ Re-running: bun run build
  ✅ Command succeeded after fix!
```

### Decision Flow

```
┌─────────────────────────────────────┐
│         Run Command                 │
│         (e.g., bun run build)       │
└──────────────┬──────────────────────┘
               │
        ┌──────▼──────┐
        │   Success?   │
        └──────┬──────┘
         Yes ──┤── No
         │     │
         ▼     ▼
    ┌────────┐ ┌─────────────────────┐
    │  Done! │ │ Capture Error       │
    └────────┘ │ (exit code, stderr) │
               └──────────┬──────────┘
                          │
               ┌──────────▼──────────┐
               │ AI Analyzes Error   │
               │ (suggests fix)      │
               └──────────┬──────────┘
                          │
               ┌──────────▼──────────┐
               │ Apply Fix           │
               │ (WRITE or EDIT)     │
               └──────────┬──────────┘
                          │
               ┌──────────▼──────────┐
               │ Re-run Command      │
               └──────────┬──────────┘
                          │
                  ┌───────▼───────┐
                  │ More Iterations?│
                  └───────┬───────┘
                   Yes ───┤─── No
                   │      │
                   ▼      ▼
              (loop)   Max Reached
```

## Configuration

### Max Iterations

Default: **5 attempts**. Customize via API:

```javascript
const result = await runDebugLoop({
  command: '...',
  maxIterations: 10, // Increase for complex issues
})
```

### Timeout

- Command timeout: **60 seconds**
- Buffer size: **2MB** for stdout/stderr

### Supported Commands

| Platform | Shell | Example |
|----------|-------|---------|
| Windows | cmd.exe | `bun run build` |
| macOS/Linux | /bin/bash | `npm test` |

## Features

### ✅ What It Does

- **Automatic error detection** — Captures exit codes, stdout, stderr
- **AI-powered analysis** — Understands error context and root causes
- **Minimal fixes** — Only changes what's necessary
- **Retry loop** — Automatically re-runs after fixes
- **Progress tracking** — Shows iteration count and status

### 🛡️ Safety

- **Timeout protection** — Commands timeout after 60 seconds
- **Buffer limits** — Large outputs are truncated
- **No infinite loops** — Max iterations enforced
- **Read before edit** — AI reads files before suggesting changes

### 🔧 Fix Types

The Debug Agent can apply two types of fixes:

**WRITE** — Create or overwrite a file:
```
[WRITE: src/config.ts]
export const config = {
  port: 3000,
  debug: false
}
```

**EDIT** — Find and replace text:
```
[EDIT: src/app.ts]
OLD:   const port = 8080
NEW:   const port = 3000
```

## Use Cases

### Build Errors

```bash
/debug bun run build
/debug npm run build
/debug cargo build
```

### Test Failures

```bash
/debug bun test
/debug pytest
/debug go test ./...
```

### Lint Errors

```bash
/debug bun run lint
/debug eslint src/
/debug ruff check .
```

### Script Failures

```bash
/debug python migrate.py
/debug node scripts/deploy.js
```

## Integration Tests

Run the Debug Agent integration tests:

```bash
bun test freebuff/debug-agent-integration.test.js
```

## API Reference

### `runDebugLoop(opts)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `command` | string | (required) | Command to run |
| `model` | string | current | AI model ID |
| `cwd` | string | `process.cwd()` | Working directory |
| `maxIterations` | number | `5` | Max fix attempts |
| `onStatus` | function | no-op | Status callback |
| `onChunk` | function | no-op | Stream callback |

### Return Value

```javascript
{
  success: boolean,        // Whether command eventually succeeded
  fixApplied: boolean,     // Whether any files were modified
  iterations: number,      // Number of debug iterations
  changes: Array,          // Files that were modified
  summary: string,         // Human-readable summary
  output: string,          // Final command output
  exitCode: number,        // Final exit code
  gaveUp: boolean,         // AI couldn't determine fix (optional)
  maxedOut: boolean,       // Hit max iterations (optional)
}
```

---

*See [Auto Agent](Auto-Agent) for the full autonomous coding agent and [Commands](Commands) for all CLI commands.*
