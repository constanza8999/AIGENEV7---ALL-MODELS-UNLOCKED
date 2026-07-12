# Web Interface

AIGENEV7 includes a full web interface for interacting with AI models directly in your browser.

## Overview

The web interface provides:
- 🌐 Browser-based chat interface
- 🤖 All 15+ AI models
- 🛡️ Defensive/Offensive framework agents
- ⚛️ Quantum circuit simulator
- 📱 Mobile-responsive design
- 🎨 Beautiful, modern UI

## Pages

| Page | URL | Description |
|------|-----|-------------|
| **Home** | `/` | Landing page with features and demo |
| **Cat** | `/cat/` | AI Cat assistant |
| **Me** | `/me/` | Developer profile |
| **Online** | `/online/` | Online features and pricing |
| **Premium** | `/premium/` | Premium tier details |
| **Store** | `/store/` | Purchase premium passes |
| **Architecture** | `/architecture/` | Technical architecture diagram |

## Starting the Web Server

### Local Development

```bash
# Navigate to the web directory
cd freebuff/web

# Start a simple HTTP server
bun serve

# Or use Python
python -m http.server 8080
```

### Using the API Server

The local API server also serves the web interface:

```bash
bun freebuff/local-api-server.js
# Open http://localhost:3457
```

## Features

### Chat Interface

The main chat interface supports:
- **Multiple models** — Switch between AI models
- **Streaming responses** — Real-time token output
- **Code highlighting** — Automatic syntax highlighting
- **Copy to clipboard** — One-click code copying
- **Chat history** — Save and load conversations

### Agent Gallery

Browse and use specialized AI agents:
- 🤖 Coding Assistant
- 🐛 Debugger
- 📝 Technical Writer
- 🗄️ SQL Expert
- 🏗️ System Architect
- And 25+ more...

### Quantum Simulator

Run quantum circuits directly in your browser:
- Gate syntax: `H(0) CNOT(0,1)`
- Visual circuit diagrams
- Measurement results
- Up to 28 qubits

### Auto Agent

Launch the autonomous coding agent:
- 17 file operation tools
- Automatic error fixing
- Multi-file editing
- Progress tracking

## Technical Details

### File Structure

```
freebuff/web/
├── index.html          # Main landing page
├── architecture.html   # Architecture diagram
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   ├── chat.js         # Chat interface
│   ├── data.js         # Agent data
│   ├── animations.js   # UI animations
│   ├── gallery.js      # Agent gallery
│   ├── quantum.js      # Quantum simulator
│   ├── auto-agent-web.js  # Auto agent client
│   ├── store.js        # Store/payment
│   ├── entanglement.js # Visual effects
│   └── me.js           # Developer profile
├── cat/                # AI Cat page
├── me/                 # Developer profile
├── online/             # Online features
├── premium/            # Premium details
└── store/              # Store/payment
```

### Deployment

The web interface is automatically deployed to GitHub Pages:

1. Push changes to `main` branch
2. GitHub Actions triggers `deploy-pages.yml`
3. `freebuff/web/` is uploaded as a Pages artifact
4. Deployed to `https://constanza8999.github.io/AIGENEV7---ALL-MODELS-UNLOCKED/`

### Customization

Edit `freebuff/web/css/style.css` to customize:
- Colors and themes
- Layout and spacing
- Typography
- Animations

## Mobile Support

The web interface is fully responsive:
- ✅ Smartphones
- ✅ Tablets
- ✅ Desktops
- ✅ Wide screens

---

*See [Commands](Commands) for CLI commands and [Configuration](Configuration) for settings.*
