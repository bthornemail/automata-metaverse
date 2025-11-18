;;; verifiable-computation-demo.el --- Verifiable computation demo

;; Demo showing how to use verifiable computation for cryptographic proofs

(require 'meta-log-verifiable-computation)
(require 'meta-log-federation)

(defun meta-log-verifiable-computation-demo ()
  "Demo verifiable computation."
  (interactive)
  
  ;; Initialize federation if needed
  (unless meta-log-federation--initialized-p
    (let ((blackboard "~/.emacs.d/meta-log/federation-blackboard.org")
          (mqtt-broker (or (getenv "META_LOG_MQTT_BROKER") "mqtt://localhost:1883")))
      (meta-log-federation-init blackboard mqtt-broker)))
  
  ;; Execute verifiable computation
  (message "=== Executing Verifiable Computation ===")
  (let ((vc (meta-log-verifiable-computation-execute "church-add" 2 3)))
    (message "Computation ID: %s" (meta-log-verifiable-computation-id vc))
    (message "Function: %s" (meta-log-verifiable-computation-function-name vc))
    (message "Arguments: %S" (meta-log-verifiable-computation-arguments vc))
    (message "Result: %S" (meta-log-verifiable-computation-result vc))
    (message "Signature: %s" (meta-log-verifiable-computation-signature vc))
    (message "Peer ID: %s" (meta-log-verifiable-computation-peer-id vc))
    
    ;; Verify computation
    (message "")
    (message "=== Verifying Computation ===")
    (let ((verified (meta-log-verifiable-computation-verify
                     (meta-log-verifiable-computation-id vc))))
      (if verified
          (message "✓ Computation verified!")
        (message "✗ Verification failed"))
      
      vc))))

(defun meta-log-verifiable-computation-query-demo ()
  "Demo querying federation for verified computation."
  (interactive)
  
  ;; Query for verified result
  (message "=== Querying Federation for Verified Computation ===")
  (let ((result (meta-log-verifiable-computation-query "church-add" 2 3)))
    (if result
        (progn
          (message "✓ Found verified result: %S" result)
          (message "No local execution needed!"))
      (message "No verified result found, executing locally...")
      (meta-log-verifiable-computation-demo))))

(provide 'meta-log-verifiable-computation-demo)


