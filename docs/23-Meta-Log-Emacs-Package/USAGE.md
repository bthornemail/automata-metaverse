# Usage Guide - Meta-Log Emacs Package

## Quick Start

### Initialization

```elisp
;; Initialize meta-log (run once per session)
(meta-log-initialize)
```

### Your First Query

```elisp
;; Ask a natural language question
(meta-log-ask "What is the factorial of 5?")
;; => "The factorial of 5 is 120"
```

## Natural Language Interface

### Asking Questions

```elisp
;; Mathematical queries
(meta-log-ask "What is 2 + 2?")
(meta-log-ask "Calculate the sum of 1, 2, and 3")
(meta-log-ask "What is the factorial of 10?")

;; Logic queries
(meta-log-ask "Who are the parents of mary?")
(meta-log-ask "Show me all ancestors of susan")
(meta-log-ask "List all defined predicates")

;; System queries
(meta-log-ask "What engines are available?")
(meta-log-ask "Show federation status")
(meta-log-ask "How many facts are loaded?")
```

### Interactive Usage

```elisp
;; Interactive prompt
M-x meta-log-ask
;; Minibuffer prompts: "What would you like to know? "
;; Type your question and press RET
```

## Prolog Engine

### Basic Queries

```elisp
;; Simple fact query
(meta-log-prolog-query "parent(john, X)")
;; => ((X . mary))

;; Multiple solutions
(meta-log-prolog-query "parent(X, Y)")
;; => ((X . john Y . mary) (X . mary Y . susan))

;; With multiple variables
(meta-log-prolog-query "ancestor(X, susan)")
;; => ((X . mary) (X . john))
```

### Adding Facts

```elisp
;; Add facts dynamically
(meta-log-prolog-assert "parent(tom, bob)")
(meta-log-prolog-assert "parent(bob, ann)")

;; Query new facts
(meta-log-prolog-query "parent(tom, X)")
;; => ((X . bob))
```

### Defining Rules

```elisp
;; Add a rule
(meta-log-prolog-assert
  "ancestor(X, Y) :- parent(X, Y)")

(meta-log-prolog-assert
  "ancestor(X, Z) :- parent(X, Y), ancestor(Y, Z)")

;; Use the rule
(meta-log-prolog-query "ancestor(tom, X)")
;; => ((X . bob) (X . ann))
```

### List Operations

```elisp
;; Member predicate
(meta-log-prolog-query "member(X, [1,2,3])")
;; => ((X . 1) (X . 2) (X . 3))

;; Append predicate
(meta-log-prolog-query "append([1,2], [3,4], X)")
;; => ((X . [1 2 3 4]))

;; Length predicate
(meta-log-prolog-query "length([a,b,c], N)")
;; => ((N . 3))
```

## Datalog Engine

### Basic Queries

```elisp
;; Simple query
(meta-log-datalog-query "parent(?X, ?Y)")
;; => (((X . john) (Y . mary))
;;     ((X . mary) (Y . susan)))

;; With constants
(meta-log-datalog-query "parent(john, ?Y)")
;; => (((Y . mary)))
```

### Rules and Recursion

```elisp
;; Define recursive rule
(meta-log-datalog-add-rule
  "ancestor(?X, ?Y) :- parent(?X, ?Y)")

(meta-log-datalog-add-rule
  "ancestor(?X, ?Z) :- parent(?X, ?Y), ancestor(?Y, ?Z)")

;; Query transitive closure
(meta-log-datalog-query "ancestor(?X, susan)")
;; => (((X . mary)) ((X . john)))
```

### Extracting Facts from Org Files

```elisp
;; Load facts from an Org file
(meta-log-datalog-load-org-file "~/org/facts.org")

;; Facts are automatically extracted from:
;; - Property drawers
;; - Datalog code blocks
;; - Structured data
```

## R5RS Scheme Engine

### Basic Evaluation

```elisp
;; Arithmetic
(meta-log-r5rs-eval "(+ 1 2 3)")
;; => 6

;; Function definition
(meta-log-r5rs-eval
  "(define (square x) (* x x))")

(meta-log-r5rs-eval "(square 5)")
;; => 25
```

### Church Encoding

```elisp
;; Church numerals
(meta-log-r5rs-eval
  "(define zero (lambda (f) (lambda (x) x)))")

(meta-log-r5rs-eval
  "(define (succ n) (lambda (f) (lambda (x) (f ((n f) x)))))")

;; Use Church numerals
(meta-log-r5rs-call "church-to-int" 'three)
;; => 3
```

### Blackboard Integration

```elisp
;; Store value on blackboard
(meta-log-r5rs-blackboard-set "counter" 0)

;; Retrieve value
(meta-log-r5rs-blackboard-get "counter")
;; => 0

;; Increment
(meta-log-r5rs-blackboard-update "counter"
  (lambda (x) (+ x 1)))
```

