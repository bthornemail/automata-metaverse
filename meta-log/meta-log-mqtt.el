;;; meta-log-mqtt.el --- MQTT messaging for peer discovery

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;; meta-log is free software: you can redistribute it and/or modify
;; it under the terms of the MIT License.

;;; Commentary:

;; MQTT messaging integration for meta-log federation.
;; Supports peer discovery and message routing via MQTT broker.

;;; Code:

(require 'cl-lib)
(require 'org)
(require 'json)

(defvar meta-log-mqtt--connections (make-hash-table :test 'equal)
  "Active MQTT connections.")

(defvar meta-log-mqtt--subscriptions (make-hash-table :test 'equal)
  "Active MQTT subscriptions.")

(defvar meta-log-mqtt--message-handlers (make-hash-table :test 'equal)
  "Message handlers for topics.")

(cl-defstruct meta-log-mqtt-connection
  "MQTT connection structure."
  broker-url
  client-id
  username
  password
  process
  connected-p)

(defun meta-log-mqtt-connect (broker-url &optional client-id username password)
  "Connect to MQTT broker.
BROKER-URL is the broker URL (e.g., 'mqtt://broker.example.com:1883').
CLIENT-ID is optional client identifier.
USERNAME and PASSWORD are optional authentication credentials.
Returns connection structure."
  (interactive "sBroker URL: \nsClient ID (optional): ")
  (let* ((client-id (or client-id (format "emacs-%d" (random 1000000))))
         (connection (make-meta-log-mqtt-connection
                      :broker-url broker-url
                      :client-id client-id
                      :username username
                      :password password
                      :connected-p nil)))
    ;; Try to use external mosquitto client if available
    (if (executable-find "mosquitto_sub")
        (meta-log-mqtt-connect-external connection)
      (meta-log-mqtt-connect-websocket connection))
    (puthash broker-url connection meta-log-mqtt--connections)
    connection))

(defun meta-log-mqtt-connect-external (connection)
  "Connect using external mosquitto client.
CONNECTION is a meta-log-mqtt-connection structure.
Note: This just marks connection as ready; actual subscriptions happen separately."
  (setf (meta-log-mqtt-connection-connected-p connection) t)
  connection)

(defun meta-log-mqtt-connect-websocket (connection)
  "Connect using WebSocket (fallback).
CONNECTION is a meta-log-mqtt-connection structure."
  ;; WebSocket MQTT implementation would go here
  ;; For now, signal an error if external client not available
  (user-error "MQTT requires mosquitto_sub client. Install mosquitto-clients package."))

(defun meta-log-mqtt-parse-url (url)
  "Parse MQTT URL.
URL is a string like 'mqtt://host:port'.
Returns plist with :host and :port."
  (let* ((url-parts (split-string (replace-regexp-in-string "^mqtt://" "" url) ":"))
         (host (car url-parts))
         (port (if (cdr url-parts)
                   (string-to-number (cadr url-parts))
                 1883)))
    (list :host host :port port)))

(defun meta-log-mqtt-process-filter (process output)
  "Process filter for MQTT messages.
PROCESS is the MQTT process.
OUTPUT is the process output."
  (when output
    (let ((lines (split-string output "\n" t)))
      (dolist (line lines)
        (meta-log-mqtt-handle-message line)))))

(defun meta-log-mqtt-publish (connection topic message &optional qos retain)
  "Publish message to MQTT topic.
CONNECTION is a meta-log-mqtt-connection structure.
TOPIC is the topic string.
MESSAGE is the message string or JSON object.
QOS is optional quality of service (0, 1, or 2).
RETAIN is optional retain flag."
  (let* ((broker-url (meta-log-mqtt-connection-broker-url connection))
         (url-parts (meta-log-mqtt-parse-url broker-url))
         (host (plist-get url-parts :host))
         (port (plist-get url-parts :port))
         (message-str (if (stringp message)
                          message
                        (json-encode message)))
         (process-args (list "mosquitto_pub"
                             "-h" host
                             "-p" (number-to-string port)
                             "-t" topic
                             "-m" message-str)))
    (when qos
      (setq process-args (append process-args (list "-q" (number-to-string qos)))))
    (when retain
      (setq process-args (append process-args (list "-r"))))
    (when (meta-log-mqtt-connection-username connection)
      (setq process-args (append process-args
                                 (list "-u" (meta-log-mqtt-connection-username connection)))))
    (when (meta-log-mqtt-connection-password connection)
      (setq process-args (append process-args
                                 (list "-P" (meta-log-mqtt-connection-password connection)))))
    (apply 'call-process nil nil nil nil process-args)))

(defun meta-log-mqtt-subscribe (connection topic handler)
  "Subscribe to MQTT topic.
CONNECTION is a meta-log-mqtt-connection structure.
TOPIC is the topic string (supports wildcards # and +).
HANDLER is a function to call with (topic message)."
  (let* ((broker-url (meta-log-mqtt-connection-broker-url connection))
         (url-parts (meta-log-mqtt-parse-url broker-url))
         (host (plist-get url-parts :host))
         (port (plist-get url-parts :port))
         (client-id (meta-log-mqtt-connection-client-id connection))
         (process-name (format "mqtt-sub-%s-%s" client-id topic))
         (process-args (list "mosquitto_sub"
                             "-h" host
                             "-p" (number-to-string port)
                             "-i" (format "%s-sub" client-id)
                             "-t" topic)))
    (when (meta-log-mqtt-connection-username connection)
      (setq process-args (append process-args
                                 (list "-u" (meta-log-mqtt-connection-username connection)))))
    (when (meta-log-mqtt-connection-password connection)
      (setq process-args (append process-args
                                 (list "-P" (meta-log-mqtt-connection-password connection)))))
    (let ((process (apply 'start-process process-name nil process-args)))
      (set-process-filter process
                          (lambda (proc output)
                            (when output
                              (let ((lines (split-string output "\n" t)))
                                (dolist (line lines)
                                  (funcall handler topic line))))))
      (puthash topic handler meta-log-mqtt--message-handlers)
      (puthash topic process meta-log-mqtt--subscriptions)
      (list :topic topic :process process :handler handler))))

(defun meta-log-mqtt-handle-message (message)
  "Handle incoming MQTT message.
MESSAGE is the message string."
  (let ((parsed (condition-case nil
                    (json-read-from-string message)
                  (error message))))
    (if (hash-table-p parsed)
        (let ((message-type (gethash "type" parsed)))
          (cond
           ((equal message-type "peer_announce")
            (meta-log-mqtt-handle-peer-announce parsed))
           ((equal message-type "peer_message")
            (meta-log-mqtt-handle-peer-message parsed))
           (t
            (message "Unknown MQTT message type: %s" message-type))))
      (message "MQTT message: %s" message))))

(defun meta-log-mqtt-handle-peer-announce (message)
  "Handle peer announcement message.
MESSAGE is a parsed JSON message."
  (let ((peer-id (gethash "peer_id" message))
        (public-key (gethash "public_key" message))
        (address (gethash "address" message)))
    (message "Peer announced: %s (%s)" peer-id address)
    (run-hook-with-args 'meta-log-mqtt-peer-announced-hook peer-id public-key address)))

(defun meta-log-mqtt-handle-peer-message (message)
  "Handle peer message.
MESSAGE is a parsed JSON message."
  (let ((from (gethash "from" message))
        (to (gethash "to" message))
        (payload (gethash "payload" message))
        (signature (gethash "signature" message)))
    (message "Message from %s to %s" from to)
    (run-hook-with-args 'meta-log-mqtt-peer-message-hook from to payload signature)))

(defvar meta-log-mqtt-peer-announced-hook nil
  "Hook called when a peer is announced.
Called with (peer-id public-key address).")

(defvar meta-log-mqtt-peer-message-hook nil
  "Hook called when a peer message is received.
Called with (from to payload signature).")

(defun meta-log-mqtt-announce-peer (connection peer-id public-key address)
  "Announce this peer to the network.
CONNECTION is a meta-log-mqtt-connection structure.
PEER-ID is this peer's identifier.
PUBLIC-KEY is this peer's public key.
ADDRESS is this peer's address."
  (let ((message (json-encode
                  `((type . "peer_announce")
                    (peer_id . ,peer-id)
                    (public_key . ,public-key)
                    (address . ,address)
                    (timestamp . ,(format-time-string "%Y-%m-%dT%H:%M:%SZ"))))))
    (meta-log-mqtt-publish connection "canvasl/peers/announce" message 1 t)))

(defun meta-log-mqtt-send-peer-message (connection from to payload signature)
  "Send a message to a peer.
CONNECTION is a meta-log-mqtt-connection structure.
FROM is the sender peer ID.
TO is the recipient peer ID.
PAYLOAD is the message payload.
SIGNATURE is the message signature."
  (let ((topic (format "canvasl/peers/%s/messages" to))
        (message (json-encode
                  `((type . "peer_message")
                    (from . ,from)
                    (to . ,to)
                    (payload . ,payload)
                    (signature . ,signature)
                    (timestamp . ,(format-time-string "%Y-%m-%dT%H:%M:%SZ"))))))
    (meta-log-mqtt-publish connection topic message 1)))

(defun meta-log-mqtt-discover-peers (connection)
  "Discover peers via MQTT.
CONNECTION is a meta-log-mqtt-connection structure.
Subscribes to peer announcements and returns list of discovered peers."
  (meta-log-mqtt-subscribe connection "canvasl/peers/announce"
                           (lambda (topic message)
                             (meta-log-mqtt-handle-message message))))

(defun meta-log-mqtt-load-config-from-org (org-file)
  "Load MQTT configuration from Org Mode file.
ORG-FILE is the path to the Org file.
Returns connection structure."
  (let ((buffer (find-file-noselect org-file)))
    (with-current-buffer buffer
      (goto-char (point-min))
      (when (re-search-forward "^\\*.*MQTT Configuration" nil t)
        (let ((broker (org-entry-get (point) "MQTT_BROKER"))
              (client-id (org-entry-get (point) "MQTT_CLIENT_ID"))
              (username (org-entry-get (point) "MQTT_USERNAME"))
              (password (org-entry-get (point) "MQTT_PASSWORD")))
          (when broker
            (meta-log-mqtt-connect broker client-id username password)))))))

(provide 'meta-log-mqtt)

;;; meta-log-mqtt.el ends here

