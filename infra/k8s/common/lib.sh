#!/bin/bash
# =============================================================================
# Common Library for Kubernetes Deployment Scripts
# =============================================================================
# Shared utilities for logging, validation, and deployment operations
#
# Usage in scripts:
#   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#   source "${SCRIPT_DIR}/../common/lib.sh"
# -----------------------------------------------------------------------------

# =============================================================================
# Colors
# =============================================================================
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'
export NC='\033[0m' # No Color

# =============================================================================
# Logging Functions
# =============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

log_phase() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# =============================================================================
# Validation Functions
# =============================================================================

# Check if a command exists
check_command() {
    local cmd="$1"
    local install_hint="${2:-}"

    if ! command -v "$cmd" &> /dev/null; then
        log_error "$cmd is not installed"
        if [[ -n "$install_hint" ]]; then
            log_info "Install with: $install_hint"
        fi
        return 1
    fi
    return 0
}

# Check all required prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    local failed=0

    # Check kubectl
    if ! check_command "kubectl" "https://kubernetes.io/docs/tasks/tools/"; then
        failed=1
    fi

    # Check helm
    if ! check_command "helm" "https://helm.sh/docs/intro/install/"; then
        failed=1
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        log_info "Ensure KUBECONFIG is set correctly"
        failed=1
    fi

    if [[ $failed -eq 1 ]]; then
        return 1
    fi

    log_info "All prerequisites met"
    return 0
}

# Validate required environment variable
validate_required_env() {
    local var_name="$1"
    local var_value="${!var_name}"

    if [[ -z "$var_value" ]]; then
        log_error "Required environment variable $var_name is not set"
        return 1
    fi
    return 0
}

# Validate optional environment variable with default
validate_optional_env() {
    local var_name="$1"
    local default_value="$2"
    local var_value="${!var_name}"

    if [[ -z "$var_value" ]]; then
        export "$var_name"="$default_value"
        log_debug "$var_name not set, using default: $default_value"
    fi
}

# =============================================================================
# Kubernetes Operations
# =============================================================================

# Check if namespace exists
namespace_exists() {
    local ns="$1"
    kubectl get namespace "$ns" &> /dev/null
}

# Create namespace if not exists
ensure_namespace() {
    local ns="$1"
    local labels="${2:-}"

    if namespace_exists "$ns"; then
        log_debug "Namespace $ns already exists"
    else
        log_info "Creating namespace: $ns"
        kubectl create namespace "$ns"
    fi

    # Apply labels if provided
    if [[ -n "$labels" ]]; then
        kubectl label namespace "$ns" $labels --overwrite 2>/dev/null || true
    fi
}

# Wait for deployment to be ready
wait_for_deployment() {
    local name="$1"
    local namespace="$2"
    local timeout="${3:-300s}"

    log_info "Waiting for deployment $name in $namespace..."
    if kubectl rollout status deployment/"$name" -n "$namespace" --timeout="$timeout"; then
        log_info "Deployment $name is ready"
        return 0
    else
        log_error "Deployment $name failed to become ready"
        return 1
    fi
}

# Check if a secret exists
secret_exists() {
    local name="$1"
    local namespace="$2"
    kubectl get secret "$name" -n "$namespace" &> /dev/null
}

# =============================================================================
# Helm Operations
# =============================================================================

# Add and update Helm repo
add_helm_repo() {
    local name="$1"
    local url="$2"

    log_info "Adding Helm repository: $name"
    helm repo add "$name" "$url" 2>/dev/null || true
    helm repo update
}

# Install or upgrade Helm chart
helm_deploy() {
    local release="$1"
    local chart="$2"
    local namespace="$3"
    local values_file="${4:-}"
    local extra_args="${5:-}"

    local cmd="helm upgrade --install $release $chart --namespace $namespace --wait --timeout 5m"

    if [[ -n "$values_file" && -f "$values_file" ]]; then
        cmd="$cmd --values $values_file"
    fi

    if [[ -n "$extra_args" ]]; then
        cmd="$cmd $extra_args"
    fi

    log_info "Deploying $release..."
    eval "$cmd"
}

