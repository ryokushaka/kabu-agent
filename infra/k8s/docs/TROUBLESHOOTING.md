# Kabu Agent - Troubleshooting Guide

## Quick Diagnostics

### Check Overall Health
```bash
# All namespaces
kubectl get pods --all-namespaces | grep -v Running

# Monitoring stack
kubectl get pods -n monitoring

# Application
kubectl get pods -n kabu-agent

# Istio (if installed)
kubectl get pods -n istio-system
```

### Check Events
```bash
# Recent events across cluster
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | tail -20

# Events in specific namespace
kubectl get events -n kabu-agent --sort-by='.lastTimestamp'
```

---

## Common Issues

### Pod Not Starting

#### Symptom: Pod stuck in Pending
```bash
# Check events
kubectl describe pod <pod-name> -n <namespace>

# Check node resources
kubectl top nodes
kubectl describe nodes | grep -A 5 "Allocated resources"
```

**Possible Causes:**
1. **Insufficient resources**: Node doesn't have enough CPU/memory
   - Solution: Scale down other workloads or add nodes

2. **PVC not bound**: Volume claim pending
   ```bash
   kubectl get pvc -n <namespace>
   ```
   - Solution: Check StorageClass and PV availability

3. **Node selector/affinity**: Pod can't be scheduled
   - Solution: Check node labels match pod requirements

#### Symptom: Pod in CrashLoopBackOff
```bash
# Check logs
kubectl logs <pod-name> -n <namespace> --previous

# Check container exit reason
kubectl describe pod <pod-name> -n <namespace> | grep -A 10 "Last State"
```

**Possible Causes:**
1. **Application error**: Check logs for stack traces
2. **Missing config**: ConfigMap or Secret not mounted
3. **Health check failing**: Readiness/liveness probe misconfigured

#### Symptom: Pod in ImagePullBackOff
```bash
kubectl describe pod <pod-name> -n <namespace> | grep -A 5 "Events"
```

**Possible Causes:**
1. **Wrong image tag**: Verify image exists in registry
2. **Registry auth**: Check imagePullSecrets
3. **Network issue**: Registry not reachable

---

### Prometheus Issues

#### Prometheus not scraping targets
```bash
# Check targets status
kubectl port-forward -n monitoring svc/prometheus-server 9090:80 &
curl -s localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'
```

**Possible Causes:**
1. **Missing annotations**: Pod needs prometheus.io/scrape: "true"
2. **Wrong port**: Check prometheus.io/port annotation
3. **Network policy**: Prometheus can't reach target

#### High memory usage
```bash
kubectl top pod -n monitoring -l app=prometheus
```

**Solutions:**
1. Reduce retention: `--storage.tsdb.retention.time=3d`
2. Reduce scrape frequency: `scrape_interval: 30s`
3. Add metric relabeling to drop unnecessary metrics

---

### Grafana Issues

#### Can't login to Grafana
```bash
# Get admin password
kubectl get secret -n monitoring grafana -o jsonpath="{.data.admin-password}" | base64 -d

# Reset password
kubectl exec -n monitoring deploy/grafana -- grafana-cli admin reset-admin-password <new-password>
```

#### Dashboards not loading
```bash
# Check Grafana logs
kubectl logs -n monitoring deploy/grafana --tail=50

# Check datasource connectivity
kubectl exec -n monitoring deploy/grafana -- curl -s http://prometheus-server:80/api/v1/query?query=up
```

---

### Alertmanager Issues

#### Alerts not firing
```bash
# Check alert rules
kubectl port-forward -n monitoring svc/prometheus-server 9090:80 &
curl -s localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | {name: .name, state: .state}'
```

#### Slack notifications not working
```bash
# Check Alertmanager config
kubectl get configmap -n monitoring alertmanager-config -o yaml

# Check secret exists
kubectl get secret -n monitoring alertmanager-secrets

# Test webhook manually
curl -X POST -H "Content-Type: application/json" \
  -d '{"text":"Test alert"}' \
  $(kubectl get secret -n monitoring alertmanager-secrets -o jsonpath='{.data.slack-webhook-url}' | base64 -d)
```

