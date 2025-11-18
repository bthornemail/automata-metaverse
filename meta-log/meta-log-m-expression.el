;;; meta-log-m-expression.el --- M-expression parser and evaluator

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; M-expression parser and evaluator.
;; Converts M-expressions to S-expressions for evaluation.

;;; Code:

(require 'cl-lib)

(defvar meta-log-m-expression-mode-map
  (let ((map (make-sparse-keymap)))
    (define-key map (kbd "C-c C-e") 'meta-log-m-expr-eval)
    map)
  "Keymap for meta-log-m-expression-mode.")

(define-derived-mode meta-log-m-expression-mode lisp-mode "Meta-Log M-Expr"
  "Major mode for M-expressions."
  (setq font-lock-defaults
        '((("eval\\|query\\|prolog\\|datalog\\|church-add\\|church-mult\\|church-succ" . font-lock-keyword-face)
           ("\\[\\|\\]" . font-lock-bracket-face)
           (";" . font-lock-delimiter-face))
          nil nil nil nil)))

(defun meta-log-m-expr-parse (m-expr-string)
  "Parse an M-expression string into an S-expression.
M-EXPR-STRING format: \"eval[expr; env]\""
  (let ((tokens (meta-log-m-expr-tokenize m-expr-string)))
    (meta-log-m-expr-parse-tokens tokens)))

(defun meta-log-m-expr-tokenize (string)
  "Tokenize an M-expression string.
Returns list of tokens."
  (let ((tokens '())
        (i 0)
        (len (length string)))
    (while (< i len)
      (cond
       ((char-equal (aref string i) ?\[)
        (push 'open-bracket tokens)
        (cl-incf i))
       ((char-equal (aref string i) ?\])
        (push 'close-bracket tokens)
        (cl-incf i))
       ((char-equal (aref string i) ?\;)
        (push 'semicolon tokens)
        (cl-incf i))
       ((char-equal (aref string i) ?\s)
        (cl-incf i))
       (t
        (let ((start i))
          (while (and (< i len)
                      (not (member (aref string i) '(?\[ ?\] ?\; ?\s))))
            (cl-incf i))
          (push (substring string start i) tokens)))))
    (nreverse tokens)))

(defun meta-log-m-expr-parse-tokens (tokens)
  "Parse tokens into an S-expression."
  (if (null tokens)
      nil
    (let ((token (car tokens))
          (rest (cdr tokens)))
      (cond
       ((stringp token)
        (let ((parsed (meta-log-m-expr-parse-tokens rest)))
          (cons token parsed)))
       ((eq token 'open-bracket)
        (let ((args (meta-log-m-expr-parse-args rest)))
        (cons (car args) (cdr args))))
       (t
        (meta-log-m-expr-parse-tokens rest))))))

(defun meta-log-m-expr-parse-args (tokens)
  "Parse arguments until closing bracket.
Returns (args . remaining-tokens)."
  (let ((args '())
        (current '())
        (tokens tokens))
    (while tokens
      (let ((token (car tokens))
            (rest (cdr tokens)))
        (cond
         ((eq token 'close-bracket)
          (if current
              (setq args (cons (nreverse current) args)))
          (cl-return (cons (nreverse args) rest)))
         ((eq token 'semicolon)
          (if current
              (setq args (cons (nreverse current) args)
                    current '())))
         ((eq token 'open-bracket)
          (let ((nested (meta-log-m-expr-parse-args rest)))
            (push (car nested) current)
            (setq rest (cdr nested))))
         (t
          (push token current)))
        (setq tokens rest)))
    (cons (nreverse args) nil)))

(defun meta-log-m-expr-eval (m-expr)
  "Evaluate an M-expression.
M-EXPR can be a string or parsed S-expression."
  (let ((s-expr (if (stringp m-expr)
                    (meta-log-m-expr-parse m-expr)
                  m-expr)))
    (meta-log-m-expr-eval-s-expr s-expr)))

(defun meta-log-m-expr-eval-s-expr (s-expr)
  "Evaluate an S-expression converted from M-expression."
  (cond
   ((stringp s-expr)
    s-expr)
   ((listp s-expr)
    (let ((fun (car s-expr))
          (args (cdr s-expr)))
      (cond
       ((string= fun "eval")
        (meta-log-m-expr-eval-eval args))
       ((string= fun "query")
        (meta-log-m-expr-eval-query args))
       ((string= fun "prolog")
        (meta-log-m-expr-eval-prolog args))
       ((string= fun "datalog")
        (meta-log-m-expr-eval-datalog args))
       ((string-prefix-p "church-" fun)
        (meta-log-m-expr-eval-church fun args))
       (t
        (error "Unknown M-expression function: %s" fun)))))
   (t
    s-expr)))

(defun meta-log-m-expr-eval-eval (args)
  "Evaluate eval[expr; env] M-expression."
  (let ((expr (car args))
        (env (cadr args)))
    (meta-log-m-expr-eval-s-expr expr)))

(defun meta-log-m-expr-eval-query (args)
  "Evaluate query[find[...]; where[...]] M-expression."
  (let ((find-clause (car args))
        (where-clause (cadr args)))
    (require 'meta-log-datalog)
    (meta-log-datalog-query where-clause)))

(defun meta-log-m-expr-eval-prolog (args)
  "Evaluate prolog[goal; where[conditions]] M-expression."
  (let ((goal (car args))
        (conditions (cadr args)))
    (require 'meta-log-prolog)
    (meta-log-prolog-query goal)))

(defun meta-log-m-expr-eval-datalog (args)
  "Evaluate datalog[goal; where[conditions]] M-expression."
  (let ((goal (car args))
        (conditions (cadr args)))
    (require 'meta-log-datalog)
    (meta-log-datalog-query goal)))

(defun meta-log-m-expr-eval-church (fun args)
  "Evaluate Church encoding function."
  (require 'meta-log-r5rs)
  (let ((r5rs-fun (concat "r5rs:" fun)))
    (apply 'meta-log-r5rs-call r5rs-fun args)))

(defun meta-log-m-to-s (m-expr)
  "Convert M-expression to S-expression."
  (meta-log-m-expr-parse m-expr))

(defun meta-log-s-to-m (s-expr)
  "Convert S-expression to M-expression string.
This is a simplified conversion."
  (format "%S" s-expr))

(defun meta-log-m-expr-eval-interactive (m-expr-string)
  "Evaluate an M-expression from a string."
  (interactive "sM-expression: ")
  (let ((result (meta-log-m-expr-eval m-expr-string)))
    (message "Result: %S" result)
    result))

(provide 'meta-log-m-expression)

;;; meta-log-m-expression.el ends here

