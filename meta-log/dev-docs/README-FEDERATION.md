# Federation Docker Setup

## Quick Start

### 1. Build and Start Services

```bash
cd meta-log
docker-compose up -d
```

This will start:
- MQTT broker (Eclipse Mosquitto) on port 1883
- meta-log Emacs server with federation support

### 2. Run Tests

```bash
# Run shell tests
./test-federation.sh

# Or run Emacs Lisp tests
docker-compose exec meta-log emacs --batch -l test-federation.el -f test-federation-all
```

### 3. Connect via emacsclient

```bash
# Connect to Emacs server
emacsclient -s /tmp/emacs1000/server

# Or execute commands directly
emacsclient -s /tmp/emacs1000/server -e "(meta-log-federation-discover-peers)"
```

## Configuration

### Environment Variables

- `META_LOG_MQTT_BROKER`: MQTT broker URL (default: `mqtt://mqtt-broker:1883`)
- `META_LOG_FEDERATION_BLACKBOARD`: Path to federation blackboard file (default: `/root/federation/blackboard.org`)

### MQTT Broker

The MQTT broker is configured in `mosquitto/config/mosquitto.conf`:
- Port 1883: Standard MQTT
- Port 9001: WebSocket MQTT
- Anonymous access enabled (for testing)

## Testing

### Manual Testing

1. **Create Peer Identity**:
```elisp
(let ((identity (meta-log-identity-create-peer nil "/root/federation/peer-identity.org")))
  (meta-log-identity-set-current-peer identity))
```

2. **Announce Peer**:
```elisp
(meta-log-federation-announce-peer)
```

3. **Discover Peers**:
```elisp
(meta-log-federation-discover-peers)
```

4. **Synchronize Blackboard**:
```elisp
(meta-log-federation-sync-blackboard)
```

### Automated Testing

Run the test suite:
```bash
./test-federation.sh
```

## Troubleshooting

### MQTT Connection Issues

If MQTT tests fail, check:
1. MQTT broker is running: `docker-compose ps mqtt-broker`
2. Broker logs: `docker-compose logs mqtt-broker`
3. Network connectivity: `docker-compose exec meta-log ping mqtt-broker`

### Emacs Server Issues

If emacsclient fails:
1. Check server is running: `docker-compose ps meta-log`
2. Check server logs: `docker-compose logs meta-log`
3. Verify socket: `ls -la /tmp/emacs1000/server`

## Multi-Instance Testing

To test federation between multiple instances:

1. **Start first instance**:
```bash
docker-compose up -d meta-log
```

2. **Start second instance** (different port):
```bash
docker-compose -f docker-compose.yml -f docker-compose.peer2.yml up -d
```

3. **Connect instances** via MQTT and test synchronization

## Files

- `Dockerfile`: Docker image definition
- `docker-compose.yml`: Docker Compose configuration
- `test-federation.sh`: Shell test script
- `test-federation.el`: Emacs Lisp test suite
- `mosquitto/config/mosquitto.conf`: MQTT broker configuration

