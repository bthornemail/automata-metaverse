;;; init.el --- Emacs initialization for meta-log Docker container

;; Initialize package system
(require 'package)
(add-to-list 'package-archives
             '("melpa" . "https://melpa.org/packages/") t)
(package-initialize)

;; Add meta-log to load path
(add-to-list 'load-path "/root/.emacs.d/meta-log")

;; Load meta-log
(require 'meta-log)

;; Initialize meta-log
(meta-log-initialize)

;; Initialize federation if configured (disabled by default to avoid blocking)
;; Users can enable federation manually: M-x meta-log-federation-init
;; Or set META_LOG_ENABLE_FEDERATION=1 environment variable
(when (and (getenv "META_LOG_MQTT_BROKER")
           (equal (getenv "META_LOG_ENABLE_FEDERATION") "1"))
  (condition-case err
      (let ((blackboard (or (getenv "META_LOG_FEDERATION_BLACKBOARD")
                            "/root/federation/blackboard.org"))
            (mqtt-broker (getenv "META_LOG_MQTT_BROKER")))
        (require 'meta-log-federation)
        (meta-log-federation-init blackboard mqtt-broker)
        (message "Federation initialized with broker: %s" mqtt-broker))
    (error
     (message "Warning: Federation initialization failed: %s" (error-message-string err)))))

