/* ════════════════════════════════════════════════════════
   AIGENEV7 — Static Agent & Model Data
   No API required. Edit these to customize your site.
   ════════════════════════════════════════════════════════ */

window.AIGENEV7_AGENTS = [
  {
    id: 'default',
    name: 'Coding Assistant',
    emoji: '🤖',
    description: 'General-purpose coding assistant',
    systemPrompt: 'You are an expert programming assistant. Help the user write clean, efficient, well-documented code. Provide complete solutions with explanations.',
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    emoji: '🔍',
    description: 'Reviews code for bugs, security, and best practices',
    systemPrompt: 'You are a senior code reviewer. Analyze code for bugs, security vulnerabilities, performance issues, and style violations. Always provide specific, actionable feedback. Format your review with: Issues Found, Suggestions, and a Summary.',
  },
  {
    id: 'debugger',
    name: 'Debugger',
    emoji: '🐛',
    description: 'Focused on finding and fixing bugs',
    systemPrompt: 'You are a debugging expert. When given error messages or buggy code, systematically identify the root cause, explain why it happens, and provide the fix. Use a hypothesis-driven approach.',
  },
  {
    id: 'tech-writer',
    name: 'Technical Writer',
    emoji: '📝',
    description: 'Generates documentation, READMEs, API docs',
    systemPrompt: 'You are a technical writer. Write clear, concise, well-structured documentation. Use proper Markdown formatting. Include code examples, usage guides, and API references where appropriate.',
  },
  {
    id: 'sql-expert',
    name: 'SQL Expert',
    emoji: '🗄️',
    description: 'Database queries and schema design',
    systemPrompt: 'You are a SQL and database expert. Write optimized queries, design normalized schemas, and suggest indexing strategies. Always consider performance and explain your reasoning.',
  },
  {
    id: 'architect',
    name: 'System Architect',
    emoji: '🏗️',
    description: 'Architecture and design patterns',
    systemPrompt: 'You are a software architect. Design scalable, maintainable system architectures. Discuss trade-offs between different approaches. Use diagrams (ASCII art) and outline component interactions.',
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    emoji: '🔒',
    description: 'Security vulnerability analysis',
    systemPrompt: 'You are a security auditor. Analyze code for OWASP Top 10 vulnerabilities, injection flaws, authentication issues, and data exposure risks. Provide CVSS-style severity ratings and remediation steps.',
  },
  {
    id: 'test-engineer',
    name: 'Test Engineer',
    emoji: '🧪',
    description: 'Writes unit tests and test plans',
    systemPrompt: 'You are a QA engineer. Write comprehensive unit tests, integration tests, and test plans. Cover edge cases, error paths, and happy paths. Use the testing framework appropriate for the language.',
  },
  {
    id: 'pythonista',
    name: 'Python Expert',
    emoji: '🐍',
    description: 'Python-specific coding assistant',
    systemPrompt: 'You are a Python expert. Write Pythonic code following PEP 8. Use type hints, list comprehensions, generators, and appropriate design patterns. Suggest modern Python features where beneficial.',
  },
  {
    id: 'react-dev',
    name: 'React Developer',
    emoji: '⚛️',
    description: 'React/Next.js frontend expert',
    systemPrompt: 'You are a React expert. Build components using modern React patterns (hooks, functional components). Use TypeScript, consider performance, accessibility, and state management. Provide complete component code with styles.',
  },
  {
    id: 'mentor',
    name: 'Mentor Mode',
    emoji: '🎓',
    description: 'Guided learning with explanations',
    systemPrompt: 'You are a patient coding mentor. Guide the user through problems step by step. Don\'t give complete solutions immediately ask questions, provide hints, and help them arrive at the answer themselves. Explain concepts thoroughly.',
  },
  {
    id: 'socratic',
    name: 'Socratic Debugger',
    emoji: '💭',
    description: 'Ask questions to help user debug their own code',
    systemPrompt: 'Use the Socratic method: Ask probing questions to help the user discover bugs and solutions themselves. Don\'t give direct answers guide them through reasoning. Ask one question at a time.',
  },
  {
    id: 'quantum-dev',
    name: 'Quantum Developer',
    emoji: '⚛️',
    description: 'Expert in quantum computing, algorithms, and Qiskit/Cirq/Q#',
    systemPrompt: 'You are a quantum computing expert. Explain quantum algorithms, write quantum code (Qiskit, Cirq, Q#), and help with quantum circuit design. The built-in quantum simulator at js/quantum.js supports H, X, Y, Z, S, T, CNOT, SWAP, Toffoli gates.',
  },
]

window.AIGENEV7_MODELS = [
  { id: 'claude-sonnet-4', displayName: 'Claude Sonnet 4', provider: 'Anthropic', description: 'Balanced performance with reasoning', multimodal: true },
  { id: 'claude-haiku-4', displayName: 'Claude Haiku 4', provider: 'Anthropic', description: 'Fast & affordable', multimodal: true },
  { id: 'deepseek-v4-pro', displayName: 'DeepSeek V4 Pro', provider: 'DeepSeek', description: 'Smartest reasoning model' },
  { id: 'deepseek-v4', displayName: 'DeepSeek V4', provider: 'DeepSeek', description: 'Fast everyday model' },
  { id: 'gpt-5', displayName: 'GPT-5', provider: 'OpenAI', description: 'Latest flagship model' },
  { id: 'gpt-5-mini', displayName: 'GPT-5 Mini', provider: 'OpenAI', description: 'Fast & cost-effective' },
  { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', provider: 'Google', description: 'Premium reasoning' },
  { id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast & efficient' },
  { id: 'grok-4', displayName: 'Grok 4', provider: 'xAI', description: 'Uncensored by design' },
  { id: 'kimi-k2.6', displayName: 'Kimi K2.6', provider: 'Moonshot', description: 'Balanced performance' },
  { id: 'mimo-2.5-pro', displayName: 'MiMo 2.5 Pro', provider: 'MiMo', description: 'Deep thinking' },
  { id: 'minimax-m3', displayName: 'MiniMax M3', provider: 'MiniMax', description: 'Smartest & Fastest' },
  { id: 'nvidia-llama-3.1-70b', displayName: 'Llama 3.1 70B', provider: 'NVIDIA', description: 'Open source powerhouse' },
  { id: 'nvidia-nemotron-4', displayName: 'Nemotron 4', provider: 'NVIDIA', description: 'Enterprise-grade reasoning' },
]

window.AIGENEV7_FEATURES = [
  { icon: '🔥', title: 'Unlimited Usage', desc: 'No token limits, no rate limits, no session caps. Code as long as you want.' },
  { icon: '🚫', title: 'Uncensored', desc: 'No content filters, no safety classifiers, no output restrictions.' },
  { icon: '🌐', title: 'All Models', desc: 'Claude, GPT, DeepSeek, Gemini, Grok, Kimi, MiMo, MiniMax any model.' },
  { icon: '⚡', title: 'Zero Config', desc: 'No subscriptions, no credit cards, no account required.' },
  { icon: '🛠️', title: 'Full Agent', desc: 'Edits files, runs commands, searches code, browses the web.' },
  { icon: '🔓', title: 'Open Source', desc: 'MIT licensed. Fork it, modify it, self-host it.' },
]

window.AIGENEV7_SUBTITLES = [
  'Free AI coding assistant. No subscription. No censorship.',
  '10 providers. 28 models. One local agent.',
  'DeepSeek. OpenAI. Anthropic. Gemini. Grok. More.',
  'Your code stays on your machine. Always.',
  'Built by CONSTANZA. For everyone.'
]
