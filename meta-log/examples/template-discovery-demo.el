;;; template-discovery-demo.el --- Template discovery demo

;; Demo showing dynamic template discovery using WordNet, Org Mode,
;; Canvas API, and meta-log federation.

(require 'meta-log-template-discovery)
(require 'meta-log-wordnet)
(require 'meta-log-federation)

(defun meta-log-template-discovery-demo (description)
  "Demo template discovery with natural language description.
DESCRIPTION is natural language description."
  (interactive "sTemplate description: ")
  
  ;; Initialize federation if needed
  (unless meta-log-federation--initialized-p
    (let ((blackboard "~/.emacs.d/meta-log/federation-blackboard.org")
          (mqtt-broker (or (getenv "META_LOG_MQTT_BROKER") "mqtt://localhost:1883")))
      (meta-log-federation-init blackboard mqtt-broker)))
  
  ;; Discover templates
  (message "=== Discovering Templates ===")
  (message "Description: %s" description)
  
  (let ((templates (meta-log-discover-template description t))) ; Use federation
    (if templates
        (progn
          (message "Found %d template(s):" (length templates))
          (dolist (template templates)
            (message "")
            (message "Template: %s" (meta-log-template-name template))
            (message "  ID: %s" (meta-log-template-id template))
            (message "  Dimension: %s" (meta-log-template-dimension template))
            (message "  Semantic Field: %s" (meta-log-template-semantic-field template))
            (message "  Similarity: %.2f" (meta-log-template-similarity-score template))
            (when (meta-log-template-org-file template)
              (message "  Org File: %s" (meta-log-template-org-file template)))
            (when (meta-log-template-canvas-api-mappings template)
              (message "  Canvas API Mappings:")
              (dolist (mapping (meta-log-template-canvas-api-mappings template))
                (message "    - %s: %s.%s()"
                         (plist-get mapping :keyword)
                         (plist-get mapping :api)
                         (plist-get mapping :method)))))
          
          ;; Generate CanvasL for first template
          (let ((best-template (car templates)))
            (message "")
            (message "=== Generating CanvasL Template ===")
            (let ((canvasl (meta-log-template-discovery-build-canvasl best-template)))
              (with-output-to-temp-buffer "*meta-log-template*"
                (princ canvasl))
              (message "CanvasL template generated in buffer *meta-log-template*")))
          
          templates)
      (message "No templates found. Generating new template...")
      (let ((new-template (meta-log-discover-template description)))
        (when new-template
          (let ((canvasl (meta-log-template-discovery-build-canvasl (car new-template))))
            (with-output-to-temp-buffer "*meta-log-template*"
              (princ canvasl))
            (message "New template generated in buffer *meta-log-template*")))))))

(provide 'meta-log-template-discovery-demo)


