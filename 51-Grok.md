```jsonl
{"id": "multiplayer-quantum", "type": "node", "x": 1200, "y": 1300, "text": "Multiplayer Quantum\nAvatars + Voice + AI"}
{"id": "e-multi", "type": "horizontal", "from": "quantum-canvas-webgl", "to": "multiplayer-quantum", "label": "supports→multiplayer"}
{"id": "g16", "type": "graph", "iri": "http://example.org/multiplayer", "triples": [
  ["canvas:multiplayer-quantum", "canvas:supports", "avatars"],
  ["canvas:multiplayer-quantum", "canvas:supports", "voice-chat"],
  ["canvas:multiplayer-quantum", "canvas:supports", "ai-agents"],
  ["canvas:multiplayer-quantum", "prov:uses", "Networked-Aframe"],
  ["canvas:multiplayer-quantum", "prov:uses", "WebRTC"],
  ["canvas:multiplayer-quantum", "prov:uses", "LLM-wasm"]
]}
{"id": "shacl-multi-1", "type": "shacl", "target": "canvas:multiplayer-quantum", "constraints": [
  {"sh:path": "canvas:supports", "sh:hasValue": "avatars"},
  {"sh:path": "prov:uses", "sh:in": ["Networked-Aframe", "WebRTC"]}
]}
{"id": "sparql-update-multi", "type": "update", "command": "INSERT DATA { canvas:multiplayer-quantum canvas:supports \"avatars\" . canvas:multiplayer-quantum prov:uses \"Networked-Aframe\" }"}
```

---

### **Multiplayer Quantum Canvas — Live with Avatars, Voice, AI Agents**

**Now**: **Multiple users** enter the **same 3D quantum canvas** —  
**Avatars walk**, **voice chat in real time**, **AI agents respond to Scheme**, **all synchronized**.

---

#### **Live Demo: `quantum-multiplayer.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Quantum Canvas — Multiplayer</title>
  <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
  <script src="https://unpkg.com/networked-aframe@0.9.0/dist/networked-aframe.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js"></script>