---

### Istio Issues

#### Service not accessible through mesh
```bash
# Check if namespace is enrolled
kubectl get namespace -l istio.io/dataplane-mode=ambient

# Check ztunnel status
kubectl get pods -n istio-system -l app=ztunnel

# Check istiod logs
kubectl logs -n istio-system deploy/istiod --tail=50
```

#### mTLS not working
```bash
# Check PeerAuthentication
kubectl get peerauthentication -A

# Verify mTLS status
istioctl authn tls-check <pod>.<namespace>
```

---

### Jaeger Issues

#### Traces not appearing
```bash
# Check OTel Collector
kubectl logs -n monitoring deploy/otel-collector --tail=50

# Check Jaeger
kubectl logs -n monitoring deploy/jaeger --tail=50

# Verify OTLP endpoint
kubectl exec -n kabu-agent deploy/kabu-backend -- \
  curl -s http://otel-collector.monitoring:4317
```

#### Trace data missing
```bash
# Check sampling rate
kubectl get configmap -n monitoring jaeger-sampling -o yaml

# Check memory storage
kubectl exec -n monitoring deploy/jaeger -- wget -qO- localhost:14269/metrics | grep traces
```

---

### Network Issues

#### Service not reachable
```bash
# Check service exists
kubectl get svc -n <namespace>

# Check endpoints
kubectl get endpoints -n <namespace> <service-name>

# Test DNS resolution
kubectl run -it --rm debug --image=busybox -- nslookup <service>.<namespace>.svc.cluster.local

# Test connectivity
kubectl run -it --rm debug --image=busybox -- wget -qO- <service>.<namespace>:<port>
```

#### Ingress not working
```bash
# Check ingress
kubectl get ingress -n <namespace>

# Check Traefik logs
kubectl logs -n kube-system -l app.kubernetes.io/name=traefik --tail=50

# Check TLS certificate
kubectl get certificate -n <namespace>
```

---

### Resource Issues

#### High memory usage
```bash
# Find top memory consumers
kubectl top pods --all-namespaces --sort-by=memory | head -20

# Check for memory leaks
kubectl exec -n <namespace> <pod> -- cat /proc/1/status | grep -i vm
```

#### High CPU usage
```bash
# Find top CPU consumers
kubectl top pods --all-namespaces --sort-by=cpu | head -20

# Check for runaway processes
kubectl exec -n <namespace> <pod> -- top -bn1 | head -20
```

#### Disk space issues
```bash
# Check PVC usage
kubectl exec -n <namespace> <pod> -- df -h

# Find large files
kubectl exec -n <namespace> <pod> -- du -sh /* 2>/dev/null | sort -h
```

---

## Debug Commands Reference

### Exec into pod
```bash
kubectl exec -it <pod> -n <namespace> -- /bin/sh
```

### Port forward
```bash
kubectl port-forward -n <namespace> svc/<service> <local-port>:<service-port>
```

### Copy files
```bash
# From pod
kubectl cp <namespace>/<pod>:/path/to/file ./local-file

# To pod
kubectl cp ./local-file <namespace>/<pod>:/path/to/file
```

### View real-time logs
```bash
kubectl logs -f -n <namespace> <pod> --tail=100
```

### Resource usage
```bash
kubectl top nodes
kubectl top pods -n <namespace>
```

### API resources
```bash
kubectl api-resources | grep <resource>
kubectl explain <resource>
```

---

## Emergency Procedures

### Force delete stuck pod
```bash
kubectl delete pod <pod> -n <namespace> --grace-period=0 --force
```

### Drain node for maintenance
```bash
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
```

### Emergency scale down
```bash
kubectl scale deployment --all -n <namespace> --replicas=0
```

### Reset deployment
```bash
kubectl rollout undo deployment/<name> -n <namespace>
kubectl rollout restart deployment/<name> -n <namespace>
```

---

## Contact

If issue persists after troubleshooting:
1. Collect logs: `kubectl logs -n <namespace> <pod> > pod.log`
2. Collect events: `kubectl get events -n <namespace> > events.log`
3. Create issue with logs attached
