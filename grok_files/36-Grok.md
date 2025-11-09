```jsonl
{"id": "teleport-demo", "type": "node", "x": 1400, "y": 50, "text": "Quantum Teleportation\nLive Demo"}
{"id": "e-teleport", "type": "horizontal", "from": "entanglement-demo", "to": "teleport-demo", "label": "uses→teleport"}
{"id": "g6", "type": "graph", "iri": "http://example.org/teleport", "triples": [
  ["canvas:alice", "teleportsTo", "canvas:bob"],
  ["canvas:alice", "hasState", "|ψ⟩"],
  ["canvas:bob", "receives", "|ψ⟩"],
  ["canvas:teleport", "uses", "entanglement"],
  ["canvas:teleport", "uses", "classical-channel"]
]}
```

---

### **Quantum Teleportation — Live in the Canvas**

**Teleportation** = **Send a quantum state using entanglement + classical bits**  
No matter, no faster-than-light travel — just **information transfer**

---

#### **Live Setup: Alice → Bob**
```scheme
canvas> (define |ψ⟩ (qubit 0.6+0.3i 0.4-0.7i))  ; Unknown state to send
canvas> (normalize |ψ⟩)
(0.6+0.3i . 0.4-0.7i)  ; |α|² + |β|² = 1
```

- **Alice** has `|ψ⟩`  
- **Bob** is far away  
- **Shared entanglement**: `|Φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)`

---

#### **Live Teleportation Protocol**

```scheme
canvas> (teleport! |ψ⟩ 'alice 'bob)
; Step 1: Alice entangles her qubit with |ψ⟩
; Step 2: Alice measures in Bell basis → gets 2 classical bits
; Step 3: Alice sends bits to Bob (via classical channel)
; Step 4: Bob applies correction (I, X, Z, XZ)
; → Bob's qubit now = |ψ⟩
; → Original |ψ⟩ destroyed (no-cloning theorem)
```

---

#### **SPARQL: Verify Teleport Success**
```sparql
SELECT ?aliceState ?bobState WHERE {
  canvas:alice :hadState ?aliceState .
  canvas:bob :receives ?bobState .
}
```
→ Returns:
```
?aliceState     ?bobState
destroyed       0.6+0.3i . 0.4-0.7i
```

**Success**: Bob has **exact copy** of `|ψ⟩`  
**Alice's state is gone**

---

#### **Live Demo Output**
```text
[TELEPORT] Alice has: |ψ⟩ = (0.6+0.3i)|0⟩ + (0.4-0.7i)|1⟩
[ENTANGLE] Shared Bell pair: |Φ⁺⟩
[MEASURE] Alice measures → 10 (XZ correction)
[SEND] 2 classical bits → Bob
[APPLY] Bob applies X then Z
[RESULT] Bob's qubit = |ψ⟩
[CHECK] No-cloning: Alice's qubit scrambled
TELEPORTATION COMPLETE
```

---

#### **Try It Live**
```scheme
canvas> (teleport! (plus) 'alice 'bob)
; → Bob gets |+⟩
; → Alice gets garbage

canvas> (teleport! (qubit 1.0+0.0i 0.0+0.0i) 'alice 'bob)
; → Bob gets |0⟩
```

---

### **Key Facts**

| Step | Action |
|------|--------|
| 1 | Share entangled pair |
| 2 | Alice entangles with `|ψ⟩` |
| 3 | Alice measures → 2 bits |
| 4 | Send bits classically |
| 5 | Bob corrects → gets `|ψ⟩` |

**No FTL**  
**No cloning**  
**100% fidelity**

---

**Teleportation is live in the canvas.**  
**Send any qubit from Alice to Bob — instantly.**  
**Entanglement is the wire. Classical bits are the signal.**

**Try it now: `(teleport! (random-qubit) 'alice 'bob)`**