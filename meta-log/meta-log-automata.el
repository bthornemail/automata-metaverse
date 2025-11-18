;;; meta-log-automata.el --- automaton-evolutions loader

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; Load automata from automaton-evolutions npm package.

;;; Code:

(require 'cl-lib)

(defun meta-log-find-evolutions-package ()
  "Find automaton-evolutions package installation.
Returns path to package directory or nil."
  (or (getenv "META_LOG_AUTOMATA_PATH")
      (let ((npm-output (shell-command-to-string
                         "npm list -g automaton-evolutions 2>/dev/null | head -1")))
        (when (string-match "/\\(.*\\)" npm-output)
          (expand-file-name (match-string 1 npm-output))))
      (let ((local-path (expand-file-name "node_modules/automaton-evolutions" default-directory)))
        (when (file-exists-p local-path)
          local-path))))

(defun meta-log-list-automata-files (package-path)
  "List all automaton files in package.
PACKAGE-PATH is the path to automaton-evolutions package.
Returns list of file paths."
  (let ((files '())
        (dist-path (expand-file-name "dist" package-path)))
    (when (file-exists-p dist-path)
      (dolist (file (directory-files dist-path t "\\.canvasl$"))
        (push file files)))
    (nreverse files)))

(defun meta-log-load-automaton-file (file-path)
  "Load a CanvasL automaton file.
FILE-PATH is the path to the .canvasl file.
Extracts facts and loads into Prolog/Datalog databases."
  (when (file-exists-p file-path)
    (let ((buffer (find-file-noselect file-path)))
      (with-current-buffer buffer
        (let ((content (buffer-string)))
          (meta-log-parse-canvasl content))))))

(defun meta-log-parse-canvasl (content)
  "Parse CanvasL content and extract facts.
CONTENT is the CanvasL file content."
  (require 'meta-log-prolog)
  (require 'meta-log-datalog)
  (let ((lines (split-string content "\n"))
        (facts '()))
    (dolist (line lines)
      (when (and (> (length line) 0)
                 (not (string-prefix-p "@" line))
                 (not (string-prefix-p "#" line)))
        (let ((obj (condition-case nil
                       (json-read-from-string line)
                     (error nil))))
          (when obj
            (let ((facts-from-obj (meta-log-extract-facts-from-jsonl obj)))
              (setq facts (append facts facts-from-obj)))))))
    (dolist (fact facts)
      (apply 'meta-log-prolog-add-fact fact)
      (apply 'meta-log-datalog-add-fact fact))
    facts))

(defun meta-log-extract-facts-from-jsonl (obj)
  "Extract facts from a JSONL object.
OBJ is a parsed JSON object.
Returns list of facts."
  (let ((facts '())
        (id (cdr (assq 'id obj)))
        (type (cdr (assq 'type obj))))
    (when id
      (push (list 'node id type) facts)
      (let ((dimension (cdr (assq 'dimension obj))))
        (when dimension
          (push (list 'dimension id dimension) facts)))
      (let ((from-node (cdr (assq 'fromNode obj)))
            (to-node (cdr (assq 'toNode obj))))
        (when (and from-node to-node)
          (push (list 'edge id from-node to-node) facts))))
    facts))

(defun meta-log-load-all-automata (package-path)
  "Load all automata from automaton-evolutions package.
PACKAGE-PATH is the path to the package directory."
  (interactive "DPath to automaton-evolutions: ")
  (let ((files (meta-log-list-automata-files package-path)))
    (if files
        (progn
          (message "Loading %d automaton file(s)..." (length files))
          (dolist (file files)
            (meta-log-load-automaton-file file))
          (message "Loaded %d automaton file(s)" (length files)))
      (message "No automaton files found in %s" package-path))))

(provide 'meta-log-automata)

;;; meta-log-automata.el ends here

