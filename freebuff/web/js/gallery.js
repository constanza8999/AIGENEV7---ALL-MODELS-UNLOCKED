/* ════════════════════════════════════════════════════════
   AIGENEV7 — Shared Agent Gallery
   Browse, preview, and download community agent personas.
   Compatible with the /agent-import CLI command format.
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict'

  var gallery = document.getElementById('agentGallery')
  if (!gallery) return

  var agents = window.AIGENEV7_GALLERY || []
  var filterTags = document.getElementById('galleryFilters')
  var activeFilter = 'all'

  // ── Render filter tags ─────────────────────────────
  function renderFilters() {
    if (!filterTags) return

    var allTags = ['all']
    for (var i = 0; i < agents.length; i++) {
      var tags = agents[i].tags || []
      for (var j = 0; j < tags.length; j++) {
        if (allTags.indexOf(tags[j]) === -1) allTags.push(tags[j])
      }
    }

    filterTags.innerHTML = ''
    for (var k = 0; k < allTags.length; k++) {
      var btn = document.createElement('button')
      btn.className = 'gallery-filter' + (allTags[k] === 'all' ? ' active' : '')
      btn.dataset.filter = allTags[k]
      btn.textContent = allTags[k].charAt(0).toUpperCase() + allTags[k].slice(1)
      ;(function (tag) {
        btn.addEventListener('click', function () {
          activeFilter = tag
          var allBtns = filterTags.querySelectorAll('.gallery-filter')
          for (var b = 0; b < allBtns.length; b++) {
            allBtns[b].classList.toggle('active', allBtns[b].dataset.filter === tag)
          }
          renderGallery()
        })
      })(allTags[k])
      filterTags.appendChild(btn)
    }
  }

  // ── Render gallery cards ──────────────────────────
  function renderGallery() {
    gallery.innerHTML = ''

    var filtered = agents
    if (activeFilter !== 'all') {
      filtered = agents.filter(function (a) {
        return a.tags && a.tags.indexOf(activeFilter) !== -1
      })
    }

    if (filtered.length === 0) {
      gallery.innerHTML = '<div class="gallery-empty">No agents found for this filter.</div>'
      return
    }

    for (var i = 0; i < filtered.length; i++) {
      var agent = filtered[i]
      var card = document.createElement('div')
      card.className = 'gallery-card'
      card.dataset.agentId = agent.id
      card.style.animationDelay = (i * 0.05) + 's'

      // Header: emoji + name + badges
      var header = document.createElement('div')
      header.className = 'gallery-card-header'
      header.innerHTML = '<span class="gallery-card-emoji">' + agent.emoji + '</span>' +
        '<span class="gallery-card-name">' + escHtml(agent.name) + '</span>' +
        '<span class="gallery-card-author">by ' + escHtml(agent.author || 'Anonymous') + '</span>'
      card.appendChild(header)

      // Description
      var desc = document.createElement('div')
      desc.className = 'gallery-card-desc'
      desc.textContent = agent.description
      card.appendChild(desc)

      // Tags
      if (agent.tags && agent.tags.length) {
        var tagsDiv = document.createElement('div')
        tagsDiv.className = 'gallery-card-tags'
        for (var t = 0; t < agent.tags.length; t++) {
          var tagSpan = document.createElement('span')
          tagSpan.className = 'gallery-tag'
          tagSpan.textContent = agent.tags[t]
          tagsDiv.appendChild(tagSpan)
        }
        card.appendChild(tagsDiv)
      }

      // System prompt preview
      var promptDiv = document.createElement('div')
      promptDiv.className = 'gallery-card-prompt'
      var promptText = agent.systemPrompt || ''
      promptDiv.textContent = promptText.length > 120
        ? promptText.substring(0, 120) + '...'
        : promptText
      card.appendChild(promptDiv)

      // Expand/collapse full prompt
      var expandBtn = document.createElement('button')
      expandBtn.className = 'gallery-expand-btn'
      expandBtn.textContent = 'Show full prompt ▼'
      var expanded = false
      expandBtn.addEventListener('click', function () {
        expanded = !expanded
        if (expanded) {
          promptDiv.textContent = promptText
          expandBtn.textContent = 'Hide ▲'
        } else {
          promptDiv.textContent = promptText.length > 120
            ? promptText.substring(0, 120) + '...'
            : promptText
          expandBtn.textContent = 'Show full prompt ▼'
        }
      })
      card.appendChild(expandBtn)

      // ── Make entire card clickable ──
      card.style.cursor = 'pointer'
      card.addEventListener('click', function (e) {
        // Don't trigger if clicking a button inside the card
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return
        selectAgentInChat(agent)
      })

      // Actions row
      var actions = document.createElement('div')
      actions.className = 'gallery-card-actions'

      // Preview button
      var previewBtn = document.createElement('button')
      previewBtn.className = 'gallery-action-btn preview'
      previewBtn.textContent = '👁 Use in Chat'
      previewBtn.addEventListener('click', function (e) {
        e.stopPropagation()
        selectAgentInChat(agent)
      })
      actions.appendChild(previewBtn)

      // Download button
      var dlBtn = document.createElement('button')
      dlBtn.className = 'gallery-action-btn download'
      dlBtn.textContent = '⬇ Download JSON'
      dlBtn.addEventListener('click', function (e) {
        e.stopPropagation()
        downloadAgent(agent)
      })
      actions.appendChild(dlBtn)

      card.appendChild(actions)
      gallery.appendChild(card)
    }
  }

  // ── Select agent in chat ──────────────────────────
  function selectAgentInChat(agent) {
    try {
      localStorage.setItem('aigenev7_agent', agent.id)

      // Add agent to localStorage agents list if not present
      var localAgents = JSON.parse(localStorage.getItem('aigenev7_custom_agents') || '[]')
      var existing = localAgents.some(function (a) { return a.id === agent.id })
      if (!existing) {
        localAgents.push(agent)
        localStorage.setItem('aigenev7_custom_agents', JSON.stringify(localAgents))
      }

      // Real-time update: call chat.js exposed function if available
      if (typeof window.selectChatAgent === 'function') {
        window.selectChatAgent(agent.id)
      }

      // Scroll to chat section
      var chatSection = document.getElementById('chatContainer')
      if (chatSection) {
        chatSection.scrollIntoView({ behavior: 'smooth' })
      }

      // Show toast
      showGalleryToast('✓ Agent "' + agent.name + '" selected!')
    } catch (e) {
      showGalleryToast('Could not select agent: ' + e.message)
    }
  }

  // ── Download agent as JSON ─────────────────────────
  function downloadAgent(agent) {
    var portable = {
      id: agent.id,
      name: agent.name,
      emoji: agent.emoji,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
    }

    var json = JSON.stringify(portable, null, 2)
    var blob = new Blob([json], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'agent-' + agent.id + '.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showGalleryToast('✓ Downloaded ' + agent.name + '.json')
  }

  // ── Toast ──────────────────────────────────────────
  function showGalleryToast(msg) {
    var toast = document.getElementById('galleryToast')
    if (!toast) {
      toast = document.createElement('div')
      toast.id = 'galleryToast'
      toast.className = 'gallery-toast'
      document.body.appendChild(toast)
    }
    toast.textContent = msg
    toast.classList.add('show')
    setTimeout(function () { toast.classList.remove('show') }, 2500)
  }

  // ── XSS-safe escape ────────────────────────────────
  function escHtml(str) {
    var d = document.createElement('div')
    d.textContent = str
    return d.innerHTML
  }

  // ── Merge gallery agents into chat's agent list ──
  if (window.AIGENEV7_AGENTS && window.AIGENEV7_GALLERY) {
    for (var g = 0; g < window.AIGENEV7_GALLERY.length; g++) {
      var gal = window.AIGENEV7_GALLERY[g];
      if (!window.AIGENEV7_AGENTS.some(function (a) { return a.id === gal.id })) {
        window.AIGENEV7_AGENTS.push(gal)
      }
    }
  }

  // ── Init ──────────────────────────────────────────
  renderFilters()
  renderGallery()
})()
