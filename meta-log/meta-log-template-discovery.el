;;; meta-log-template-discovery.el --- Dynamic template discovery bridge

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; Dynamic template discovery bridge connecting:
;; - WordNet: Semantic analysis and keyword extraction
;; - Org Mode: Template storage and search
;; - Canvas API: Template generation and Web API mapping
;; - meta-log: Federation and collective intelligence

;;; Code:

(require 'cl-lib)
(require 'json)
(require 'meta-log-wordnet)
(require 'meta-log-org)
(require 'meta-log-collective-intelligence)
(require 'meta-log-federation)
(require 'meta-log-canvas-api)

(defvar meta-log-template-discovery--template-cache (make-hash-table :test 'equal)
  "Cache for discovered templates.")

(defstruct meta-log-template
  "Structure for template metadata."
  id
  name
  description
  keywords
  dimension
  semantic-field
  org-file
  canvasl-file
  canvas-api-mappings
  similarity-score)

(defun meta-log-discover-template (description &optional use-federation)
  "Discover templates using WordNet, Org Mode, Canvas API, and meta-log.
DESCRIPTION is natural language description of desired template.
USE-FEDERATION if non-nil, queries federation for templates.
Returns list of matching templates."
  (interactive "sTemplate description: ")
  
  ;; Step 1: WordNet semantic analysis
  (let ((keywords (meta-log-wordnet-extract-keywords description))
        (semantic-field (meta-log-wordnet-semantic-field description))
        (dimension (meta-log-wordnet-map-to-dimension description)))
    
    (message "Semantic analysis: dimension=%s, field=%s, keywords=%S"
             dimension semantic-field (mapcar (lambda (k) (plist-get k :word)) keywords))
    
    ;; Step 2: Query federation for similar templates (if enabled)
    (let ((federation-templates '()))
      (when (and use-federation meta-log-federation--initialized-p)
        (setq federation-templates
              (meta-log-template-discovery-query-federation description keywords dimension)))
      
      ;; Step 3: Search Org Mode blackboard
      (let ((org-templates (meta-log-template-discovery-search-org keywords dimension)))
        
        ;; Step 4: Generate CanvasL template if no matches found
        (let ((all-templates (append federation-templates org-templates)))
          (if all-templates
              ;; Sort by similarity score
              (sort all-templates (lambda (a b)
                                    (> (meta-log-template-similarity-score a)
                                       (meta-log-template-similarity-score b))))
            ;; Generate new template
            (list (meta-log-template-discovery-generate-template
                   keywords semantic-field dimension description))))))))

(defun meta-log-template-discovery-query-federation (description keywords dimension)
  "Query federation for templates matching description.
DESCRIPTION is the natural language description.
KEYWORDS is list of keyword plists.
DIMENSION is the target dimension.
Returns list of templates."
  (when meta-log-federation--initialized-p
    (let ((query (format "template(?Id, ?Name, ?Description, ?Dimension) :-
                          semantic-match(?Description, %S),
                          dimension-match(?Dimension, %S)"
                         description dimension)))
      (let ((results (meta-log-collective-intelligence-query query)))
        (let ((templates '())
              (result-list (if (listp results)
                              (if (plist-get results :result)
                                  (plist-get results :result)
                                results)
                            '())))
          (dolist (result result-list)
            (let ((template-id (if (listp result) (nth 0 result) (gethash "id" result)))
                  (template-name (if (listp result) (nth 1 result) (gethash "name" result)))
                  (template-desc (if (listp result) (nth 2 result) (gethash "description" result)))
                  (template-dim (if (listp result) (nth 3 result) (gethash "dimension" result))))
              (when template-id
                (let ((template (make-meta-log-template
                                 :id (format "%s" template-id)
                                 :name (or template-name "Unknown")
                                 :description (or template-desc description)
                                 :keywords keywords
                                 :dimension (or template-dim dimension)
                                 :similarity-score (meta-log-wordnet-semantic-similarity
                                                   description (or template-desc description)))))
                  (push template templates)))))
          templates)))))

(defun meta-log-template-discovery-search-org (keywords dimension)
  "Search Org Mode blackboard for templates.
KEYWORDS is list of keyword plists.
DIMENSION is target dimension.
Returns list of templates."
  (let ((templates '())
        (org-files (meta-log-org-find-template-files)))
    (dolist (org-file org-files)
      (let ((matches (meta-log-template-discovery-match-org-file org-file keywords dimension)))
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

(defun meta-log-template-discovery-match-org-file (org-file keywords dimension)
  "Match Org file against keywords and dimension.
ORG-FILE is path to Org file.
KEYWORDS is list of keyword plists.
DIMENSION is target dimension.
Returns list of matching templates."
  (let ((buffer (find-file-noselect org-file))
        (templates '()))
    (with-current-buffer buffer
      (let ((ast (org-element-parse-buffer)))
        (org-element-map ast 'headline
          (lambda (heading)
            (let ((title (org-element-property :title heading))
                  (properties (org-element-property :PROPERTY heading))
                  (file-dimension (org-entry-get (point) "CANVASL_DIMENSION")))
              ;; Check dimension match
              (when (or (not dimension)
                        (string= dimension file-dimension))
                ;; Calculate similarity
                (let ((similarity (meta-log-template-discovery-calculate-similarity
                                   keywords title)))
                  (when (> similarity 0.3) ; Threshold
                    (let ((template (make-meta-log-template
                                     :id (or (org-entry-get (point) "CANVASL_CID")
                                            (format "template-%d" (random 1000000)))
                                     :name title
                                     :description title
                                     :keywords keywords
                                     :dimension file-dimension
                                     :org-file org-file
                                     :similarity-score similarity)))
                      (push template templates)))))))))
    (kill-buffer buffer)
    templates))

(defun meta-log-template-discovery-calculate-similarity (keywords text)
  "Calculate similarity between keywords and text.
KEYWORDS is list of keyword plists.
TEXT is text to compare.
Returns similarity score (0.0-1.0)."
  (let ((text-lower (downcase text))
        (matches 0)
        (total (length keywords)))
    (dolist (keyword keywords)
      (let ((word (plist-get keyword :word)))
        (when (string-match-p word text-lower)
          (setq matches (1+ matches)))))
    (if (> total 0)
        (/ (float matches) total)
      0.0)))

(defun meta-log-template-discovery-generate-template (keywords semantic-field dimension description)
  "Generate new CanvasL template from keywords.
KEYWORDS is list of keyword plists.
SEMANTIC-FIELD is semantic field string.
DIMENSION is dimension string.
DESCRIPTION is natural language description.
Returns template structure."
  (let ((template-id (format "template-%d" (random 1000000)))
        (keyword-words (mapcar (lambda (k) (plist-get k :word)) keywords))
        (canvas-api-mappings (meta-log-template-discovery-map-to-canvas-api keyword-words)))
    
    (make-meta-log-template
     :id template-id
     :name (capitalize (mapconcat 'identity keyword-words " "))
     :description description
     :keywords keywords
     :dimension (or dimension "2D")
     :semantic-field semantic-field
     :canvas-api-mappings canvas-api-mappings
     :similarity-score 1.0)))

(defun meta-log-template-discovery-map-to-canvas-api (keywords)
  "Map keywords to Web Canvas API calls.
KEYWORDS is list of keyword strings.
Returns list of API mappings."
  (let ((mappings '()))
    (dolist (keyword keywords)
      (let ((mapping (meta-log-canvas-api-map-keyword keyword)))
        (when mapping
          (push (list :keyword keyword
                      :api (car mapping)
                      :method (cdr mapping))
                mappings))))
    (nreverse mappings)))

(defun meta-log-template-discovery-build-canvasl (template)
  "Build CanvasL template from template structure.
TEMPLATE is meta-log-template structure.
Returns CanvasL content string."
  (let ((directives (list
                     (format "@version 1.0")
                     (format "@schema canvasl")
                     (format "@dimension %s" (meta-log-template-dimension template))
                     (format "@generated %s" (format-time-string "%Y-%m-%dT%H:%M:%SZ"))))
        (frontmatter (list
                     (format "* %s" (meta-log-template-name template))
                     ":PROPERTIES:"
                     (format ":CANVASL_CID: %s" (meta-log-template-id template))
                     (format ":CANVASL_DIMENSION: %s" (meta-log-template-dimension template))
                     (format ":CANVASL_SEMANTIC_FIELD: %s" (meta-log-template-semantic-field template))
                     ":END:"))
        (body (list
               (format "# %s" (meta-log-template-name template))
               ""
               (format "%s" (meta-log-template-description template))
               ""
               "## Canvas API Mappings"
               "")))
    ;; Add API mappings
    (dolist (mapping (meta-log-template-canvas-api-mappings template))
      (push (format "- **%s**: %s.%s()"
                    (plist-get mapping :keyword)
                    (plist-get mapping :api)
                    (plist-get mapping :method))
            body))
    ;; Combine
    (let ((content (append directives '("") frontmatter '("") (nreverse body))))
      (mapconcat 'identity content "\n"))))

(defun meta-log-template-discovery-save-template (template output-file)
  "Save template to file.
TEMPLATE is meta-log-template structure.
OUTPUT-FILE is path to save template."
  (interactive)
  (let ((canvasl-content (meta-log-template-discovery-build-canvasl template)))
    (with-temp-file output-file
      (insert canvasl-content))
    (message "Template saved to %s" output-file)))

(provide 'meta-log-template-discovery)

;;; meta-log-template-discovery.el ends here

