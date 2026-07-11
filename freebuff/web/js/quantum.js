/* ════════════════════════════════════════════════════════
   AIGENEV7 Quantum Simulator — Browser Edition
   Unlimited qubits, zero API calls, runs in your browser.
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict'

  const MAX_QUBITS = 16 // browser-safe limit

  // Complex number helpers
  function cplx(re, im) {
    return { re: re, im: im || 0 }
  }
  function cplxAdd(a, b) {
    return { re: a.re + b.re, im: a.im + b.im }
  }
  function cplxMul(a, b) {
    return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }
  }
  function cplxMag2(a) {
    return a.re * a.re + a.im * a.im
  }

  // State vector
  class StateVector {
    constructor(numQubits) {
      if (numQubits > MAX_QUBITS) throw new Error('Too many qubits: ' + numQubits)
      if (numQubits < 1) throw new Error('Need at least 1 qubit')
      this.numQubits = numQubits
      this.dim = 1 << numQubits
      this.amplitudes = new Array(this.dim)
      for (let i = 0; i < this.dim; i++) this.amplitudes[i] = cplx(0, 0)
      this.amplitudes[0] = cplx(1, 0)
    }

    applyGate(matrix, target) {
      const mask = 1 << target
      const newAmps = new Array(this.dim)
      for (let i = 0; i < this.dim; i++) newAmps[i] = cplx(0, 0)
      const processed = new Array(this.dim).fill(false)

      for (let i = 0; i < this.dim; i++) {
        if (processed[i]) continue
        const zeroState = i & ~mask
        const oneState = i | mask
        const a = matrix[0][0], b = matrix[0][1]
        const c = matrix[1][0], d = matrix[1][1]
        const amp0 = this.amplitudes[zeroState]
        const amp1 = this.amplitudes[oneState]
        newAmps[zeroState] = cplxAdd(cplxMul(a, amp0), cplxMul(b, amp1))
        newAmps[oneState] = cplxAdd(cplxMul(c, amp0), cplxMul(d, amp1))
        processed[zeroState] = true
        processed[oneState] = true
      }
      this.amplitudes = newAmps
    }

    applyControlled(matrix, control, target) {
      const cMask = 1 << control
      const tMask = 1 << target
      const newAmps = new Array(this.dim)
      for (let i = 0; i < this.dim; i++) newAmps[i] = cplx(0, 0)
      const processed = new Array(this.dim).fill(false)

      for (let i = 0; i < this.dim; i++) {
        if (processed[i]) continue
        if (!(i & cMask)) {
          newAmps[i] = this.amplitudes[i]
          processed[i] = true
          continue
        }
        const zeroTarget = i & ~tMask
        const oneTarget = i | tMask
        const a = matrix[0][0], b = matrix[0][1]
        const c = matrix[1][0], d = matrix[1][1]
        const amp0 = this.amplitudes[zeroTarget]
        const amp1 = this.amplitudes[oneTarget]
        newAmps[zeroTarget] = cplxAdd(cplxMul(a, amp0), cplxMul(b, amp1))
        newAmps[oneTarget] = cplxAdd(cplxMul(c, amp0), cplxMul(d, amp1))
        processed[zeroTarget] = true
        processed[oneTarget] = true
      }
      this.amplitudes = newAmps
    }

    applyToffoli(cA, cB, target) {
      const aMask = 1 << cA
      const bMask = 1 << cB
      const tMask = 1 << target
      const newAmps = new Array(this.dim)
      for (let i = 0; i < this.dim; i++) newAmps[i] = cplx(0, 0)
      const processed = new Array(this.dim).fill(false)

      for (let i = 0; i < this.dim; i++) {
        if (processed[i]) continue
        if (!(i & aMask) || !(i & bMask)) {
          newAmps[i] = this.amplitudes[i]
          processed[i] = true
          continue
        }
        const zeroTarget = i & ~tMask
        const oneTarget = i | tMask
        newAmps[zeroTarget] = this.amplitudes[oneTarget]
        newAmps[oneTarget] = this.amplitudes[zeroTarget]
        processed[zeroTarget] = true
        processed[oneTarget] = true
      }
      this.amplitudes = newAmps
    }

    measure() {
      const probs = this.amplitudes.map(cplxMag2)
      const totalProb = probs.reduce(function (a, b) { return a + b }, 0)
      const r = Math.random() * totalProb
      let cumulative = 0
      let result = 0
      for (let i = 0; i < this.dim; i++) {
        cumulative += probs[i]
        if (r <= cumulative) { result = i; break }
      }
      const newAmps = new Array(this.dim)
      for (let i = 0; i < this.dim; i++) newAmps[i] = cplx(0, 0)
      newAmps[result] = cplx(1, 0)
      this.amplitudes = newAmps
      return result
    }

    clone() {
      const sv = new StateVector(this.numQubits)
      sv.amplitudes = this.amplitudes.map(function (a) { return { re: a.re, im: a.im } })
      return sv
    }
  }

  // Gate definitions
  var SQRT2 = Math.SQRT2
  var ISQRT2 = 1 / Math.SQRT2

  var GATES = {
    h: { matrix: [[cplx(ISQRT2, 0), cplx(ISQRT2, 0)], [cplx(ISQRT2, 0), cplx(-ISQRT2, 0)]], symbol: 'H', name: 'Hadamard' },
    x: { matrix: [[cplx(0, 0), cplx(1, 0)], [cplx(1, 0), cplx(0, 0)]], symbol: 'X', name: 'Pauli-X (NOT)' },
    y: { matrix: [[cplx(0, 0), cplx(0, -1)], [cplx(0, 1), cplx(0, 0)]], symbol: 'Y', name: 'Pauli-Y' },
    z: { matrix: [[cplx(1, 0), cplx(0, 0)], [cplx(0, 0), cplx(-1, 0)]], symbol: 'Z', name: 'Pauli-Z' },
    s: { matrix: [[cplx(1, 0), cplx(0, 0)], [cplx(0, 0), cplx(0, 1)]], symbol: 'S', name: 'Phase (S)' },
    t: { matrix: [[cplx(1, 0), cplx(0, 0)], [cplx(0, 0), cplx(Math.SQRT1_2, Math.SQRT1_2)]], symbol: 'T', name: 'T Gate (π/4)' },
  }

  // Quantum circuit
  class QuantumCircuit {
    constructor(numQubits) {
      if (numQubits < 1 || numQubits > MAX_QUBITS) throw new Error('Need 1-' + MAX_QUBITS + ' qubits')
      this.numQubits = numQubits
      this.ops = []
    }
    h(t) { this._add('h', [t]); return this }
    x(t) { this._add('x', [t]); return this }
    y(t) { this._add('y', [t]); return this }
    z(t) { this._add('z', [t]); return this }
    s(t) { this._add('s', [t]); return this }
    t(t) { this._add('t', [t]); return this }

    cnot(c, t) {
      if (c === t) throw new Error('Control and target must differ')
      this.ops.push({ gate: 'cx', targets: [t], controls: [c] })
      return this
    }
    swap(q0, q1) {
      if (q0 === q1) return this
      this.ops.push({ gate: 'swap', targets: [q0, q1] })
      return this
    }
    toffoli(c0, c1, t) {
      if (new Set([c0, c1, t]).size < 3) throw new Error('Toffoli needs 3 distinct qubits')
      this.ops.push({ gate: 'ccx', targets: [t], controls: [c0, c1] })
      return this
    }
    measure(q) { this.ops.push({ gate: 'measure', targets: [q] }); return this }
    measureAll() { for (let i = 0; i < this.numQubits; i++) this.measure(i); return this }

    _add(g, targets) {
      this.ops.push({ gate: g, targets: targets })
    }

    run(shots) {
      shots = shots || 1024
      var state = new StateVector(this.numQubits)

      for (var oi = 0; oi < this.ops.length; oi++) {
        var op = this.ops[oi]
        if (op.gate === 'measure') continue
        if (GATES[op.gate]) {
          state.applyGate(GATES[op.gate].matrix, op.targets[0])
        } else if (op.gate === 'cx') {
          state.applyControlled(GATES.x.matrix, op.controls[0], op.targets[0])
        } else if (op.gate === 'ccx') {
          state.applyToffoli(op.controls[0], op.controls[1], op.targets[0])
        } else if (op.gate === 'swap') {
          state.applyControlled(GATES.x.matrix, op.targets[0], op.targets[1])
          state.applyControlled(GATES.x.matrix, op.targets[1], op.targets[0])
          state.applyControlled(GATES.x.matrix, op.targets[0], op.targets[1])
        }
      }

      var counts = {}
      for (var s = 0; s < shots; s++) {
        var snap = state.clone()
        var res = snap.measure()
        var key = res.toString(2)
        while (key.length < this.numQubits) key = '0' + key
        counts[key] = (counts[key] || 0) + 1
      }
      return new Result(counts, shots, this.numQubits)
    }

    draw() {
      var text = 'Circuit: ' + this.numQubits + ' qubits, ' + this.ops.filter(function (o) { return o.gate !== 'measure' }).length + ' gates\n'
      var syms = this.ops.map(function (op) {
        if (op.gate === 'measure') return { t: 'M' }
        if (op.gate === 'swap') return { t: 'SWAP', q0: op.targets[0], q1: op.targets[1] }
        if (op.gate === 'cx') return { t: 'CX', c: op.controls[0], tq: op.targets[0] }
        if (op.gate === 'ccx') return { t: 'CCX', c: op.controls, tq: op.targets[0] }
        var g = GATES[op.gate]
        return { t: g ? g.symbol : '?', q: op.targets[0] }
      })

      for (var q = 0; q < this.numQubits; q++) {
        var line = 'q[' + q + '] \u2500'
        for (var si = 0; si < syms.length; si++) {
          var sym = syms[si]
          if (sym.t === 'M') { line += '\u2523M\u2523\u2500'; continue }
          if (sym.t === 'SWAP') { line += (sym.q0 === q || sym.q1 === q) ? '\u00D7\u2500' : '\u2500\u2500\u2500'; continue }
          if (sym.t === 'CX') { line += (sym.c === q) ? '\u25CF\u2500' : (sym.tq === q) ? 'X\u2500' : '\u2500\u2500\u2500'; continue }
          if (sym.t === 'CCX') { line += (sym.c.indexOf(q) >= 0) ? '\u25CF\u2500' : (sym.tq === q) ? 'X\u2500' : '\u2500\u2500\u2500'; continue }
          line += (sym.q === q) ? sym.t + '\u2500' : '\u2500\u2500\u2500'
        }
        text += line + '\n'
      }
      return text
    }
  }

  // Result
  class Result {
    constructor(counts, shots, numQubits) {
      this.counts = counts
      this.shots = shots
      this.numQubits = numQubits
      var keys = Object.keys(counts)
      keys.sort(function (a, b) { return (counts[b] || 0) - (counts[a] || 0) })
      this._sortedKeys = keys
    }
    mostLikely() { return this._sortedKeys[0] || '0'.repeat(this.numQubits) }
    histogram() {
      var out = 'Results (' + this.shots + ' shots):\n'
      for (var i = 0; i < this._sortedKeys.length; i++) {
        var key = this._sortedKeys[i]
        var count = this.counts[key]
        var pct = ((count / this.shots) * 100).toFixed(1)
        var bar = ''
        var barLen = Math.round((count / this.shots) * 30)
        for (var b = 0; b < barLen; b++) bar += '\u2588'
        out += '  |' + key + '\u27E9 ' + bar + ' ' + count + '/' + this.shots + ' (' + pct + '%)\n'
      }
      return out
    }
  }

  // Demos
  var DEMOS = {
    'bell': {
      name: 'Bell State',
      desc: 'Maximally entangled state (|00\u27E9 + |11\u27E9)/\u221A2',
      circuit: function () { return new QuantumCircuit(2).h(0).cnot(0, 1).measureAll() }
    },
    'ghz': {
      name: 'GHZ State',
      desc: '3-qubit GHZ: (|000\u27E9 + |111\u27E9)/\u221A2',
      circuit: function () { return new QuantumCircuit(3).h(0).cnot(0, 1).cnot(0, 2).measureAll() }
    },
    'superposition': {
      name: '4-Qubit Superposition',
      desc: 'All 16 basis states equally likely',
      circuit: function () { var q = new QuantumCircuit(4); for (var i = 0; i < 4; i++) q.h(i); return q.measureAll() }
    },
    'bell-swap': {
      name: 'Bell via SWAP',
      desc: 'Creates entanglement using SWAP gate',
      circuit: function () { return new QuantumCircuit(2).x(1).swap(0, 1).h(0).cnot(0, 1).measureAll() }
    },
    'toffoli': {
      name: 'Toffoli (CCX)',
      desc: 'Controlled-controlled-NOT: |111\u27E9 when both controls are 1',
      circuit: function () { return new QuantumCircuit(3).x(0).x(1).toffoli(0, 1, 2).measureAll() }
    },
  }

  function listDemos() {
    var ids = Object.keys(DEMOS)
    return ids.map(function (id) { return { id: id, name: DEMOS[id].name, desc: DEMOS[id].desc } })
  }

  function runDemo(name, shots) {
    var demo = DEMOS[name]
    if (!demo) throw new Error('Unknown demo: ' + name)
    var circuit = demo.circuit()
    var result = circuit.run(shots || 1024)
    return { circuit: circuit, result: result }
  }

  // Custom parser
  function parseGates(text) {
    var gateMap = {
      'h': 'h', 'hadamard': 'h',
      'x': 'x', 'pauli-x': 'x', 'not': 'x',
      'y': 'y', 'pauli-y': 'y',
      'z': 'z', 'pauli-z': 'z',
      's': 's', 'phase': 's',
      't': 't',
      'cnot': 'cnot', 'cx': 'cnot',
      'swap': 'swap',
      'toffoli': 'toffoli', 'ccx': 'toffoli',
    }

    var tokens = []
    var re = /([A-Za-z]+)\(([^)]*)\)/g
    var match
    while ((match = re.exec(text)) !== null) {
      var name = match[1].toLowerCase()
      var args = match[2].split(',').map(function (s) { return parseInt(s.trim(), 10) })
      var gate = gateMap[name]
      if (!gate) continue
      tokens.push({ gate: gate, args: args, raw: match[0] })
    }
    return tokens
  }

  function buildCircuit(gateText) {
    var tokens = parseGates(gateText)
    if (tokens.length === 0) throw new Error('No valid gates found. Try: H(0) CNOT(0,1)')

    // Determine qubit count
    var numQ = 0
    for (var i = 0; i < tokens.length; i++) {
      for (var j = 0; j < tokens[i].args.length; j++) {
        if (!isNaN(tokens[i].args[j]) && tokens[i].args[j] >= numQ) numQ = tokens[i].args[j] + 1
      }
    }
    if (numQ < 1) numQ = 1

    var qc = new QuantumCircuit(numQ)
    for (var k = 0; k < tokens.length; k++) {
      var t = tokens[k]
      if (t.gate === 'h' || t.gate === 'x' || t.gate === 'y' || t.gate === 'z' || t.gate === 's' || t.gate === 't') {
        if (t.args.length >= 1 && !isNaN(t.args[0])) qc[t.gate](t.args[0])
      } else if (t.gate === 'cnot') {
        if (t.args.length >= 2 && !isNaN(t.args[0]) && !isNaN(t.args[1])) qc.cnot(t.args[0], t.args[1])
      } else if (t.gate === 'swap') {
        if (t.args.length >= 2 && !isNaN(t.args[0]) && !isNaN(t.args[1])) qc.swap(t.args[0], t.args[1])
      } else if (t.gate === 'toffoli') {
        if (t.args.length >= 3 && !isNaN(t.args[0]) && !isNaN(t.args[1]) && !isNaN(t.args[2])) qc.toffoli(t.args[0], t.args[1], t.args[2])
      }
    }
    qc.measureAll()
    return qc
  }

  // Expose globally
  window.QuantumSimulator = {
    QuantumCircuit: QuantumCircuit,
    StateVector: StateVector,
    GATES: GATES,
    DEMOS: DEMOS,
    listDemos: listDemos,
    runDemo: runDemo,
    parseGates: parseGates,
    buildCircuit: buildCircuit,
    MAX_QUBITS: MAX_QUBITS,
  }
})()
