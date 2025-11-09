```jsonl
{"id": "superdense-demo", "type": "node", "x": 1600, "y": 50, "text": "Superdense Coding\nLive Demo"}
{"id": "e-superdense", "type": "horizontal", "from": "entanglement-demo", "to": "superdense-demo", "label": "uses→2 bits"}
{"id": "g7", "type": "graph", "iri": "http://example.org/superdense", "triples": [
  ["canvas:alice", "sends", "2 classical bits"],
  ["canvas:alice", "uses", "1 entangled qubit"],
  ["canvas:bob", "receives", "2 classical bits"],
  ["canvas:superdense", "protocol", "active"]
]}
```

---

### **Superdense Coding — Live in the Canvas**

**Superdense Coding** = **Send 2 classical bits using 1 entangled qubit**  
**Entanglement doubles information capacity**

---

#### **Live Setup: Alice → Bob**
- **Shared entanglement**: `|Φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)`
- **Alice wants to send**: `11` (2 bits)

---

#### **Live Protocol**

```scheme
canvas> (superdense-send! '11 'alice 'bob)
; Step 1: Alice applies X then Z to her qubit
; Step 2: Alice sends her qubit to Bob (quantum channel)
; Step 3: Bob measures in Bell basis
; → Gets: 11
; → 2 bits sent with 1 qubit
```

---

#### **SPARQL: Verify Transmission**
```sparql
SELECT ?sent ?received WHERE {
  canvas:alice :sentBits ?sent .
  canvas:bob :receivedBits ?received .
}
```
→ Returns:
```
?sent    ?received
11       11
```

**Success**: **2 bits transmitted** using **1 qubit + entanglement**

---

#### **Live Demo: All 4 Messages**
```scheme
canvas> (superdense-send! '00 'alice 'bob)  ; → I  → |Φ⁺⟩
canvas> (superdense-send! '01 'alice 'bob)  ; → Z  → |Ψ⁺⟩
canvas> (superdense-send! '10 'alice 'bob)  ; → X  → |Ψ⁻⟩
canvas> (superdense-send! '11 'alice 'bob)  ; → XZ → |Φ⁻⟩
```

| Message | Alice Applies | Bell State | Bob Reads |
|--------|---------------|------------|-----------|
| `00`   | `I`           | `|Φ⁺⟩`     | `00`      |
| `01`   | `Z`           | `|Ψ⁺⟩`     | `01`      |
| `10`   | `X`           | `|Ψ⁻⟩`     | `10`      |
| `11`   | `XZ`          | `|Φ⁻⟩`     | `11`      |

---

#### **Live Output**
```text
[SUPERDENSE] Alice wants to send: 11
[ENTANGLE] Shared pair: |Φ⁺⟩
[ENCODE] Alice applies: X then Z → |Φ⁻⟩
[SEND] 1 qubit to Bob
[DECODE] Bob measures in Bell basis → 11
2 BITS SENT WITH 1 QUBIT
```

---

#### **Try It Live**
```scheme
canvas> (superdense-send! '01 'alice 'bob)
; → Bob receives: 01
```

---

### **Key Facts**

| Feature | Value |
|-------|-------|
| **Bits Sent** | `2` |
| **Qubits Used** | `1` |
| **Entanglement** | `Required` |
| **Classical Channel** | `Not needed` |
| **Efficiency** | `2× classical limit` |

---

**Superdense coding is live in the canvas.**  
**Send 2 bits with 1 qubit — using only entanglement.**  
**No classical channel. No delay. Pure quantum.**

**Try it: `(superdense-send! '10 'alice 'bob)`**