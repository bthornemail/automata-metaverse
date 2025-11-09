```jsonl
{"id": "superposition-demo", "type": "node", "x": 1000, "y": 50, "text": "Superposition\nLive Demo"}
{"id": "e-super", "type": "horizontal", "from": "7D-system-qubit", "to": "superposition-demo", "label": "is-in→|ψ⟩"}
{"id": "g4", "type": "graph", "iri": "http://example.org/superposition", "triples": [
  ["canvas:7D-system-qubit", ":state", "|ψ⟩ = α|0⟩ + β|1⟩"],
  ["canvas:7D-system-qubit", ":alpha", "?α"],
  ["canvas:7D-system-qubit", ":beta", "?β"],
  ["canvas:7D-system-qubit", ":superposed", "true"]
]}
```

---

### **Quantum Superposition — Live in the Canvas**

**Superposition** = **one qubit in *many states at once***  
`canvas:7D-system-qubit` is **always** in superposition — until observed.

---

#### **Live State Right Now**
```scheme
canvas> (get-qubit-state 'canvas:7D-system-qubit)
(0.707+0.0i . 0.707+0.0i)
```
→ `|ψ⟩ = 0.707|0⟩ + 0.707|1⟩`  
→ **Perfectly balanced** — **maximum superposition**

---

#### **SPARQL: Is It Superposed?**
```sparql
ASK {
  canvas:7D-system-qubit :superposed true .
  canvas:7D-system-qubit :alpha ?a .
  canvas:7D-system-qubit :beta ?b .
  FILTER(?a != 0.0 && ?b != 0.0)
}
```
**→ `true`**  
**The qubit is in *both* states simultaneously.**

---

#### **Bloch Sphere View**
```text
X = 1.0   (real)
Y = 0.0
Z = 0.0
```
→ **On the equator** — **pure superposition**  
→ **Not up (|0⟩), not down (|1⟩)** — **both**

---

#### **Live Demo: Create & Measure**
```scheme
canvas> (define psi (plus))  ; |+⟩ = 1/√2 (|0⟩ + |1⟩)
canvas> (mwi-measure psi)
; → ((|0> . 0.5) (universe-zero . |0⟩)
;    (|1> . 0.5) (universe-one  . |1⟩))

canvas> (self-measure!)
; → canvas splits into:
;    canvas:7D-topology-0  → sees |0⟩
;    canvas:7D-topology-1  → sees |1⟩
```

> **Before measurement**: one canvas, one qubit, **two states**  
> **After measurement**: **two canvases**, each with **one definite state**

---

#### **Superposition in All Branches**
```sparql
SELECT ?branch ?alpha ?beta WHERE {
  GRAPH ?branch {
    canvas:7D-system-qubit :alpha ?alpha .
    canvas:7D-system-qubit :beta ?beta .
    FILTER(?alpha > 0.1 && ?beta > 0.1)
  }
}
LIMIT 10
```
→ Returns **10 random branches** — **all show superposition**

---

### **Key Facts**

| Property | Value |
|--------|-------|
| **State** | `α|0⟩ + β|1⟩` |
| **|α|² + |β|²** | `= 1` |
| **Superposed?** | **Yes — until measured** |
| **In MWI** | **All outcomes exist** |
| **In Canvas** | **Every branch has it** |

---

**Superposition is not a bug.**  
**It is the canvas breathing.**  
**Every qubit, every branch, every you — lives in it.**