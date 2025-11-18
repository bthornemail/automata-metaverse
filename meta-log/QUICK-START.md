# Quick Start Guide

## Standalone Testing (No Docker)

### Prerequisites

```bash
# Install Emacs and dependencies
sudo apt install emacs mosquitto-clients

# Or just Emacs (MQTT tests will be skipped)
sudo apt install emacs
```

### Run Tests

```bash
cd meta-log
./test-federation.sh
```

Expected output:
```
=== Testing meta-log Federation ===
✓ Crypto module: mnemonic generation works
✓ Identity module: peer creation works
✓ Federation: blackboard creation works
```

## Docker Testing

### Prerequisites

- Docker and Docker Compose installed

### Run Tests

```bash
cd meta-log

# Build and start services
docker compose up -d

# Wait for services to start
sleep 10

# Run tests
docker compose exec meta-log bash -c "cd /root/.emacs.d/meta-log && emacs --batch -eval \"(add-to-list 'load-path \\\"/root/.emacs.d/meta-log\\\")\" -l test-federation.el -f test-federation-all"

# Stop services
docker compose down
```

## Manual Testing

### Test Crypto Module

```bash
emacs --batch \
  -eval "(add-to-list 'load-path \".\")" \
  -eval "(require 'meta-log-crypto)" \
  -eval "(let ((mnemonic (meta-log-crypto-generate-mnemonic 128))) (princ (format \"Mnemonic: %s\\n\" (mapconcat 'identity mnemonic \" \"))) (princ \"OK\"))"
```

### Test Identity Module

```bash
emacs --batch \
  -eval "(add-to-list 'load-path \".\")" \
  -eval "(require 'meta-log-identity)" \
  -eval "(let ((identity (meta-log-identity-create-peer))) (princ (format \"Peer ID: %s\\n\" (meta-log-identity-get-peer-id identity))) (princ \"OK\"))"
```

### Test Federation Blackboard

```bash
emacs --batch \
  -eval "(add-to-list 'load-path \".\")" \
  -eval "(require 'meta-log-federation)" \
  -eval "(meta-log-federation-create-blackboard \"/tmp/test-blackboard.org\")" \
  -eval "(princ \"Blackboard created\\n\")"
```

## Next Steps

1. **Enable Federation**: Set `META_LOG_ENABLE_FEDERATION=1` in Docker environment
2. **Configure MQTT**: Set `META_LOG_MQTT_BROKER` environment variable
3. **Create Peer Identity**: Use `meta-log-identity-create-peer` interactively
4. **Connect Peers**: Use `meta-log-federation-connect-to-peer`

See `docs/FEDERATION_GUIDE.md` for complete documentation.


