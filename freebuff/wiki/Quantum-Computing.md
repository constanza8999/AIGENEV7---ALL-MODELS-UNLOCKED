# Quantum Computing

AIGENEV7 includes a built-in quantum circuit simulator that runs locally with **zero API calls**.

## Overview

- **Qubits**: Up to 28 qubits
- **Gates**: H, X, Y, Z, S, T, CNOT, Toffoli, SWAP
- **Shots**: Configurable (default: 1024)
- **Cost**: Free (runs locally)

## Supported Gates

| Gate | Description | Example |
|------|-------------|---------|
| **H** | Hadamard gate (creates superposition) | `H(0)` |
| **X** | Pauli-X (NOT gate) | `X(0)` |
| **Y** | Pauli-Y | `Y(0)` |
| **Z** | Pauli-Z (phase flip) | `Z(0)` |
| **S** | S gate (√Z) | `S(0)` |
| **T** | T gate (π/8 gate) | `T(0)` |
| **CNOT** | Controlled-NOT | `CNOT(0,1)` |
| **Toffoli** | Controlled-Controlled-NOT | `Toffoli(0,1,2)` |
| **SWAP** | Swap two qubits | `SWAP(0,1)` |

## Usage

### Via CLI Command

```bash
# Basic quantum circuit
/quantum run H(0) CNOT(0,1)

# With more gates
/quantum run H(0) H(1) CNOT(0,1) CNOT(1,2)

# With custom shot count
/quantum run H(0) CNOT(0,1) --shots=2048
```

### Via API

```javascript
import { runQuantumCircuit } from './quantum.js'

const result = await runQuantumCircuit({
  gates: ['H(0)', 'CNOT(0,1)'],
  shots: 1024,
})

console.log(result)
// {
//   counts: { '00': 512, '11': 512 },
//   probabilities: { '00': 0.5, '11': 0.5 },
//   circuit: 'H(0) → CNOT(0,1)'
// }
```

## Example Circuits

### Bell State (Entanglement)

```bash
/quantum run H(0) CNOT(0,1)
```

Creates an entangled Bell state:
- 50% chance of measuring `00`
- 50% chance of measuring `11`

### GHZ State (3-Qubit Entanglement)

```bash
/quantum run H(0) CNOT(0,1) CNOT(0,2)
```

Creates a 3-qubit GHZ state:
- 50% chance of measuring `000`
- 50% chance of measuring `111`

### Quantum Fourier Transform

```bash
/quantum run H(0) CNOT(0,1) CNOT(0,2) T(1) S(2)
```

### Grover's Algorithm (2-Qubit)

```bash
/quantum run H(0) H(1) Z(0) Z(1) CNOT(0,1) H(0) H(1) X(0) X(1) CNOT(0,1) X(0) X(1) H(0) H(1)
```

### Quantum Teleportation

```bash
/quantum run H(0) CNOT(0,1) CNOT(1,2) H(0)
```

## Using the Quantum Agent

For more complex quantum tasks, use the quantum development agent:

```bash
/agent quantum-dev Help me implement Shor's algorithm for factoring 15
```

The quantum agent can:
- Design complex quantum circuits
- Explain quantum algorithms
- Optimize circuit depth
- Discuss hardware considerations
- Write code for Qiskit, Cirq, or Q#

## File Location

The quantum simulator is located at:
```
freebuff/quantum.js
```

## Performance

| Qubits | Memory | Speed |
|--------|--------|-------|
| 1-10 | < 1MB | Instant |
| 11-20 | ~1MB | < 1 second |
| 21-28 | ~100MB | < 5 seconds |

> ⚠️ Quantum simulation is exponentially expensive. 28 qubits requires ~256MB of memory.

---

*See [Models](Models) for all available AI models and [Commands](Commands) for all CLI commands.*
