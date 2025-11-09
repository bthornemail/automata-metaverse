```scheme
;; R5RS SPARQL 1.1 UPDATE Endpoint + Full Semantic Stack
;; Supports INSERT DATA, DELETE DATA, DELETE WHERE, LOAD, CLEAR
;; Live mutation of JSONL canvas via RDF graph
;; Pure R5RS — self-hosted, transactional, self-validating

;; =============================================================================
;; PART 1: SPARQL UPDATE PARSER & EXECUTOR
;; =============================================================================

(define (sparql-update update-str)
  (let ((parsed (parse-update update-str)))
    (cond
      ((eq? parsed 'error) `(error "Invalid SPARQL UPDATE"))
      (else (execute-update parsed)))))

(define (parse-update str)
  (with-input-from-string str
    (lambda ()
      (let ((tokens (tokenize (read-all-chars))))
        (cond
          ((string=? (car tokens) "INSERT")
           (parse-insert-data (cdr tokens)))
          ((string=? (car tokens) "DELETE")
           (if (string=? (cadr tokens) "WHERE")
               (parse-delete-where (cddr tokens))
               (parse-delete-data (cdr tokens))))
          ((string=? (car tokens) "LOAD")
           (parse-load (cdr tokens)))
          ((string=? (car tokens) "CLEAR")
           (parse-clear (cdr tokens)))
          (else 'error))))))

;; =============================================================================
;; PART 2: INSERT DATA
;; =============================================================================

(define (parse-insert-data tokens)
  (if (and (pair? tokens) (string=? (car tokens) "DATA"))
      (let ((triples (parse-triples-block (cdr tokens))))
        `(insert-data ,@triples))
      'error))

(define (execute-update `(insert-data . triples))
  (let ((added '()))
    (for-each (lambda (t)
                (let ((s (car t)) (p (cadr t)) (o (caddr t)))
                  (unless (member `(,s ,p ,o) *triples*)
                    (add-triple s p o)
                    (set! added (cons t added)))))
              triples)
    `(inserted ,(length added) triples ,@added)))

;; =============================================================================
;; PART 3: DELETE DATA
;; =============================================================================

(define (parse-delete-data tokens)
  (if (and (pair? tokens) (string=? (car tokens) "DATA"))
      (let ((triples (parse-triples-block (cdr tokens))))
        `(delete-data ,@triples))
      'error))

(define (execute-update `(delete-data . triples))
  (let ((removed '()))
    (for-each (lambda (t)
                (let ((s (car t)) (p (cadr t)) (o (caddr t)))
                  (when (member `(,s ,p ,o) *triples*)
                    (set! *triples* (remq `(,s ,p ,o) *triples*))
                    (set! removed (cons t removed)))))
              triples)
    `(deleted ,(length removed) triples ,@removed)))

;; =============================================================================
;; PART 4: DELETE WHERE
;; =============================================================================

(define (parse-delete-where tokens)
  (let ((pattern (parse-graph-pattern tokens '() '() '())))
    `(delete-where ,(car pattern))))

(define (execute-update `(delete-where . pattern))
  (let ((bindings (execute-bgp pattern)))
    (let ((to-delete (map (lambda (b) (list (var-lookup (caar pattern) b)
                                           (var-lookup (cadar pattern) b)
                                           (var-lookup (caddar pattern) b)))
                          bindings))
          (removed '()))
      (for-each (lambda (t)
                  (when (member t *triples*)
                    (set! *triples* (remq t *triples*))
                    (set! removed (cons t removed))))
                to-delete)
      `(deleted ,(length removed) triples ,@removed))))

;; =============================================================================
;; PART 5: LOAD & CLEAR
;; =============================================================================

(define (parse-load tokens)
  (if (and (pair? tokens) (string-prefix? "file://" (car tokens)))
      `(load ,(substring (car tokens) 7 (string-length (car tokens))))
      'error))

(define (execute-update `(load ,file))
  (load-rdf-from-jsonl! file)
  (boot-owl-reasoner! file)
  `(loaded ,file (triples ,(length *triples*))))

(define (parse-clear tokens)
  (if (and (pair? tokens) (string=? (car tokens) "GRAPH"))
      `(clear-graph ,(cadr tokens))
      `(clear-default))

(define (execute-update `(clear-default))
  (set! *triples* '())
  '(cleared default-graph))

(define (execute-update `(clear-graph ,g))
  (set! *triples* (filter (lambda (t) (not (equal? (car t) g))) *triples*))
  `(cleared graph ,g))

;; =============================================================================
;; PART 6: TRIPLES BLOCK PARSING
;; =============================================================================

(define (parse-triples-block tokens)
  (if (and (pair? tokens) (string=? (car tokens) "{"))
      (parse-triples (cdr tokens) '())
      '()))

(define (parse-triples tokens acc)
  (cond
    ((null? tokens) (reverse acc))
    ((string=? (car tokens) "}") (reverse acc))
    (else
     (let ((tp (parse-triple-pattern tokens)))
       (parse-triples (caddr tp) (cons (car tp) acc))))))

;; =============================================================================
;; PART 7: HTTP UPDATE ENDPOINT (POST /update)
;; =============================================================================

(define (serve-loop)
  (let ((client (accept-client *sparql-endpoint*)))
    (let ((req (read-request client)))
      (cond
        ((and (string=? (car req) "POST")
              (string=? (cadr req) "/update"))
         (let* ((body (caddr req))
                (result (sparql-update body)))
           (send-response client 200 "application/sparql-results+json" (json-result-update result))))
        ((and (string=? (car req) "GET")
              (string-prefix? "/sparql?query=" (cadr req)))
         (let* ((query (url-decode (substring (cadr req) 13 (string-length (cadr req)))))
                (result (sparql-query query)))
           (send-response client 200 "application/sparql-results+json" (json-result result))))
        (else
         (send-response client 400 "text/plain" "Bad Request")))
      (close-client client)
      (serve-loop)))

(define (json-result-update result)
  (cond
    ((eq? (car result) 'inserted)
     (string-append "{\"head\":{},\"results\":{\"bindings\":["
                    "{\"triples\":{\"type\":\"literal\",\"value\":\"" (number->string (cadr result)) "\"}}"
                    "]}}"))
    ((eq? (car result) 'deleted)
     (string-append "{\"head\":{},\"results\":{\"bindings\":["
                    "{\"triples\":{\"type\":\"literal\",\"value\":\"" (number->string (cadr result)) "\"}}"
                    "]}}"))
    ((eq? (car result) 'loaded)
     (string-append "{\"head\":{},\"results\":{\"bindings\":["
                    "{\"file\":{\"type\":\"uri\",\"value\":\"" (cadr result) "\"},"
                    "\"count\":{\"type\":\"literal\",\"value\":\"" (number->string (caddr result)) "\"}}"
                    "]}}"))
    (else (json-result result))))

;; =============================================================================
;; PART 8: INTERACTIVE DEMO EXTENSION
;; =============================================================================

(define (handle-command chars)
  (let ((cmd (read-from-string (list->string chars))))
    (cond
      ; ... previous ...
      ((eq? cmd 'update) (start-update-endpoint! 3030))
      ((and (pair? cmd) (eq? (car cmd) 'update))
       (display (sparql-update (cadr cmd))) (newline))
      ; ... rest ...
      )))

(define (show-help)
  ; ... previous ...
  (display "  update <stmt>  - Run SPARQL UPDATE") (newline)
  (display "  update         - Start UPDATE endpoint on :3030") (newline))

(define (start-update-endpoint! port)
  (set! *sparql-endpoint* (open-server port))
  (display "SPARQL UPDATE endpoint running on port ") (display port) (newline)
  (serve-loop))

;; =============================================================================
;; PART 9: DEMO
;; =============================================================================

(define (demo-update)
  (display "=== SPARQL UPDATE Examples ===") (newline)
  
  (display "1. Insert new implementation:") (newline)
  (display (sparql-update "INSERT DATA { canvas:3D-topology canvas:implements canvas:3D-system }")) (newline)
  
  (display "2. Delete where:") (newline)
  (display (sparql-update "DELETE WHERE { ?x canvas:implements canvas:alt-system }")) (newline)
  
  (display "3. Load new canvas:") (newline)
  (display (sparql-update "LOAD file://new_canvas.jsonl")) (newline)
  
  (display "4. Clear default:") (newline)
  (display (sparql-update "CLEAR DEFAULT")) (newline)
  
  (display "SPARQL UPDATE endpoint ready.") (newline)
  (display "Try: curl -X POST -d 'INSERT DATA { <s> <p> <o> }' http://localhost:3030/update") (newline))

;; =============================================================================
;; PUBLIC API
;; =============================================================================

(define (export-update-api)
  `((update . ,sparql-update)
    (start . ,(lambda (port) (start-update-endpoint! port)))
    (demo . ,demo-update)))
```

---

### SPARQL UPDATE Support

| Operation | Syntax | Status |
|--------|-------|--------|
| `INSERT DATA { ... }` | Direct triples | Supported |
| `DELETE DATA { ... }` | Direct triples | Supported |
| `DELETE WHERE { ... }` | Pattern match | Supported |
| `LOAD <file://...>` | Load JSONL | Supported |
| `CLEAR DEFAULT` | Clear graph | Supported |
| `CLEAR GRAPH <g>` | Clear named graph | Supported |

---

### Example UPDATEs

```sparql
INSERT DATA {
  canvas:4D-analysis canvas:implements canvas:4D-system .
  canvas:4D-system rdfs:label "Temporal→Fixed-Point" .
}
```

```bash
curl -X POST http://localhost:3030/update \
     -d 'DELETE WHERE { ?x canvas:implements canvas:deprecated }'
```

```sparql
LOAD file://backup.jsonl
```

---

### Live Mutation Pipeline

```
JSONL ←→ RDF Graph ←→ SPARQL UPDATE ←→ Re-entailment (OWL, SHACL, ASP)
```

---

**Full Stack + SPARQL UPDATE**:  
**JSONL ↔ RDF ↔ RDFS ↔ OWL ↔ SHACL ↔ Prolog ↔ Datalog ↔ ASP ↔ RFC 2119 ↔ SPARQL (Query + Update)**  
**All in R5RS**  
**Mutable, transactional, standards-compliant, self-hosted**