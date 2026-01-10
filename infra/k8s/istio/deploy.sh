#!/bin/bash
# =============================================================================
# Phase 2: Istio Ambient Mesh Deployment Script
# =============================================================================
# Deploys Istio Ambient Mode components to K3s cluster
#
# Usage:
#   ./deploy.sh [install|upgrade|uninstall|status|enroll|unenroll|verify]
#
# Prerequisites:
#   - kubectl configured for target cluster
#   - helm v3 installed
#   - Phase 1 (monitoring) should be deployed first
#   - Recommended: 8GB RAM (t4g.large or higher)
# -----------------------------------------------------------------------------

set -euo pipefail

# Configuration
ISTIO_NAMESPACE="istio-system"
APP_NAMESPACE="kabu-agent"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common library
source "${SCRIPT_DIR}/../common/lib.sh"

# Initialize error handling
init_error_handling "istio"

# Load environment-specific configuration
load_environment_config "${SCRIPT_DIR}" "${KABU_ENVIRONMENT:-}"

# Fallback for backwards compatibility
validate_optional_env "ISTIO_VERSION" "1.20.2"

# -----------------------------------------------------------------------------
# Pre-flight Checks
# -----------------------------------------------------------------------------

check_phase1() {
    log_info "Checking Phase 1 (monitoring) deployment..."

    if ! namespace_exists "monitoring"; then
        log_warn "Monitoring namespace not found. Phase 1 should be deployed first for full observability."
        if ! confirm_action "Continue anyway?"; then
            exit 1
        fi
    else
        log_info "Phase 1 monitoring stack detected"
    fi
}

check_resources() {
    log_info "Checking cluster resources..."

    local total_mem
    total_mem=$(kubectl get nodes -o jsonpath='{.items[0].status.capacity.memory}' 2>/dev/null || echo "unknown")
    log_info "Node memory: ${total_mem}"

    # Warn if less than 6GB
    if [[ "$total_mem" =~ ([0-9]+)Ki ]]; then
        local mem_gb=$((${BASH_REMATCH[1]} / 1024 / 1024))
        if [[ $mem_gb -lt 6 ]]; then
            log_warn "Node has less than 6GB RAM. Istio may cause resource pressure."
            if ! confirm_action "Continue with limited resources?"; then
                exit 1
            fi
        fi
    fi
}

# -----------------------------------------------------------------------------
# Installation Functions
# -----------------------------------------------------------------------------

create_namespace() {
    ensure_namespace "${ISTIO_NAMESPACE}"
    record_step "create_namespace"
}

deploy_istio_base() {
    log_info "Deploying Istio Base CRDs..."

    add_helm_repo "istio" "https://istio-release.storage.googleapis.com/charts"

    safe_helm_deploy "istio-base" "istio/base" "${ISTIO_NAMESPACE}"

    record_step "deploy_istio_base"
}

deploy_istiod() {
    log_info "Deploying Istiod (Control Plane)..."

    safe_helm_deploy "istiod" "istio/istiod" "${ISTIO_NAMESPACE}" \
        "${SCRIPT_DIR}/istiod-values.yaml"

    record_step "deploy_istiod"
}

deploy_istio_cni() {
    log_info "Deploying Istio CNI (Required for Ambient Mode)..."

    safe_helm_deploy "istio-cni" "istio/cni" "${ISTIO_NAMESPACE}" \
        "${SCRIPT_DIR}/istio-cni-values.yaml"

    record_step "deploy_istio_cni"
}

deploy_ztunnel() {
    log_info "Deploying Ztunnel (Per-node L4 proxy)..."

    safe_helm_deploy "ztunnel" "istio/ztunnel" "${ISTIO_NAMESPACE}" \
        "${SCRIPT_DIR}/ztunnel-values.yaml"

    record_step "deploy_ztunnel"
}

apply_security_policies() {
    log_info "Applying security policies..."

    safe_kubectl_apply "${SCRIPT_DIR}/peer-authentication.yaml"
    safe_kubectl_apply "${SCRIPT_DIR}/authorization-policies.yaml"

    record_step "apply_security_policies"
}

# -----------------------------------------------------------------------------
# Namespace Enrollment
# -----------------------------------------------------------------------------

enroll_namespace() {
    local ns="${1:-$APP_NAMESPACE}"
    log_info "Enrolling namespace '${ns}' in Istio Ambient Mesh..."

    if ! namespace_exists "$ns"; then
        log_error "Namespace '$ns' does not exist"
        return 1
    fi

    kubectl label namespace "${ns}" istio.io/dataplane-mode=ambient --overwrite

    log_info "Namespace '${ns}' enrolled in ambient mesh"
    log_info "Existing pods will automatically be enrolled (no restart required)"
}

unenroll_namespace() {
    local ns="${1:-$APP_NAMESPACE}"
    log_info "Removing namespace '${ns}' from Istio Ambient Mesh..."

    kubectl label namespace "${ns}" istio.io/dataplane-mode- 2>/dev/null || true

    log_info "Namespace '${ns}' removed from ambient mesh"
}

# -----------------------------------------------------------------------------
# Health Verification
# -----------------------------------------------------------------------------

