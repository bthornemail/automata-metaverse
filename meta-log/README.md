# meta-log

User-friendly abstraction layer for automaton systems with Prolog, Datalog, and R5RS integration.

## Overview

meta-log provides a complete Emacs Lisp package that abstracts Prolog/Datalog/R5RS complexity behind natural language interfaces and M-expressions. It integrates with Org Mode as a blackboard, supports Docker deployment, and can be distributed via MELPA.

## Features

- **Natural Language Interface**: Ask questions in plain English
- **M-Expression Support**: Human-readable syntax for queries and evaluations
- **Org Mode Integration**: Use Org Mode files as automaton blackboards
- **Library of Babel**: Execute meta-log code blocks in Org Mode
- **Prolog Engine**: Full Prolog engine with unification and resolution
- **Datalog Engine**: Datalog engine with fact extraction and fixed-point computation
- **R5RS Integration**: Execute R5RS Scheme code via Geiser
- **automaton-evolutions Integration**: Load automata from npm package
- **Docker Support**: Containerized deployment

## Installation

### Via MELPA

```elisp
M-x package-install RET meta-log RET
```

### Manual Installation

1. Clone this repository
2. Add to your `load-path`:
   ```elisp
   (add-to-list 'load-path "/path/to/meta-log")
   ```
3. Require the package:
   ```elisp
   (require 'meta-log)
   ```

### Docker Installation

```bash
docker-compose up -d
```

## Quick Start

### Initialize meta-log

```elisp
M-x meta-log-initialize
```

### Ask a Question

```elisp
M-x meta-log-ask RET What agents are in dimension 5D?
```

### Use M-Expressions

```elisp
M-x meta-log-m-expr-eval RET eval[church-add[2; 3]; environment[global]]
```

### Execute Prolog Query

```elisp
M-x meta-log-prolog-query RET node(?Id, ?Type)
```

### Execute Datalog Query

```elisp
M-x meta-log-datalog-query RET node(?Id, ?Type)
```

### Execute R5RS Expression

```elisp
M-x meta-log-r5rs-eval RET (church-add 2 3)
```

## Org Mode Integration

### Blackboard Format

```org
* Automaton Blackboard
:PROPERTIES:
:META_LOG_VERSION: 1.0
:R5RS_ENGINE: r5rs-canvas-engine.scm
:END:

** 0D Topology
:PROPERTIES:
:NODE_ID: 0D-topology
:DIMENSION: 0D
:END:

#+BEGIN_SRC meta-log-m-expr
query[find[all[nodes]; where[dimension[?X; "0D"]]]
#+END_SRC
```

### Babel Source Blocks

```org
#+BEGIN_SRC meta-log-prolog :results output
node(node1, text).
node(node2, text).
?- node(?Id, ?Type).
#+END_SRC

#+BEGIN_SRC meta-log-datalog :results table
node(node1, text).
?- node(?Id, ?Type).
#+END_SRC

#+BEGIN_SRC meta-log-r5rs :results value
(church-add 2 3)
#+END_SRC
```

## M-Expression Syntax

M-expressions provide a more readable syntax than S-expressions:

```elisp
;; Evaluation
eval[church-add[2; 3]; environment[global]]

;; Query
query[find[all[nodes]; where[dimension[?X; "0D"]]]

;; Prolog
prolog[inherits[?X; ?Z]; where[vertical[?Y; ?X]; inherits[?Y; ?Z]]]

;; Datalog
datalog[inherits[?X; ?Z]; where[vertical[?Y; ?X]; inherits[?Y; ?Z]]]
```

## Natural Language Queries

Ask questions in plain English:

- "What agents are in dimension 5D?"
- "Find all nodes with type text"
- "Execute church-add(2, 3)"
- "Show me the topology"

## automaton-evolutions Integration

Load automata from the automaton-evolutions npm package:

```elisp
(meta-log-load-automata "/path/to/automaton-evolutions")
```

Or set the environment variable:

```bash
export META_LOG_AUTOMATA_PATH=/path/to/automaton-evolutions
```

## Docker Usage

### Start Container

```bash
docker-compose up -d
```

### Connect via emacsclient

```bash
emacsclient -s /tmp/emacs1000/server -e "(meta-log-ask \"What agents are available?\")"
```

### View Logs

```bash
docker-compose logs -f meta-log
```

## Key Bindings

- `C-c C-i` - Initialize meta-log
- `C-c C-a` - Ask a question
- `C-c C-e` - Evaluate M-expression
- `C-c C-p` - Execute Prolog query
- `C-c C-d` - Execute Datalog query
- `C-c C-r` - Execute R5RS expression

## Dependencies

- Emacs 29.1+
- Org Mode 9.6+
- Geiser 0.18+ (for R5RS integration)
- dash.el 2.19+ (for list operations)
- Guile 3.0+ (for Scheme execution)
- npm (for finding automaton-evolutions)
- Docker (for containerization)

## License

MIT

## Related Packages

- **automaton-evolutions**: Canonical automaton CanvasL data files
- **meta-log-db**: TypeScript database package (separate implementation)

## Documentation

- [User Guide](docs/USER_GUIDE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Examples](docs/EXAMPLES.org)

