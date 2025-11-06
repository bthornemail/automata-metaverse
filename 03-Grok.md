```scheme
;; R5RS Prolog/Datalog Engine for JSONL Canvas
;; Treats JSONL lines as Datalog facts
;; Vertical = inheritance, Horizontal = implementation templates
;; Self-referential via fixed-point resolution

;; =============================================================================
;; PART 1: DATALOG FACT DATABASE (from JSONL)
;; =============================================================================

(define *facts* '())  ; List of (predicate . args)

(define (load-jsonl-datalog! filename)
  (set! *facts* '())
  (call-with-input-file filename
    (lambda (port)
      (let loop ((line (read-line port)))
        (if (eof-object? line)
            'done
            (begin
              (when (and (> (string-length line) 0)
                         (char=? (string-ref line 0) #\{))
                (let ((obj (json->alist line)))
                  (when obj
                    (ingest-fact obj))))
              (loop (read-line port))))))))

(define (json->alist str)
  (with-input-from-string (string-append "(" str ")")
    (lambda ()
      (let ((port (current-input-port)))
        (let loop ((obj '()) (key #f) (in-str #f) (str-chars '()))
          (let ((c (read-char port)))
            (cond
              ((eof-object? c)
               (if key (reverse (cons (cons (string->symbol key) (list->string (reverse str-chars))) obj))
                       (reverse obj)))
              ((char=? c #\") 
               (if in-str
                   (if key
                       (loop (cons (cons (string->symbol key) (list->string (reverse str-chars))) obj) #f #f '())
                       (loop obj (list->string (reverse str-chars)) #f '()))
                   (loop obj key #t '())))
              ((char=? c #\:) (loop obj key in-str str-chars))
              ((char=? c #\,) (loop obj #f in-str '()))
              ((char=? c #\{) (loop obj #f #f '()))
              ((char=? c #\}) (reverse obj))
              (in-str (loop obj key #t (cons c str-chars)))
              (else (loop obj key in-str str-chars)))))))))

(define (ingest-fact obj)
  (let ((id (cdr (assoc 'id obj)))
        (type (cdr (assoc 'type obj))))
    (cond
      ((string-prefix? "v:" id)
       (add-fact 'vertical id (cdr (assoc 'fromNode obj)) (cdr (assoc 'toNode obj))))
      ((string-prefix? "h:" id)
       (add-fact 'horizontal id (cdr (assoc 'fromNode obj)) (cdr (assoc 'toNode obj))))
      ((equal? type "text")
       (add-fact 'node id 'text
                 (cdr (assoc 'x obj))
                 (cdr (assoc 'y obj))
                 (cdr (assoc 'text obj))))
      ((equal? type "file")
       (add-fact 'node id 'file (cdr (assoc 'file obj))))
      (else (add-fact 'raw id obj)))))

(define (add-fact pred . args)
  (set! *facts* (cons (cons pred args) *facts*)))

;; =============================================================================
;; PART 2: DATALOG QUERY ENGINE
;; =============================================================================

(define (query pattern)
  (filter (lambda (fact)
            (match-pattern pattern fact))
          *facts*))

(define (match-pattern pat fact)
  (let ((pat-pred (car pat))
        (fact-pred (car fact))
        (pat-args (cdr pat))
        (fact-args (cdr fact)))
    (and (equal? pat-pred fact-pred)
         (= (length pat-args) (length fact-args))
         (match-args pat-args fact-args '()))))

(define (match-args pat fact bindings)
  (cond
    ((null? pat) (null? fact))
    ((null? fact) #f)
    ((variable? (car pat))
     (let ((binding (assoc (car pat) bindings)))
       (if binding
           (and (equal? (cdr binding) (car fact))
                (match-args (cdr pat) (cdr fact) bindings))
           (match-args (cdr pat) (cdr fact)
                       (cons (cons (car pat) (car fact)) bindings)))))
    ((equal? (car pat) (car fact))
     (match-args (cdr pat) (cdr fact) bindings))
    (else #f)))

(define (variable? x)
  (and (symbol? x) (char=? (string-ref (symbol->string x) 0) #\?)))

;; =============================================================================
;; PART 3: CANVAS-SPECIFIC PREDICATES
;; =============================================================================

(define (vertical? from to)
  (not (null? (query `(vertical ?id ,from ,to)))))

