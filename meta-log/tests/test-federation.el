;;; test-federation.el --- Federation test suite

;; Test suite for meta-log federation functionality

;; Add load path
(add-to-list 'load-path (file-name-directory (or load-file-name default-directory)))

(require 'cl-lib)
(require 'meta-log)
(require 'meta-log-crypto)
(require 'meta-log-identity)
(require 'meta-log-mqtt)
(require 'meta-log-webrtc)
(require 'meta-log-federation)
(require 'meta-log-protocol)
(require 'meta-log-server)

(defun test-federation-crypto ()
  "Test cryptographic operations."
  (message "Testing crypto module...")
  (let ((mnemonic (meta-log-crypto-generate-mnemonic 128))
        (seed nil)
        (key-pair nil)
        (errors '()))
    (unless (listp mnemonic)
      (push "Mnemonic should be a list" errors))
    (unless (= (length mnemonic) 12)
      (push "Mnemonic should have 12 words" errors))
    
    (setq seed (meta-log-crypto-mnemonic-to-seed mnemonic))
    (unless seed
      (push "Seed should not be nil" errors))
    (unless (= (length seed) 64)
      (push "Seed should be 64 bytes" errors))
    
    (setq key-pair (meta-log-crypto-derive-meta-log-key seed 0 0 0))
    (unless key-pair
      (push "Key pair should not be nil" errors))
    (unless (= (length key-pair) 3)
      (push "Key pair should have 3 elements" errors))
    
    (if errors
        (progn
          (message "✗ Crypto tests failed: %s" (mapconcat 'identity errors ", "))
          nil)
      (progn
        (message "✓ Crypto tests passed")
        t))))

(defun test-federation-identity ()
  "Test identity management."
  (message "Testing identity module...")
  (let ((identity (meta-log-identity-create-peer))
        (errors '()))
    (unless identity
      (push "Identity should not be nil" errors))
    (unless (meta-log-peer-identity-p identity)
      (push "Identity should be a peer-identity struct" errors))
    
    (let ((peer-id (meta-log-identity-get-peer-id identity))
          (public-key (meta-log-identity-get-public-key identity)))
      (unless peer-id
        (push "Peer ID should not be nil" errors))
      (unless public-key
        (push "Public key should not be nil" errors))
      (unless (string-prefix-p "peer-" peer-id)
        (push "Peer ID should start with 'peer-'" errors)))
    
    (let ((message "test message")
          (signature (meta-log-identity-sign-message identity message)))
      (unless signature
        (push "Signature should not be nil" errors))
      (unless (string-prefix-p "0x" signature)
        (push "Signature should start with '0x'" errors))
      
      (let ((valid (meta-log-identity-verify-peer identity signature message)))
        (unless valid
          (push "Signature should be valid" errors))))
    
    (if errors
        (progn
          (message "✗ Identity tests failed: %s" (mapconcat 'identity errors ", "))
          nil)
      (progn
        (message "✓ Identity tests passed")
        t))))

(defun test-federation-protocol ()
  "Test protocol handlers."
  (message "Testing protocol handlers...")
  (let ((canvasl-handler (gethash "canvasl" meta-log-protocol--handlers))
        (webrtc-handler (gethash "webrtc" meta-log-protocol--handlers))
        (mqtt-handler (gethash "mqtt" meta-log-protocol--handlers))
        (errors '()))
    (unless canvasl-handler
      (push "canvasl:// handler should be registered" errors))
    (unless webrtc-handler
      (push "webrtc:// handler should be registered" errors))
    (unless mqtt-handler
      (push "mqtt:// handler should be registered" errors))
    
    (if errors
        (progn
          (message "✗ Protocol handler tests failed: %s" (mapconcat 'identity errors ", "))
          nil)
      (progn
        (message "✓ Protocol handler tests passed")
        t))))

(defun test-federation-blackboard ()
  "Test federation blackboard."
  (message "Testing federation blackboard...")
  (let ((test-file "/tmp/test-federation-blackboard.org")
        (errors '()))
    (meta-log-federation-create-blackboard test-file)
    (unless (file-exists-p test-file)
      (push "Blackboard file should exist" errors))
    
    (let ((buffer (find-file-noselect test-file)))
      (with-current-buffer buffer
        (goto-char (point-min))
        (unless (re-search-forward "Federation Blackboard" nil t)
          (push "Should contain 'Federation Blackboard'" errors))
        (unless (re-search-forward "Peers" nil t)
          (push "Should contain 'Peers'" errors))
        (unless (re-search-forward "CanvasL State" nil t)
          (push "Should contain 'CanvasL State'" errors))))
    
    (when (file-exists-p test-file)
      (delete-file test-file))
    
    (if errors
        (progn
          (message "✗ Federation blackboard tests failed: %s" (mapconcat 'identity errors ", "))
          nil)
      (progn
        (message "✓ Federation blackboard tests passed")
        t))))

(defun test-federation-all ()
  "Run all federation tests."
  (message "=== Running Federation Test Suite ===")
  (let ((results '()))
    (push (test-federation-crypto) results)
    (push (test-federation-identity) results)
    (push (test-federation-protocol) results)
    (push (test-federation-blackboard) results)
    
    (let ((passed (length (cl-remove-if-not 'identity results)))
          (total (length results)))
      (message "")
      (message "=== Test Results ===")
      (message "Passed: %d/%d" passed total)
      (if (= passed total)
          (progn
            (message "✓ All tests passed!")
            t)
        (progn
          (message "✗ Some tests failed")
          nil)))))

;; Run tests if executed directly
(when (and (not noninteractive) (equal (buffer-name) "*scratch*"))
  (test-federation-all))

