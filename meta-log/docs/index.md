---
layout: default
title: Home
nav_order: 1
description: "meta-log: User-friendly abstraction layer for automaton systems with Prolog, Datalog, and R5RS integration"
permalink: /
---

# meta-log
{: .fs-9 }

User-friendly abstraction layer for automaton systems with Prolog, Datalog, and R5RS integration.
{: .fs-6 .fw-300 }

[Get Started](USER_GUIDE){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/bthornemail/meta-log){: .btn .fs-5 .mb-4 .mb-md-0 }

---

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

See [Modules Documentation](MODULES) for detailed documentation on all modules.

## Quick Start

### Installation

#### Via MELPA (Coming Soon)

```elisp
M-x package-install RET meta-log RET
```

#### Via GitHub

```bash
git clone https://github.com/bthornemail/meta-log.git
cd meta-log
```

Then in Emacs:

```elisp
M-x package-install-file RET /path/to/meta-log RET
```

### Basic Usage

```elisp
;; Initialize the system
(require 'meta-log)
(meta-log-initialize)

;; Ask a natural language question
(meta-log-ask "What predicates are defined?")

;; Evaluate an M-expression
(meta-log-m-expr-eval "(define factorial (lambda (n) (if (<= n 1) 1 (* n (factorial (- n 1))))))")

;; Query with Prolog
(meta-log-prolog-query "parent(X, Y)")

;; Query with Datalog
(meta-log-datalog-query "ancestor(?X, ?Y)")
```

## Documentation

- [User Guide](USER_GUIDE) - Getting started and basic usage
- [Modules Documentation](MODULES) - Complete module reference
- [API Reference](API_REFERENCE) - Function and macro reference
- [Federation Guide](FEDERATION_GUIDE) - Distributed system setup
- [Crypto Guide](CRYPTO_GUIDE) - Cryptographic identity management
- [Template Discovery](TEMPLATE-DISCOVERY-BRIDGE) - Dynamic template system
- [Better than LLM](BETTER-THAN-LLM) - Why meta-log is better than an LLM

## Architecture

meta-log uses a modular architecture with:

- **Core modules**: Always loaded, provide essential functionality
- **Optional modules**: Loaded on demand for advanced features
- **Clean separation**: No dependencies between optional modules
- **Extensible**: Easy to add new modules and integrations

## Requirements

- Emacs 28.1 or higher
- Org Mode 9.6+
- Geiser 0.18+ (for R5RS integration)
- dash 2.19+ (utility library)

Optional dependencies for advanced features:
- MQTT broker (e.g., Mosquitto) for federation
- Node.js for WebRTC support
- WordNet for semantic analysis

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](https://github.com/bthornemail/meta-log/blob/main/CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](https://github.com/bthornemail/meta-log/blob/main/LICENSE) for details.

## Author

Brian Thorne - [bthornemail@gmail.com](mailto:bthornemail@gmail.com)

---

{: .fs-3 }
Built with ❤️ using Emacs Lisp and powered by Church encoding topology
