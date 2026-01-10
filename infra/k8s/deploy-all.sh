#!/bin/bash
# =============================================================================
# Kabu Agent - Full Observability Stack Deployment
# =============================================================================
# Master script to deploy all monitoring components in phases
#
# Usage:
#   ./deploy-all.sh [phase1|phase2|phase3|all|status|uninstall]
#
# Phases:
#   phase1: Prometheus + Grafana + Alertmanager (fits in 4GB)
#   phase2: Istio Ambient + Kiali (requires 8GB recommended)
#   phase3: Jaeger + OpenTelemetry Collector
#   all:    Deploy all phases sequentially
#
# Prerequisites:
#   - kubectl configured for target cluster
#   - helm v3 installed
#   - DOMAIN_NAME environment variable (optional)
# -----------------------------------------------------------------------------

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN_NAME="${DOMAIN_NAME:-localhost}"

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_phase() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    fi

    if ! command -v envsubst &> /dev/null; then
        log_warn "envsubst not found. Some configurations may not work correctly."
    fi

    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Get node resources
    log_info "Cluster info:"
    kubectl get nodes -o wide

    log_info "All prerequisites met"
}

make_scripts_executable() {
    chmod +x "${SCRIPT_DIR}/monitoring/deploy.sh" 2>/dev/null || true
    chmod +x "${SCRIPT_DIR}/istio/deploy.sh" 2>/dev/null || true
    chmod +x "${SCRIPT_DIR}/kiali/deploy.sh" 2>/dev/null || true
    chmod +x "${SCRIPT_DIR}/tracing/deploy.sh" 2>/dev/null || true
}

# -----------------------------------------------------------------------------
# Phase Deployments
# -----------------------------------------------------------------------------

deploy_phase1() {
    log_phase "PHASE 1: Metrics Foundation"
    log_info "Deploying Prometheus + Grafana + Alertmanager"
    log_info "Estimated memory: ~700MB additional"
    echo ""

    cd "${SCRIPT_DIR}/monitoring"
    ./deploy.sh install

    log_info "Phase 1 complete!"
    echo ""
    log_info "Access points:"
    log_info "  - Grafana: https://grafana.${DOMAIN_NAME}"
    log_info "  - Alertmanager: https://alertmanager.${DOMAIN_NAME}"
}

deploy_phase2() {
    log_phase "PHASE 2: Service Mesh"
    log_info "Deploying Istio Ambient Mode + Kiali"
    log_info "Estimated memory: ~512MB additional"
    log_warn "Recommended: 8GB RAM (t4g.large or higher)"
    echo ""

    # Deploy Istio
    cd "${SCRIPT_DIR}/istio"
    ./deploy.sh install

    # Enroll application namespace
    ./deploy.sh enroll kabu-agent

    # Deploy Kiali
    cd "${SCRIPT_DIR}/kiali"
    ./deploy.sh install

    log_info "Phase 2 complete!"
    echo ""
    log_info "Access points:"
    log_info "  - Kiali: https://kiali.${DOMAIN_NAME}"
}

deploy_phase3() {
    log_phase "PHASE 3: Distributed Tracing"
    log_info "Deploying Jaeger + OpenTelemetry Collector"
    log_info "Estimated memory: ~384MB additional"
    echo ""

    cd "${SCRIPT_DIR}/tracing"
    ./deploy.sh install

    log_info "Phase 3 complete!"
    echo ""
    log_info "Access points:"
    log_info "  - Jaeger: https://jaeger.${DOMAIN_NAME}"
    echo ""
    log_info "Enable tracing in your application:"
    log_info "  export OTEL_ENABLED=true"
    log_info "  export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring:4317"
}

deploy_all() {
    log_phase "FULL STACK DEPLOYMENT"
    log_warn "This will deploy all observability components"
    log_warn "Ensure your cluster has at least 8GB RAM"
    echo ""

    read -p "Continue with full deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi

    deploy_phase1
    echo ""
    sleep 10  # Wait for Phase 1 to stabilize

    deploy_phase2
    echo ""
    sleep 10  # Wait for Phase 2 to stabilize

    deploy_phase3

    log_phase "DEPLOYMENT COMPLETE"
    status_all
}

# -----------------------------------------------------------------------------
# Status and Uninstall
# -----------------------------------------------------------------------------

status_all() {
    log_phase "OBSERVABILITY STACK STATUS"

    echo "=== Monitoring Namespace ==="
    kubectl get pods -n monitoring -o wide 2>/dev/null || echo "Not deployed"
    echo ""

    echo "=== Istio System ==="
    kubectl get pods -n istio-system -o wide 2>/dev/null || echo "Not deployed"
    echo ""

    echo "=== Application Namespace (kabu-agent) ==="
    kubectl get pods -n kabu-agent -o wide 2>/dev/null || echo "Not deployed"
    echo ""

    echo "=== Ingresses ==="
    kubectl get ingress -A 2>/dev/null || echo "None"
    echo ""

    echo "=== Services ==="
    echo "Monitoring:"
    kubectl get svc -n monitoring 2>/dev/null || echo "None"
    echo ""
    echo "Istio System:"
    kubectl get svc -n istio-system 2>/dev/null || echo "None"
}

uninstall_all() {
    log_phase "UNINSTALLING OBSERVABILITY STACK"
    log_warn "This will remove all monitoring components"

    read -p "Continue with uninstall? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Uninstall cancelled"
        exit 0
    fi

    # Phase 3
    log_info "Uninstalling Phase 3 (Tracing)..."
    cd "${SCRIPT_DIR}/tracing" && ./deploy.sh uninstall 2>/dev/null || true

    # Phase 2
    log_info "Uninstalling Phase 2 (Service Mesh)..."
    cd "${SCRIPT_DIR}/kiali" && ./deploy.sh uninstall 2>/dev/null || true
    cd "${SCRIPT_DIR}/istio" && ./deploy.sh uninstall 2>/dev/null || true

    # Phase 1
    log_info "Uninstalling Phase 1 (Monitoring)..."
    cd "${SCRIPT_DIR}/monitoring" && ./deploy.sh uninstall 2>/dev/null || true

    log_info "Uninstall complete"
    log_warn "Namespaces preserved. Delete manually if needed:"
    log_warn "  kubectl delete namespace monitoring istio-system"
}

# -----------------------------------------------------------------------------
# Usage
# -----------------------------------------------------------------------------

usage() {
    echo "Kabu Agent Observability Stack Deployment"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  phase1    Deploy Phase 1: Prometheus, Grafana, Alertmanager (~700MB)"
    echo "  phase2    Deploy Phase 2: Istio Ambient, Kiali (~512MB, 8GB recommended)"
    echo "  phase3    Deploy Phase 3: Jaeger, OTel Collector (~384MB)"
    echo "  all       Deploy all phases sequentially"
    echo "  status    Show status of all components"
    echo "  uninstall Remove all observability components"
    echo ""
    echo "Environment Variables:"
    echo "  DOMAIN_NAME    Domain for ingress (default: localhost)"
    echo ""
    echo "Examples:"
    echo "  DOMAIN_NAME=example.com $0 phase1"
    echo "  $0 status"
}

# -----------------------------------------------------------------------------
# Main Entry Point
# -----------------------------------------------------------------------------

check_prerequisites
make_scripts_executable

case "${1:-}" in
    phase1)
        deploy_phase1
        ;;
    phase2)
        deploy_phase2
        ;;
    phase3)
        deploy_phase3
        ;;
    all)
        deploy_all
        ;;
    status)
        status_all
        ;;
    uninstall)
        uninstall_all
        ;;
    *)
        usage
        exit 1
        ;;
esac
