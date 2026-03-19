# High-Level Design: Microservices Architecture

## Overview

Microservices is the dominant architectural pattern for modern systems at scale. Unlike monoliths, microservices decompose systems into small, independent services that communicate over APIs. This enables faster development, independent scaling, and technology flexibility—but with complexity tradeoffs.

## Monolith vs Microservices

### Monolith Architecture

```
┌──────────────────────────────────┐
│  Single Application               │
│ ┌────────────────────────────┐   │
│ │ User Service               │   │
│ │ Order Service              │   │
│ │ Payment Service            │   │
│ │ Notification Service       │   │
│ └────────────────────────────┘   │
│ ┌────────────────────────────┐   │
│ │      Shared Database       │   │
│ └────────────────────────────┘   │
└──────────────────────────────────┘
```

**Advantages**:
- Simple to deploy initially (single binary)
- Single transaction (ACID)
- Easy to share data between modules
- Simple debugging (single process)

**Disadvantages**:
- Deploy entire app for one service change (risk)
- Scaling: entire monolith scales, can't scale one feature
- Technology lock-in: one language for entire app
- Single point of failure
- Single database bottleneck
- Team scaling: hard to work on same codebase

### Microservices Architecture

```
┌─────────────────────────────────────────────────────┐
│              API Gateway / Load Balancer             │
└────┬──────────────┬──────────────┬──────────────┬────┘
     │              │              │              │
  ┌──▼───┐   ┌──────▼──┐   ┌──────▼──┐   ┌──────▼──┐
  │User  │   │Order    │   │Payment  │   │Notif.   │
  │Svc   │   │Svc      │   │Svc      │   │Svc      │
  └──┬───┘   └──┬──────┘   └──┬──────┘   └──┬──────┘
     │          │             │             │
  ┌──▼───┐   ┌──▼───┐   ┌──────▼──┐   ┌──────▼──┐
  │User  │   │Order │   │Payments │   │Events   │
  │DB    │   │DB    │   │DB       │   │Log      │
  └──────┘   └──────┘   └─────────┘   └─────────┘
  
  ┌──────────────────────────────────────────┐
  │  Message Queue / Event Bus (Kafka)        │
  └──────────────────────────────────────────┘
  
  ┌──────────────────────────────────────────┐
  │  Service Discovery (Consul, Eureka)      │
  └──────────────────────────────────────────┘
  
  ┌──────────────────────────────────────────┐
  │  Monitoring (Prometheus, Datadog)        │
  └──────────────────────────────────────────┘
```

**Advantages**:
- Independent deployment (deploy one service without others)
- Independent scaling (scale payment service without user service)
- Technology flexibility (one service in Node, another in Go)
- Team autonomy (different teams own different services)
- Fault isolation (one service down, others still work)

**Disadvantages**:
- Distributed system complexity (eventual consistency, network issues)
- Operational overhead (more things to monitor)
- Data consistency (transactions span multiple services)
- Latency (network calls between services)
- Debugging harder (trace across multiple services)
- Network dependency (if network flaky, many services fail)

## Microservices Principles

### 1. Single Responsibility

Each service owns one business capability.

**Good**: Order Service (create, update, list orders)  
**Bad**: Order Service (order logic + payment + shipping + analytics)

### 2. Loose Coupling

Services interact through contracts (APIs), not internal state.

- Change Order Service internals → Payment Service unaffected (API unchanged)
- Decoupled via async messaging or REST contracts

### 3. High Cohesion

Related logic grouped together.

- User authentication, profile, preferences → User Service
- Create, update, list, delete orders → Order Service

### 4. Database Per Service

Each service owns its database (no shared DB).

```
User Service  → User DB
Order Service → Order DB
Payment Svc   → Payment DB
```

**Why?**:
- True independence (can change DB schema independently)
- Scalability (each DB scaled separately)
- Technology choice (user service uses Postgres, order uses MongoDB)

**Complexity**: Cross-service queries now hard (no SQL joins)

### 5. API-Only Communication

Services never directly access other's databases or internal data structures.

**Good**: User Service calls Order API to get user's orders  
**Bad**: Order Service directly reads from User DB

## Service Communication Patterns

### Synchronous: REST/HTTP

```
Client → API Gateway → User Service (REST call) → Order Service
         (orchestration)                    │
                                           └→ Payment Service
```

