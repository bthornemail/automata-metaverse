# meta-log User Guide

Complete guide for using meta-log to interact with automaton systems.

## Table of Contents

1. [Installation](#installation)
2. [Initialization](#initialization)
3. [Natural Language Interface](#natural-language-interface)
4. [M-Expressions](#m-expressions)
5. [Org Mode Integration](#org-mode-integration)
6. [Prolog Queries](#prolog-queries)
7. [Datalog Queries](#datalog-queries)
8. [R5RS Execution](#r5rs-execution)
9. [Loading Automata](#loading-automata)

## Installation

See [README.md](../README.md#installation) for installation instructions.

## Initialization

Before using meta-log, you must initialize it:

```elisp
M-x meta-log-initialize
```

Or programmatically:

```elisp
(meta-log-initialize '(:r5rs-engine-path "/path/to/r5rs-canvas-engine.scm"
                       :automata-path "/path/to/automaton-evolutions"
                       :org-blackboard-path "/path/to/blackboard.org"))
```

## Natural Language Interface

Ask questions in plain English:

```elisp
M-x meta-log-ask RET What agents are in dimension 5D?
```

Supported question patterns:

- **Agent queries**: "What agents are in dimension X?"
- **Node queries**: "Find all nodes with type Y"
- **Function execution**: "Execute church-add(2, 3)"
- **Topology visualization**: "Show me the topology"

## M-Expressions

M-expressions provide human-readable syntax:

### Evaluation

```elisp
eval[church-add[2; 3]; environment[global]]
```

### Query

```elisp
query[find[all[nodes]; where[dimension[?X; "0D"]]]
```

### Prolog

```elisp
prolog[inherits[?X; ?Z]; where[vertical[?Y; ?X]; inherits[?Y; ?Z]]]
```

### Datalog

```elisp
datalog[inherits[?X; ?Z]; where[vertical[?Y; ?X]; inherits[?Y; ?Z]]]
```

## Org Mode Integration

### Creating a Blackboard

Create an Org file with this structure:

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
:NODE_TYPE: text
:END:

Content for 0D topology node.
```

### Loading a Blackboard

```elisp
(meta-log-org-load-blackboard "/path/to/blackboard.org")
```

### Using Babel

Execute code blocks in Org Mode:

```org
#+BEGIN_SRC meta-log-m-expr :results value
eval[church-add[2; 3]; environment[global]]
#+END_SRC

#+BEGIN_SRC meta-log-prolog :results output
node(node1, text).
?- node(?Id, ?Type).
#+END_SRC
```

## Prolog Queries

Execute Prolog queries:

```elisp
M-x meta-log-prolog-query RET node(?Id, ?Type)
```

Or programmatically:

```elisp
(meta-log-prolog-query '(node ?Id ?Type))
```

Add facts:

```elisp
(meta-log-prolog-add-fact 'node 'node1 'text)
(meta-log-prolog-add-fact 'node 'node2 'text)
```

Add rules:

```elisp
(meta-log-prolog-add-rule '(inherits ?X ?Z)
                          '(vertical ?Y ?X)
                          '(inherits ?Y ?Z))
```

## Datalog Queries

Execute Datalog queries:

```elisp
M-x meta-log-datalog-query RET node(?Id, ?Type)
```

Add facts:

```elisp
(meta-log-datalog-add-fact 'node 'node1 'text)
```

Add rules:

```elisp
(meta-log-datalog-add-rule '(inherits ?X ?Z)
                           '(vertical ?Y ?X)
                           '(inherits ?Y ?Z))
```

## R5RS Execution

Execute R5RS Scheme expressions:

```elisp
M-x meta-log-r5rs-eval RET (church-add 2 3)
```

Call functions:

```elisp
(meta-log-r5rs-call "r5rs:church-add" 2 3)
```

## Loading Automata

Load automata from automaton-evolutions:

```elisp
(meta-log-load-automata "/path/to/automaton-evolutions")
```

Or set environment variable:

```bash
export META_LOG_AUTOMATA_PATH=/path/to/automaton-evolutions
```

Then initialize:

```elisp
(meta-log-initialize)
```

## Examples

See [EXAMPLES.org](EXAMPLES.org) for complete examples.

