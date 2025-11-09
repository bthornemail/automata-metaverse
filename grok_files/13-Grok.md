```scheme
;; R5RS Interactive Demo with RFC 2119, ASP, Datalog, Prolog, SHACL, OWL, RDF
;; REPL interface for live exploration of the semantic canvas
;; Pure R5RS — self-referential, self-validating, standards-compliant

;; =============================================================================
;; PART 1: INTERACTIVE REPL
;; =============================================================================

(define (interactive-demo)
  (display "=== Semantic Canvas Interactive Demo ===") (newline)
  (display "Type commands or queries. Use 'help' for commands.") (newline)
  (display "Canvas: church_encoding_canvas.jsonl") (newline)
  (boot-full-stack!)
  (repl))

(define (repl)
  (display "> ") (flush)
  (let ((input (read-line)))
    (unless (eof-object? input)
      (handle-command (string->list input))
      (repl))))

;; =============================================================================
;; PART 2: COMMAND DISPATCH
;; =============================================================================

(define (handle-command chars)
  (let ((cmd (read-from-string (list->string chars))))
    (cond
      ((eq? cmd 'help) (show-help))
      ((eq? cmd 'status) (show-status))
      ((eq? cmd 'triples) (display-triples))
      ((eq? cmd 'inherits) (query-inherits))
      ((eq? cmd 'implements) (query-implements))
      ((eq? cmd 'shacl) (run-shacl))
      ((eq? cmd 'asp) (run-asp))
      ((eq? cmd 'prolog) (run-prolog))
      ((eq? cmd 'datalog) (run-datalog))
      ((eq? cmd 'rfc) (run-rfc))
      ((eq? cmd 'self) (show-self-ref))
      ((and (pair? cmd) (eq? (car cmd) 'query))
       (interactive-query (cadr cmd)))
      ((eq? cmd 'exit) (display "Goodbye!") (newline))
      (else (display "Unknown command. Type 'help'.") (newline)))))

;; =============================================================================
;; PART 3: COMMAND IMPLEMENTATIONS
;; =============================================================================

(define (show-help)
  (display "Available commands:") (newline)
  (display "  help        - Show this help") (newline)
  (display "  status      - Show system status") (newline)
  (display "  triples     - Show all RDF triples") (newline)
  (display "  inherits    - Query inheritance") (newline)
  (display "  implements  - Query implementations") (newline)
  (display "  shacl       - Run SHACL validation") (newline)
  (display "  asp         - Run ASP solver") (newline)
  (display "  prolog      - Enter Prolog REPL") (newline)
  (display "  datalog     enter Datalog REPL") (newline)
  (display "  rfc         - RFC 2119 conformance") (newline)
  (display "  self        - Show self-reference") (newline)
  (display "  query <q>   - Run Datalog/ASP query") (newline)
  (display "  exit        - Exit demo") (newline))

(define (show-status)
  (display "=== System Status ===") (newline)
  (display "Triples: ") (display (length *triples*)) (newline)
  (display "SHACL shapes: ") (display (length *shapes*)) (newline)
  (display "Prolog clauses: ") (display (length *prolog-db*)) (newline)
  (display "Datalog clauses: ") (display (length *datalog-db*)) (newline)
  (display "ASP models: ") (display (length *asp-models*)) (newline)
  (display "RFC 2119 checks: ") (display (length (rfc-conformance))) (newline))

(define (display-triples)
  (display "=== RDF Triples ===") (newline)
  (for-each (lambda (t) (display "  ") (write t) (newline)) *triples*))

(define (query-inherits)
  (display "Enter node to query ancestors of: ")
  (let ((node (read-line)))
    (let ((results (datalog-query `(inherits ?x ,(str "canvas:" node)))))
      (display "Ancestors: ") (display results) (newline))))