## M-Expression Parser

### Basic M-Expressions

```elisp
;; Simple expression
(meta-log-m-expr-eval "2 + 2")
;; => 4

;; Function definition
(meta-log-m-expr-eval
  "define factorial = lambda n.
     if n <= 1 then 1
     else n * factorial(n - 1)")

;; Function call
(meta-log-m-expr-eval "factorial(5)")
;; => 120
```

### M-Expression Syntax

```
Expression   ::= Number | Symbol | Application | Lambda | Let
Application  ::= Expression '(' Arguments ')'
Lambda       ::= 'lambda' Parameters '.' Expression
Let          ::= 'let' Bindings 'in' Expression
Bindings     ::= Symbol '=' Expression [',' Bindings]
```

## Org Mode Integration

### Creating an Automaton File

Create `automaton.org`:

```org
#+TITLE: My Automaton
#+CANVASL_VERSION: 1.0
#+CANVASL_DIMENSION: 2D

* Facts
:PROPERTIES:
:CANVASL_CID: facts-001
:END:

#+BEGIN_SRC meta-log-prolog
parent(john, mary).
parent(mary, susan).
parent(tom, bob).
#+END_SRC

* Rules
#+BEGIN_SRC meta-log-datalog
ancestor(?X, ?Y) :- parent(?X, ?Y).
ancestor(?X, ?Z) :- parent(?X, ?Y), ancestor(?Y, ?Z).
#+END_SRC

* Queries
#+BEGIN_SRC meta-log-prolog :results output
?- ancestor(X, susan).
#+END_SRC

* R5RS Code
#+BEGIN_SRC meta-log-r5rs :results value
(define (factorial n)
  (if (<= n 1) 1
      (* n (factorial (- n 1)))))

(factorial 5)
#+END_SRC
```

### Executing Code Blocks

Place cursor on a code block and press:
- `C-c C-c` - Execute block
- `C-c C-v C-b` - Execute all blocks in buffer
- `C-c C-v C-s` - Execute subtree blocks

### Extracting Facts

```elisp
;; Load all Org files in directory
(meta-log-org-load-directory "~/org/automatons/")

;; Extract facts from current buffer
(meta-log-org-extract-facts)

;; Query extracted facts
(meta-log-datalog-query "fact(?Predicate, ?Args)")
```

## Federation Features

### Initializing Federation

```elisp
(require 'meta-log-federation)
(require 'meta-log-mqtt)

;; Configure MQTT broker
(setq meta-log-mqtt-broker "localhost")
(setq meta-log-mqtt-port 1883)

;; Initialize federation
(meta-log-federation-init)
```

### Discovering Peers

```elisp
;; Discover active peers
(meta-log-federation-discover-peers)
;; => ("peer-abc123" "peer-def456" "peer-ghi789")

;; Get peer info
(meta-log-federation-peer-info "peer-abc123")
;; => ((:peer-id . "peer-abc123")
;;     (:public-key . "04a1b2...")
;;     (:endpoints . ("mqtt://localhost:1883")))
```

### Querying Federation

```elisp
;; Query all peers
(require 'meta-log-collective-intelligence)

(meta-log-collective-intelligence-query
  "template(?Id, ?Name, ?Dimension)")

;; Results include:
;; - :result - The aggregated result
;; - :consensus - Consensus score (0.0-1.0)
;; - :sources - List of peer IDs that provided the result
;; - :total-peers - Total peers queried
```

### Publishing Knowledge

```elisp
;; Publish fact to federation
(meta-log-federation-publish-fact
  '("parent" "alice" "bob"))

;; Publish template
(meta-log-template-federation-publish template)
```

## Template Discovery

### Discovering Templates

```elisp
(require 'meta-log-template-discovery)

;; Discover by natural language
(meta-log-discover-template
  "I need a 2D canvas with circle and rectangle drawing")

;; Returns list of templates:
;; - From local Org files
;; - From federated peers
;; - Generated templates with Canvas API mappings
```

### Using Discovered Templates

```elisp
;; Get template
(let ((templates (meta-log-discover-template "2D drawing canvas")))
  (let ((best-template (car templates)))
    ;; Save template to file
    (meta-log-template-discovery-save-template
      best-template
      "~/org/templates/canvas-2d.org")

    ;; Get Canvas API mappings
    (meta-log-template-canvas-api-mappings best-template)))
```

### Federated Template Search

```elisp
;; Search with federation enabled
(meta-log-discover-template
  "3D scene with lighting and materials"
  t)  ; Enable federation

;; Results include templates from all peers
```

## Verifiable Computation

### Executing Verifiable Computation

