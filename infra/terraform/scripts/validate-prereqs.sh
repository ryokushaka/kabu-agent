#!/bin/bash
# =============================================================================
# Phase 1 Prerequisites Validation Script
# Run this script to verify all prerequisites are met before terraform apply
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "  Kabu Agent - Phase 1 Prerequisites Check"
echo "=============================================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}[ERROR]${NC} $1 is not installed"
        return 1
    fi
}

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}[OK]${NC} $2 exists"
        return 0
    else
        echo -e "${RED}[ERROR]${NC} $2 not found at $1"
        return 1
    fi
}

# =============================================================================
# 1. Check Required Tools
# =============================================================================
echo "1. Checking required tools..."
echo "-------------------------------------------"

check_command "terraform" || ((ERRORS++))
check_command "aws" || ((ERRORS++))
check_command "git" || ((ERRORS++))
check_command "curl" || ((ERRORS++))

# Optional but recommended
if check_command "jq"; then
    :
else
    echo -e "${YELLOW}[WARN]${NC} jq is not installed (optional but recommended)"
    ((WARNINGS++))
fi

echo ""

# =============================================================================
# 2. Check AWS Credentials
# =============================================================================
echo "2. Checking AWS credentials..."
echo "-------------------------------------------"

if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    echo -e "${GREEN}[OK]${NC} AWS credentials configured"
    echo "    Account: $ACCOUNT_ID"
    echo "    Identity: $USER_ARN"
else
    echo -e "${RED}[ERROR]${NC} AWS credentials not configured or invalid"
    echo "    Run: aws configure"
    ((ERRORS++))
fi

echo ""

# =============================================================================
# 3. Check Terraform Configuration
# =============================================================================
echo "3. Checking Terraform configuration..."
echo "-------------------------------------------"

cd "$TERRAFORM_DIR"

# Check terraform.tfvars exists
if [ -f "terraform.tfvars" ]; then
    echo -e "${GREEN}[OK]${NC} terraform.tfvars exists"
    
    # Check for placeholder values
    if grep -q 'YOUR_IP' terraform.tfvars 2>/dev/null; then
        echo -e "${RED}[ERROR]${NC} terraform.tfvars contains placeholder values (YOUR_IP)"
        ((ERRORS++))
    fi
    
    if grep -q 'ghcr_username = ""' terraform.tfvars 2>/dev/null; then
        echo -e "${YELLOW}[WARN]${NC} ghcr_username is empty (GHCR pull will fail)"
        ((WARNINGS++))
    fi
    
    if grep -q 'ghcr_token = ""' terraform.tfvars 2>/dev/null; then
        echo -e "${YELLOW}[WARN]${NC} ghcr_token is empty (GHCR pull will fail)"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}[ERROR]${NC} terraform.tfvars not found"
    echo "    Run: cp terraform.tfvars.example terraform.tfvars"
    ((ERRORS++))
fi

echo ""

# =============================================================================
# 4. Terraform Validation
# =============================================================================
echo "4. Validating Terraform configuration..."
echo "-------------------------------------------"

if terraform init -backend=false &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} terraform init successful"
else
    echo -e "${RED}[ERROR]${NC} terraform init failed"
    ((ERRORS++))
fi

if terraform validate &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} terraform validate successful"
else
    echo -e "${RED}[ERROR]${NC} terraform validate failed"
    terraform validate
    ((ERRORS++))
fi

echo ""

# =============================================================================
# 5. Network Check
# =============================================================================
echo "5. Checking network..."
echo "-------------------------------------------"

CURRENT_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || curl -s --max-time 5 checkip.amazonaws.com 2>/dev/null)
if [ -n "$CURRENT_IP" ]; then
    echo -e "${GREEN}[OK]${NC} Current public IP: $CURRENT_IP"
    echo "    Use this IP in allowed_ssh_cidrs: [\"$CURRENT_IP/32\"]"
else
    echo -e "${YELLOW}[WARN]${NC} Could not determine public IP"
    ((WARNINGS++))
fi

echo ""

# =============================================================================
# Summary
# =============================================================================
echo "=============================================="
echo "  Summary"
echo "=============================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    echo ""
    echo "You are ready to proceed with:"
    echo "  cd infra/terraform"
    echo "  terraform plan"
    echo "  terraform apply"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}Passed with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Review warnings above, then proceed with:"
    echo "  cd infra/terraform"
    echo "  terraform plan"
else
    echo -e "${RED}Failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    exit 1
fi

echo ""
echo "=============================================="
