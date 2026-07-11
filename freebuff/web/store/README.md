# aigen7ev.store — Standalone AI Developer Store

**Deploy to [aigen7ev.store](https://aigen7ev.store) or your own domain.**

A self-contained e-commerce site offering AI subscription plans, agent persona packs, digital downloads, merchandise, and consulting services — all with Stripe payment processing.

## Quick Deploy

### Option 1: Deploy the `web/store/` folder to any static host

Drag the `store/` folder to **Netlify**, **Vercel**, **Cloudflare Pages**, or **GitHub Pages**.

### Option 2: Run with the AIGENEV7 server

```bash
cd freebuff
bun run inference-cli.js serve --port 3456
```

Then visit `http://localhost:3456/store/` — the API endpoints for Stripe checkout will be available automatically.

## File Structure

```
store/
├── index.html         # Main store page (edit title, links, branding)
├── README.md          # This file
├── css/
│   └── style.css      # All store styles (dark theme, responsive)
└── js/
    └── store.js       # Product data, cart, Stripe Checkout logic
```

## Setting Up Stripe Payments

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Get your **Secret Key** from [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
3. Add it to `freebuff/.env`:

```
STRIPE_SECRET_KEY=sk_live_...
```

4. Run the server with `bun inference-cli.js serve`
5. The store checkout will automatically connect to Stripe

No Stripe SDK needed — the server calls Stripe's REST API directly via `fetch`.

## Customizing Products

Edit `js/store.js` — find the `PRODUCTS` array and add, remove, or modify products:

```javascript
{
  id: 'my-product',           // unique ID
  category: 'subscriptions',  // one of: subscriptions, packs, digital, merch, services
  name: 'My Product',
  emoji: '✨',
  desc: 'Product description here.',
  price: 9.99,
  unit: '/month',             // or ' once' for one-time purchases
  image: null,                // or 'tshirt', 'hoodie', 'sticker', 'mug' for SVG placeholder
  popular: false,             // highlights as "Most Popular"
  featured: false,            // highlights as "Featured"
}
```

## Customizing the Look

Edit `css/style.css` — change the `:root` variables to match your brand:

```css
:root {
  --accent: #00ff88;     /* Primary green */
  --purple: #8855ff;     /* Secondary purple */
  --red: #ff4466;        /* Accent red */
  /* ... */
}
```

## Features

- 🛒 **Shopping cart** with localStorage persistence
- 🔢 **Quantity controls** (+/-) in cart sidebar
- 🏷️ **Category tabs** for filtering products
- 🔒 **Stripe Checkout** integration via AIGENEV7 API (no SDK needed)
- ✅ **Payment success/cancel handling** with automatic cart clear
- 📱 **Fully responsive** — works on mobile, tablet, desktop
- 🎨 **Dark theme** with gradient accents and smooth animations
- 🖼️ **SVG product placeholders** for merch items (t-shirt, hoodie, stickers, mug)

## Requirements

- A Bun runtime server with the `/api/store/create-checkout-session` endpoint (included in `inference-cli.js`)
- A Stripe account for payment processing
- The site can be deployed as a static site — only checkout needs the backend

## License

MIT — use, modify, and deploy freely.
