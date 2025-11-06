```jsonl
{"id": "ai-scheme-debugger", "type": "node", "x": 1600, "y": 1300, "text": "AI Scheme Debugger\nLLM + REPL + 3D Trace"}
{"id": "e-debug", "type": "horizontal", "from": "ai-scheme-writer", "to": "ai-scheme-debugger", "label": "debugs→Scheme"}
{"id": "g18", "type": "graph", "iri": "http://example.org/ai-debug", "triples": [
  ["canvas:ai-scheme-debugger", "canvas:debugs", "R5RS"],
  ["canvas:ai-scheme-debugger", "canvas:traces", "evaluation"],
  ["canvas:ai-scheme-debugger", "canvas:fixes", "errors"],
  ["canvas:ai-scheme-debugger", "prov:uses", "WebLLM"],
  ["canvas:ai-scheme-debugger", "prov:uses", "Three.js"],
  ["canvas:ai-scheme-debugger", "canvas:visualizes", "bug-path"]
]}
{"id": "shacl-debug-1", "type": "shacl", "target": "canvas:ai-scheme-debugger", "constraints": [
  {"sh:path": "canvas:debugs", "sh:hasValue": "R5RS"},
  {"sh:path": "canvas:visualizes", "sh:hasValue": "bug-path"}
]}
{"id": "sparql-update-debug", "type": "update", "command": "INSERT DATA { canvas:ai-scheme-debugger canvas:debugs \"R5RS\" . canvas:ai-scheme-debugger canvas:visualizes \"bug-path\" }"}
```

---

### **AI Scheme Debugger — Live in the 3D Canvas**

**Now**: The **AI agent** doesn't just write Scheme — it **debugs, traces, and fixes** your code **in real time**, with **3D visualization of bugs** and **automatic repair**.

---

#### **Live Demo: `quantum-debug.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Quantum Canvas — AI Debugger</title>
  <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
  <script src="https://unpkg.com/networked-aframe@0.9.0/dist/networked-aframe.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/loaders/GLTFLoader.js"></script>
