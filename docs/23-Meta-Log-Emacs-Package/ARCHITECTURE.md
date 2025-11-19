# Meta-Log Emacs Package Architecture

## System Architecture

### High-Level Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         User Interface                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Emacs      │  │  Natural     │  │   Org Mode   │            │
│  │   Commands   │  │  Language    │  │   Babel      │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└───────────────────────────────────────────────────────────────────┘
                              │
┌───────────────────────────────────────────────────────────────────┐
│                    Abstraction Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ M-Expression │  │  Query       │  │  Template    │            │
│  │   Parser     │  │  Translator  │  │  Discovery   │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└───────────────────────────────────────────────────────────────────┘
                              │
┌───────────────────────────────────────────────────────────────────┐
│                       Engine Layer                                 │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐           │
│  │ Prolog  │  │ Datalog  │  │  R5RS   │  │ Org Mode │           │
│  │ Engine  │  │  Engine  │  │ (Geiser)│  │Blackboard│           │
│  └─────────┘  └──────────┘  └─────────┘  └──────────┘           │
└───────────────────────────────────────────────────────────────────┘
                              │
┌───────────────────────────────────────────────────────────────────┐
│                  Optional: Federation Layer                        │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐           │
│  │  MQTT   │  │ WebRTC   │  │ Crypto  │  │ Consensus│           │
│  │ Pub/Sub │  │  P2P     │  │Identity │  │Algorithm │           │
│  └─────────┘  └──────────┘  └─────────┘  └──────────┘           │
└───────────────────────────────────────────────────────────────────┘
```

## Module Dependency Graph

### Core Modules (No External Dependencies)

```
meta-log.el (entry point)
    │
    ├─→ meta-log-core.el
    │       │
    │       └─→ cl-lib
    │
    ├─→ meta-log-prolog.el
    │       │
    │       └─→ meta-log-core.el
    │
    ├─→ meta-log-datalog.el
    │       │
    │       └─→ meta-log-core.el
    │
    ├─→ meta-log-r5rs.el
    │       │
    │       ├─→ meta-log-core.el
    │       └─→ geiser (external)
    │
    ├─→ meta-log-org.el
    │       │
    │       ├─→ meta-log-core.el
    │       └─→ org (Emacs built-in)
    │
    ├─→ meta-log-m-expression.el
    │       │
    │       └─→ meta-log-core.el
    │
    ├─→ meta-log-natural-language.el
    │       │
    │       ├─→ meta-log-core.el
    │       ├─→ meta-log-prolog.el
    │       ├─→ meta-log-datalog.el
    │       └─→ meta-log-r5rs.el
    │
    ├─→ meta-log-automata.el
    │       │
    │       ├─→ meta-log-core.el
    │       └─→ meta-log-org.el
    │
    └─→ meta-log-babel.el
            │
            ├─→ org-babel (Emacs)
            ├─→ meta-log-prolog.el
            ├─→ meta-log-datalog.el
            └─→ meta-log-r5rs.el
```

### Optional Modules (Load on Demand)

```
Federation Stack:
    meta-log-federation.el
        │
        ├─→ meta-log-identity.el
        │       │
        │       └─→ meta-log-crypto.el
        │               │
        │               └─→ External crypto tools
        │
        ├─→ meta-log-mqtt.el
        │       │
        │       └─→ External MQTT broker
        │
        └─→ meta-log-webrtc.el
                │
                └─→ External Node.js/WebRTC

Collective Intelligence Stack:
    meta-log-collective-intelligence.el
        │
        ├─→ meta-log-federation.el
        ├─→ meta-log-prolog.el
        └─→ meta-log-datalog.el

    meta-log-verifiable-computation.el
        │
        ├─→ meta-log-crypto.el
        ├─→ meta-log-identity.el
        └─→ meta-log-r5rs.el

Template Discovery Stack:
    meta-log-template-discovery.el
        │
        ├─→ meta-log-wordnet.el
        │       │
        │       └─→ External WordNet database
        │
        ├─→ meta-log-org.el
        ├─→ meta-log-canvas-api.el
        └─→ meta-log-collective-intelligence.el

    meta-log-template-federation.el
        │
        ├─→ meta-log-template-discovery.el
        └─→ meta-log-federation.el

Consensus:
    meta-log-geometric-consensus.el
        │
        ├─→ meta-log-federation.el
        └─→ meta-log-collective-intelligence.el
```

## Data Flow Architecture

### 1. Natural Language Query Flow

```
User Input (Natural Language)
    │
    ▼
