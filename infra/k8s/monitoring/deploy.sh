#!/bin/bash
# =============================================================================
# Phase 1: Monitoring Stack Deployment Script
# =============================================================================
# Deploys Prometheus, Grafana, and Alertmanager to K3s cluster
#
# Usage:
#   ./deploy.sh [install|upgrade|uninstall|status|verify]
#
# Prerequisites:
#   - kubectl configured for target cluster
#   - helm v3 installed
#   - DOMAIN_NAME environment variable set (optional)
# -----------------------------------------------------------------------------

set -euo pipefail

# Configuration
NAMESPACE="monitoring"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common library
source "${SCRIPT_DIR}/../common/lib.sh"

# Initialize error handling
init_error_handling "monitoring"

# Load environment-specific configuration
load_environment_config "${SCRIPT_DIR}" "${KABU_ENVIRONMENT:-}"

# Fallback for backwards compatibility
validate_optional_env "DOMAIN_NAME" "localhost"

# -----------------------------------------------------------------------------
# Secrets Validation
# -----------------------------------------------------------------------------

validate_alertmanager_secrets() {
    log_info "Checking Alertmanager secrets..."

    if ! secret_exists "alertmanager-secrets" "${NAMESPACE}"; then
        log_warn "Alertmanager secrets not found!"
        log_warn ""
        log_warn "Slack notifications will NOT work without proper secrets."
        log_warn ""
        log_warn "To create secrets:"
        log_warn "  1. Copy template: cp ${SCRIPT_DIR}/secrets-template.yaml ${SCRIPT_DIR}/secrets.yaml"
        log_warn "  2. Edit secrets.yaml with your Slack webhook URL"
        log_warn "  3. Apply: kubectl apply -f ${SCRIPT_DIR}/secrets.yaml"
        log_warn ""

        if ! confirm_action "Continue without Slack notifications?"; then
            log_error "Deployment cancelled. Please configure secrets first."
            exit 1
        fi
        return 1
    fi

    log_info "Alertmanager secrets found"
    return 0
}

# -----------------------------------------------------------------------------
# Installation Functions
# -----------------------------------------------------------------------------

create_namespace() {
    log_info "Creating namespace: ${NAMESPACE}"
    safe_kubectl_apply "${SCRIPT_DIR}/namespace.yaml"
    record_step "create_namespace"
}

deploy_rbac() {
    log_info "Deploying RBAC resources..."
    safe_kubectl_apply "${SCRIPT_DIR}/rbac.yaml"
    record_step "deploy_rbac"
}

deploy_prometheus() {
    log_info "Deploying Prometheus..."

    add_helm_repo "prometheus-community" "https://prometheus-community.github.io/helm-charts"

    safe_helm_deploy "prometheus" "prometheus-community/prometheus" "${NAMESPACE}" \
        "${SCRIPT_DIR}/prometheus-values.yaml"

    record_step "deploy_prometheus"
}

deploy_alertmanager() {
    log_info "Deploying Alertmanager..."

    set_state "kubectl_apply"

    # Substitute environment variables in alertmanager.yaml
    if ! envsubst < "${SCRIPT_DIR}/alertmanager.yaml" | kubectl_retry apply -f -; then
        log_error "Failed to apply alertmanager.yaml"
        return 1
    fi

    # Wait for alertmanager to be ready with safe timeout
    safe_wait_for_deployment "alertmanager" "${NAMESPACE}" 120

    record_step "deploy_alertmanager"
}

deploy_grafana_dashboards() {
    log_info "Deploying Grafana dashboards ConfigMap..."
    safe_kubectl_apply "${SCRIPT_DIR}/grafana-dashboards.yaml"
}

deploy_grafana() {
    log_info "Deploying Grafana..."

    # First deploy dashboards ConfigMap
    deploy_grafana_dashboards

    add_helm_repo "grafana" "https://grafana.github.io/helm-charts"

    # Deploy Grafana with Helm (safe mode with atomic rollback)
    safe_helm_deploy "grafana" "grafana/grafana" "${NAMESPACE}" \
        "${SCRIPT_DIR}/grafana-values.yaml" \
        "--set ingress.hosts[0]=grafana.${DOMAIN_NAME}"

    # Get admin password with retry
    local grafana_password
    if grafana_password=$(kubectl_retry get secret --namespace "${NAMESPACE}" grafana -o jsonpath="{.data.admin-password}" | base64 --decode); then
        log_info "Grafana admin password: ${grafana_password}"
    else
        log_warn "Could not retrieve Grafana password. Check manually."
    fi

    log_info "Access Grafana at: https://grafana.${DOMAIN_NAME}"
    record_step "deploy_grafana"
}

