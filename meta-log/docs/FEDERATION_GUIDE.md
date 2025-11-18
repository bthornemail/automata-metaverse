# Federation Guide

Complete guide for using meta-log federation to synchronize Org Mode blackboards between multiple Emacs instances.

## Overview

meta-log federation enables peer-to-peer synchronization of Org Mode blackboards between multiple Emacs instances using:

- **BIP32/39/44**: Cryptographic key management for peer identity
- **MQTT**: Peer discovery and message routing
- **WebRTC/TCP**: Peer-to-peer synchronization
- **Org Mode**: Blackboard storage and coordination

## Quick Start

### 1. Initialize Federation

```elisp
;; Initialize federation with blackboard file and MQTT broker
(meta-log-federation-init "~/federation-blackboard.org" "mqtt://broker.example.com:1883")
```

### 2. Create Peer Identity

```elisp
;; Create a new peer identity
(let ((identity (meta-log-identity-create-peer nil "~/peer-identity.org")))
  (meta-log-identity-set-current-peer identity))
```

### 3. Announce Peer

```elisp
;; Announce this peer to the network
(meta-log-federation-announce-peer)
```

### 4. Discover Peers

```elisp
;; Discover peers via MQTT
(meta-log-federation-discover-peers)
```

### 5. Connect to Peer

```elisp
;; Connect to a specific peer
(meta-log-federation-connect-to-peer "peer-abc123")
```

### 6. Synchronize Blackboard

```elisp
;; Synchronize blackboard with all peers
(meta-log-federation-sync-blackboard)
```

## Org Mode Blackboard Format

The federation blackboard is stored in an Org Mode file:

```org
* Federation Blackboard
:PROPERTIES:
:FEDERATION_VERSION: 1.0
:BLACKBOARD_ID: blackboard-abc123
:LAST_SYNC: 2025-01-07T12:00:00Z
:END:

** Peers

*** Peer: peer-abc123
:PROPERTIES:
:PEER_ID: peer-abc123
:PEER_PUBLIC_KEY: 0x...
:PEER_ADDRESS: mqtt://broker.example.com
:PEER_STATUS: connected
:LAST_SEEN: 2025-01-07T12:00:00Z
:END:

** CanvasL State

*** Node: node-1
:PROPERTIES:
:NODE_ID: node-1
:CANVASL_CID: bafyreiabc123...
:CANVASL_SIGNATURE: 0x...
:PEER_OWNER: peer-abc123
:LAST_MODIFIED: 2025-01-07T12:00:00Z
:END:
```

## Peer Identity Format

Peer identities are stored in Org Mode files:

```org
* Peer Identity
:PROPERTIES:
:PEER_ID: peer-abc123
:PEER_MNEMONIC: word1 word2 word3 ... word12
:PEER_PUBLIC_KEY: 0x...
:CRYPTO_PATH: m/44'/meta-log'/0'/0/0
:END:
```

## MQTT Configuration

MQTT configuration can be stored in Org Mode:

```org
* MQTT Configuration
:PROPERTIES:
:MQTT_BROKER: mqtt://broker.example.com:1883
:MQTT_TOPIC: canvasl/peers/#
:MQTT_CLIENT_ID: emacs-peer-abc123
:MQTT_USERNAME: username
:MQTT_PASSWORD: password
:END:
```

## Protocol Handlers

CanvasL protocol handlers enable RPC commands via URLs:

```org
#+BEGIN_SRC meta-log-mqtt :tangle mqtt://canvasl/peers/announce
{
  "type": "peer_announce",
  "peer_id": "peer-abc123",
  "public_key": "0x...",
  "address": "mqtt://broker.example.com"
}
#+END_SRC
```

## Emacs Server Integration

Multiple `emacsclient` instances can share a blackboard:

```elisp
;; Initialize server coordination
(meta-log-server-init "~/federation-blackboard.org")

;; Register client
(meta-log-server-register-client "client-1")

;; Broadcast message to all clients
(meta-log-server-broadcast "Hello from client 1")

;; Synchronize blackboard
(meta-log-server-sync-blackboard)
```

## Security Considerations

1. **Key Storage**: Encrypt mnemonics and private keys in Org Mode
2. **Message Signing**: All federation messages are signed with BIP32 keys
3. **Peer Verification**: Verify peer identities before accepting connections
4. **Access Control**: Implement peer access control lists

## Examples

See `examples/federation-blackboard.org` and `examples/peer-identity.org` for complete examples.