**Pros**: Simple, immediate response  
**Cons**: Blocks, tight coupling, cascading failures

**When to use**: User-facing requests needing immediate response

### Synchronous: gRPC

```
Service → gRPC call → Service
(protobuf binary)
```

**vs REST**:
- Binary format (smaller, faster)
- HTTP/2 multiplexing (multiple calls on one connection)
- Strict contract (.proto files)
- Better latency (~10x faster)

**When**: Internal service-to-service communication

### Asynchronous: Message Queues

```
User Service → Kafka topic "user.created" → 
              Order Service (listens)
              Notification Service (listens)
              Analytics Service (listens)
```

**Pros**: Decoupled, fast (no wait for response), resilient  
**Cons**: Eventual consistency, debugging harder

**When**: Non-critical operations, broadcast to multiple services

### Asynchronous: Event Streaming

Similar to message queue but:
- Events are historical record (not deleted after consumption)
- New subscribers can replay entire history
- Patterns: Event sourcing, CQRS

**When**: Need audit trail, multiple late subscribers

## Service Discovery

How service finds another service's address in dynamic environment.

**Without Service Discovery**:
```
Configuration says:
  Order Service = "order-server-1.example.com:8080"
  
Problem: New instance added, config not updated
         Instance crashes, traffic still sent there
         Load not balanced between instances
```

**With Service Discovery**:
```
1. Service registers itself: 
   "Order Service instance at 10.0.0.1:8080"
   
2. Client queries registry:
   "Where is Order Service?" → [10.0.0.1, 10.0.0.2, 10.0.0.3]
   
3. Client load balances across results
   
4. Health check: Unhealthy instances removed
```

**Tools**: Consul, Eureka, Kubernetes DNS

## API Gateway

Single entry point for clients. Adds abstraction between clients and services.

```
External → API Gateway → Internal Services
Clients     - Auth
            - Rate limiting
            - Response translation
            - Caching
            - Routing
```

**Responsibilities**:
- **Routing**: Direct request to correct service
- **Authentication**: Verify user (once, for all services)
- **Rate limiting**: Protect from abuse
- **Response transformation**: Adapt response for clients
- **Caching**: Cache common requests
- **Protocol translation**: GraphQL to REST, gRPC to REST

**Examples**: Kong, AWS API Gateway, nginx

## Handling Distributed Transactions

**Problem**: Order Service creates order, Payment Service processes payment. What if payment fails after order created?

### Solution 1: Two-Phase Commit (2PC)

```
1. Prepare phase:
   Transaction coordinator asks:
   "Can Order DB commit this change?" → Yes
   "Can Payment DB commit this payment?" → Yes
   
2. Commit phase:
   "Commit Order change" → Done
   "Commit Payment" → Done
```

**Cons**: Blocking, slow (wait for all services), failure-prone

**Not recommended** for distributed systems

### Solution 2: Saga Pattern

```
Step 1: Create Order → Success
        (emit event: "order.created")
        
Step 2: Payment Service receives event
        → Process payment
        → If fails: emit "payment.failed"
        
Step 3: Order Service receives "payment.failed"
        → Compensate: Cancel order
        (emit event: "order.cancelled")
```

**Choreography** (event-driven above)  
**Orchestration** (central coordinator service):
```
Saga Orchestrator:
  Step 1: Call Order Service (create order)
  Step 2: Call Payment Service (charge card)
  Step 3: Call Notification Service (send receipt)
  
If any fails: Compensate (call rollback endpoints)
```

**Best practice**: Orchestration with clear flow, easy to debug

### Solution 3: Idempotent Operations

Design operations so they can be retried safely.

```
Create order: 
  Client provides unique idempotency key
  
  First call: Creates order, returns OrderID
  Second call with same key: Returns same OrderID (no duplicate)
  
Payment:
  Using same transaction ID ensures:
  Retry on network failure doesn't charge twice
```

## Deployment Patterns

### Blue-Green Deployment

```
Blue (Current)  → 100% traffic
                → New canary feature
                
Green (New)     → 0% traffic (staging)
                → Thoroughly tested
                → Run same load tests
                
Cutover: Blue → Green (instant, full rollback possible)
```

**Pros**: Instant rollback, zero downtime  
**Cons**: Need double infrastructure

### Canary Deployment

```
                            Traffic
Current Service (99%)       [═════════════════════ 99%]
New Version (1%)            [█ 1%]
                            ↓ Monitor metrics
                            
If healthy → Increase new version traffic gradually
If fails   → Rollback to 0%
```

