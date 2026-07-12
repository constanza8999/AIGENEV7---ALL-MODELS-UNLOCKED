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
  var modelSearchInput = document.getElementById('modelSearchInput')
  var modelSearchCount = document.getElementById('modelSearchCount')
  var modelFilterChips = document.getElementById('modelFilterChips')
  var chatMsgs = document.getElementById('chatMessages')
  var chatInput = document.getElementById('chatInput')
  var sendBtn = document.getElementById('sendBtn')
  var stopBtn = document.getElementById('stopBtn')
  var typingInd = document.getElementById('typingIndicator')
  var curTag = document.getElementById('currentAgentTag')
  var clearBtn = document.getElementById('clearChatBtn')
  var errToast = document.getElementById('errorToast')

  // ── Filter state ─────────────────────────────────
  var activeProviderFilter = null
  var activeTierFilter = null
  var searchQuery = ''

  // ── Init ───────────────────────────────────────────
  function init() {
    if (!chips) return

    renderAgentChips()
    renderModelFilterChips()
    renderModelSelect()
    renderModelQuickPicks()
    bindModelSearch()

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
  function renderModelQuickPicks() {
    var quickPickContainer = document.getElementById('modelQuickPicks')
    if (!quickPickContainer) return
    quickPickContainer.innerHTML = ''

    // Show a few featured models as quick-pick buttons
    var featured = []
    var seen = {}
    for (var i = 0; i < models.length; i++) {
      var m = models[i]
      if (!seen[m.provider]) {
        seen[m.provider] = true
        featured.push(m)
      }
    }
    // Limit to 6 quick picks
    if (featured.length > 6) featured = featured.slice(0, 6)

    for (var j = 0; j < featured.length; j++) {
      var m = featured[j]
      var btn = document.createElement('button')
      btn.className = 'model-quick-pick'
      if (m.id === currentModelId) btn.classList.add('active')
      btn.dataset.modelId = m.id
      btn.textContent = m.displayName || m.id
      btn.title = m.description
      ;(function (id) {
        btn.addEventListener('click', function () {
          selectModel(id)
          // Update active state on all quick-picks
          var allPicks = quickPickContainer.querySelectorAll('.model-quick-pick')
          for (var p = 0; p < allPicks.length; p++) {
            allPicks[p].classList.toggle('active', allPicks[p].dataset.modelId === id)
          }
        })
      })(m.id)
      quickPickContainer.appendChild(btn)
    }
  }

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

  function getFilteredModels() {
    var q = searchQuery.toLowerCase()
    return models.filter(function (m) {
      if (activeProviderFilter && m.provider.toLowerCase() !== activeProviderFilter.toLowerCase()) return false
      if (activeTierFilter && m.tier !== activeTierFilter) return false
      if (q) {
        var name = (m.displayName || m.id).toLowerCase()
        var desc = (m.description || '').toLowerCase()
        var prov = (m.provider || '').toLowerCase()
        if (name.indexOf(q) === -1 && desc.indexOf(q) === -1 && prov.indexOf(q) === -1) return false
      }
      return true
    })
  }

  function renderModelFilterChips() {
    if (!modelFilterChips) return
    modelFilterChips.innerHTML = ''

    // Collect unique providers and tiers
    var providers = []
    var tiers = []
    var seenP = {}
    var seenT = {}
    for (var i = 0; i < models.length; i++) {
      if (!seenP[models[i].provider]) { seenP[models[i].provider] = true; providers.push(models[i].provider) }
      if (models[i].tier && !seenT[models[i].tier]) { seenT[models[i].tier] = true; tiers.push(models[i].tier) }
    }

    // Tier chips
    var tierLabels = { free: '🆓 Free', pro: '⭐ Pro', elite: '💎 Elite', enterprise: '🏢 Enterprise' }
    for (var t = 0; t < tiers.length; t++) {
      var btn = document.createElement('button')
      btn.className = 'model-filter-chip'
      btn.dataset.tier = tiers[t]
      btn.textContent = tierLabels[tiers[t]] || tiers[t]
      if (activeTierFilter === tiers[t]) btn.classList.add('active')
      ;(function (tier) {
        btn.addEventListener('click', function () {
          activeTierFilter = activeTierFilter === tier ? null : tier
          renderModelFilterChips()
          renderModelSelect()
          renderModelQuickPicks()
        })
      })(tiers[t])
      modelFilterChips.appendChild(btn)
    }

    // Provider chips (show top 8)
    var showProviders = providers.slice(0, 8)
    for (var p = 0; p < showProviders.length; p++) {
      var pbtn = document.createElement('button')
      pbtn.className = 'model-filter-chip provider'
      pbtn.dataset.provider = showProviders[p]
      pbtn.textContent = showProviders[p]
      if (activeProviderFilter === showProviders[p]) pbtn.classList.add('active')
      ;(function (prov) {
        pbtn.addEventListener('click', function () {
          activeProviderFilter = activeProviderFilter === prov ? null : prov
          renderModelFilterChips()
          renderModelSelect()
          renderModelQuickPicks()
        })
      })(showProviders[p])
      modelFilterChips.appendChild(pbtn)
    }
  }

  function bindModelSearch() {
    if (!modelSearchInput) return
    modelSearchInput.addEventListener('input', function () {
      searchQuery = modelSearchInput.value.trim()
      renderModelSelect()
      renderModelQuickPicks()
      updateSearchCount()
    })
  }

  function updateSearchCount() {
    if (!modelSearchCount) return
    var filtered = getFilteredModels()
    if (searchQuery || activeProviderFilter || activeTierFilter) {
      modelSearchCount.textContent = filtered.length + ' / ' + models.length
      modelSearchCount.style.display = 'inline'
    } else {
      modelSearchCount.style.display = 'none'
    }
  }

  function renderModelSelect() {
    if (!modelSel) return
    modelSel.innerHTML = ''

    var filtered = getFilteredModels()
    updateSearchCount()

    // Group by provider
    var byProvider = {}
    for (var i = 0; i < filtered.length; i++) {
      var m = filtered[i]
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
          var label = pModels[j].displayName || pModels[j].id
          if (pModels[j].multimodal) label += ' \uD83D\uDCF7'
          if (pModels[j].localOnly) label += ' \uD83D\uDCBB Local'
          o.textContent = label
          g.appendChild(o)
        }
        modelSel.appendChild(g)
      }
    } else {
      for (var k = 0; k < filtered.length; k++) {
        var o2 = document.createElement('option')
        o2.value = filtered[k].id
        var label2 = filtered[k].displayName || filtered[k].id
        if (filtered[k].multimodal) label2 += ' \uD83D\uDCF7'
        if (filtered[k].localOnly) label2 += ' \uD83D\uDCBB Local'
        o2.textContent = label2
        modelSel.appendChild(o2)
      }
    }

    // Keep current selection if still in filtered list
    if (currentModelId && filtered.some(function (m) { return m.id === currentModelId })) {
      modelSel.value = currentModelId
    } else if (filtered.length > 0) {
      selectModel(filtered[0].id)
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
    // Also update the active gallery card highlight
    var allGallery = document.querySelectorAll('.gallery-card')
    for (var g = 0; g < allGallery.length; g++) {
      allGallery[g].classList.toggle('gallery-active', allGallery[g].dataset.agentId === id)
    }
  }

  // Expose selectAgent globally so gallery.js can call it directly
  window.selectChatAgent = selectAgent

  function selectModel(id) {
    currentModelId = id
    if (modelSel) modelSel.value = id
    localStorage.setItem('aigenev7_model', id)
    // Update quick-pick pills active state
    var allPicks = document.querySelectorAll('.model-quick-pick')
    for (var p = 0; p < allPicks.length; p++) {
      allPicks[p].classList.toggle('active', allPicks[p].dataset.modelId === id)
    }
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
              if (bubble) {
                bubble.innerHTML = renderMarkdown(full || '[Empty response]')
                // Trigger entrance animation
                bubble.classList.add('msg-rendered')
              }
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
                  if (bubble) {
                    // Show streaming text with cursor during streaming
                    bubble.innerHTML = '<span class="streaming-text">' + escHtml(full) + '</span><span class="streaming-cursor"></span>'
                  }
                  chatMsgs.scrollTop = chatMsgs.scrollHeight
                } else if (d.done && d.text && !full) {
                  full = d.text
                  if (bubble) bubble.innerHTML = '<span class="streaming-text">' + escHtml(full) + '</span><span class="streaming-cursor"></span>'
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

  // ── Markdown Renderer (enhanced) ────────────────────
  function escHtml(str) {
    var d = document.createElement('div')
    d.textContent = str
    return d.innerHTML
  }

  // Global copyCode function for code block copy buttons
  window.copyCode = function (btn) {
    var wrapper = btn.closest('.code-block-wrapper')
    var codeEl = wrapper ? wrapper.querySelector('code') : null
    var text = codeEl ? codeEl.textContent : ''
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = '✓ Copied!'
        btn.classList.add('copied')
        setTimeout(function () { btn.textContent = '📋 Copy'; btn.classList.remove('copied') }, 2000)
      }).catch(function () { fallbackCopyCode(text, btn) })
    } else { fallbackCopyCode(text, btn) }
  }
  function fallbackCopyCode(text, btn) {
    var ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select()
    try {
      document.execCommand('copy')
      btn.textContent = '✓ Copied!'
      btn.classList.add('copied')
      setTimeout(function () { btn.textContent = '📋 Copy'; btn.classList.remove('copied') }, 2000)
    } catch (e) {}
    document.body.removeChild(ta)
  }

  function renderMarkdown(text) {
    if (!text) return ''
    var html = escHtml(text)

    // ── 1. Code blocks ──
    var codeBlocks = []
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function (_, lang, code) {
      var idx = codeBlocks.length
      var langAttr = lang ? ' data-lang="' + escHtml(lang) + '"' : ''
      var langLabel = lang ? '<span class="code-lang">' + escHtml(lang) + '</span>' : '<span class="code-lang">Code</span>'
      codeBlocks.push(
        '<div class="code-block-wrapper">' +
          '<div class="code-block-header">' +
            langLabel +
            '<button class="code-copy-btn" onclick="copyCode(this)">📋 Copy</button>' +
          '</div>' +
          '<pre><code' + langAttr + '>' + code + '</code></pre>' +
        '</div>'
      )
      return '\x00CB' + idx + '\x00'
    })

    // ── 2. Inline code ──
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    // Protect inline codes
    var inlineCodes = []
    html = html.replace(/<code>[\s\S]*?<\/code>/g, function (m) {
      inlineCodes.push(m)
      return '\x00IC' + (inlineCodes.length - 1) + '\x00'
    })

    // ── 3. Horizontal rules ──
    html = html.replace(/^---+$/gm, '<hr class="md-hr">')

    // ── 4. Headings ──
    html = html.replace(/^##### (.+)$/gm, '<h5 class="md-h5">$1</h5>')
    html = html.replace(/^#### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
    html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')

    // ── 5. Blockquotes ──
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-blockquote"><p>$1</p></blockquote>')

    // ── 6. Task lists ──
    html = html.replace(/^- \[ \] (.+)$/gm, '<div class="task-item"><input type="checkbox" disabled> <label>$1</label></div>')
    html = html.replace(/^- \[x\] (.+)$/gm, '<div class="task-item"><input type="checkbox" disabled checked> <label>$1</label></div>')

    // ── 7. Unordered lists ──
    html = html.replace(/((?:^- .+\n?)+)/gm, function (match) {
      var items = match.split('\n').filter(Boolean)
      var lis = items.map(function (item) {
        var content = item.replace(/^- (.+)/, '$1')
        return '<li>' + content + '</li>'
      }).join('')
      return '<ul class="md-ul">' + lis + '</ul>'
    })

    // ── 8. Ordered lists ──
    html = html.replace(/((?:^\d+\. .+\n?)+)/gm, function (match) {
      var items = match.split('\n').filter(Boolean)
      var lis = items.map(function (item) {
        var content = item.replace(/^\d+\. (.+)/, '$1')
        return '<li>' + content + '</li>'
      }).join('')
      return '<ol class="md-ol">' + lis + '</ol>'
    })

    // ── 9. Tables ──
    html = html.replace(/^(\|.+\|)\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/gm, function (_, header, body) {
      var headers = header.split('|').filter(Boolean).map(function (h) { return '<th>' + h.trim() + '</th>' }).join('')
      var rows = body.trim().split('\n').map(function (row) {
        var cells = row.split('|').filter(Boolean).map(function (c) { return '<td>' + c.trim() + '</td>' }).join('')
        return '<tr>' + cells + '</tr>'
      }).join('')
      return '<div class="md-table-wrap"><table class="md-table"><thead><tr>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
    })

    // ── 10. Bold, Italic, Strikethrough ──
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')

    // ── 11. Auto-link URLs ──
    html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" class="md-link">$1</a>')

    // ── 12. Restore inline codes ──
    html = html.replace(/\x00IC(\d+)\x00/g, function (_, i) { return inlineCodes[+i] || '' })

    // ── 13. Paragraphs (protect block elements) ──
    var blockEls = []
    // Use RegExp constructor to avoid escaping issues with <\/ in regex literals
    var blockProtectRE = new RegExp('<(' + ['pre','table','ul','ol','blockquote','h[1-5]','div class="(?:code-block-wrapper|task-item|md-table-wrap)"'].join('|') + ')[\\s\\S]*?<\\/(pre|table|ul|ol|blockquote|h[1-5]|div)>', 'g')
    html = html.replace(blockProtectRE, function (m) {
      blockEls.push(m)
      return '\x00BLOCK' + (blockEls.length - 1) + '\x00'
    })

    html = html.split(/\n{2,}/).map(function (p) {
      var trimmed = p.trim()
      if (!trimmed) return ''
      return '<p>' + trimmed.replace(/\n/g, '<br>') + '</p>'
    }).join('')

    html = html.replace(/\x00BLOCK(\d+)\x00/g, function (_, i) { return blockEls[+i] || '' })

    // ── 14. Restore code blocks ──
    html = html.replace(/\x00CB(\d+)\x00/g, function (_, i) { return codeBlocks[+i] || '' })

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
