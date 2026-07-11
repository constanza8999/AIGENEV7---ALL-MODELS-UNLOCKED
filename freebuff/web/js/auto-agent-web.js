/* ════════════════════════════════════════════════════════
   AIGENEV7 — Auto Agent Web UI
   Handles the autonomous coding agent in the browser.
   Requires the API backend (/api/auto-agent endpoint).
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict'

  // ── DOM Refs ──
  var input = document.getElementById('autoAgentInput')
  var runBtn = document.getElementById('autoAgentRunBtn')
  var stopBtn = document.getElementById('autoAgentStopBtn')
  var modelSel = document.getElementById('autoAgentModel')
  var itersInput = document.getElementById('autoAgentIters')
  var statusBar = document.getElementById('autoAgentStatus')
  var statusFill = document.getElementById('autoAgentStatusFill')
  var statusText = document.getElementById('autoAgentStatusText')
  var resultsEl = document.getElementById('autoAgentResults')
  var placeholder = document.getElementById('autoAgentPlaceholder')
  var logEl = document.getElementById('autoAgentLog')
  var logBody = document.getElementById('autoAgentLogBody')
  var logClear = document.getElementById('autoAgentLogClear')
  var errToast = document.getElementById('errorToast')
  var exampleBtns = document.querySelectorAll('.auto-agent-example')

  // ── State ──
  var isRunning = false
  var abortCtrl = null
  var runStartTime = 0

  // ── Init ──
  function init() {
    // Load saved model preference
    var savedModel = localStorage.getItem('aigenev7_auto_agent_model')
    if (savedModel && modelSel) modelSel.value = savedModel
    var savedIters = localStorage.getItem('aigenev7_auto_agent_iters')
    if (savedIters && itersInput) itersInput.value = savedIters
  }

  // ── Logging ──
  function log(msg, type) {
    if (!logBody) return
    logEl.style.display = 'block'

    var div = document.createElement('div')
    div.className = 'auto-agent-log-line ' + (type || 'info')
    var icon = '•'
    if (type === 'status') icon = '🔄'
    else if (type === 'success') icon = '✅'
    else if (type === 'error') icon = '❌'
    else if (type === 'write') icon = '✏️'
    else if (type === 'read') icon = '📖'
    else if (type === 'search') icon = '🔍'
    else if (type === 'run') icon = '⚡'
    else if (type === 'info') icon = '💡'
    else if (type === 'warning') icon = '⚠️'

    div.innerHTML = '<span class="log-icon">' + icon + '</span> ' + escapeHtml(msg)
    logBody.appendChild(div)
    logBody.scrollTop = logBody.scrollHeight
  }

  function escapeHtml(str) {
    var d = document.createElement('div')
    d.textContent = str
    return d.innerHTML
  }

  // ── Status Bar ──
  function setStatus(text, pct) {
    if (!statusBar) return
    statusBar.style.display = 'block'
    if (statusText) statusText.textContent = text
    if (statusFill) {
      var clamped = Math.max(0, Math.min(100, pct || 0))
      statusFill.style.width = clamped + '%'
    }
  }

  // ── Show Error ──
  function showError(msg) {
    if (!errToast) return
    errToast.textContent = msg
    errToast.classList.add('show')
    setTimeout(function () { errToast.classList.remove('show') }, 5000)
  }

  // ── Results Display ──
  function showResults(data) {
    if (!resultsEl) return
    if (placeholder) placeholder.style.display = 'none'

    var existing = resultsEl.querySelector('.auto-agent-result-card')
    if (existing) existing.remove()

    var card = document.createElement('div')
    card.className = 'auto-agent-result-card'
    card.style.animation = 'fadeInUp 0.4s ease-out'

    var header = document.createElement('div')
    header.className = 'auto-agent-result-header'
    header.innerHTML = data.success
      ? '<span class="result-icon-success">✅</span> Task Complete'
      : '<span class="result-icon-error">❌</span> Task Failed'
    card.appendChild(header)

    if (data.summary) {
      var summary = document.createElement('div')
      summary.className = 'auto-agent-result-summary'
      summary.textContent = data.summary
      card.appendChild(summary)
    }

    var stats = document.createElement('div')
    stats.className = 'auto-agent-result-stats'
    var changesCount = data.changes ? data.changes.length : 0
    var iterations = data.totalIterations || data.iteration || 0
    stats.innerHTML =
      '<div class="stat-item"><span class="stat-num">' + changesCount + '</span> Files Changed</div>' +
      '<div class="stat-item"><span class="stat-num">' + iterations + '</span> Iterations</div>' +
      (data.success ? '<div class="stat-item"><span class="stat-num stat-green">✓</span> Success</div>' : '<div class="stat-item"><span class="stat-num stat-red">✗</span> Failed</div>')
    card.appendChild(stats)

    if (data.changes && data.changes.length > 0) {
      var changesTitle = document.createElement('div')
      changesTitle.className = 'auto-agent-result-changes-title'
      changesTitle.textContent = '📄 Files Modified:'
      card.appendChild(changesTitle)

      var changesList = document.createElement('ul')
      changesList.className = 'auto-agent-result-changes'
      for (var i = 0; i < data.changes.length; i++) {
        var ch = data.changes[i]
        var li = document.createElement('li')
        var typeIcons = { write: '✏️', edit: '📝', append: '➕', insert: '📄', delete: '🗑️', rename: '📦', copy: '📋', replaceall: '🔄' }
        var icon = typeIcons[ch.type] || '📄'
        li.innerHTML = '<span class="change-icon">' + icon + '</span> ' +
          '<span class="change-type">' + (ch.type || 'change') + '</span> ' +
          '<code class="change-path">' + escapeHtml(ch.path || ch.from || '') + '</code>' +
          (ch.to ? ' → <code class="change-path">' + escapeHtml(ch.to) + '</code>' : '')
        changesList.appendChild(li)
      }
      card.appendChild(changesList)
    }

    resultsEl.appendChild(card)
  }

  // ── Run Auto Agent ──
  function runAutoAgent() {
    if (!input || isRunning) return
    var prompt = input.value.trim()
    if (!prompt) {
      showError('Please enter a task description')
      return
    }

    isRunning = true
    if (runBtn) { runBtn.disabled = true; runBtn.querySelector('.auto-agent-btn-text').textContent = 'Running...' }
    if (stopBtn) stopBtn.style.display = 'inline-flex'
    if (input) input.disabled = true
    if (resultsEl) resultsEl.querySelectorAll('.auto-agent-result-card').forEach(function (e) { e.remove() })
    if (logBody) logBody.innerHTML = ''
    if (logEl) logEl.style.display = 'block'

    var model = modelSel ? modelSel.value : 'deepseek-v4-flash'
    var iterations = itersInput ? parseInt(itersInput.value, 10) || 10 : 10

    localStorage.setItem('aigenev7_auto_agent_model', model)
    localStorage.setItem('aigenev7_auto_agent_iters', String(iterations))

    log('🤖 Starting auto agent...', 'status')
    log('📝 Task: ' + prompt, 'info')
    log('🤖 Model: ' + model, 'info')
    log('🔄 Max iterations: ' + iterations, 'info')
    log('📁 CWD: ' + window.location.origin, 'info')
    setStatus('Initializing...', 5)

    runStartTime = Date.now()
    abortCtrl = new AbortController()

    fetch('/api/auto-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        model: model,
        maxIterations: iterations,
      }),
      signal: abortCtrl.signal,
    })
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) { throw new Error(err.error || 'HTTP ' + res.status) })
      }
      var reader = res.body.getReader()
      var decoder = new TextDecoder()
      var buffer = ''
      var fullData = null

      function readChunk() {
        reader.read().then(function (result) {
          if (result.done) {
            if (buffer.trim()) {
              try {
                var d = JSON.parse(buffer)
                if (d.status) log(d.status, d.statusType || 'status')
                if (d.done) fullData = d
                if (d.pct != null) setStatus(d.status || 'Processing...', d.pct)
              } catch (e) {}
            }
            finishRun(fullData)
            return
          }

          buffer += decoder.decode(result.value, { stream: true })
          var lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim()
            if (!line) continue
            try {
              var data = JSON.parse(line)
              if (data.status) log(data.status, data.statusType || 'status')
              if (data.pct != null) setStatus(data.status || 'Processing...', data.pct)
              if (data.log) log(data.log, data.logType || 'info')
              if (data.done) fullData = data
              if (data.error) {
                log('Error: ' + data.error, 'error')
                showError(data.error)
              }
            } catch (e) {}
          }
          readChunk()
        }).catch(function (err) {
          if (err.name === 'AbortError') {
            log('⏹️ Stopped by user', 'warning')
          } else {
            log('Error: ' + err.message, 'error')
            showError(err.message)
          }
          finishRun(null)
        })
      }
      readChunk()
    })
    .catch(function (err) {
      if (err.name === 'AbortError') {
        log('⏹️ Stopped by user', 'warning')
      } else {
        log('Error: ' + err.message, 'error')
        showError(err.message)
      }
      finishRun(null)
    })
  }

  function finishRun(data) {
    isRunning = false
    if (runBtn) { runBtn.disabled = false; runBtn.querySelector('.auto-agent-btn-text').textContent = 'Run Auto Agent' }
    if (stopBtn) stopBtn.style.display = 'none'
    if (input) input.disabled = false

    if (data) {
      setStatus('✅ Complete!', 100)
      log('✅ Auto agent finished!', 'success')
      if (data.changes && data.changes.length > 0) {
        var elapsed = data.elapsed || ((Date.now() - runStartTime) / 1000).toFixed(1)
        log('📊 ' + data.changes.length + ' file(s) modified in ' + elapsed + 's', 'info')
      }
      showResults(data)
    } else {
      setStatus('⏹️ Stopped', 0)
    }

    if (resultsEl) {
      setTimeout(function () {
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 200)
    }
  }

  function stopAgent() {
    if (abortCtrl) {
      abortCtrl.abort()
      log('⏹️ Stopping agent...', 'warning')
    }
  }

  function clearLog() {
    if (logBody) logBody.innerHTML = ''
    logEl.style.display = 'none'
  }

  // ── Example Click Handlers ──
  for (var i = 0; i < exampleBtns.length; i++) {
    ;(function (btn) {
      btn.addEventListener('click', function () {
        var prompt = btn.dataset.prompt
        if (prompt && input) {
          input.value = prompt
          input.focus()
          input.style.height = 'auto'
          input.style.height = input.scrollHeight + 'px'
        }
      })
    })(exampleBtns[i])
  }

  // ── Events ──
  if (runBtn) runBtn.addEventListener('click', runAutoAgent)
  if (stopBtn) stopBtn.addEventListener('click', stopAgent)
  if (logClear) logClear.addEventListener('click', clearLog)

  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        runAutoAgent()
      }
    })
    input.addEventListener('input', function () {
      input.style.height = 'auto'
      input.style.height = input.scrollHeight + 'px'
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