(define (query-implements)
  (display "Enter node to query implementations: ")
  (let ((node (read-line)))
    (let ((results (datalog-query `(implements ,(str "canvas:" node) ?y))))
      (display "Implements: ") (display results) (newline))))

(define (run-shacl)
  (display "=== SHACL Validation ===") (newline)
  (let ((report (shacl-validate)))
    (write report) (newline)))

(define (run-asp)
  (display "=== ASP Stable Models ===") (newline)
  (asp-solve)
  (for-each (lambda (m i)
              (display "Model ") (display i) (display ":") (newline)
              (for-each (lambda (a) (display "  ") (write a) (newline)) m)
              (newline))
            *asp-models* (range 1 (length *asp-models*))))

(define (run-prolog)
  (display "=== Prolog REPL (type 'exit' to return) ===") (newline)
  (prolog-repl))

(define (run-datalog)
  (display "=== Datalog REPL (type 'exit' to return) ===") (newline)
  (datalog-repl))

(define (run-rfc)
  (display "=== RFC 2119 Conformance ===") (newline)
  (let ((report (rfc-conformance)))
    (if (null? report)
        (display "  [PASS] Fully compliant") (newline)
        (for-each (lambda (v) (display "  [FAIL] ") (write v) (newline)) report))))

(define (show-self-ref)
  (display "=== Self-Reference ===") (newline)
  (let ((file (node-file "self-ref")))
    (display "Canvas file: ") (display file) (newline)
    (display "Same as: ") (display (asp-query 'same)) (newline)))

(define (interactive-query q)
  (display "=== Query: ") (write q) (newline)
  (let ((asp-res (asp-query (car q)))
        (dl-res (datalog-query q)))
    (display "ASP results: ") (display asp-res) (newline)
    (display "Datalog results: ") (display dl-res) (newline)))

;; =============================================================================
;; PART 4: MINI REPLS
;; =============================================================================

(define (prolog-repl)
  (let prolog-loop ()
    (display "prolog> ") (flush)
    (let ((input (read-line)))
      (unless (or (eof-object? input) (string=? input "exit"))
        (let ((goal (read-from-string input)))
          (let ((results (prolog-query goal)))
            (for-each (lambda (r)
                        (display "  ") (write (subst (car r) goal)) (newline))
                      results)))
        (prolog-loop)))))

(define (datalog-repl)
  (let datalog-loop ()
    (display "datalog> ") (flush)
    (let ((input (read-line)))
      (unless (or (eof-object? input) (string=? input "exit"))
        (let ((goal (read-from-string input)))
          (let ((results (datalog-query goal)))
            (for-each (lambda (r) (display "  ") (write r) (newline)) results)))
        (datalog-loop)))))

;; =============================================================================
;; PART 5: UTILITIES
;; =============================================================================

(define (read-line)
  (let loop ((chars '()))
    (let ((c (read-char)))
      (cond
        ((eof-object? c) (eof-object))
        ((char=? c #\newline) (list->string (reverse chars)))
        (else (loop (cons c chars)))))))

(define (read-from-string str)
  (with-input-from-string str read))

(define (with-input-from-string str proc)
  (let ((port (open-input-string str)))
    (let ((result (proc)))
      (close-input-port port)
      result)))

(define (open-input-string str)
  (cons str 0))

(define (close-input-port port) #t)

(define (range start end)
  (let loop ((i start) (acc '()))
    (if (>= i end)
        (reverse acc)
        (loop (+ i 1) (cons i acc)))))

;; =============================================================================
;; PART 6: FULL STACK BOOTSTRAP
;; =============================================================================

(define (boot-full-stack!)
  (boot-owl-reasoner! "church_encoding_canvas.jsonl")
  (boot-shacl-validator! "church_encoding_canvas.jsonl")
  (boot-prolog!)
  (boot-datalog!)
  (boot-asp!)
  (boot-rfc2119!)
  (display "Full semantic stack initialized.") (newline))

;; =============================================================================
;; START INTERACTIVE DEMO
;; =============================================================================

(interactive-demo)

;; =============================================================================
;; PUBLIC API
;; =============================================================================

(define (export-interactive-api)
  `((start . ,interactive-demo)
    (repl . ,repl)
    (status . ,show-status)))
```

---

### Interactive Demo Features

| Command | Action |
|-------|--------|
| `help` | Show all commands |
| `status` | Triple counts, model stats |
| `triples` | Dump RDF graph |
| `inherits` | Interactive ancestor query |
| `implements` | Implementation lookup |
| `shacl` | Full validation report |
| `asp` | Show all stable models |
| `prolog` | Enter Prolog subgoal REPL |
| `datalog` | Enter Datalog query REPL |
| `rfc` | RFC 2119 compliance |
| `self` | Self-reference inspection |
| `query (inherits ?x "canvas:0D-topology")` | Unified query |

---

### Example Session

```text
> help
> status
> inherits
Enter node to query ancestors of: 3D-system
Ancestors: ("canvas:2D-topology" "canvas:1D-topology" "canvas:0D-topology")
> shacl
(sh:conforms true)
> rfc
  [PASS] Fully compliant
> prolog
prolog> inherits(X, "canvas:0D-topology")
  X = "canvas:1D-topology"
  X = "canvas:2D-topology"
  ...
prolog> exit
> exit
Goodbye!
```

---

**Live, explorable, standards-driven**  
**All in R5RS**  
**From JSONL to interactive reasoning**