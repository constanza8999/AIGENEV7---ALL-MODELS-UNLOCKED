# AIGENEV7 — Standalone Web Site

Deploy this entire `web/` directory to any static file host:
**GitHub Pages, Netlify, Vercel, Cloudflare Pages, or your own domain.**

## Quick Deploy

### 1. GitHub Pages
```bash
cd freebuff
git subtree push --prefix web origin gh-pages
# Or: copy web/ to your repo's docs/ folder and enable Pages
```

### 2. Netlify / Vercel
Drag `freebuff/web/` folder to your deployment dashboard.

### 3. Any Web Server
Copy the `web/` folder contents to your server's document root.

## File Structure

```
web/
├── index.html          # Main page (edit title, links, content)
├── favicon.ico         # Browser tab icon
├── icon.png            # Social/Apple touch icon
├── css/
│   └── style.css       # All styles (colors, layout, animations)
├── js/
│   ├── data.js         # ✏️ EDIT THIS: agents, models, subtitles
│   ├── quantum.js      # Client-side quantum simulator (no API needed)
│   ├── animations.js   # Particles, typing, terminal, scroll effects
│   └── chat.js         # Agent chat UI + optional API connection
└── README.md           # This file
```

## Customizing Your Site

### Change the title, logo, and branding
Edit `index.html`:
- `<title>` tag
- Logo text inside `<span class="logo">`
- Header nav links

### Add/edit agents
Edit `js/data.js` → `window.AIGENEV7_AGENTS` array.
Each agent needs: `id`, `name`, `emoji`, `description`, `systemPrompt`.

### Add/edit models
Edit `js/data.js` → `window.AIGENEV7_MODELS` array.
Each model needs: `id`, `displayName`, `provider`, `description`.

### Change colors
Edit `css/style.css` → `:root` variables (accent, purple, red, etc.)

## Standalone vs API Mode

### Standalone mode (default)
The site works completely without a backend:
- Landing page, features, models grid, rewards — all static
- **Quantum Lab** — full client-side quantum circuit simulator
- Chat shows demo responses + quantum simulator output

### API mode (full inference)
For real AI chat, run the Bun API server alongside:
```bash
cd freebuff
bun run inference-cli.js serve --port 3456
```
The chat will auto-detect the API and switch to live inference mode.

## Custom Domain Setup

1. Point your domain's DNS to your hosting provider
2. Upload the `web/` folder contents to your server
3. Update `js/data.js` with your own agents and branding
4. Done! Your site is live at your domain.

## Performance

- All assets are lightweight HTML/CSS/JS — no frameworks
- Zero external dependencies (except Google Fonts)
- The quantum simulator runs entirely client-side
- ~50KB total transfer size

## License

MIT — use, modify, and deploy freely.
