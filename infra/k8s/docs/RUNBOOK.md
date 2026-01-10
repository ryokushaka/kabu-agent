# Kabu Agent Monitoring Stack - Operations Runbook

## Overview

This runbook provides operational procedures for the Kabu Agent monitoring infrastructure.

**Components:**
- Phase 1: Prometheus, Grafana, Alertmanager
- Phase 2: Istio Ambient Mesh, Kiali
- Phase 3: Jaeger, OpenTelemetry Collector

---

## Quick Reference

### Access URLs
| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | `https://grafana.${DOMAIN}` | admin / (from secret) |
| Prometheus | `https://prometheus.${DOMAIN}` | N/A |
| Alertmanager | `https://alertmanager.${DOMAIN}` | Basic Auth |
| Jaeger | `https://jaeger.${DOMAIN}` | N/A |
| Kiali | `https://kiali.${DOMAIN}` | N/A |

### Get Grafana Password
```bash
kubectl get secret -n monitoring grafana -o jsonpath="{.data.admin-password}" | base64 -d
```

### Check All Component Status
```bash
# Quick health check
./infra/k8s/monitoring/deploy.sh verify
./infra/k8s/istio/deploy.sh verify
./infra/k8s/tracing/deploy.sh verify
./infra/k8s/kiali/deploy.sh verify
```

---

## Alert Runbooks

### ALERT: BackendDown

**Severity:** Critical
**Description:** Kabu backend service is not responding

**Symptoms:**
- API requests failing
- Health check endpoint not responding
- Pod in CrashLoopBackOff or not ready

**Investigation:**
```bash
# 1. Check pod status
kubectl get pods -n kabu-agent -l app=kabu-backend

# 2. Check pod events
kubectl describe pod -n kabu-agent -l app=kabu-backend

# 3. Check logs
kubectl logs -n kabu-agent -l app=kabu-backend --tail=100

# 4. Check resource usage
kubectl top pods -n kabu-agent
```

**Resolution:**
1. If OOMKilled: Increase memory limits in deployment
2. If CrashLoopBackOff: Check application logs for startup errors
3. If ImagePullBackOff: Verify image tag and registry credentials
4. If pending: Check node resources and PVC status

**Escalation:** Contact backend team if issue persists > 15 minutes

---

### ALERT: HighErrorRate

**Severity:** Warning
**Description:** Error rate exceeds 5% for 5+ minutes

**Symptoms:**
- Increased 5xx responses
- Slow response times
- User-reported errors

**Investigation:**
```bash
# 1. Check error logs
kubectl logs -n kabu-agent -l app=kabu-backend --tail=200 | grep -i error

# 2. Check Prometheus for error patterns
# Query: sum(rate(http_requests_total{status=~"5.."}[5m])) by (endpoint)

# 3. Check external dependencies
kubectl exec -n kabu-agent deploy/kabu-backend -- curl -s http://postgres:5432
kubectl exec -n kabu-agent deploy/kabu-backend -- redis-cli -h redis ping
```

**Resolution:**
1. Identify error pattern (specific endpoint, time-based)
2. Check database connectivity
3. Check Redis connectivity
4. Check external API rate limits (KIS API)
5. Consider rolling restart if transient issue

---

### ALERT: HighLatency

**Severity:** Warning
**Description:** P95 latency exceeds 1 second

**Investigation:**
```bash
# 1. Check slow endpoints in Grafana
# Dashboard: Kabu Agent Overview > Latency by Endpoint

# 2. Check database performance
kubectl exec -n kabu-agent deploy/kabu-backend -- python -c "
from sqlalchemy import create_engine, text
engine = create_engine('postgresql://...')
with engine.connect() as conn:
    result = conn.execute(text('SELECT count(*) FROM pg_stat_activity'))
    print(result.fetchone())
"

# 3. Check Redis latency
kubectl exec -n kabu-agent deploy/kabu-backend -- redis-cli -h redis --latency
```

**Resolution:**
1. Identify slow endpoints using Jaeger traces
2. Check for missing database indexes
3. Check Redis memory usage and eviction
4. Consider adding caching for slow queries

---

### ALERT: HighMemoryUsage

**Severity:** Warning
**Description:** Container memory usage exceeds 85%

**Investigation:**
```bash
# 1. Check current memory usage
kubectl top pods -n kabu-agent

# 2. Check memory limits
kubectl get pods -n kabu-agent -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].resources.limits.memory}{"\n"}{end}'

# 3. Check for memory leaks (trending up over time)
# Grafana query: container_memory_working_set_bytes{namespace="kabu-agent"}
```