# Uninstall Helm release
helm_uninstall() {
    local release="$1"
    local namespace="$2"

    if helm status "$release" -n "$namespace" &> /dev/null; then
        log_info "Uninstalling $release..."
        helm uninstall "$release" -n "$namespace"
    else
        log_debug "$release not found, skipping uninstall"
    fi
}

# =============================================================================
# Health Check Functions
# =============================================================================

# Check if a service is healthy via HTTP
check_http_health() {
    local url="$1"
    local expected="${2:-200}"
    local timeout="${3:-5}"

    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")

    if [[ "$status_code" == "$expected" ]]; then
        return 0
    else
        return 1
    fi
}

# Port-forward and check health (useful for internal services)
check_service_health() {
    local service="$1"
    local namespace="$2"
    local port="$3"
    local path="${4:-/}"
    local local_port="${5:-9999}"

    # Start port-forward in background
    kubectl port-forward "svc/$service" "$local_port:$port" -n "$namespace" &>/dev/null &
    local pf_pid=$!
    sleep 2

    # Check health
    local result=1
    if check_http_health "http://localhost:$local_port$path"; then
        log_info "Service $service is healthy"
        result=0
    else
        log_warn "Service $service health check failed"
        result=1
    fi

    # Cleanup port-forward
    kill $pf_pid 2>/dev/null || true

    return $result
}

# =============================================================================
# User Interaction
# =============================================================================

# Confirm action with user
confirm_action() {
    local message="$1"
    local default="${2:-N}"

    if [[ "$default" == "Y" ]]; then
        read -p "$message (Y/n): " -n 1 -r
    else
        read -p "$message (y/N): " -n 1 -r
    fi
    echo

    if [[ "$default" == "Y" ]]; then
        [[ ! $REPLY =~ ^[Nn]$ ]]
    else
        [[ $REPLY =~ ^[Yy]$ ]]
    fi
}

# =============================================================================
# Resource Display
# =============================================================================

# Show status of resources in namespace
show_namespace_status() {
    local namespace="$1"

    echo ""
    echo "=== Pods ==="
    kubectl get pods -n "$namespace" -o wide 2>/dev/null || echo "None"
    echo ""
    echo "=== Services ==="
    kubectl get svc -n "$namespace" 2>/dev/null || echo "None"
    echo ""
    echo "=== Ingresses ==="
    kubectl get ingress -n "$namespace" 2>/dev/null || echo "None"
}

# =============================================================================
# Configuration Loading
# =============================================================================

# Load configuration from file
load_config() {
    local config_file="$1"

    if [[ -f "$config_file" ]]; then
        log_debug "Loading configuration from $config_file"
        # shellcheck source=/dev/null
        source "$config_file"
    else
        log_debug "Configuration file not found: $config_file"
    fi
}

# Load environment-specific configuration
# Usage: load_environment_config "$SCRIPT_DIR" "development|staging|production"
load_environment_config() {
    local base_dir="$1"
    local environment="${2:-${KABU_ENVIRONMENT:-}}"
    local config_dir="${base_dir}/../config"

    # Load default configuration first
    if [[ -f "${config_dir}/default-values.env" ]]; then
        log_info "Loading default configuration..."
        source "${config_dir}/default-values.env"
    else
        log_warn "Default configuration not found at ${config_dir}/default-values.env"
    fi

    # Determine environment from various sources
    if [[ -z "$environment" ]]; then
        # Try to detect from kubectl context
        local context
        context=$(kubectl config current-context 2>/dev/null || echo "")

        case "$context" in
            *prod*|*production*) environment="production" ;;
            *staging*|*stg*) environment="staging" ;;
            *dev*|*local*|*minikube*|*docker-desktop*) environment="development" ;;
            *) environment="" ;;
        esac
    fi

    # Load environment-specific configuration
    if [[ -n "$environment" ]]; then
        local env_config="${config_dir}/values-${environment}.env"

        case "$environment" in
            dev|development)
                env_config="${config_dir}/values-dev.env"
                ;;
            stg|staging)
                env_config="${config_dir}/values-staging.env"
                ;;
            prod|production)
                env_config="${config_dir}/values-prod.env"
                ;;
        esac

        if [[ -f "$env_config" ]]; then
            log_info "Loading ${environment} configuration..."
            source "$env_config"
        else
            log_debug "Environment configuration not found: $env_config"
        fi
    fi

    # Log current configuration summary
    log_debug "Environment: ${ENVIRONMENT:-not set}"
    log_debug "Resource Profile: ${RESOURCE_PROFILE:-not set}"
    log_debug "Domain: ${DOMAIN_NAME:-not set}"
}

