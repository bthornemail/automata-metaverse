# Installation Guide - Meta-Log Emacs Package

## System Requirements

### Minimum Requirements

- **Emacs**: 28.1 or higher
- **Org Mode**: 9.6 or higher
- **Operating System**: Linux, macOS, or Windows with WSL
- **Disk Space**: ~50 MB for package + dependencies
- **RAM**: 512 MB available

### Recommended Requirements

- **Emacs**: 29.1 or higher
- **Org Mode**: 9.7 or higher
- **RAM**: 2 GB available (for federation features)

## Core Dependencies

These are required for basic functionality:

```elisp
;; Installed automatically by package manager
(require 'org "9.6")       ; Org Mode
(require 'geiser "0.18")   ; R5RS Scheme integration
(require 'dash "2.19")     ; Modern list library
```

## Optional Dependencies

For advanced features, install these separately:

### Federation Features

**MQTT Broker** (Mosquitto recommended):

```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# macOS
brew install mosquitto

# Arch Linux
sudo pacman -S mosquitto
```

**WebRTC Support** (Node.js):

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node

# Verify installation
node --version  # Should be v18 or higher
```

### Semantic Analysis

**WordNet** database:

```bash
# Ubuntu/Debian
sudo apt-get install wordnet wordnet-dev

# macOS
brew install wordnet

