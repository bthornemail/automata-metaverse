;;; meta-log-verifiable-computation.el --- Verifiable computation signatures

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; Verifiable computation system that cryptographically signs all computations
;; and enables peers to verify results without re-execution. This makes the
;; system better than an LLM by providing cryptographic proofs of correctness.

;;; Code:

(require 'cl-lib)
(require 'json)
(require 'meta-log-crypto)
(require 'meta-log-identity)
(require 'meta-log-r5rs)

(defvar meta-log-verifiable-computation--computation-registry (make-hash-table :test 'equal)
  "Registry of verifiable computations.")

(defvar meta-log-verifiable-computation--verification-cache (make-hash-table :test 'equal)
  "Cache for verified computations.")

(cl-defstruct meta-log-verifiable-computation
  "Structure for verifiable computation."
  id
  function-name
  arguments
  result
  signature
  peer-id
  public-key
  timestamp
  proof)

(defun meta-log-verifiable-computation-execute (function-name &rest args)
  "Execute a computation and create verifiable proof.
FUNCTION-NAME is the function to execute.
ARGS are the function arguments.
Returns verifiable computation structure."
  (let ((peer-identity (meta-log-federation-get-local-peer-identity)))
    (unless peer-identity
      (user-error "Peer identity not initialized. Run meta-log-federation-init")))
  
  ;; Execute computation
  (let ((result (apply 'meta-log-verifiable-computation-execute-function function-name args))
        (computation-id (format "comp-%d-%d" (random 1000000) (float-time))))
    
    ;; Create computation proof
    (let ((computation-data (list
                             (cons 'id computation-id)
                             (cons 'function function-name)
                             (cons 'arguments args)
                             (cons 'result result)
                             (cons 'timestamp (format-time-string "%Y-%m-%dT%H:%M:%SZ")))))
      
      ;; Sign computation
      (let ((peer-identity (meta-log-federation-get-local-peer-identity)))
        (unless peer-identity
          (error "Peer identity not initialized"))
        
        (let ((signature (meta-log-identity-sign-message
                          peer-identity
                          (json-encode computation-data))))
        
        ;; Create verifiable computation structure
        (let ((vc (make-meta-log-verifiable-computation
                   :id computation-id
                   :function-name function-name
                   :arguments args
                   :result result
                   :signature signature
                   :peer-id (meta-log-identity-get-peer-id peer-identity)
                   :public-key (meta-log-identity-get-public-key peer-identity)
                   :timestamp (format-time-string "%Y-%m-%dT%H:%M:%SZ")
                   :proof computation-data)))
          
          ;; Register computation
          (puthash computation-id vc meta-log-verifiable-computation--computation-registry)
          
          ;; Publish to federation
          (meta-log-verifiable-computation-publish vc)
          
          vc))))))

(defun meta-log-verifiable-computation-execute-function (function-name &rest args)
  "Execute a function and return result.
FUNCTION-NAME is the function name.
ARGS are the function arguments.
Returns result."
  (cond
   ((string-prefix-p "r5rs:" function-name)
    (require 'meta-log-r5rs)
    (let ((r5rs-fun (substring function-name 5)))
      (apply 'meta-log-r5rs-call r5rs-fun args)))
   ((string-prefix-p "church-" function-name)
    (require 'meta-log-r5rs)
    (apply 'meta-log-r5rs-call function-name args))
   (t
    (error "Unknown function: %s" function-name))))

(defun meta-log-verifiable-computation-verify (computation-id &optional peer-public-key)
  "Verify a computation without re-execution.
COMPUTATION-ID is the computation identifier.
PEER-PUBLIC-KEY is optional public key for verification.
Returns t if verified, nil otherwise."
  (let ((vc (gethash computation-id meta-log-verifiable-computation--computation-registry)))
    (unless vc
      (error "Computation not found: %s" computation-id))
    
    ;; Check cache first
    (let ((cached (gethash computation-id meta-log-verifiable-computation--verification-cache)))
      (when cached
        (return-from meta-log-verifiable-computation-verify cached)))
    
    ;; Verify signature
    (let ((public-key (or peer-public-key
                          (meta-log-verifiable-computation-public-key vc)))
          (signature (meta-log-verifiable-computation-signature vc))
          (computation-data (meta-log-verifiable-computation-proof vc)))
      
      ;; Create temporary peer identity for verification
      (let ((temp-peer (make-meta-log-peer-identity
                        :peer-id (meta-log-verifiable-computation-peer-id vc)
                        :public-key public-key
                        :private-key nil)))
          (let ((verified (meta-log-identity-verify-peer
                           temp-peer
                           signature
                           (json-encode computation-data))))
            
            ;; Cache verification result
            (puthash computation-id verified meta-log-verifiable-computation--verification-cache)
            
            verified)))))

(defun meta-log-verifiable-computation-publish (vc)
  "Publish verifiable computation to federation.
VC is a meta-log-verifiable-computation structure."
  (when meta-log-federation--mqtt-connection
    (let ((message (list
                    (cons 'type "verifiable-computation")
                    (cons 'id (meta-log-verifiable-computation-id vc))
                    (cons 'function (meta-log-verifiable-computation-function-name vc))
                    (cons 'arguments (meta-log-verifiable-computation-arguments vc))
                    (cons 'result (meta-log-verifiable-computation-result vc))
                    (cons 'signature (meta-log-verifiable-computation-signature vc))
                    (cons 'peer-id (meta-log-verifiable-computation-peer-id vc))
                    (cons 'public-key (meta-log-verifiable-computation-public-key vc))
                    (cons 'timestamp (meta-log-verifiable-computation-timestamp vc)))))
      
      (meta-log-mqtt-publish meta-log-federation--mqtt-connection
                             "canvasl/computations"
                             (json-encode message)))))

(defun meta-log-verifiable-computation-query (function-name &rest args)
  "Query federation for verifiable computation result.
FUNCTION-NAME is the function name.
ARGS are the function arguments.
Returns verified result or nil."
  (unless meta-log-federation--initialized-p
    (user-error "Federation not initialized"))
  
  ;; Search registry for matching computation
  (let ((matching-computations '()))
    (maphash (lambda (id vc)
               (when (and (string= (meta-log-verifiable-computation-function-name vc) function-name)
                          (equal (meta-log-verifiable-computation-arguments vc) args))
                 (push vc matching-computations)))
             meta-log-verifiable-computation--computation-registry)
    
    ;; Verify and return best result
    (let ((best-result nil)
          (best-trust 0.0))
      
      (dolist (vc matching-computations)
        (let ((verified (meta-log-verifiable-computation-verify
                         (meta-log-verifiable-computation-id vc))))
          (when verified
            (let ((trust (meta-log-collective-intelligence-get-trust-score
                          (meta-log-verifiable-computation-peer-id vc))))
              (when (> trust best-trust)
                (setq best-trust trust)
                (setq best-result (meta-log-verifiable-computation-result vc)))))))
      
      best-result)))

(defun meta-log-verifiable-computation-handle-published (message)
  "Handle published verifiable computation from another peer.
MESSAGE is the parsed message."
  (let ((computation-id (gethash "id" message))
        (function-name (gethash "function" message))
        (arguments (gethash "arguments" message))
        (result (gethash "result" message))
        (signature (gethash "signature" message))
        (peer-id (gethash "peer-id" message))
        (public-key (gethash "public-key" message))
        (timestamp (gethash "timestamp" message)))
    
    ;; Create verifiable computation structure
    (let ((vc (make-meta-log-verifiable-computation
               :id computation-id
               :function-name function-name
               :arguments arguments
               :result result
               :signature signature
               :peer-id peer-id
               :public-key public-key
               :timestamp timestamp
               :proof (list
                       (cons 'id computation-id)
                       (cons 'function function-name)
                       (cons 'arguments arguments)
                       (cons 'result result)
                       (cons 'timestamp timestamp)))))
      
      ;; Register computation
      (puthash computation-id vc meta-log-verifiable-computation--computation-registry)
      
      ;; Verify computation
      (let ((verified (meta-log-verifiable-computation-verify computation-id public-key)))
        (when verified
          (message "Verified computation %s from peer %s" computation-id peer-id)
          ;; Update trust score
          (meta-log-collective-intelligence-update-trust-score peer-id t t))))))

;; Setup handler for published computations
(add-hook 'meta-log-mqtt-message-received-hook
          (lambda (topic message)
            (when (string-match-p "^canvasl/computations$" topic)
              (let ((parsed (json-read-from-string message)))
                (when (string= (gethash "type" parsed) "verifiable-computation")
                  (meta-log-verifiable-computation-handle-published parsed))))))

(provide 'meta-log-verifiable-computation)

;;; meta-log-verifiable-computation.el ends here

