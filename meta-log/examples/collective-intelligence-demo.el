;;; collective-intelligence-demo.el --- Collective intelligence demo

;; Demo showing how to use collective intelligence for federated queries

(require 'meta-log-collective-intelligence)
(require 'meta-log-federation)

(defun meta-log-collective-intelligence-demo ()
  "Demo collective intelligence query."
  (interactive)
  
  ;; Initialize federation if needed
  (unless meta-log-federation--initialized-p
    (let ((blackboard "~/.emacs.d/meta-log/federation-blackboard.org")
          (mqtt-broker (or (getenv "META_LOG_MQTT_BROKER") "mqtt://localhost:1883")))
      (meta-log-federation-init blackboard mqtt-broker)))
  
  ;; Query federation
  (let ((result (meta-log-collective-intelligence-query "node(?Id, ?Type)")))
    (message "=== Collective Intelligence Result ===")
    (message "Result: %S" (plist-get result :result))
    (message "Consensus Score: %.2f" (plist-get result :consensus))
    (message "Sources: %d peers" (length (plist-get result :sources)))
    (message "Total Peers: %d" (plist-get result :total-peers))
    
    (if (>= (plist-get result :consensus) 0.6)
        (message "✓ Consensus reached!")
      (message "⚠ Consensus threshold not met"))
    
    result))

(provide 'meta-log-collective-intelligence-demo)


