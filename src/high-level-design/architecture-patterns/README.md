# Architecture Patterns - System Design Guide

## 🏛️ Monolithic vs Microservices

### Monolithic Architecture

```
┌─────────────────────────────┐
│      Monolithic App         │
├─────────────────────────────┤
│ User | Order | Payment      │
│ Notification | Analytics    │
├─────────────────────────────┤
│     Single Database         │
└─────────────────────────────┘
```

**Pros**:
- Simple development & debugging (single codebase)
- ACID transactions across features
- Single deployment artifact
- Easier testing (no network mocking)
- Lower operational overhead

**Cons**:
- Tech lock-in (one language for everything)
- Scale entire app even if one feature needs resources
- Deployment risk (one bug breaks everything)
- Large team friction (merge conflicts, coordination)
- Hard to adopt new technologies
- Domain coupling increases with size

**When to Choose**: <5 engineers, simple domain, low scale requirements, startups

### Microservices Architecture

```
Client → API Gateway
          ├─→ User Service → User DB
          ├─→ Order Service → Order DB
          ├─→ Payment Service → Payment DB
          └─→ Notification Service → Queue
```

**Pros**:
- Independent scaling (only scale what's needed)
- Polyglot tech stacks (Java for payment, Node for API)
- Fast deployments (one service at a time)
- Technology updates per service
- Fault isolation (one service down ≠ everything down)
- Team autonomy (own service, own database)
- Easier to debug specific features

**Cons**:
- Distributed complexity (CAP theorem, eventual consistency)
- Network latency (microservices call each other over network)
- Data consistency challenges
- Hard debugging (trace across services)
- Operational overhead (deploy, monitor, scale multiple services)
- Duplicate code across services
- Testing complexity

**When to Choose**: >50 engineers, complex domains, different scaling needs, mature product

### Monolith to Microservices Migration Path

```
Stage 1: Modular Monolith
  └─ Single codebase but logically separated modules
    (easier to eventually migrate to microservices)

Stage 2: Strangler Fig Pattern
  └─ Extract one service at a time
  └ Monolith + extracted service coexist
  └ Gradually migrate traffic to new service
  └ Example: Extract Payment Service, route 10% traffic
       Monitor it → 50% → 100% → Remove from monolith

Stage 3: Full Microservices
  └─ All services independent
```

---

## 🔌 API Gateway Pattern

**Single Entry Point for All Clients** (Mobile, Web, Third-party APIs):

```
Request Flow:
Client → API Gateway → Route to Service → Response← API Gateway ← Client
```

**Responsibilities**:
1. **Routing**: Direct requests to correct microservice
2. **Authentication/Authorization**: JWT validation, rate limiting per user
3. **Request Transformation**: Convert REST to gRPC for internal calls
4. **Caching**: Cache frequently accessed data (reduce backend load)
5. **Rate Limiting**: Protect backend from overload (token bucket, leaky bucket)
6. **Load Balancing**: Distribute to multiple instances
7. **API Versioning**: Support /v1/, /v2/ endpoints
8. **Monitoring & Logging**: Central point to observe traffic
9. **Circuit Breaking**: Fail fast if service down

**Real-World Example: Netflix**:
```
External Client
    ↓
Netflix API Gateway
├─ Enforces 1000 req/sec limit per user
├─ Routes to Content Service (cached)
├─ Routes to Recommendation Service (high latency)
├─ Routes to Payment Service (critical)
├─ Fails over if service unhealthy
└─ Logs all traffic
```

**Technologies**: Kong, AWS API Gateway, Nginx, Spring Cloud Gateway, Traefik

**Pitfall**: API Gateway becomes bottleneck
- **Solution**: Horizontal scaling, dedicated instances per feature

---

## 📦 Event-Driven Architecture

**Services Communicate via Events** (Asynchronous, Loose Coupling):

```
Producer → Event Bus (Kafka/RabbitMQ) ← Consumer1 (reads independently)
                                       ← Consumer2 (reads independently)
                                       ← Consumer3 (reads independently)
```

**Real-World E-Commerce Example**:
```
Order Created Event:
  └─ Payment Service: Process payment
  └─ Inventory Service: Decrement stock
  └─ Notification Service: Send confirmation email
  └─ Analytics Service: Update metrics
  └─ Recommendation Service: Update user profile

All happen asynchronously!
If Analytics fails, Payment still succeeded
If Inventory fails, Order can be rolled back (compensating transaction)
```

**Pros**:
- **Loose Coupling**: Services don't know about each other
- **Async Processing**: Responses faster (don't wait for all services)
- **High Throughput**: All services process independently
- **Easy to Add**: New service just subscribes to events
- **Scaling**: Each consumer scales independently

**Cons**:
- **Eventual Consistency**: Data may be temporarily inconsistent
- **Complex Debugging**: Hard to trace what happened
- **Duplicate Handling**: Same event might be processed twice (need idempotency)
- **Event Schema Evolution**: Changing format breaks consumers
- **Ordering Issues**: Events might arrive out of order

**Implementation Pattern**:
```java
// Producer
eventBus.publish("order.created", {orderId: 123, userId: 456, amount: 100});

// Consumer 1 (Payment Service)
eventBus.subscribe("order.created", event -> {
    processPayment(event.userId, event.amount);
});

// Consumer 2 (Inventory Service)
eventBus.subscribe("order.created", event -> {
    decrementInventory(event.orderId);
});
```

---

## 📊 CQRS Pattern (Command Query Responsibility Segregation)

**Problem**: Same model optimized for reads and writes? Impossible!
- Reads want: denormalized, cached, optimized for queries
- Writes want: normalized, transactional, consistency

**Solution**: Use separate models for reads and writes

```
WRITE PATH:
User clicks "Place Order" (command)
  → Order Command → Command Handler
  → Validate & apply business logic
  → Write to Primary DB
  → Publish Event: OrderCreated
  → Response: "Order created" (206 Accepted)

READ PATH:
User clicks "View Orders" (query)
  → Read from Read Cache (Redis)
  → If miss: Read from Read DB (pre-computed, indexed)
  → Response to user (100ms vs 1s)

Sync:
Primary DB Event Stream → Update Read Cache & Read DB
  (Could be seconds or minutes delayed = eventual consistency)
```

**Real-World Example: E-Commerce**:
```
Write: POST /orders (to normalized Order, User, Item tables)
Read: GET /user/{id}/orders (from pre-computed cache with user details)

User details cached: ID, name, email (redundant, fast read)
Item details cached: ID, name, price (redundant, fast read)
Order details cached: ID, user details, items, total (all in one)
```

**Benefits**:
- Independent scaling (read and write servers separate)
- Optimize each path (reads get cache, writes get transactions)
- Different databases (write: PostgreSQL, read: Elasticsearch)
- Better performance (reads from cache, faster)

**Trade-off**: Eventual consistency (delay between write and read visibility)

---

## 📜 Event Sourcing

**Instead of storing current state, store all state changes as events**:

```
Traditional Database:
  User table: {id: 1, name: "John", email: "john@example.com", age: 25}
  (Overwrite happening, no history)

Event Sourcing:
  Event Store: [
    {timestamp: 1, event: "UserCreated", id: 1, name: "John"},
    {timestamp: 2, event: "EmailChanged", id: 1, email: "john@example.com"},
    {timestamp: 3, event: "AgeUpdated", id: 1, age: 25},
    {timestamp: 4, event: "AgeUpdated", id: 1, age: 26},  // Birthday!
  ]
```

**Rebuilding State**:
```
Get user as of timestamp 2: {id: 1, name: "John", email: "john@example.com"}
Get user as of now: {id: 1, name: "John", email: "john@example.com", age: 26}
Get user as of timestamp 3: {id: 1, name: "John", email: "john@example.com", age: 25}
```

**Benefits**:
- **Complete Audit Trail**: Who changed what and when
- **Temporal Queries**: Show data as it was on date X
- **Time-Travel Debugging**: Replay events to reproduce bugs
- **Event Replay**: Quickly rebuild state in new service
- **Scalability**: Only append operations (write-optimized)

**Challenges**:
- **Event Versioning**: Schema changes (UserCreated v1 vs v2)
- **Storage Grows**: Never delete events (immutable log)
- **Complexity**: Mental model shift from state to events
- **Consistency**: Need careful transaction handling

**When to Use**:
- Financial systems (audit trail critical)
- Gaming (replay to verify cheating)
- Collaborative tools (undo/redo)
- NOT recommended: Simple CRUD apps (overkill complexity)

---

## 🔄 Saga Pattern (Distributed Transactions)

**Problem**: How to handle multi-step transactions across services?
- Order Service calls Payment Service calls Shipping Service
- What if Payment fails after Inventory was reserved?

**Solution**: Saga Pattern with compensating transactions

```
Happy Path:
Step 1: Reserve Inventory (Order Service) → ✓ Success
Step 2: Process Payment (Payment Service) → ✓ Success
Step 3: Create Shipment (Shipping Service) → ✓ Success
→ Order complete!

Failure Path:
Step 1: Reserve Inventory → ✓ Success
Step 2: Process Payment → ✗ FAILED (card declined)
→ Compensating: Release Inventory Reservation
→ Order cancelled!
```

**Two Styles**:

**1. Choreography** (Services react to events):
```
Order Service publishes: OrderCreated
  ↓
Inventory Service reads event → Decrements stock → Publishes: StockDecremented
  ↓
Payment Service reads event → Charges card → Publishes: PaymentProcessed
  ↓
Shipping Service reads event → Publishes: ShipmentCreated
  
If Payment fails: Publishes: PaymentFailed
  ↓
Inventory Service reads → Publishes: StockReleased (compensating)
```

**Pros**: Decoupled, no central coordinator
**Cons**: Hard to track flow (happens everywhere), debugging nightmare

**2. Orchestration** (Saga Orchestrator directs):
```
Order Service creates Order
  ↓
Saga Orchestrator: "Step 1: Reserve inventory"
  → Inventory Service → Success → Saga records
  ↓
Saga Orchestrator: "Step 2: Process payment"
  → Payment Service → FAILS! → Saga sees failure
  ↓
Saga Orchestrator: "Compensate: Release inventory"
  → Inventory Service → Success
  ↓
Order marked as FAILED
```

**Pros**: Clear flow, easy to understand and debug
**Cons**: Central orchestrator (potential bottleneck)

**Real-World**: Uber's ride cancellation
```
User cancels ride in progress:
  1. Update ride status → CANCELLED
  2. Calculate refund amount
  3. Process refund to user (compensating)
  4. Add credit to driver (compensating)
  5. Update analytics
```

---

## 🎭 Circuit Breaker Pattern

**Problem**: Service A calls Service B which is failing (slow/down)
- Service A keeps retrying → Piles up requests → Service A also fails
- Cascading failure!

**Solution**: Circuit Breaker - Stop calling failing service & fail fast

```
STATE MACHINE:

CLOSED (normal): ━━━━━━━ normal requests go through
  ↓ (failures > threshold)
  
OPEN (failing): Request → Instant rejection (fast fail)
  ↓ (wait timeout)
  
HALF_OPEN (testing): Allow 1 request
  ├─ Success → back to CLOSED
  └─ Failure → back to OPEN

Parameters:
- Threshold: 50% of 20 requests fail → OPEN
- Timeout: Wait 60 seconds before HALF_OPEN
- Success count: 3 consecutive successes → CLOSED
```

**Real Implementation**:
```java
@CircuitBreaker(
    failureThreshold = 50,      // % failures
    failureWindow = 20,         // count of requests
    delay = 60000,              // 60 seconds before trying again
    successThreshold = 3        // successes to close
)
public PaymentResult chargeCard(CardDetails card) {
    return paymentService.charge(card);
}

// Usage - automatic!
try {
    PaymentResult result = chargeCard(card);  // Might throw CircuitBreakerOpenException
} catch (CircuitBreakerOpenException e) {
    // Service down, fail fast
    return orderFailed();
}
```

**Libraries**: Resilience4j, Hystrix (deprecated), Polly (C#)

---

## 📡 Bulkhead Pattern (Resource Isolation)

**Problem**: Poor performing service uses all thread pool → everyone starves

```
Without Bulkhead:
├─ Thread Pool: 100 threads
  ├─ Service A (slow): Uses 99 threads (blocked waiting)
  └─ Service B (normal): Uses 1 thread (starves!)

With Bulkhead:
├─ Thread Pool A: 50 threads
├─ Thread Pool B: 50 threads
  → Service A problems don't affect B
```

**Real-World Example**:
```
Video Service: Reserve 40 threads (video upload is CPU heavy)
Search Service: Reserve 30 threads (fast)
Payment Service: Reserve 30 threads (critical, can't starve)

→ Video upload hangs, doesn't affect payment!
```

---

## ⚖️ Load Balancing Strategies

| Strategy | How | Best For | Drawback |
|----------|-----|----------|----------|
| **Round Robin** | Rotate through servers | Simple, equal work | Ignores server capacity |
| **Least Connections** | Send to server with fewest active | Variable load | Tracking overhead |
| **Weighted** | Multi-server, weighted by capacity | Mixed hardware | Manual tuning |
| **IP Hash** | Same IP → same server | Session persistence | Uneven distribution |
| **Resource-Based** | Send to least CPU/memory | Heterogeneous loads | Most complex |

**Example - Weighted Round Robin**:
```
Server A: 50% ($expensive, 8 cores)
Server B: 30% ($medium, 4 cores)
Server C: 20% ($cheap, 2 cores)

Request 1 → A
Request 2 → A
Request 3 → B
Request 4 → B
Request 5 → A
Request 6 → C
(Repeat)
```

---

## 🎯 Integration: Real-World Architecture

**Uber-Like Ride Sharing Service**:
```
User/Driver ← Mobile App ← API Gateway
                              ├─ Uses Circuit Breaker to Payment Service
                              ├─ Uses Rate Limiting (1000 requests/user/min)
                              ├─ Uses Caching for map tiles
                              └─ Publishes Events:
                                  ├─ RideRequested (Matching service listens)
                                  ├─ RideStarted (Billing listens)
                                  ├─ RideEnded (Analytics, Billing listens)

CQRS:
- WRITE: Calculate fare (needs precision)
- READ: Show recent rides (cache denormalized, fast)

Saga for Cancellation:
- User cancels → Order Service marks CANCELLED
  → Compensate: Update driver (not paid full)
  → Compensate: Refund user
  → Compensate: Update analytics
```

---

## 📋 Interview Checklist

### Decision Making
- [ ] When to choose monolith vs microservices
- [ ] Boundaries for microservices (by feature, by domain)
- [ ] Polyglot persistence (different DBs for different services)
- [ ] API versioning strategy
- [ ] Rate limiting tiers (free tier limits)

### Resilience
- [ ] Circuit breaker vs retry logic
- [ ] Bulkhead for resource isolation
- [ ] Timeout configurations (why important)
- [ ] Fallback strategies (graceful degradation)
- [ ] Health checks (liveness vs readiness)

### Asynchronous Processing
- [ ] Event-driven vs request-response trade-offs
- [ ] Exactly-once vs at-least-once semantics
- [ ] Dead letter queues for failed events
- [ ] Idempotency for duplicate events

### Data & Consistency
- [ ] CAP theorem in distributed systems
- [ ] Eventual consistency implications
- [ ] Saga for distributed transactions
- [ ] CQRS for read/write optimization
- [ ] Event sourcing when appropriate

### Operational
- [ ] Monitoring across services (observability)
- [ ] Distributed tracing (Jaeger, Zipkin)
- [ ] Log aggregation (ELK stack)
- [ ] Alerting strategies
- [ ] Deployment strategies (blue-green, canary)

---

## 🚀 Key Takeaways

1. **Start Monolith, evolve to Microservices** when complexity demands
2. **API Gateway** is critical interface in distributed systems
3. **Eventual Consistency** is a trade-off in microservices
4. **Circuit Breaker** prevents cascading failures
5. **Saga Pattern** handles distributed transactions
6. **Event-Driven** enables loose coupling
7. **CQRS** optimizes reads and writes separately
8. **Bulkhead** isolates resources
9. **Load Balancing** distributes work fairly
10. **Resilience Patterns** make systems reliable at scale
