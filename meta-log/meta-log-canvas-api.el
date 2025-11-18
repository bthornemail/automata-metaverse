;;; meta-log-canvas-api.el --- Canvas API integration for templates

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;;; Commentary:

;; Canvas API integration for mapping templates to Web Canvas API calls.
;; Bridges CanvasL templates with Web APIs for executable applications.

;;; Code:

(require 'cl-lib)
(require 'json)

(defvar meta-log-canvas-api--mappings
  '(("geolocation" . ("getCurrentPosition" "watchPosition" "clearWatch"))
    ("notifications" . ("showNotification" "requestPermission"))
    ("clipboard" . ("writeText" "readText"))
    ("mediadevices" . ("getUserMedia" "enumerateDevices"))
    ("indexeddb" . ("put" "get" "delete" "open"))
    ("webrtc" . ("createPeerConnection" "createDataChannel"))
    ("webauthn" . ("create" "get"))
    ("crypto" . ("subtle" "getRandomValues"))
    ("fetch" . ("fetch" "Request" "Response"))
    ("canvas" . ("getContext" "toDataURL" "toBlob"))
    ("webgl" . ("getContext" "drawArrays" "drawElements")))
  "Web Canvas API mappings.")

(defun meta-log-canvas-api-map-keyword (keyword)
  "Map keyword to Canvas API call.
KEYWORD is keyword string.
Returns (api . method) or nil."
  (let ((keyword-lower (downcase keyword))
        (mapping-map
         '(("location" . ("geolocation" . "getCurrentPosition"))
           ("notify" . ("notifications" . "showNotification"))
           ("save" . ("indexeddb" . "put"))
           ("copy" . ("clipboard" . "writeText"))
           ("camera" . ("mediadevices" . "getUserMedia"))
           ("microphone" . ("mediadevices" . "getUserMedia"))
           ("peer" . ("webrtc" . "createPeerConnection"))
           ("identity" . ("webauthn" . "create"))
           ("crypto" . ("crypto" . "subtle"))
           ("network" . ("fetch" . "fetch"))
           ("render" . ("canvas" . "getContext"))
           ("visualize" . ("webgl" . "getContext")))))
    (let ((mapping (assoc keyword-lower mapping-map)))
      (if mapping
          (cdr mapping)
        nil))))

(defun meta-log-canvas-api-generate-code (api method &optional params)
  "Generate JavaScript code for Canvas API call.
API is API name string.
METHOD is method name string.
PARAMS is optional parameters alist.
Returns JavaScript code string."
  (let ((code (format "navigator.%s.%s(" api method)))
    (when params
      (let ((param-strs '()))
        (dolist (param params)
          (push (format "%s: %S" (car param) (cdr param)) param-strs))
        (setq code (concat code (mapconcat 'identity (nreverse param-strs) ", ")))))
    (concat code ")")))

(defun meta-log-canvas-api-build-template (keywords)
  "Build CanvasL template with Canvas API mappings.
KEYWORDS is list of keyword strings.
Returns template structure."
  (let ((macros '())
        (edges '()))
    (dolist (keyword keywords)
      (let ((mapping (meta-log-canvas-api-map-keyword keyword)))
        (when mapping
          (let ((api (car mapping))
                (method (cdr mapping))
                (edge-id (format "e_%s" keyword)))
            (push edge-id edges)
            (push (list :keyword keyword
                       :api api
                       :method method
                       :type (list "web_api" api)
                       :edge edge-id)
                  macros)))))
    (list :macros (nreverse macros)
          :edges (nreverse edges))))

(provide 'meta-log-canvas-api)

;;; meta-log-canvas-api.el ends here


