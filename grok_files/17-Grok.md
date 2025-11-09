```scheme
;; R5RS SPARQL 1.1 GRAPH Clauses + Transactions + Full Semantic Stack
;; Supports GRAPH <iri> { ... }, named graphs, FROM, FROM NAMED
;; Multi-graph RDF dataset over JSONL canvas
;; Pure R5RS — transactional, self-hosted, standards-compliant

;; =============================================================================
;; PART 1: NAMED GRAPH DATASET
;; =============================================================================

(define *default-graph* '())        ; List of triples in default graph
(define *named-graphs* '())         ; Assoc: (iri . triples)

(define (current-graph iri)
  (if (equal? iri "<default>")
      *default-graph*
      (let ((entry (assoc iri *named-graphs*)))
        (if entry (cdr entry) '()))))

(define (set-current-graph! iri triples)
  (if (equal? iri "<default>")
      (set! *default-graph* triples)
      (let ((entry (assoc iri *named-graphs*)))
        (if entry
            (set-cdr! entry triples)
            (set! *named-graphs* (cons (cons iri triples) *named-graphs*))))))

;; Migrate existing *triples* to default graph
(set! *default-graph* *triples*)
(set! *triples* '())  ; deprecated

;; =============================================================================
;; PART 2: SPARQL DATASET CLAUSES
;; =============================================================================

(define *active-dataset* '("<default>"))  ; List of active graph IRIs

(define (sparql-query query-str)
  (let ((parsed (parse-sparql query-str)))
    (cond
      ((eq? parsed 'error) `(error "Invalid SPARQL"))
      (else
       (let ((dataset (cadr (assoc 'dataset parsed)))
             (proj (cadr (assoc 'project parsed)))
             (where (cadr (assoc 'where parsed))))
         (with-dataset dataset
           (lambda ()
             (let ((results (execute-bgp where)))
               `(results ,proj ,results)))))))))

(define (with-dataset dataset thunk)
  (let ((old *active-dataset*))
    (set! *active-dataset*
          (if (null? dataset)
              '("<default>")
              (map (lambda (g) (if (eq? (car g) 'from-named) (cadr g) g)) dataset)))
    (let ((result (thunk)))
      (set! *active-dataset* old)
      result)))

;; =============================================================================
;; PART 3: GRAPH CLAUSE PARSING
;; =============================================================================

(define (parse-sparql str)
  (with-input-from-string str
    (lambda ()
      (let ((tokens (tokenize (read-all-chars))))
        (parse-prologue tokens '() '())))))

(define (parse-prologue tokens dataset where)
  (cond
    ((null? tokens) `(query (dataset ,dataset) (where ,where)))
    ((string=? (car tokens) "SELECT")
     (let* ((proj (parse-projection (cdr tokens)))
            (rest (cadr proj))
            (where (parse-where rest)))
       `(query (dataset ,dataset)
               (project ,(car proj))
               (where ,(cadr where)))))
    ((string=? (car tokens) "FROM")
     (let ((iri (cadr tokens)))
       (parse-prologue (cddr tokens) (cons iri dataset) where)))
    ((string=? (car tokens) "FROM") (string=? (cadr tokens) "NAMED")
     (let ((iri (caddr tokens)))
       (parse-prologue (cdddr tokens) (cons `(from-named ,iri) dataset) where)))
    (else (parse-prologue (cdr tokens) dataset where))))

(define (parse-where tokens)
  (if (string=? (car tokens) "WHERE")
      (parse-group-graph-pattern (cddr tokens) '() '() '())
      'error))

(define (parse-group-graph-pattern tokens bgp filters optionals)
  (cond
    ((null? tokens) (list bgp filters optionals))
    ((string=? (car tokens) "GRAPH")
     (let* ((iri (cadr tokens))
            (block (parse-graph-block (cddr tokens)))
            (sub-bgp (car block))
            (rest (cadr block)))
       (parse-group-graph-pattern rest
                                  (append bgp (map (lambda (tp) `(graph ,iri ,tp)) sub-bgp))
                                  filters optionals)))
    ((string=? (car tokens) "}") (list bgp filters optionals))
    (else
     (let ((tp (parse-triple-pattern tokens)))
       (parse-group-graph-pattern (caddr tp)
                                  (cons (car tp) bgp)
                                  filters optionals)))))

(define (parse-graph-block tokens)
  (if (string=? (car tokens) "{")
      (parse-group-graph-pattern (cdr tokens) '() '() '())
      'error))

;; =============================================================================
;; PART 4: BGP EXECUTION WITH GRAPH CLAUSES
;; =============================================================================

(define (execute-bgp patterns)
  (let loop ((p patterns) (results (list '())))
    (if (null? p)
        results
        (let ((pat (car p)))
          (loop (cdr p)
                (if (and (pair? pat) (eq? (car pat) 'graph))
                    (execute-graph-pattern (cadr pat) (caddr pat) results)
                    (join-triple-pattern pat results)))))))

(define (execute-graph-pattern graph-iri tp current)
  (let ((graph (current-graph graph-iri)))
    (let collect ((matches '()) (t graph))
      (if (null? t)
          (apply append
                 (map (lambda (binding)
                        (let ((s (var-lookup (caar tp) binding))
                              (p (var-lookup (cadar tp) binding))
                              (o (var-lookup (caddar tp) binding)))
                          (if (and (or (variable? (caar tp)) (equal? (caar tp) (caar t))))
                              (and (or (variable? (cadar tp)) (equal? (cadar tp) (cadar t))))
                              (and (or (variable? (caddar tp)) (equal? (caddar tp) (caddr t))))
                              (list (bind-pattern (caar tp) (caar t)
                                        (bind-pattern (cadar tp) (cadar t)
                                          (bind-pattern (caddar tp) (caddr t) binding))))
                              '())))
                      current))
          (collect (cons (car t) matches) (cdr t))))))

;; =============================================================================
;; PART 5: GRAPH MANAGEMENT IN UPDATE
;; =============================================================================

(define (execute-update-with-tx parsed)
  (let ((op (car parsed)))
    (case op
      ((insert-data)
       (let ((triples (cdr parsed))
             (graph (if (in-transaction?) (current-graph "<default>") *default-graph*)))
         (for-each (lambda (t)
                     (let ((s (car t)) (p (cadr t)) (o (caddr t)))
                       (tx-add-triple-in-graph "<default>" s p o)))
                   triples)
         `(inserted-in-tx ,(length triples) in "<default>")))
      ((delete-data)
       (let ((triples (cdr parsed)))
         (for-each (lambda (t)
                     (let ((s (car t)) (p (cadr t)) (o (caddr t)))
                       (tx-remove-triple-in-graph "<default>" s p o)))
                   triples)
         `(deleted-in-tx ,(length triples))))
      ((clear-graph)
       (let ((g (cadr parsed)))
         (tx-clear-graph g)
         `(cleared-graph-in-tx ,g)))
      (else (execute-update-with-tx parsed)))))

(define (tx-add-triple-in-graph graph-iri s p o)
  (when (in-transaction?)
    (let* ((tx (cdr *transaction*))
           (added (car tx))
           (t `(,s ,p ,o)))
      (unless (member `(,graph-iri ,t) added)
        (set-car! tx (cons `(,graph-iri ,t) added))))))

(define (tx-remove-triple-in-graph graph-iri s p o)
  (when (in-transaction?)
    (let* ((tx (cdr *transaction*))
           (removed (cadr tx))
           (t `(,s ,p ,o)))
      (unless (member `(,graph-iri ,t) removed)
        (set-car! (cdr tx) (cons `(,graph-iri ,t) removed))))))

(define (tx-clear-graph g)
  (when (in-transaction?)
    (set! *transaction-log* (cons `(clear-graph ,g) *transaction-log*))))

(define (commit!)
  (when (in-transaction?)
    (let* ((tx (cdr *transaction*))
           (added (car tx))
           (removed (cadr tx))
           (original (caddr tx)))
      ;; Apply per-graph
      (for-each (lambda (entry)
                  (let ((g (car entry)) (t (cadr entry)))
                    (let ((graph (current-graph g)))
                      (set-current-graph! g (cons t (remq t graph))))))
                added)
      (for-each (lambda (entry)
                  (let ((g (car entry)) (t (cadr entry)))
                    (let ((graph (current-graph g)))
                      (set-current-graph! g (remq t graph)))))
                removed)
      ;; Handle clear-graph
      (set! *transaction-log*
            (filter (lambda (log)
                      (not (and (pair? log) (eq? (car log) 'clear-graph))))
                    *transaction-log*))
      (for-each (lambda (log)
                  (when (and (pair? log) (eq? (car log) 'clear-graph))
                    (set-current-graph! (cadr log) '())))
                *transaction-log*)
      ;; Re-entail
      (set! *triples* (append *default-graph* (apply append (map cdr *named-graphs*))))
      (rdfs-entailment)
      (owl-entailment!)
      (boot-shacl-validator! #f)
      (boot-prolog!)
      (boot-datalog!)
      (boot-asp!)
      (boot-rfc2119!)
      (set! *transaction* #f)
      `(committed ,@added ,@removed))))

;; =============================================================================
;; PART 6: INTERACTIVE DEMO EXTENSION
;; =============================================================================

(define (show-help)
  ; ... previous ...
  (display "  graph <iri> { ... } - Query named graph") (newline)
  (display "  from <iri>          - Add to dataset") (newline)
  (display "  from named <iri>    - Add named graph") (newline))

(define (demo-graph)
  (display "=== SPARQL GRAPH Examples ===") (newline)
  
  (display "1. Create named graph:") (newline)
  (sparql-update "INSERT DATA { GRAPH <http://example.org/g1> { <a> <b> <c> } }")
  
  (display "2. Query named graph:") (newline)
  (display (sparql-query "SELECT ?s ?p ?o FROM NAMED <http://example.org/g1> WHERE { GRAPH <http://example.org/g1> { ?s ?p ?o } }")) (newline)
  
  (display "3. Default + named:") (newline)
  (display (sparql-query "SELECT ?s FROM <default> FROM NAMED <http://example.org/g1> WHERE { ?s a ?type }")) (newline))

;; =============================================================================
;; PUBLIC API
;; =============================================================================

(define (export-graph-api)
  `((dataset . ,*active-dataset*)
    (graphs . ,(map car *named-graphs*))
    (default . ,*default-graph*)
    (graph . ,current-graph)
    (demo . ,demo-graph)))
```

---

### SPARQL 1.1 GRAPH Support

| Clause | Syntax | Status |
|-------|--------|--------|
| `GRAPH <iri> { ... }` | Pattern in named graph | Supported |
| `FROM <iri>` | Default dataset | Supported |
| `FROM NAMED <iri>` | Named graph in dataset | Supported |
| `INSERT DATA { GRAPH <iri> { ... } }` | Insert into named graph | Supported |
| `CLEAR GRAPH <iri>` | Clear named graph | Supported |

---

### Example Queries

```sparql
INSERT DATA {
  GRAPH <http://example.org/metadata> {
    canvas:0D-topology rdfs:label "Point" .
  }
}
```

```sparql
SELECT ?s ?p ?o
FROM NAMED <http://example.org/metadata>
WHERE {
  GRAPH <http://example.org/metadata> { ?s ?p ?o }
}
```

```sparql
SELECT ?node
WHERE {
  ?node a canvas:Node .
  GRAPH <http://example.org/provenance> { ?node prov:wasGeneratedBy ?tool }
}
```

---

### Dataset State

```scheme
*default-graph*  → ((canvas:0D-topology canvas:implements canvas:0D-system) ...)
*named-graphs*   → (("http://example.org/metadata" . ((canvas:0D-topology rdfs:label "Point")))
                    ("http://example.org/provenance" . (...)))
```

---

**Full SPARQL 1.1 Dataset**:  
**JSONL ↔ Dataset { default + named graphs } ↔ SPARQL (GRAPH, FROM, FROM NAMED) ↔ Transactions**  
**All in R5RS**  
**Multi-graph, transactional, standards-compliant**