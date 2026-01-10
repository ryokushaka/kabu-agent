#!/bin/bash
# =============================================================================
# Phase 2: Kiali Deployment Script
# =============================================================================
# Deploys Kiali service mesh observability dashboard
#
# Usage:
#   ./deploy.sh [install|upgrade|uninstall|status|verify]
#
# Prerequisites:
#   - kubectl configured for target cluster
#   - helm v3 installed
#   - Istio must be installed first
#   - Phase 1 (monitoring) should be deployed for full functionality
# -----------------------------------------------------------------------------

set -euo pipefail

# Configuration
ISTIO_NAMESPACE="istio-system"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common library
source "${SCRIPT_DIR}/../common/lib.sh"

# Initialize error handling
init_error_handling "kiali"

# Load environment-specific configuration
load_environment_config "${SCRIPT_DIR}" "${KABU_ENVIRONMENT:-}"

# Fallback for backwards compatibility
validate_optional_env "DOMAIN_NAME" "localhost"

# -----------------------------------------------------------------------------
# Pre-flight Checks
# -----------------------------------------------------------------------------

check_istio() {
    log_info "Checking Istio installation..."

    if ! namespace_exists "${ISTIO_NAMESPACE}"; then
        log_error "Istio namespace not found. Please install Istio first."
        exit 1
    fi

    if ! kubectl get deployment istiod -n "${ISTIO_NAMESPACE}" &> /dev/null; then
        log_error "Istiod not found. Please install Istio first."
        exit 1
    fi

    log_info "Istio installation detected"
}

check_monitoring() {
    log_info "Checking monitoring stack..."

    if ! namespace_exists "monitoring"; then
        log_warn "Monitoring namespace not found."
        log_warn "Kiali will have limited functionality without Prometheus."
    else
        if kubectl get deployment prometheus-server -n monitoring &>/dev/null; then
            log_info "Prometheus found - Kiali will have full metrics support"
        else
            log_warn "Prometheus not found - Kiali metrics will be limited"
        fi

        if kubectl get deployment jaeger -n monitoring &>/dev/null; then
            log_info "Jaeger found - Kiali will have tracing support"
        else
            log_debug "Jaeger not found - tracing disabled"
        fi
    fi
}

# -----------------------------------------------------------------------------
# Installation Functions
# -----------------------------------------------------------------------------

deploy_kiali() {
    log_info "Deploying Kiali..."

    add_helm_repo "kiali" "https://kiali.org/helm-charts"

    safe_helm_deploy "kiali" "kiali/kiali-server" "${ISTIO_NAMESPACE}" \
        "${SCRIPT_DIR}/kiali-values.yaml" \
        "--set external_services.grafana.url=https://grafana.${DOMAIN_NAME} --set external_services.tracing.url=https://jaeger.${DOMAIN_NAME}"

    record_step "deploy_kiali"
}

deploy_ingress() {
    log_info "Deploying Kiali Ingress..."

    set_state "kubectl_apply"

    # Substitute domain name in ingress
    if ! envsubst < "${SCRIPT_DIR}/kiali-ingress.yaml" | kubectl_retry apply -f -; then
        log_error "Failed to apply kiali-ingress.yaml"
        return 1
    fi

    record_step "deploy_ingress"
}

# -----------------------------------------------------------------------------
# Health Verification
# -----------------------------------------------------------------------------

verify_deployment() {
    log_info "Verifying Kiali deployment health..."
    local failed=0

    # Check Kiali deployment
    if kubectl get deployment kiali -n "${ISTIO_NAMESPACE}" &>/dev/null; then
        local ready
        ready=$(kubectl get deployment kiali -n "${ISTIO_NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        if [[ "$ready" -ge 1 ]]; then
            log_info "✅ Kiali: healthy (${ready} replicas ready)"
        else
            log_error "❌ Kiali: unhealthy"
            failed=1
        fi
    else
        log_warn "⚠️ Kiali: not deployed"
        failed=1
    fi

    # Check ingress
    if kubectl get ingress kiali -n "${ISTIO_NAMESPACE}" &>/dev/null; then
        log_info "✅ Kiali Ingress: configured"
    else
        log_warn "⚠️ Kiali Ingress: not configured"
    fi

    if [[ $failed -eq 1 ]]; then
        log_error "Kiali is unhealthy"
        return 1
    fi

    log_info "Kiali is healthy!"
    return 0
}

# -----------------------------------------------------------------------------
# Main Commands
# -----------------------------------------------------------------------------

install() {
    log_phase "Kiali Installation"

    check_prerequisites
    check_istio
    check_monitoring
    deploy_kiali
    deploy_ingress

    log_info "Kiali installed successfully!"
    log_info ""
    log_info "Access Kiali at: https://kiali.${DOMAIN_NAME}"
    log_info ""
    log_info "Features available:"
    log_info "  - Service Graph: Visualize service-to-service traffic"
    log_info "  - Traffic Analysis: View request rates, errors, latencies"
    log_info "  - Configuration: Validate Istio configurations"

    verify_deployment
}

upgrade() {
    log_info "Upgrading Kiali..."

    check_prerequisites
    check_istio
    deploy_kiali
    deploy_ingress

    log_info "Kiali upgraded successfully!"
    verify_deployment
}

uninstall() {
    log_info "Uninstalling Kiali..."

    kubectl delete -f "${SCRIPT_DIR}/kiali-ingress.yaml" --ignore-not-found || true
    helm_uninstall "kiali" "${ISTIO_NAMESPACE}"

    log_info "Kiali uninstalled"
}

status() {
    log_info "Kiali status:"

    echo ""
    echo "=== Kiali Deployment ==="
    kubectl get deployment kiali -n "${ISTIO_NAMESPACE}" -o wide 2>/dev/null || echo "Not deployed"

    echo ""
    echo "=== Kiali Service ==="
    kubectl get svc kiali -n "${ISTIO_NAMESPACE}" 2>/dev/null || echo "Not deployed"

    echo ""
    echo "=== Kiali Ingress ==="
    kubectl get ingress kiali -n "${ISTIO_NAMESPACE}" 2>/dev/null || echo "Not configured"

    echo ""
    echo "=== Kiali Logs (last 5 lines) ==="
    kubectl logs -n "${ISTIO_NAMESPACE}" -l app=kiali --tail=5 2>/dev/null || echo "No logs"
}

# -----------------------------------------------------------------------------
# Script Entry Point
# -----------------------------------------------------------------------------

case "${1:-install}" in
    install)
        install
        ;;
    upgrade)
        upgrade
        ;;
    uninstall)
        uninstall
        ;;
    status)
        status
        ;;
    verify)
        verify_deployment
        ;;
    *)
        echo "Usage: $0 {install|upgrade|uninstall|status|verify}"
        exit 1
        ;;
esac
