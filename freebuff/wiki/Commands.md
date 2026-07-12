# CLI Commands Reference

## General Commands

> 💡 **Tip:** Type `/help` at any time to see all available commands.

| Command | Description |
|---------|-------------|
| `/help`, `/h` | Show help with all available commands |
| `/quit`, `/exit`, `/q` | Exit AIGENEV7 |
| `/clear`, `/cls` | Clear the terminal screen |

## Model Commands

| Command | Description |
|---------|-------------|
| `/model <name>` | Switch to a different model |
| `/models`, `/ls` | List all available models |
| `/current` | Show the currently active model |

## Agent Commands

| Command | Description |
|---------|-------------|
| `/agent` | List all available agents |
| `/agent <name>` | Switch to a specific agent |
| `/agents` | List all agents (alias) |
| `/agent-show <name>` | Show agent details and system prompt |
| `/agent-new` | Create a new custom agent |
| `/agent-edit <name>` | Edit an existing agent |
| `/agent-delete <name>` | Delete a custom agent |
| `/agent-export <name>` | Export agent to JSON file |
| `/agent-import` | Import agent from JSON file |
| `/agent-reset` | Reset all agents to defaults |

## Defensive/Offensive Framework

| Command | Description |
|---------|-------------|
| `/defensive` | List all defensive (Blue Team) agents |
| `/defensive <agent>` | Show details of a defensive agent |
| `/defensive --intensity=<n>` | Filter by minimum intensity (1-5) |
| `/offensive` | List all offensive (Red Team) agents |
| `/offensive <agent>` | Show details of an offensive agent |
| `/offensive --intensity=<n>` | Filter by minimum intensity (1-5) |
| `/framework` | Show framework summary with all agents |
| `/framework <agent-id>` | Show details of any framework agent |

## Auto Agent

| Command | Description |
|---------|-------------|
| `/auto <prompt>` | Start autonomous coding agent |
| `/auto-stop` | Stop the running auto agent |
| `/auto-status` | Check auto agent status |

## Quantum Computing

| Command | Description |
|---------|-------------|
| `/quantum` | Show quantum simulator help |
| `/quantum run <gates>` | Run a quantum circuit |

### Quantum Gate Syntax

```
/quantum run H(0) CNOT(0,1) --shots=2048
/quantum run H(0) X(1) SWAP(0,1)
/quantum run H(0) CNOT(0,1) CNOT(0,2)
```

## Context Management

| Command | Description |
|---------|-------------|
| `/context` | Show current context |
| `/context add <file>` | Add a file to context |
| `/context remove <file>` | Remove a file from context |
| `/context clear` | Clear all context |

## Save & Snippets

| Command | Description |
|---------|-------------|
| `/save <name>` | Save current conversation |
| `/snippet <name>` | Insert a saved snippet |
| `/search <query>` | Search through saved conversations |

## Debug & Development

| Command | Description |
|---------|-------------|
| `/debug` | Show debug information |
| `/debug <query>` | Run debug agent |
| `/balance` | Show token balance |
| `/pay` | Show payment options |
| `/keygen` | Generate an API key |
| `/menu` | Show the main menu |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Cancel current operation |
| `Ctrl+D` | Exit |
| `Tab` | Auto-complete command |
| `↑` | Previous command history |
| `↓` | Next command history |

## Examples

### Basic Usage

```
> Add error handling to the server.js file
> Find all functions that interact with the database
> Run the test suite and fix any failures
```

### Using Agents

```
> /agent quantum-dev Help me write a quantum Fourier transform
> /agent debugger Why is this function returning undefined?
> /agent architect Design a microservices architecture for this app
```

### Framework Agents

```
> /defensive security-auditor Review this code for vulnerabilities
> /offensive code-optimizer Optimize this function for performance
> /framework code-reviewer Do a thorough code review
```

### Auto Agent

```
> /auto Add a login page with JWT authentication to this Express app
> /auto Refactor the database layer to use connection pooling
> /auto Write comprehensive tests for the user service
```

---

*See [Auto Agent](Auto-Agent) for detailed auto agent usage and [Defensive-Offensive Framework](Defensive-Offensive-Framework) for framework agent details.*
