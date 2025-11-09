#!/bin/bash

# Generate Kubernetes ConfigMap and Secret from .env file

ENV_FILE=".env"
K8S_NAMESPACE="${K8S_NAMESPACE:-automaton}"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found"
    exit 1
fi

echo "Generating Kubernetes resources from .env file..."

# Create namespace if it doesn't exist
kubectl create namespace $K8S_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Generate ConfigMap
echo "apiVersion: v1
kind: ConfigMap
metadata:
  name: automaton-config
  namespace: $K8S_NAMESPACE
data:" > k8s/config/generated-configmap.yaml

# Add non-secret environment variables to ConfigMap
while IFS= read -r line; do
    # Skip comments and empty lines
    [[ $line =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    
    # Extract key and value
    if [[ $line == *"="* ]]; then
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2-)
        
        # Skip secret variables
        case $key in
            *PASSWORD|*SECRET|*PASS|JWT_SECRET|SESSION_SECRET|SMTP_*)
                continue
                ;;
        esac
        
        echo "  $key: \"$value\"" >> k8s/config/generated-configmap.yaml
    fi
done < "$ENV_FILE"

# Generate Secret
echo "apiVersion: v1
kind: Secret
metadata:
  name: automaton-secrets
  namespace: $K8S_NAMESPACE
type: Opaque
data:" > k8s/config/generated-secret.yaml

# Add secret environment variables to Secret
while IFS= read -r line; do
    # Skip comments and empty lines
    [[ $line =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    
    # Extract key and value
    if [[ $line == *"="* ]]; then
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2-)
        
        # Include only secret variables
        case $key in
            *PASSWORD|*SECRET|*PASS|JWT_SECRET|SESSION_SECRET|SMTP_*)
                # Base64 encode the value
                encoded_value=$(echo -n "$value" | base64)
                echo "  $key: \"$encoded_value\"" >> k8s/config/generated-secret.yaml
                ;;
        esac
    fi
done < "$ENV_FILE"

echo "Kubernetes resources generated:"
echo "- k8s/config/generated-configmap.yaml"
echo "- k8s/config/generated-secret.yaml"

echo "Applying to cluster..."
kubectl apply -f k8s/config/generated-configmap.yaml
kubectl apply -f k8s/config/generated-secret.yaml

echo "Done!"