;;; meta-log.el --- User-friendly abstraction layer for automaton systems

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;; meta-log is free software: you can redistribute it and/or modify
;; it under the terms of the MIT License.

;;; Commentary:

;; meta-log provides a user-friendly abstraction layer for automaton systems.
;; It abstracts Prolog/Datalog/R5RS complexity behind natural language
;; interfaces and M-expressions, integrates with Org Mode as a blackboard,
;; and supports Docker deployment.

;;; Code:

(require 'meta-log-core)
(require 'meta-log-prolog)
(require 'meta-log-datalog)
(require 'meta-log-r5rs)
(require 'meta-log-org)
(require 'meta-log-m-expression)
(require 'meta-log-natural-language)
(require 'meta-log-automata)
(require 'meta-log-babel)
(require 'meta-log-crypto)
(require 'meta-log-identity)
(require 'meta-log-mqtt)
(require 'meta-log-webrtc)
(require 'meta-log-federation)
(require 'meta-log-protocol)
(require 'meta-log-server)
(require 'meta-log-collective-intelligence)
(require 'meta-log-verifiable-computation)
(require 'meta-log-wordnet)
(require 'meta-log-template-discovery)
(require 'meta-log-canvas-api)
(require 'meta-log-template-federation)

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

(provide 'meta-log)

;;; meta-log.el ends here