**Pros**: Detect issues early, gradual rollout  
**Cons**: More complex, longer rollout

## Service Mesh

Infrastructure layer managing all inter-service communication.

```
Microservice    → Sidecar Proxy (Envoy)  → Network
                  (service mesh)
                  
Handles:
- Load balancing
- Circuit breaking
- Retries
- Timeouts
- Security (mTLS)
- Monitoring
```

**Examples**: Istio, Linkerd, Consul

**Benefits**: Decouples infrastructure concerns from service code

## Challenges of Microservices

### 1. Eventual Consistency

Data not immediately consistent across services. Order might show as pending while payment processes.

**Mitigation**: 
- Design UX for eventual consistency
- Status field: pending → success/failed
- Polling or webhooks for notifications

### 2. Testing

Single integration test becomes multiple testing strategies:
- Unit tests (per service)
- Contract tests (validate API contracts)
- Integration tests (real databases)
- End-to-end tests (full system)

### 3. Debugging

Error occurs in order service, but root cause in payment API.

**Tools**: 
- Distributed tracing (Jaeger, Lightstep)
- Logs correlation (trace ID across logs)
- Monitoring (Datadog, Prometheus)

### 4. Network Latency

REST calls over network add ~10-100ms per hop.

**Mitigation**:
- Batch operations
- Caching
- gRPC (faster than REST)
- Reduce hops (direct calls >= indirect)

### 5. Cascading Failures

Payment service down → Order service blocks on payment call → API Gateway backs up → User sees timeout

