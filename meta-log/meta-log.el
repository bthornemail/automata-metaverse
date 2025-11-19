;;; meta-log.el --- User-friendly abstraction layer for automaton systems

;; Copyright (C) 2025 Automaton System
;; Author: Brian Thorne <bthornemail@gmail.com>
;; Version: 1.0.0
;; Package-Requires: ((emacs "28.1") (org "9.6") (geiser "0.18") (dash "2.19"))
;; Keywords: tools languages prolog datalog scheme lisp org
;; URL: https://github.com/bthornemail/meta-log

;; This file is part of meta-log.

;; meta-log is free software: you can redistribute it and/or modify
;; it under the terms of the MIT License.

;;; Commentary:

;; meta-log provides a user-friendly abstraction layer for automaton systems.
;; It abstracts Prolog/Datalog/R5RS complexity behind natural language
;; interfaces and M-expressions, integrates with Org Mode as a blackboard,
;; and supports Docker deployment.
;;
;; Core features loaded by default:
;; - Prolog and Datalog engines for logic programming
;; - R5RS Scheme integration via Geiser
;; - M-expression parser for human-readable queries
;; - Natural language interface
;; - Org Mode integration and Babel support
;; - Automaton loader for CanvasL files
;;
;; Optional modules (require separately):
;; - meta-log-federation: Peer-to-peer federation and synchronization
;; - meta-log-crypto: BIP32/39/44 cryptographic identity management
;; - meta-log-mqtt: MQTT pub/sub messaging
;; - meta-log-webrtc: WebRTC peer connections
;; - meta-log-identity: Peer identity management
;; - meta-log-protocol: CanvasL protocol handlers
;; - meta-log-server: Emacs server coordination
;; - meta-log-collective-intelligence: Collective intelligence features
;; - meta-log-verifiable-computation: Verifiable computation support
;; - meta-log-wordnet: WordNet semantic analysis
;; - meta-log-template-discovery: Dynamic template discovery
;; - meta-log-template-federation: Federated template sharing
;; - meta-log-canvas-api: Canvas API integration
;; - meta-log-geometric-consensus: Geometric consensus foundation
;;
;; To use federation features, add to your init.el:
;;   (require 'meta-log)
;;   (require 'meta-log-federation)
;;   (require 'meta-log-mqtt)
;;   (meta-log-federation-init)
;;
;; See docs/MODULES.md for detailed documentation of optional modules.

;;; Code:

;; Core modules - always loaded
(require 'meta-log-core)
(require 'meta-log-prolog)
(require 'meta-log-datalog)
(require 'meta-log-r5rs)
(require 'meta-log-org)
(require 'meta-log-m-expression)
(require 'meta-log-natural-language)
(require 'meta-log-automata)
(require 'meta-log-babel)

;; Optional modules - users can require these as needed
;; (require 'meta-log-federation)
;; (require 'meta-log-crypto)
;; (require 'meta-log-mqtt)
;; (require 'meta-log-webrtc)
;; (require 'meta-log-identity)
;; (require 'meta-log-protocol)
;; (require 'meta-log-server)
;; (require 'meta-log-collective-intelligence)
;; (require 'meta-log-verifiable-computation)
;; (require 'meta-log-wordnet)
;; (require 'meta-log-template-discovery)
;; (require 'meta-log-canvas-api)
;; (require 'meta-log-template-federation)
;; (require 'meta-log-geometric-consensus)

;;;###autoload
(defun meta-log-initialize ()
  "Initialize the meta-log system.
This sets up all engines and loads default configurations."
  (interactive)
  (meta-log-core-initialize))

;;;###autoload
(defun meta-log-ask (question)
  "Ask a natural language question to the automaton system.
QUESTION is a string containing the user's question."
  (interactive "sWhat would you like to know? ")
  (unless meta-log--initialized-p
    (user-error "meta-log not initialized. Run M-x meta-log-initialize"))
  (require 'meta-log-natural-language)
  (let ((result (meta-log-natural-language-ask question)))
    (message "%s" result)
    result))

(defvar meta-log-mode-map
  (let ((map (make-sparse-keymap)))
    (define-key map (kbd "C-c C-i") 'meta-log-initialize)
    (define-key map (kbd "C-c C-a") 'meta-log-ask)
    (define-key map (kbd "C-c C-e") 'meta-log-m-expr-eval)
    (define-key map (kbd "C-c C-p") 'meta-log-prolog-query)
    (define-key map (kbd "C-c C-d") 'meta-log-datalog-query)
    (define-key map (kbd "C-c C-r") 'meta-log-r5rs-eval)
    map)
  "Keymap for meta-log-mode.")

;;;###autoload
(defun meta-log-mode ()
  "Major mode for meta-log automaton systems.
Provides syntax highlighting and keybindings for M-expressions,
Prolog, Datalog, and R5RS code."
  (interactive)
  (kill-all-local-variables)
  (setq major-mode 'meta-log-mode)
  (setq mode-name "Meta-Log")
  (meta-log-m-expression-mode)
  (use-local-map meta-log-mode-map))

(provide 'meta-log)

;;; meta-log.el ends here

