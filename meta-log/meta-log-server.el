;;; meta-log-server.el --- Emacs server coordination

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;; meta-log is free software: you can redistribute it and/or modify
;; it under the terms of the MIT License.

;;; Commentary:

;; Emacs server coordination for multi-client federation.
;; Coordinates multiple emacsclient instances sharing a blackboard.

;;; Code:

(require 'cl-lib)
(require 'server)
(require 'meta-log-federation)

(defvar meta-log-server--clients (make-hash-table :test 'equal)
  "Registered emacsclient instances.")

(defvar meta-log-server--blackboard-file nil
  "Shared blackboard file path.")

(cl-defstruct meta-log-client
  "Client structure."
  client-id
  process-id
  last-seen
  blackboard-version)

(defun meta-log-server-register-client (client-id)
  "Register an emacsclient instance.
CLIENT-ID is a unique client identifier.
Returns client structure."
  (let ((client (make-meta-log-client
                 :client-id client-id
                 :process-id (emacs-pid)
                 :last-seen (current-time)
                 :blackboard-version 0)))
    (puthash client-id client meta-log-server--clients)
    (message "Registered client: %s" client-id)
    client))

(defun meta-log-server-broadcast (message)
  "Broadcast message to all registered clients.
MESSAGE is a string or JSON object."
  (let ((message-str (if (stringp message)
                         message
                       (json-encode message))))
    (maphash (lambda (client-id client)
               (meta-log-server-send-to-client client-id message-str))
             meta-log-server--clients)))

(defun meta-log-server-send-to-client (client-id message)
  "Send message to specific client.
CLIENT-ID is the client identifier.
MESSAGE is the message string."
  ;; Use emacsclient to send message
  (let ((server-file server-socket-dir))
    (when server-file
      (call-process "emacsclient" nil nil nil
                    "-s" server-file
                    "-e" (format "(meta-log-server-handle-message %S)" message)))))

(defun meta-log-server-handle-message (message)
  "Handle message from server.
MESSAGE is the message string."
  (message "Received server message: %s" message)
  (condition-case err
      (let ((parsed (json-read-from-string message)))
        (let ((type (gethash "type" parsed)))
          (cond
           ((equal type "blackboard_update")
            (meta-log-server-handle-blackboard-update parsed))
           ((equal type "sync_request")
            (meta-log-server-handle-sync-request parsed))
           (t
            (message "Unknown message type: %s" type)))))
    (error
     (message "Error parsing server message: %s" (error-message-string err)))))

(defun meta-log-server-handle-blackboard-update (message)
  "Handle blackboard update message.
MESSAGE is the parsed JSON message."
  (let ((version (gethash "version" message))
        (content (gethash "content" message)))
    (when meta-log-server--blackboard-file
      (with-current-buffer (find-file-noselect meta-log-server--blackboard-file)
        (erase-buffer)
        (insert content)
        (save-buffer))
      (message "Blackboard updated to version %d" version))))

(defun meta-log-server-handle-sync-request (message)
  "Handle sync request message.
MESSAGE is the parsed JSON message."
  (let ((from-client (gethash "from" message)))
    (when meta-log-server--blackboard-file
      (let ((content (meta-log-server-get-blackboard-content)))
        (meta-log-server-send-to-client from-client
                                        (json-encode
                                         `((type . "blackboard_sync")
                                           (content . ,content)
                                           (version . ,(meta-log-server-get-blackboard-version)))))))))

(defun meta-log-server-sync-blackboard ()
  "Synchronize blackboard across all clients.
Reads blackboard file and broadcasts to all clients."
  (when meta-log-server--blackboard-file
    (let ((content (meta-log-server-get-blackboard-content))
          (version (meta-log-server-get-blackboard-version)))
      (meta-log-server-broadcast
       (json-encode
        `((type . "blackboard_update")
          (content . ,content)
          (version . ,version)
          (timestamp . ,(format-time-string "%Y-%m-%dT%H:%M:%SZ"))))))))

(defun meta-log-server-get-blackboard-content ()
  "Get current blackboard content.
Returns content as string."
  (when meta-log-server--blackboard-file
    (let ((buffer (find-file-noselect meta-log-server--blackboard-file)))
      (with-current-buffer buffer
        (buffer-string)))))

(defun meta-log-server-get-blackboard-version ()
  "Get current blackboard version.
Returns version number."
  (when meta-log-server--blackboard-file
    (let ((buffer (find-file-noselect meta-log-server--blackboard-file)))
      (with-current-buffer buffer
        (goto-char (point-min))
        (let ((version-str (org-entry-get (point) "BLACKBOARD_VERSION")))
          (if version-str
              (string-to-number version-str)
            0))))))

(defun meta-log-server-set-blackboard-file (file)
  "Set shared blackboard file.
FILE is the path to the Org Mode blackboard file."
  (setq meta-log-server--blackboard-file file)
  (message "Server blackboard file set to: %s" file))

(defun meta-log-server-init (&optional blackboard-file)
  "Initialize Emacs server coordination.
BLACKBOARD-FILE is optional path to shared blackboard file.
Starts Emacs server if not already running."
  (interactive)
  (unless server-process
    (server-start))
  (when blackboard-file
    (meta-log-server-set-blackboard-file blackboard-file))
  (message "Emacs server coordination initialized"))

(defun meta-log-server-list-clients ()
  "List all registered clients.
Returns list of client IDs."
  (hash-table-keys meta-log-server--clients))

(defun meta-log-server-remove-client (client-id)
  "Remove a client registration.
CLIENT-ID is the client identifier."
  (remhash client-id meta-log-server--clients)
  (message "Removed client: %s" client-id))

(provide 'meta-log-server)

;;; meta-log-server.el ends here

