# Cryptographic Operations Guide

Guide for using BIP32/39/44 cryptographic operations in meta-log.

## Overview

meta-log implements BIP32/39/44 for hierarchical deterministic (HD) wallet key derivation:

- **BIP39**: Mnemonic phrase generation and validation
- **BIP32**: HD key derivation from seed
- **BIP44**: Multi-account hierarchy for different purposes

## Mnemonic Generation

Generate a BIP39 mnemonic phrase:

```elisp
;; Generate 12-word mnemonic (128 bits entropy)
(let ((mnemonic (meta-log-crypto-generate-mnemonic 128)))
  (message "Mnemonic: %s" (mapconcat 'identity mnemonic " ")))
```

## Seed Derivation

Convert mnemonic to seed:

```elisp
(let* ((mnemonic '("abandon" "ability" "able" ...))
       (seed (meta-log-crypto-mnemonic-to-seed mnemonic)))
  (message "Seed: %s" (meta-log-crypto-format-key seed)))
```

## Key Derivation

Derive keys using BIP32/44:

```elisp
;; Derive meta-log key
(let* ((seed (meta-log-crypto-mnemonic-to-seed mnemonic))
       (key-pair (meta-log-crypto-derive-meta-log-key seed 0 0 0))
       (private-key (nth 0 key-pair))
       (public-key (nth 1 key-pair)))
  (message "Public key: %s" (meta-log-crypto-format-key public-key)))

;; Derive Ethereum key
(let ((ethereum-key (meta-log-crypto-derive-ethereum-key seed 0 0 0)))
  (message "Ethereum key: %s" (meta-log-crypto-format-key (nth 1 ethereum-key))))

;; Derive Bitcoin key
(let ((bitcoin-key (meta-log-crypto-derive-bitcoin-key seed 0 0 0)))
  (message "Bitcoin key: %s" (meta-log-crypto-format-key (nth 1 bitcoin-key))))
```

## BIP44 Paths

BIP44 paths follow the format: `m/purpose'/coin_type'/account'/change/address_index`

- **Purpose**: 44 for BIP44
- **Coin Type**: 0 for Bitcoin, 60 for Ethereum, 'meta-log' for meta-log
- **Account**: Account index (hardened)
- **Change**: 0 for external, 1 for internal
- **Address Index**: Address index

Examples:

- `m/44'/60'/0'/0/0` - Ethereum account 0, external, address 0
- `m/44'/0'/0'/0/0` - Bitcoin account 0, external, address 0
- `m/44'/meta-log'/0'/0/0` - meta-log account 0, external, address 0

## Message Signing

Sign a message with a private key:

```elisp
(let* ((private-key (nth 0 key-pair))
       (message "Hello, world!")
       (signature (meta-log-crypto-sign private-key message)))
  (message "Signature: %s" (meta-log-crypto-format-key signature)))
```

## Signature Verification

Verify a signature:

```elisp
(let* ((public-key (nth 1 key-pair))
       (signature (meta-log-crypto-parse-key signature-hex))
       (message "Hello, world!")
       (valid (meta-log-crypto-verify public-key signature message)))
  (if valid
      (message "Signature is valid")
    (message "Signature is invalid")))
```

## Org Mode Integration

Save mnemonic to Org Mode:

```elisp
(meta-log-crypto-save-mnemonic-to-org mnemonic "~/peer-identity.org" "password")
```

Load mnemonic from Org Mode:

```elisp
(let ((mnemonic (meta-log-crypto-load-mnemonic-from-org "~/peer-identity.org" "password")))
  (message "Loaded mnemonic: %s" mnemonic))
```

Save keys to Org Mode:

```elisp
(let ((keys (list (list "m/44'/meta-log'/0'/0/0" private-key public-key))))
  (meta-log-crypto-save-keys-to-org keys "~/peer-identity.org"))
```

Load keys from Org Mode:

```elisp
(let ((keys (meta-log-crypto-load-keys-from-org "~/peer-identity.org")))
  (dolist (key keys)
    (message "Path: %s, Public key: %s" (nth 0 key) (meta-log-crypto-format-key (nth 2 key)))))
```

## Security Best Practices

1. **Encrypt Mnemonics**: Always encrypt mnemonics when storing in Org Mode
2. **Protect Private Keys**: Never share private keys
3. **Use Strong Passwords**: Use strong passwords for encryption
4. **Backup Mnemonics**: Backup mnemonics securely (offline storage)

## Examples

See `examples/peer-identity.org` for complete examples.

