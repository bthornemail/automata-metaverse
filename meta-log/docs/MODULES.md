---
layout: default
title: Modules Documentation
nav_order: 3
description: "Complete reference for all meta-log modules"
permalink: /MODULES
---

# meta-log Optional Modules

This document describes the optional modules available in meta-log and how to use them.

## Overview

meta-log has a modular architecture with two types of modules:

1. **Core Modules** (loaded automatically): Prolog, Datalog, R5RS, M-expressions, Natural Language, Org Mode
2. **Optional Modules** (require separately): Federation, Crypto, MQTT, WebRTC, and more

Optional modules provide advanced features but may have external dependencies. You can enable only the modules you need.

---

## Core Modules (Always Loaded)

These modules are loaded automatically when you `(require 'meta-log)`:

### meta-log-core
- Database abstraction layer
- Core initialization and management
- **Dependencies**: None (beyond Emacs)

### meta-log-prolog
- Full Prolog engine with unification and SLD resolution
- Prolog query interface
- **Dependencies**: None

### meta-log-datalog
- Datalog engine with fact extraction and fixed-point computation
- Datalog query interface
- **Dependencies**: None

### meta-log-r5rs
- R5RS Scheme integration via Geiser
- Scheme expression evaluation
- **Dependencies**: Geiser (Emacs package), Guile 3.0+ (external)

### meta-log-m-expression
- M-expression parser and evaluator
- Human-readable syntax for queries
- **Dependencies**: None

### meta-log-natural-language
- Natural language interface for queries
- English-to-query translation
- **Dependencies**: None

### meta-log-org
- Org Mode integration
- Blackboard file management
- Template extraction from Org files
- **Dependencies**: Org Mode (included with Emacs 28.1+)

### meta-log-babel
- Org Babel integration
- Execute meta-log code blocks in Org Mode
- **Dependencies**: Org Mode

### meta-log-automata
- Automaton loader for CanvasL files
- Integration with automaton-evolutions
- **Dependencies**: npm (optional, for automaton-evolutions package)

---

## Optional Modules (Require Separately)

### Federation & Networking

#### meta-log-federation
**Purpose**: Peer-to-peer federation and synchronization

**Features**:
- Federated blackboard synchronization
- Peer discovery and coordination
- Multi-peer query aggregation
- Consensus mechanisms

**Dependencies**:
- meta-log-mqtt (for MQTT transport)
- meta-log-webrtc (for WebRTC transport)
- meta-log-identity (for peer identity)

**Usage**:
```elisp
(require 'meta-log)
(require 'meta-log-federation)
(require 'meta-log-mqtt)
(require 'meta-log-webrtc)
(meta-log-federation-init "/path/to/blackboard.org")
```

**External Dependencies**:
- Mosquitto MQTT broker (for MQTT transport)

---

#### meta-log-mqtt
**Purpose**: MQTT pub/sub messaging

**Features**:
- MQTT client for message passing
- Topic-based routing
- QoS support
- Retained messages

**Dependencies**:
- None (Elisp only)

**Usage**:
```elisp
(require 'meta-log-mqtt)
(meta-log-mqtt-connect "mqtt://localhost:1883")
(meta-log-mqtt-publish "canvasl/test" "Hello, MQTT!")
```

**External Dependencies**:
- Mosquitto MQTT broker (or compatible MQTT broker)

---

#### meta-log-webrtc
**Purpose**: WebRTC peer connections with TCP fallback

**Features**:
- Direct peer-to-peer connections
- NAT traversal
- TCP fallback for restrictive networks
- Binary data transfer

**Dependencies**:
- meta-log-identity (for peer credentials)

**Usage**:
```elisp
(require 'meta-log-webrtc)
(meta-log-webrtc-connect "peer-id")
```

**External Dependencies**:
- STUN/TURN server (optional, for NAT traversal)

---

### Cryptography & Identity

#### meta-log-crypto
**Purpose**: BIP32/39/44 cryptographic key derivation

**Features**:
- HD wallet key derivation (BIP32)
- Mnemonic phrases (BIP39)
- Account discovery (BIP44)
- Message signing and verification

**Dependencies**:
- None (pure Elisp implementation)

**Usage**:
```elisp
(require 'meta-log-crypto)
(let ((mnemonic (meta-log-crypto-generate-mnemonic)))
  (meta-log-crypto-derive-key mnemonic "m/44'/0'/0'/0/0"))
```

