;;; meta-log-babel.el --- Library of Babel integration

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; Library of Babel integration for executing meta-log code blocks.

;;; Code:

(require 'ob-core)
(require 'meta-log-m-expression)
(require 'meta-log-prolog)
(require 'meta-log-datalog)
(require 'meta-log-r5rs)

(defun org-babel-execute:meta-log-m-expr (body params)
  "Execute meta-log-m-expr source block.
BODY is the source block content, PARAMS is the header arguments."
  (let ((result (meta-log-m-expr-eval body)))
    (format "%S" result)))

(defun org-babel-execute:meta-log-prolog (body params)
  "Execute meta-log-prolog source block.
BODY is the Prolog code, PARAMS is the header arguments."
  (let ((results-type (cdr (assq :results params))))
    (let ((result (meta-log-prolog-query (read body))))
      (cond
       ((eq results-type 'output)
        (mapconcat (lambda (r) (format "%S\n" r)) result ""))
       (t
        (format "%S" result))))))

(defun org-babel-execute:meta-log-datalog (body params)
  "Execute meta-log-datalog source block.
BODY is the Datalog code, PARAMS is the header arguments."
  (let ((results-type (cdr (assq :results params))))
    (let ((result (meta-log-datalog-query (read body))))
      (cond
       ((eq results-type 'table)
        (meta-log-datalog-format-table result))
       (t
        (format "%S" result))))))

(defun org-babel-execute:meta-log-r5rs (body params)
  "Execute meta-log-r5rs source block.
BODY is the R5RS Scheme code, PARAMS is the header arguments."
  (let ((result (meta-log-r5rs-eval body)))
    (format "%S" result)))

(defun meta-log-datalog-format-table (results)
  "Format Datalog results as Org table."
  (if (null results)
      "| |\n"
    (let ((header "| ")
          (rows ""))
      (dolist (result results)
        (setq rows (concat rows "| "
                           (mapconcat (lambda (x) (format "%s" x)) result " | ")
                           " |\n")))
      (concat header rows))))

;; Register Babel languages
(add-to-list 'org-babel-load-languages '(meta-log-m-expr . t))
(add-to-list 'org-babel-load-languages '(meta-log-prolog . t))
(add-to-list 'org-babel-load-languages '(meta-log-datalog . t))
(add-to-list 'org-babel-load-languages '(meta-log-r5rs . t))

(provide 'meta-log-babel)

;;; meta-log-babel.el ends here

