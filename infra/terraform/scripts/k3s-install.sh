#!/bin/bash
# =============================================================================
# K3s Installation Script for Kabu Agent
# This script is executed as user_data on EC2 instance launch
# =============================================================================

set -euo pipefail

# Logging setup
exec > >(tee /var/log/k3s-install.log|logger -t k3s-install -s 2>/dev/console) 2>&1

echo "=========================================="
echo "Starting K3s Installation"
echo "=========================================="

# Variables from Terraform
K3S_VERSION="${k3s_version}"
DOMAIN_NAME="${domain_name}"
ADMIN_EMAIL="${admin_email}"
ELASTIC_IP="${elastic_ip}"
GHCR_USERNAME="${ghcr_username}"
GHCR_TOKEN="${ghcr_token}"

# =============================================================================
# System Updates and Prerequisites
# =============================================================================

echo "[1/7] Updating system packages..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
apt-get install -y \
    curl \
    wget \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    jq \
    unzip \
    htop \
    git

# =============================================================================
# Install K3s
# =============================================================================

echo "[2/7] Installing K3s version $K3S_VERSION..."

# K3s install options
K3S_INSTALL_OPTS="--disable servicelb --disable traefik"

# Add TLS SAN for external access
if [ -n "$ELASTIC_IP" ]; then
    K3S_INSTALL_OPTS="$K3S_INSTALL_OPTS --tls-san $ELASTIC_IP"
fi

if [ -n "$DOMAIN_NAME" ]; then
    K3S_INSTALL_OPTS="$K3S_INSTALL_OPTS --tls-san $DOMAIN_NAME"
    K3S_INSTALL_OPTS="$K3S_INSTALL_OPTS --tls-san *.$DOMAIN_NAME"
fi

# Install K3s
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="$K3S_VERSION" sh -s - server $K3S_INSTALL_OPTS

# Wait for K3s to be ready
echo "Waiting for K3s to be ready..."
sleep 30

until kubectl get nodes 2>/dev/null | grep -q "Ready"; do
    echo "Waiting for K3s node to be ready..."
    sleep 10
done

echo "K3s is ready!"

# Set permissions for kubectl
mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube
chmod 600 /home/ubuntu/.kube/config

# =============================================================================
# Install Helm
# =============================================================================

echo "[3/7] Installing Helm..."
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# =============================================================================
# Install Traefik with Helm
# =============================================================================

echo "[4/7] Installing Traefik Ingress Controller..."

kubectl create namespace traefik --dry-run=client -o yaml | kubectl apply -f -

helm repo add traefik https://traefik.github.io/charts
helm repo update

# Traefik values
cat <<EOF > /tmp/traefik-values.yaml
deployment:
  replicas: 1
resources:
  requests:
    cpu: 100m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 128Mi
ports:
  web:
    port: 8000
    expose: true
    exposedPort: 80
  websecure:
    port: 8443
    expose: true
    exposedPort: 443
    tls:
      enabled: true
service:
  type: NodePort
  spec:
    externalTrafficPolicy: Local
ingressRoute:
  dashboard:
    enabled: false
logs:
  general:
    level: INFO
  access:
    enabled: true
EOF

helm upgrade --install traefik traefik/traefik \
    --namespace traefik \
    --values /tmp/traefik-values.yaml \
    --wait

# =============================================================================
# Configure GHCR Registry Secret
# =============================================================================

echo "[5/7] Configuring container registry secret..."

kubectl create namespace kabu-agent --dry-run=client -o yaml | kubectl apply -f -

if [ -n "$GHCR_USERNAME" ] && [ -n "$GHCR_TOKEN" ]; then
    kubectl create secret docker-registry ghcr-secret \
        --namespace kabu-agent \
        --docker-server=ghcr.io \
        --docker-username="$GHCR_USERNAME" \
        --docker-password="$GHCR_TOKEN" \
        --dry-run=client -o yaml | kubectl apply -f -
    echo "GHCR secret created"
else
    echo "GHCR credentials not provided, skipping secret creation"
fi

# =============================================================================
# Install ArgoCD
# =============================================================================

echo "[6/7] Installing ArgoCD..."

kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
echo "Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Create ArgoCD Ingress
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server
  namespace: argocd
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  ingressClassName: traefik
  rules:
    - host: argocd.$${DOMAIN_NAME:-localhost}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 443
EOF

# Get ArgoCD initial admin password
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "ArgoCD initial admin password: $ARGOCD_PASSWORD" > /home/ubuntu/argocd-password.txt
chown ubuntu:ubuntu /home/ubuntu/argocd-password.txt
chmod 600 /home/ubuntu/argocd-password.txt

# =============================================================================
# Install Sealed Secrets
# =============================================================================

echo "[7/7] Installing Sealed Secrets..."

helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update

helm upgrade --install sealed-secrets sealed-secrets/sealed-secrets \
    --namespace kube-system \
    --set fullnameOverride=sealed-secrets-controller \
    --wait

# =============================================================================
# Final Setup
# =============================================================================

echo "=========================================="
echo "K3s Installation Complete!"
echo "=========================================="

# Print useful information
cat <<EOF

===========================================
Installation Summary
===========================================

K3s Version: $K3S_VERSION
Elastic IP: $ELASTIC_IP
Domain: $${DOMAIN_NAME:-Not configured}

Installed Components:
- K3s (Kubernetes)
- Traefik (Ingress Controller)
- ArgoCD (GitOps CD)
- Sealed Secrets (Secret Management)

Next Steps:
1. Configure DNS records pointing to $ELASTIC_IP
2. Get kubeconfig: cat /etc/rancher/k3s/k3s.yaml
3. Access ArgoCD: https://argocd.$${DOMAIN_NAME:-$ELASTIC_IP}
   Username: admin
   Password: See /home/ubuntu/argocd-password.txt

===========================================
EOF

# Mark installation as complete
touch /var/log/k3s-install-complete
