/* ════════════════════════════════════════════════════════
   AIGENEV7 — Animations & UI Effects
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict'

  // ── 1. PARTICLES ────────────────────────────────────
  ;(function () {
    var c = document.getElementById('particles')
    if (!c) return
    var count = window.matchMedia('(max-width:600px)').matches ? 15 : 40
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div')
      p.className = 'particle'
      p.style.left = Math.random() * 100 + '%'
      p.style.animationDuration = (15 + Math.random() * 25) + 's'
      p.style.animationDelay = (Math.random() * 20) + 's'
      p.style.width = p.style.height = (1 + Math.random() * 2) + 'px'
      c.appendChild(p)
    }
  })()

  // ── 2. SUBTITLE TYPING ──────────────────────────────
  ;(function () {
    var el = document.getElementById('subtitle-text')
    if (!el) return
    var texts = window.AIGENEV7_SUBTITLES || [
      'Free AI coding assistant.',
      'No subscription. No censorship.',
    ]
    var ti = 0, ci = 0, del = false

    function type() {
      var cur = texts[ti]
      if (!del) {
        el.textContent = cur.substring(0, ci + 1)
        ci++
        if (ci === cur.length) {
          setTimeout(function () { del = true; type() }, 2500)
          return
        }
        setTimeout(type, 40 + Math.random() * 30)
      } else {
        el.textContent = cur.substring(0, ci - 1)
        ci--
        if (ci === 0) {
          del = false
          ti = (ti + 1) % texts.length
          setTimeout(type, 500)
          return
        }
        setTimeout(type, 20 + Math.random() * 15)
      }
    }
    setTimeout(type, 1000)
  })()

  // ── 3. TERMINAL ANIMATION ───────────────────────────
  ;(function () {
    var demos = [
      [
        { type: 'cmd', text: 'aigenev7 "build a rest api with express"' },
        { type: 'info', text: '[AIGENEV7] DeepSeek V4 Pro inferring...' },
        { type: 'progress', progress: 30 },
        { type: 'out', text: 'Creating project structure...' },
        { type: 'progress', progress: 60 },
        { type: 'out', text: 'Installing express, cors, helmet...' },
        { type: 'progress', progress: 85 },
        { type: 'out', text: 'Generated src/index.js, src/routes/, src/middleware/' },
        { type: 'progress', progress: 100 },
        { type: 'info', text: '[AIGENEV7] Done (12.4s, ~1,847 tokens)' },
        { type: 'prompt' },
      ],
      [
        { type: 'cmd', text: 'aigenev7 "refactor auth middleware to use JWT"' },
        { type: 'info', text: '[AIGENEV7] Claude Sonnet 4 analyzing code...' },
        { type: 'progress', progress: 25 },
        { type: 'out', text: 'Reading src/middleware/auth.js...' },
        { type: 'progress', progress: 50 },
        { type: 'out', text: 'Rewriting authentication logic...' },
        { type: 'progress', progress: 75 },
        { type: 'out', text: 'Added JWT verification, refresh tokens, error handling' },
        { type: 'progress', progress: 100 },
        { type: 'info', text: '[AIGENEV7] Done (18.2s, ~3,201 tokens)' },
        { type: 'prompt' },
      ],
      [
        { type: 'cmd', text: 'aigenev7 "find the memory leak in this react app"' },
        { type: 'info', text: '[AIGENEV7] GPT-5 tracing execution...' },
        { type: 'progress', progress: 20 },
        { type: 'out', text: 'Scanning component tree...' },
        { type: 'progress', progress: 45 },
        { type: 'error', text: 'Found 3 useEffect missing cleanup functions' },
        { type: 'progress', progress: 70 },
        { type: 'out', text: 'Auto-fixing useCallback dependencies...' },
        { type: 'progress', progress: 100 },
        { type: 'info', text: '[AIGENEV7] Fixed 3 memory leaks (8.7s, ~1,024 tokens)' },
        { type: 'prompt' },
      ],
    ]

    var di = 0, li = 0, ci2 = 0, curEl = null, progFill = null, running = false
    var tb = document.getElementById('terminal-body')
    var rst = document.getElementById('terminal-restart')
    if (!tb) return

    function run() {
      running = true; li = 0; ci2 = 0; curEl = null; progFill = null
      tb.innerHTML = ''
      if (rst) rst.style.display = 'none'
      nextLine()
    }

    function nextLine() {
      if (li >= demos[di].length) { running = false; if (rst) rst.style.display = 'block'; return }
      var line = demos[di][li]
      if (line.type === 'progress') {
        if (!progFill) {
          var pl = document.createElement('div')
          pl.className = 'terminal-line'
          pl.innerHTML = '<span class="dim">[          ]</span>'
          tb.appendChild(pl)
          var pc = document.createElement('div')
          pc.className = 'terminal-progress'
          var bar = document.createElement('div')
          bar.className = 'terminal-progress-bar'
          var fill = document.createElement('div')
          fill.className = 'terminal-progress-fill'
          fill.style.width = '0%'
          bar.appendChild(fill)
          pc.appendChild(bar)
          tb.appendChild(pc)
          progFill = fill
        }
        progFill.style.width = line.progress + '%'
        tb.scrollTop = tb.scrollHeight
        li++
        setTimeout(nextLine, line.progress === 100 ? 800 : 200 + Math.random() * 300)
        return
      }
      if (line.type === 'prompt') {
        var e = document.createElement('div')
        e.className = 'terminal-line'
        e.innerHTML = '<span class="prompt">$</span> <span class="cursor-char"></span>'
        tb.appendChild(e)
        tb.scrollTop = tb.scrollHeight
        li++
        setTimeout(function () { di = (di + 1) % demos.length; progFill = null; setTimeout(run, 1500) }, 2000)
        return
      }
      if (!curEl) {
        curEl = document.createElement('div')
        curEl.className = 'terminal-line'
        var cls = line.type === 'cmd' ? 'output' : (line.type === 'info' ? 'dim' : (line.type === 'error' ? 'error' : 'output'))
        curEl.innerHTML = line.type === 'cmd' ? '<span class="prompt">$</span> <span class="' + cls + '"></span>' : '<span class="' + cls + '"></span>'
        tb.appendChild(curEl)
        tb.scrollTop = tb.scrollHeight
      }
      var span = curEl.querySelector('span:last-child')
      if (span && ci2 < line.text.length) {
        span.textContent += line.text[ci2]
        ci2++
        setTimeout(nextLine, line.type === 'cmd' ? 25 : 10)
      } else if (ci2 >= line.text.length) {
        li++; ci2 = 0; curEl = null
        setTimeout(nextLine, 600)
      }
    }

    if (rst) rst.addEventListener('click', function () { di = (di + 1) % demos.length; progFill = null; run() })
    setTimeout(run, 1500)
  })()

  // ── 4. SCROLL REVEAL & STAT COUNTERS ────────────────
  ;(function () {
    // Feature cards fade-in on scroll
    var cards = document.querySelectorAll('.feature-card')
    for (var i = 0; i < cards.length; i++) {
      ;(function (card) {
        if (!('IntersectionObserver' in window)) { card.classList.add('visible'); return }
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add('visible')
              obs.unobserve(e.target)
            }
          })
        }, { threshold: 0.1 })
        obs.observe(card)
      })(cards[i])
    }

    // Stat counters animation
    var animated = false
    var statSection = document.querySelector('.stats-section')
    if (statSection) {
      ;(function () {
        if (!('IntersectionObserver' in window) || animated) {
          if (!animated) { animated = true; animateStats() }
          return
        }
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting && !animated) {
              animated = true
              animateStats()
              obs.unobserve(e.target)
            }
          })
        }, { threshold: 0.3 })
        obs.observe(statSection)
      })()
    }

    function animateStats() {
      var counters = document.querySelectorAll('.stat-number')
      for (var i = 0; i < counters.length; i++) {
        ;(function (counter) {
          if (counter.textContent.trim() === '\u221E') return
          var target = parseInt(counter.getAttribute('data-target'))
          if (!target) return
          var step = Math.ceil(target / 60)
          var cur = 0
          var update = setInterval(function () {
            cur += step
            if (cur >= target) {
              counter.textContent = target
              clearInterval(update)
            } else {
              counter.textContent = cur
            }
          }, 2000 / 60)
        })(counters[i])
      }
    }

    // Model cards click
    var modelCards = document.querySelectorAll('.model-card')
    for (var j = 0; j < modelCards.length; j++) {
      ;(function (card) {
        card.addEventListener('click', function () {
          var was = card.classList.contains('expanded')
          var all = document.querySelectorAll('.model-card')
          for (var k = 0; k < all.length; k++) all[k].classList.remove('expanded')
          if (!was) card.classList.add('expanded')
        })
      })(modelCards[j])
    }
  })()

  // ── 5. COPY COMMAND ─────────────────────────────────
  ;(function () {
    var block = document.querySelector('.command-block')
    var toast = document.getElementById('toast')
    if (!block || !toast) return
    block.addEventListener('click', function () {
      var text = 'bun run inference-cli.js serve'
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text) })
      } else { fallbackCopy(text) }
      block.classList.add('copied')
      toast.classList.add('show')
      setTimeout(function () { toast.classList.remove('show'); block.classList.remove('copied') }, 2000)
    })
    function fallbackCopy(text) {
      var ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  })()
})()
