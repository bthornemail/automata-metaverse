;;; peer-sync-demo.el --- Peer-to-peer CanvasL synchronization demo

;; This demo shows how to use federation features for peer-to-peer
;; CanvasL synchronization using MQTT and WebRTC.

(require 'meta-log-federation)
(require 'meta-log-identity)
(require 'meta-log-mqtt)
(require 'meta-log-protocol)

(defun meta-log-peer-sync-demo-init ()
  "Initialize peer synchronization demo.
Creates a peer identity, connects to federation, and sets up sync."
  (interactive)
  
  ;; Step 1: Create or load peer identity
  (let ((identity-file "~/.emacs.d/meta-log/peer-identity.org"))
    (if (file-exists-p identity-file)
        (progn
          (message "Loading existing peer identity...")
          (setq meta-log-peer-sync-demo--identity
                (meta-log-identity-load-peer identity-file)))
      (progn
        (message "Creating new peer identity...")
        (setq meta-log-peer-sync-demo--identity
              (meta-log-identity-create-peer))
        (meta-log-identity-save-peer meta-log-peer-sync-demo--identity
                                     identity-file))))
  
  ;; Step 2: Initialize federation
  (let ((blackboard "~/.emacs.d/meta-log/federation-blackboard.org")
        (mqtt-broker (or (getenv "META_LOG_MQTT_BROKER")
                         "mqtt://localhost:1883")))
    (message "Initializing federation with broker: %s" mqtt-broker)
    (meta-log-federation-init blackboard mqtt-broker)
    
    ;; Announce peer
    (let ((peer-id (meta-log-identity-get-peer-id meta-log-peer-sync-demo--identity))
          (public-key (meta-log-identity-get-public-key meta-log-peer-sync-demo--identity)))
      (meta-log-federation-announce-peer peer-id public-key)))
  
  (message "Peer synchronization demo initialized!")
  (message "Peer ID: %s" (meta-log-identity-get-peer-id meta-log-peer-sync-demo--identity)))

(defun meta-log-peer-sync-demo-sync-canvasl (canvasl-file)
  "Synchronize a CanvasL file with peers.
CANVASL-FILE is the path to the CanvasL file to sync."
  (interactive "fCanvasL file to sync: ")
  
  (unless meta-log-peer-sync-demo--identity
    (user-error "Demo not initialized. Run meta-log-peer-sync-demo-init first"))
  
  ;; Read CanvasL file
  (let ((canvasl-content (with-temp-buffer
                           (insert-file-contents canvasl-file)
                           (buffer-string))))
    
    ;; Create sync message
    (let ((sync-message (list
                         (cons 'type "canvasl-sync")
                         (cons 'peer-id (meta-log-identity-get-peer-id meta-log-peer-sync-demo--identity))
                         (cons 'file (file-name-nondirectory canvasl-file))
                         (cons 'content canvasl-content)
                         (cons 'timestamp (format-time-string "%Y-%m-%dT%H:%M:%SZ")))))
      
      ;; Sign message
      (let ((signature (meta-log-identity-sign-message
                        meta-log-peer-sync-demo--identity
                        (json-encode sync-message))))
        
        ;; Publish to MQTT
        (when meta-log-federation--mqtt-connection
          (meta-log-mqtt-publish meta-log-federation--mqtt-connection
                                 "canvasl/sync"
                                 (json-encode (append sync-message
                                                     (list (cons 'signature signature)))))
          (message "CanvasL file synced: %s" canvasl-file))
        
        (message "Sync message created and signed")))))

(defun meta-log-peer-sync-demo-discover-peers ()
  "Discover other peers via MQTT."
  (interactive)
  
  (unless meta-log-federation--initialized-p
    (user-error "Federation not initialized. Run meta-log-peer-sync-demo-init first"))
  
  (let ((peers (meta-log-federation-discover-peers)))
    (if peers
        (progn
          (message "Found %d peer(s):" (length peers))
          (dolist (peer peers)
            (message "  - %s" peer)))
      (message "No peers found"))))

(defun meta-log-peer-sync-demo-connect-peer (peer-id)
  "Connect to a specific peer.
PEER-ID is the peer identifier."
  (interactive "sPeer ID: ")
  
  (let ((connection (meta-log-federation-connect-to-peer peer-id)))
    (if connection
        (message "Connected to peer: %s" peer-id)
      (message "Failed to connect to peer: %s" peer-id))))

(defun meta-log-peer-sync-demo-handle-sync-message (message)
  "Handle incoming CanvasL sync message.
MESSAGE is the JSON-encoded sync message."
  (let ((parsed (json-read-from-string message)))
    (let ((peer-id (gethash "peer_id" parsed))
          (file (gethash "file" parsed))
          (content (gethash "content" parsed))
          (signature (gethash "signature" parsed)))
      
      ;; Verify signature
      (let ((message-without-sig (copy-hash-table parsed)))
        (remhash "signature" message-without-sig)
        (let ((valid (meta-log-identity-verify-peer
                      (gethash peer-id meta-log-federation--peers)
                      signature
                      (json-encode message-without-sig))))
          
          (if valid
              (progn
                ;; Save synced file
                (let ((sync-dir "~/.emacs.d/meta-log/synced/")
                      (sync-file (concat sync-dir file)))
                  (make-directory sync-dir t)
                  (with-temp-file sync-file
                    (insert content))
                  (message "Synced CanvasL file from peer %s: %s" peer-id file))
            (message "Invalid signature from peer %s" peer-id))))))))

;; Setup handler for sync messages
(add-hook 'meta-log-mqtt-message-received-hook
          (lambda (topic message)
            (when (string-match-p "^canvasl/sync" topic)
              (meta-log-peer-sync-demo-handle-sync-message message))))

(provide 'meta-log-peer-sync-demo)


