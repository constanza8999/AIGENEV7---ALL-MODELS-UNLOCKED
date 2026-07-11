/* ════════════════════════════════════════════════════════
   aigen7ev.store — Standalone E-Commerce Storefront
   Product data, cart, and Stripe Checkout integration.
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict'

  // ── Product Catalog ────────────────────────────────
  var PRODUCTS = [
    // ── Subscriptions ──
    {
      id: 'sub-weekly', category: 'subscriptions',
      name: 'Weekly AI Pass', emoji: '🚀',
      desc: 'Unlimited AI coding for one week. All 14+ models, all agent personas, uncensored access.',
      price: 10.00, unit: '/week', image: null, popular: false, featured: true,
    },
    {
      id: 'sub-monthly', category: 'subscriptions',
      name: 'Monthly Pro', emoji: '⭐',
      desc: 'Unlimited AI for one month. Priority queue, early access to new models and features.',
      price: 25.00, unit: '/month', image: null, popular: true, featured: true,
    },
    {
      id: 'sub-yearly', category: 'subscriptions',
      name: 'Yearly Elite', emoji: '👑',
      desc: 'Unlimited AI for one year. VIP support, early access, full API. Best value at $15/mo.',
      price: 180.00, unit: '/year', image: null, popular: false, featured: true,
    },
    {
      id: 'sub-lifetime', category: 'subscriptions',
      name: 'Lifetime Legend', emoji: '🏆',
      desc: 'One payment. Forever access. VIP support, project governance, founding member status.',
      price: 499.00, unit: ' once', image: null, popular: false, featured: true,
    },

    // ── Agent Packs ──
    {
      id: 'pack-starter', category: 'packs',
      name: 'Starter Agent Pack', emoji: '🎒',
      desc: '5 ready-to-use agent personas: Debugger, Tech Writer, SQL Expert, Mentor, Security Auditor.',
      price: 9.99, unit: ' once', image: null, popular: false,
    },
    {
      id: 'pack-pro', category: 'packs',
      name: 'Pro Agent Pack', emoji: '💼',
      desc: '15 advanced agent personas including Architect, Game Dev, Blockchain, CLI Wizard, and more.',
      price: 24.99, unit: ' once', image: null, popular: true,
    },
    {
      id: 'pack-mega', category: 'packs',
      name: 'Mega Agent Bundle', emoji: '📦',
      desc: '50+ agent personas covering quantum, embedded, bioinformatics, legal, and every niche.',
      price: 49.99, unit: ' once', image: null, popular: false,
    },

    // ── Digital Downloads ──
    {
      id: 'dl-quantum', category: 'digital',
      name: 'Quantum Lab Source', emoji: '⚛️',
      desc: 'Full source code for the browser-based quantum circuit simulator. MIT licensed.',
      price: 19.99, unit: ' once', image: null, popular: false, featured: true,
    },
    {
      id: 'dl-agent-kit', category: 'digital',
      name: 'Agent Template Kit', emoji: '🧩',
      desc: 'Templates & examples for creating custom agent personas. 10 sample prompts and patterns.',
      price: 9.99, unit: ' once', image: null, popular: false,
    },
    {
      id: 'dl-theme-pack', category: 'digital',
      name: 'CLI Theme Pack', emoji: '🎨',
      desc: '5 premium CLI color themes, custom prompt styles, and terminal configurations.',
      price: 4.99, unit: ' once', image: null, popular: false,
    },
    {
      id: 'dl-ebook', category: 'digital',
      name: 'E-Book: Building AI Agents', emoji: '📖',
      desc: 'Complete guide to building, deploying, and monetizing AI agents. 200+ pages with code.',
      price: 29.99, unit: ' once', image: null, popular: true,
    },

    // ── Merchandise ──
    {
      id: 'merch-tshirt', category: 'merch',
      name: 'AIGENEV7 T-Shirt', emoji: '👕',
      desc: 'Premium cotton t-shirt with AIGENEV7 logo. S/M/L/XL/XXL. Black. Free shipping.',
      price: 24.99, unit: ' once', image: 'tshirt', popular: false,
    },
    {
      id: 'merch-hoodie', category: 'merch',
      name: 'AIGENEV7 Hoodie', emoji: '🧥',
      desc: 'Heavyweight fleece hoodie with embroidered AIGENEV7 logo. S/M/L/XL. Black.',
      price: 49.99, unit: ' once', image: 'hoodie', popular: true,
    },
    {
      id: 'merch-stickers', category: 'merch',
      name: 'Sticker Pack', emoji: '🦊',
      desc: '6 vinyl stickers with AIGENEV7 logo, quantum circuits, and ASCII art. Waterproof.',
      price: 4.99, unit: ' once', image: 'sticker', popular: false,
    },
    {
      id: 'merch-mug', category: 'merch',
      name: 'Ceramic Mug', emoji: '☕',
      desc: '11oz ceramic mug with heat-reactive AIGENEV7 logo. Changes color with hot drinks.',
      price: 14.99, unit: ' once', image: 'mug', popular: false,
    },

    // ── Consulting ──
    {
      id: 'svc-code-review', category: 'services',
      name: '1-Hour Code Review', emoji: '🔍',
      desc: 'One-on-one code review with a senior developer. Get actionable feedback on your codebase.',
      price: 99.00, unit: ' once', image: null, popular: false,
    },
    {
      id: 'svc-architecture', category: 'services',
      name: 'Architecture Workshop', emoji: '🏗️',
      desc: 'Half-day workshop on system design, architecture patterns, and best practices for your project.',
      price: 349.00, unit: ' once', image: null, popular: true,
    },
    {
      id: 'svc-full-day', category: 'services',
      name: 'Full Day Sprint (8h)', emoji: '⚡',
      desc: 'Intensive 8-hour development sprint. Build features, fix bugs, optimize performance.',
      price: 649.00, unit: ' once', image: null, popular: false,
    },
    {
      id: 'svc-retainer', category: 'services',
      name: 'Monthly Retainer (20h)', emoji: '🤝',
      desc: '20h/month dedicated development. Priority access, weekly check-ins, Slack support.',
      price: 1999.00, unit: '/month', image: null, popular: false,
    },
  ]

  var CATEGORIES = [
    { key: 'subscriptions', label: 'AI Subscriptions', emoji: '✨', count: 0 },
    { key: 'packs', label: 'Agent Packs', emoji: '🧠', count: 0 },
    { key: 'digital', label: 'Digital Downloads', emoji: '💾', count: 0 },
    { key: 'merch', label: 'Merchandise', emoji: '👕', count: 0 },
    { key: 'services', label: 'Consulting', emoji: '🤝', count: 0 },
  ]

  // ── SVG placeholders for merch ──
  var SVG_PLACEHOLDERS = {
    tshirt: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="25" width="60" height="70" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 35 L15 35 L10 20 L25 15 L35 25 L40 25 L40 40 M80 35 L85 35 L90 20 L75 15 L65 25 L60 25 L60 40" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="65" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="42" y1="65" x2="58" y2="65" stroke="currentColor" stroke-width="1"/></svg>',
    hoodie: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="30" width="60" height="65" rx="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 40 L10 35 L12 15 L30 15 L40 28 M80 40 L90 35 L88 15 L70 15 L60 28" fill="none" stroke="currentColor" stroke-width="2"/><rect x="40" y="55" width="20" height="25" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="50" cy="60" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    sticker: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="15" width="70" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="2" transform="rotate(-10 50 50)"/><rect x="20" y="20" width="60" height="60" rx="6" fill="none" stroke="currentColor" stroke-width="1" transform="rotate(5 50 50)"/><circle cx="35" cy="40" r="5" fill="currentColor"/><circle cx="65" cy="40" r="5" fill="currentColor"/><path d="M35 60 Q50 70 65 60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    mug: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="25" y="25" width="50" height="55" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M75 35 Q90 35 90 50 Q90 65 75 65" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="50" cy="25" rx="25" ry="6" fill="none" stroke="currentColor" stroke-width="2"/><line x1="40" y1="40" x2="55" y2="40" stroke="currentColor" stroke-width="1.5"/><line x1="38" y1="50" x2="52" y2="50" stroke="currentColor" stroke-width="1.5"/></svg>',
  }

  // ── State ──
  var cart = []
  var activeCategory = 'subscriptions'

  // DOM refs
  var grid = document.getElementById('productGrid')
  var catBar = document.getElementById('categoryBar')
  var cartIcon = document.getElementById('cartIcon')
  var cartCount = document.getElementById('cartCount')
  var cartSide = document.getElementById('cartSide')
  var cartOverlay = document.getElementById('cartOverlay')
  var cartItems = document.getElementById('cartItems')
  var cartTotal = document.getElementById('cartTotal')
  var checkoutBtn = document.getElementById('checkoutBtn')
  var cartClose = document.getElementById('cartClose')
  var cartClear = document.getElementById('cartClear')

  // ── Init ──
  function init() {
    if (!grid) return
    loadCart()
    renderCategories()
    renderProducts(activeCategory)
    updateCartDisplay()
    handleStripeResult()
  }

  // ── Render Categories ──
  function renderCategories() {
    if (!catBar) return
    catBar.innerHTML = ''

    for (var i = 0; i < CATEGORIES.length; i++) {
      var cat = CATEGORIES[i]
      cat.count = PRODUCTS.filter(function (p) { return p.category === cat.key }).length

      var btn = document.createElement('button')
      btn.className = 'cat-btn' + (cat.key === activeCategory ? ' active' : '')
      btn.dataset.cat = cat.key
      btn.textContent = cat.emoji + ' ' + cat.label + ' (' + cat.count + ')'

      ;(function (key) {
        btn.addEventListener('click', function () {
          activeCategory = key
          var all = catBar.querySelectorAll('.cat-btn')
          for (var b = 0; b < all.length; b++) {
            all[b].classList.toggle('active', all[b].dataset.cat === key)
          }
          renderProducts(key)
        })
      })(cat.key)

      catBar.appendChild(btn)
    }
  }

  // ── Render Products ──
  function renderProducts(category) {
    if (!grid) return

    var filtered = PRODUCTS.filter(function (p) { return p.category === category })
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="product-empty">No products in this category yet.</div>'
      return
    }

    grid.innerHTML = ''
    for (var i = 0; i < filtered.length; i++) {
      var p = filtered[i]
      var card = document.createElement('div')
      card.className = 'product-card'
      if (p.popular) card.classList.add('popular')
      card.style.animationDelay = (i * 0.06) + 's'

      // Badge
      if (p.popular) {
        var badge = document.createElement('div')
        badge.className = 'product-badge'
        badge.textContent = '★ Most Popular'
        card.appendChild(badge)
      } else if (p.featured) {
        var fBadge = document.createElement('div')
        fBadge.className = 'product-badge featured'
        fBadge.textContent = '✦ Featured'
        card.appendChild(fBadge)
      }

      // Product image area
      if (p.image && SVG_PLACEHOLDERS[p.image]) {
        var imgArea = document.createElement('div')
        imgArea.className = 'product-image'
        imgArea.innerHTML = SVG_PLACEHOLDERS[p.image]
        card.appendChild(imgArea)
      } else {
        var emojiDiv = document.createElement('div')
        emojiDiv.className = 'product-emoji'
        emojiDiv.textContent = p.emoji || '📦'
        card.appendChild(emojiDiv)
      }

      // Name
      var nameDiv = document.createElement('div')
      nameDiv.className = 'product-name'
      nameDiv.textContent = p.name
      card.appendChild(nameDiv)

      // Description
      var descDiv = document.createElement('div')
      descDiv.className = 'product-desc'
      descDiv.textContent = p.desc
      card.appendChild(descDiv)

      // Price row
      var priceRow = document.createElement('div')
      priceRow.className = 'product-price-row'
      var priceDiv = document.createElement('div')
      priceDiv.className = 'product-price'
      priceDiv.textContent = '$' + p.price.toFixed(2) + (p.unit !== ' once' ? p.unit : '')
      priceRow.appendChild(priceDiv)

      // Savings badge for yearly sub
      if (p.id === 'sub-yearly') {
        var sBadge = document.createElement('div')
        sBadge.className = 'product-badge savings'
        sBadge.style.position = 'relative'
        sBadge.style.top = 'auto'
        sBadge.style.right = 'auto'
        sBadge.style.borderRadius = '6px'
        sBadge.style.marginLeft = 'auto'
        sBadge.textContent = 'Save 40%'
        priceRow.appendChild(sBadge)
      }

      card.appendChild(priceRow)

      // Add to cart button
      var btn = document.createElement('button')
      btn.className = 'product-btn'
      var inCart = cart.some(function (c) { return c.id === p.id })
      btn.textContent = inCart ? '✓ In Cart' : 'Add to Cart'
      if (inCart) btn.classList.add('in-cart')

      ;(function (prod, b) {
        b.addEventListener('click', function () { toggleCart(prod, b) })
      })(p, btn)
      card.appendChild(btn)

      grid.appendChild(card)
    }
  }

  // ── Cart Logic ──
  function toggleCart(product, btn) {
    var idx = -1
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === product.id) { idx = i; break }
    }

    if (idx !== -1) {
      cart.splice(idx, 1)
      if (btn) { btn.textContent = 'Add to Cart'; btn.classList.remove('in-cart') }
      showToast('Removed from cart', 'info')
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        emoji: product.emoji || '📦',
        price: product.price,
        quantity: 1,
      })
      if (btn) { btn.textContent = '✓ In Cart'; btn.classList.add('in-cart') }
      showToast('Added to cart!', 'success')
      bounceCart()
    }

    saveCart()
    updateCartDisplay()
  }

  function removeFromCart(id) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) { cart.splice(i, 1); break }
    }
    saveCart()
    updateCartDisplay()
    syncButtons()
  }

  function changeQuantity(id, delta) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        var q = cart[i].quantity + delta
        if (q <= 0) { cart.splice(i, 1) }
        else { cart[i].quantity = q }
        break
      }
    }
    saveCart()
    updateCartDisplay()
  }

  function clearCart() {
    cart = []
    saveCart()
    updateCartDisplay()
    syncButtons()
    showToast('Cart cleared', 'info')
  }

  function getTotal() {
    var t = 0
    for (var i = 0; i < cart.length; i++) t += cart[i].price * cart[i].quantity
    return t
  }

  function getCount() {
    var c = 0
    for (var i = 0; i < cart.length; i++) c += cart[i].quantity
    return c
  }

  function saveCart() {
    try { localStorage.setItem('aigen7_cart', JSON.stringify(cart)) } catch (e) {}
  }

  function loadCart() {
    try {
      var s = localStorage.getItem('aigen7_cart')
      if (s) { var p = JSON.parse(s); if (Array.isArray(p)) cart = p }
    } catch (e) { cart = [] }
  }

  function syncButtons() {
    var btns = grid.querySelectorAll('.product-btn')
    for (var b = 0; b < btns.length; b++) {
      btns[b].textContent = 'Add to Cart'
      btns[b].classList.remove('in-cart')
    }
    // Re-render to sync cart state
    renderProducts(activeCategory)
  }

  // ── Cart UI ──
  function updateCartDisplay() {
    var count = getCount()
    if (cartCount) {
      cartCount.textContent = count
      cartCount.classList.toggle('visible', count > 0)
    }

    if (!cartItems) return

    if (cart.length === 0) {
      cartItems.innerHTML = '<div class="cart-empty">Your cart is empty. Browse the store and add items!</div>'
      if (cartTotal) cartTotal.textContent = '$0.00'
      if (checkoutBtn) checkoutBtn.disabled = true
      return
    }

    cartItems.innerHTML = ''
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i]
      var row = document.createElement('div')
      row.className = 'cart-item'

      var info = document.createElement('div')
      info.className = 'cart-item-info'
      info.innerHTML = '<span class="cart-item-emoji">' + item.emoji + '</span>' +
        '<div><div class="cart-item-name">' + esc(item.name) + '</div>' +
        '<div class="cart-item-price">$' + item.price.toFixed(2) + '</div></div>'

      // Qty controls
      var qty = document.createElement('div')
      qty.className = 'cart-item-qty'
      var m = document.createElement('button')
      m.className = 'cart-qty-btn'; m.textContent = '\u2212'
      m.addEventListener('click', function (id) { return function () { changeQuantity(id, -1) } }(item.id))
      var n = document.createElement('span')
      n.className = 'cart-qty-num'; n.textContent = item.quantity
      var p = document.createElement('button')
      p.className = 'cart-qty-btn'; p.textContent = '+'
      p.addEventListener('click', function (id) { return function () { changeQuantity(id, 1) } }(item.id))
      qty.appendChild(m); qty.appendChild(n); qty.appendChild(p)

      var rm = document.createElement('button')
      rm.className = 'cart-item-remove'; rm.textContent = '✕'
      rm.addEventListener('click', function (id) { return function () { removeFromCart(id) } }(item.id))

      row.appendChild(info); row.appendChild(qty); row.appendChild(rm)
      cartItems.appendChild(row)
    }

    if (cartTotal) cartTotal.textContent = '$' + getTotal().toFixed(2)
    if (checkoutBtn) checkoutBtn.disabled = false
  }

  // ── Cart Sidebar ──
  function openCart() {
    if (cartSide) cartSide.classList.add('open')
    if (cartOverlay) cartOverlay.classList.add('show')
    document.body.style.overflow = 'hidden'
    updateCartDisplay()
  }

  function closeCart() {
    if (cartSide) cartSide.classList.remove('open')
    if (cartOverlay) cartOverlay.classList.remove('show')
    document.body.style.overflow = ''
  }

  function bounceCart() {
    if (!cartIcon) return
    cartIcon.classList.add('cart-bounce')
    setTimeout(function () { cartIcon.classList.remove('cart-bounce') }, 400)
    // Add CSS for bounce if not already present
    if (!document.getElementById('bounceStyle')) {
      var s = document.createElement('style')
      s.id = 'bounceStyle'
      s.textContent = '@keyframes cartBounce { 0%{transform:scale(1)} 50%{transform:scale(1.25)} 100%{transform:scale(1)} } .cart-bounce{animation:cartBounce 0.4s ease-out}'
      document.head.appendChild(s)
    }
  }

  // ── Stripe Checkout ──
  function checkout() {
    if (cart.length === 0) return
    if (checkoutBtn) checkoutBtn.disabled = true
    checkoutBtn.innerHTML = '<span class="lock-icon">⏳</span> Processing...'

    var items = cart.map(function (it) {
      return { id: it.id, name: it.name, price: it.price, quantity: it.quantity }
    })

    // Try the AIGENEV7 API server, then fallback to direct payment info
    fetch('/api/store/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items }),
    })
      .then(function (r) {
        if (!r.ok) { return r.json().then(function (e) { throw new Error(e.error || 'Checkout failed') }) }
        return r.json()
      })
      .then(function (d) {
        if (d.url) { window.location.href = d.url }
        else { throw new Error('No checkout URL') }
      })
      .catch(function (e) {
        // Check if API is unavailable (standalone deployment)
        if (e.message === 'TypeError: fetch failed' || e.message.indexOf('Failed to fetch') !== -1) {
          showToast('Checkout requires the AIGENEV7 server. Run "bun inference-cli.js serve" to enable payments.', 'info')
        } else {
          showToast('Checkout error: ' + e.message, 'error')
        }
        if (checkoutBtn) {
          checkoutBtn.disabled = false
          checkoutBtn.innerHTML = '<span style="font-size:0.85rem;">🔒</span> Proceed to Checkout'
        }
      })
  }

  // ── Toast ──
  function showToast(msg, type) {
    var t = document.getElementById('stoToast')
    if (!t) {
      t = document.createElement('div')
      t.id = 'stoToast'
      t.className = 'store-toast'
      document.body.appendChild(t)
    }
    t.className = 'store-toast ' + (type || 'info')
    t.textContent = msg
    t.classList.add('show')
    clearTimeout(t._t)
    t._t = setTimeout(function () { t.classList.remove('show') }, 2800)
  }

  // ── XSS ──
  function esc(s) {
    var d = document.createElement('div')
    d.textContent = s
    return d.innerHTML
  }

  // ── Stripe result ──
  function handleStripeResult() {
    var p = new URLSearchParams(window.location.search)
    if (p.get('session_id')) {
      showToast('✓ Payment successful! Thank you for your purchase.', 'success')
      cart = []; saveCart(); updateCartDisplay(); renderProducts(activeCategory)
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    } else if (p.get('canceled')) {
      showToast('Payment was canceled. Your cart is saved.', 'info')
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }

  // ── Events ──
  if (cartIcon) cartIcon.addEventListener('click', openCart)
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart)
  if (cartClose) cartClose.addEventListener('click', closeCart)
  if (cartClear) cartClear.addEventListener('click', clearCart)
  if (checkoutBtn) checkoutBtn.addEventListener('click', checkout)

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && cartSide && cartSide.classList.contains('open')) closeCart()
  })

  // ── Bootstrap ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
