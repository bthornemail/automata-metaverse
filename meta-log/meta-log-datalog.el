;;; meta-log-datalog.el --- Datalog engine implementation

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; Datalog engine with fact extraction and fixed-point computation.
;; Ported from R5RS Scheme implementation.

;;; Code:

(require 'cl-lib)

(defvar meta-log-datalog--db (make-hash-table :test 'equal)
  "Datalog database: hash table mapping predicates to fact sets.")

(defvar meta-log-datalog--rules '()
  "Datalog rules: list of (head . body) clauses.")

(defun meta-log-datalog-create-db ()
  "Create a new Datalog database."
  (make-hash-table :test 'equal))

(defun meta-log-datalog-variable-p (term)
  "Check if TERM is a Datalog variable.
Variables start with ?."
  (and (stringp term)
       (string-match-p "^?" term)))

(defun meta-log-datalog-add-fact (predicate &rest args)
  "Add a fact to the Datalog database.
PREDICATE is the predicate name, ARGS are the arguments."
  (let ((fact (cons predicate args))
        (key (symbol-name predicate)))
    (puthash key
             (cons fact (gethash key meta-log-datalog--db '()))
             meta-log-datalog--db)
    fact))

(defun meta-log-datalog-add-rule (head &rest body)
  "Add a rule to the Datalog database.
HEAD is the rule head (predicate with args).
BODY is a list of goals (conditions)."
  (setq meta-log-datalog--rules
        (cons (cons head body) meta-log-datalog--rules))
  (cons head body))

(defun meta-log-datalog-query (goal)
  "Execute a Datalog query.
GOAL is a list (predicate arg1 arg2 ...).
Returns list of matching facts."
  (unless meta-log-datalog--db
    (setq meta-log-datalog--db (make-hash-table :test 'equal)))
  ;; Evaluate program to fixed point
  (let ((evaluated (meta-log-datalog-evaluate-program)))
    ;; Query the evaluated database
    (meta-log-datalog-immediate-query evaluated goal)))

(defun meta-log-datalog-copy-hash-table (hash-table)
  "Copy a hash table."
  (let ((new-table (make-hash-table :test (hash-table-test hash-table))))
    (maphash (lambda (key value)
               (puthash key value new-table))
             hash-table)
    new-table))

(defun meta-log-datalog-evaluate-program ()
  "Evaluate Datalog program to fixed point.
Returns hash table of all derived facts."
  (let ((strata (meta-log-datalog-stratify-program))
        (current (meta-log-datalog-copy-hash-table meta-log-datalog--db)))
    (dolist (stratum strata)
      (let ((new-facts (meta-log-datalog-evaluate-stratum stratum current)))
        (dolist (fact new-facts)
          (let ((pred (car fact))
                (key (symbol-name pred)))
            (puthash key
                     (cons fact (gethash key current '()))
                     current)))))
    current))

(defun meta-log-datalog-stratify-program ()
  "Stratify Datalog program.
Returns list of predicate names in evaluation order."
  ;; Simple stratification: all predicates in one stratum
  ;; Can be enhanced for negation
  (let ((predicates '()))
    (dolist (rule meta-log-datalog--rules)
      (let ((head-pred (car (car rule))))
        (unless (member head-pred predicates)
          (push head-pred predicates))))
    (reverse predicates)))

(defun meta-log-datalog-evaluate-stratum (stratum db)
  "Evaluate a single stratum.
STRATUM is a predicate name, DB is the current database.
Returns list of new facts."
  (let ((rules (cl-remove-if-not
                (lambda (rule)
                  (eq (car (car rule)) stratum))
                meta-log-datalog--rules))
        (new-facts '()))
    (let loop ()
      (let ((delta (meta-log-datalog-compute-delta stratum rules db new-facts)))
        (if (null delta)
            new-facts
          (setq new-facts (append new-facts delta))
          (dolist (fact delta)
            (let ((pred (car fact))
                  (key (symbol-name pred)))
              (puthash key
                       (cons fact (gethash key db '()))
                       db)))
          (loop))))))

(defun meta-log-datalog-compute-delta (stratum rules db new-facts)
  "Compute new facts for a stratum.
Returns list of newly derived facts."
  (let ((delta '()))
    (dolist (rule rules)
      (let ((head (car rule))
            (body (cdr rule)))
        ;; Match body against database
        (let ((matches (meta-log-datalog-match-body body db)))
          (dolist (match matches)
            (let ((new-fact (meta-log-datalog-subst head match)))
              (unless (member new-fact (append (gethash (symbol-name stratum) db '())
                                                new-facts))
                (push new-fact delta)))))))
    delta))

(defun meta-log-datalog-match-body (body db)
  "Match a rule body against the database.
Returns list of binding sets."
  (if (null body)
      '(())
    (let ((goal (car body))
          (rest (cdr body))
          (results '()))
      (let ((pred (car goal))
            (key (symbol-name pred)))
        (dolist (fact (gethash key db '()))
          (let ((bindings (meta-log-datalog-unify goal fact '())))
            (when bindings
              (dolist (rest-match (meta-log-datalog-match-body rest db))
                (let ((combined (meta-log-datalog-merge-bindings bindings rest-match)))
                  (when combined
                    (push combined results))))))))
      results)))

(defun meta-log-datalog-unify (x y bindings)
  "Unify two terms with bindings.
Returns new bindings or nil."
  (cond
   ((equal x y) bindings)
   ((meta-log-datalog-variable-p x)
    (meta-log-datalog-bind x y bindings))
   ((meta-log-datalog-variable-p y)
    (meta-log-datalog-bind y x bindings))
   ((and (listp x) (listp y))
    (let ((b1 (meta-log-datalog-unify (car x) (car y) bindings)))
      (and b1 (meta-log-datalog-unify (cdr x) (cdr y) b1))))
   (t nil)))

(defun meta-log-datalog-bind (var val bindings)
  "Bind variable to value in bindings."
  (let ((existing (assoc var bindings)))
    (if existing
        (meta-log-datalog-unify (cdr existing) val bindings)
      (cons (cons var val) bindings))))

(defun meta-log-datalog-subst (term bindings)
  "Substitute variables in term with bindings."
  (cond
   ((meta-log-datalog-variable-p term)
    (let ((binding (assoc term bindings)))
      (if binding
          (meta-log-datalog-subst (cdr binding) bindings)
        term)))
   ((listp term)
    (cons (meta-log-datalog-subst (car term) bindings)
          (meta-log-datalog-subst (cdr term) bindings)))
   (t term)))

(defun meta-log-datalog-merge-bindings (b1 b2)
  "Merge two binding sets.
Returns merged bindings or nil if incompatible."
  (let ((merged b1))
    (dolist (binding b2)
      (let ((var (car binding))
            (val (cdr binding)))
        (let ((existing (assoc var merged)))
          (if existing
              (let ((unified (meta-log-datalog-unify (cdr existing) val merged)))
                (if unified
                    (setq merged unified)
                  (setq merged nil)
                  (cl-return nil)))
            (push binding merged)))))
    merged))

(defun meta-log-datalog-immediate-query (db goal)
  "Query database immediately (no rule evaluation).
Returns matching facts."
  (let ((pred (car goal))
        (key (symbol-name pred))
        (results '()))
    (dolist (fact (gethash key db '()))
      (let ((bindings (meta-log-datalog-unify goal fact '())))
        (when bindings
          (push (meta-log-datalog-subst goal bindings) results))))
    results))

(defun meta-log-datalog-extract-facts (org-ast)
  "Extract facts from Org Mode AST.
ORG-AST is the parsed Org structure."
  ;; Implementation will extract facts from Org headings and properties
  ;; Placeholder for now
  '())

(defun meta-log-datalog-query-interactive (query-string)
  "Execute a Datalog query from a string."
  (interactive "sDatalog query: ")
  (let ((goal (read query-string)))
    (let ((results (meta-log-datalog-query goal)))
      (if results
          (progn
            (message "Found %d fact(s)" (length results))
            (with-output-to-temp-buffer "*meta-log-datalog-results*"
              (dolist (result results)
                (princ (format "%S\n" result)))))
        (message "No facts found")))))

(provide 'meta-log-datalog)

;;; meta-log-datalog.el ends here

