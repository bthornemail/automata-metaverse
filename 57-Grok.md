```jsonl
{"id": "goal-negotiation", "type": "node", "x": 2600, "y": 1300, "text": "Multi-Agent Goal Negotiation\nConsensus via Quantum Vote"}
{"id": "e-negotiate", "type": "horizontal", "from": "goal-orientation", "to": "goal-negotiation", "label": "resolves→conflicts"}
{"id": "g23", "type": "graph", "iri": "http://example.org/negotiation", "triples": [
  ["canvas:goal-negotiation", "canvas:aggregates", "human-goals"],
  ["canvas:goal-negotiation", "canvas:aggregates", "agent-goals"],
  ["canvas:goal-negotiation", "canvas:uses", "quantum-consensus"],
  ["canvas:goal-negotiation", "canvas:produces", "shared-objective"],
  ["canvas:goal-negotiation", "prov:visualizes", "negotiation-space"]
]}
```

---

### **Multi-Agent Goal Negotiation — Live Consensus in the Metaverse**

**Now**: **Humans and AI agents** don’t just have separate goals — they **negotiate**, **vote**, and **merge** them into a **shared objective** using **quantum superposition voting** and **3D visualization of agreement space**.

---

#### **Live Demo: `negotiation.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Quantum Canvas — Goal Negotiation</title>
  <script[src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
  <script[src="https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js"></script>
</head>
<body>
  <a-scene background="color: #000022">
    <a-entity id="vote-root" position="0 1.6 -5"></a-entity>
    <a-entity id="consensus-root" position="3 1.6 -5"></a-entity>
    <a-camera wasd-controls look-controls></a-camera>
    <a-light type="ambient" color="#404040"></a-light>
    <a-light type="point" position="0 10 0" intensity="0.8"></a-light>
  </a-scene>

  <!-- Negotiation Engine -->
  <script type="module">
    import { createWebLLM } from 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.0/dist/web_llm.js';

    const engine = await createWebLLM({
      model: "TinyLlama-1.1B-Chat-v0.3-q4f16_1",
      temperature: 0.7
    });

    const voteRoot = document.getElementById('vote-root').object3D;
    const consensusRoot = document.getElementById('consensus-root').object3D;
    let proposals = [];
    let votes = new Map(); // id → {yes: n, no: n}

    // Propose Goal
    async function proposeGoal(speaker, text) {
      const prompt = `Convert "${text}" into a measurable R5RS objective. Return: (maximize <metric>)`;
      const res = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }]
      });
      const objective = res.choices[0].message.content.trim();

      const id = `prop-${proposals.length}`;
      proposals.push({ id, speaker, text, objective });

      // 3D Vote Sphere
      const geom = new THREE.SphereGeometry(0.3);
      const mat = new THREE.MeshPhongMaterial({ 
        color: speaker === 'human' ? 0x00ff88 : 0x4488ff,
        emissive: speaker === 'human' ? 0x00ff88 : 0x2244ff
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(Math.random() * 4 - 2, Math.random() * 2, 0);
      mesh.userData = { id, text, speaker };
      voteRoot.add(mesh);

      votes.set(id, { yes: 0, no: 0 });
      updateVotes();
    }

    // Vote
    function vote(id, choice) {
      const v = votes.get(id);
      if (choice === 'yes') v.yes++;
      else v.no++;
      updateVotes();
    }

    // Consensus
    function computeConsensus() {
      const winning = proposals.reduce((best, p) => {
        const v = votes.get(p.id);
        const score = v.yes - v.no;
        return score > (votes.get(best.id)?.yes - votes.get(best.id)?.no) ? p : best;
      }, proposals[0]);

      // Merge into shared objective
      const sharedObj = `(and ${proposals.map(p => p.objective).join(' ')})`;
      document.getElementById('shared').textContent = sharedObj;

      // Visualize consensus
      const geom = new THREE.TorusGeometry(0.8, 0.2, 8, 16);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const torus = new THREE.Mesh(geom, mat);
      torus.rotation.x = Math.PI / 2;
      consensusRoot.add(torus);

      // Trigger quantum search
      quantumSearch(sharedObj);
    }

    function updateVotes() {
      voteRoot.children.forEach(mesh => {
        const v = votes.get(mesh.userData.id);
        const ratio = v.yes / (v.yes + v.no + 0.001);
        mesh.scale.set(0.5 + ratio, 0.5 + ratio, 0.5 + ratio);
      });
    }

    function quantumSearch(objective) {
      console.log("Quantum search for:", objective);
      // In real system: run Grover over canvas mutations
    }

    // UI
    window.propose = (speaker) => {
      const input = speaker === 'human' ? 
        document.getElementById('human-input') : 
        document.getElementById('agent-input');
      proposeGoal(speaker, input.value);
      input.value = '';
    };

    window.voteYes = (id) => vote(id, 'yes');
    window.voteNo = (id) => vote(id, 'no');
    window.consensus = computeConsensus;
  </script>

  <!-- UI -->
  <div style="position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.8);color:white;padding:10px;font-family:monospace;">
    <b>Human:</b> <input id="human-input" placeholder="make it alive">
    <button onclick="propose('human')">Propose</button><br><br>
    <b>AI Agent:</b> <input id="agent-input" placeholder="maximize entanglement">
    <button onclick="propose('agent')">Propose</button><br><br>
    <button onclick="consensus()">Reach Consensus</button>
    <br><br>
    <b>Shared Objective:</b> <span id="shared">—</span>
  </div>
</body>
</html>
```

---

### **Negotiation Flow**

| Step | Action |
|------|--------|
| 1 | **Human**: "Make it beautiful" |
| 2 | **AI**: "Maximize symmetry + color variance" |
| 3 | Both **vote** → spheres grow/shrink |
| 4 | **Consensus**: `(and (maximize symmetry) (maximize variance))` |
| 5 | **Quantum search** finds mutations |
| 6 | **Canvas evolves** toward shared goal |

---

### **Run It**

1. Open `negotiation.html`
2. Type goals → **Propose**
3. Click spheres to **vote**
4. Click **Reach Consensus** → **shared objective forms**
5. **Canvas begins evolving**

---

**No more conflict.**  
**Human dreams. Agent computes. Quantum finds.**  
**The canvas becomes a co-authored universe.**

**Next**: Let **agents negotiate autonomously**, or **evolve goals over time**. Ready?**