/* ════════════════════════════════════════════════════════
   AIGENEV7 — Quantum Entanglement Visualizer
   Interactive canvas particle simulation demonstrating
   quantum entanglement, superposition, and measurement.
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict'

  var canvas = document.getElementById('entanglementCanvas')
  if (!canvas) return

  var ctx = canvas.getContext('2d')
  var W, H
  var particles = []
  var mouseX = -1, mouseY = -1
  var animId = null
  var isRunning = true
  var measureParticle = null
  var measureFlash = 0

  // ── Configuration ──
  var CONFIG = {
    count: 28,
    minDist: 60,
    entangleDist: 80,
    repelForce: 0.08,
    centerForce: 0.002,
    maxSpeed: 1.2,
    glowRadius: 20,
    trailAlpha: 0.15,
    entanglementColor: '#8855ff',
  }

  // ── Particle ──
  function createParticle(i) {
    var angle = Math.random() * Math.PI * 2
    var radius = 50 + Math.random() * (Math.min(W, H) * 0.3)
    return {
      x: W / 2 + Math.cos(angle) * radius,
      y: H / 2 + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      spin: Math.random() > 0.5 ? 1 : -1,
      spinPhase: Math.random() * Math.PI * 2,
      entangled: false,
      entangledPartner: null,
      entanglementStrength: 0,
      measured: false,
      measuredValue: null,
      collapseAnim: 0,
      radius: 3 + Math.random() * 2,
      hue: 120 + Math.random() * 100,
      opacity: 0.6 + Math.random() * 0.4,
      id: i,
      trail: [],
    }
  }

  function initParticles() {
    particles = []
    for (var i = 0; i < CONFIG.count; i++) {
      particles.push(createParticle(i))
    }
  }

  // ── Resize ──
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect()
    W = rect.width
    H = Math.max(300, Math.min(500, rect.width * 0.55))
    canvas.width = W * devicePixelRatio
    canvas.height = H * devicePixelRatio
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.scale(devicePixelRatio, devicePixelRatio)
    if (particles.length === 0) initParticles()
  }

  // ── Update Physics ──
  function update() {
    var dt = 0.016

    // Update each particle
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i]

      // Center attraction
      p.vx += (W / 2 - p.x) * CONFIG.centerForce
      p.vy += (H / 2 - p.y) * CONFIG.centerForce

      // Repulsion from other particles
      for (var j = i + 1; j < particles.length; j++) {
        var q = particles[j]
        var dx = p.x - q.x
        var dy = p.y - q.y
        var dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 1) dist = 1

        // Repulsion
        var force = CONFIG.repelForce / (dist * dist * 0.01 + 1)
        p.vx += (dx / dist) * force
        p.vy += (dy / dist) * force
        q.vx -= (dx / dist) * force
        q.vy -= (dy / dist) * force

        // Entanglement
        if (!p.measured && !q.measured && dist < CONFIG.entangleDist && Math.random() < 0.003) {
          if (!p.entangled && !q.entangled) {
            p.entangled = true
            q.entangled = true
            p.entangledPartner = q
            q.entangledPartner = p
            p.entanglementStrength = 1
            q.entanglementStrength = 1
            // Correlated spins: opposite spins for anti-correlation (Bell state)
            q.spin = -p.spin
            q.spinPhase = p.spinPhase + Math.PI
          }
        }
      }

      // Damping
      p.vx *= 0.98
      p.vy *= 0.98

      // Speed limit
      var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
      if (speed > CONFIG.maxSpeed) {
        p.vx = (p.vx / speed) * CONFIG.maxSpeed
        p.vy = (p.vy / speed) * CONFIG.maxSpeed
      }

      // Position update
      p.x += p.vx
      p.y += p.vy

      // Spin oscillation (quantum phase)
      if (!p.measured) {
        p.spinPhase += 0.03
        // Superposition: spin oscillates
        if (!p.entangled || Math.random() < 0.01) {
          // In superposition - spin can change
          p.spin = Math.sin(p.spinPhase) > 0 ? 1 : -1
        }
      }

      // Entanglement decay
      if (p.entangled) {
        var partner = p.entangledPartner
        if (partner) {
          var dx2 = p.x - partner.x
          var dy2 = p.y - partner.y
          var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
          if (dist2 > CONFIG.entangleDist * 3) {
            p.entangled = false
            p.entangledPartner = null
            p.entanglementStrength = 0
          } else if (dist2 < CONFIG.entangleDist) {
            p.entanglementStrength = Math.min(1, p.entanglementStrength + 0.01)
            // Entangled particles pull together slightly
            p.vx += (partner.x - p.x) * 0.0005
            p.vy += (partner.y - p.y) * 0.0005
          } else {
            p.entanglementStrength = Math.max(0, p.entanglementStrength - 0.005)
          }
        }
      }

      // Collapse animation
      if (p.measured && p.collapseAnim < 1) {
        p.collapseAnim += 0.03
      }

      // Trail
      p.trail.push({ x: p.x, y: p.y })
      if (p.trail.length > 12) p.trail.shift()

      // Boundary bounce
      if (p.x < 10) { p.x = 10; p.vx *= -0.5 }
      if (p.x > W - 10) { p.x = W - 10; p.vx *= -0.5 }
      if (p.y < 10) { p.y = 10; p.vy *= -0.5 }
      if (p.y > H - 10) { p.y = H - 10; p.vy *= -0.5 }
    }

    // Measure flash decay
    if (measureFlash > 0) measureFlash -= 0.02
  }

  // ── Draw ──
  function draw() {
    ctx.clearRect(0, 0, W, H)

    // Background
    var grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6)
    grad.addColorStop(0, 'rgba(136, 85, 255, 0.03)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Grid dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    for (var gx = 0; gx < W; gx += 40) {
      for (var gy = 0; gy < H; gy += 40) {
        ctx.beginPath()
        ctx.arc(gx, gy, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw entanglement lines
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i]
      if (p.entangled && p.entangledPartner && p.entanglementStrength > 0.1) {
        var q = p.entangledPartner
        var alpha = p.entanglementStrength * 0.5
        var pulse = 0.5 + 0.5 * Math.sin(Date.now() / 500 + p.id)

        // Glowing line
        var grad2 = ctx.createLinearGradient(p.x, p.y, q.x, q.y)
        grad2.addColorStop(0, 'rgba(136, 85, 255, ' + (alpha * pulse) + ')')
        grad2.addColorStop(0.5, 'rgba(0, 255, 136, ' + (alpha * pulse * 0.6) + ')')
        grad2.addColorStop(1, 'rgba(136, 85, 255, ' + (alpha * pulse) + ')')

        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(q.x, q.y)
        ctx.strokeStyle = grad2
        ctx.lineWidth = 1.5 + p.entanglementStrength * 2 * pulse
        ctx.shadowColor = 'rgba(136, 85, 255, ' + (alpha * 0.5) + ')'
        ctx.shadowBlur = 15
        ctx.stroke()
        ctx.shadowBlur = 0

        // Label
        var mx = (p.x + q.x) / 2
        var my = (p.y + q.y) / 2 - 12
        ctx.fillStyle = 'rgba(136, 85, 255, ' + (alpha * 0.8) + ')'
        ctx.font = '9px JetBrains Mono, monospace'
        ctx.textAlign = 'center'
        ctx.fillText('ENTANGLED', mx, my)
      }
    }

    // Draw trails
    for (var j = 0; j < particles.length; j++) {
      var pt = particles[j]
      if (pt.trail.length < 2) continue
      for (var t = 0; t < pt.trail.length - 1; t++) {
        var alpha2 = (t / pt.trail.length) * 0.3
        ctx.beginPath()
        ctx.moveTo(pt.trail[t].x, pt.trail[t].y)
        ctx.lineTo(pt.trail[t + 1].x, pt.trail[t + 1].y)
        ctx.strokeStyle = 'rgba(136, 85, 255, ' + alpha2 + ')'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }

    // Draw particles
    for (var k = 0; k < particles.length; k++) {
      var pp = particles[k]

      // Glow
      var glowGrad = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, CONFIG.glowRadius)
      if (pp.measured && pp.collapseAnim < 1) {
        // Collapse: bright flash
        var flashAlpha = 0.3 * (1 - pp.collapseAnim)
        glowGrad.addColorStop(0, 'rgba(255, 255, 255, ' + flashAlpha + ')')
        glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
      } else if (pp.entangled) {
        glowGrad.addColorStop(0, 'rgba(136, 85, 255, 0.2)')
        glowGrad.addColorStop(1, 'rgba(136, 85, 255, 0)')
      } else if (!pp.measured) {
        // Superposition glow
        hue = pp.spin === 1 ? '0, 255, 136' : '68, 136, 255'
        glowGrad.addColorStop(0, 'rgba(' + hue + ', 0.15)')
        glowGrad.addColorStop(1, 'rgba(' + hue + ', 0)')
      } else {
        // Measured: solid state
        var measuredColor = pp.measuredValue === 1 ? '0, 255, 136' : '68, 136, 255'
        glowGrad.addColorStop(0, 'rgba(' + measuredColor + ', 0.08)')
        glowGrad.addColorStop(1, 'rgba(' + measuredColor + ', 0)')
      }
      ctx.fillStyle = glowGrad
      ctx.beginPath()
      ctx.arc(pp.x, pp.y, CONFIG.glowRadius, 0, Math.PI * 2)
      ctx.fill()

      // Particle dot
      var color
      if (pp.measured) {
        color = pp.measuredValue === 1 ? '#00ff88' : '#4488ff'
      } else if (pp.entangled) {
        // Purple glow for entangled
        color = '#aa66ff'
      } else {
        // Spin determines color
        color = pp.spin === 1 ? '#00ff88' : '#4488ff'
      }

      var radius = pp.radius
      if (pp.measured && pp.collapseAnim < 1) {
        radius += (1 - pp.collapseAnim) * 4
      } else if (pp.entangled) {
        radius += Math.sin(Date.now() / 300 + pp.id) * 0.5
      }

      // Shadow
      ctx.shadowColor = color
      ctx.shadowBlur = pp.entangled ? 12 : 6

      ctx.beginPath()
      ctx.arc(pp.x, pp.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.globalAlpha = pp.opacity
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      // Spin indicator (for non-measured particles - superposition ring)
      if (!pp.measured) {
        ctx.beginPath()
        ctx.arc(pp.x, pp.y, radius + 4, 0, Math.PI * 2 * (0.5 + 0.5 * Math.sin(pp.spinPhase)))
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.textAlign = 'left'
    var labels = [
      '⚛️ ' + particles.length + ' particles in superposition',
      '🔄 Click a particle to measure (collapse wavefunction)',
    ]
    for (var l = 0; l < labels.length; l++) {
      ctx.fillText(labels[l], 12, 16 + l * 18)
    }

    // Measure flash overlay
    if (measureFlash > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (measureFlash * 0.06) + ')'
      ctx.fillRect(0, 0, W, H)
    }
  }

  // ── Interaction: Click to measure ──
  function handleClick(e) {
    var rect = canvas.getBoundingClientRect()
    var clickX = (e.clientX || e.touches[0].clientX) - rect.left
    var clickY = (e.clientY || e.touches[0].clientY) - rect.top

    // Find closest particle
    var closest = null
    var closestDist = 30
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i]
      var dx = clickX - p.x
      var dy = clickY - p.y
      var dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < closestDist) {
        closestDist = dist
        closest = p
      }
    }

    if (closest && !closest.measured) {
      // Measure the particle - collapse wavefunction
      closest.measured = true
      closest.measuredValue = Math.random() > 0.5 ? 1 : -1
      closest.collapseAnim = 0
      measureFlash = 1

      // Entangled partner instantly collapses to opposite spin
      if (closest.entangled && closest.entangledPartner) {
        var partner = closest.entangledPartner
        partner.measured = true
        partner.measuredValue = -closest.measuredValue
        partner.collapseAnim = 0
        partner.entangled = false
        partner.entangledPartner = null
        partner.entanglementStrength = 0

        // Show a brief flash on the partner
        measureFlash = 1

        // Un-entangle the measured particle
        closest.entangled = false
        closest.entangledPartner = null
        closest.entanglementStrength = 0
      }

      // Show toast with measurement result
      showEntanglementToast(
        '⚛️ Measured: spin-' + (closest.measuredValue === 1 ? 'up' : 'down') +
        (closest.entangledPartner ? ' (partner: spin-' + (partner.measuredValue === 1 ? 'up' : 'down') + ')' : ''),
        'info'
      )
    } else if (closest && closest.measured) {
      // Reset already-measured particles
      closest.measured = false
      closest.measuredValue = null
      closest.collapseAnim = 0
      closest.spinPhase = Math.random() * Math.PI * 2
      showEntanglementToast('♻️ Particle returned to superposition', 'info')
    }
  }

  // ── Toast ──
  function showEntanglementToast(msg, type) {
    var t = document.getElementById('entanglementToast')
    if (!t) {
      t = document.createElement('div')
      t.id = 'entanglementToast'
      t.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);padding:0.5rem 1rem;border-radius:8px;font-size:0.8rem;font-weight:600;opacity:0;transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275);z-index:700;pointer-events:none;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);'
      document.body.appendChild(t)
    }
    t.textContent = msg
    t.style.background = type === 'info' ? 'rgba(136,85,255,0.12)' : 'rgba(0,255,136,0.12)'
    t.style.border = type === 'info' ? '1px solid rgba(136,85,255,0.2)' : '1px solid rgba(0,255,136,0.2)'
    t.style.color = type === 'info' ? '#8855ff' : '#00ff88'
    t.style.opacity = '1'
    t.style.transform = 'translateX(-50%) translateY(0)'
    clearTimeout(t._t)
    t._t = setTimeout(function () {
      t.style.opacity = '0'
      t.style.transform = 'translateX(-50%) translateY(20px)'
    }, 2500)
  }

  // ── Controls ──
  var resetBtn = document.getElementById('entangleReset')
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      initParticles()
      measureFlash = 1
      showEntanglementToast('♻️ Wavefunction reset — particles in superposition', 'info')
    })
  }

  // ── Loop ──
  function loop() {
    update()
    draw()
    animId = requestAnimationFrame(loop)
  }

  // ── Events ──
  canvas.addEventListener('click', handleClick)
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault()
    handleClick(e)
  }, { passive: false })

  window.addEventListener('resize', resize)

  // ── Init ──
  resize()
  initParticles()
  loop()
})()
