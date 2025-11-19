# meta-log

User-friendly abstraction layer for automaton systems with Prolog, Datalog, and R5RS integration.

## Overview

meta-log provides a complete Emacs Lisp package that abstracts Prolog/Datalog/R5RS complexity behind natural language interfaces and M-expressions. It integrates with Org Mode as a blackboard, supports Docker deployment, and can be distributed via MELPA.

## Features

### Core Features (Always Available)

- **Natural Language Interface**: Ask questions in plain English
- **M-Expression Support**: Human-readable syntax for queries and evaluations
- **Org Mode Integration**: Use Org Mode files as automaton blackboards
- **Library of Babel**: Execute meta-log code blocks in Org Mode
- **Prolog Engine**: Full Prolog engine with unification and resolution
- **Datalog Engine**: Datalog engine with fact extraction and fixed-point computation
- **R5RS Integration**: Execute R5RS Scheme code via Geiser
- **automaton-evolutions Integration**: Load automata from CanvasL files

### Optional Features (Require Separately)

- **Federation**: Peer-to-peer synchronization and coordination
- **Cryptography**: BIP32/39/44 key derivation and identity management
- **MQTT**: Pub/sub messaging for distributed systems
- **WebRTC**: Direct peer connections with TCP fallback
- **Template Discovery**: Dynamic template discovery with semantic matching
- **Template Federation**: Share templates across federated peers
- **Collective Intelligence**: Collaborative knowledge building
- **Verifiable Computation**: Computation verification and proof checking
- **Geometric Consensus**: Consensus algorithms based on topology

See [docs/MODULES.md](docs/MODULES.md) for detailed documentation on optional modules.

## Installation

### Via MELPA (Recommended - Coming Soon)

Once meta-log is published to MELPA:

```elisp
M-x package-install RET meta-log RET
```

### Via GitHub

#### Method 1: package-install-file (Easiest)

1. Download the repository:
   ```bash
   git clone https://github.com/bthornemail/meta-log.git
   ```

2. In Emacs:
   ```elisp
   M-x package-install-file RET /path/to/meta-log/meta-log.el RET
   ```

#### Method 2: Manual Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/bthornemail/meta-log.git
   ```

2. Add to your `load-path` in your init.el:
   ```elisp
   (add-to-list 'load-path "/path/to/meta-log")
   ```

3. Require the package:
   ```elisp
   (require 'meta-log)
   ```

### System Requirements

**Required**:
- Emacs 28.1 or later
- Org Mode 9.6+ (included with Emacs 28.1+)

**Elisp Package Dependencies** (auto-installed):
- `geiser` 0.18+ (for R5RS Scheme integration)
- `dash` 2.19+ (for list operations)

**Optional External Dependencies**:
- **Guile 3.0+**: Required for R5RS Scheme evaluation
  - Ubuntu/Debian: `sudo apt install guile-3.0`
  - macOS: `brew install guile`
- **Mosquitto**: Required for MQTT federation features
  - Ubuntu/Debian: `sudo apt install mosquitto mosquitto-clients`
  - macOS: `brew install mosquitto`
- **npm**: Optional, for automaton-evolutions integration
  - Ubuntu/Debian: `sudo apt install npm`
  - macOS: `brew install node`

### Docker Installation

For containerized deployment with all dependencies:

```bash
cd meta-log/docker
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

## Modular Architecture

meta-log uses a modular architecture to minimize dependencies:

**Core modules** (always loaded):
```elisp
(require 'meta-log)  ; Loads core: Prolog, Datalog, R5RS, M-expr, NL, Org Mode
```

**Optional modules** (require as needed):
```elisp
;; For federation features:
(require 'meta-log-federation)
(require 'meta-log-mqtt)
(require 'meta-log-webrtc)

;; For template discovery:
(require 'meta-log-template-discovery)
(require 'meta-log-wordnet)

;; For advanced features:
(require 'meta-log-collective-intelligence)
(require 'meta-log-verifiable-computation)
```

See [docs/MODULES.md](docs/MODULES.md) for complete module documentation and dependency information.

## License

MIT

## Related Packages

- **automaton-evolutions**: Canonical automaton CanvasL data files
- **meta-log-db**: TypeScript database package (separate implementation)

## Documentation

- [User Guide](docs/USER_GUIDE.md) - General usage guide
- [API Reference](docs/API_REFERENCE.md) - API documentation
- [Module Documentation](docs/MODULES.md) - Optional modules and features
- [Examples](docs/EXAMPLES.org) - Example Org Mode files
- [Federation Guide](docs/FEDERATION_GUIDE.md) - Federation setup
- [Cryptography Guide](docs/CRYPTO_GUIDE.md) - Cryptography usage
- [Template Discovery](docs/TEMPLATE-DISCOVERY-BRIDGE.md) - Template system

## Contributing

meta-log is open source under the MIT license. Contributions, bug reports, and feature requests are welcome at [https://github.com/bthornemail/meta-log](https://github.com/bthornemail/meta-log).

## Version

Current version: **1.0.0** (MELPA-ready)

See [CHANGELOG.md](CHANGELOG.md) for version history.
