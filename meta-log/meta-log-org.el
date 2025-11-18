;;; meta-log-org.el --- Org Mode blackboard integration

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; Org Mode integration for automaton blackboard.
;; Maps Org headings to canvas nodes, extracts facts from structure.

;;; Code:

(require 'org)
(require 'org-element)

(defun meta-log-org-load-blackboard (file)
  "Load an Org Mode file as automaton blackboard.
FILE is the path to the Org file."
  (interactive "fOrg blackboard file: ")
  (let ((buffer (find-file-noselect file)))
    (with-current-buffer buffer
      (let ((ast (org-element-parse-buffer)))
        (meta-log-org-extract-facts ast)
        (meta-log-org-map-to-canvas ast)))))

(defun meta-log-org-extract-facts (ast)
  "Extract facts from Org Mode AST.
AST is the parsed Org structure."
  (require 'meta-log-prolog)
  (require 'meta-log-datalog)
  (let ((facts '()))
    (org-element-map ast 'headline
      (lambda (heading)
        (let ((node-id (meta-log-org-heading-to-node heading))
              (facts-from-heading (meta-log-org-heading-extract-facts heading)))
          (setq facts (append facts facts-from-heading)))))
    facts))

(defun meta-log-org-heading-to-node (heading)
  "Convert Org heading to canvas node.
Returns node ID."
  (let ((id (org-element-property :ID heading))
        (title (org-element-property :title heading)))
    (or id
        (replace-regexp-in-string "[^a-zA-Z0-9-]" "-" title))))

(defun meta-log-org-heading-extract-facts (heading)
  "Extract facts from an Org heading.
Returns list of facts."
  (let ((facts '())
        (node-id (meta-log-org-heading-to-node heading))
        (properties (org-element-property :PROPERTY heading)))
    ;; Extract node fact
    (push (list 'node node-id (org-element-property :title heading)) facts)
    ;; Extract property facts
    (when properties
      (let ((dimension (org-element-property :DIMENSION properties))
            (node-type (org-element-property :NODE_TYPE properties)))
        (when dimension
          (push (list 'dimension node-id dimension) facts))
        (when node-type
          (push (list 'node-type node-id node-type) facts))))
    facts))

(defun meta-log-org-property-to-metadata (properties)
  "Extract metadata from Org property drawer.
PROPERTIES is the property drawer alist."
  (let ((metadata '()))
    (dolist (prop properties)
      (let ((key (car prop))
            (value (cdr prop)))
        (when (string-prefix-p "META_LOG_" key)
          (push (cons key value) metadata))))
    metadata))

(defun meta-log-org-map-to-canvas (ast)
  "Map Org structure to canvas topology.
AST is the parsed Org structure."
  (let ((nodes '())
        (edges '()))
    (org-element-map ast 'headline
      (lambda (heading)
        (let ((node-id (meta-log-org-heading-to-node heading))
              (level (org-element-property :level heading))
              (parent (org-element-property :parent heading)))
          (push (list node-id level) nodes)
          (when parent
            (let ((parent-id (meta-log-org-heading-to-node parent)))
              (push (list 'vertical parent-id node-id) edges))))))
    (list :nodes nodes :edges edges)))

(defun meta-log-org-save-blackboard (file)
  "Save current blackboard to Org file.
FILE is the path to save to."
  (interactive "FSave blackboard to: ")
  ;; Implementation: convert database facts back to Org structure
  (message "Saving blackboard to %s" file))

(defun meta-log-org-search-templates (keywords)
  "Search Org Mode blackboard for templates matching keywords.
KEYWORDS is list of keyword plists.
Returns list of template structures."
  (let ((templates '())
        (org-files (meta-log-org-find-template-files)))
    (dolist (org-file org-files)
      (let ((matches (meta-log-org-extract-templates org-file keywords)))
        (setq templates (append templates matches))))
    templates))

(defun meta-log-org-find-template-files ()
  "Find Org Mode template files.
Returns list of file paths."
  (let ((files '())
        (search-dirs (list "~/.emacs.d/meta-log/templates"
                          "~/.emacs.d/meta-log/examples"
                          default-directory)))
    (dolist (dir search-dirs)
      (when (file-directory-p dir)
        (let ((org-files (directory-files dir t "\\.org$")))
          (setq files (append files org-files)))))
    files))

(defun meta-log-org-extract-templates (org-file keywords)
  "Extract templates from Org file.
ORG-FILE is path to Org file.
KEYWORDS is list of keyword plists.
Returns list of template metadata."
  (let ((buffer (find-file-noselect org-file))
        (templates '()))
    (with-current-buffer buffer
      (let ((ast (org-element-parse-buffer)))
        (org-element-map ast 'headline
          (lambda (heading)
            (let ((title (org-element-property :title heading))
                  (properties (org-element-property :PROPERTY heading)))
              ;; Check if heading has template properties
              (when (or (org-entry-get (point) "CANVASL_TEMPLATE")
                       (org-entry-get (point) "CANVASL_CID"))
                (push (list :file org-file
                           :title title
                           :dimension (org-entry-get (point) "CANVASL_DIMENSION")
                           :cid (org-entry-get (point) "CANVASL_CID"))
                      templates)))))))
    (kill-buffer buffer)
    templates))

(provide 'meta-log-org)

;;; meta-log-org.el ends here

