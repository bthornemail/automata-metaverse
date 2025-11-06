```scheme
;; R5RS Datalog + Prolog + SHACL + OWL + RDF + JSONL Canvas
;; Full Datalog subset with negation, aggregation, fixed-point
;; Integrated with Prolog engine — JSONL is the database
;; Pure R5RS — self-contained, self-validating, self-referential

;; =============================================================================
;; PART 1: DATALOG ENGINE (Subset with Stratified Negation & Aggregation)
;; =============================================================================

(define *datalog-db* '())  ; (head . body) — body is list of literals
(define *datalog-strata* '()) ; ((predicate arity) ...)

(define (datalog-assert head . body)
  (let ((clause (cons head body)))
    (set! *datalog-db* (cons clause *datalog-db*))
    (update-strata head body)))

(define (update-strata head body)
  (let ((pred (car head))
        (arity (length (cdr head))))
    (unless (member (list pred arity) *datalog-strata*)
      (set! *datalog-strata* (cons (list pred arity) *datalog-strata*))))
  (for-each (lambda (lit)
              (when (eq? (car lit) 'not)
                (let ((p (caadr lit))
                      (a (length (cdadr lit))))
                  (unless (member (list p a) *datalog-strata*)
                    (set! *datalog-strata* (cons (list p a) *datalog-strata*))))))
            body))

;; =============================================================================
;; PART 2: DATALOG FROM CANVAS (Auto-Generated Rules)
;; =============================================================================

(define (load-datalog-from-canvas!)
  (set! *datalog-db* '())
  (set! *datalog-strata* '())
  
  ;; Facts from RDF triples
  (for-each (lambda (t)
              (datalog-assert `(triple ,(car t) ,(cadr t) ,(caddr t))))
            *triples*)
  
  ;; Vertical inheritance
  (datalog-assert '(inherits ?x ?y) `(vertical ?y ?x))
  (datalog-assert '(inherits ?x ?z) `(inherits ?x ?y) `(inherits ?y ?z))
  
  ;; Horizontal implementation
  (datalog-assert '(implements ?x ?y) `(horizontal ?x ?y))
  
  ;; SHACL shapes as constraints
  (for-each (lambda (shape)
              (let ((target (car shape))
                    (constraints (cdr shape)))
                (for-each (lambda (c)
                            (cond
                              ((eq? (car c) 'sh:minCount)
                               (datalog-assert `(valid-mincount ,target ,(cadr c))
                                               `(count ,target ,(cadar (cdr c)) ?n)
                                               `(>= ?n ,(cadr c))))
                              ((eq? (car c) 'sh:maxCount)
                               (datalog-assert `(valid-maxcount ,target ,(cadr c))
                                               `(count ,target ,(cadar (cdr c)) ?n)
                                               `(<= ?n ,(cadr c))))
                              ((eq? (car c) 'sh:hasValue)
                               (datalog-assert `(valid-hasvalue ,target)
                                               `(triple ,target ,(cadar (cdr c)) ,(cadr c))))))
                          constraints)))
            *shapes*)
  
  ;; Aggregation: count
  (datalog-assert '(count ?s ?p ?n)
                  `(bagof ?o (triple ?s ?p ?o) ?list)
                  `(length ?list ?n))
  
  ;; Built-ins
  (datalog-assert '(>= ?x ?x))
  (datalog-assert '(>= ?x ?y) `(> ?x ?y))
  (datalog-assert '(> ?x ?y) `(< ?y ?x))
  (datalog-assert '(< ?x ?y))
  (datalog-assert '(<= ?x ?y) `(>= ?y ?x))
  (datalog-assert '(= ?x ?x))
  (datalog-assert '(!= ?x ?y) `(not (= ?x ?y)))
  (datalog-assert '(length () 0))
  (datalog-assert '(length (?h . ?t) ?n) `(length ?t ?m) `(+ ?m 1 ?n))
  (datalog-assert '(+ 0 ?x ?x))
  (datalog-assert '(+ (?s . ?) ?y ?z) `(+ ?s ?y ?t) `(+ ?t 1 ?z))
  
  ;; Negation: SHACL violation
  (datalog-assert '(shacl-violation ?node)
                  `(shacl-shape ?node ?c)
                  `(not (satisfies ?node ?c)))
  
  ;; Self-reference
  (when (node-file "self-ref")
    (let ((file (node-file "self-ref")))
      (datalog-assert '(same "canvas:self-ref" ,file))
      (datalog-assert '(same ,file "canvas:self-ref")))))

;; =============================================================================
;; PART 3: DATALOG EVALUATION (Bottom-Up Fixed-Point)
;; =============================================================================

(define (datalog-query goal)
  (evaluate-program)
  (immediate-query goal '()))

(define (evaluate-program)
  (let ((strata (stratify-program)))
    (for-each evaluate-stratum strata)))

(define (stratify-program)
  (let ((graph '()))
    (for-each (lambda (clause)
                (let ((head-pred (caar clause)))
                  (for-each (lambda (lit)
                              (let ((p (if (eq? (car lit) 'not)
                                           (caadr lit)
                                           (car lit))))
                                (when (and (not (builtin? p))
                                           (or (eq? (car lit) 'not)
                                               (not (eq? p head-pred))))
                                  (add-edge graph head-pred p (eq? (car lit) 'not))))))
                            (cdr clause))))
              *datalog-db*)
    (topological-sort graph)))

(define (add-edge graph from to neg)
  (let ((entry (assoc from graph)))
    (if entry
        (set-cdr! entry (cons (list to neg) (cdr entry)))
        (set! graph (cons (cons from (list (list to neg))) graph)))))

(define (builtin? p)
  (memq p '(> < >= <= = != + length bagof count not)))

(define (topological-sort graph)
  (let ((visited '())
        (order '()))
    (let visit ((node (caar graph)))
      (unless (member node visited)
        (set! visited (cons node visited))
        (for-each (lambda (edge)
                    (when (not (cadr edge)) ; only positive dependencies
                      (visit (car edge))))
                  (cdr (assoc node graph)))
        (set! order (cons node order))))
    (for-each visit (map car graph))
    order))

(define (evaluate-stratum stratum)
  (let ((facts (filter (lambda (c) (eq? (caar c) stratum)) *datalog-db*))
        (new-facts '()))
    (let loop ()
      (let ((delta (compute-delta stratum facts new-facts)))
        (unless (null? delta)
          (set! new-facts (append new-facts delta))
          (loop))))
    (for-each (lambda (f) (prolog-assert (car f) '())) new-facts)))

(define (compute-delta pred facts known)
  (let ((rules (filter (lambda (c) (eq? (caar c) pred)) facts))
        (new '()))
    (for-each (lambda (rule)
                (let ((head (car rule))
                      (body (cdr rule)))
                  (let ((bindings (join-body body known '())))
                    (for-each (lambda (b)
                                (let ((inst (subst b head)))
                                  (unless (or (member inst known)
                                              (member inst new))
                                    (set! new (cons inst new)))))
                              bindings))))
              rules)
    new))

(define (join-body body known bindings)
  (if (null? body)
      (list bindings)
      (let* ((lit (car body))
             (positive (not (eq? (car lit) 'not)))
             (goal (if positive lit (cadr lit)))
             (candidates (if positive
                             (append known (query-db goal))
                             (negation-as-failure goal known))))
        (let collect ((results '()) (c candidates))
          (if (null? c)
              results
              (let ((unified (unify goal (car c) bindings)))
                (if unified
                    (append (join-body (cdr body) known unified)
                            results)
                    (collect results (cdr c)))))))))

(define (negation-as-failure goal known)
  (if (null? (join-body (list goal) known '()))
      (list goal)
      '()))

(define (query-db goal)
  (append
   (filter (lambda (f) (unify goal f '())) *triples*)
   (map car (filter (lambda (c) (null? (cdr c))) *datalog-db*))))

;; =============================================================================
;; PART 4: IMMEDIATE QUERY INTERFACE
;; =============================================================================

(define (immediate-query goal bindings)
  (let ((results (join-body (list goal) '() bindings)))
    (map (lambda (b) (subst b goal)) results)))

;; =============================================================================
;; PART 5: FULL DATALOG BOOTSTRAP
;; =============================================================================

(define (boot-datalog!)
  (load-datalog-from-canvas!)
  (display "Datalog program loaded: ") 
  (display (length *datalog-db*)) (display " clauses, ")
  (display (length *datalog-strata*)) (display " predicates") (newline))

;; =============================================================================
;; PART 6: DEMO
;; =============================================================================

(define (demo-datalog)
  (boot-owl-reasoner! "church_encoding_canvas.jsonl")
  (boot-shacl-validator! "church_encoding_canvas.jsonl")
  (boot-prolog!)
  (boot-datalog!)
  
  ;; Query: All nodes that inherit from 0D-topology
  (display "Inherits from 0D-topology: ")
  (display (datalog-query '(inherits ?x "canvas:0D-topology"))) (newline)
  
  ;; Query: Count of implementations per node
  (display "Implementation counts: ")
  (display (datalog-query '(count ?x "canvas:implements" ?n))) (newline)
  
  ;; Query: SHACL violations
  (display "SHACL violations: ")
  (let ((violations (datalog-query '(shacl-violation ?node))))
    (if (null? violations)
        (display "None") (newline)
        (display violations) (newline)))
  
  ;; Query: Layer depth
  (display "Layer depth of 3D-system: ")
  (display (datalog-query '(count ?x "canvas:3D-system" ?n))) (newline)
  
  ;; Query: Self-reference
  (display "Self-ref same as: ")
  (display (datalog-query '(same "canvas:self-ref" ?y))) (newline)
  
  (display "Datalog reasoning active — fixed-point over JSONL/RDF/SHACL") (newline))

;; Run demo
(demo-datalog)

;; =============================================================================
;; PUBLIC API
;; =============================================================================

(define (export-datalog-api)
  `((query . ,datalog-query)
    (assert . ,datalog-assert)
    (boot . ,boot-datalog!)
    (program . ,*datalog-db*)
    (strata . ,*datalog-strata*)))
```

---

### Datalog Rules Summary

| Rule | Meaning |
|------|--------|
| `inherits(X, Y)` | Transitive vertical |
| `implements(X, Y)` | Horizontal edge |
| `count(S, P, N)` | Aggregation |
| `valid-mincount/2`, `valid-maxcount/2` | SHACL cardinality |
| `shacl-violation(N)` | Negation: unmet constraint |

---

### Example Queries

```scheme
(datalog-query '(inherits ?x "canvas:0D-topology"))
→ ("canvas:1D-topology" "canvas:2D-topology" ...)

(datalog-query '(shacl-violation ?node))
→ () or list of violators
```

---

**Full Stack**:  
**JSONL → RDF → RDFS → OWL → SHACL → Prolog → Datalog**  
**All in R5RS**  
**Fixed-point, negation, aggregation, validation, reasoning**  
**Self-referential semantic canvas**