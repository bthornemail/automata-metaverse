---
layout: default
title: User Guide
nav_order: 2
description: "Complete guide for using meta-log"
permalink: /USER_GUIDE
---

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
10. [Optional Modules](#optional-modules)

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

## Optional Modules

meta-log has a modular architecture. Core features are loaded automatically, but advanced features can be enabled by requiring additional modules.

### Core vs Optional

**Core modules** (loaded with `(require 'meta-log)`):
- Prolog and Datalog engines
- R5RS Scheme integration
- M-expression parser
- Natural language interface
- Org Mode integration

**Optional modules** (require separately):
- Federation and networking
- Cryptography and identity
- Template discovery and sharing
- Collective intelligence
- Verifiable computation
- And more...

### Using Optional Modules

To use federation features:

```elisp
(require 'meta-log)
(require 'meta-log-federation)
(require 'meta-log-mqtt)
(require 'meta-log-webrtc)
(require 'meta-log-identity)

(meta-log-initialize)
(meta-log-federation-init "~/.emacs.d/meta-log/blackboard.org")
```

To use template discovery:

```elisp
(require 'meta-log)
(require 'meta-log-template-discovery)
(require 'meta-log-wordnet)

(meta-log-initialize)
(let ((templates (meta-log-discover-template "peer identity management")))
  (message "Found %d templates" (length templates)))
```

### Complete Module Documentation

For comprehensive documentation on all optional modules, their features, dependencies, and usage examples, see:

**[MODULES.md](MODULES.md)** - Complete module reference

Key topics covered:
- Detailed description of each optional module
- External dependencies required
- Usage examples and code samples
- Dependency graph showing module relationships
- Troubleshooting common issues

### External Dependencies

Some optional modules require external dependencies:

- **Guile 3.0+**: Required for R5RS Scheme (core feature)
- **Mosquitto MQTT broker**: Required for federation features
- **npm**: Optional, for automaton-evolutions integration

See [MODULES.md](MODULES.md) for complete dependency information.

## Examples

See [EXAMPLES.org](EXAMPLES.org) for complete examples.

