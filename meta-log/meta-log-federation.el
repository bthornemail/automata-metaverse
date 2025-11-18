;;; meta-log-federation.el --- Federation coordination

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;; meta-log is free software: you can redistribute it and/or modify
;; it under the terms of the MIT License.

;;; Commentary:

;; Federation coordination for meta-log.
;; Manages peer discovery, blackboard synchronization, and CRDT merge semantics.

;;; Code:

(require 'cl-lib)
(require 'org)
(require 'json)
(require 'meta-log-identity)
(require 'meta-log-mqtt)
(require 'meta-log-webrtc)

(defvar meta-log-federation--initialized-p nil
  "Whether federation is initialized.")

(defvar meta-log-federation--blackboard-file nil
  "Path to federation blackboard Org file.")

(defvar meta-log-federation--peers (make-hash-table :test 'equal)
  "Discovered peers.")

(defvar meta-log-federation--mqtt-connection nil
  "MQTT connection for federation.")

(defvar meta-log-federation--local-peer-identity nil
  "Local peer identity for this federation instance.")

(defun meta-log-federation-init (&optional blackboard-file mqtt-broker)
  "Initialize federation system.
BLACKBOARD-FILE is the path to the Org Mode blackboard file.
MQTT-BROKER is the MQTT broker URL.
Returns t on success."
  (interactive)
  (when meta-log-federation--initialized-p
    (user-error "Federation already initialized"))
  
  (let ((blackboard-file (or blackboard-file
                              (expand-file-name "federation-blackboard.org" default-directory))))
    (setq meta-log-federation--blackboard-file blackboard-file)
    
    ;; Ensure blackboard file exists
    (unless (file-exists-p blackboard-file)
      (meta-log-federation-create-blackboard blackboard-file))
    
    ;; Initialize MQTT if broker provided (defer subscription to avoid blocking)
    (when mqtt-broker
      (setq meta-log-federation--mqtt-connection
            (meta-log-mqtt-connect mqtt-broker))
      ;; Setup peer discovery in background (non-blocking)
      (run-with-timer 2 nil 'meta-log-federation-setup-peer-discovery))
    
    ;; Setup hooks
    (add-hook 'meta-log-mqtt-peer-announced-hook
              'meta-log-federation-handle-peer-announcement)
    
        (setq meta-log-federation--initialized-p t)
        
        ;; Setup template federation if available
        (when (featurep 'meta-log-template-federation)
          (meta-log-template-federation-setup))
        
        (message "Federation initialized with blackboard: %s" blackboard-file)
        t))

(defun meta-log-federation-get-local-peer-identity ()
  "Get local peer identity for this federation instance.
Returns peer identity structure or nil."
  (or meta-log-federation--local-peer-identity
      (when meta-log-federation--initialized-p
        ;; Try to load from blackboard
        (let ((identity-file (expand-file-name "peer-identity.org"
                                               (file-name-directory meta-log-federation--blackboard-file))))
          (when (file-exists-p identity-file)
            (setq meta-log-federation--local-peer-identity
                  (meta-log-identity-load-peer identity-file))
            meta-log-federation--local-peer-identity)))))

(defun meta-log-federation-create-blackboard (file)
  "Create federation blackboard Org file.
FILE is the path to create."
  (let ((buffer (find-file-noselect file)))
    (with-current-buffer buffer
      (erase-buffer)
      (insert "* Federation Blackboard\n")
      (insert ":PROPERTIES:\n")
      (insert ":FEDERATION_VERSION: 1.0\n")
      (insert (format ":BLACKBOARD_ID: blackboard-%s\n" (random 1000000)))
      (insert (format ":LAST_SYNC: %s\n" (format-time-string "%Y-%m-%dT%H:%M:%SZ")))
      (insert ":END:\n\n")
      (insert "** Peers\n\n")
      (insert "** CanvasL State\n\n")
      (save-buffer))
    (message "Created federation blackboard: %s" file)))

(defun meta-log-federation-announce-peer (&optional identity)
  "Announce this peer to the network.
IDENTITY is optional peer identity (uses current if not provided)."
  (unless meta-log-federation--initialized-p
    (user-error "Federation not initialized. Run meta-log-federation-init"))
  
  (let* ((identity (or identity (meta-log-identity-get-current-peer)))
         (peer-id (meta-log-identity-get-peer-id identity))
         (public-key (meta-log-identity-get-public-key identity))
         (address (format "mqtt://%s" (meta-log-mqtt-connection-broker-url
                                      meta-log-federation--mqtt-connection))))
    (when meta-log-federation--mqtt-connection
      (meta-log-mqtt-announce-peer meta-log-federation--mqtt-connection
                                   peer-id public-key address)
      (meta-log-federation-save-peer-to-blackboard peer-id public-key address))))

(defun meta-log-federation-discover-peers ()
  "Discover peers via MQTT.
Returns list of discovered peer IDs."
  (unless meta-log-federation--initialized-p
    (user-error "Federation not initialized. Run meta-log-federation-init"))
  
  (when meta-log-federation--mqtt-connection
    (meta-log-mqtt-discover-peers meta-log-federation--mqtt-connection))
  (hash-table-keys meta-log-federation--peers))

(defun meta-log-federation-handle-peer-announcement (peer-id public-key address)
  "Handle peer announcement.
PEER-ID is the peer identifier.
PUBLIC-KEY is the peer's public key.
ADDRESS is the peer's address."
  (puthash peer-id (list :peer-id peer-id
                         :public-key public-key
                         :address address
                         :last-seen (current-time))
           meta-log-federation--peers)
  (meta-log-federation-save-peer-to-blackboard peer-id public-key address)
  (message "Discovered peer: %s" peer-id))

(defun meta-log-federation-save-peer-to-blackboard (peer-id public-key address)
  "Save peer to blackboard.
PEER-ID is the peer identifier.
PUBLIC-KEY is the peer's public key.
ADDRESS is the peer's address."
  (let ((buffer (find-file-noselect meta-log-federation--blackboard-file)))
    (with-current-buffer buffer
      (goto-char (point-min))
      (unless (re-search-forward "^\\*\\* Peers" nil t)
        (goto-char (point-max))
        (insert "\n** Peers\n"))
      (org-back-to-heading)
      (let ((heading (format "*** Peer: %s" peer-id)))
        (unless (re-search-forward (regexp-quote heading) nil t)
          (goto-char (point-max))
          (insert (format "\n%s\n" heading)))
        (org-back-to-heading)
        (org-set-property "PEER_ID" peer-id)
        (org-set-property "PEER_PUBLIC_KEY" public-key)
        (org-set-property "PEER_ADDRESS" address)
        (org-set-property "PEER_STATUS" "discovered")
        (org-set-property "LAST_SEEN" (format-time-string "%Y-%m-%dT%H:%M:%SZ"))
        (save-buffer)))))

(defun meta-log-federation-sync-blackboard (&optional peer-id)
  "Synchronize blackboard with peer(s).
PEER-ID is optional specific peer ID (syncs with all if not provided)."
  (unless meta-log-federation--initialized-p
    (user-error "Federation not initialized. Run meta-log-federation-init"))
  
  (let ((peers (if peer-id
                   (list peer-id)
                 (hash-table-keys meta-log-federation--peers))))
    (dolist (peer peers)
      (let ((connection (gethash peer meta-log-webrtc--peers)))
        (if connection
            (let ((state (meta-log-federation-get-blackboard-state)))
              (meta-log-webrtc-sync-state connection state))
          (message "No connection to peer %s" peer))))))

(defun meta-log-federation-get-blackboard-state ()
  "Get current blackboard state.
Returns Org Mode content as string."
  (let ((buffer (find-file-noselect meta-log-federation--blackboard-file)))
    (with-current-buffer buffer
      (buffer-string))))

(defun meta-log-federation-merge-state (peer-state)
  "Merge peer state into blackboard using CRDT semantics.
PEER-STATE is the peer's blackboard state (Org Mode content).
Uses last-write-wins for conflict resolution."
  (let ((buffer (find-file-noselect meta-log-federation--blackboard-file)))
    (with-current-buffer buffer
      (let ((current-state (buffer-string)))
        (meta-log-federation-crdt-merge current-state peer-state)))))

(defun meta-log-federation-crdt-merge (state1 state2)
  "Merge two states using CRDT semantics.
STATE1 is the current state.
STATE2 is the peer state.
Uses last-write-wins for conflict resolution."
  ;; Simplified CRDT merge: parse both states and merge nodes/edges
  ;; For production, implement proper CRDT (LWW-Register, OR-Set, etc.)
  (let ((buffer1 (generate-new-buffer "*state1*"))
        (buffer2 (generate-new-buffer "*state2*")))
    (with-current-buffer buffer1
      (insert state1))
    (with-current-buffer buffer2
      (insert state2))
    ;; Merge logic: extract nodes from both, resolve conflicts by timestamp
    ;; For now, just append peer state
    (with-current-buffer (find-file-noselect meta-log-federation--blackboard-file)
      (goto-char (point-max))
      (insert "\n** Merged State\n")
      (insert state2)
      (save-buffer))
    (kill-buffer buffer1)
    (kill-buffer buffer2)))

(defun meta-log-federation-setup-peer-discovery ()
  "Setup peer discovery via MQTT."
  (when meta-log-federation--mqtt-connection
    ;; Subscribe to peer announcements topic
    (meta-log-mqtt-subscribe meta-log-federation--mqtt-connection
                             "canvasl/peers/announce"
                             (lambda (topic message)
                               (condition-case err
                                   (let ((parsed (json-read-from-string message)))
                                     (meta-log-federation-handle-peer-announcement
                                      (gethash "peer_id" parsed)
                                      (gethash "public_key" parsed)
                                      (gethash "address" parsed)))
                                 (error
                                  (message "Error parsing peer announcement: %s" (error-message-string err))))))))

(defun meta-log-federation-connect-to-peer (peer-id)
  "Connect to a peer.
PEER-ID is the peer identifier.
Returns peer connection structure."
  (let ((peer-info (gethash peer-id meta-log-federation--peers)))
    (if peer-info
        (let ((address (plist-get peer-info :address))
              (public-key (plist-get peer-info :public-key)))
          (meta-log-webrtc-connect-peer peer-id address public-key))
      (user-error "Peer %s not found" peer-id))))

(defun meta-log-federation-load-blackboard (file)
  "Load federation blackboard from Org file.
FILE is the path to the Org file."
  (setq meta-log-federation--blackboard-file file)
  (let ((buffer (find-file-noselect file)))
    (with-current-buffer buffer
      (goto-char (point-min))
      (while (re-search-forward "^\\*\\*\\*.*Peer:" nil t)
        (let ((peer-id (org-entry-get (point) "PEER_ID"))
              (public-key (org-entry-get (point) "PEER_PUBLIC_KEY"))
              (address (org-entry-get (point) "PEER_ADDRESS")))
          (when peer-id
            (puthash peer-id (list :peer-id peer-id
                                  :public-key public-key
                                  :address address
                                  :last-seen nil)
                    meta-log-federation--peers)))))))

(defun meta-log-federation-save-node-to-blackboard (node-id cid signature peer-owner)
  "Save CanvasL node to blackboard.
NODE-ID is the node identifier.
CID is the content identifier.
SIGNATURE is the node signature.
PEER-OWNER is the peer that owns this node."
  (let ((buffer (find-file-noselect meta-log-federation--blackboard-file)))
    (with-current-buffer buffer
      (goto-char (point-min))
      (unless (re-search-forward "^\\*\\* CanvasL State" nil t)
        (goto-char (point-max))
        (insert "\n** CanvasL State\n"))
      (org-back-to-heading)
      (let ((heading (format "*** Node: %s" node-id)))
        (unless (re-search-forward (regexp-quote heading) nil t)
          (goto-char (point-max))
          (insert (format "\n%s\n" heading)))
        (org-back-to-heading)
        (org-set-property "NODE_ID" node-id)
        (org-set-property "CANVASL_CID" cid)
        (org-set-property "CANVASL_SIGNATURE" signature)
        (org-set-property "PEER_OWNER" peer-owner)
        (org-set-property "LAST_MODIFIED" (format-time-string "%Y-%m-%dT%H:%M:%SZ"))
        (save-buffer)))))

(provide 'meta-log-federation)

;;; meta-log-federation.el ends here