**Resolution:**
1. If gradual increase: Possible memory leak - schedule restart
2. If spike: Check for large data processing
3. If consistently high: Increase memory limits

---

### ALERT: DatabaseConnectionFailed

**Severity:** Critical
**Description:** Cannot connect to PostgreSQL

**Investigation:**
```bash
# 1. Check PostgreSQL pod
kubectl get pods -n kabu-agent -l app=postgres

# 2. Check PostgreSQL logs
kubectl logs -n kabu-agent -l app=postgres --tail=50

# 3. Test connection from backend
kubectl exec -n kabu-agent deploy/kabu-backend -- pg_isready -h postgres

# 4. Check PVC status
kubectl get pvc -n kabu-agent
```

**Resolution:**
1. If pod not running: Check events and restart
2. If disk full: Expand PVC or clean old data
3. If connection refused: Check PostgreSQL configuration
4. If too many connections: Restart backend pods

---

### ALERT: RedisDown

**Severity:** Critical
**Description:** Redis is not responding

**Investigation:**
```bash
# 1. Check Redis pod
kubectl get pods -n kabu-agent -l app=redis

# 2. Check Redis logs
kubectl logs -n kabu-agent -l app=redis --tail=50

# 3. Test Redis connection
kubectl exec -n kabu-agent deploy/kabu-backend -- redis-cli -h redis ping
```

**Resolution:**
1. If OOMKilled: Increase memory or configure maxmemory
2. If pod not starting: Check volume mounts
3. Consider flush if cache corruption suspected

---

### ALERT: HighNodeMemory

**Severity:** Critical
**Description:** Node memory usage exceeds 90%

**Investigation:**
```bash
# 1. Check node resources
kubectl top nodes

# 2. Check pods consuming most memory
kubectl top pods --all-namespaces --sort-by=memory | head -20

# 3. Check for evicted pods
kubectl get pods --all-namespaces --field-selector=status.phase=Failed
```

**Resolution:**
1. Identify and scale down non-critical workloads
2. Evict pods manually if necessary
3. Consider node scaling (add nodes or resize)

---

### ALERT: HighNodeCPU

**Severity:** Warning
**Description:** CPU usage exceeds 85% for 10 minutes

**Investigation:**
```bash
# 1. Check node CPU usage
kubectl top nodes

# 2. Check pods consuming most CPU
kubectl top pods --all-namespaces --sort-by=cpu | head -20

# 3. Check for CPU throttling
kubectl get pods --all-namespaces -o json | jq '.items[] | select(.status.containerStatuses[].state.waiting.reason == "CrashLoopBackOff") | .metadata.name'
```

**Resolution:**
1. Identify CPU-intensive workloads
2. Check for runaway processes or infinite loops
3. Consider horizontal scaling for CPU-bound services
4. Review resource requests/limits

---

### ALERT: DiskSpaceLow

**Severity:** Warning
**Description:** Less than 15% disk space remaining

**Investigation:**
```bash
# 1. Check PVC usage
kubectl exec -n monitoring deploy/prometheus-server -- df -h /data

# 2. Check large directories
kubectl exec -n monitoring deploy/prometheus-server -- du -sh /data/*
```

**Resolution:**
1. For Prometheus: Reduce retention period
2. For Grafana: Clean old snapshots
3. Expand PVC if persistent issue

---

### ALERT: SLOAvailabilityBudgetBurn

**Severity:** Critical
**Description:** Error budget is being consumed faster than 0.1% per hour (99.9% SLO at risk)

**Investigation:**
```bash
# 1. Check current error rate
kubectl port-forward -n monitoring svc/prometheus-server 9090:80 &
curl -s 'localhost:9090/api/v1/query?query=sum(rate(http_requests_total{job="kabu-backend",status=~"5.."}[1h]))/sum(rate(http_requests_total{job="kabu-backend"}[1h]))' | jq '.data.result[0].value[1]'

# 2. Check error distribution by endpoint
curl -s 'localhost:9090/api/v1/query?query=sum(rate(http_requests_total{job="kabu-backend",status=~"5.."}[1h]))by(handler)' | jq

# 3. Check backend logs for errors
kubectl logs -n kabu-agent deploy/kabu-backend --tail=100 | grep -i error
```

**Resolution:**
1. Identify endpoints with highest error rates
2. Check for database/Redis connectivity issues
3. Review recent deployments for regression
4. Consider rolling back if recent deployment caused issues
5. Scale up backend if under resource pressure

