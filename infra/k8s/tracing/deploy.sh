#!/bin/bash
# =============================================================================
# Phase 3: Distributed Tracing Deployment Script
# =============================================================================
# Deploys Jaeger and OpenTelemetry Collector
#
# Usage:
#   ./deploy.sh [install|upgrade|uninstall|status|verify]
#
# Prerequisites:
#   - kubectl configured for target cluster
#   - Phase 1 (monitoring) should be deployed
#   - Phase 2 (Istio) recommended for full mesh tracing
# -----------------------------------------------------------------------------

set -euo pipefail

# Configuration
NAMESPACE="monitoring"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common library
source "${SCRIPT_DIR}/../common/lib.sh"

# Initialize error handling
init_error_handling "tracing"

# Load environment-specific configuration
load_environment_config "${SCRIPT_DIR}" "${KABU_ENVIRONMENT:-}"

# Fallback for backwards compatibility
validate_optional_env "DOMAIN_NAME" "localhost"

# -----------------------------------------------------------------------------
# Pre-flight Checks
# -----------------------------------------------------------------------------

check_monitoring_namespace() {
    log_info "Checking monitoring namespace..."

    if ! namespace_exists "${NAMESPACE}"; then
        log_error "Monitoring namespace not found. Please run Phase 1 deployment first."
        exit 1
    fi

    log_info "Monitoring namespace found"
}

# -----------------------------------------------------------------------------
# Installation Functions
# -----------------------------------------------------------------------------

deploy_jaeger() {
    log_info "Deploying Jaeger..."

    set_state "kubectl_apply"

    # Substitute environment variables
    if ! envsubst < "${SCRIPT_DIR}/jaeger.yaml" | kubectl_retry apply -f -; then
        log_error "Failed to apply jaeger.yaml"
        return 1
    fi

    # Wait for Jaeger to be ready with safe timeout
    safe_wait_for_deployment "jaeger" "${NAMESPACE}" 180

    record_step "deploy_jaeger"
}

deploy_otel_collector() {
    log_info "Deploying OpenTelemetry Collector..."

    safe_kubectl_apply "${SCRIPT_DIR}/otel-collector.yaml"

    # Wait for OTel Collector to be ready with safe timeout
    safe_wait_for_deployment "otel-collector" "${NAMESPACE}" 120

    record_step "deploy_otel_collector"
}

# -----------------------------------------------------------------------------
# Health Verification
# -----------------------------------------------------------------------------

verify_deployment() {
    log_info "Verifying tracing stack health..."
    local failed=0

    # Check Jaeger
    if kubectl get deployment jaeger -n "${NAMESPACE}" &>/dev/null; then
        local ready
        ready=$(kubectl get deployment jaeger -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        if [[ "$ready" -ge 1 ]]; then
            log_info "✅ Jaeger: healthy (${ready} replicas ready)"
        else
            log_error "❌ Jaeger: unhealthy"
            failed=1
        fi
    else
        log_warn "⚠️ Jaeger: not deployed"
        failed=1
    fi

    # Check OTel Collector
    if kubectl get deployment otel-collector -n "${NAMESPACE}" &>/dev/null; then
        local ready
        ready=$(kubectl get deployment otel-collector -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        if [[ "$ready" -ge 1 ]]; then
            log_info "✅ OTel Collector: healthy (${ready} replicas ready)"
        else
            log_error "❌ OTel Collector: unhealthy"
            failed=1
        fi
    else
        log_warn "⚠️ OTel Collector: not deployed"
        failed=1
    fi

    # Check Jaeger ingress
    if kubectl get ingress jaeger -n "${NAMESPACE}" &>/dev/null; then
        log_info "✅ Jaeger Ingress: configured"
    else
        log_warn "⚠️ Jaeger Ingress: not configured"
    fi

    if [[ $failed -eq 1 ]]; then
        log_error "Some tracing components are unhealthy"
        return 1
    fi

    log_info "All tracing components healthy!"
    return 0
}

# -----------------------------------------------------------------------------
# Main Commands
# -----------------------------------------------------------------------------

install() {
    log_phase "Phase 3: Distributed Tracing Installation"

    check_prerequisites
    check_monitoring_namespace
    deploy_jaeger
    deploy_otel_collector

    log_info "Distributed Tracing stack installed successfully!"
    log_info ""
    log_info "Access Jaeger UI at: https://jaeger.${DOMAIN_NAME}"
    log_info ""
    log_info "Enable tracing in your application:"
    log_info "  export OTEL_ENABLED=true"
    log_info "  export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring:4317"
    log_info ""
    log_info "Or send traces directly to Jaeger:"
    log_info "  export OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger-collector.monitoring:4317"

    verify_deployment
}

upgrade() {
    log_info "Upgrading Distributed Tracing stack..."

    check_prerequisites
    deploy_jaeger
    deploy_otel_collector

    log_info "Distributed Tracing stack upgraded successfully!"
    verify_deployment
}

uninstall() {
    log_info "Uninstalling Distributed Tracing stack..."

    kubectl delete -f "${SCRIPT_DIR}/otel-collector.yaml" --ignore-not-found || true
    kubectl delete -f "${SCRIPT_DIR}/jaeger.yaml" --ignore-not-found || true

    log_info "Distributed Tracing stack uninstalled"
}

status() {
    log_info "Distributed Tracing status:"

    echo ""
    echo "=== Jaeger ==="
    kubectl get deployment jaeger -n "${NAMESPACE}" -o wide 2>/dev/null || echo "Not deployed"
    kubectl get svc jaeger-query jaeger-collector -n "${NAMESPACE}" 2>/dev/null || echo "Services not found"

    echo ""
    echo "=== OpenTelemetry Collector ==="
    kubectl get deployment otel-collector -n "${NAMESPACE}" -o wide 2>/dev/null || echo "Not deployed"
    kubectl get svc otel-collector -n "${NAMESPACE}" 2>/dev/null || echo "Service not found"

    echo ""
    echo "=== Ingresses ==="
    kubectl get ingress -n "${NAMESPACE}" -l app=jaeger 2>/dev/null || echo "None"

    echo ""
    echo "=== Recent Jaeger Logs ==="
    kubectl logs -n "${NAMESPACE}" -l app=jaeger --tail=5 2>/dev/null || echo "No logs"
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