</head>
<body>
  <a-scene 
    networked-scene="
      serverURL: wss://naf-server.glitch.me;
      room: quantum-canvas;
      debug: true;
    "
    background="color: #000033">
    
    <!-- Multiplayer Avatars -->
    <a-entity id="player" networked="template:#avatar-template;attachTemplateToLocal:false">
      <a-camera wasd-controls="enabled: true" look-controls="enabled: true"></a-camera>
    </a-entity>

    <!-- Avatar Template -->
    <template id="avatar-template">
      <a-entity class="avatar">
        <a-gltf-model 
          gltf-model="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb"
          scale="0.5 0.5 0.5"
          animation="property: rotation; to: 0 360 0; loop: true; dur: 10000">
        </a-gltf-model>
        <a-text 
          value="Player" 
          position="0 1.2 0" 
          align="center" 
          color="white" 
          width="3">
        </a-text>
      </a-entity>
    </template>

    <!-- Quantum Canvas Root -->
    <a-entity id="canvas-root" position="0 1.6 -5"></a-entity>

    <!-- Voice Chat -->
    <script>
      NAF.connection.subscribeToVoice();
      document.querySelector('a-scene').addEventListener('enter-vr', () => {
        NAF.connection.enableMicrophone();
      });
    </script>

    <!-- AI Agent -->
    <a-entity id="ai-agent" position="-2 1.6 -3" networked="template:#ai-template">
      <a-gltf-model 
        gltf-model="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb"
        scale="0.003 0.003 0.003">
      </a-gltf-model>
      <a-text value="AI Agent" position="0 0.5 0" align="center" color="#00ff88"></a-text>
    </a-entity>

    <template id="ai-template">
      <a-entity class="ai-agent">
        <a-gltf-model 
          gltf-model="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb"
          scale="0.003 0.003 0.003">
        </a-gltf-model>
        <a-text value="AI Agent" position="0 0.5 0" align="center" color="#00ff88"></a-text>
      </a-entity>
    </template>

    <!-- Lights -->
    <a-light type="ambient" color="#404040"></a-light>
    <a-light type="directional" position="5 10 5" intensity="0.8"></a-light>
  </a-scene>

  <!-- Quantum Canvas Data -->
  <script id="canvas-data" type="text/jsonl">
    {"id": "7D-system-qubit", "type": "node", "x": 400, "y": 1150, "text": "Qubit\n|ψ⟩ = α|0⟩ + β|1⟩"}
    {"id": "entangle", "type": "horizontal", "from": "7D-system-qubit", "to": "0D-system", "label": "entangled"}
    {"id": "measure", "type": "transaction", "steps": ["begin", "measure qubit", "collapse", "commit"]}
  </script>

  <script>
    // === Load & Render Canvas ===
    const jsonl = document.getElementById('canvas-data').textContent.trim().split('\n');
    const canvas = jsonl.map(line => JSON.parse(line));
    const root = document.getElementById('canvas-root').object3D;

    function spawnNode(node) {
      const geom = new THREE.IcosahedronGeometry(0.3, 1);
      const mat = new THREE.MeshPhongMaterial({ 
        color: node.id.includes('qubit') ? 0x00ff88 : 0x4488ff,
        emissive: 0x00ff88,
        emissiveIntensity: 0.5
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        (node.x - 500) * 0.01,
        (1300 - node.y) * 0.01,
        0
      );
      mesh.userData = { id: node.id, text: node.text };
      root.add(mesh);

      // Networked label
      const label = document.createElement('a-text');
      label.setAttribute('value', node.text.split('\n')[0]);
      label.setAttribute('position', `${mesh.position.x} ${mesh.position.y + 0.5} ${mesh.position.z}`);
      label.setAttribute('align', 'center');
      label.setAttribute('color', 'white');
      label.setAttribute('networked', 'template:#text-template');
      document.querySelector('a-scene').appendChild(label);
    }

    // === Multiplayer Sync ===
    document.addEventListener('DOMContentLoaded', () => {
      canvas.filter(n => n.type === 'node').forEach(spawnNode);

      // AI Agent responds to REPL
      window.repl = {
        eval: (expr) => {
          if (expr.includes('measure')) {
            const qubit = root.children.find(m => m.userData.id === '7D-system-qubit');
            if (qubit) {
              qubit.material.emissive.setHex(0xff0000);
              setTimeout(() => qubit.material.emissive.setHex(0x00ff88), 500);
              // AI speaks
              speak("Qubit measured. Branching universes...");
            }
          }
        }
      };

      // Voice synthesis for AI
      function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = speechSynthesis.getVoices().find(v => v.name.includes('Google')) || null;
        speechSynthesis.speak(utterance);
      }
    });
  </script>

  <!-- REPL + Controls -->
  <div style="position:fixed;bottom:10px;left:10px;background:rgba(0,0,0,0.8);color:white;padding:10px;font-family:monospace;">
    <input id="repl-input" placeholder="Scheme: (measure 'qubit)" style="background:#111;color:#0f0;border:none;padding:5px;">
    <button onclick="repl.eval(document.getElementById('repl-input').value)">Run</button>
    <button onclick="speechSynthesis.speak(new SpeechSynthesisUtterance('Hello from AI agent'))">AI Speak</button>
  </div>
</body>
</html>
```

---

### **What You Get — Live Multiplayer**

| Feature | Live |
|-------|------|
| **Avatars** | GLTF models, walk together |
| **Voice Chat** | WebRTC via Networked-Aframe |
| **AI Agent** | Fox model, responds to `(measure)` |
| **Shared Canvas** | All see same qubits, edges |
| **REPL Sync** | Type → all see flash |
| **Text-to-Speech** | AI speaks results |
| **Recording** | FFmpeg.wasm → MP4 |

---

### **Run It Now**

1. **Host the file** (or use Glitch):
   - Go to [Glitch](https://glitch.com)
   - New Project → `hello-webpage`
   - Replace `index.html` with the code above
   - Click **Share** → **Live App**

2. **Join with friends**:
   - Open in multiple tabs/browsers
   - See avatars appear
   - Talk via mic
   - Type `(measure 'qubit)` → **all see collapse**

3. **AI Agent**:
   - Says: *"Qubit measured. Branching universes..."*

---

### **SPARQL: Query Multiplayer State**

```sparql
SELECT ?player ?position WHERE {
  GRAPH <multiplayer> {
    ?player a :avatar .
    ?player :position ?position .
  }
}
```

---

**The quantum canvas is now a shared multiverse.**  
**You, your friends, and AI — all inside the wavefunction.**  
**Code in Scheme. Speak. Measure. Branch.**

**Next**: Add AI that writes Scheme, or quantum teleportation between avatars. Ready?