**SLO Context:**
- Target: 99.9% availability (8.7h/year downtime budget)
- Burn rate threshold: 0.1% error rate per hour
- If sustained, will exhaust monthly error budget in ~10 hours

---

### ALERT: SLOLatencyBudgetBurn

**Severity:** Warning
**Description:** P99 latency exceeds 500ms SLO target

**Investigation:**
```bash
# 1. Check current P99 latency
kubectl port-forward -n monitoring svc/prometheus-server 9090:80 &
curl -s 'localhost:9090/api/v1/query?query=histogram_quantile(0.99,sum(rate(http_request_duration_seconds_bucket{job="kabu-backend"}[1h]))by(le))' | jq '.data.result[0].value[1]'

# 2. Check latency by endpoint
curl -s 'localhost:9090/api/v1/query?query=histogram_quantile(0.99,sum(rate(http_request_duration_seconds_bucket{job="kabu-backend"}[1h]))by(le,handler))' | jq

# 3. Check resource usage
kubectl top pods -n kabu-agent
```

**Resolution:**
1. Identify slow endpoints and optimize queries
2. Check database query performance
3. Review Redis cache hit rates
4. Consider scaling backend replicas
5. Check for external API slowdowns

**SLO Context:**
- Target: P99 latency < 500ms
- User experience directly impacted when exceeded
- Monitor P50/P95 for early warning signs

---

## Common Operations

### Restart Monitoring Stack
```bash
# Restart individual components
kubectl rollout restart deployment/prometheus-server -n monitoring
kubectl rollout restart deployment/grafana -n monitoring
kubectl rollout restart deployment/alertmanager -n monitoring

# Verify
./infra/k8s/monitoring/deploy.sh verify
```

### Force Reload Prometheus Config
```bash
# Prometheus will auto-reload, but to force:
kubectl exec -n monitoring deploy/prometheus-server -- kill -HUP 1
```

### Silence Alerts
```bash
# Via Alertmanager API
curl -X POST https://alertmanager.${DOMAIN}/api/v2/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [{"name": "alertname", "value": "HighLatency", "isRegex": false}],
    "startsAt": "2024-01-01T00:00:00Z",
    "endsAt": "2024-01-01T01:00:00Z",
    "createdBy": "ops-team",
    "comment": "Maintenance window"
  }'
```

### Export Grafana Dashboards
```bash
# List dashboards
curl -s https://grafana.${DOMAIN}/api/search | jq '.[] | {uid, title}'

# Export specific dashboard
curl -s https://grafana.${DOMAIN}/api/dashboards/uid/<UID> | jq '.dashboard' > dashboard.json
```

---

## Disaster Recovery

### Prometheus Data Loss
1. Data is stored in PVC - check PVC status
2. If PVC lost, Prometheus will rebuild from scrape targets
3. Historical data cannot be recovered without backup

### Grafana Dashboard Recovery
1. Dashboards are stored in ConfigMap (grafana-kabu-dashboards)
2. Rebuild from Git: `kubectl apply -f grafana-dashboards.yaml`

### Complete Stack Reinstall
```bash
# Uninstall (preserves PVCs by default)
./infra/k8s/monitoring/deploy.sh uninstall
./infra/k8s/tracing/deploy.sh uninstall

# Reinstall
./infra/k8s/monitoring/deploy.sh install
./infra/k8s/tracing/deploy.sh install
```

---

## Maintenance Procedures

### Upgrade Prometheus
```bash
# 1. Check current version
helm list -n monitoring

# 2. Update values file with new version
# Edit prometheus-values.yaml

# 3. Upgrade
./infra/k8s/monitoring/deploy.sh upgrade

# 4. Verify
./infra/k8s/monitoring/deploy.sh verify
```

### Rotate Slack Webhook
```bash
# 1. Update secret
kubectl create secret generic alertmanager-secrets \
  --from-literal=slack-webhook-url="https://hooks.slack.com/new-url" \
  -n monitoring --dry-run=client -o yaml | kubectl apply -f -

# 2. Restart Alertmanager
kubectl rollout restart deployment/alertmanager -n monitoring
```

---

## Contact & Escalation

| Level | Contact | Response Time |
|-------|---------|---------------|
| L1 | On-call engineer | 15 min |
| L2 | Platform team | 30 min |
| L3 | Infrastructure lead | 1 hour |

**Slack Channels:**
- #kabu-alerts - Automated alerts
- #kabu-ops - Operations discussion
- #kabu-incidents - Active incidents