meta-log-natural-language-ask
    │
    ├─→ Parse input
    ├─→ Extract keywords
    ├─→ Determine query type (Prolog/Datalog/R5RS)
    │
    ▼
Route to appropriate engine:
    │
    ├─→ [Prolog Query] → meta-log-prolog-query
    │       │
    │       ├─→ Parse goal
    │       ├─→ Unification
    │       ├─→ Resolution
    │       └─→ Return bindings
    │
    ├─→ [Datalog Query] → meta-log-datalog-query
    │       │
    │       ├─→ Extract facts
    │       ├─→ Build program
    │       ├─→ Fixed-point computation
    │       └─→ Return results
    │
    └─→ [R5RS Expression] → meta-log-r5rs-eval
            │
            ├─→ Parse s-expression
            ├─→ Send to Geiser
            └─→ Return result
    │
    ▼
Format result for user
    │
    ▼
Display in minibuffer/buffer
```

### 2. Org Mode Blackboard Flow

```
Org Mode File (*.org)
    │
    ├─→ Front Matter (CanvasL directives)
    │   │
    │   └─→ meta-log-org-parse-frontmatter
    │           │
    │           └─→ Extract CID, dimension, metadata
    │
    ├─→ Content (Facts, Rules, Queries)
    │   │
    │   └─→ meta-log-org-extract-blocks
    │           │
    │           ├─→ Prolog blocks
    │           ├─→ Datalog blocks
    │           └─→ R5RS blocks
    │
    └─→ Babel Execution
        │
        └─→ meta-log-babel-execute
                │
                ├─→ Execute in appropriate engine
                └─→ Return results to Org buffer
```

### 3. Federation Query Flow

```
User Query
    │
    ▼
meta-log-collective-intelligence-query
    │
    ├─→ Check local cache
    │   │
    │   └─→ [Cache hit] Return cached result
    │
    ├─→ [Cache miss] Query all peers
    │       │
    │       └─→ meta-log-federation-discover-peers
    │               │
    │               └─→ MQTT topic: canvasl/peers/discovery
    │
    ├─→ For each peer:
    │   │
    │   └─→ meta-log-collective-intelligence-query-peer
    │           │
    │           ├─→ Publish: canvasl/peers/{peer-id}/queries
    │           ├─→ Subscribe: canvasl/peers/{peer-id}/responses
    │           └─→ Collect response
    │
    ├─→ Aggregate results
    │   │
    │   └─→ meta-log-collective-intelligence-aggregate-results
    │           │
    │           ├─→ Group by value
    │           ├─→ Calculate consensus score
    │           ├─→ Weight by trust scores
    │           └─→ Return best result
    │
    └─→ Cache result
        │
        └─→ Return to user
```

### 4. Template Discovery Flow

```
Natural Language Description
    │
    ▼
meta-log-discover-template
    │
    ├─→ Step 1: WordNet Analysis
    │   │
    │   └─→ meta-log-wordnet-extract-keywords
    │       meta-log-wordnet-semantic-field
    │       meta-log-wordnet-map-to-dimension
    │
    ├─→ Step 2: Query Federation (optional)
    │   │
    │   └─→ meta-log-template-discovery-query-federation
    │           │
    │           └─→ Collective intelligence query
    │
    ├─→ Step 3: Search Local Org Files
    │   │
    │   └─→ meta-log-template-discovery-search-org
    │           │
    │           ├─→ Find template files
    │           ├─→ Match against keywords
    │           └─→ Calculate similarity scores
    │
    ├─→ Step 4: Generate Template (if no matches)
    │   │
    │   └─→ meta-log-template-discovery-generate-template
    │           │
    │           ├─→ Create template structure
    │           ├─→ Map keywords to Canvas API
    │           └─→ Build CanvasL content
    │
    └─→ Return sorted templates
```

## Storage Architecture

### 1. Local Storage

```
~/.emacs.d/meta-log/
├── config/
│   ├── prolog-kb.pl          # Prolog knowledge base
│   ├── datalog-facts.jsonl   # Datalog facts (JSONL)
│   └── settings.el           # User configuration
│
├── templates/
│   ├── *.org                 # Org Mode templates
│   └── *.canvasl             # CanvasL templates
│
├── federation/
│   ├── peers.jsonl           # Known peers
│   ├── identity.key          # Local peer identity
│   └── trust-scores.jsonl    # Peer trust scores
│
└── cache/
    ├── queries.cache         # Cached query results
    └── templates.cache       # Cached template matches
