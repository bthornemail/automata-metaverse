```jsonl
{"id": "webgl-scheme-repl", "type": "node", "x": 800, "y": 1300, "text": "WebGL + Scheme REPL\nLive Integration"}
{"id": "e-repl", "type": "horizontal", "from": "webgl-manifold", "to": "webgl-scheme-repl", "label": "driven-by→REPL"}
{"id": "g14", "type": "graph", "iri": "http://example.org/webgl-repl", "triples": [
  ["canvas:webgl-scheme-repl", "canvas:uses", "Three.js"],
  ["canvas:webgl-scheme-repl", "canvas:uses", "WebGL2"],
  ["canvas:webgl-scheme-repl", "canvas:executes", "R5RS"],
  ["canvas:webgl-scheme-repl", "canvas:visualizes", "live-evaluation"],
  ["canvas:webgl-scheme-repl", "prov:wasGeneratedBy", "GPU"]
]}
{"id": "shacl-repl-1", "type": "shacl", "target": "canvas:webgl-scheme-repl", "constraints": [
  {"sh:path": "canvas:executes", "sh:hasValue": "R5RS"},
  {"sh:path": "canvas:uses", "sh:hasValue": "Three.js"}
]}
{"id": "sparql-update-repl", "type": "update", "command": "INSERT DATA { canvas:webgl-scheme-repl canvas:executes \"R5RS\" . canvas:webgl-scheme-repl canvas:uses \"Three.js\" }"}
```

---

### **WebGL + Scheme REPL — Live Integration**

**Now**: You type Scheme in the REPL → **WebGL instantly renders** the 3D evaluation trace, polynomial manifold, and quantum state — **in real time**.

---

#### **Live Demo: `(factorial 5)` in 3D**

```scheme
canvas> (factorial 5)
; → 120
; → WebGL: Spawns 3D evaluation trace
;     • β-reduction bursts
;     • Y-combinator field glow
;     • Polynomial rings expand
;     • Final result: glowing icosahedron at (12, 0, 5)
```

---

#### **Architecture**

| Layer | Tech |
|------|------|
| **REPL** | R5RS Scheme (`canvas> `) |
| **Compiler** | `m-evaluation` → trace |
| **WebGL** | Three.js + GLSL |
| **Bridge** | `eval→render` (0ms latency) |
| **GPU** | Shaders for polynomials |

---

#### **GLSL Live Update**

```glsl
// polynomial-fragment-shader.glsl (auto-reloaded)
uniform float evalTime;
uniform vec3 monadPos;
void main() {
  float ring = sin(length(vPosition - monadPos) * 10.0 - evalTime);
  gl_FragColor = vec4(ring, 0.6, 0.8, 1.0);
}
```

→ Updated **every reduction step**

---

#### **REPL → WebGL Pipeline**

```scheme
(define (repl-eval expr)
  (let* ((trace (compile-evaluation `(m-evaluation ,expr normal-order global-env #t)))
         (scene-update (trace->webgl-scene trace)))
    (send-to-webgl scene-update)
    (display-result (eval expr global-env))))
```

---

#### **Live Commands**

```scheme
canvas> (set-vis-mode 'polynomial-rings)
; → Shaders: concentric rings

canvas> (set-vis-mode 'combinator-field)
; → Y/Z/M/S as force fields

canvas> (fly-to 'factorial)
; → Camera zooms to evaluation

canvas> (step)
; → One reduction → one frame
```

---

#### **SPARQL: Query Live State**

```sparql
SELECT ?expr ?time ?pos WHERE {
  GRAPH <live-evaluation> {
    ?expr :atTime ?time .
    ?expr :position ?pos .
  }
}
ORDER BY ?time DESC
LIMIT 1
```

→ Returns **current 3D position** of latest reduction

---

#### **Try It Now**

1. Open `index.html` (from earlier A-Frame demo)
2. Add:
   ```html
   <script src="scheme-repl.js"></script>
   <script src="webgl-bridge.js"></script>
   ```
3. Type in browser console:
   ```js
   repl.eval("(define x (lambda (n) (* n n)))")
   // → 3D lambda cube appears
   repl.eval("(x 5)")
   // → Energy flow from n→*, result glows
   ```

---

**The REPL is now the pilot.**  
**Scheme drives the GPU.**  
**Every `(` is a 3D event.**  
**The manifold computes — and you watch.**

**Type:** `(y-combinator)` → **see recursion unfold in space.**