;;; meta-log-natural-language.el --- Natural language interface

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; Natural language processing for user queries.
;; Parses questions into intents and converts to queries.

;;; Code:

(require 'cl-lib)

(defun meta-log-natural-language-ask (question)
  "Process a natural language QUESTION.
Returns human-readable answer."
  (let ((intent (meta-log-parse-intent question)))
    (let ((query (meta-log-intent-to-query intent)))
      (let ((result (meta-log-execute-query query)))
        (meta-log-format-answer intent result)))))

(defun meta-log-parse-intent (question)
  "Parse user question into intent structure.
Returns plist with :type, :predicate, :args, etc."
  (let ((question-lower (downcase question)))
    (cond
     ;; "What agents are in dimension X?"
     ((string-match-p "what.*agent.*dimension" question-lower)
      (let ((dimension (meta-log-extract-dimension question)))
        (list :type 'query-agents
              :predicate 'dimension
              :args (list dimension))))
     ;; "Find all nodes with type Y"
     ((string-match-p "find.*node.*type" question-lower)
      (let ((type (meta-log-extract-type question)))
        (list :type 'query-nodes
              :predicate 'node-type
              :args (list type))))
     ;; "Execute church-add(2, 3)"
     ((string-match-p "execute.*church-" question-lower)
      (let ((fun-args (meta-log-extract-function-call question)))
        (list :type 'execute-r5rs
              :function (car fun-args)
              :args (cdr fun-args))))
     ;; "Show me the topology"
     ((string-match-p "show.*topology" question-lower)
      (list :type 'visualize-topology))
     ;; Default: try Prolog query
     (t
      (list :type 'prolog-query
            :query question)))))

(defun meta-log-extract-dimension (question)
  "Extract dimension from question.
Returns dimension string like \"5D\"."
  (if (string-match "\\([0-9]+D\\)" question)
      (match-string 1 question)
    nil))

(defun meta-log-extract-type (question)
  "Extract type from question."
  (if (string-match "type[=\\s]+\\([a-zA-Z-]+\\)" question)
      (match-string 1 question)
    nil))

(defun meta-log-extract-function-call (question)
  "Extract function call from question.
Returns (function-name . args)."
  (if (string-match "\\(church-[a-z]+\\)\s*(\\([^)]+\\))" question)
      (let ((fun (match-string 1 question))
            (args-str (match-string 2 question)))
        (cons fun (split-string args-str ",\\s*")))
    nil))

(defun meta-log-intent-to-query (intent)
  "Convert intent to executable query.
Returns query structure."
  (let ((type (plist-get intent :type)))
    (cond
     ((eq type 'query-agents)
      (let ((dimension (car (plist-get intent :args))))
        (list 'prolog-query (list 'dimension (intern "?Agent") dimension))))
     ((eq type 'query-nodes)
      (let ((type (car (plist-get intent :args))))
        (list 'datalog-query (list 'node-type (intern "?Id") type))))
     ((eq type 'execute-r5rs)
      (let ((fun (plist-get intent :function))
            (args (plist-get intent :args)))
        `(r5rs-call ,fun ,@args)))
     ((eq type 'prolog-query)
      (plist-get intent :query))
     (t
      nil))))

(defun meta-log-execute-query (query)
  "Execute a query structure.
Returns results."
  (cond
   ((eq (car query) 'prolog-query)
    (require 'meta-log-prolog)
    (apply 'meta-log-prolog-query (cdr query)))
   ((eq (car query) 'datalog-query)
    (require 'meta-log-datalog)
    (apply 'meta-log-datalog-query (cdr query)))
   ((eq (car query) 'r5rs-call)
    (require 'meta-log-r5rs)
    (apply 'meta-log-r5rs-call (cdr query)))
   (t
    nil)))

(defun meta-log-format-answer (intent result)
  "Format query result as human-readable answer.
Returns string."
  (let ((type (plist-get intent :type)))
    (cond
     ((eq type 'query-agents)
      (if result
          (format "The %s dimension contains: %s"
                  (car (plist-get intent :args))
                  (mapconcat (lambda (r) (format "%s" (car r))) result ", "))
        (format "No agents found in dimension %s" (car (plist-get intent :args)))))
     ((eq type 'query-nodes)
      (if result
          (format "Found %d node(s): %s"
                  (length result)
                  (mapconcat (lambda (r) (format "%s" r)) result ", "))
        "No nodes found"))
     ((eq type 'execute-r5rs)
      (format "Result: %s" result))
     (t
      (format "Result: %S" result)))))

(provide 'meta-log-natural-language)

;;; meta-log-natural-language.el ends here

