# Protocol Handler Reference

Reference for CanvasL protocol handlers in meta-log.

## Overview

meta-log supports protocol handlers for executing commands via URLs:

- `canvasl://` - CanvasL RPC commands
- `webrtc://` - WebRTC peer connections
- `mqtt://` - MQTT messaging

## CanvasL Protocol

Execute R5RS functions via `canvasl://` URLs:

```elisp
;; Execute R5RS function
(meta-log-protocol-handle-url "canvasl://r5rs:church-add/2/3")
```

## WebRTC Protocol

Connect to peers via `webrtc://` URLs:

```elisp
;; Connect to peer
(meta-log-protocol-handle-url "webrtc://peer-abc123")
```

## MQTT Protocol

Publish messages via `mqtt://` URLs:

```elisp
;; Publish message to topic
(meta-log-protocol-handle-url "mqtt://canvasl/peers/announce/{\"type\":\"peer_announce\"}")
```

## Org Mode Integration

Use protocol handlers in Org Mode source blocks:

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

## Custom Handlers

Register custom protocol handlers:

```elisp
;; Register custom handler
(meta-log-protocol-register-handler "custom"
  (lambda (url path)
    (message "Handling custom://%s" path)))
```

## Examples

See `examples/federation-blackboard.org` for complete examples.