**External Dependencies**: None

---

#### meta-log-identity
**Purpose**: Peer identity management

**Features**:
- Peer identity creation and management
- Public key infrastructure
- Identity verification
- Peer directories

**Dependencies**:
- meta-log-crypto (for key generation)

**Usage**:
```elisp
(require 'meta-log-identity)
(meta-log-identity-create "my-peer-id")
```

**External Dependencies**: None

---

### Template System

#### meta-log-template-discovery
**Purpose**: Dynamic template discovery

**Features**:
- Natural language template search
- Semantic similarity matching
- Template generation from keywords
- Federation-aware template discovery

**Dependencies**:
- meta-log-wordnet (for semantic analysis)
- meta-log-canvas-api (for template generation)
- meta-log-federation (optional, for federated discovery)

**Usage**:
```elisp
(require 'meta-log-template-discovery)
(meta-log-discover-template "peer identity management")
```

**External Dependencies**: None (WordNet data embedded)

---

#### meta-log-template-federation
**Purpose**: Federated template sharing

**Features**:
- Share templates across federation
- Template registry
- Signature verification
- Template versioning

**Dependencies**:
- meta-log-federation (for peer communication)
- meta-log-crypto (for signing)

**Usage**:
```elisp
(require 'meta-log-template-federation)
(meta-log-template-federation-share-template template)
```

**External Dependencies**: MQTT broker

---

#### meta-log-wordnet
**Purpose**: WordNet semantic analysis

**Features**:
- Keyword extraction
- Synonym finding
- Semantic field categorization
- Dimension mapping (0D-7D)
- Semantic similarity calculation

**Dependencies**:
- None

**Usage**:
```elisp
(require 'meta-log-wordnet)
(meta-log-wordnet-extract-keywords "peer identity management")
```

**External Dependencies**: None (lightweight WordNet subset embedded)

---

### Advanced Features

#### meta-log-collective-intelligence
**Purpose**: Collective intelligence features

**Features**:
- Collaborative knowledge building
- Consensus-based reasoning
- Multi-agent coordination
- Knowledge aggregation

**Dependencies**:
- meta-log-federation (for multi-peer intelligence)

**Usage**:
```elisp
(require 'meta-log-collective-intelligence)
(meta-log-collective-intelligence-query "What is consensus on X?")
```

**External Dependencies**: MQTT broker (for federation)

---

#### meta-log-verifiable-computation
**Purpose**: Verifiable computation support

**Features**:
- Computation verification
- Proof generation and checking
- Tamper detection
- Audit trails

**Dependencies**:
- meta-log-crypto (for proof signing)

**Usage**:
```elisp
(require 'meta-log-verifiable-computation)
(meta-log-verifiable-computation-verify proof result)
```

**External Dependencies**: None

---

#### meta-log-geometric-consensus
**Purpose**: Geometric consensus foundation

**Features**:
- Geometric consensus algorithms
- Topological agreement
- Dimensional consensus
- Shape-based voting

**Dependencies**:
- meta-log-federation (for multi-peer consensus)

**Usage**:
```elisp
(require 'meta-log-geometric-consensus)
(meta-log-geometric-consensus-compute topology)
```

**External Dependencies**: None

---

### Integration Modules

#### meta-log-canvas-api
**Purpose**: Web Canvas API integration

**Features**:
- Keyword to Canvas API mapping
- JavaScript code generation
- Template structure building

**Dependencies**:
- None

**Usage**:
```elisp
(require 'meta-log-canvas-api)
(meta-log-canvas-api-generate-code "draw circle")
```

**External Dependencies**: None

---

#### meta-log-protocol
**Purpose**: CanvasL protocol handlers

**Features**:
- CanvasL format parsing
- Protocol message handling
- Format validation

**Dependencies**:
- None

**Usage**:
```elisp
(require 'meta-log-protocol)
(meta-log-protocol-parse-canvasl file)
```

**External Dependencies**: None

---

#### meta-log-server
**Purpose**: Emacs server coordination

**Features**:
- Server lifecycle management
- Client coordination
- Message routing

**Dependencies**:
- meta-log-federation (for multi-server coordination)

**Usage**:
```elisp
(require 'meta-log-server)
(meta-log-server-start)
```

**External Dependencies**: None

---

## Common Usage Patterns