```

### 2. JSONL Database Format

```json
{"type": "fact", "predicate": "parent", "args": ["john", "mary"], "timestamp": "2025-01-01T00:00:00Z"}
{"type": "fact", "predicate": "parent", "args": ["mary", "susan"], "timestamp": "2025-01-01T00:00:00Z"}
{"type": "rule", "head": "ancestor(?X, ?Y)", "body": ["parent(?X, ?Y)"], "timestamp": "2025-01-01T00:00:00Z"}
```

### 3. Peer Identity Storage

```json
{
  "peer-id": "peer-abc123",
  "public-key": "04f3a1...",
  "private-key": "encrypted-with-passphrase",
  "created": "2025-01-01T00:00:00Z",
  "endpoints": ["mqtt://broker:1883", "wss://peer:8080"]
}
```

## Security Architecture

### 1. Cryptographic Identity

```
BIP39 Mnemonic (12/24 words)
    │
    ▼
BIP32 HD Key Derivation
    │
    ├─→ Master Key
    │       │
    │       └─→ m/44'/0'/0'  (Peer Identity)
    │               │
    │               ├─→ Private Key (ECDSA)
    │               └─→ Public Key (ECDSA)
    │
    └─→ Child Keys
            │
            └─→ m/44'/0'/0'/0/n  (Per-message keys)
```

### 2. Message Signing

```
Message Content
    │
    ├─→ Serialize to JSON
    │
    ├─→ Hash with SHA-256
    │
    ├─→ Sign with ECDSA private key
    │
    └─→ Attach signature to message
```

### 3. Verification Flow

```
Received Message
    │
    ├─→ Extract signature
    │
    ├─→ Extract public key
    │
    ├─→ Verify signature with public key
    │
    ├─→ [Valid] Process message
    │           └─→ Update trust score (+)
    │
    └─→ [Invalid] Reject message
                └─→ Update trust score (-)
```

## Performance Considerations

### 1. Lazy Loading

- Core modules loaded immediately
- Optional modules loaded only when required
- Template cache prevents repeated searches

### 2. Caching Strategy

```
Query Cache:
├─→ TTL: 60 seconds
├─→ Key: Hash of query string
└─→ Value: Query results + timestamp

Template Cache:
├─→ TTL: Until Emacs restart
├─→ Key: Template ID
└─→ Value: Template structure

Peer Discovery Cache:
├─→ TTL: 5 minutes
├─→ Key: "peers"
└─→ Value: List of active peer IDs
```

### 3. Async Operations

- Federation queries use async MQTT
- Template discovery searches in background
- Computation verification in separate thread

## Extension Points

### 1. Custom Engines

Add new logic engines by implementing:

```elisp
(defun my-engine-query (query)
  "Execute QUERY in my custom engine.")

(defun my-engine-parse (input)
  "Parse INPUT for my engine.")

;; Register with natural language interface
(add-to-list 'meta-log-engines
  '(my-engine . my-engine-query))
```

### 2. Custom Templates

Register template sources:

```elisp
(defun my-template-source (keywords dimension)
  "Return templates matching KEYWORDS and DIMENSION.")

;; Register source
(add-to-list 'meta-log-template-sources
  'my-template-source)
```

### 3. Custom Protocols

Add protocol handlers:

```elisp
(defun my-protocol-handler (message)
  "Handle protocol MESSAGE.")

;; Register handler
(meta-log-protocol-register
  "my-protocol-type"
  'my-protocol-handler)
```

## Testing Architecture

```
tests/
├── unit/
│   ├── test-prolog.el
│   ├── test-datalog.el
│   ├── test-r5rs.el
│   └── test-org.el
│
├── integration/
│   ├── test-federation.el
│   ├── test-collective-intelligence.el
│   └── test-template-discovery.el
│
└── acceptance/
    ├── test-natural-language.el
    ├── test-org-babel.el
    └── test-end-to-end.el
```

Run tests:

```bash
emacs --batch -l tests/test-runner.el
```

## Deployment Architecture

### 1. Standalone Emacs

```
User's Emacs
    │
    └─→ meta-log package installed
        └─→ All features available locally
```

### 2. Federated Network

```
Peer 1 (Emacs)          Peer 2 (Emacs)          Peer 3 (Emacs)
    │                        │                        │
    └────────────────────────┼────────────────────────┘
                             │
                        MQTT Broker
                        (Mosquitto)
                             │
                        WebRTC TURN/STUN
                        (Optional fallback)
```

### 3. Docker Deployment

```
Docker Compose:
├─→ meta-log-emacs (Emacs + meta-log)
├─→ mosquitto (MQTT broker)
├─→ wordnet (WordNet database)
└─→ turn-server (WebRTC TURN server)
```

---

*This architecture supports the complete Meta-Log framework integration*
