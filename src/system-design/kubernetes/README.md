# Kubernetes (K8s) - Container Orchestration for SDE 3

## 🐳 What is Kubernetes?

**Kubernetes**: Open-source container orchestration platform

**Core Problem it Solves**:
- Manual container management at scale is complex
- Need automatic scaling, self-healing, rolling updates
- Service discovery & load balancing

**Key Capabilities**:
- ✅ Automatic deployment
- ✅ Self-healing (restart failed containers)
- ✅ Rolling updates (zero-downtime deployments)
- ✅ Service discovery
- ✅ Storage orchestration
- ✅ Auto-scaling

---

## 🏗️ Kubernetes Architecture

### Master (Control Plane) Components

```
┌─────────────────────────────────────┐
│       Kubernetes Master/Control      │
├─────────────────────────────────────┤
│ • API Server (REST interface)       │
│ • Scheduler (assigns pods)          │
│ • Controller Manager (maintains)    │
│ • etcd (distributed key-value)      │
└─────────────────────────────────────┘
```

**API Server**: All communication goes through here (REST API)

**Scheduler**: Assigns pods to nodes based on:
- Resource requests (CPU, memory)
- Affinity rules
- Taints & tolerations

**Controller Manager**: Watches desired state vs actual state
- Replication Controller
- StatefulSet Controller
- Deployment Controller

**etcd**: Distributed database storing all cluster state

### Worker Nodes

```
┌────────────────────┐
│    Worker Node     │
├────────────────────┤
│ kubelet (agent)    │ ← Communicates with master
│ kube-proxy (DNS)   │ ← Service discovery
│ Container Runtime  │ ← Docker/containerd
├────────────────────┤
│ Pod 1 Pod 2 Pod 3  │
└────────────────────┘
```

---

## 📦 Key Concepts

### Pod
```
Smallest deployable unit (like container, but K8s model)

spec:
  containers:
  - name: app
    image: myapp:1.0
    ports:
    - containerPort: 8080
    resources:
      requests:
        cpu: "100m"           # 0.1 CPU
        memory: "128Mi"       # 128 MB
      limits:
        cpu: "500m"           # Max 0.5 CPU
        memory: "512Mi"       # Max 512 MB

Typically 1 container per pod
Multi-container pods for init containers or sidecars
```

### Deployment
```
Manages replica sets (which manage pods)

spec:
  replicas: 3                  # Always keep 3 pods running
  strategy:
    type: RollingUpdate        # Zero-downtime update
    rollingUpdate:
      maxSurge: 1              # Extra pod during update
      maxUnavailable: 0        # Never stop serving
  template:
    spec:
      containers: [...]
```

### Service
```
Exposes pods to network

Types:
1. ClusterIP (internal DNS)
   - Service: my-app.default.svc.cluster.local
   - Only accessible within cluster
   
2. NodePort (external access)
   - Exposed on node's IP:port
   - External systems can access
   
3. LoadBalancer (cloud integration)
   - Provisions external load balancer
   - Cloud provider handles it
   
4. ExternalName (external service reference)
   - Maps to external DNS name
```

### StatefulSet
```
For stateful applications (databases, caches)

Guarantees:
- Stable network identity: pod-0, pod-1, pod-2
- Ordered scale up/down
- Persistent storage per pod

Use for: Kafka, Redis cluster, Cassandra, MySQL
```

### ConfigMap & Secrets
```
ConfigMap: Non-sensitive configuration
spec:
  config.yaml: |
    database:
      host: db.example.com
      port: 5432

Secrets: Sensitive data (base64 encoded)
spec:
  type: Opaque
  stringData:
    password: "super-secret"
```

---

## 🔄 Pod Lifecycle

```
┌─────────┐    ┌──────────┐    ┌────────┐    ┌────────┐
│ Pending │ → │ Running  │ ← →│ Failed │    │Succeeded
└─────────┘    └──────────┘    └────────┘    └────────┘
      ↑              ↓
      └──────────────┘
    (Restart policy)
```

**Pending**: Pod created, waiting for resources

**Running**: Container started successfully

**Failed**: Container crashed/exited

**Succeeded**: Pod completed (batch jobs)

---

## 🎯 Deployment Strategy

### Rolling Update (Default)

