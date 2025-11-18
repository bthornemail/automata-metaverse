;;; meta-log-template-federation.el --- Federation support for template sharing

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; Federation support for sharing and discovering templates across peers.
;; Enables collective intelligence for template discovery and sharing.

;;; Code:

(require 'cl-lib)
(require 'json)
(require 'meta-log-federation)
(require 'meta-log-template-discovery)
(require 'meta-log-mqtt)

(defvar meta-log-template-federation--shared-templates (make-hash-table :test 'equal)
  "Registry of templates shared via federation.")

(defun meta-log-template-federation-share-template (template)
  "Share template with federation peers.
TEMPLATE is meta-log-template structure.
Returns t on success."
  (unless meta-log-federation--initialized-p
    (user-error "Federation not initialized. Run meta-log-federation-init"))
  (unless meta-log-federation--mqtt-connection
    (user-error "MQTT connection not established for federation."))

  (let ((peer-identity (meta-log-federation-get-local-peer-identity)))
    (if peer-identity
        (let ((message (list
                        (cons 'type "template-share")
                        (cons 'template-id (meta-log-template-id template))
                        (cons 'template-name (meta-log-template-name template))
                        (cons 'template-description (meta-log-template-description template))
                        (cons 'dimension (meta-log-template-dimension template))
                        (cons 'semantic-field (meta-log-template-semantic-field template))
                        (cons 'keywords (mapcar (lambda (k) (plist-get k :word))
                                               (meta-log-template-keywords template)))
                        (cons 'peer-id (meta-log-identity-get-peer-id peer-identity))
                        (cons 'timestamp (format-time-string "%Y-%m-%dT%H:%M:%SZ")))))
          
          ;; Sign message
          (let ((signature (meta-log-identity-sign-message
                           peer-identity
                           (json-encode message))))
            
            ;; Publish to federation
            (meta-log-mqtt-publish meta-log-federation--mqtt-connection
                                  "canvasl/templates/share"
                                  (json-encode (append message (list (cons 'signature signature)))))
            
            ;; Store locally
            (puthash (meta-log-template-id template) template
                    meta-log-template-federation--shared-templates)
            
            (message "Template %s shared with federation" (meta-log-template-id template))
            t))
      (error "Peer identity not initialized"))))

(defun meta-log-template-federation-handle-shared-template (topic message)
  "Handle incoming shared template from federation.
TOPIC is the MQTT topic.
MESSAGE is the JSON message string."
  (let* ((parsed (json-read-from-string message))
         (template-id (gethash "template-id" parsed))
         (peer-id (gethash "peer-id" parsed))
         (signature (gethash "signature" parsed)))
    
    ;; Verify signature
    (let ((peer (gethash peer-id meta-log-federation--peers)))
      (when peer
        (let ((verified (meta-log-identity-verify-peer
                         peer
                         signature
                         (json-encode (remq (cons "signature" signature) parsed)))))
          (when verified
            ;; Create template structure
            (let ((template (make-meta-log-template
                             :id template-id
                             :name (gethash "template-name" parsed)
                             :description (gethash "template-description" parsed)
                             :dimension (gethash "dimension" parsed)
                             :semantic-field (gethash "semantic-field" parsed)
                             :keywords (mapcar (lambda (k) (list :word k))
                                              (gethash "keywords" parsed))
                             :similarity-score 0.5))) ; Default similarity for shared templates
              
              ;; Store template
              (puthash template-id template meta-log-template-federation--shared-templates)
              
              ;; Notify user
              (message "Received shared template: %s from peer %s"
                      (gethash "template-name" parsed) peer-id)
              
              template)))))))

(defun meta-log-template-federation-setup ()
  "Setup federation template sharing.
Subscribes to template sharing topic."
  (when meta-log-federation--initialized-p
    (when meta-log-federation--mqtt-connection
      ;; Subscribe to template sharing topic
      (meta-log-mqtt-subscribe meta-log-federation--mqtt-connection
                               "canvasl/templates/share"
                               'meta-log-template-federation-handle-shared-template)
      (message "Template federation sharing enabled"))))

(defun meta-log-template-federation-query-templates (description &optional dimension)
  "Query federation for templates matching description.
DESCRIPTION is natural language description.
DIMENSION is optional dimension filter.
Returns list of templates."
  (unless meta-log-federation--initialized-p
    (user-error "Federation not initialized. Run meta-log-federation-init"))
  
  (let ((templates '())
        (keywords (meta-log-wordnet-extract-keywords description)))
    
    ;; Query all peers
    (let ((peers (hash-table-keys meta-log-federation--peers)))
      (dolist (peer-id peers)
        (let ((query (format "template(?Id, ?Name, ?Description) :-
                              semantic-match(?Description, %S)"
                             description)))
          (let ((result (meta-log-collective-intelligence-query-peer peer-id query)))
            (when result
              (let ((result-list (if (plist-get result :result)
                                     (plist-get result :result)
                                   '())))
                (dolist (r result-list)
                  (let ((template-id (if (listp r) (nth 0 r) (gethash "id" r)))
                        (template-name (if (listp r) (nth 1 r) (gethash "name" r)))
                        (template-desc (if (listp r) (nth 2 r) (gethash "description" r))))
                    (when template-id
                      (let ((template (make-meta-log-template
                                       :id (format "%s" template-id)
                                       :name (or template-name "Unknown")
                                       :description (or template-desc description)
                                       :keywords keywords
                                       :dimension (or dimension "2D")
                                       :similarity-score (meta-log-wordnet-semantic-similarity
                                                         description (or template-desc description)))))
                        (push template templates))))))))))
    
    templates))

(provide 'meta-log-template-federation)

;;; meta-log-template-federation.el ends here