**Mitigation**: 
- Circuit breaker pattern (fail fast, don't wait)
- Timeouts on service calls
- Fallback responses
- Bulkheads (limit resource usage)

## Circuit Breaker Pattern

Protection against cascading failures.

```
        ┌──────────────┐
        │  CLOSED      │ ← Normal state
        │ (Allow calls)│   Success/failure counted
        └──┬──────────┘
           │ Failure threshold hit
           │ (5 failures in 30s)
        ┌──▼──────────┐
        │  OPEN       │ ← Trip immediately, don't call service
        │ (Fail fast) │   Return error to client
        └──┬──────────┘
           │ After timeout (60s)
        ┌──▼──────────────┐
        │  HALF-OPEN      │ ← Try test call
        │ (Test recovery) │   If succeeds: Close
        └──┬──────────────┘
           │ If fails: Open again
```

**Benefits**: Prevents hammering down service, fast fail

## Microservices Checklist

### When to Use
- [ ] System complexity justifies distributed design
- [ ] Multiple teams working on different features
- [ ] Different components need independent scaling
- [ ] Want technology flexibility

### When NOT to Use
- [ ] Small team (< 10 engineers)
- [ ] All components need synchronized scaling
- [ ] Strong consistency critical
- [ ] High latency not acceptable

### Required Infrastructure
- [ ] Service discovery (Consul, Kubernetes DNS)
- [ ] API Gateway
- [ ] Message queue (Kafka, RabbitMQ)
- [ ] Distributed tracing (Jaeger, Lightstep)
- [ ] Metrics/monitoring (Prometheus, Datadog)
- [ ] Logging aggregation (ELK, Splunk)
- [ ] Container orchestration (Kubernetes)

### Team Structure
- [ ] Small feature teams (4-8 engineers)
- [ ] Each team owns 1-2 services
- [ ] Clear API contracts
- [ ] Shared infra team for service mesh, monitoring

## Interview Tips

### Design Decision Tree

1. **Start monolith** unless:
   - Scale requires independent scaling
   - Multiple teams need autonomy
   - Technology flexibility needed

2. **Extract service** when:
   - Service becomes bottleneck
   - Team wants different tech
   - Feature can be independent

3. **Add API Gateway** once:
   - More than 3 services
   - Multiple clients (web, mobile)
   - Cross-cutting concerns (auth > 1 service)

4. **Add message queue** when:
   - Async operations acceptable
   - Multiple services need same event
   - Decoupling helps

### Common Mistakes
- Over-engineering: Microservices for small system
- Distributed monolith: Calling between services for every operation
- Ignoring latency: Not considering network hops
- Inconsistent versioning: Breaking API changes
- No service contracts: Hard to test independently
- Shared database: Not true independence

## Key Takeaways

1. **Microservices is architectural pattern**: Not a technology choice
2. **Complexity tradeoff**: Independence costs operational complexity
3. **Database per service principle**: Enables true decoupling
4. **Eventual consistency**: Mindset shift from monoliths
5. **Distributed transactions hard**: Use Saga pattern, not 2PC
6. **Observability critical**: Logging, tracing, monitoring essential
7. **Start monolith**: Evolve to microservices as needed, not day 1

---

## Advanced Q&A: Microservices Design Patterns

### Q1: Design Service Communication for a Product Catalog System

**Problem**: Product Service, Review Service, Rating Service, Inventory Service

**Solution**: Multi-pattern approach

```
Pattern 1: Synchronous REST (Query product details)
┌─────────────────┐
│ API Gateway     │
└────────┬────────┘
         │
    ┌────▼──────────┬────────────┬─────────────┐
    │               │            │             │
 ┌──▼──┐        ┌───▼──┐    ┌───▼────┐   ┌───▼───┐
 │ Prod │        │Review│    │ Rating │   │ Inv.  │
 │ Svc  │        │ Svc  │    │ Svc    │   │ Svc   │
 └──────┘        └──────┘    └────────┘   └───────┘

API: GET /products/{id}
→ Product Service returns: {id, name, price, category}
→ Client makes additional API calls for reviews, ratings (parallel)

Why sync: User interaction requires immediate detail

Pattern 2: Asynchronous Events (Update when stock changes)
┌───────────────────────────────┐
│ Inventory Service             │
│ (Stock increases in warehouse)│
└────────────┬──────────────────┘
             │ emit(stock.updated)
        ┌────▼──────────────────────────┐
        │ Kafka Topic: inventory.events │
        └────┬───────┬──────────┬────────┘
             │       │          │
        ┌────▼──┐ ┌──▼──┐  ┌──▼──┐
        │ Notif │ │Cache│  │ Mail│
        │ Svc   │ │ Svc │  │ Svc │
        └───────┘ └─────┘  └─────┘

Implementation:
InventoryService {
    public void updateStock(String productId, int newQuantity) {
        inventory.update(productId, newQuantity);
        
        // Emit event for others to react
        eventBus.publish(
            "inventory.stock_updated",
            new StockUpdateEvent(productId, newQuantity)
        );
    }
}

CacheService listens:
→ Clears cached product (stale price might be shown)
→ Re-fetches latest

NotificationService listens:
→ If stock < 5: Send "Low stock" alert to admins
→ If stock 0→>0: Notify users who wishlisted

Why async: Not time-critical, multiple services care
```

**Tradeoffs**:
- Sync REST: Fast (user sees immediate), but tight coupling
- Async Events: Loose coupling, but eventual consistency (lag)
- Best: Use both (REST for user interactions, Events for background updates)

### Q2: How Do You Handle Service Versioning When APIs Change?

**Problem**: Updated Review Service API from `GET /reviews/{productId}` to `GET /reviews?product_id=123`

**Solution: Backward-compatible versioning**

```
Approach 1: Support multiple API versions

GET /v1/reviews/{productId}  ← Old clients
GET /v2/reviews?product_id=123  ← New clients

ReviewServiceController {
    @GetMapping("/v1/reviews/{productId}")
    public List<Review> getReviewsV1(@PathVariable String productId) {
        // Old format, internally call v2
        return getReviewsV2(productId);
    }
    
    @GetMapping("/v2/reviews")
    public List<Review> getReviewsV2(@RequestParam String product_id) {
        // New implementation
        return reviewDB.findByProductId(product_id);
    }
}

Pros: Clear contract, clients can upgrade at own pace
Cons: Maintain multiple endpoints, code duplication

Approach 2: Graceful deprecation (recommended)

1. Add new API alongside old:
   GET /reviews/{productId}  ← Old (deprecated)
   GET /reviews?product_id=123  ← New (preferred)

2. Add deprecation header:
   HTTP/1.1 200 OK
   Deprecation: true
   Sunset: Sun, 01 Jan 2025 00:00:00 GMT
   Link: </reviews?product_id=123>; rel="successor-version"

3. Log usage of deprecated APIs:
   if (request.url.startsWith("/v1/")) {
       logger.warn("Client using deprecated API v1: " + clientId)
   }

4. Notify clients (6 months ahead):
   "API /v1/reviews will be shut down on Jan 1, 2025.
    Please migrate to /v2/reviews"

5. Monitor migration:
   - Dashboard showing % of traffic on v1 vs v2
   - Auto-alert if v1 suddenly increases (unexpected clients)

6. Sunset: Remove old API after deadline

Approach 3: Contract testing (prevent breaking changes early)

// Contract: What clients expect API to return
contract "Review Service returns reviews for product" {
    request: GET /reviews?product_id=123
    
    response: {
        status: 200,
        body: [{
            id: string,
            rating: 1-5,
            text: string
        }]
    }
}

// When Review Service changes, run contract tests
// If contract violated: Release as new version, don't break existing

Benefits:
- Catch breaking changes before production
- Clear API contracts
- Easier migration planning
```

### Q3: Service A Depends on Service B. Service B Goes Down. How Do You Prevent Cascading Failure?

**Problem**: Order Service calls Payment Service. Payment Service crashes. All order requests timeout.

**Solution layered approach**:

```
Layer 1: Circuit Breaker (fail fast)

@CircuitBreaker(
    failureThreshold = 5,          // Trip after 5 failures
    timeout = 10,                  // Try recovery after 10s
    successThreshold = 2           // Need 2 successes to close
)
public void chargePayment(Order order) {
    paymentService.charge(order);
}

// State machine:
CLOSED (normal) 
  → 5 failures in 10s 
    → OPEN (fail immediately)
      → After 10s 
        → HALF_OPEN (try 1 call)
          → Success → CLOSED
          → Failure → OPEN (again

Layer 2: Timeout (don't wait forever)

// Don't block forever waiting for failed service
RestTemplate restTemplate = new RestTemplate();
restTemplate.setRequestFactory(new SimpleClientHttpRequestFactory() {{
    setConnectTimeout(100);  // 100ms max
    setReadTimeout(500);     // 500ms max read
}});

try {
    paymentService.charge(order);  // Max 600ms total
} catch (SocketTimeoutException e) {
    logger.error("Payment timeout, failing fast");
    throw new PaymentUnavailableException();
}

Layer 3: Fallback / Graceful degradation

public void processOrder(Order order) {
    try {
        paymentService.charge(order);  // Normal path
        order.setStatus(PAID);
    } catch (PaymentUnavailableException e) {
        // Payment unavailable, but don't fail entire order
        logger.warn("Payment service down, deferring billing");
        
        // Fallback option 1: Queue for later
        Order order.setStatus(PAYMENT_PENDING);
        orderDB.save(order);
        paymentQueue.add(new DeferredPayment(order));
        
        // Fallback option 2: Use cached previous payment
        PaymentMethod lastPayment = paymentCache.get(order.user_id);
        if (lastPayment != null) {
            chargeOffline(order, lastPayment);
            order.setStatus(PAID_OFFLINE);
        }
    }
}

Layer 4: Bulkhead pattern (limit resource usage)

// Don't let payment service exhaustion fill ALL thread pool
ThreadPoolExecutor paymentPool = new ThreadPoolExecutor(
    10,           // core threads
    20,           // max threads
    60, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(100)  // Queue size before rejecting
);

// Requests to payment service use this pool
// If payment slow, only 20 threads blocked max
// Other service calls use different pools - not affected

Layer 5: Monitoring & Alerting (detect early)

Monitor payment service health:
- P99 latency > 500ms → Scale up
- Error rate > 1% → Alert oncall
- Circuit open for > 60s → Page oncall (serious)

alerting {
    rule: "Payment service circuit open for 60s"
    action: page(oncall_engineer)
    
    rule: "Payment service latency > 5s"
    action: page(oncall + scale_up_service)
}

Complete solution:

public class ResilientPaymentClient {
    @CircuitBreaker
    @Timeout(value = 500, unit = TimeUnit.MILLISECONDS)
    @Fallback(method = "chargeOffline")
    @Bulkhead(value = 20)
    public PaymentResult charge(Order order) {
        return paymentService.processPayment(order);
    }
    
    public PaymentResult chargeOffline(Order order) {
        // Fallback: queue for later billing
        logger.warn("Using offline payment fallback");
        pendingPaymentQueue.add(order);
        return PaymentResult.DEFERRED;
    }
}
```

### Q4: You have 100 microservices. How Do You Trace a Request Through All of Them?

**Problem**: User reports slow checkout. Request touched: API Gateway → Order Service → Payment Service → Notification Service. Which is slow?

**Solution: Distributed Tracing**

```
Implementation (using Jaeger):

1. Add trace ID to every request:

Request comes in:
GET /checkout
Headers: (no trace-id)

API Gateway adds:
trace-id: abc123xyz789
span-id: span-1

2. Pass trace ID to all downstream services:

API Gateway → Order Service:
POST /orders
Headers: trace-id: abc123xyz789, parent-span: span-1

Order Service creates child span:
span-id: span-2 (child of span-1)
Duration: 50ms
```

Code example:

```java
@Bean
public RestTemplate restTemplate() {
    return new RestTemplate() {
        @Override
        public <T> T postForObject(String url, Object request, 
                                   Class<T> responseType) {
            String traceId = MDC.get("trace_id");
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Trace-ID", traceId);
            headers.set("X-Parent-Span", getCurrentSpanId());
            
            Tracer tracer = GlobalTracer.get();
            Span span = tracer.buildSpan("http_request")
                .asChildOf(tracer.activeSpan())
                .start();
            
            try (Scope scope = tracer.activateSpan(span)) {
                return super.postForObject(url, request, responseType);
            } finally {
                span.finish();
            }
        }
    };
}
```

3. Jaeger collects all spans:

┌──────────────────────────────────────────────────────┐
│ Trace: abc123xyz789  (Total: 340ms)                  │
├──────────────────────────────────────────────────────┤
│ ├─ API Gateway (0-50ms) [50ms]                       │
│ │  ├─ auth_check (0-10ms) [10ms]                     │
│ │  └─ rate_limit (10-15ms) [5ms]                     │
│ ├─ Order Service (50-100ms) [50ms]                   │
│ │  ├─ db_query (50-70ms) [20ms]                      │
│ │  └─ cache_check (70-100ms) [30ms] ← SLOW!          │
│ ├─ Payment Service (100-250ms) [150ms] ← SLOWEST!    │
│ │  └─ payment_gateway (100-250ms) [150ms]            │
│ ├─ Notification Service (250-340ms) [90ms]           │
│ └─ close_db_conn (340-340ms) [0ms]                   │
└──────────────────────────────────────────────────────┘

Result: Payment Service is bottleneck (150ms)
→ Scale payment service
→ Contact payment gateway provider about latency
```

**Benefits of distributed tracing**:
- Visualize full request journey
- Identify slowest service (optimize that first)
- Detect cascading delays
- Debug race conditions
- Estimate impact of service down

**Tools**: Jaeger, Lightstep, Datadog APM, AWS X-Ray
```

---

## Interview Scoring Rubric

Your HLD/Microservices answer on a scale of 0-10:

**0-3**: Incomplete or major flaws
- Missing requirements clarification
- No data volume estimates
- Single box design (monolith)
- No consideration of failure scenarios

**4-6**: Decent but room for improvement
- Clarified some requirements
- Basic service breakdown
- Addressed one scaling bottleneck
- Missing: caching, monitoring, specific tech choices

**7-8**: Good (likely hire)
- Clear requirement analysis with numbers
- Sensible service boundaries
- Addressed multiple scaling concerns
- Discussed tradeoffs (consistency vs latency)
- Mentioned monitoring and failure handling
- Coherent, defensible design

**9-10**: Excellent (strong hire)
- Everything above +
- Proactive about constraints (cost, team size)
- Discussed ops burden (not just "add Kubernetes")
- Mentioned specific technologies with justification
- Addressed hard problem (distributed transactions)
- Considered real-world complexity (upgrades, debugging)
- Ready to implement

## Implementation Order for Microservices

Start here ↓

1. **Monolith** (Week 1)
   All services in one binary
   Single database
   Simple to deploy

2. **Separate Database** (Week 3)
   Still one codebase, multiple schemas
   Services "own" their data

3. **API Boundaries** (Week 5)
   Extract service interfaces
   Internal REST calls
   Easier testing

4. **Independent Services** (Week 8)
   Separate repositories
   Independent deployment
   Own DevOps pipeline

5. **Message Queue** (Week 12)
   For non-critical flows
   Loose coupling
   Better scaling

6. **Service Mesh** (Week 20+)
   Only after 5+ services
   Complex monitoring needs
   Team mature enough

**Key**: Evolve slowly. Don't start at step 6.
