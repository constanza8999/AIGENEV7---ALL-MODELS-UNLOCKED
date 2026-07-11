/* ════════════════════════════════════════════════════════
   aigen7ev.store — E-Commerce Storefront
   Integrated cart, checkout, and Stripe payment processing.
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict'

  // ── State ──────────────────────────────────────────
  var products = window.AIGENEV7_STORE_PRODUCTS || []
  var categories = window.AIGENEV7_STORE_CATEGORIES || {}
  var cart = []
  var activeCategory = 'subscriptions'

  // DOM refs
  var storeGrid = document.getElementById('storeGrid')
  var storeCats = document.getElementById('storeCategories')
  var cartIcon = document.getElementById('cartIcon')
  var cartCount = document.getElementById('cartCount')
  var cartSidebar = document.getElementById('cartSidebar')
  var cartOverlay = document.getElementById('cartOverlay')
  var cartItems = document.getElementById('cartItems')
  var cartTotal = document.getElementById('cartTotal')
  var checkoutBtn = document.getElementById('checkoutBtn')
  var cartClose = document.getElementById('cartClose')
  var cartClear = document.getElementById('cartClear')

  // ── Init ───────────────────────────────────────────
  function init() {
    if (!storeGrid || products.length === 0) return

    // Load cart from localStorage
    loadCart()

    renderCategories()
    renderProducts('subscriptions')
    updateCartUI()
  }

  // ── Render Category Tabs ───────────────────────────
  function renderCategories() {
    if (!storeCats) return
    storeCats.innerHTML = ''

    var catKeys = Object.keys(categories)
    for (var i = 0; i < catKeys.length; i++) {
      var key = catKeys[i]
      var cat = categories[key]
      var count = products.filter(function (p) { return p.category === key }).length

      var btn = document.createElement('button')
      btn.className = 'store-cat-btn' + (key === 'subscriptions' ? ' active' : '')
      btn.dataset.cat = key
      btn.innerHTML = cat.emoji + ' ' + cat.label + ' <span class=\"store-cat-count\">' + count + '</span>'

      ;(function (k) {
        btn.addEventListener('click', function () {
          activeCategory = k
          var allBtns = storeCats.querySelectorAll('.store-cat-btn')
          for (var b = 0; b < allBtns.length; b++) {
            allBtns[b].classList.toggle('active', allBtns[b].dataset.cat === k)
          }
          renderProducts(k)
        })
      })(key)

      storeCats.appendChild(btn)
    }
  }

  // ── Render Products ────────────────────────────────
  function renderProducts(category) {
    if (!storeGrid) return

    var filtered = products.filter(function (p) { return p.category === category })
    if (filtered.length === 0) {
      storeGrid.innerHTML = '<div class=\"store-empty\">No products in this category yet.</div>'
      return
    }

    storeGrid.innerHTML = ''
    for (var i = 0; i < filtered.length; i++) {
      var product = filtered[i]
      var card = document.createElement('div')
      card.className = 'store-card'
      if (product.popular) card.classList.add('store-card-popular')
      if (product.featured) card.classList.add('store-card-featured')
      card.style.animationDelay = (i * 0.05) + 's'

      // Popular badge
      if (product.popular) {
        var badge = document.createElement('div')
        badge.className = 'store-card-badge'
        badge.textContent = '★ Most Popular'
        card.appendChild(badge)
      }

      // Featured badge
      if (product.featured && !product.popular) {
        var fBadge = document.createElement('div')
        fBadge.className = 'store-card-badge store-card-badge-featured'
        fBadge.textContent = '✦ Featured'
        card.appendChild(fBadge)
      }

      // Emoji
      var emojiDiv = document.createElement('div')
      emojiDiv.className = 'store-card-emoji'
      emojiDiv.textContent = product.emoji || '📦'
      card.appendChild(emojiDiv)

      // Name
      var nameDiv = document.createElement('div')
      nameDiv.className = 'store-card-name'
      nameDiv.textContent = product.name
      card.appendChild(nameDiv)

      // Description
      var descDiv = document.createElement('div')
      descDiv.className = 'store-card-desc'
      descDiv.textContent = product.description
      card.appendChild(descDiv)

      // Price row
      var priceRow = document.createElement('div')
      priceRow.className = 'store-card-price-row'

      var priceDiv = document.createElement('div')
      priceDiv.className = 'store-card-price'
      priceDiv.textContent = '$' + product.price.toFixed(2) + (product.unit !== 'once' ? '/' + product.unit : '')
      priceRow.appendChild(priceDiv)

      // Savings badge
      if (product.savings) {
        var savingsDiv = document.createElement('div')
        savingsDiv.className = 'store-card-savings'
        savingsDiv.textContent = product.savings
        priceRow.appendChild(savingsDiv)
      }

      card.appendChild(priceRow)

      // Add to cart button
      var addBtn = document.createElement('button')
      addBtn.className = 'store-card-btn'
      addBtn.textContent = cart.some(function (c) { return c.id === product.id })
        ? '✓ In Cart'
        : 'Add to Cart'
      if (cart.some(function (c) { return c.id === product.id })) {
        addBtn.classList.add('in-cart')
      }
      ;(function (prod) {
        addBtn.addEventListener('click', function () {
          toggleCart(prod, addBtn)
        })
      })(product)
      card.appendChild(addBtn)

      storeGrid.appendChild(card)
    }
  }

  // ── Cart Logic ────────────────────────────────────
  function toggleCart(product, btn) {
    var idx = -1
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === product.id) { idx = i; break }
    }

    if (idx !== -1) {
      cart.splice(idx, 1)
      if (btn) { btn.textContent = 'Add to Cart'; btn.classList.remove('in-cart') }
      showStoreToast('Removed from cart', 'info')
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        emoji: product.emoji || '📦',
        price: product.price,
        unit: product.unit,
        quantity: 1,
      })
      if (btn) { btn.textContent = '✓ In Cart'; btn.classList.add('in-cart') }
      showStoreToast('Added to cart!', 'success')
      // Bounce cart icon
      if (cartIcon) {
        cartIcon.classList.add('cart-bounce')
        setTimeout(function () { cartIcon.classList.remove('cart-bounce') }, 400)
      }
    }

    saveCart()
    updateCartUI()
  }

  function removeFromCart(productId) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === productId) { cart.splice(i, 1); break }
    }
    saveCart()
    updateCartUI()
    renderProducts(activeCategory)
  }

  function changeQuantity(productId, delta) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === productId) {
        var newQty = cart[i].quantity + delta
        if (newQty <= 0) {
          cart.splice(i, 1)
        } else {
          cart[i].quantity = newQty
        }
        break
      }
    }
    saveCart()
    updateCartUI()
  }

  function clearCart() {
    cart = []
    saveCart()
    updateCartUI()
    renderProducts(activeCategory)
    showStoreToast('Cart cleared', 'info')
  }

  function getCartTotal() {
    var total = 0
    for (var i = 0; i < cart.length; i++) {
      total += cart[i].price * cart[i].quantity
    }
    return total
  }

  function getCartCount() {
    var count = 0
    for (var i = 0; i < cart.length; i++) {
      count += cart[i].quantity
    }
    return count
  }

  function saveCart() {
    try {
      localStorage.setItem('aigenev7_cart', JSON.stringify(cart))
    } catch (e) {
      // localStorage full or unavailable
    }
  }

  function loadCart() {
    try {
      var saved = localStorage.getItem('aigenev7_cart')
      if (saved) {
        var parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) cart = parsed
      }
    } catch (e) {
      cart = []
    }
  }

  // ── Cart UI ───────────────────────────────────────
  function updateCartUI() {
    var count = getCartCount()
    if (cartCount) {
      cartCount.textContent = count
      cartCount.classList.toggle('cart-count-visible', count > 0)
    }

    if (!cartItems) return

    if (cart.length === 0) {
      cartItems.innerHTML = '<div class=\"cart-empty\">Your cart is empty. Browse the store and add items!</div>'
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
      info.innerHTML = '<span class=\"cart-item-emoji\">' + item.emoji + '</span>' +
        '<div><div class=\"cart-item-name\">' + escHtml(item.name) + '</div>' +
        '<div class=\"cart-item-price\">$' + item.price.toFixed(2) + '</div></div>'

      // Quantity controls
      var qtyCtrl = document.createElement('div')
      qtyCtrl.className = 'cart-item-qty'

      var minusBtn = document.createElement('button')
      minusBtn.className = 'cart-qty-btn'
      minusBtn.textContent = '\u2212'
      minusBtn.title = 'Decrease quantity'
      ;(function (id) {
        minusBtn.addEventListener('click', function () { changeQuantity(id, -1) })
      })(item.id)
      qtyCtrl.appendChild(minusBtn)

      var qtySpan = document.createElement('span')
      qtySpan.className = 'cart-qty-num'
      qtySpan.textContent = item.quantity
      qtyCtrl.appendChild(qtySpan)

      var plusBtn = document.createElement('button')
      plusBtn.className = 'cart-qty-btn'
      plusBtn.textContent = '+'
      plusBtn.title = 'Increase quantity'
      ;(function (id) {
        plusBtn.addEventListener('click', function () { changeQuantity(id, 1) })
      })(item.id)
      qtyCtrl.appendChild(plusBtn)

      var remove = document.createElement('button')
      remove.className = 'cart-item-remove'
      remove.textContent = '✕'
      remove.title = 'Remove'
      ;(function (id) {
        remove.addEventListener('click', function () { removeFromCart(id) })
      })(item.id)

      row.appendChild(info)
      row.appendChild(qtyCtrl)
      row.appendChild(remove)
      cartItems.appendChild(row)
    }

    if (cartTotal) cartTotal.textContent = '$' + getCartTotal().toFixed(2)
    if (checkoutBtn) checkoutBtn.disabled = false
  }

  // ── Open / Close Cart Sidebar ─────────────────────
  function openCart() {
    if (cartSidebar) cartSidebar.classList.add('open')
    if (cartOverlay) cartOverlay.classList.add('show')
    document.body.style.overflow = 'hidden'
    updateCartUI()
  }

  function closeCart() {
    if (cartSidebar) cartSidebar.classList.remove('open')
    if (cartOverlay) cartOverlay.classList.remove('show')
    document.body.style.overflow = ''
  }

  // ── Stripe Checkout ──────────────────────────────
  function checkout() {
    if (cart.length === 0) return
    if (checkoutBtn) checkoutBtn.disabled = true
    checkoutBtn.textContent = 'Processing...'

    var items = cart.map(function (item) {
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }
    })

    fetch('/api/store/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items }),
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (err) { throw new Error(err.error || 'Checkout failed') })
        }
        return res.json()
      })
      .then(function (data) {
        if (data.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url
        } else if (data.sessionId) {
          // If using Stripe.js redirectToCheckout
          showStoreToast('Redirecting to Stripe...', 'info')
        } else {
          throw new Error('No checkout URL returned')
        }
      })
      .catch(function (err) {
        showStoreToast('Checkout error: ' + err.message, 'error')
        if (checkoutBtn) { checkoutBtn.disabled = false; checkoutBtn.textContent = 'Proceed to Checkout' }
      })
  }

  // ── Toast Notifications ───────────────────────────
  function showStoreToast(msg, type) {
    var toast = document.getElementById('storeToast')
    if (!toast) {
      toast = document.createElement('div')
      toast.id = 'storeToast'
      toast.className = 'store-toast'
      document.body.appendChild(toast)
    }
    toast.className = 'store-toast ' + (type || 'info')
    toast.textContent = msg
    toast.classList.add('show')
    clearTimeout(toast._timeout)
    toast._timeout = setTimeout(function () { toast.classList.remove('show') }, 2500)
  }

  // ── XSS-safe escape ────────────────────────────────
  function escHtml(str) {
    var d = document.createElement('div')
    d.textContent = str
    return d.innerHTML
  }

  // ── Handle Stripe redirect result ─────────────────
  function handleStripeResult() {
    // Check if redirected back after successful payment
    var params = new URLSearchParams(window.location.search)
    if (params.get('session_id')) {
      showStoreToast('✓ Payment successful! Thank you for your purchase.', 'success')
      // Clear cart after successful payment
      cart = []
      saveCart()
      updateCartUI()
      renderProducts(activeCategory)
      // Clean URL
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    } else if (params.get('canceled')) {
      showStoreToast('Payment was canceled. Your cart is saved.', 'info')
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }

  // ── Events ────────────────────────────────────────
  if (cartIcon) cartIcon.addEventListener('click', openCart)
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart)
  if (cartClose) cartClose.addEventListener('click', closeCart)
  if (cartClear) cartClear.addEventListener('click', clearCart)
  if (checkoutBtn) checkoutBtn.addEventListener('click', checkout)

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && cartSidebar && cartSidebar.classList.contains('open')) {
      closeCart()
    }
  })

  // ── Boot ──────────────────────────────────────────
  handleStripeResult()

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
