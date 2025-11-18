;;; meta-log-protocol.el --- CanvasL protocol handler integration

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;; meta-log is free software: you can redistribute it and/or modify
;; it under the terms of the MIT License.

;;; Commentary:

;; CanvasL protocol handler integration for meta-log.
;; Registers and handles canvasl://, webrtc://, mqtt:// protocol handlers.

;;; Code:

(require 'cl-lib)
(require 'org)
(require 'json)
(require 'meta-log-mqtt)
(require 'meta-log-webrtc)
(require 'meta-log-federation)

(defvar meta-log-protocol--handlers (make-hash-table :test 'equal)
  "Registered protocol handlers.")

(defun meta-log-protocol-register-handler (protocol handler-function)
  "Register a protocol handler.
PROTOCOL is the protocol scheme (e.g., 'canvasl', 'webrtc', 'mqtt').
HANDLER-FUNCTION is a function that takes a URL and returns a result."
  (puthash protocol handler-function meta-log-protocol--handlers)
  (message "Registered protocol handler: %s://" protocol))

(defun meta-log-protocol-handle-url (url)
  "Handle a protocol URL.
URL is a string like 'canvasl://command' or 'mqtt://topic'.
Returns the result of the handler."
  (let* ((url-parts (split-string url "://"))
         (protocol (car url-parts))
         (path (cadr url-parts))
         (handler (gethash protocol meta-log-protocol--handlers)))
    (if handler
        (funcall handler url path)
      (user-error "No handler registered for protocol: %s" protocol))))

(defun meta-log-protocol-handle-canvasl (url path)
  "Handle canvasl:// protocol URL.
URL is the full URL.
PATH is the path part.
Returns result of RPC command."
  (let ((command (split-string path "/" t)))
    (meta-log-protocol-rpc-call (car command) (cdr command))))

(defun meta-log-protocol-handle-webrtc (url path)
  "Handle webrtc:// protocol URL.
URL is the full URL.
PATH is the path part (peer-id)."
  (let ((peer-id path))
    (meta-log-federation-connect-to-peer peer-id)))

(defun meta-log-protocol-handle-mqtt (url path)
  "Handle mqtt:// protocol URL.
URL is the full URL.
PATH is the path part (topic/message)."
  (let* ((parts (split-string path "/" t))
         (topic (car parts))
         (message (cadr parts)))
    (when meta-log-federation--mqtt-connection
      (meta-log-mqtt-publish meta-log-federation--mqtt-connection
                            topic
                            (or message "")))))

(defun meta-log-protocol-rpc-call (function-name args)
  "Execute RPC command via protocol handler.
FUNCTION-NAME is the R5RS function name (e.g., 'r5rs:church-add').
ARGS is a list of arguments.
Returns the result."
  (require 'meta-log-r5rs)
  (let ((function (intern function-name)))
    (if (fboundp 'meta-log-r5rs-call)
        (apply 'meta-log-r5rs-call function-name args)
      (user-error "R5RS function %s not available" function-name))))

(defun meta-log-protocol-init ()
  "Initialize protocol handlers.
Registers default handlers for canvasl://, webrtc://, mqtt://."
  (meta-log-protocol-register-handler "canvasl" 'meta-log-protocol-handle-canvasl)
  (meta-log-protocol-register-handler "webrtc" 'meta-log-protocol-handle-webrtc)
  (meta-log-protocol-register-handler "mqtt" 'meta-log-protocol-handle-mqtt)
  (message "Protocol handlers initialized"))

(defun meta-log-protocol-execute-source-block (source-block)
  "Execute an Org Mode source block with protocol handler.
SOURCE-BLOCK is an Org Mode source block structure.
Returns the result."
  (let* ((lang (org-element-property :language source-block))
         (body (org-element-property :value source-block))
         (params (org-element-property :parameters source-block))
         (tangle (org-element-property :tangle source-block)))
    (when tangle
      (let ((protocol-url tangle))
        (meta-log-protocol-handle-url protocol-url)))))

(defun meta-log-protocol-handle-org-source-block ()
  "Handle Org Mode source block at point.
Executes source block if it has a protocol handler tangle directive."
  (interactive)
  (let ((element (org-element-at-point)))
    (when (eq (org-element-type element) 'src-block)
      (meta-log-protocol-execute-source-block element))))

;; Register protocol handlers on load
(meta-log-protocol-init)

(provide 'meta-log-protocol)

;;; meta-log-protocol.el ends here