# Verify installation
wn test -over  # Should show WordNet definition
```

## Installation Methods

### Method 1: Via MELPA (Recommended - Coming Soon)

Once published to MELPA:

1. Add MELPA to your `init.el`:

```elisp
(require 'package)
(add-to-list 'package-archives
             '("melpa" . "https://melpa.org/packages/") t)
(package-initialize)
```

2. Install meta-log:

```elisp
M-x package-refresh-contents RET
M-x package-install RET meta-log RET
```

3. Configure in `init.el`:

```elisp
(require 'meta-log)
(meta-log-initialize)
```

### Method 2: Via GitHub (Current)

1. **Clone the repository**:

```bash
cd ~/projects
git clone https://github.com/bthornemail/meta-log.git
```

2. **Install using package-install-file**:

```elisp
M-x package-install-file RET ~/projects/meta-log RET
```

3. **Configure in `init.el`**:

```elisp
(require 'meta-log)
(meta-log-initialize)
```

### Method 3: Manual Installation

1. **Clone the repository**:

```bash
cd ~/.emacs.d
mkdir -p packages
cd packages
git clone https://github.com/bthornemail/meta-log.git
```

2. **Add to load path in `init.el`**:

```elisp
(add-to-list 'load-path "~/.emacs.d/packages/meta-log")
(require 'meta-log)
(meta-log-initialize)
```

3. **Install dependencies manually**:

```elisp
M-x package-install RET org RET
M-x package-install RET geiser RET
M-x package-install RET dash RET
```

### Method 4: Using straight.el

If you use straight.el:

```elisp
(straight-use-package
  '(meta-log :type git
             :host github
             :repo "bthornemail/meta-log"))

(require 'meta-log)
(meta-log-initialize)
```

### Method 5: Using use-package

With use-package:

```elisp
(use-package meta-log
  :straight (:host github :repo "bthornemail/meta-log")
  :config
  (meta-log-initialize))
```

## Configuration

### Basic Configuration

Add to your `init.el`:

```elisp
;; Basic setup
(require 'meta-log)
(meta-log-initialize)

;; Set custom configuration directory (optional)
(setq meta-log-config-dir "~/.emacs.d/meta-log")

;; Enable verbose logging (for debugging)
(setq meta-log-verbose t)
```

### Advanced Configuration

```elisp
;; Full configuration with all features
(require 'meta-log)

;; Core settings
(setq meta-log-config-dir "~/.emacs.d/meta-log")
(setq meta-log-verbose nil)

;; Org Mode integration
(setq meta-log-org-template-dir "~/org/templates")
(setq meta-log-org-blackboard-file "~/org/automaton.org")

;; R5RS settings
(setq meta-log-r5rs-implementation 'guile)  ; or 'racket, 'chicken

;; Initialize
(meta-log-initialize)

;; Optional: Enable federation
(require 'meta-log-federation)
(require 'meta-log-mqtt)
(setq meta-log-mqtt-broker "localhost")
(setq meta-log-mqtt-port 1883)
(meta-log-federation-init)

;; Optional: Enable template discovery
(require 'meta-log-template-discovery)
(require 'meta-log-wordnet)
(setq meta-log-wordnet-dir "/usr/share/wordnet")

;; Optional: Verifiable computation
(require 'meta-log-verifiable-computation)
(require 'meta-log-collective-intelligence)

;; Keybindings
(global-set-key (kbd "C-c m i") 'meta-log-initialize)
(global-set-key (kbd "C-c m a") 'meta-log-ask)
(global-set-key (kbd "C-c m e") 'meta-log-m-expr-eval)
(global-set-key (kbd "C-c m p") 'meta-log-prolog-query)
(global-set-key (kbd "C-c m d") 'meta-log-datalog-query)
(global-set-key (kbd "C-c m r") 'meta-log-r5rs-eval)
```

## Verification

### Test Installation

Run these commands to verify installation:

```elisp
;; Check meta-log is loaded
(meta-log-initialize)
;; Should see: "meta-log initialized successfully"

;; Test Prolog engine
(meta-log-prolog-query "member(X, [1,2,3])")
;; Should return: ((X . 1) (X . 2) (X . 3))

;; Test Datalog engine
(meta-log-datalog-query "parent(?X, ?Y)")
;; Should return results if facts exist

;; Test R5RS engine
(meta-log-r5rs-eval "(+ 1 2 3)")
;; Should return: 6

;; Test natural language
(meta-log-ask "What is 2 + 2?")
;; Should return: "2 + 2 equals 4"
```

### Check Versions

```elisp
;; Check meta-log version
(meta-log-version)
;; Should show: "1.0.0"

;; Check dependencies
(package-installed-p 'org)      ; Should be t
(package-installed-p 'geiser)   ; Should be t
(package-installed-p 'dash)     ; Should be t
```

## Troubleshooting

### Issue: Package not found

**Problem**: `Cannot find meta-log package`

**Solution**:
```elisp
;; Refresh package list
M-x package-refresh-contents RET

;; Try installing again
M-x package-install RET meta-log RET
```

### Issue: Geiser not working

**Problem**: `R5RS evaluation fails`

**Solution**:
```bash
# Install Guile Scheme
sudo apt-get install guile-3.0  # Ubuntu/Debian
brew install guile              # macOS

# Or install Racket
sudo apt-get install racket     # Ubuntu/Debian
brew install racket             # macOS
```

Then in Emacs:
```elisp
(setq meta-log-r5rs-implementation 'guile)  ; or 'racket
```

### Issue: MQTT connection fails

**Problem**: `Cannot connect to MQTT broker`

**Solution**:
```bash
# Check Mosquitto is running
systemctl status mosquitto

# Start Mosquitto
sudo systemctl start mosquitto

# Test connection
mosquitto_sub -t test/topic &
mosquitto_pub -t test/topic -m "test"
```

### Issue: WordNet not found

**Problem**: `WordNet database not accessible`

**Solution**:
```bash
# Find WordNet installation
which wn
ls /usr/share/wordnet

# Set path in Emacs
(setq meta-log-wordnet-dir "/usr/share/wordnet")
```

### Issue: Permission denied

**Problem**: `Cannot write to config directory`

**Solution**:
```bash
# Create directory with proper permissions
mkdir -p ~/.emacs.d/meta-log
chmod 755 ~/.emacs.d/meta-log

# Or set custom directory
(setq meta-log-config-dir "~/meta-log-data")
```

## Uninstallation

### Remove Package

```elisp
M-x package-delete RET meta-log RET
```

### Clean Configuration

```bash
# Remove configuration files
rm -rf ~/.emacs.d/meta-log

# Remove from init.el
# Delete or comment out meta-log configuration lines
```

### Remove Dependencies (Optional)

```elisp
M-x package-delete RET geiser RET
M-x package-delete RET dash RET
# Keep org-mode if used for other purposes
```

## Updating

### Via MELPA

```elisp
M-x package-refresh-contents RET
M-x package-upgrade RET meta-log RET
```

### Via GitHub

```bash
cd ~/projects/meta-log
git pull origin main
```

Then in Emacs:
```elisp
M-x meta-log-reload
# Or restart Emacs
```

## Post-Installation Setup

### 1. Create Configuration Directory

```bash
mkdir -p ~/.emacs.d/meta-log/{config,templates,federation,cache}
```

### 2. Create Sample Automaton File

```bash
cat > ~/org/automaton.org << 'EOF'
#+TITLE: My Automaton
#+CANVASL_VERSION: 1.0
#+CANVASL_DIMENSION: 2D

* Facts
#+BEGIN_SRC meta-log-prolog
parent(john, mary).
parent(mary, susan).
#+END_SRC

* Rules
#+BEGIN_SRC meta-log-datalog
ancestor(?X, ?Y) :- parent(?X, ?Y).
ancestor(?X, ?Z) :- parent(?X, ?Y), ancestor(?Y, ?Z).
#+END_SRC

* Queries
#+BEGIN_SRC meta-log-prolog :results output
?- ancestor(X, susan).
#+END_SRC
EOF
```

### 3. Initialize Federation (Optional)

```elisp
;; Generate peer identity
(require 'meta-log-federation)
(meta-log-federation-init)

;; This will create:
;; ~/.emacs.d/meta-log/federation/identity.key
;; ~/.emacs.d/meta-log/federation/peers.jsonl
```

### 4. Test Installation

```elisp
;; Open sample file
(find-file "~/org/automaton.org")

;; Execute code block with C-c C-c
;; Should show ancestor results
```

## Docker Installation (Alternative)

For containerized deployment:

```bash
# Clone repository
git clone https://github.com/bthornemail/meta-log.git
cd meta-log/docker

# Build and run
docker-compose up -d

# Access Emacs in container
docker exec -it meta-log-emacs emacsclient -nw
```

## Integration with Existing Emacs Setup

### Doom Emacs

Add to `packages.el`:

```elisp
(package! meta-log
  :recipe (:host github :repo "bthornemail/meta-log"))
```

Add to `config.el`:

```elisp
(use-package! meta-log
  :config
  (meta-log-initialize))
```

### Spacemacs

Add to `dotspacemacs-additional-packages`:

```elisp
(meta-log :location (recipe
                      :fetcher github
                      :repo "bthornemail/meta-log"))
```

### Prelude

Add to `prelude-packages.el`:

```elisp
(prelude-require-package 'meta-log)
(require 'meta-log)
(meta-log-initialize)
```

## Next Steps

After installation:

1. Read the [User Guide](USER_GUIDE.md)
2. Explore [Examples](../../examples/)
3. Join the community at https://github.com/bthornemail/meta-log/discussions
4. Report issues at https://github.com/bthornemail/meta-log/issues

---

*For help, visit: https://bthornemail.github.io/meta-log/*
