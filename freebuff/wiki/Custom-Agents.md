# Custom Agents

AIGENEV7 includes a powerful custom agent system that lets you create, manage, and share specialized AI agent personas.

## Built-in Agents

AIGENEV7 comes with **30 pre-configured agents**:

### Core Agents (12)

| ID | Name | Emoji | Focus |
|----|------|-------|-------|
| `default` | Coding Assistant | 🤖 | General-purpose coding |
| `debugger` | Debugger | 🐛 | Finding and fixing bugs |
| `tech-writer` | Technical Writer | 📝 | Documentation and READMEs |
| `sql-expert` | SQL Expert | 🗄️ | Database queries and schema |
| `architect` | System Architect | 🏗️ | Architecture and design patterns |
| `pythonista` | Python Expert | 🐍 | Python-specific coding |
| `react-dev` | React Developer | ⚛️ | React/Next.js frontend |
| `mentor` | Mentor Mode | 🎓 | Guided learning |
| `socratic` | Socratic Debugger | 💭 | Ask questions to help debug |
| `quantum-dev` | Quantum Developer | ⚛️ | Quantum computing expert |
| `banking-engineer` | Banking Engineer | 🏦 | Fintech and payment systems |
| `web3-engineer` | Web3 Engineer | 🔗 | Blockchain and smart contracts |

### Framework Agents (18)

- 9 Defensive (Blue Team) agents — See [Defensive-Offensive Framework](Defensive-Offensive-Framework)
- 9 Offensive (Red Team) agents — See [Defensive-Offensive Framework](Defensive-Offensive-Framework)

## Managing Agents

### List All Agents

```bash
/agent
```

### Show Agent Details

```bash
/agent-show default
/agent-show quantum-dev
```

### Create a New Agent

```bash
/agent-new
```

Follow the prompts to enter:
- **Name**: Display name
- **Description**: Short description
- **System Prompt**: The AI behavior instructions

### Edit an Agent

```bash
/agent-edit my-custom-agent
```

### Delete an Agent

```bash
/agent-delete my-custom-agent
```

> ⚠️ Default agents cannot be deleted, only edited.

### Reset All Agents

```bash
/agent-reset
```

## Export & Share

### Export an Agent

```bash
/agent-export quantum-dev
```

This creates a JSON file that can be shared with others.

### Import an Agent

```bash
/agent-import
```

Then paste the JSON content or provide a file path.

## API Usage

```javascript
import {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  exportAgent,
  importAgent,
  resetAgents,
} from './custom-agents.js'

// List all agents
const agents = listAgents()
console.log(agents.length) // 30

// Get a specific agent
const agent = getAgent('quantum-dev')
console.log(agent.systemPrompt)

// Create a new agent
const myAgent = createAgent(
  'my-agent',
  'My Custom Agent',
  'Does something specific',
  'You are an expert in...',
  '🎯'
)

// Update an agent
updateAgent('my-agent', {
  name: 'Updated Agent',
  systemPrompt: 'New system prompt...',
})

// Export to JSON
const { json } = exportAgent('my-agent')
console.log(json)

// Import from JSON
const imported = importAgent(json)

// Delete an agent
deleteAgent('my-agent')

// Reset to defaults
resetAgents()
```

## Creating Effective System Prompts

A good system prompt defines the agent's:
1. **Role**: "You are a [specific expert]..."
2. **Expertise**: What they know deeply
3. **Behavior**: How they should respond
4. **Constraints**: What they should/shouldn't do

### Example: Database Expert

```
You are a database optimization expert. Your expertise covers:
- Query optimization and indexing strategies
- Database schema design and normalization
- Connection pooling and resource management
- Migration strategies and zero-downtime deployments
- Performance monitoring and profiling

When responding:
1. Always consider performance implications
2. Provide specific SQL examples
3. Include index recommendations
4. Discuss trade-offs between approaches
5. Suggest monitoring queries for production
```

### Example: Security Expert

```
You are a security auditor specializing in web applications.
Analyze code for:
- OWASP Top 10 vulnerabilities
- Authentication and authorization flaws
- Input validation and sanitization issues
- Cryptographic weaknesses
- Dependency vulnerabilities

Always provide:
1. Severity ratings (Critical/High/Medium/Low)
2. Specific remediation steps
3. Code examples showing the fix
4. References to security standards (OWASP, CWE)
```

## Agent File Storage

Custom agents are stored in `freebuff/custom-agents.json`:

```json
[
  {
    "id": "my-custom-agent",
    "name": "My Custom Agent",
    "emoji": "🎯",
    "description": "Does something specific",
    "systemPrompt": "You are an expert in..."
  }
]
```

This file is:
- ✅ Portable (can be shared)
- ✅ Version controlled (commit to git)
- ✅ Mergeable (multiple developers)

---

*See [Defensive-Offensive Framework](Defensive-Offensive-Framework) for the built-in framework agents.*