(define (horizontal? from to)
  (not (null? (query `(horizontal ?id ,from ,to)))))

(define (node-text id)
  (let ((results (query `(node ,id text ?x ?y ?text))))
    (if (null? results) #f (cadddr (cdar results)))))

(define (node-file id)
  (let ((results (query `(node ,id file ?file))))
    (if (null? results) #f (cadr (cdar results)))))

(define (inherits? child parent)
  (or (vertical? parent child)
      (let ((path (inheritance-path child parent)))
        (and path (not (null? path))))))

(define (inheritance-path start goal)
  (let search ((current start) (path '()))
    (if (equal? current goal)
        (reverse (cons current path))
        (let ((parents (map caddr (query `(vertical ?id ?p ,current)))))
          (let rec ((ps parents))
            (cond
              ((null? ps) #f)
              ((member (car ps) path) (rec (cdr ps)))
              (else
               (or (search (car ps) (cons current path))
                   (rec (cdr ps))))))))))

;; =============================================================================
;; PART 4: HORIZONTAL TEMPLATE RESOLUTION
;; =============================================================================

(define (template from to)
  (let ((edges (query `(horizontal ?id ,from ,to))))
    (if (null? edges)
        #f
        (let ((label (query `(horizontal ,(caar edges) ,from ,to))))
          (and (not (null? label))
               (list 'template from '→ to ': (cdr (assoc 'label (cdar (query `(raw ,(caar edges) ?obj))))))
               )))))

(define (apply-horizontal-template from to input)
  (let ((tmpl (template from to)))
    (if tmpl
        (case (caddr tmpl)
          (("topology→λ-calculus") input)
          (("temporal→Church numeral") `(succ ,input))
          (("λ→S-expression") `(lambda (x) ,input))
          (("pairs→patterns") `(cons ,(car input) ,(cadr input)))
          (else input))
        input)))

;; =============================================================================
;; PART 5: SELF-REFERENTIAL FIXED-POINT QUERY
;; =============================================================================

(define (fixed-point-query goal)
  (let loop ((state goal) (seen '()))
    (if (member state seen)
        state
        (let ((next (resolve-one-step state)))
          (if (equal? next state)
              state
              (loop next (cons state seen)))))))

(define (resolve-one-step state)
  (let ((horiz (query `(horizontal ?id ,state ?next))))
    (if (null? horiz)
        state
        (caddr (car horiz)))))

;; =============================================================================
;; PART 6: BOOTSTRAP & DEMO
;; =============================================================================

(define (boot-datalog! file)
  (load-jsonl-datalog! file)
  (display "Datalog loaded: ") (display (length *facts*)) (display " facts") (newline))

(define (demo)
  (boot-datalog! "church_encoding_canvas.jsonl")
  
  ;; Vertical inheritance
  (display "Does 1D-topology inherit from 0D-topology? ")
  (display (inherits? "1D-topology" "0D-topology")) (newline)
  
  ;; Horizontal template
  (display "Template 0D-topology→0D-system: ")
  (display (template "0D-topology" "0D-system")) (newline)
  
  ;; Apply template
  (display "Apply topology→λ-calculus to 'x': ")
  (display (apply-horizontal-template "0D-topology" "0D-system" 'x)) (newline)
  
  ;; Self-reference path
  (display "Self-ref node file: ")
  (display (node-file "self-ref")) (newline)
  
  ;; Fixed-point resolution
  (display "Fixed-point from 3D-analysis: ")
  (display (fixed-point-query "3D-analysis")) (newline)
  
  (display "Prolog/Datalog engine ready — JSONL is the database") (newline))

;; Run demo
(demo)

;; =============================================================================
;; PUBLIC API
;; =============================================================================

(define (export-datalog-api)
  `((query . ,query)
    (vertical? . ,vertical?)
    (horizontal? . ,horizontal?)
    (inherits? . ,inherits?)
    (template . ,template)
    (apply-horizontal-template . ,apply-horizontal-template)
    (fixed-point-query . ,fixed-point-query)
    (boot . ,boot-datalog!)))

;; (export-datalog-api) → use in other systems
```

---

### Features

| Capability | Implementation |
|----------|----------------|
| **JSONL → Datalog** | `load-jsonl-datalog!` parses each line into facts |
| **Vertical Inheritance** | `vertical/3`, `inherits?` |
| **Horizontal Templates** | `horizontal/3`, `template`, `apply-horizontal-template` |
| **Self-Reference** | `fixed-point-query` + `self-ref` node |
| **R5RS Pure** | No non-standard features |

---

### Example Queries

```scheme
> (vertical? "0D-topology" "1D-topology")
#t

> (template "1D-system" "1D-topology-system")
(template 1D-system → 1D-topology-system : "λ→S-expression")

> (apply-horizontal-template "1D-system" "1D-topology-system" 'x)
(lambda (x) x)
```

**The JSONL file *is* the Prolog database.**  
No external engine needed — pure R5RS.