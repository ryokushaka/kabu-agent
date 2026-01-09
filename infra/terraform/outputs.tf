# =============================================================================
# Kabu Agent Infrastructure - Outputs
# =============================================================================

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.k3s.id
}

output "instance_public_ip" {
  description = "Public IP of the EC2 instance (Elastic IP)"
  value       = aws_eip.k3s.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.k3s.public_dns
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "security_group_id" {
  description = "ID of the K3s security group"
  value       = aws_security_group.k3s.id
}

output "ssh_key_path" {
  description = "Path to the SSH private key"
  value       = var.create_key_pair ? local_file.private_key[0].filename : "Using existing key: ${var.existing_key_name}"
}

output "ssh_connection_command" {
  description = "SSH command to connect to the instance"
  value       = var.create_key_pair ? "ssh -i ${local_file.private_key[0].filename} ubuntu@${aws_eip.k3s.public_ip}" : "ssh -i ~/.ssh/${var.existing_key_name}.pem ubuntu@${aws_eip.k3s.public_ip}"
}

output "kubeconfig_command" {
  description = "Command to get kubeconfig from the server"
  value       = var.create_key_pair ? "scp -i ${local_file.private_key[0].filename} ubuntu@${aws_eip.k3s.public_ip}:/etc/rancher/k3s/k3s.yaml ./kubeconfig.yaml && sed -i '' 's/127.0.0.1/${aws_eip.k3s.public_ip}/g' ./kubeconfig.yaml" : "scp -i ~/.ssh/${var.existing_key_name}.pem ubuntu@${aws_eip.k3s.public_ip}:/etc/rancher/k3s/k3s.yaml ./kubeconfig.yaml"
}

output "argocd_url" {
  description = "ArgoCD URL (after DNS configuration)"
  value       = var.domain_name != "" ? "https://argocd.${var.domain_name}" : "https://${aws_eip.k3s.public_ip}/argocd"
}

output "grafana_url" {
  description = "Grafana URL (after DNS configuration)"
  value       = var.domain_name != "" ? "https://grafana.${var.domain_name}" : "https://${aws_eip.k3s.public_ip}/grafana"
}

output "api_url" {
  description = "API URL (after DNS configuration)"
  value       = var.domain_name != "" ? "https://api.${var.domain_name}" : "https://${aws_eip.k3s.public_ip}/api"
}

# -----------------------------------------------------------------------------
# Cost Estimate
# -----------------------------------------------------------------------------

output "estimated_monthly_cost" {
  description = "Estimated monthly cost (KRW)"
  value       = <<-EOT

    ===========================================
    Estimated Monthly Cost (Seoul Region)
    ===========================================
    EC2 t4g.medium (On-Demand):  ~34,000 KRW
    EBS gp3 30GB:                 ~3,500 KRW
    Elastic IP:                        0 KRW (when attached)
    Data Transfer (100GB):        ~1,500 KRW
    -------------------------------------------
    Total:                       ~39,000 KRW/month
    ===========================================

    Cost Optimization Options:
    - Spot Instance: -70% (~12,000 KRW)
    - Reserved Instance (1yr): -40% (~24,000 KRW)

  EOT
}
