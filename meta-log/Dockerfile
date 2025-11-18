FROM debian:bookworm-slim

# Install system dependencies including Emacs
RUN apt-get update && apt-get install -y \
    emacs \
    emacs-common \
    guile-3.0 \
    git \
    curl \
    npm \
    mosquitto-clients \
    && rm -rf /var/lib/apt/lists/*

# Create Emacs configuration directory
RUN mkdir -p /root/.emacs.d

# Install MELPA packages
COPY .emacs.d/init.el /root/.emacs.d/init.el
RUN emacs --batch --eval "(package-refresh-contents)" \
    --eval "(package-install 'use-package)" \
    --eval "(package-install 'org)" \
    --eval "(package-install 'dash)" \
    --eval "(package-install 'json)" || true

# Install meta-log package (geiser is optional)
COPY . /root/.emacs.d/meta-log/
RUN emacs --batch --eval "(add-to-list 'load-path \"/root/.emacs.d/meta-log\")" \
    --eval "(condition-case err (require 'meta-log) (error (message \"Warning: %s\" (error-message-string err))))" || true

# Install automaton-evolutions (if available)
RUN npm install -g automaton-evolutions || true

# Setup Emacs server
EXPOSE 8080

# Default command: start Emacs server and keep it running
# Use --fg-daemon to keep process in foreground
CMD ["emacs", "--fg-daemon=server", "--eval", "(server-start)", "--eval", "(meta-log-initialize)"]

