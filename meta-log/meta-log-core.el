;;; meta-log-core.el --- Core database abstraction layer

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;; meta-log is free software: you can redistribute it and/or modify
;; it under the terms of the MIT License.

;;; Commentary:

;; Core database abstraction layer for meta-log package.
;; Provides unified interface to Prolog, Datalog, and R5RS engines.

;;; Code:

(require 'cl-lib)

(defvar meta-log--db-instance nil
  "Current database instance.")

(defvar meta-log--initialized-p nil
  "Whether meta-log has been initialized.")

(make-variable-buffer-local 'meta-log--initialized-p)

(cl-defstruct meta-log-db
  "Database instance structure."
  prolog-db
  datalog-db
  r5rs-engine
  org-blackboard
  automata-loaded)

(defun meta-log-get-db ()
  "Get current database instance.
Creates a new instance if none exists."
  (unless meta-log--db-instance
    (setq meta-log--db-instance
          (make-meta-log-db
           :prolog-db nil
           :datalog-db nil
           :r5rs-engine nil
           :org-blackboard nil
           :automata-loaded nil)))
  meta-log--db-instance)

(defun meta-log-core-initialize (&optional options)
  "Initialize the meta-log system.
OPTIONS is an optional plist with configuration:
  :r5rs-engine-path - Path to r5rs-canvas-engine.scm
  :automata-path - Path to automaton-evolutions package
  :org-blackboard-path - Path to Org Mode blackboard file"
  (interactive)
  (when meta-log--initialized-p
    (user-error "meta-log is already initialized"))
  
  (let ((db (meta-log-get-db)))
    ;; Initialize Prolog engine
    (require 'meta-log-prolog)
    (setf (meta-log-db-prolog-db db) (meta-log-prolog-create-db))
    
    ;; Initialize Datalog engine
    (require 'meta-log-datalog)
    (setf (meta-log-db-datalog-db db) (meta-log-datalog-create-db))
    
    ;; Initialize R5RS engine
    (require 'meta-log-r5rs)
    (let ((r5rs-path (or (plist-get options :r5rs-engine-path)
                          (expand-file-name "r5rs-canvas-engine.scm" default-directory))))
      (when (file-exists-p r5rs-path)
        (meta-log-r5rs-load-engine r5rs-path)
        (setf (meta-log-db-r5rs-engine db) r5rs-path)))
    
    ;; Load automata if path provided
    (let ((automata-path (plist-get options :automata-path)))
      (when automata-path
        (require 'meta-log-automata)
        (meta-log-load-all-automata automata-path)))
    
    ;; Load Org blackboard if path provided
    (let ((blackboard-path (plist-get options :org-blackboard-path)))
      (when blackboard-path
        (require 'meta-log-org)
        (meta-log-org-load-blackboard blackboard-path)
        (setf (meta-log-db-org-blackboard db) blackboard-path)))
    
    (setq meta-log--initialized-p t)
    (message "meta-log initialized successfully")))

(defun meta-log-load-automata (path)
  "Load automata from automaton-evolutions package.
PATH is the path to the automaton-evolutions package directory."
  (interactive "DPath to automaton-evolutions: ")
  (require 'meta-log-automata)
  (meta-log-load-all-automata path))

(provide 'meta-log-core)

;;; meta-log-core.el ends here