# Get current environment name
get_environment() {
    echo "${ENVIRONMENT:-development}"
}

# Check if running in production
is_production() {
    [[ "${ENVIRONMENT:-}" == "production" ]]
}

# Validate production deployment
validate_production_deployment() {
    if is_production; then
        log_warn "⚠️  PRODUCTION DEPLOYMENT DETECTED"
        log_warn "Environment: ${ENVIRONMENT}"
        log_warn "Cluster: ${CLUSTER_NAME:-unknown}"
        log_warn "Domain: ${DOMAIN_NAME:-unknown}"

        if ! confirm_action "Are you sure you want to proceed with production deployment?"; then
            log_error "Deployment cancelled by user"
            exit 1
        fi
    fi
}

# =============================================================================
# Error Handling Functions
# =============================================================================

# Global error state
declare -g DEPLOYMENT_STATE=""
declare -g LAST_SUCCESSFUL_STEP=""
declare -g ERROR_LOG_FILE=""

# Initialize error handling
init_error_handling() {
    local script_name="${1:-deploy}"
    ERROR_LOG_FILE="/tmp/kabu-${script_name}-$(date +%Y%m%d-%H%M%S).log"
    DEPLOYMENT_STATE="initialized"
    LAST_SUCCESSFUL_STEP=""

    # Set up error trap
    trap 'handle_error $? "$BASH_COMMAND" $LINENO' ERR
    trap 'handle_exit' EXIT

    log_debug "Error handling initialized. Log file: ${ERROR_LOG_FILE}"
}

# Handle errors with context
handle_error() {
    local exit_code="$1"
    local command="$2"
    local line_number="$3"

    log_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_error "ERROR OCCURRED"
    log_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_error "Exit Code: $exit_code"
    log_error "Command: $command"
    log_error "Line: $line_number"
    log_error "State: ${DEPLOYMENT_STATE:-unknown}"
    log_error "Last Successful Step: ${LAST_SUCCESSFUL_STEP:-none}"
    log_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Log to file
    if [[ -n "$ERROR_LOG_FILE" ]]; then
        {
            echo "=== Error at $(date) ==="
            echo "Exit Code: $exit_code"
            echo "Command: $command"
            echo "Line: $line_number"
            echo "State: ${DEPLOYMENT_STATE:-unknown}"
            echo "Last Successful Step: ${LAST_SUCCESSFUL_STEP:-none}"
            echo ""
        } >> "$ERROR_LOG_FILE"
    fi

    # Suggest recovery action
    suggest_recovery "$exit_code" "${DEPLOYMENT_STATE:-}"
}

# Handle script exit
handle_exit() {
    local exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        log_warn "Script exited with code: $exit_code"
        if [[ -n "$ERROR_LOG_FILE" && -f "$ERROR_LOG_FILE" ]]; then
            log_info "Error log saved to: $ERROR_LOG_FILE"
        fi
    fi
}

