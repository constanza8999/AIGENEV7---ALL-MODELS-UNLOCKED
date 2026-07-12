# Contributing

We welcome contributions to AIGENEV7! Here's how to get started.

## Development Setup

### Prerequisites

- **Bun** runtime (recommended)
- **Node.js** (alternative)
- **Git**

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED.git
cd AIGENEV7---ALL-MODELS-UNLOCKED

# Install dependencies
bun install
```

### Environment Setup

```bash
# Copy environment template
cp freebuff/.env.example freebuff/.env

# Add your API keys (at least one)
# See Configuration page for details
```

## Project Structure

See [Architecture](Architecture) for a detailed overview of the codebase.

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/my-new-feature
```

### 2. Make Changes

- Follow existing code style
- Add tests for new features
- Update documentation if needed

### 3. Run Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test freebuff/auto-agent.test.js

# Run integration tests
bun test freebuff/auto-agent-integration.test.js
```

### 4. Run Linter

```bash
bun run lint
```

### 5. Commit and Push

```bash
git add .
git commit -m "feat: Add my new feature"
git push origin feature/my-new-feature
```

### 6. Create a Pull Request

Go to GitHub and create a Pull Request from your branch.

## Code Style

### JavaScript/TypeScript

- Use `const` and `let` (no `var`)
- Use arrow functions for callbacks
- Use template literals over string concatenation
- Add JSDoc comments for public functions
- Use meaningful variable names

### Git Commits

Follow conventional commits:

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style changes (formatting, etc.)
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Maintenance tasks

### Example

```bash
git commit -m "feat: Add quantum circuit simulator"
git commit -m "fix: Handle rate limits gracefully"
git commit -m "docs: Update Models page"
```

## Testing

### Unit Tests

```bash
bun test freebuff/auto-agent.test.js
bun test freebuff/custom-agents.test.js
bun test freebuff/tab-completion.test.js
```

### Integration Tests

```bash
bun test freebuff/auto-agent-integration.test.js
```

### Test Structure

```javascript
import { describe, it, expect } from 'bun:test'

describe('Feature Name', () => {
  it('does something specific', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = someFunction(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```

## Adding a New Model

### 1. Add to `models.js`

```javascript
{
  id: 'new-model',
  displayName: 'New Model',
  provider: 'provider-name',
  providerModel: 'model-id',
  multimodal: false,
  description: 'Model description',
  premium: false,
}
```

### 2. Add Provider URL (if new)

In `inference.js`:

```javascript
const PROVIDER_URLS = {
  // existing providers...
  'new-provider': 'https://api.new-provider.com/v1',
}
```

### 3. Add Environment Variable (if needed)

In `.env.example`:

```bash
NEW_PROVIDER_API_KEY=sk-...
```

### 4. Test

```bash
bun run inference.js --list-models
bun run inference.js "Hello" --model new-model
```

## Adding a New Agent

### 1. Add to `custom-agents.js`

```javascript
const CORE_AGENTS = [
  // existing agents...
  {
    id: 'my-agent',
    name: 'My Custom Agent',
    emoji: '🎯',
    description: 'Does something specific',
    systemPrompt: 'You are an expert in...',
  },
]
```

### 2. Add Tests

In `custom-agents.test.js`:

```javascript
it('includes my-agent in default agents', () => {
  const agents = listAgents()
  expect(agents.find(a => a.id === 'my-agent')).toBeDefined()
})
```

### 3. Test

```bash
bun test freebuff/custom-agents.test.js
```

## Documentation

### Wiki Pages

Wiki pages are stored in `freebuff/wiki/`. To add or edit:

1. Edit the markdown file in `freebuff/wiki/`
2. Commit and push
3. The wiki will be updated automatically

### Code Documentation

- Add JSDoc comments for all public functions
- Include usage examples
- Document parameters and return values

## Reporting Issues

### Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Bun version, Node version)
- Error messages

### Feature Requests

Include:
- Description of the feature
- Use case
- Proposed implementation (if any)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Celebrate contributions of all sizes

## Questions?

- Open a [GitHub Issue](https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/issues)
- Check existing issues for answers

---

*Thank you for contributing to AIGENEV7! 🚀*
