# meta-log Enhancements: Better Than an LLM

## Quick Start

### Collective Intelligence

Query the federation and aggregate results with consensus:

```elisp
(require 'meta-log-collective-intelligence)
(let ((result (meta-log-collective-intelligence-query "node(?Id, ?Type)")))
  (message "Consensus: %S (score: %.2f)"
           (plist-get result :result)
           (plist-get result :consensus)))
```

### Verifiable Computation

Execute computations with cryptographic proofs:

```elisp
(require 'meta-log-verifiable-computation)
;; Execute and sign
(let ((vc (meta-log-verifiable-computation-execute "church-add" 2 3)))
  (message "Result: %S (ID: %s)"
           (meta-log-verifiable-computation-result vc)
           (meta-log-verifiable-computation-id vc)))

;; Verify without re-execution
(meta-log-verifiable-computation-verify computation-id)

;; Query federation for verified result
(meta-log-verifiable-computation-query "church-add" 2 3)
```

## Why This is Better Than an LLM

### 1. Collective Intelligence
- **LLMs**: Single model, no aggregation
- **meta-log**: Queries multiple peers, aggregates with consensus
- **Result**: More reliable, diverse knowledge sources

### 2. Verifiable Computation
- **LLMs**: Black-box outputs, no verification
- **meta-log**: Cryptographic proofs for all computations
- **Result**: Trust without re-execution, verifiable correctness

### 3. Persistent Identity
- **LLMs**: Stateless sessions
- **meta-log**: Cryptographic identity (BIP32/39/44)
- **Result**: Verifiable, persistent identity

### 4. Distributed Knowledge
- **LLMs**: Centralized model
- **meta-log**: Peer-to-peer federation
- **Result**: No single point of failure

### 5. Formal Reasoning
- **LLMs**: Pattern matching
- **meta-log**: Prolog/Datalog logic programming
- **Result**: Formal reasoning, not just patterns

## Architecture

### Collective Intelligence
- Queries all peers via MQTT
- Aggregates results using consensus (60% frequency + 40% trust)
- Returns result if consensus threshold met (≥60%)

### Verifiable Computation
- Signs all computations with peer identity
- Creates proof (function, args, result, timestamp)
- Peers can verify without re-execution
- Trust scores updated based on verification

## Documentation

- **Complete Guide**: `docs/BETTER-THAN-LLM.md`
- **Enhancements Summary**: `ENHANCEMENTS-SUMMARY.md`
- **Demos**: `examples/collective-intelligence-demo.el`, `examples/verifiable-computation-demo.el`