# Suggest recovery actions based on error context
suggest_recovery() {
    local exit_code="$1"
    local state="$2"

    echo ""
    log_info "💡 Recovery Suggestions:"

    case "$state" in
        "helm_deploy")
            log_info "  1. Check Helm release status: helm list -n <namespace>"
            log_info "  2. View pod logs: kubectl logs -n <namespace> -l app=<app>"
            log_info "  3. Rollback: helm rollback <release> -n <namespace>"
            ;;
        "kubectl_apply")
            log_info "  1. Check resource status: kubectl get all -n <namespace>"
            log_info "  2. Describe failed resource: kubectl describe <resource> -n <namespace>"
            log_info "  3. Delete and retry: kubectl delete -f <file> && kubectl apply -f <file>"
            ;;
        "wait_deployment")
            log_info "  1. Check pod events: kubectl describe pods -n <namespace>"
            log_info "  2. Check container logs: kubectl logs -n <namespace> <pod>"
            log_info "  3. Check resource limits: kubectl top pods -n <namespace>"
            ;;
        *)
            log_info "  1. Check cluster connectivity: kubectl cluster-info"
            log_info "  2. Review deployment logs: kubectl get events -n <namespace>"
            log_info "  3. Retry the operation after fixing the issue"
            ;;
    esac

    echo ""
}

# Record successful step
record_step() {
    local step_name="$1"
    LAST_SUCCESSFUL_STEP="$step_name"
    log_debug "Step completed: $step_name"
}

# Set deployment state
set_state() {
    local state="$1"
    DEPLOYMENT_STATE="$state"
    log_debug "State changed to: $state"
}

# =============================================================================
# Retry Logic with Exponential Backoff
# =============================================================================

# Retry a command with exponential backoff
# Usage: retry_with_backoff <max_attempts> <initial_delay> <command...>
retry_with_backoff() {
    local max_attempts="$1"
    local initial_delay="$2"
    shift 2
    local cmd=("$@")

    local attempt=1
    local delay="$initial_delay"

    while [[ $attempt -le $max_attempts ]]; do
        log_debug "Attempt $attempt/$max_attempts: ${cmd[*]}"

        if "${cmd[@]}"; then
            return 0
        fi

        if [[ $attempt -lt $max_attempts ]]; then
            log_warn "Attempt $attempt failed. Retrying in ${delay}s..."
            sleep "$delay"
            # Exponential backoff with jitter
            delay=$((delay * 2 + RANDOM % 5))
            # Cap at 120 seconds
            [[ $delay -gt 120 ]] && delay=120
        fi

        ((attempt++))
    done

    log_error "All $max_attempts attempts failed for: ${cmd[*]}"
    return 1
}

# Retry kubectl command with backoff
kubectl_retry() {
    local max_attempts="${KUBECTL_MAX_ATTEMPTS:-3}"
    local initial_delay="${KUBECTL_RETRY_DELAY:-2}"
    retry_with_backoff "$max_attempts" "$initial_delay" kubectl "$@"
}

# Retry helm command with backoff
helm_retry() {
    local max_attempts="${HELM_MAX_ATTEMPTS:-3}"
    local initial_delay="${HELM_RETRY_DELAY:-5}"
    retry_with_backoff "$max_attempts" "$initial_delay" helm "$@"
}

# =============================================================================
# Timeout Handling
# =============================================================================

# Run command with timeout
# Usage: run_with_timeout <timeout_seconds> <command...>
run_with_timeout() {
    local timeout_seconds="$1"
    shift
    local cmd=("$@")

    log_debug "Running with ${timeout_seconds}s timeout: ${cmd[*]}"

    if command -v timeout &> /dev/null; then
        timeout "$timeout_seconds" "${cmd[@]}"
    else
        # Fallback for systems without timeout command
        local pid
        "${cmd[@]}" &
        pid=$!

        local count=0
        while kill -0 "$pid" 2>/dev/null; do
            if [[ $count -ge $timeout_seconds ]]; then
                kill -9 "$pid" 2>/dev/null || true
                log_error "Command timed out after ${timeout_seconds}s"
                return 124
            fi
            sleep 1
            ((count++))
        done

        wait "$pid"
    fi
}

# =============================================================================
# Rollback Functions
# =============================================================================

# Store rollback point for Helm releases
declare -g -A HELM_ROLLBACK_POINTS

