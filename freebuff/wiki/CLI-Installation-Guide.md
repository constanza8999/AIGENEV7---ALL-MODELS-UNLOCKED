# CLI Installation Guide

A comprehensive guide to installing and setting up the AIGENEV7 CLI on any platform.

## Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **OS** | Windows 10, macOS 10.15, Ubuntu 18.04 | Latest version |
| **Node.js** | v18.0+ | v20.0+ |
| **Bun** | v1.0+ | Latest |
| **RAM** | 4GB | 8GB+ |
| **Disk** | 500MB | 1GB+ |

## Installation Methods

### Method 1: npm (Recommended)

```bash
# Install globally
npm install -g aigenev7

# Verify installation
aigenev7 --version
```

### Method 2: Bun

```bash
# Install globally
bun install -g aigenev7

# Verify installation
aigenev7 --version
```

### Method 3: Download Binary

1. Go to [Releases](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/releases)
2. Download the binary for your platform:
   - `aigenev7-windows.exe` — Windows
   - `aigenev7-macos` — macOS
   - `aigenev7-linux` — Linux
3. Make it executable (macOS/Linux):
   ```bash
   chmod +x aigenev7-macos
   ```
4. Move to PATH:
   ```bash
   sudo mv aigenev7-macos /usr/local/bin/aigenev7
   ```

### Method 4: Build from Source

```bash
# Clone the repository
git clone https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED.git
cd AIGENEV7---ALL-MODELS-UNLOCKED

# Install dependencies
bun install

# Build the binary
bun run build:aigenev7

# The binary is at: freebuff/release/index.js
```

## Platform-Specific Instructions

### Windows

```powershell
# Using PowerShell
npm install -g aigenev7

# Or using winget
winget install AIGENEV7

# Or download the .exe from releases
```

**Windows Notes:**
- Use `start.bat` in the `freebuff/` directory for quick start
- PowerShell or Command Prompt both work
- May need to run as Administrator for global install

### macOS

```bash
# Using Homebrew
brew install aigenev7

# Or using npm
npm install -g aigenev7

# Or using Bun
bun install -g aigenev7
```

**macOS Notes:**
- Apple Silicon (M1/M2/M3) supported natively
- May need to allow in System Preferences > Security & Privacy

### Linux

```bash
# Using npm
npm install -g aigenev7

# Or using Bun
curl -fsSL https://bun.sh/install | bash
bun install -g aigenev7
```

**Linux Notes:**
- Works on Ubuntu, Debian, Fedora, Arch, etc.
- May need to add to PATH:
  ```bash
  export PATH="$HOME/.bun/bin:$PATH"
  ```

## First-Time Setup

### 1. Configure API Keys

```bash
# Copy the example environment file
cp freebuff/.env.example freebuff/.env

# Edit with your API keys
nano freebuff/.env
```

At least one API key is required:

```bash
# Free options
DEEPSEEK_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...

# Paid options
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Get Free API Keys

| Provider | Free Tier | Sign Up |
|----------|-----------|---------|
| DeepSeek | ✅ Yes | https://platform.deepseek.com |
| OpenRouter | ✅ Yes | https://openrouter.ai/keys |
| Moonshot | ✅ Yes | https://platform.moonshot.cn |
| xAI | ✅ Yes | https://console.x.ai |
| Ollama | ✅ Local | https://ollama.com/ |

### 3. Verify Installation

```bash
# Check version
aigenev7 --version

# List available models
aigenev7 --list-models

# Run a quick test
aigenev7 "Hello, world!"
```

## Common Issues

### "Command not found"

**Solution:** Add AIGENEV7 to your PATH:

```bash
# Find where AIGENEV7 is installed
npm root -g

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$(npm root -g)/../bin:$PATH"
```

### "API key not set"

**Solution:** Ensure your `.env` file is in the `freebuff/` directory:

```bash
# Check if .env exists
ls -la freebuff/.env

# Create if missing
cp freebuff/.env.example freebuff/.env
```

### Permission Denied (macOS/Linux)

**Solution:** Fix permissions:

```bash
chmod +x /usr/local/bin/aigenev7
# Or
sudo chown $USER /usr/local/bin/aigenev7
```

### Windows Defender Alert

**Solution:** This is a false positive for new executables:
1. Click "More info"
2. Click "Run anyway"
3. Or add to Windows Defender exclusions

## Updating

```bash
# npm
npm update -g aigenev7

# bun
bun update -g aigenev7

# Binary
# Download the latest release and replace
```

## Uninstalling

```bash
# npm
npm uninstall -g aigenev7

# bun
bun remove -g aigenev7

# Binary
sudo rm /usr/local/bin/aigenev7
```

## Next Steps

- [Getting Started](Getting-Started) — First steps with AIGENEV7
- [Configuration](Configuration) — Advanced settings
- [Commands](Commands) — Full command reference
- [Models](Models) — Available AI models

---

*Having issues? Open a [GitHub Issue](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/issues).*
