;;; meta-log-identity.el --- Peer identity management

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;; meta-log is free software: you can redistribute it and/or modify
;; it under the terms of the MIT License.

;;; Commentary:

;; Peer identity management for meta-log federation.
;; Uses BIP32/39/44 keys for identity and authentication.

;;; Code:

(require 'cl-lib)
(require 'org)
(require 'meta-log-crypto)

(defvar meta-log-identity--current-peer nil
  "Current peer identity.")

(cl-defstruct meta-log-peer-identity
  "Peer identity structure."
  peer-id
  mnemonic
  seed
  private-key
  public-key
  crypto-path
  org-file)

(defun meta-log-identity-create-peer (&optional peer-id org-file)
  "Create a new peer identity.
PEER-ID is optional peer identifier (defaults to generated ID).
ORG-FILE is optional Org file to save identity to.
Returns peer identity structure."
  (interactive)
  (let* ((peer-id (or peer-id (meta-log-identity-generate-peer-id)))
         (mnemonic (meta-log-crypto-generate-mnemonic))
         (seed (meta-log-crypto-mnemonic-to-seed mnemonic))
         (key-pair (meta-log-crypto-derive-meta-log-key seed 0 0 0))
         (private-key (nth 0 key-pair))
         (public-key (nth 1 key-pair))
         (crypto-path "m/44'/meta-log'/0'/0/0")
         (identity (make-meta-log-peer-identity
                    :peer-id peer-id
                    :mnemonic mnemonic
                    :seed seed
                    :private-key private-key
                    :public-key public-key
                    :crypto-path crypto-path
                    :org-file org-file)))
    (when org-file
      (meta-log-identity-save-peer identity org-file))
    (setq meta-log-identity--current-peer identity)
    identity))

(defun meta-log-identity-generate-peer-id ()
  "Generate a unique peer ID.
Returns a string like 'peer-abc123'."
  (let* ((random-bytes (cl-loop for i from 0 below 16
                                collect (random 256)))
         (hex-str (mapconcat (lambda (b) (format "%02x" b)) random-bytes "")))
    (concat "peer-" (substring hex-str 0 6))))

(defun meta-log-identity-save-peer (identity org-file)
  "Save peer identity to Org Mode file.
IDENTITY is a meta-log-peer-identity structure.
ORG-FILE is the path to the Org file."
  (let ((buffer (find-file-noselect org-file)))
    (with-current-buffer buffer
      (goto-char (point-min))
      (unless (re-search-forward "^\\*.*Peer Identity" nil t)
        (goto-char (point-max))
        (insert "\n* Peer Identity\n"))
      (org-back-to-heading)
      (org-set-property "PEER_ID" (meta-log-peer-identity-peer-id identity))
      (org-set-property "PEER_PUBLIC_KEY" (meta-log-crypto-format-key
                                           (meta-log-peer-identity-public-key identity)))
      (org-set-property "CRYPTO_PATH" (meta-log-peer-identity-crypto-path identity))
      (let ((mnemonic-str (mapconcat 'identity
                                     (meta-log-peer-identity-mnemonic identity)
                                     " ")))
        (org-set-property "PEER_MNEMONIC" mnemonic-str))
      (save-buffer))
    (setf (meta-log-peer-identity-org-file identity) org-file)))

(defun meta-log-identity-load-peer (org-file &optional password)
  "Load peer identity from Org Mode file.
ORG-FILE is the path to the Org file.
PASSWORD is optional password for encrypted mnemonic.
Returns peer identity structure."
  (interactive "FOrg file: \nsPassword (optional): ")
  (let ((buffer (find-file-noselect org-file)))
    (with-current-buffer buffer
      (goto-char (point-min))
      (when (re-search-forward "^\\*.*Peer Identity" nil t)
        (let* ((peer-id (org-entry-get (point) "PEER_ID"))
               (public-key-str (org-entry-get (point) "PEER_PUBLIC_KEY"))
               (crypto-path (org-entry-get (point) "CRYPTO_PATH"))
               (mnemonic-str (org-entry-get (point) "PEER_MNEMONIC"))
               (is-encrypted (org-entry-get (point) "PEER_MNEMONIC_ENCRYPTED")))
          (when (and peer-id mnemonic-str)
            (let* ((mnemonic (if (and is-encrypted password)
                                (split-string (meta-log-crypto-decrypt mnemonic-str password) " ")
                              (split-string mnemonic-str " ")))
                   (seed (meta-log-crypto-mnemonic-to-seed mnemonic))
                   (key-pair (meta-log-crypto-derive-meta-log-key seed 0 0 0))
                   (private-key (nth 0 key-pair))
                   (public-key (if public-key-str
                                  (meta-log-crypto-parse-key public-key-str)
                                (nth 1 key-pair)))
                   (identity (make-meta-log-peer-identity
                              :peer-id peer-id
                              :mnemonic mnemonic
                              :seed seed
                              :private-key private-key
                              :public-key public-key
                              :crypto-path (or crypto-path "m/44'/meta-log'/0'/0/0")
                              :org-file org-file)))
              (setq meta-log-identity--current-peer identity)
              identity)))))))

(defun meta-log-identity-sign-message (identity message)
  "Sign a message with peer identity.
IDENTITY is a meta-log-peer-identity structure.
MESSAGE is a string to sign.
Returns signature as hex string."
  (let* ((private-key (meta-log-peer-identity-private-key identity))
         (signature (meta-log-crypto-sign private-key message)))
    (meta-log-crypto-format-key signature)))

(defun meta-log-identity-verify-peer (identity signature message)
  "Verify a peer signature.
IDENTITY is a meta-log-peer-identity structure.
SIGNATURE is a hex string signature.
MESSAGE is the signed message string.
Returns t if signature is valid."
  (let* ((public-key (meta-log-peer-identity-public-key identity))
         (signature-bytes (meta-log-crypto-parse-key signature)))
    (meta-log-crypto-verify public-key signature-bytes message)))

(defun meta-log-identity-get-current-peer ()
  "Get current peer identity.
Returns current peer identity structure or nil."
  meta-log-identity--current-peer)

(defun meta-log-identity-set-current-peer (identity)
  "Set current peer identity.
IDENTITY is a meta-log-peer-identity structure."
  (setq meta-log-identity--current-peer identity))

(defun meta-log-identity-sign-message-current (message)
  "Sign a message with current peer identity.
MESSAGE is a string to sign.
Returns signature as hex string."
  (unless meta-log-identity--current-peer
    (user-error "No current peer identity. Create or load one first."))
  (meta-log-identity-sign-message meta-log-identity--current-peer message))

(defun meta-log-identity-verify-peer-current (signature message)
  "Verify a signature with current peer identity.
SIGNATURE is a hex string signature.
MESSAGE is the signed message string.
Returns t if signature is valid."
  (unless meta-log-identity--current-peer
    (user-error "No current peer identity. Create or load one first."))
  (meta-log-identity-verify-peer meta-log-identity--current-peer signature message))

(defun meta-log-identity-get-peer-id (identity)
  "Get peer ID from identity.
IDENTITY is a meta-log-peer-identity structure.
Returns peer ID string."
  (meta-log-peer-identity-peer-id identity))

(defun meta-log-identity-get-public-key (identity)
  "Get public key from identity.
IDENTITY is a meta-log-peer-identity structure.
Returns public key as hex string."
  (meta-log-crypto-format-key (meta-log-peer-identity-public-key identity)))

(provide 'meta-log-identity)

;;; meta-log-identity.el ends here