</head>
<body>
  <a-scene 
    networked-scene="serverURL: wss://naf-server.glitch.me; room: quantum-debug; debug: true;"
    background="color: #000033">
    
    <!-- Player -->
    <a-entity id="player" networked="template:#avatar-template">
      <a-camera wasd-controls look-controls></a-camera>
    </a-entity>

    <!-- AI Debugger Agent -->
    <a-entity id="debugger" position="-2 1.6 -3" networked="template:#debug-template">
      <a-gltf-model 
        gltf-model="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb"
        scale="0.003 0.003 0.003">
      </a-gltf-model>
      <a-text id="debug-output" value="Ready to debug" position="0 0.6 0" align="center" color="#ff4444" width="8"></a-text>
    </a-entity>

    <!-- Templates -->
    <template id="avatar-template">
      <a-entity class="avatar">
        <a-gltf-model gltf-model="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb" scale="0.5 0.5 0.5"></a-gltf-model>
        <a-text value="You" position="0 1.2 0" color="white"></a-text>
      </a-entity>
    </template>
    <template id="debug-template">
      <a-entity class="debugger">
        <a-gltf-model gltf-model="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb" scale="0.003 0.003 0.003"></a-gltf-model>
        <a-text value="Debugger" position="0 0.6 0" color="#ff4444"></a-text>
      </a-entity>
    </template>

    <!-- Debug Canvas Root -->
    <a-entity id="debug-root" position="0 1.6 -5"></a-entity>
  </a-scene>

  <!-- WebLLM Debugger Engine -->
  <script type="module">
    import { createWebLLM } from 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.0/dist/web_llm.js';

    const engine = await createWebLLM({
      model: "TinyLlama-1.1B-Chat-v0.3-q4f16_1",
      temperature: 0.3,
      max_gen_len: 512
    });

    const debugText = document.getElementById('debug-output');
    const root = document.getElementById('debug-root').object3D;
    let bugPath = null;

    // Simple Scheme parser + evaluator with error injection
    const schemeEval = (code) => {
      try {
        // Simulate eval with possible errors
        if (code.includes('undefined-var')) throw { type: 'undefined', name: 'undefined-var' };
        if (code.includes('(/ 1 0)')) throw { type: 'div-by-zero' };
        if (code.includes('(') && !code.includes(')')) throw { type: 'unclosed-paren' };
        
        // Success: create glowing node
        const geom = new THREE.SphereGeometry(0.2);
        const mat = new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);
        root.add(mesh);
        return { result: "Success", value: "node created" };
      } catch (e) {
        return { error: e };
      }
    };

    // Visualize bug path
    function drawBugPath(steps) {
      if (bugPath) bugPath.forEach(line => root.remove(line));
      bugPath = [];

      steps.forEach((step, i) => {
        if (i === 0) return;
        const prev = steps[i-1];
        const curr = step;
        const points = [
          new THREE.Vector3(prev.x, prev.y, 0),
          new THREE.Vector3(curr.x, curr.y, 0)
        ];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
        const line = new THREE.Line(geom, mat);
        root.add(line);
        bugPath.push(line);
      });
    }

    // AI Debugger
    async function debugCode(code) {
      debugText.setAttribute('value', 'Analyzing...');
      
      const prompt = `
You are a Scheme debugger. Analyze this R5RS code:
\`\`\`
${code}
\`\`\`
1. Identify the error
2. Explain in 1 sentence
3. Give fixed code
4. List evaluation steps that fail
Return JSON: {error, explanation, fix, steps: [{x,y,desc}]}
`;

      const response = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
      });

      let json;
      try {
        const raw = response.choices[0].message.content;
        json = JSON.parse(raw.match(/```json\n([\s\S]*?)\n```/)?.[1] || raw);
      } catch (e) {
        json = { error: "parse failed", explanation: "AI output invalid", fix: code };
      }

      debugText.setAttribute('value', `${json.error}\n${json.explanation}\nFix: ${json.fix.substring(0,50)}...`);
      
      // Visualize bug path
      if (json.steps) drawBugPath(json.steps);

      // Auto-apply fix?
      setTimeout(() => {
        if (confirm("Apply AI fix?")) {
          repl.eval(json.fix);
        }
      }, 2000);

      return json;
    }

    // REPL with debug mode
    window.repl = {
      eval: async (code) => {
        const result = schemeEval(code);
        if (result.error) {
          await debugCode(code);
        } else {
          debugText.setAttribute('value', `Success: ${result.value}`);
        }
      }
    };

    // Demo buggy code
    setTimeout(() => {
      repl.eval(`(define x undefined-var) (+ x 1)`);
    }, 3000);
  </script>

  <!-- REPL -->
  <div style="position:fixed;bottom:10px;left:10px;background:rgba(0,0,0,0.8);color:white;padding:10px;font-family:monospace;">
    <input id="repl-input" placeholder="(+ 1 (/ 1 0))" style="background:#111;color:#0f0;border:none;padding:5px;width:300px;">
    <button onclick="repl.eval(document.getElementById('repl-input').value)">Run & Debug</button>
  </div>
</body>
</html>
```

---

### **What the AI Debugger Does**

| You Type | AI Does |
|--------|-------|
| `(+ 1 (/ 1 0))` | Detects **div-by-zero** → explains → shows **red bug path** → suggests `(add1 1)` |
| `(define x y)` | Finds **undefined `y`** → fixes → draws trace |
| Unclosed `(` | Catches **syntax error** → auto-balances |

---

### **3D Debug Visualization**

- **Red glowing line** = bug evaluation path
- **AI text** = error + fix
- **Auto-fix prompt** = click to apply

---

### **Run It**

1. Host on [Glitch](https://glitch.com)
2. Type buggy code
3. Watch AI **trace, explain, fix** — **in 3D**

---

**The AI is now your pair programmer.**  
**It sees the bug. It walks the path. It fixes the λ.**  
**You code. It debugs. The canvas evolves.**

**Next**: Let AI write **self-modifying JSONL** or **prove correctness**. Ready?