### Minimal Setup (Core Only)
```elisp
(require 'meta-log)
(meta-log-initialize)
(meta-log-ask "What agents are available?")
```

### With Federation
```elisp
(require 'meta-log)
(require 'meta-log-federation)
(require 'meta-log-mqtt)
(require 'meta-log-webrtc)
(require 'meta-log-identity)

(meta-log-initialize)
(meta-log-federation-init "~/.emacs.d/meta-log/blackboard.org")
```

### With Template Discovery
```elisp
(require 'meta-log)
(require 'meta-log-template-discovery)
(require 'meta-log-wordnet)
(require 'meta-log-canvas-api)

(meta-log-initialize)
(let ((templates (meta-log-discover-template "network synchronization")))
  (message "Found %d templates" (length templates)))
```

### Full Feature Set
```elisp
(require 'meta-log)

;; Federation
(require 'meta-log-federation)
(require 'meta-log-mqtt)
(require 'meta-log-webrtc)
(require 'meta-log-identity)
(require 'meta-log-crypto)

;; Templates
(require 'meta-log-template-discovery)
(require 'meta-log-template-federation)
(require 'meta-log-wordnet)
(require 'meta-log-canvas-api)

;; Advanced
(require 'meta-log-collective-intelligence)
(require 'meta-log-verifiable-computation)
(require 'meta-log-geometric-consensus)

;; Integration
(require 'meta-log-protocol)
(require 'meta-log-server)

(meta-log-initialize)
(meta-log-federation-init "~/.emacs.d/meta-log/blackboard.org")
```

---

## Dependency Graph

```
Core:
  meta-log
    ├── meta-log-core
    ├── meta-log-prolog
    ├── meta-log-datalog
    ├── meta-log-r5rs
    ├── meta-log-m-expression
    ├── meta-log-natural-language
    ├── meta-log-org
    ├── meta-log-babel
    └── meta-log-automata

Optional:
  Federation Stack:
    meta-log-federation
      ├── meta-log-mqtt
      ├── meta-log-webrtc
      └── meta-log-identity
            └── meta-log-crypto

  Template Stack:
    meta-log-template-discovery
      ├── meta-log-wordnet
      ├── meta-log-canvas-api
      └── meta-log-federation (optional)

    meta-log-template-federation
      ├── meta-log-federation
      └── meta-log-crypto

  Advanced:
    meta-log-collective-intelligence
      └── meta-log-federation

    meta-log-verifiable-computation
      └── meta-log-crypto

    meta-log-geometric-consensus
      └── meta-log-federation

  Integration:
    meta-log-protocol (standalone)
    meta-log-canvas-api (standalone)
    meta-log-server
      └── meta-log-federation (optional)
```

---

## External Dependencies Summary

| Module | External Dependencies | Required? |
|--------|---------------------|-----------|
| Core modules | Guile 3.0+ | Optional (for R5RS) |
| meta-log-automata | npm, automaton-evolutions | Optional |
| meta-log-mqtt | Mosquitto MQTT broker | Yes (for MQTT) |
| meta-log-webrtc | STUN/TURN server | Optional (for NAT) |
| All others | None | N/A |

---

## Troubleshooting

### Module Not Found
If you get "Cannot open load file: No such file or directory, meta-log-MODULE":
1. Ensure you've installed meta-log correctly
2. Check that the .el file exists in the package directory
3. Try `M-x package-refresh-contents` and reinstall

### External Dependency Issues
**Guile (R5RS)**:
- Install: `sudo apt install guile-3.0` (Debian/Ubuntu) or `brew install guile` (macOS)
- Verify: `guile --version`

**Mosquitto (MQTT)**:
- Install: `sudo apt install mosquitto mosquitto-clients` or `brew install mosquitto`
- Start: `sudo systemctl start mosquitto` or `brew services start mosquitto`
- Test: `mosquitto_pub -t test -m "hello"`

**npm (automaton-evolutions)**:
- Install: `sudo apt install npm` or `brew install node`
- Verify: `npm --version`

---

## See Also

- [User Guide](USER_GUIDE.md) - General usage guide
- [API Reference](API_REFERENCE.md) - API documentation
- [Federation Guide](FEDERATION_GUIDE.md) - Federation setup
- [Crypto Guide](CRYPTO_GUIDE.md) - Cryptography usage
- [Template Discovery Bridge](TEMPLATE-DISCOVERY-BRIDGE.md) - Template system documentation