```elisp
(require 'meta-log-verifiable-computation)

;; Execute and create proof
(let ((vc (meta-log-verifiable-computation-execute
            "r5rs:factorial" 10)))
  ;; vc contains:
  ;; - :id - Computation ID
  ;; - :function-name - "r5rs:factorial"
  ;; - :arguments - (10)
  ;; - :result - 3628800
  ;; - :signature - Cryptographic signature
  ;; - :peer-id - Your peer ID
  ;; - :public-key - Your public key

  (meta-log-verifiable-computation-result vc))
;; => 3628800
```

### Verifying Computation

```elisp
;; Verify without re-execution
(meta-log-verifiable-computation-verify computation-id)
;; => t (if signature is valid)

;; Query federation for cached computation
(meta-log-verifiable-computation-query "r5rs:factorial" 10)
;; => 3628800 (if available and verified)
```

## Advanced Usage

### Custom Keybindings

```elisp
;; Recommended keybindings
(defun my-meta-log-bindings ()
  "Set up meta-log keybindings."
  (global-set-key (kbd "C-c m i") 'meta-log-initialize)
  (global-set-key (kbd "C-c m a") 'meta-log-ask)
  (global-set-key (kbd "C-c m e") 'meta-log-m-expr-eval)
  (global-set-key (kbd "C-c m p") 'meta-log-prolog-query)
  (global-set-key (kbd "C-c m d") 'meta-log-datalog-query)
  (global-set-key (kbd "C-c m r") 'meta-log-r5rs-eval)
  (global-set-key (kbd "C-c m f") 'meta-log-federation-init)
  (global-set-key (kbd "C-c m t") 'meta-log-discover-template))

(add-hook 'after-init-hook 'my-meta-log-bindings)
```

### Hydra Integration

```elisp
(require 'hydra)

(defhydra hydra-meta-log (:color blue :hint nil)
  "
^Queries^           ^Engines^          ^Federation^
^^^^^^^------------------------------------------------------
_a_: Ask            _p_: Prolog        _f_: Init federation
_e_: M-expr         _d_: Datalog       _P_: Discover peers
_i_: Initialize     _r_: R5RS          _t_: Find template
"
  ("a" meta-log-ask)
  ("e" meta-log-m-expr-eval)
  ("i" meta-log-initialize)
  ("p" meta-log-prolog-query)
  ("d" meta-log-datalog-query)
  ("r" meta-log-r5rs-eval)
  ("f" meta-log-federation-init)
  ("P" meta-log-federation-discover-peers)
  ("t" meta-log-discover-template)
  ("q" nil "quit"))

(global-set-key (kbd "C-c m") 'hydra-meta-log/body)
```

### org-mode Capture Templates

```elisp
(setq org-capture-templates
  '(("a" "Automaton Fact" entry
     (file+headline "~/org/automaton.org" "Facts")
     "* %?\n#+BEGIN_SRC meta-log-prolog\n%i\n#+END_SRC"
     :empty-lines 1)

    ("r" "Automaton Rule" entry
     (file+headline "~/org/automaton.org" "Rules")
     "* %?\n#+BEGIN_SRC meta-log-datalog\n%i\n#+END_SRC"
     :empty-lines 1)))
```

## Common Workflows

### Workflow 1: Knowledge Base Development

1. Create Org file with facts
2. Execute code blocks to test
3. Query with Prolog/Datalog
4. Refine and iterate

### Workflow 2: Template Development

1. Describe template in natural language
2. Discover similar templates
3. Review Canvas API mappings
4. Save and customize

### Workflow 3: Federated Research

1. Initialize federation
2. Discover peers
3. Query collective intelligence
4. Verify results

### Workflow 4: Verifiable Computation

1. Execute computation
2. Publish to federation
3. Other peers verify
4. Build trust scores

## Tips and Tricks

### Performance

```elisp
;; Cache frequently used queries
(setq meta-log-query-cache-ttl 300)  ; 5 minutes

;; Lazy load optional modules
(setq meta-log-lazy-load t)

;; Limit federation query timeout
(setq meta-log-federation-timeout 5)  ; seconds
```

### Debugging

```elisp
;; Enable verbose logging
(setq meta-log-verbose t)

;; View logs
(switch-to-buffer "*meta-log-log*")

;; Check engine status
(meta-log-status)
```

### Best Practices

1. **Organize Facts**: Use Org Mode hierarchy
2. **Document Rules**: Add comments to explain logic
3. **Test Incrementally**: Execute blocks frequently
4. **Cache Results**: Use blackboard for intermediate values
5. **Verify Signatures**: Always verify federated results

## Troubleshooting

See [INSTALLATION.md](INSTALLATION.md#troubleshooting) for common issues and solutions.

## Next Steps

- Explore [API Reference](https://bthornemail.github.io/meta-log/API_REFERENCE)
- Read [Module Documentation](https://bthornemail.github.io/meta-log/MODULES)
- Join community discussions

---

*For more examples, see: /home/main/automaton/meta-log/examples/*
