;;; meta-log-r5rs.el --- R5RS Scheme bridge via Geiser

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; R5RS Scheme integration via Geiser.
;; Loads and executes r5rs-canvas-engine.scm.

;;; Code:

(condition-case nil
    (progn
      (require 'geiser-mode)
      (require 'geiser-eval))
  (error
   (message "Warning: Geiser not available. R5RS functions will be limited.")))

(defvar meta-log-r5rs--engine-loaded nil
  "Whether the R5RS engine has been loaded.")

(defvar meta-log-r5rs--engine-path nil
  "Path to r5rs-canvas-engine.scm file.")

(defun meta-log-r5rs-load-engine (path)
  "Load R5RS engine from PATH.
PATH should point to r5rs-canvas-engine.scm file."
  (setq meta-log-r5rs--engine-path path)
  (if (fboundp 'geiser-eval--send/wait)
      (when (file-exists-p path)
        (let ((load-expr (format "(load \"%s\")" path)))
          (geiser-eval--send/wait load-expr))
        (setq meta-log-r5rs--engine-loaded t)
        (message "R5RS engine loaded from %s" path))
    (message "Warning: Geiser not available. R5RS engine loading skipped."))
  meta-log-r5rs--engine-loaded)

(defun meta-log-r5rs-eval (expression)
  "Evaluate an R5RS Scheme EXPRESSION.
Returns the result."
  (unless meta-log-r5rs--engine-loaded
    (user-error "R5RS engine not loaded. Run meta-log-r5rs-load-engine"))
  (if (fboundp 'geiser-eval--send/wait)
      (geiser-eval--send/wait expression)
    (user-error "Geiser not available. Cannot evaluate R5RS expressions.")))

(defun meta-log-r5rs-call (function-name &rest args)
  "Call an R5RS FUNCTION-NAME with ARGS.
Returns the result."
  (let ((call-expr (format "(%s %s)"
                           function-name
                           (mapconcat (lambda (arg)
                                        (format "%S" arg))
                                      args " "))))
    (meta-log-r5rs-eval call-expr)))

(defun meta-log-r5rs-eval-interactive (expression-string)
  "Evaluate an R5RS expression from a string."
  (interactive "sR5RS expression: ")
  (let ((result (meta-log-r5rs-eval expression-string)))
    (message "Result: %S" result)
    result))

(provide 'meta-log-r5rs)

;;; meta-log-r5rs.el ends here

