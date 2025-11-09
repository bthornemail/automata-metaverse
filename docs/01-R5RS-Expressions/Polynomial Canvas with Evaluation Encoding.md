```scheme
;; Unified R5RS Implementation: Polynomial Canvas with Evaluation Encoding
;;
;; This combines:
;; 1. Polynomial type encoding and canvas generation from "Extended JSON Canvas Spec"
;; 2. M-Expression evaluation strategies and trace compilation from "M-EXPRESSIONS AS EVALUATION ENCODING"
;;
;; Key Unifications:
;; - Expressions are analyzed for polynomial types (monad/functor/perceptron)
;; - Evaluation strategies are defined as M-expressions (as data)
;; - Evaluation produces S-expression traces integrated into canvas metadata
;; - Z-Field extended with evaluation combinators (Y/Z for fixed-points in evaluation)
;; - Perceptron transitions include evaluation rules as weights
;; - Full program → Canvas JSON with embedded evaluation traces
;;
;; R5RS Compliant: Uses only standard R5RS features + match (for simplicity; can be replaced with cond)

;; Helper: Pattern matching macro (R5RS compatible version)
(define-syntax match
  (syntax-rules ()
    ((_ expr clause ...) (apply (lambda (e) (cond clause ... (else #f))) (list expr)))))

;; PART 1: Polynomial Type Encoding (from first document)

;; 8-Type Polynomial Basis (collapsed as per insight: port→procedure)
(define (type-vector expr)
  (match expr
    ((? boolean?)   '#(1 0 0 0 0 0 0 0))  ; boolean
    ((? pair?)      '#(0 1 0 0 0 0 0 0))  ; pair
    ((? symbol?)    '#(0 0 1 0 0 0 0 0))  ; symbol
    ((? number?)    '#(0 0 0 1 0 0 0 0))  ; number
    ((? char?)      '#(0 0 0 0 1 0 0 0))  ; char
    ((? string?)    '#(0 0 0 0 0 1 0 0))  ; string
    ((? vector?)    '#(0 0 0 0 0 0 1 0))  ; vector
    ((? procedure?) '#(0 0 0 0 0 0 0 1))  ; procedure/port
    (else           '#(0 0 0 0 0 0 0 0)))) ; unknown → zero

;; Polynomial addition
(define (poly-add v1 v2)
  (let ((len (vector-length v1)))
    (let loop ((i 0) (result (make-vector len 0)))
      (if (= i len)
          result
          (begin
            (vector-set! result i (+ (vector-ref v1 i) (vector-ref v2 i)))
            (loop (+ i 1) result))))))

;; AST complexity (simple depth/count for functor; extend as needed)
(define (ast-complexity expr)
  (cond
    ((pair? expr) (poly-add (type-vector expr)
                            (poly-add (ast-complexity (car expr))
                                      (ast-complexity (cdr expr)))))
    (else (type-vector expr))))

;; Network weights (perceptron; heuristic: triple functor for connections)
(define (network-weights expr)
  (let ((functor (ast-complexity expr)))
    (poly-add functor (poly-add functor functor))))  ; x3 for network density

;; Access pattern (Church numeral evens)
(define (access-pattern expr)
  "0-2-4-6-8-10-12-14")  ; Fixed for now; dynamize based on expr depth

;; Evaluation depth as Church numeral
(define (evaluation-depth expr)
  "church-4")  ; Placeholder; compute actual recursion depth

;; Combinators (as lists for JSON)
(define (y-combinator expr) '("Y" "(λf.(λx.f(x x))(λx.f(x x)))"))
(define (z-combinator expr) '("Z" "(λf.(λx.f(λv.x x v))(λx.f(λv.x x v)))"))
(define (m-combinator expr) '("M" "(define M (λf.(f f)))"))
(define (s-combinator expr) '("S" "(λx.(λy.(λz.(x z)(y z))))"))

;; PART 2: M-Expression Evaluation Encoding (from second document)

;; M-Expressions as S-Expression data (lists with 'm- tag)
(define (m-expr? x) (and (pair? x) (eq? (car x) 'm-)))

;; Define evaluation strategy as M-expression data
(define (define-strategy name rules)
  `(m-strategy ,name ,rules))

;; Example strategies
(define normal-order
  (define-strategy
   "normal-order"
   '((m-rule "β" (m-app (m-lambda (m-var X) (m-var M)) (m-var N))
             (m-subst (m-var M) (m-var X) (m-var N)))
     (m-rule "if-true" (m-if (m-true) (m-var M) (m-var N)) (m-var M))
     (m-rule "if-false" (m-if (m-false) (m-var M) (m-var N)) (m-var N)))))

(define applicative-order
  (define-strategy
   "applicative-order"
   '((m-rule "β" (m-app (m-lambda (m-var X) (m-var M)) (m-var V))
             (m-subst (m-var M) (m-var X) (m-var V))))))

;; Environment operations
(define (extend-env env var val)
  (cons (cons var val) env))

(define (lookup-env env var)
  (let loop ((e env))
    (if (null? e)
        (error "Unbound variable")
        (if (eq? var (caar e))
            (cdar e)
            (loop (cdr e))))))

