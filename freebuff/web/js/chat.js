/* ════════════════════════════════════════════════════════
   AIGENEV7 — Agent Chat
   Works standalone with static data.
   If an API backend is available, it connects for inference.
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict'

  // ── State ──────────────────────────────────────────
  var agents = window.AIGENEV7_AGENTS || []
  var models = window.AIGENEV7_MODELS || []
  var currentAgentId = null
  var currentModelId = null
  var messages = []
  var isStreaming = false
  var abortCtrl = null
  var apiAvailable = false

  // DOM refs
  var chips = document.getElementById('agentChips')
  var modelSel = document.getElementById('modelSelect')
  var chatMsgs = document.getElementById('chatMessages')
  var chatInput = document.getElementById('chatInput')
  var sendBtn = document.getElementById('sendBtn')
  var stopBtn = document.getElementById('stopBtn')
  var typingInd = document.getElementById('typingIndicator')
  var curTag = document.getElementById('currentAgentTag')
  var clearBtn = document.getElementById('clearChatBtn')
  var errToast = document.getElementById('errorToast')

  // ── Init ───────────────────────────────────────────
  function init() {
    if (!chips) return

    renderAgentChips()
    renderModelSelect()

    var savedAgent = localStorage.getItem('aigenev7_agent')
    var savedModel = localStorage.getItem('aigenev7_model')

    if (savedAgent && agents.some(function (a) { return a.id === savedAgent })) {
      selectAgent(savedAgent)
    } else if (agents.length) {
      selectAgent(agents[0].id)
    }

    if (savedModel && models.some(function (m) { return m.id === savedModel })) {
      selectModel(savedModel)
    } else if (models.length) {
      selectModel(models[0].id)
    }

    // Update stat counter with model count
    var ms = document.getElementById('modelsStat')
    if (ms) ms.textContent = models.length

    // Check if API is available
    checkApi()

    if (chatInput) {
      chatInput.disabled = false
      chatInput.placeholder = 'Type a message... (Enter to send, Shift+Enter for new line)'
    }
  }

  function checkApi() {
    fetch('/api/agents', { method: 'HEAD' })
      .then(function () {
        apiAvailable = true
        console.log('[AIGENEV7] API backend detected — inference enabled')
      })
      .catch(function () {
        apiAvailable = false
        console.log('[AIGENEV7] No API backend — showing demo mode')
        if (chatInput) chatInput.placeholder = 'Demo mode (no API). Try the Quantum Lab below!'
      })
  }

  // ── Render ─────────────────────────────────────────
  function renderAgentChips() {
    if (!chips) return
    chips.innerHTML = ''
    for (var i = 0; i < agents.length; i++) {
      var agent = agents[i]
      var wrap = document.createElement('div')
      wrap.className = 'chip-with-tip'

      var chip = document.createElement('button')
      chip.className = 'agent-chip'
      chip.dataset.id = agent.id
      chip.innerHTML = '<span class="chip-emoji">' + agent.emoji + '</span> ' + agent.name
      ;(function (id) {
        chip.addEventListener('click', function () { selectAgent(id) })
      })(agent.id)
      wrap.appendChild(chip)

      var tip = document.createElement('div')
      tip.className = 'chip-tooltip'
      tip.innerHTML = '<div class="tip-name">' + agent.emoji + ' ' + agent.name + '</div>' +
        '<div class="tip-desc">' + escHtml(agent.description) + '</div>' +
        '<div class="tip-prompt">' + escHtml(agent.systemPrompt) + '</div>'
      wrap.appendChild(tip)
      chips.appendChild(wrap)
    }
  }

  function renderModelSelect() {
    if (!modelSel) return
    modelSel.innerHTML = ''

    // Group by provider
    var byProvider = {}
    for (var i = 0; i < models.length; i++) {
      var m = models[i]
      if (!byProvider[m.provider]) byProvider[m.provider] = []
      byProvider[m.provider].push(m)
    }

    var providers = Object.keys(byProvider)
    if (providers.length > 1) {
      for (var p = 0; p < providers.length; p++) {
        var provider = providers[p]
        var g = document.createElement('optgroup')
        g.label = provider.charAt(0).toUpperCase() + provider.slice(1)
        var pModels = byProvider[provider]
        for (var j = 0; j < pModels.length; j++) {
          var o = document.createElement('option')
          o.value = pModels[j].id
          o.textContent = pModels[j].displayName || pModels[j].id
          if (pModels[j].multimodal) o.textContent += ' \uD83D\uDCF7'
          g.appendChild(o)
        }
        modelSel.appendChild(g)
      }
    } else {
      for (var k = 0; k < models.length; k++) {
        var o2 = document.createElement('option')
        o2.value = models[k].id
        o2.textContent = models[k].displayName || models[k].id
        if (models[k].multimodal) o2.textContent += ' \uD83D\uDCF7'
        modelSel.appendChild(o2)
      }
    }

    modelSel.addEventListener('change', function () { selectModel(modelSel.value) })
  }

  function selectAgent(id) {
    currentAgentId = id
    var agent = agents.find(function (a) { return a.id === id })
    if (!agent) return
    var allChips = document.querySelectorAll('.agent-chip')
    for (var i = 0; i < allChips.length; i++) {
      allChips[i].classList.toggle('active', allChips[i].dataset.id === id)
    }
    if (curTag) curTag.textContent = agent.emoji + ' ' + agent.name
    localStorage.setItem('aigenev7_agent', id)
  }

  function selectModel(id) {
    currentModelId = id
    if (modelSel) modelSel.value = id
    localStorage.setItem('aigenev7_model', id)
  }

  // ── Messages ──────────────────────────────────────
  function addMsg(role, content) {
    if (!chatMsgs) return null
    var div = document.createElement('div')
    div.className = 'msg ' + role

    var av = document.createElement('div')
    av.className = 'msg-avatar'
    if (role === 'user') {
      av.textContent = '\uD83D\uDC64'
    } else {
      var ag = agents.find(function (a) { return a.id === currentAgentId })
      av.textContent = ag ? ag.emoji : '\uD83E\uDD16'
    }

    var bub = document.createElement('div')
    bub.className = 'msg-bubble'
    bub.innerHTML = renderMarkdown(content)

    div.appendChild(av)
    div.appendChild(bub)
    chatMsgs.appendChild(div)
    chatMsgs.scrollTop = chatMsgs.scrollHeight
    return bub
  }

  // ── Prompt tone (Web Audio API chime) ─────────────
  var toneCtx = null
  function playPromptTone() {
    try {
      if (!toneCtx) toneCtx = new (window.AudioContext || window.webkitAudioContext)()
      if (toneCtx.state === 'suspended') toneCtx.resume()
      // Play a short ascending two-note chime: C5 (523Hz) → E5 (659Hz)
      var now = toneCtx.currentTime
      var g1 = toneCtx.createGain()
      g1.connect(toneCtx.destination)
      g1.gain.setValueAtTime(0.15, now)
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
      var o1 = toneCtx.createOscillator()
      o1.type = 'sine'
      o1.frequency.setValueAtTime(523.25, now)
      o1.connect(g1)
      o1.start(now)
      o1.stop(now + 0.15)

      var g2 = toneCtx.createGain()
      g2.connect(toneCtx.destination)
      g2.gain.setValueAtTime(0.12, now + 0.12)
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      var o2 = toneCtx.createOscillator()
      o2.type = 'sine'
      o2.frequency.setValueAtTime(659.25, now + 0.12)
      o2.connect(g2)
      o2.start(now + 0.12)
      o2.stop(now + 0.3)
    } catch {}
  }

  // ── Send / Receive ────────────────────────────────
  function sendMsg() {
    if (!chatInput) return
    var text = chatInput.value.trim()
    if (!text || isStreaming || !currentModelId) return
    playPromptTone()

    // Add user message
    addMsg('user', text)
    messages.push({ role: 'user', content: text })
    chatInput.value = ''
    chatInput.style.height = 'auto'

    // Show typing & stop button
    isStreaming = true
    if (typingInd) typingInd.classList.add('active')
    if (stopBtn) stopBtn.classList.add('show')
    if (sendBtn) sendBtn.classList.add('hide')
    chatInput.disabled = true

    // Placeholder bubble
    var bubble = addMsg('assistant', '')
    if (bubble) bubble.textContent = ''

    if (apiAvailable) {
      callApi(text, bubble)
    } else {
      demoResponse(text, bubble)
    }
  }

  function callApi(text, bubble) {
    try {
      abortCtrl = new AbortController()
      fetch('/api/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          model: currentModelId,
          agent: currentAgentId,
          messages: messages.slice(),
          stream: true,
        }),
        signal: abortCtrl.signal,
      }).then(function (res) {
        if (!res.ok) {
          return res.json().then(function (err) { throw new Error(err.error || 'HTTP ' + res.status) })
        }
        if (typingInd) typingInd.classList.remove('active')
        var reader = res.body.getReader()
        var dec = new TextDecoder()
        var full = ''
        var buf = ''

        function read() {
          reader.read().then(function (result) {
            if (result.done) {
              // flush buffer
              if (buf.trim()) {
                try {
                  var d = JSON.parse(buf)
                  if (d.chunk) full += d.chunk
                  else if (d.done && d.text && !full) full = d.text
                } catch (e) {}
              }
              if (bubble) bubble.textContent = full || '[Empty response]'
              if (bubble) bubble.innerHTML = renderMarkdown(full || '[Empty response]')
              if (full) messages.push({ role: 'assistant', content: full })
              finish()
              return
            }
            buf += dec.decode(result.value, { stream: true })
            var lines = buf.split('\n')
            buf = lines.pop() || ''
            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim()
              if (!line) continue
              try {
                var d = JSON.parse(line)
                if (d.chunk) {
                  full += d.chunk
                  if (bubble) bubble.textContent = full
                  chatMsgs.scrollTop = chatMsgs.scrollHeight
                } else if (d.done && d.text && !full) {
                  full = d.text
                  if (bubble) bubble.textContent = full
                } else if (d.error) {
                  throw new Error(d.error)
                }
              } catch (e) {
                if (!e.message.startsWith('JSON')) throw e
              }
            }
            read()
          }).catch(function (err) {
            handleError(err, bubble)
          })
        }
        read()
      }).catch(function (err) {
        handleError(err, bubble)
      })
    } catch (err) {
      handleError(err, bubble)
    }
  }

  function demoResponse(text, bubble) {
    // Generate a demo quantum-related response to showcase functionality
    setTimeout(function () {
      if (typingInd) typingInd.classList.remove('active')

      // Show the quantum simulator running
      var demoResponse = ''
      try {
        var qs = window.QuantumSimulator
        if (qs) {
          var result = qs.runDemo('bell', 256)
          demoResponse = '**Quantum Demo: Bell State**\n\n' +
            'Here is a Bell state circuit running on the built-in quantum simulator:\n\n' +
            '```\n' + result.circuit.draw() + '```\n\n' +
            '```\n' + result.result.histogram() + '```\n\n' +
            'The simulator supports **H, X, Y, Z, S, T, CNOT, SWAP, Toffoli** gates ' +
            'and runs entirely in your browser with **zero API calls**. ' +
            'Try the **Quantum Lab** section below to run custom circuits!'
        } else {
          demoResponse = '**Welcome to AIGENEV7!**\n\n' +
            'This is a standalone static site. To enable full AI chat inference, ' +
            'run the API server:\n\n' +
            '```bash\nbun run inference-cli.js serve\n```\n\n' +
            'Meanwhile, the **Quantum Lab** below works entirely in your browser ' +
            'with zero backend needed!'
        }
      } catch (e) {
        demoResponse = '**Welcome to AIGENEV7!**\n\n' +
          'This is a standalone deployment. Connect the API backend or explore ' +
          'the quantum simulator below.'
      }

      if (bubble) {
        bubble.innerHTML = renderMarkdown(demoResponse)
        chatMsgs.scrollTop = chatMsgs.scrollHeight
      }
      messages.push({ role: 'assistant', content: demoResponse })
      finish()
    }, 800)
  }

  function handleError(err, bubble) {
    if (err.name === 'AbortError') {
      if (bubble) bubble.textContent = '⚠ Stopped'
    } else {
      if (bubble) bubble.textContent = '⚠ ' + err.message
      showError(err.message)
    }
    finish()
  }

  function finish() {
    isStreaming = false
    if (typingInd) typingInd.classList.remove('active')
    if (stopBtn) stopBtn.classList.remove('show')
    if (sendBtn) sendBtn.classList.remove('hide')
    if (chatInput) {
      chatInput.disabled = false
      chatInput.focus()
    }
    if (chatMsgs) chatMsgs.scrollTop = chatMsgs.scrollHeight
  }

  function stopStreaming() {
    if (abortCtrl) abortCtrl.abort()
    isStreaming = false
    if (typingInd) typingInd.classList.remove('active')
    if (stopBtn) stopBtn.classList.remove('show')
    if (sendBtn) sendBtn.classList.remove('hide')
    if (chatInput) { chatInput.disabled = false; chatInput.focus() }
  }

  function clearChat() {
    if (chatMsgs) chatMsgs.innerHTML = ''
    messages = []
    if (isStreaming) stopStreaming()
  }

  function showError(msg) {
    if (!errToast) return
    errToast.textContent = msg
    errToast.classList.add('show')
    setTimeout(function () { errToast.classList.remove('show') }, 4000)
  }

  // ── Markdown Renderer ─────────────────────────────
  function escHtml(str) {
    var d = document.createElement('div')
    d.textContent = str
    return d.innerHTML
  }

  function renderMarkdown(text) {
    if (!text) return ''
    var html = escHtml(text)

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function (_, lang, code) {
      var langClass = lang ? ' class="lang-' + escHtml(lang) + '"' : ''
      return '<pre><code' + langClass + '>' + code + '</code></pre>'
    })

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

    // Protect code blocks from paragraph splitting
    var blocks = []
    html = html.replace(/<pre>[\s\S]*?<\/pre>/g, function (m) {
      blocks.push(m)
      return '\x00BLOCK' + (blocks.length - 1) + '\x00'
    })

    // Paragraphs
    html = html.split(/\n{2,}/).map(function (p) {
      var trimmed = p.trim()
      if (!trimmed) return ''
      return '<p>' + trimmed.replace(/\n/g, '<br>') + '</p>'
    }).join('')

    // Restore code blocks
    html = html.replace(/\x00BLOCK(\d+)\x00/g, function (_, i) { return blocks[+i] || '' })

    // Bold & italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

    return html
  }

  // ── Events ────────────────────────────────────────
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
    })
    chatInput.addEventListener('input', function () {
      chatInput.style.height = 'auto'
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px'
    })
  }
  if (sendBtn) sendBtn.addEventListener('click', sendMsg)
  if (stopBtn) stopBtn.addEventListener('click', stopStreaming)
  if (clearBtn) clearBtn.addEventListener('click', clearChat)

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); sendMsg() }
  })

  // ── Boot ──────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
