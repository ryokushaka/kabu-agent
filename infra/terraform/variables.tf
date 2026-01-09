# =============================================================================
# Kabu Agent Infrastructure - Variables
# =============================================================================

# -----------------------------------------------------------------------------
# General
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
  default     = "kabu-agent"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2" # Seoul
}

# -----------------------------------------------------------------------------
# Network
# -----------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production!
}

# -----------------------------------------------------------------------------
# EC2 Instance
# -----------------------------------------------------------------------------

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.medium" # ARM64 Graviton2, 2 vCPU, 4GB RAM
}

variable "ebs_volume_size" {
  description = "Root EBS volume size in GB"
  type        = number
  default     = 30
}

variable "create_key_pair" {
  description = "Whether to create a new SSH key pair"
  type        = bool
  default     = true
}

variable "existing_key_name" {
  description = "Name of existing SSH key pair (if create_key_pair is false)"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# K3s Configuration
# -----------------------------------------------------------------------------

variable "k3s_version" {
  description = "K3s version to install"
  type        = string
  default     = "v1.28.4+k3s2"
}

# -----------------------------------------------------------------------------
# Domain & TLS
# -----------------------------------------------------------------------------

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "admin_email" {
  description = "Admin email for Let's Encrypt certificates"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Container Registry (GHCR)
# -----------------------------------------------------------------------------

variable "ghcr_username" {
  description = "GitHub Container Registry username"
  type        = string
  default     = ""
  sensitive   = true
}

variable "ghcr_token" {
  description = "GitHub Container Registry token (PAT)"
  type        = string
  default     = ""
  sensitive   = true
}