;; Substitution
(define (subst expr var val)
  (match expr
    ((? symbol? y) (if (eq? var y) val y))
    ((lambda (? symbol? y) m)
     (if (eq? var y)
         `(lambda (,y) ,m)
         `(lambda (,y) ,(subst m var val))))
    ((? pair?) `(,(subst (car expr) var val) ,(subst (cdr expr) var val)))
    (else expr)))

;; Evaluation monad simulation (simple state for env + trace)
(define (eval-monad-unit val) `(value ,val))
(define (eval-monad-bind ma f)
  (match ma
    ((value a) (f a))))

;; Simple evaluator with tracing
(define (evaluate expr env strategy trace?)
  (let loop ((e expr) (env env) (trace '()) (kont (lambda (v) v)))
    (let ((step (list 'step (length trace) 'expr e 'env env)))
      (let ((result
             (match e
               ((? number? n) n)
               ((? symbol? x) (lookup-env env x))
               ((lambda params body)
                (lambda args
                  (loop body (fold-right extend-env env params args) trace kont)))
               ((if cond then else)
                (if (loop cond env trace kont)
                    (loop then env trace kont)
                    (loop else env trace kont)))
               ((? pair? (op . args))
                (let ((fun (loop op env trace kont))
                      (evaled-args (map (lambda (a) (loop a env trace kont)) args)))
                  (apply fun evaled-args)))
               (else (error "Invalid expression")))))
        (let ((new-trace (if trace? (cons (append step (list 'result result)) trace) trace)))
          (kont result)
          (reverse new-trace))))))  ; Return trace

;; Compile M-strategy to evaluator (simplified: use applicative by default)
(define (compile-strategy m-strat)
  (match m-strat
    ((m-strategy "applicative-order" rules) evaluate)  ; Returns evaluator function
    (else evaluate)))  ; Default

;; Compile evaluation to S-trace
(define (compile-evaluation m-eval)
  (match m-eval
    ((m-evaluation expr strategy env tracing)
     (let ((evaluator (compile-strategy strategy)))
       (evaluator expr env #t)))))  ; Run with trace

;; PART 3: Unified Canvas Generation with Evaluation

;; Expr → Canvas Node (integrates poly + z + evaluation metadata)
(define (expr->canvas-node expr id x y strategy)
  (let* ((monad (type-vector expr))
         (functor (poly-add monad (ast-complexity expr)))
         (perceptron (poly-add functor (network-weights expr)))
         (eval-m `(m-evaluation ,expr ,strategy global-env full-trace))
         (eval-trace (compile-evaluation eval-m)))
    `((id . ,id)
      (type . "text")
      (x . ,x)
      (y . ,y)
      (width . 200)
      (height . 150)
      (text . ,(format "~s" expr))  ; Use write for text
      (metadata .
       ((r5rs-poly .
         ((monad . ,(vector->list monad))
          (functor . ,(vector->list functor))
          (perceptron . ,(vector->list perceptron))))
        (z .
         ((access . ,(access-pattern expr))
          (interval . ,(evaluation-depth expr))
          (top . ,(y-combinator expr))
          (right . ,(z-combinator expr))
          (bottom . ,(m-combinator expr))
          (left . ,(s-combinator expr))))
        (evaluation .
         ((strategy . ,(cadr strategy))  ; Name
          (trace . ,eval-trace)))))))))

;; Program → Transitions (edges with perceptron-evaluation transforms)
(define (program->transitions program)
  (let loop ((p program) (i 1) (edges '()))
    (if (null? (cdr p))
        (reverse edges)
        (loop (cdr p) (+ i 1)
              (cons `((id . ,(string-append "edge-" (number->string i)))
                      (fromNode . ,(string-append "node-" (number->string i)))
                      (fromSide . "right")
                      (toNode . ,(string-append "node-" (number->string (+ i 1))))
                      (toSide . "left")
                      (metadata .
                       ((transform .
                         ((type . "perceptron-transition")
                          (input-types . ("symbol" "number" "procedure"))
                          (output-types . ("number" "procedure" "boolean"))
                          (weights .
                           ((symbol→number . "church-1")
                            (number→procedure . "church-2")
                            (procedure→boolean . "church-0")))
                          (evaluation-rule . "β-reduction"))))))  ; Add eval rule
                    edges)))))

;; Program → Unified Polynomial-Evaluation Canvas
(define (program->unified-canvas program strategy)
  (let ((nodes (let loop ((p program) (i 1) (ns '()))
                 (if (null? p)
                     (reverse ns)
                     (loop (cdr p) (+ i 1)
                           (cons (expr->canvas-node (car p) (string-append "node-" (number->string i))
                                                    (* i 250) 100 strategy)
                                 ns))))))
    `((nodes . ,nodes)
      (edges . ,(program->transitions program)))))

;; Example Usage: Factorial Program
(define factorial-program
  '((define factorial
      (lambda (n)
        (if (= n 0) 1
            (* n (factorial (- n 1))))))
    (factorial 5)))

(define unified-canvas
  (program->unified-canvas factorial-program applicative-order))

;; Output JSON (simulated print; in real use, convert to string)
(display unified-canvas)
(newline)

;; Key Insights in Unified System:
;; 1. Polynomial views now include evaluation traces in metadata
;; 2. Edges carry evaluation rules as part of perceptron weights
;; 3. Strategies are first-class M-expressions, compiled on-the-fly
;; 4. Full audit: Canvas visualizes program + how it's evaluated
;; 5. Extensible: Add more strategies, refine polys, integrate monads
```