verify_deployment() {
    log_info "Verifying Istio deployment health..."
    local failed=0

    # Check Istiod
    if kubectl get deployment istiod -n "${ISTIO_NAMESPACE}" &>/dev/null; then
        local ready
        ready=$(kubectl get deployment istiod -n "${ISTIO_NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        if [[ "$ready" -ge 1 ]]; then
            log_info "✅ Istiod: healthy (${ready} replicas ready)"
        else
            log_error "❌ Istiod: unhealthy"
            failed=1
        fi
    else
        log_warn "⚠️ Istiod: not deployed"
        failed=1
    fi

    # Check Ztunnel DaemonSet
    if kubectl get daemonset ztunnel -n "${ISTIO_NAMESPACE}" &>/dev/null; then
        local desired ready
        desired=$(kubectl get daemonset ztunnel -n "${ISTIO_NAMESPACE}" -o jsonpath='{.status.desiredNumberScheduled}' 2>/dev/null || echo "0")
        ready=$(kubectl get daemonset ztunnel -n "${ISTIO_NAMESPACE}" -o jsonpath='{.status.numberReady}' 2>/dev/null || echo "0")
        if [[ "$ready" -ge 1 ]] && [[ "$ready" == "$desired" ]]; then
            log_info "✅ Ztunnel: healthy (${ready}/${desired} nodes ready)"
        else
            log_error "❌ Ztunnel: unhealthy (${ready}/${desired})"
            failed=1
        fi
    else
        log_warn "⚠️ Ztunnel: not deployed"
        failed=1
    fi

    # Check enrolled namespaces
    local enrolled
    enrolled=$(kubectl get namespaces -l istio.io/dataplane-mode=ambient -o name 2>/dev/null | wc -l | tr -d ' ')
    log_info "ℹ️ Enrolled namespaces: ${enrolled}"

    if [[ $failed -eq 1 ]]; then
        log_error "Some Istio components are unhealthy"
        return 1
    fi

    log_info "All Istio components healthy!"
    return 0
}

# -----------------------------------------------------------------------------
# Main Commands
# -----------------------------------------------------------------------------

install() {
    log_phase "Phase 2: Istio Ambient Mesh Installation"

    # Production safety check
    validate_production_deployment

    check_prerequisites
    check_phase1
    check_resources
    create_namespace
    deploy_istio_base
    deploy_istiod
    deploy_istio_cni
    deploy_ztunnel

    log_info "Istio Ambient Mesh core components installed!"
    log_info "Environment: $(get_environment)"
    log_info "mTLS Mode: ${ISTIO_MTLS_MODE:-STRICT}"
    log_info ""
    log_info "Next steps:"
    log_info "1. Enroll your application namespace: ./deploy.sh enroll"
    log_info "2. Apply security policies: ./deploy.sh security"
    log_info "3. Deploy Kiali for visualization: cd ../kiali && ./deploy.sh install"

    verify_deployment
}

upgrade() {
    log_info "Upgrading Istio Ambient Mesh..."

    check_prerequisites
    deploy_istio_base
    deploy_istiod
    deploy_istio_cni
    deploy_ztunnel

    log_info "Istio Ambient Mesh upgraded successfully!"
    verify_deployment
}

uninstall() {
    log_info "Uninstalling Istio Ambient Mesh..."

    # First unenroll namespaces
    unenroll_namespace "${APP_NAMESPACE}" || true
    unenroll_namespace "monitoring" || true

    # Remove security policies
    kubectl delete -f "${SCRIPT_DIR}/authorization-policies.yaml" --ignore-not-found || true
    kubectl delete -f "${SCRIPT_DIR}/peer-authentication.yaml" --ignore-not-found || true

    # Uninstall Helm charts (reverse order)
    helm_uninstall "ztunnel" "${ISTIO_NAMESPACE}"
    helm_uninstall "istio-cni" "${ISTIO_NAMESPACE}"
    helm_uninstall "istiod" "${ISTIO_NAMESPACE}"
    helm_uninstall "istio-base" "${ISTIO_NAMESPACE}"

    log_warn "Namespace ${ISTIO_NAMESPACE} preserved. Delete manually if needed:"
    log_warn "  kubectl delete namespace ${ISTIO_NAMESPACE}"

    log_info "Istio Ambient Mesh uninstalled"
}

status() {
    log_info "Istio Ambient Mesh status:"

    echo ""
    echo "=== Istio System Pods ==="
    kubectl get pods -n "${ISTIO_NAMESPACE}" -o wide 2>/dev/null || echo "None"

    echo ""
    echo "=== Ztunnel DaemonSet ==="
    kubectl get daemonset -n "${ISTIO_NAMESPACE}" 2>/dev/null || echo "None"

    echo ""
    echo "=== Enrolled Namespaces ==="
    kubectl get namespaces -l istio.io/dataplane-mode=ambient 2>/dev/null || echo "None"

    echo ""
    echo "=== Istiod Status ==="
    kubectl get deployment istiod -n "${ISTIO_NAMESPACE}" -o wide 2>/dev/null || echo "Not deployed"
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
    enroll)
        enroll_namespace "${2:-$APP_NAMESPACE}"
        ;;
    unenroll)
        unenroll_namespace "${2:-$APP_NAMESPACE}"
        ;;
    security)
        apply_security_policies
        ;;
    *)
        echo "Usage: $0 {install|upgrade|uninstall|status|verify|enroll [namespace]|unenroll [namespace]|security}"
        exit 1
        ;;
esac