```
V1 (3 pods)           V2 (3 pods)
┌─────────────────────────────────────┐
│ Pod1-v1 Pod1-v1 Pod1-v1             │ Start
│ Pod1-v2 Pod1-v1 Pod1-v1             │ Replace 1
│ Pod1-v2 Pod1-v2 Pod1-v1             │ Replace 2
│ Pod1-v2 Pod1-v2 Pod1-v2             │ Complete
└─────────────────────────────────────┘

Benefits: Zero downtime, can rollback quickly
Tradeoff: Brief period with mixed versions
```

### Blue-Green Deployment

```
Blue (V1) [3 pods]  ← Production (load balanced)
Green (V2) [3 pods] ← Staging environment

Test Green thoroughly
Switch load balancer: Blue → Green
Old Blue becomes new staging environment
If issues, switch back instantly
```

### Canary Deployment

```
V1 [99% traffic]
V2 [1% traffic]  ← Monitor errors/latency

If V2 looks good:
V1 [90% traffic]
V2 [10% traffic]

Gradually increase V2 percentage
```

---

## 📊 Auto-Scaling

### Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70    # Scale up at 70% CPU
  - type: Resource
    resource:
      name: memory
      target:
        type: AverageValue
        averageValue: "512Mi"     # Scale up if avg > 512Mi
```

**Decision Logic**:
```
Current: 30 pods at 80% CPU
Target:  70% CPU

Desired replicas = 30 * (80 / 70) = 34 pods
```

### Vertical Pod Autoscaler (VPA)

Automatically adjusts resource requests based on usage:
```
Requests: cpu: 100m, memory: 128Mi (initial)
Usage:    cpu: 250m, memory: 256Mi (observed)
→ VPA recommends: cpu: 250m, memory: 256Mi
```

---

## 🔐 Network & Security

### Network Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}              # Applies to all pods
  policyTypes:
  - Ingress
  - Egress
  # This denies all ingress/egress traffic
```

```yaml
# Allow traffic from app=api pods to app=database pods
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-db
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api
```

### RBAC (Role-Based Access Control)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-reader
subjects:
- kind: ServiceAccount
  name: my-app
  namespace: default
```

---

## 🚀 Common Interview Patterns

### Q1: High Availability Deployment

```yaml
spec:
  replicas: 3
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: app
              operator: In
              values:
              - my-app
          topologyKey: kubernetes.io/hostname  # Spread across nodes

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
```

### Q2: Resource Management

```yaml
spec:
  containers:
  - name: app
    resources:
      requests:
        cpu: "100m"         # Guaranteed allocation
        memory: "128Mi"
      limits:
        cpu: "500m"         # Hard limit, kills pod if exceeded
        memory: "512Mi"
```

### Q3: Health Checks

```yaml
spec:
  containers:
  - name: app
    livenessProbe:           # Is pod alive?
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
      
    readinessProbe:          # Ready to receive traffic?
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
```

---

## 📊 Performance Tuning

| Setting | Purpose | Value |
|---------|---------|-------|
| **cluster-autoscaler** | Add nodes when pods pending | Enable for cloud |
| **PodDisruptionBudget** | Prevent simultaneous pod evictions | minAvailable: 2 |
| **Resource Quotas** | Limit namespace usage | cpu: 10, memory: 20Gi |
| **QoS Classes** | Priority for scheduling | Guaranteed, Burstable |

---

## 🎓 Interview Checklist

- [ ] Understand master vs worker node architecture
- [ ] Know Pod, Deployment, Service, StatefulSet difference
- [ ] Can design high-availability setup
- [ ] Understand rolling updates vs blue-green
- [ ] Know resource requests vs limits implications
- [ ] Can configure health checks properly
- [ ] Understand HPA decision logic
- [ ] Know network policies for security
- [ ] Can troubleshoot pod scheduling issues
- [ ] Understand persistent volumes for stateful apps

---

## 🔧 Common Commands

```bash
# Deployments
kubectl apply -f deployment.yaml
kubectl rollout status deployment/my-app
kubectl rollout undo deployment/my-app
kubectl scale deployment my-app --replicas=5

# Debugging
kubectl logs pod-name
kubectl exec -it pod-name -- /bin/bash
kubectl describe pod pod-name
kubectl get events

# Monitoring
kubectl top nodes
kubectl top pods
```

---

## 🏆 2026 Trend: Service Mesh Integration

Senior engineers now expected to know:
- **Istio/Linkerd**: Service mesh for observability, security, traffic management
- **Gateway API**: Modern replacement for Ingress
- **eBPF**: For networking performance
- **GitOps**: ArgoCD for declarative deployments

---

**Final Note**: Kubernetes is essential for SDE 3 interviews in 2026. Focus on understanding "why" behind each component, not just "what it is".
