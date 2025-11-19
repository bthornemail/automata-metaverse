;;; meta-log-pkg.el --- Package definition for meta-log

(define-package "meta-log" "1.0.0"
  "Abstraction layer for automaton systems with Prolog, Datalog, and R5RS integration"
  '((emacs "28.1")
    (org "9.6")
    (geiser "0.18")
    (dash "2.19"))
  :keywords '("tools" "languages" "prolog" "datalog" "scheme" "lisp" "org")
  :url "https://github.com/bthornemail/meta-log"
  :authors '(("Brian Thorne" . "bthornemail@gmail.com"))
  :maintainer '("Brian Thorne" . "bthornemail@gmail.com"))

;;; meta-log-pkg.el ends here

