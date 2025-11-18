# Peer-to-Peer CanvasL Synchronization Guide

This guide demonstrates how to use federation features for peer-to-peer CanvasL synchronization.

## Overview

The federation system enables:
- **Peer Discovery**: Find other peers via MQTT
- **CanvasL Sync**: Synchronize CanvasL files between peers
- **Message Signing**: Cryptographic verification of sync messages
- **Blackboard Sharing**: Shared federation blackboard for coordination

## Setup

### 1. Initialize Demo

```elisp
(require 'meta-log-peer-sync-demo)
(meta-log-peer-sync-demo-init)
```

This will:
- Create or load a peer identity
- Initialize federation with MQTT broker
- Announce your peer to the network

### 2. Discover Peers

```elisp
(meta-log-peer-sync-demo-discover-peers)
```

Lists all discovered peers on the network.

### 3. Sync CanvasL File

```elisp
(meta-log-peer-sync-demo-sync-canvasl "/path/to/file.canvasl")
```

This will:
- Read the CanvasL file
- Create a signed sync message
- Publish to MQTT topic `canvasl/sync`
- Other peers will receive and verify the sync

### 4. Connect to Specific Peer

```elisp
(meta-log-peer-sync-demo-connect-peer "peer-abc123")
```

Establishes direct connection to a peer (for WebRTC sync).

## Architecture

### MQTT Topics

- `canvasl/peers/announce`: Peer announcements
- `canvasl/sync`: CanvasL file synchronization
- `canvasl/peers/{peer-id}/messages`: Peer-specific messages

### Message Format

```json
{
  "type": "canvasl-sync",
  "peer_id": "peer-abc123",
  "file": "example.canvasl",
  "content": "...",
  "timestamp": "2025-01-07T12:00:00Z",
  "signature": "0x..."
}
```

### Sync Flow

1. **Publish**: Peer A publishes CanvasL sync message to `canvasl/sync`
2. **Receive**: Peer B receives message via MQTT subscription
3. **Verify**: Peer B verifies signature using peer A's public key
4. **Save**: If valid, save synced file to `~/.emacs.d/meta-log/synced/`

## Example Workflow

### Peer A (Publisher)

```elisp
;; Initialize
(meta-log-peer-sync-demo-init)

;; Sync a CanvasL file
(meta-log-peer-sync-demo-sync-canvasl "~/my-canvas.canvasl")
```

### Peer B (Subscriber)

```elisp
;; Initialize
(meta-log-peer-sync-demo-init)

;; Discover peers
(meta-log-peer-sync-demo-discover-peers)
;; => Found 1 peer(s):
;;    - peer-abc123

;; Sync messages are automatically received and saved
;; Check synced files in ~/.emacs.d/meta-log/synced/
```

## Docker Setup

### Start Federation Services

```bash
cd meta-log
docker compose up -d
```

This starts:
- MQTT broker on port 1883
- meta-log Emacs server with federation enabled

### Connect Multiple Peers

```bash
# Terminal 1: Peer A
docker compose exec meta-log emacsclient -s /tmp/emacs1000/server

# Terminal 2: Peer B (if running multiple instances)
docker compose exec meta-log emacsclient -s /tmp/emacs1000/server
```

## Advanced Features

### Custom Sync Handlers

```elisp
(add-hook 'meta-log-mqtt-message-received-hook
          (lambda (topic message)
            (when (string-match-p "^canvasl/sync" topic)
              ;; Custom handling
              (message "Received sync: %s" message))))
```

### WebRTC Direct Connection

```elisp
;; Connect via WebRTC for faster sync
(let ((peer-id "peer-abc123"))
  (meta-log-webrtc-connect-peer peer-id)
  (meta-log-webrtc-send-message peer-id "canvasl-sync" canvasl-content))
```

### Blackboard Synchronization

```elisp
;; Sync federation blackboard with peers
(meta-log-federation-sync-blackboard)
```

## Troubleshooting

### MQTT Connection Issues

```elisp
;; Check MQTT connection status
(if meta-log-federation--mqtt-connection
    (message "MQTT connected: %s"
             (meta-log-mqtt-connection-broker-url
              meta-log-federation--mqtt-connection))
  (message "MQTT not connected"))
```

### Peer Discovery Issues

```elisp
;; Manually announce peer
(let ((peer-id (meta-log-identity-get-peer-id meta-log-peer-sync-demo--identity))
      (public-key (meta-log-identity-get-public-key meta-log-peer-sync-demo--identity)))
  (meta-log-federation-announce-peer peer-id public-key))
```

### Signature Verification

```elisp
;; Verify a message signature
(let ((peer (gethash "peer-abc123" meta-log-federation--peers))
      (signature "0x...")
      (message "test message"))
  (meta-log-identity-verify-peer peer signature message))
```

## Security Considerations

1. **Message Signing**: All sync messages are cryptographically signed
2. **Peer Verification**: Peers are verified using public keys
3. **MQTT Authentication**: Use MQTT username/password for broker access
4. **Encrypted Storage**: Peer identities stored with encryption

## Next Steps

- **Multi-Peer Sync**: Extend to support multiple peers simultaneously
- **Conflict Resolution**: Implement CRDT merge for conflicting changes
- **WebRTC Optimization**: Use WebRTC for faster direct peer connections
- **Blackboard CRDT**: Implement CRDT merge for federation blackboard

