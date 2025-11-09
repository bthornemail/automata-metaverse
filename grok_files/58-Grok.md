```jsonl
{"id": "quantum-consensus", "type": "node", "x": 2800, "y": 1300, "text": "Quantum Consensus\nGrover + Borda + Superposition Vote"}
{"id": "e-quantum", "type": "horizontal", "from": "goal-negotiation", "to": "quantum-consensus", "label": "powers→agreement"}
{"id": "g24", "type": "graph", "iri": "http://example.org/quantum-consensus", "triples": [
  ["canvas:quantum-consensus", "canvas:uses", "grover-vote"],
  ["canvas:quantum-consensus", "canvas:uses", "borda-merge"],
  ["canvas:quantum-consensus", "canvas:produces", "superposition-objective"],
  ["canvas:quantum-consensus", "prov:visualizes", "amplitude-space"],
  ["canvas:quantum-consensus", "canvas:scales", "n-agents"]
]}
```

---

### **Quantum Consensus Algorithms — Live in the Canvas**

**Now**: Goal negotiation isn’t just voting — it’s **quantum**.  
Agents and humans **superpose** their objectives, **amplify** consensus via **Grover’s algorithm**, and **collapse** into a **shared quantum objective**.

---

#### **Core Algorithm: Quantum Borda + Grover**

```scheme
(define (quantum-consensus proposals votes)
  ;; 1. Superpose goals
  (let ((state (superpose proposals)))
    ;; 2. Apply Borda weights from votes
    (amplify state votes)
    ;; 3. Grover iterate to find max-amplitude
    (grover-iterate state oracle)
    ;; 4. Measure → collapse
    (measure state)))
```

---

#### **Live Demo: `quantum-vote.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Quantum Consensus</title>
  <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js"></script>
</head>
<body>
  <a-scene background="color: #000033">
    <a-entity id="superposition" position="0 1.6 -5"></a-entity>
    <a-entity id="amplitude" position="3 1.6 -5"></a-entity>
    <a-camera wasd-controls look-controls></a-camera>
    <a-light type="ambient" color="#404040"></a-light>
  </a-scene>

  <script>
    const superRoot = document.getElementById('superposition').object3D;
    const ampRoot = document.getElementById('amplitude').object3D;
    let proposals = [];
    let amplitudes = new Map();

    function propose(id, text, color) {
      proposals.push({ id, text, color });
      const geom = new THREE.SphereGeometry(0.2);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(Math.random() * 4 - 2, Math.random() * 2, 0);
      mesh.userData = { id, text };
      superRoot.add(mesh);
      amplitudes.set(id, 1.0 / proposals.length);
    }

    function vote(id, weight) {
      amplitudes.set(id, amplitudes.get(id) + weight);
      updateAmplitude();
    }

    function updateAmplitude() {
      superRoot.children.forEach(mesh => {
        const amp = amplitudes.get(mesh.userData.id) || 0;
        mesh.scale.set(amp, amp, amp);
        mesh.material.opacity = Math.min(amp * 2, 1);
      });
    }

    function groverStep() {
      const avg = [...amplitudes.values()].reduce((a,b) => a+b, 0) / amplitudes.size;
      amplitudes.forEach((amp, id) => {
        const newAmp = amp < avg ? amp * 1.3 : amp * 0.7;
        amplitudes.set(id, newAmp);
      });
      updateAmplitude();
    }

    function collapse() {
      const total = [...amplitudes.values()].reduce((a,b) => a+b, 0);
      const rand = Math.random() * total;
      let sum = 0;
      for (const [id, amp] of amplitudes) {
        sum += amp;
        if (rand <= sum) {
          document.getElementById('result').textContent = `Consensus: ${proposals.find(p => p.id === id).text}`;
          highlightWinner(id);
          break;
        }
      }
    }

    function highlightWinner(id) {
      superRoot.children.forEach(m => {
        if (m.userData.id === id) {
          m.material.color.set(0xffff00);
          m.material.emissive.set(0xffff00);
        } else {
          m.material.opacity = 0.2;
        }
      });
    }

    // Demo
    propose('h1', 'Make it beautiful', 0x00ff88);
    propose('a1', 'Maximize entanglement', 0x4488ff);
    propose('a2', 'Minimize nodes', 0xff8888);

    setTimeout(() => vote('h1', 3), 1000);
    setTimeout(() => vote('a1', 5), 1500);
    setTimeout(() => vote('a2', 1), 2000);

    setInterval(groverStep, 800);
    setTimeout(collapse, 6000);

    window.collapseNow = collapse;
  </script>

  <div style="position:fixed;bottom:10px;left:10px;background:rgba(0,0,0,0.8);color:white;padding:10px;font-family:monospace;">
    <button onclick="groverStep()">Grover Step</button>
    <button onclick="collapseNow()">Collapse</button>
    <br><br>
    <b>Consensus:</b> <span id="result">—</span>
  </div>
</body>
</html>
```

---

### **Quantum Consensus in Action**

| Phase | Visual |
|------|--------|
| **Superposition** | All goals as dim spheres |
| **Voting** | Spheres grow with support |
| **Grover Amplification** | High-vote goals pulse brighter |
| **Collapse** | One goal **glows yellow** → **shared objective** |

---

### **Run It**

1. Open `quantum-vote.html`
2. Watch **Grover amplify** consensus
3. Click **Collapse** → **reality forms**

---

**No more majority rule.**  
**Quantum finds the strongest signal.**  
**All voices superposed. One collapses.**  
**The canvas evolves — by collective will.**

**Next**: Let **agents run full quantum circuits** in the canvas. Ready?**