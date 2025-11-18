;;; meta-log-webrtc.el --- WebRTC/TCP peer synchronization

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;; meta-log is free software: you can redistribute it and/or modify
;; it under the terms of the MIT License.

;;; Commentary:

;; WebRTC/TCP peer synchronization for meta-log federation.
;; Uses TCP as fallback since WebRTC is browser-specific.

;;; Code:

(require 'cl-lib)
(require 'org)
(require 'json)
(require 'meta-log-mqtt)
(require 'meta-log-identity)

(defvar meta-log-webrtc--peers (make-hash-table :test 'equal)
  "Active peer connections.")

(defvar meta-log-webrtc--signaling-channel nil
  "MQTT connection for WebRTC signaling.")

(cl-defstruct meta-log-peer-connection
  "Peer connection structure."
  peer-id
  address
  public-key
  connection-status
  last-sync
  process
  buffer)

(defun meta-log-webrtc-connect-peer (peer-id address public-key)
  "Connect to a peer via TCP (WebRTC fallback).
PEER-ID is the peer identifier.
ADDRESS is the peer address (host:port).
PUBLIC-KEY is the peer's public key.
Returns peer connection structure."
  (let* ((address-parts (split-string address ":"))
         (host (car address-parts))
         (port (string-to-number (cadr address-parts)))
         (connection (make-meta-log-peer-connection
                      :peer-id peer-id
                      :address address
                      :public-key public-key
                      :connection-status "connecting"
                      :last-sync nil
                      :process nil
                      :buffer nil)))
    (condition-case err
        (let ((process (open-network-stream
                        (format "peer-%s" peer-id)
                        nil
                        host
                        port
                        :type 'plain)))
          (set-process-filter process 'meta-log-webrtc-process-filter)
          (set-process-sentinel process 'meta-log-webrtc-process-sentinel)
          (setf (meta-log-peer-connection-process connection) process)
          (setf (meta-log-peer-connection-connection-status connection) "connected")
          (puthash peer-id connection meta-log-webrtc--peers)
          connection)
      (error
       (setf (meta-log-peer-connection-connection-status connection) "failed")
       (message "Failed to connect to peer %s: %s" peer-id (error-message-string err))
       connection))))

(defun meta-log-webrtc-process-filter (process output)
  "Process filter for peer connection.
PROCESS is the network process.
OUTPUT is the process output."
  (when output
    (let* ((peer-id (meta-log-webrtc-get-peer-id-from-process process))
           (connection (gethash peer-id meta-log-webrtc--peers)))
      (when connection
        (let ((buffer (meta-log-peer-connection-buffer connection)))
          (if buffer
              (with-current-buffer buffer
                (goto-char (point-max))
                (insert output))
            (let ((new-buffer (generate-new-buffer (format "*peer-%s*" peer-id))))
              (setf (meta-log-peer-connection-buffer connection) new-buffer)
              (with-current-buffer new-buffer
                (insert output)))))
        (meta-log-webrtc-handle-message connection output)))))

(defun meta-log-webrtc-process-sentinel (process event)
  "Process sentinel for peer connection.
PROCESS is the network process.
EVENT is the process event."
  (let* ((peer-id (meta-log-webrtc-get-peer-id-from-process process))
         (connection (gethash peer-id meta-log-webrtc--peers)))
    (when connection
      (setf (meta-log-peer-connection-connection-status connection) "disconnected")
      (message "Peer %s disconnected: %s" peer-id event))))

(defun meta-log-webrtc-get-peer-id-from-process (process)
  "Get peer ID from process name.
PROCESS is the network process.
Returns peer ID string."
  (let ((process-name (process-name process)))
    (when (string-match "peer-\\(.+\\)" process-name)
      (match-string 1 process-name))))

(defun meta-log-webrtc-send-message (connection message)
  "Send message to peer.
CONNECTION is a meta-log-peer-connection structure.
MESSAGE is a string or JSON object."
  (let* ((process (meta-log-peer-connection-process connection))
         (message-str (if (stringp message)
                          message
                        (json-encode message))))
    (when (and process (process-live-p process))
      (process-send-string process (concat message-str "\n")))))

(defun meta-log-webrtc-handle-signal (signal-message)
  "Handle WebRTC signaling message via MQTT.
SIGNAL-MESSAGE is a parsed JSON message."
  (let ((type (gethash "type" signal-message))
        (from (gethash "from" signal-message))
        (to (gethash "to" signal-message))
        (sdp (gethash "sdp" signal-message))
        (candidate (gethash "candidate" signal-message)))
    (cond
     ((equal type "offer")
      (meta-log-webrtc-handle-offer from to sdp))
     ((equal type "answer")
      (meta-log-webrtc-handle-answer from to sdp))
     ((equal type "ice-candidate")
      (meta-log-webrtc-handle-ice-candidate from to candidate))
     (t
      (message "Unknown signaling message type: %s" type)))))

(defun meta-log-webrtc-handle-offer (from to sdp)
  "Handle WebRTC offer.
FROM is the sender peer ID.
TO is the recipient peer ID.
SDP is the SDP offer."
  (message "Received offer from %s" from)
  ;; For TCP fallback, we just establish direct connection
  (let ((connection (gethash from meta-log-webrtc--peers)))
    (unless connection
      (meta-log-webrtc-connect-peer from (format "%s:8080" from) nil))))

(defun meta-log-webrtc-handle-answer (from to sdp)
  "Handle WebRTC answer.
FROM is the sender peer ID.
TO is the recipient peer ID.
SDP is the SDP answer."
  (message "Received answer from %s" from))

(defun meta-log-webrtc-handle-ice-candidate (from to candidate)
  "Handle ICE candidate.
FROM is the sender peer ID.
TO is the recipient peer ID.
CANDIDATE is the ICE candidate."
  (message "Received ICE candidate from %s" from))

(defun meta-log-webrtc-sync-state (connection state)
  "Synchronize blackboard state with peer.
CONNECTION is a meta-log-peer-connection structure.
STATE is the state to sync (Org Mode content or JSON)."
  (let ((message (json-encode
                  `((type . "state_sync")
                    (state . ,state)
                    (timestamp . ,(format-time-string "%Y-%m-%dT%H:%M:%SZ"))))))
    (meta-log-webrtc-send-message connection message)
    (setf (meta-log-peer-connection-last-sync connection) (current-time))))

(defun meta-log-webrtc-handle-message (connection message-str)
  "Handle message from peer.
CONNECTION is a meta-log-peer-connection structure.
MESSAGE-STR is the message string."
  (condition-case err
      (let ((message (json-read-from-string message-str)))
        (let ((type (gethash "type" message)))
          (cond
           ((equal type "state_sync")
            (meta-log-webrtc-handle-state-sync connection message))
           ((equal type "state_request")
            (meta-log-webrtc-handle-state-request connection))
           (t
            (message "Unknown message type from peer %s: %s"
                     (meta-log-peer-connection-peer-id connection) type)))))
    (error
     (message "Error parsing message from peer %s: %s"
              (meta-log-peer-connection-peer-id connection)
              (error-message-string err)))))

(defun meta-log-webrtc-handle-state-sync (connection message)
  "Handle state synchronization message.
CONNECTION is a meta-log-peer-connection structure.
MESSAGE is the parsed JSON message."
  (let ((state (gethash "state" message))
        (timestamp (gethash "timestamp" message)))
    (message "Received state sync from peer %s at %s"
             (meta-log-peer-connection-peer-id connection) timestamp)
    (run-hook-with-args 'meta-log-webrtc-state-synced-hook
                        connection state)))

(defun meta-log-webrtc-handle-state-request (connection)
  "Handle state request from peer.
CONNECTION is a meta-log-peer-connection structure."
  (message "Peer %s requested state sync"
           (meta-log-peer-connection-peer-id connection))
  (run-hook-with-args 'meta-log-webrtc-state-requested-hook connection))

(defvar meta-log-webrtc-state-synced-hook nil
  "Hook called when state is synced from peer.
Called with (connection state).")

(defvar meta-log-webrtc-state-requested-hook nil
  "Hook called when peer requests state.
Called with (connection).")

(defun meta-log-webrtc-setup-signaling (mqtt-connection)
  "Setup WebRTC signaling via MQTT.
MQTT-CONNECTION is a meta-log-mqtt-connection structure."
  (setq meta-log-webrtc--signaling-channel mqtt-connection)
  (meta-log-mqtt-subscribe mqtt-connection
                          "canvasl/webrtc/signaling/#"
                          'meta-log-webrtc-handle-signal))

(defun meta-log-webrtc-send-signal (peer-id signal-type data)
  "Send WebRTC signaling message.
PEER-ID is the target peer ID.
SIGNAL-TYPE is 'offer', 'answer', or 'ice-candidate'.
DATA is the signal data (SDP or candidate)."
  (when meta-log-webrtc--signaling-channel
    (let ((topic (format "canvasl/webrtc/signaling/%s" peer-id))
          (message (json-encode
                    `((type . ,signal-type)
                      (from . ,(meta-log-identity-get-peer-id
                                (meta-log-identity-get-current-peer)))
                      (to . ,peer-id)
                      (data . ,data)
                      (timestamp . ,(format-time-string "%Y-%m-%dT%H:%M:%SZ"))))))
      (meta-log-mqtt-publish meta-log-webrtc--signaling-channel topic message))))

(defun meta-log-webrtc-load-config-from-org (org-file)
  "Load WebRTC peer configuration from Org Mode file.
ORG-FILE is the path to the Org file.
Returns list of peer connections."
  (let ((buffer (find-file-noselect org-file))
        (connections '()))
    (with-current-buffer buffer
      (goto-char (point-min))
      (while (re-search-forward "^\\*\\*\\*.*Peer:" nil t)
        (let ((peer-id (org-entry-get (point) "PEER_ID"))
              (address (org-entry-get (point) "PEER_ADDRESS"))
              (public-key (org-entry-get (point) "PEER_PUBLIC_KEY"))
              (status (org-entry-get (point) "CONNECTION_STATUS")))
          (when (and peer-id address)
            (let ((connection (meta-log-webrtc-connect-peer peer-id address public-key)))
              (push connection connections))))))
    connections))

(provide 'meta-log-webrtc)

;;; meta-log-webrtc.el ends here

