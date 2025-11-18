;;; meta-log-collective-intelligence.el --- Collective intelligence via federation

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; Collective intelligence system that aggregates knowledge from multiple peers
;; and uses consensus mechanisms to resolve conflicts. This enables the system
;; to be better than an LLM by leveraging distributed knowledge and verification.

;;; Code:

(require 'cl-lib)
(require 'json)
(require 'meta-log-federation)
(require 'meta-log-identity)
(require 'meta-log-prolog)
(require 'meta-log-datalog)

(defvar meta-log-collective-intelligence--query-cache (make-hash-table :test 'equal)
  "Cache for collective query results.")

(defvar meta-log-collective-intelligence--trust-scores (make-hash-table :test 'equal)
  "Trust scores for peers based on verification history.")

(defvar meta-log-collective-intelligence--consensus-threshold 0.6
  "Minimum consensus threshold for accepting results (0.0-1.0).")

(defun meta-log-collective-intelligence-query (query &optional timeout)
  "Query all peers and aggregate results using consensus.
QUERY is a Prolog or Datalog query string.
TIMEOUT is optional timeout in seconds (default: 5).
Returns aggregated result with consensus score."
  (interactive "sQuery: ")
  (unless meta-log-federation--initialized-p
    (user-error "Federation not initialized. Run meta-log-federation-init"))
  
  ;; Check cache first
  (let ((cached (gethash query meta-log-collective-intelligence--query-cache)))
    (when cached
      (let ((age (- (float-time) (plist-get cached :timestamp))))
        (when (< age 60) ; Cache valid for 60 seconds
          (return-from meta-log-collective-intelligence-query cached)))))
  
  ;; Query all peers
  (let ((peer-results (meta-log-collective-intelligence-query-all-peers query timeout))
        (aggregated (meta-log-collective-intelligence-aggregate-results peer-results query)))
    
    ;; Cache result
    (puthash query (plist-put aggregated :timestamp (float-time))
             meta-log-collective-intelligence--query-cache)
    
    aggregated))

(defun meta-log-collective-intelligence-query-all-peers (query &optional timeout)
  "Query all discovered peers for a query.
QUERY is the query string.
TIMEOUT is optional timeout in seconds.
Returns list of (peer-id . result) pairs."
  (let ((timeout (or timeout 5))
        (peers (meta-log-federation-discover-peers))
        (results '()))
    
    (dolist (peer-id peers)
      (condition-case err
          (let ((result (meta-log-collective-intelligence-query-peer peer-id query timeout)))
            (when result
              (push (cons peer-id result) results)))
        (error
         (message "Error querying peer %s: %s" peer-id (error-message-string err)))))
    
    results))

(defun meta-log-collective-intelligence-query-peer (peer-id query timeout)
  "Query a specific peer.
PEER-ID is the peer identifier.
QUERY is the query string.
TIMEOUT is timeout in seconds.
Returns result or nil."
  (when meta-log-federation--mqtt-connection
    (let ((request-id (format "req-%d" (random 1000000)))
          (response-received nil)
          (response nil))
      
      ;; Subscribe to response topic
      (meta-log-mqtt-subscribe meta-log-federation--mqtt-connection
                               (format "canvasl/peers/%s/responses/%s" peer-id request-id)
                               (lambda (topic message)
                                 (setq response (json-read-from-string message))
                                 (setq response-received t)))
      
      ;; Publish query request
      (let ((peer-identity (meta-log-federation-get-local-peer-identity)))
        (if peer-identity
            (let ((request (list
                            (cons 'type "query-request")
                            (cons 'request-id request-id)
                            (cons 'query query)
                            (cons 'peer-id (meta-log-identity-get-peer-id peer-identity))
                            (cons 'timestamp (format-time-string "%Y-%m-%dT%H:%M:%SZ")))))
              (meta-log-mqtt-publish meta-log-federation--mqtt-connection
                                     (format "canvasl/peers/%s/queries" peer-id)
                                     (json-encode request)))
          (error "Peer identity not initialized"))))
      
      ;; Wait for response
      (let ((start-time (float-time))
            (elapsed 0))
        (while (and (not response-received) (< elapsed timeout))
          (sleep-for 0.1)
          (setq elapsed (- (float-time) start-time))))
      
      (when response-received
        (gethash "result" response)))))

(defun meta-log-collective-intelligence-aggregate-results (peer-results query)
  "Aggregate results from multiple peers using consensus.
PEER-RESULTS is a list of (peer-id . result) pairs.
QUERY is the original query string.
Returns aggregated result with consensus score."
  (if (null peer-results)
      (list :result nil :consensus 0.0 :sources '())
    
    ;; Group results by value
    (let ((result-groups (make-hash-table :test 'equal))
          (total-peers (length peer-results)))
      
      ;; Group results
      (dolist (peer-result peer-results)
        (let ((peer-id (car peer-result))
              (result (cdr peer-result))
              (trust-score (meta-log-collective-intelligence-get-trust-score peer-id)))
          
          (let ((key (format "%S" result)))
            (let ((group (gethash key result-groups)))
              (if group
                  (puthash key (plist-put group :count (+ (plist-get group :count) 1)
                                          :trust (+ (plist-get group :trust) trust-score)
                                          :peers (cons peer-id (plist-get group :peers)))
                           result-groups)
                (puthash key (list :result result
                                   :count 1
                                   :trust trust-score
                                   :peers (list peer-id))
                         result-groups))))))
      
      ;; Find result with highest consensus
      (let ((best-result nil)
            (best-score 0.0))
        
        (maphash (lambda (key group)
                   (let ((count-score (/ (plist-get group :count) total-peers))
                         (trust-score (/ (plist-get group :trust) total-peers))
                         (combined-score (* 0.6 count-score) (* 0.4 trust-score)))
                     
                     (when (> combined-score best-score)
                       (setq best-score combined-score)
                       (setq best-result group))))
                 result-groups)
        
        (if (and best-result (>= best-score meta-log-collective-intelligence--consensus-threshold))
            (list :result (plist-get best-result :result)
                  :consensus best-score
                  :sources (plist-get best-result :peers)
                  :total-peers total-peers)
          (list :result nil
                :consensus best-score
                :sources '()
                :total-peers total-peers
                :warning "Consensus threshold not met"))))))

(defun meta-log-collective-intelligence-get-trust-score (peer-id)
  "Get trust score for a peer.
PEER-ID is the peer identifier.
Returns trust score (0.0-1.0)."
  (let ((score (gethash peer-id meta-log-collective-intelligence--trust-scores)))
    (or score 0.5))) ; Default trust score

(defun meta-log-collective-intelligence-update-trust-score (peer-id verified correct)
  "Update trust score for a peer based on verification.
PEER-ID is the peer identifier.
VERIFIED is whether the result was verified.
CORRECT is whether the result was correct."
  (let ((current-score (meta-log-collective-intelligence-get-trust-score peer-id))
        (adjustment (cond
                     ((and verified correct) 0.1) ; Increase trust
                     ((and verified (not correct)) -0.2) ; Decrease trust
                     (t 0.0)))) ; No change if not verified
    
    (let ((new-score (max 0.0 (min 1.0 (+ current-score adjustment)))))
      (puthash peer-id new-score meta-log-collective-intelligence--trust-scores))))

(defun meta-log-collective-intelligence-handle-query-request (request)
  "Handle incoming query request from another peer.
REQUEST is the parsed request message."
  (let ((query (gethash "query" request))
        (request-id (gethash "request-id" request))
        (peer-id (gethash "peer-id" request)))
    
    ;; Execute query locally
    (let ((result (meta-log-collective-intelligence-execute-query-locally query)))
      
      ;; Sign result
      (let ((peer-identity (meta-log-federation-get-local-peer-identity)))
        (if peer-identity
            (let ((response (list
                            (cons 'type "query-response")
                            (cons 'request-id request-id)
                            (cons 'result result)
                            (cons 'peer-id (meta-log-identity-get-peer-id peer-identity))
                            (cons 'timestamp (format-time-string "%Y-%m-%dT%H:%M:%SZ")))))
              
              (let ((signature (meta-log-identity-sign-message
                                peer-identity
                                (json-encode response))))
          
                ;; Publish signed response
                (when meta-log-federation--mqtt-connection
                  (meta-log-mqtt-publish meta-log-federation--mqtt-connection
                                         (format "canvasl/peers/%s/responses/%s" peer-id request-id)
                                         (json-encode (append response (list (cons 'signature signature))))))))
          (error "Peer identity not initialized"))))

(defun meta-log-collective-intelligence-execute-query-locally (query)
  "Execute a query locally.
QUERY is a Prolog or Datalog query string.
Returns result."
  (cond
   ((string-match-p "^[A-Z]" query) ; Prolog query
    (require 'meta-log-prolog)
    (let ((goal (meta-log-prolog-parse-query query)))
      (meta-log-prolog-query goal)))
   (t ; Datalog query
    (require 'meta-log-datalog)
    (let ((facts (meta-log-datalog-extract-facts))
          (program (meta-log-datalog-build-program query)))
      (meta-log-datalog-query program query facts)))))

;; Setup handler for incoming queries
(add-hook 'meta-log-mqtt-message-received-hook
          (lambda (topic message)
            (when (string-match-p "^canvasl/peers/.*/queries$" topic)
              (let ((request (json-read-from-string message)))
                (when (string= (gethash "type" request) "query-request")
                  (meta-log-collective-intelligence-handle-query-request request))))))

(provide 'meta-log-collective-intelligence)

;;; meta-log-collective-intelligence.el ends here

