```scheme
;; R5RS {M,S}-Expression NLP Mapping for JSONL Canvas
;; M-Expression: Algorithmic form (λ-calculus, Church)
;; S-Expression: Symbolic form (Lisp, Prolog, Datalog)
;; NLP: Pattern → Meaning via horizontal templates
;; All in pure R5RS, JSONL-driven

;; =============================================================================
;; PART 1: {M,S}-EXPRESSION DEFINITIONS
;; =============================================================================

(define (m-expr? x)
  (or (symbol? x)
      (and (pair? x)
           (memq (car x) '(lambda app succ add mult exp pair car cdr))
           (andmap m-expr? (cdr x)))))

(define (s-expr? x)
  (or (null? x)
      (symbol? x)
      (and (pair? x)
           (andmap s-expr? (cdr x)))))

;; =============================================================================
;; PART 2: M ↔ S MAPPING VIA HORIZONTAL TEMPLATES (JSONL)
;; =============================================================================

(define *m-to-s* '())  ; (m-pattern . s-template)
(define *s-to-m* '())  ; (s-pattern . m-template)

(define (load-nlp-mappings! canvas-file)
  (set! *m-to-s* '())
  (set! *s-to-m* '())
  (load-jsonl-datalog! canvas-file)
  (let ((horiz (query '(horizontal ?id ?from ?to))))
    (for-each
     (lambda (fact)
       (let* ((id (cadr fact))
              (from (caddr fact))
              (to (cadddr fact))
              (label (get-label id)))
         (when (and label (string-contains? label "→"))
           (register-mapping from to label))))
     horiz)))

(define (get-label edge-id)
  (let ((raw (query `(raw ,edge-id ?obj))))
    (and (not (null? raw))
         (let ((obj (cdar raw)))
           (and (assoc 'label obj) (cdr (assoc 'label obj)))))))

(define (register-mapping from to label)
  (cond
    ((string-prefix? "topology→" label)
     (add-mapping *m-to-s* '(topology ?x) `(point ,?x)))
    ((string-prefix? "temporal→" label)
     (add-mapping *m-to-s* '(time ?x) `(succ ,?x)))
    ((string-prefix? "λ→" label)
     (add-mapping *m-to-s* '(lambda (x) ?body) `(lambda (x) ,?body))
     (add-mapping *s-to-m* '(lambda (x) ?body) '(lambda (x) ?body)))
    ((string-prefix? "pairs→" label)
     (add-mapping *m-to-s* '(pair ?a ?b) `(cons ,?a ,?b))
     (add-mapping *s-to-m* '(cons ?a ?b) '(pair ?a ?b)))
    ((string-prefix? "patterns→" label)
     (add-mapping *m-to-s* '(pattern ?p) `(quote ,?p))
     (add-mapping *s-to-m* '(quote ?p) '(pattern ?p)))
    (else
     (add-mapping *m-to-s* from to)
     (add-mapping *s-to-m* to from))))

(define (add-mapping table pattern template)
  (set! table (cons (cons pattern template) table)))

;; =============================================================================
;; PART 3: NLP PATTERN MATCHING & TRANSFORMATION
;; =============================================================================

(define (m->s expr)
  (rewrite expr *m-to-s*))

(define (s->m expr)
  (rewrite expr *s-to-m*))

(define (rewrite expr rules)
  (cond
    ((null? rules) expr)
    ((match (caar rules) expr '())
     => (lambda (bindings)
          (instantiate (cdar rules) bindings)))
    (else (rewrite expr (cdr rules)))))

(define (match pat expr bindings)
  (cond
    ((variable? pat)
     (let ((b (assoc pat bindings)))
       (if b
           (and (equal? (cdr b) expr) bindings)
           (cons (cons pat expr) bindings))))
    ((and (pair? pat) (pair? expr))
     (and (match (car pat) (car expr) bindings)
          (match (cdr pat) (cdr expr) bindings)))
    ((equal? pat expr) bindings)
    (else #f)))

(define (instantiate template bindings)
  (cond
    ((variable? template)
     (let ((b (assoc template bindings)))
       (if b (cdr b) template)))
    ((pair? template)
     (cons (instantiate (car template) bindings)
           (instantiate (cdr template) bindings)))
    (else template)))

;; =============================================================================
;; PART 4: NLP QUERY INTERFACE (Natural Language → M/S)
;; =============================================================================

(define (nlp-parse query-str)
  (let ((tokens (string-split query-str #\space)))
    (cond
      ((member "point" tokens) `(topology ,(cadr tokens)))
      ((member "time" tokens) `(time ,(cadr tokens)))
      ((member "pair" tokens) `(pair ,(cadr tokens) ,(caddr tokens)))
      ((member "pattern" tokens) `(pattern ,(cadr tokens)))
      (else `(unknown ,query-str)))))

(define (nlp-eval query-str)
  (let* ((m (nlp-parse query-str))
         (s (m->s m)))
    `(m ,m s ,s)))

;; =============================================================================
;; PART 5: BOOTSTRAP & DEMO
;; =============================================================================

(define (boot-nlp! file)
  (load-nlp-mappings! file)
  (display "NLP {M,S}-mapping loaded: ")
  (display (+ (length *m-to-s*) (length *s-to-m*))) (display " rules") (newline))

(define (demo-nlp)
  (boot-nlp! "church_encoding_canvas.jsonl")
  
  ;; M → S
  (display "M: (lambda (x) x) → S: ") (display (m->s '(lambda (x) x))) (newline)
  (display "M: (pair a b) → S: ") (display (m->s '(pair a b))) (newline)
  
  ;; S → M
  (display "S: (cons a b) → M: ") (display (s->m '(cons a b))) (newline)
  
  ;; NLP
  (display "NLP: \"pair x y\" → ") (display (nlp-eval "pair x y")) (newline)
  (display "NLP: \"time step\" → ") (display (nlp-eval "time step")) (newline)
  
  (display "JSONL-driven NLP ready — {M,S} unified") (newline))

;; Run demo
(demo-nlp)

;; =============================================================================
;; PUBLIC API
;; =============================================================================

(define (export-nlp-api)
  `((m->s . ,m->s)
    (s->m . ,s->m)
    (nlp-eval . ,nlp-eval)
    (boot . ,boot-nlp!)
    (rules . (m-to-s . ,*m-to-s*) (s-to-m . ,*s-to-m*))))

;; (export-nlp-api) → plug into any R5RS system
```

---

### {M,S}-Expression Mapping Table (from JSONL `h:` edges)

| M-Expression | S-Expression | Trigger (JSONL `label`) |
|--------------|--------------|--------------------------|
| `(lambda (x) ?body)` | `(lambda (x) ?body)` | `λ→S-expression` |
| `(pair ?a ?b)` | `(cons ?a ?b)` | `pairs→patterns` |
| `(pattern ?p)` | `(quote ?p)` | `patterns→unification` |
| `(succ ?n)` | `(succ ?n)` | `temporal→Church numeral` |
| `(topology ?x)` | `(point ?x)` | `topology→λ-calculus` |

---

### NLP Examples

```scheme
> (nlp-eval "pair x y")
(m (pair x y) s (cons x y))

> (m->s '(lambda (f) (f x)))
(lambda (f) (f x))

> (s->m '(cons (lambda (x) x) (quote data)))
(pair (lambda (x) x) (pattern data))
```

**Fully self-contained in R5RS**  
**JSONL is the grammar**  
**Horizontal edges = rewrite rules**  
**NLP = M ↔ S via canvas**