# -----------------------------------------------------------------------------
# Health Verification
# -----------------------------------------------------------------------------

verify_deployment() {
    log_info "Verifying deployment health..."
    local failed=0

    # Check Prometheus
    if kubectl get deployment prometheus-server -n "${NAMESPACE}" &>/dev/null; then
        local ready
        ready=$(kubectl get deployment prometheus-server -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        if [[ "$ready" -ge 1 ]]; then
            log_info "✅ Prometheus: healthy (${ready} replicas ready)"
        else
            log_error "❌ Prometheus: unhealthy"
            failed=1
        fi
    else
        log_warn "⚠️ Prometheus: not deployed"
    fi

    # Check Alertmanager
    if kubectl get deployment alertmanager -n "${NAMESPACE}" &>/dev/null; then
        local ready
        ready=$(kubectl get deployment alertmanager -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        if [[ "$ready" -ge 1 ]]; then
            log_info "✅ Alertmanager: healthy (${ready} replicas ready)"
        else
            log_error "❌ Alertmanager: unhealthy"
            failed=1
        fi
    else
        log_warn "⚠️ Alertmanager: not deployed"
    fi

    # Check Grafana
    if kubectl get deployment grafana -n "${NAMESPACE}" &>/dev/null; then
        local ready
        ready=$(kubectl get deployment grafana -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        if [[ "$ready" -ge 1 ]]; then
            log_info "✅ Grafana: healthy (${ready} replicas ready)"
        else
            log_error "❌ Grafana: unhealthy"
            failed=1
        fi
    else
        log_warn "⚠️ Grafana: not deployed"
    fi

    # Check secrets
    if secret_exists "alertmanager-secrets" "${NAMESPACE}"; then
        log_info "✅ Alertmanager secrets: configured"
    else
        log_warn "⚠️ Alertmanager secrets: not configured (notifications disabled)"
    fi

    if [[ $failed -eq 1 ]]; then
        log_error "Some components are unhealthy"
        return 1
    fi

    log_info "All components healthy!"
    return 0
}

# -----------------------------------------------------------------------------
# Main Commands
# -----------------------------------------------------------------------------

install() {
    log_phase "Phase 1: Monitoring Stack Installation"

    # Production safety check
    validate_production_deployment

    check_prerequisites
    create_namespace
    deploy_rbac
    validate_alertmanager_secrets || true  # Continue even without secrets
    deploy_prometheus
    deploy_alertmanager
    deploy_grafana

    log_info "Phase 1 monitoring stack installed successfully!"
    log_info "Environment: $(get_environment)"
    log_info "Resource Profile: ${RESOURCE_PROFILE:-minimal}"
    verify_deployment
}

upgrade() {
    log_info "Upgrading Phase 1 monitoring stack..."

    check_prerequisites
    deploy_rbac
    deploy_prometheus
    deploy_alertmanager
    deploy_grafana

    log_info "Phase 1 monitoring stack upgraded successfully!"
    verify_deployment
}

uninstall() {
    log_info "Uninstalling Phase 1 monitoring stack..."

    helm_uninstall "grafana" "${NAMESPACE}"
    helm_uninstall "prometheus" "${NAMESPACE}"
    kubectl delete -f "${SCRIPT_DIR}/alertmanager.yaml" --ignore-not-found || true
    kubectl delete -f "${SCRIPT_DIR}/grafana-dashboards.yaml" --ignore-not-found || true
    kubectl delete -f "${SCRIPT_DIR}/rbac.yaml" --ignore-not-found || true

    log_warn "Namespace ${NAMESPACE} preserved. Delete manually if needed:"
    log_warn "  kubectl delete namespace ${NAMESPACE}"

    log_info "Phase 1 monitoring stack uninstalled"
}

status() {
    log_info "Monitoring stack status:"
    show_namespace_status "${NAMESPACE}"

    echo ""
    echo "=== PersistentVolumeClaims ==="
    kubectl get pvc -n "${NAMESPACE}" 2>/dev/null || echo "None"
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
