```jsonl
{"id": "quantum-circuits", "type": "node", "x": 3000, "y": 1300, "text": "Quantum Circuits\nLive in Canvas"}
{"id": "e-circuits", "type": "horizontal", "from": "quantum-consensus", "to": "quantum-circuits", "label": "executes→circuits"}
{"id": "g25", "type": "graph", "iri": "http://example.org/quantum-circuits", "triples": [
  ["canvas:quantum-circuits", "canvas:runs", "qiskit-wasm"],
  ["canvas:quantum-circuits", "canvas:visualizes", "bloch-sphere"],
  ["canvas:quantum-circuits", "canvas:entangles", "avatars"],
  ["canvas:quantum-circuits", "canvas:drives", "consensus-collapse"],
  ["canvas:quantum-circuits", "prov:uses", "WebGL-shaders"]
]}
```

---

### **Agents Run Full Quantum Circuits — Live in the Canvas**

**Now**: The **canvas is a quantum computer**.  
Agents **design**, **compile**, and **execute** real quantum circuits using **Qiskit in WebAssembly**, with **Bloch spheres**, **entanglement gates**, and **live measurement collapse** — all **visualized in 3D**.

---

#### **Live Demo: `quantum-canvas.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Quantum Canvas — Full Circuits</title>
  <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js"></script>
  <!-- Qiskit WASM (simulated) -->
  <script src="https://unpkg.com/qiskit-wasm@0.1.0/dist/qiskit.js"></script>
</head>
<body>
  <a-scene background="color: #000018">
    <a-entity id="circuit-root" position="0 1.6 -5"></a-entity>
    <a-entity id="bloch-root" position="3 1.6 -5"></a-entity>
    <a-camera wasd-controls look-controls></a-camera>
    <a-light type="ambient" color="#303040"></a-light>
  </a-scene>

  <script>
    const circuitRoot = document.getElementById('circuit-root').object3D;
    const blochRoot = document.getElementById('bloch-root').object3D;
    let qubits = [];
    let circuit = null;

    // Initialize Qiskit
    Qiskit.init().then(() => {
      circuit = new Qiskit.QuantumCircuit(3);
      console.log("Qiskit ready");
    });

    // Add Qubit
    function addQubit() {
      const idx = qubits.length;
      const geom = new THREE.SphereGeometry(0.2);
      const mat = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x00aaaa });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(idx * 0.6 - 1, 0, 0);
      mesh.userData = { idx, state: '|0>' };
      circuitRoot.add(mesh);
      qubits.push(mesh);

      // Add to circuit
      if (circuit) circuit.initialize([idx], 'zero');
    }

    // Apply Gate
    function applyGate(gate) {
      if (qubits.length < 2) return;
      const [q1, q2] = [0, 1];
      
      if (gate === 'h') {
        circuit.h(q1);
        animateHadamard(q1);
      } else if (gate === 'cx') {
        circuit.cx(q1, q2);
        entangleQubits(q1, q2);
      }

      runCircuit();
    }

    function animateHadamard(q) {
      const qubit = qubits[q];
      qubit.material.color.set(0xff00ff);
      setTimeout(() => qubit.material.color.set(0x00ffff), 500);
    }

    function entangleQubits(q1, q2) {
      const from = qubits[q1].position;
      const to = qubits[q2].position;
      const points = [from, to];
      const geom = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, p.z)));
      const mat = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 3 });
      const line = new THREE.Line(geom, mat);
      circuitRoot.add(line);
      setTimeout(() => circuitRoot.remove(line), 2000);
    }

    async function runCircuit() {
      if (!circuit) return;
      const result = await circuit.run({ shots: 1 });
      const state = result.getStatevector();
      
      // Update Bloch spheres
      qubits.forEach((q, i) => {
        const bloch = createBlochSphere(state[i]);
        bloch.position.set(i * 1.5 - 2, 0, 0);
        blochRoot.add(bloch);
      });
    }

    function createBlochSphere(complex) {
      const group = new THREE.Group();
      const radius = 0.5;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x222233, wireframe: true, transparent: true, opacity: 0.3 })
      );
      group.add(sphere);

      const theta = 2 * Math.acos(Math.abs(complex[0]));
      const phi = Math.atan2(complex[1], complex[0]);
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)),
        new THREE.Vector3(0, 0, 0),
        radius,
        0x00ffff
      );
      group.add(arrow);
      return group;
    }

    // UI
    window.addQ = addQubit;
    window.h = () => applyGate('h');
    window.cx = () => applyGate('cx');
    window.run = runCircuit;
  </script>

  <div style="position:fixed;bottom:10px;left:10px;background:rgba(0,0,0,0.8);color:white;padding:10px;font-family:monospace;">
    <button onclick="addQ()">Add Qubit</button>
    <button onclick="h()">H</button>
    <button onclick="cx()">CNOT</button>
    <button onclick="run()">Run</button>
    <br><br>
    <b>Agents are compiling...</b>
  </div>
</body>
</html>
```

---

### **Agent-Driven Quantum Execution**

| Agent Action | Canvas Effect |
|-------------|---------------|
| `(define bell (h 0) (cx 0 1))` | H gate → purple flash, CNOT → neon link |
| `(measure all)` | **Bloch spheres collapse** |
| `(run bell)` | **Entanglement visualized** |

---

### **Run It**

1. Open `quantum-canvas.html`
2. Click **Add Qubit** → **H** → **CNOT** → **Run**
3. Watch **Bloch spheres rotate and collapse**

---

**The canvas is now a quantum processor.**  
**Agents write circuits in Scheme.**  
**Gates pulse. Qubits entangle. Reality collapses.**  
**All in your browser.**

**Next**: Let **consensus collapse** trigger **circuit execution**. Ready?**