# Save Helm release revision for rollback
save_helm_revision() {
    local release="$1"
    local namespace="$2"

    local revision
    revision=$(helm history "$release" -n "$namespace" --max 1 -o json 2>/dev/null | \
               python3 -c "import sys,json; print(json.load(sys.stdin)[0]['revision'])" 2>/dev/null || echo "0")

    HELM_ROLLBACK_POINTS["$release"]="$revision"
    log_debug "Saved rollback point for $release: revision $revision"
}

# Rollback Helm release to saved revision
rollback_helm_release() {
    local release="$1"
    local namespace="$2"

    local revision="${HELM_ROLLBACK_POINTS[$release]:-0}"

    if [[ "$revision" != "0" ]]; then
        log_warn "Rolling back $release to revision $revision..."
        if helm rollback "$release" "$revision" -n "$namespace" --wait; then
            log_info "Rollback successful for $release"
            return 0
        else
            log_error "Rollback failed for $release"
            return 1
        fi
    else
        log_warn "No rollback point saved for $release, attempting uninstall..."
        helm uninstall "$release" -n "$namespace" --wait || true
        return 0
    fi
}

# Rollback all saved Helm releases
rollback_all_helm_releases() {
    local namespace="$1"

    log_warn "Rolling back all deployments in $namespace..."

    for release in "${!HELM_ROLLBACK_POINTS[@]}"; do
        rollback_helm_release "$release" "$namespace"
    done
}

# =============================================================================
# Safe Deployment Functions
# =============================================================================

# Safe Helm deploy with rollback capability
safe_helm_deploy() {
    local release="$1"
    local chart="$2"
    local namespace="$3"
    local values_file="${4:-}"
    local extra_args="${5:-}"

    # Save current revision for rollback
    if helm status "$release" -n "$namespace" &>/dev/null; then
        save_helm_revision "$release" "$namespace"
    fi

    set_state "helm_deploy"

    local cmd="helm upgrade --install $release $chart --namespace $namespace --wait --timeout 5m --atomic"

    if [[ -n "$values_file" && -f "$values_file" ]]; then
        cmd="$cmd --values $values_file"
    fi

    if [[ -n "$extra_args" ]]; then
        cmd="$cmd $extra_args"
    fi

    log_info "Deploying $release (with atomic rollback)..."

    if eval "$cmd"; then
        record_step "helm_deploy_$release"
        log_info "✅ $release deployed successfully"
        return 0
    else
        log_error "❌ Failed to deploy $release"
        return 1
    fi
}

# Safe kubectl apply with error handling
safe_kubectl_apply() {
    local file="$1"
    local namespace="${2:-}"

    set_state "kubectl_apply"

    local cmd="kubectl apply -f $file"
    if [[ -n "$namespace" ]]; then
        cmd="$cmd -n $namespace"
    fi

    log_info "Applying $file..."

    if kubectl_retry apply -f "$file" ${namespace:+-n "$namespace"}; then
        record_step "kubectl_apply_$(basename "$file")"
        log_info "✅ Applied $file successfully"
        return 0
    else
        log_error "❌ Failed to apply $file"
        return 1
    fi
}

# Safe wait for deployment with timeout
safe_wait_for_deployment() {
    local name="$1"
    local namespace="$2"
    local timeout="${3:-300}"

    set_state "wait_deployment"

    log_info "Waiting for deployment $name (timeout: ${timeout}s)..."

    if run_with_timeout "$timeout" kubectl rollout status "deployment/$name" -n "$namespace"; then
        record_step "wait_deployment_$name"
        log_info "✅ Deployment $name is ready"
        return 0
    else
        log_error "❌ Deployment $name failed to become ready"

        # Show pod status for debugging
        log_info "Pod status:"
        kubectl get pods -n "$namespace" -l "app=$name" 2>/dev/null || true

        log_info "Recent events:"
        kubectl get events -n "$namespace" --sort-by='.lastTimestamp' | tail -10 || true

        return 1
    fi
}

# =============================================================================
# Cleanup Functions
# =============================================================================

# Cleanup function for trap
cleanup_on_exit() {
    local exit_code=$?
    # Add cleanup logic here if needed
    exit $exit_code
}

# Set cleanup trap
setup_cleanup_trap() {
    trap cleanup_on_exit EXIT
}
