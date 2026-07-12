# AIGENEV7 — Build Infrastructure

Part of the **[AIGENEV7](../freebuff/README.md)** project — the free, uncensored, unlimited AI coding agent.

> **Developed by CONSTANZA (José Jaime Juliá).** This directory contains the build & release infrastructure for the AIGENEV7 binary. It wraps the AIGENEV7 engine with `FREEBUFF_MODE=true` to produce the AIGENEV7 / Freebuff branded CLI.

## Quick Start

```bash
# Build the AIGENEV7 binary (dev)
bun run build:aigenev7

# Build the Freebuff CLI
ts-node freebuff/cli/build.ts 1.0.0 dev
```

## Directory Structure

```
aigenev7/
├── cli/              # Build scripts
│   ├── build-aigenev7.ts  # Builds AIGENEV7 binary from AIGENEV7 engine
│   ├── build.ts          # Freebuff CLI build wrapper
│   ├── release.ts        # Release workflow trigger
│   └── release/          # npm package files
├── e2e/              # End-to-end tests
│   ├── agent/            # SDK test agent definitions
│   ├── tests/            # E2E test files
│   └── utils/            # Test utilities
└── SPEC.md           # Architecture specification
```

## Building

```bash
# Build AIGENEV7 binary (uses AIGENEV7 engine)
bun aigenev7/cli/build-aigenev7.ts [version]

# Build Freebuff CLI
bun freebuff/cli/build.ts <version> [dev|test|prod]
```

## Releasing

```bash
bun aigenev7/cli/release.ts [patch|minor|major] [--env dev|prod]
```

## Testing

```bash
bun test aigenev7/e2e/tests/
```

## License

MIT
