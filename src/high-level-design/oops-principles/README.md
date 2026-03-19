# OOP Principles in System Design & Architecture

## Overview

When scaling from code to systems, OOP principles become **architectural principles**. Master how SOLID scales to microservices, distributed systems, and large-scale applications.

---

## 🏛️ Single Responsibility at System Level

### Definition: Each Service Has One Reason to Change

**Monolith Anti-Pattern** ❌:
```
User Service (Admin)
├─ User authentication
├─ User profile management
├─ Email notifications
├─ Billing & payments
├─ Reporting & analytics
└─ Admin dashboard

Problem: Change to payment processing = restart entire service!
```

**Microservices Pattern** ✅:
```
Auth Service (only authentication)
├─ JWT generation
├─ OAuth integration
├─ Password management
└─ Reason to change: Authentication requirements change

User Service (only user data)
├─ Profile management
├─ User metadata
└─ Reason to change: User schema changes

Payment Service (only billing)
├─ Payment processing
├─ Invoice generation
├─ Refunds
└─ Reason to change: Payment processing requirements

Notification Service (only notifications)
├─ Email delivery
├─ SMS delivery
├─ Push notifications
└─ Reason to change: notification channels change

Analytics Service (only reporting)
├─ Data aggregation
├─ Dashboard generation
└─ Reason to change: reporting requirements
```

**System Design Benefits**:
- **Independent Scaling**: Payment Service gets more traffic? Scale only that
- **Independent Deployment**: Update Auth Service without affecting User Service
- **Technology Freedom**: Each service uses best tool (Auth: Node.js, Payment: Java, Analytics: Python)
- **Failure Isolation**: Payment Service down? Auth Service still works

### Real-World Example: Netflix Architecture

Netflix decomposed monolith into:
- **Account Service**: Login, subscription management
- **Catalog Service**: Movie/show metadata
- **Streaming Service**: Video delivery
- **Recommendation Service**: ML-based suggestions
- **Billing Service**: Payment processing
- **Content Service**: Upload, encoding, storage

Each can:
- Scale independently (Streaming gets 100x traffic on Friday nights)
- Deploy independently (Update recommendation algorithm ≠ restart everything)
- Use different technologies (Catalog uses Elasticsearch, Streaming uses custom video server)
- Fail independently (Recommendation down ≠ can't watch Netflix)

---

## 🔄 Open/Closed at Architecture Level

### Definition: System Open for Extension, Closed for Modification

**Tightly Coupled Architecture** ❌:
```
Mobile App → monolith.example.com/api
Web App → monolith.example.com/api
IoT Device → monolith.example.com/api
Third-party partner → ???

Adding new channel = modify monolith!
```

**API Gateway Pattern** ✅:
```
Mobile App ──┐
Web App ─────┼──→ API Gateway ──→ Auth Service
IoT Device ──┤   (Single entry)    User Service
Partner API ─┘                      Payment Service
                                    Notification Service

Adding new consumer = just call API Gateway
No changes to backend services!
```

**Plugin Architecture Example**:
```
E-commerce Platform
├─ Core Service (orders, products, users)
├─ Payment Plugin (Stripe, PayPal, Square)
├─ Shipping Plugin (FedEx, UPS, DHL)
├─ Notification Plugin (Email, SMS, Push)
└─ Tax Plugin (Sales tax, VAT, GST)

New payment processor = new plugin, no core changes!
New shipping provider = new plugin, no core changes!
```

**Real-World: Slack Integrations**

Slack core doesn't change for each integration:
- GitHub integration exists
- Jira integration exists
- Datadog integration exists
- Custom integrations via webhooks exist

Adding integration = just register webhook, no Slack code change!

**System Benefits**:
- Scale horizontally: add services without modifying core
- Partner integrations: plug in without monolith changes
- Feature flags: extend behavior without deployment
- A/B testing: run variants without code changes

---

## 📋 Liskov Substitution at Service Level

### Definition: Any Implementation of Contract Must Behave Identically

**Violation Example** ❌:
```
Interface: Database
├─ MySQL: 100ms latency, strong ACID
├─ MongoDB: 50ms latency, eventual consistency
└─ s3: 200ms latency, object storage

Service expects: ACID compliance
Uses MongoDB: Transactions fail silently!

Problem: Can't substitute MongoDB for MySQL
Result: Data corruption under load
```

**Correct Substitution** ✅:
```
Interface: RelationalDatabase
├─ MySQL: ACID transactions, strong consistency
└─ PostgreSQL: ACID transactions, strong consistency

Service expects: ACID compliance
Both implementations satisfy contract!
Can substitute freely without behavior change.

Separate Interface: DocumentDatabase  
├─ MongoDB: Eventually consistent
└─ DynamoDB: Eventually consistent

Service expecting consistency uses RelationalDatabase
Service handling eventual consistency uses DocumentDatabase
```

**Real-World: Cache Layer Substitution**

```
Interface: Cache
├─ Redis: In-memory, milliseconds
├─ Memcached: In-memory, milliseconds
└─ Infinispan: In-memory, milliseconds

All implement: get(), set(), delete(), TTL

Service doesn't care which - LSP satisfied!

Adding CDN as cache:
❌ Wrong: CDN has different semantics (HTTP caching)
✅ Right: Create separate Interface: EdgeCache
```

**System Benefits**:
- Easy failover: swap Redis → Memcached if Redis down
- Easy migration: gradually move from MySQL → PostgreSQL
- Consistent testing: mock implements same interface as real DB
- Cloud portability: swap AWS services ↔ GCP services

### Database Substitution Pattern

```
Interface: UserRepository
├─ MySQLUserRepository: ACID, strongly consistent
├─ PostgresUserRepository: ACID, strongly consistent
└─ CassandraUserRepository: Eventually consistent

Service code:
```java
class UserService {
  private UserRepository repo;
  
  public UserService(UserRepository repository) {
    this.repo = repository;  // Accept any implementation
  }
  
  public User getUser(UUID id) {
    return repo.findById(id);
  }
}
```

All three can substitute without changing UserService!
```

---

## 🔌 Interface Segregation at Ecosystem Level

### Definition: Services Only Depend on Operations They Actually Use

**Violation Example** ❌:
```
Giant Cloud Provider Interface:
├─ Compute (EC2, Lambda, App Engine)
├─ Storage (S3, Blob Storage)
├─ Database (RDS, Firestore)
├─ Networking (VPC, CDN)
├─ Machine Learning (SageMaker)
├─ Mobile Backend (Amplify)
└─ Analytics (BigQuery)

Small startup building chat app:
- Uses only: Compute, Storage
- Depends on: Entire cloud ecosystem
- Problem: Vendor lock-in, complexity, cost

Want to migrate to different cloud?
- Need to replace ALL services
```

**Segregated Interfaces** ✅:
```
Application only depends on what it uses:

ComputeService interface
├─ EC2 implementation
├─ Google Compute Engine impl
└─ Azure VM impl

StorageService interface
├─ S3 implementation
├─ Google Cloud Storage impl
└─ Azure Blob Storage impl

DatabaseService interface
├─ RDS implementation
├─ Cloud SQL implementation
└─ Azure Database impl

Chat app depends only on:
- ComputeService
- StorageService
- DatabaseService

Can switch cloud providers without changing application!
```

**Real-World: Kubernetes ISP**

Kubernetes provides segregated interfaces:
- **Compute Interface**: Pod abstraction (run on AWS, GCP, Azure)
- **Storage Interface**: PersistentVolume (plug in EBS, GCP Disk, Azure Disk)
- **Networking Interface**: Service (Load balancer from any cloud)
- **Registry Interface**: Container registry (Docker Hub, GCR, ACR)

Application depends only on what it needs:
- Deployment uses Compute Interface
- Can add PersistentVolume interface if needed storage
- Service for networking if needed

**System Benefits**:
- **Cloud portability**: Don't lock into one provider
- **Ecosystem flexibility**: Use best-of-breed services
- **Cost optimization**: Choose cheapest provider for each need
- **Migration simplicity**: Switch piece-by-piece, not all-at-once

---

## ⬆️ Dependency Inversion at Infrastructure Level

### Definition: High-Level Logic Depends on Abstractions, Not Infrastructure

**Violation Example** ❌ (Tightly Coupled):
```
Business Logic Layer
  ↓ (Depends on)
  ↓
Data Access Layer (directly uses)
  ↓
  MySQLDatabase (concrete DB)
  
Problem: Business logic knows about MySQL
- Query syntax leaks into business logic
- Can't test without MySQL
- Migration mandatory step: update business logic
```

**Correct Inversion** ✅ (Loosely Coupled):
```
Business Logic Layer
  ↓ (Depends on)
  ↓
Repository Interface (abstraction)
  ↓ (Depends on)
  ↓
Data Access Layer
  ├─ MySQLRepository implementation
  ├─ PostgresRepository implementation  
  ├─ MongoRepository implementation
  └─ InMemoryRepository (for testing)

Benefit: Business logic depends on abstraction
- Infrastructure interchangeable
- Test with in-memory repository, prod with MySQL
- Migrate database: update implementation, not business logic
```

### Real-World: Spring Boot Dependency Injection

```java
// Business Logic depends on interface
@Service
public class OrderService {
  private final OrderRepository repository;
  
  // DIP: Inject abstraction
  @Autowired
  public OrderService(OrderRepository repository) {
    this.repository = repository;  // Don't know concrete type!
  }
  
  public Order createOrder(OrderDTO dto) {
    Order order = mapper.toEntity(dto);
    return repository.save(order);  // Works with any repository
  }
}

// Production: SQL implementation
@Repository
public class SQLOrderRepository implements OrderRepository {
  @Override
  public Order save(Order order) {
    // SQL logic
  }
}

// Testing: In-memory implementation
public class InMemoryOrderRepository implements OrderRepository {
  private Map<UUID, Order> store = new HashMap<>();
  
  @Override
  public Order save(Order order) {
    store.put(order.getId(), order);
    return order;
  }
}

// Test with in-memory, prod with SQL - OrderService unchanged!
```

### API Consumer Pattern

```
Third-party integrations depend on API contract:

Stripe Payment API
├─ Contract: POST /payments, GET /payments/{id}, DELETE /payments/{id}
├─ Stripe implementation (AWS, GCP internally)
├─ Adyen implementation
├─ Square implementation
└─ Custom implementation

Payment Service abstraction:
```java
interface PaymentGateway {
  PaymentResponse createPayment(PaymentRequest req);
  PaymentResponse getPayment(String id);
  PaymentResponse refundPayment(String id);
}

class StripeGateway implements PaymentGateway { }
class AdyenGateway implements PaymentGateway { }
```

Your service depends on PaymentGateway interface!
```

**System Benefits**:
- **Technology independence**: Core logic independent of database, message queue, API provider
- **Testability**: Inject mocks, not real services
- **Loose coupling**: Services don't know implementation details
- **Flexibility**: Swap implementations based on scale, cost, geography

---

## 🔗 Applying SOLID to Microservices

### Example: E-Commerce Platform Evolution

**Stage 1: Single Responsibility (SRP)**
```
Monolith ❌
├─ User management
├─ Product catalog
├─ Order processing
├─ Payment
├─ Shipping
└─ Notifications

↓ Decompose by responsibility

Microservices ✅
├─ User Service: Only user auth, profile
├─ Product Service: Only product catalog
├─ Order Service: Only order logic
├─ Payment Service: Only payment processing
├─ Shipping Service: Only shipping logic
├─ Notification Service: Only notifications
└─ Each service: ONE reason to change
```

**Stage 2: Open/Closed (OCP)**
```
API Gateway pattern:
┌─────────────────┐
│  Mobile App     │
│  Web App        │ ──→ API Gateway
│  Partner API    │     (Single entry point)
│  Admin Portal   │
└─────────────────┘
         ↓
Add new consumer = register with gateway
No backend service changes!
```

**Stage 3: Liskov Substitution (LSP)**
```
Database layer:
Interface: Database
├─ MySQL (prod): Strong consistency
├─ PostgreSQL (failover): Strong consistency
├─ Redis (cache): Fast reads

Each service can substitute database without changing logic!

Order Service can work with:
- Primary: MySQL for strong ACID
- Failover: PostgreSQL maintains consistency
- Cache layer: Redis for reads
```

**Stage 4: Interface Segregation (ISP)**
```
Each service exports ONLY what others need:

User Service exports:
├─ GET /users/{id} - User info
├─ POST /auth/login - Authentication
└─ Doesn't export: Password hashes, internal state

Other services depend only on these endpoints!
```

**Stage 5: Dependency Inversion (DIP)**
```
Services communicate via contracts:

Order Service depends on PaymentGateway interface
├─ Production: StripePaymentGateway
├─ Test: MockPaymentGateway
└─ Future: AdyenPaymentGateway

Order Service code never changes with payment provider!
```

---

## 📊 Event-Driven Architecture (DIP at Scale)

### Problem: Tightly Coupled Services
```
Order Service → calls → Payment Service → Notification Service
                             ↓
                        If Payment fails, who notifies?
                        
If Notification Service slow:
- Payment Service waits → Order Service waits → User waits
- Cascade failure!
```

### Solution: Event Bus (DIP)
```
Order Service publishes: "OrderCreated" event
    ↓
Event Bus (Message Queue: Kafka, RabbitMQ, SQS)
    ↓
    ├─ Payment Service subscribes: processes payment
    ├─ Notification Service subscribes: sends email
    └─ Analytics Service subscribes: records metrics

Benefits:
- Services don't know each other (loose coupling)
- Asynchronous (no cascade failures)
- Scale independently (Payment backlog ≠ affects Orders)
- Add consumer (new Analytics source) without changes
```

**Real-World Code**:
```java
// Order Service publishes event
@Service
class OrderService {
  private final EventPublisher eventBus;
  
  public Order createOrder(OrderDTO dto) {
    Order order = mapper.toEntity(dto);
    repository.save(order);
    
    // Depends on abstraction (EventPublisher), not concrete queue!
    eventBus.publish(new OrderCreatedEvent(order.getId()));
    return order;
  }
}

// Payment Service subscribes
@Service
class PaymentService {
  @Subscribe
  public void onOrderCreated(OrderCreatedEvent event) {
    processPaymentForOrder(event.getOrderId());
  }
}

// Notification Service subscribes
@Service
class NotificationService {
  @Subscribe
  public void onOrderCreated(OrderCreatedEvent event) {
    sendOrderConfirmationEmail(event.getOrderId());
  }
}

// Integration service can be added without touching Order/Payment
@Service
class AnalyticsService {
  @Subscribe
  public void onOrderCreated(OrderCreatedEvent event) {
    recordOrderMetric(event);
  }
}
```

---

## 🎯 Design Patterns for SOLID at Scale

| Pattern | SOLID Principle | Problem Solved | Use When |
|---------|-----------------|----------------|----------|
| **Saga** | DIP | Distributed transactions across services | Multi-service operations (payment → shipping → notification) |
| **CQRS** | SRP | Read/write separation | Heavy reads vs writes (read 1000x more) |
| **Event Sourcing** | OCP, LSP | Event history is immutable | Need audit trail, time-travel debugging |
| **API Gateway** | OCP | Single entry point | Multiple consumers (mobile, web, partners) |
| **Circuit Breaker** | LSP | Graceful failure | Call external services that might fail |
| **Bulkhead** | SRP | Failure isolation | Prevent cascade failures across services |
| **Cache-Aside** | DIP | Performance without domain logic change | Frequent reads, slow data source |

---

## 🚀 Real-World: Uber Architecture

How Uber applies SOLID principles:

**SRP**: Each service owns domain
- Rider Service: Rides, ratings
- Driver Service: Drivers, documents
- Payment Service: Charging, payouts
- Maps Service: Geo, routing
- Notification Service: SMS, push

**OCP**: Plugins for providers
- Payment: Stripe, Apple Pay, Google Pay
- SMS: Twilio, AWS SNS
- Maps: Google Maps, OpenStreetMap

**LSP**: Database abstraction
- Primary: MySQL
- Cache: Redis
- Search: Elasticsearch
- Message Queue: Kafka

**ISP**: Minimal API contracts
- Rider Service exposes: rider info, preferences
- Driver Service exposes: driver info, location
- Payment Service exposes: charge, refund (not internal state)

**DIP**: Event-driven communication
- Services publish events
- Consumers subscribe
- No direct service calls (except through API gateway)

---

## 🏢 Enterprise Architecture for Senior Engineers (2026)

### Advanced Design by Contract

**Beyond OOP Contracts - System Contracts**:

```
Traditional Contract (Method Level):
public interface UserDAO {
    User getById(String id) throws UserNotFoundException;
}

SLA Contract (System Level):
Service: User Service
Precondition: Valid user ID, service online
Postcondition: Return user object within 100ms
Invariant: User data consistency maintained
Failure Mode: Return 503 Service Unavailable within 50ms
```

**Contract-Driven Architecture**:
```
Services publish their contracts:
- Payment Service: Process payment in <5s, exactly-once guarantee
- Auth Service: Token validation in <10ms, 99.99% uptime
- Email Service: Deliver email in <1 minute, eventual consistency
- Cache Service: Query in <5ms, invalidation within 10s

Clients depend on contracts, not implementations!
```

### Distributed System Trade-offs (CAP & Beyond)

**CAP Theorem at 2026 Scale**:
```
Most systems: Choose 2 of 3
- Consistency (C)
- Availability (A)
- Partition tolerance (P)

2026 Reality:
Partitions are NOT optional - they happen!
Real choice: Consistency vs Availability when partitions occur

Architecture Decision:
- Payment/Billing: CP (consistency over availability, short timeouts)
- Social Feed: AP (availability over consistency, eventual updates)
- User Profile: AP (eventual consistency acceptable)
- Inventory: AP with compensating transactions
```

**Beyond CAP: PACELC Theorem**:
```
PAC: In Partition (mentioned above)
ELC: Else (no partition), choose Latency vs Consistency

Payment Service:
- Partition: CP (consistency + abort transactions)
- Normal: CL (consistency, but adds latency)
- Trade-off: Accept 500ms latency for strong consistency

Social Feed:
- Partition: AP (accept stale data)
- Normal: AL (serve immediately, consistency eventually)
- Trade-off: Always favor latency
```

### Handling Distributed Transactions (Senior Expectation)

**Problem: Two-Phase Commit Doesn't Scale**

❌ 2PC (blocks, slow, fails with network partition):
```java
Transaction {
    begin()
    payment.debit(100)           // Locks account
    inventory.decrementStock()   // Locks inventory
    commit() or rollback()       // All or nothing
}
// Problem: If payment locked for 10s, inventory locked too!
// Harms throughput, fails if any service unreachable
```

✅ **Saga Pattern** (compensating transactions):
```
Order Saga:
1. Payment Service: charge card
   ↓ Success: emit OrderPaid event
2. Inventory Service: decrement stock
   ↓ Success: emit StockDecremented event
3. Shipping Service: create shipment
   ↓ Success: emit ShipmentCreated event

If step fails:
Inventory fails → Payment Compensation: refund card
Shipping fails → Payment + Inventory Compensation: refund + restore stock

Characteristics:
- Each step is asynchronous
- No global lock
- Eventual consistency
- Complex error handling but better throughput
```

**Idempotency (Critical for distributed systems)**:
```
Problem: Network retry = duplicate request
Order Service receives: POST /orders {user_id: 123, amount: 100}
→ Creates order, calls Payment Service
→ Network timeout
→ Retry: Payment Service called twice, charged twice!

Solution: Idempotency Keys
Request headers: Idempotency-Key: unique-uuid

Payment Service:
if (redisCache.exists(idempotencyKey)) {
    return previousResult;  // Cached response
}
result = processPayment();
redisCache.set(idempotencyKey, result);  // Cache for 24 hours
return result;

Ensures: Multiple requests with same key = same result
```

### Advanced Resilience Patterns

**Circuit Breaker Strategy** (Beyond basics):
```
Client → Dependency Service

States:
1. CLOSED (working):
   - Normal operation
   - Count failures
   - Track response time

2. OPEN (failing):
   - Immediately reject calls
   - Prevent cascade failure
   - Saves dependent service

3. HALF_OPEN (recovery):
   - Allow sample requests
   - If succeed → CLOSED
   - If fail → OPEN again

Tuning Parameters:
- Failure threshold: 50% of 20 requests = open
- Timeout: 60 seconds until half-open
- Success threshold: 5 consecutive successes = close

Code Example:
@Service
public class PaymentClient {
    @CircuitBreaker(
        failureThreshold = 50,
        delay = 60000,  // 60s before half-open
        successThreshold = 5
    )
    public PaymentResult charge(ChargeRequest req) {
        return paymentService.charge(req);
    }
}
```

**Rate Limiting & Backpressure** (Outages prevention):
```
Scenario: Black Friday, 1000 requests/second to Payment Service

No rate limit:
→ All 1000 requests pile up
→ Queue fills memory
→ Service crashes
→ Cascades to other services

Token Bucket Algorithm:
Capacity: 100 tokens
Refill: 10 tokens/second

Request arrives:
- If tokens available: consume 1 token, allow request
- If no tokens: reject with 429 Too Many Requests

Client gets 429 → backs off → recovery

Server can handle: 10 requests/second sustainable
Burst capacity: 100 fast requests, then back off

Configuration:
paymentService.rateLimit = 100 tokens, 10 tokens/second
```

### Service Mesh & Observability (2026 Standard)

**Service Mesh (Istio/Linkerd) - Network Layer**:
```
Without Service Mesh:
Each service implements:
- Retries
- Timeouts
- Circuit breaker
- Load balancing
- mTLS security
→ Duplication, consistency issues

With Service Mesh:
Services connect via sidecar proxies (Envoy)
Mesh handles:
- Service discovery
- Load balancing
- Retries (configurable)
- Traffic routing (canary, blue-green)
- Security (mTLS by default)
- Metrics collection

Single source of truth for resilience policies!
```

**Four Golden Signals** (Observability):
```
1. Latency
   - P50, P95, P99
   - Alert if P99 > 200ms
   - Threshold depends on SLA

2. Traffic
   - Requests per second
   - Helps capacity planning
   - Alert if abnormally high/low

3. Errors
   - Error rate (%)
   - Error types
   - Alert if error rate > 1%

4. Saturation
   - CPU usage
   - Memory usage
   - Disk I/O
   - Alert if > 80%

Implementation:
- Prometheus: Metrics
- Grafana: Visualization
- Jaeger: Distributed Tracing
- ELK Stack: Logging
```

### Data Strategy for Senior Engineers

**Polyglot Persistence** (Right tool per use case):
```
Modern architecture:
├─ Relational (PostgreSQL): User profiles, financial data
├─ Cache (Redis): Sessions, leaderboards
├─ Search (Elasticsearch): Product search, logs
├─ Document (MongoDB): User preferences, flexible schema
├─ Column Store (Cassandra): Time-series data, analytics
├─ Graph (Neo4j): Recommendations, social networks
└─ Blob (S3): Images, videos, documents

Monolith mistake: Everything in MySQL
Multi-store wisdom: Choose per data pattern
```

**CQRS (Command Query Responsibility Segregation)**:
```
Traditional:
Single model → Insert/Update → Same model ← Query

Problems:
- Write and read patterns different
- Write optimized for inserts, read optimized for queries
- Can't optimize for both

CQRS:
Command (Write) → Event Store → Projections (Read Models)

Example: Order System
WRITE:
app.placeOrder(userID, items)
→ Writes to Event Store: "OrderPlaced" event
→ Eventual consistency

READ:
Multiple read models:
- OrderByID: Fast lookup by ID
- OrdersByUser: Fast lookup by user
- PopularItems: Count by item
- UserSpending: Sum by user

Each read model optimized for its query!
```

---

## 📋 Interview Checklist - OOP at System Scale

### Understanding
- [ ] How SRP applies to microservices (each service one reason)
- [ ] How OCP enables extensibility (plugins, new providers)
- [ ] How LSP enables database/service substitution
- [ ] How ISP creates clean contracts
- [ ] How DIP enables loose coupling via event buses

### Architecture Decisions
- [ ] When to break into microservices (SRP violation in monolith)
- [ ] API Gateway pattern (OCP)
- [ ] Event-driven vs request-response (DIP)
- [ ] Database per service pattern (SRP, LSP)
- [ ] Saga pattern for distributed transactions (LSP)

### Real-World Trade-offs
- [ ] Complexity: microservices harder than monolith
- [ ] Consistency: eventual vs strong (LSP implication)
- [ ] Debugging: distributed tracing needed
- [ ] Deployment: more services = more moving parts
- [ ] When monolith is better (startup, simple apps)

### Technical Patterns
- [ ] API Gateway for single entry point
- [ ] Event Bus (Kafka, RabbitMQ) for async
- [ ] Service Mesh (Istio) for networking
- [ ] Circuit Breaker for resilience
- [ ] CQRS for read/write separation

---

## 🎓 Key Takeaways

1. **Microservices**: Practical application of SRP at scale
2. **API Gateway**: Implements OCP at system level
3. **Abstraction Layers**: Enable LSP (database, cache, API provider substitution)
4. **Event-Driven**: Implements DIP with message queues
5. **Contracts Over Implementation**: Design by interface specification
6. **Eventual Consistency**: LSP implication for distributed systems
7. **Service Mesh**: Manages cross-service communication
8. **Observability**: Essential for debugging (logging, metrics, traces)
9. **Context: Scale**: SOLID becomes critical at scale (100+ services)
10. **Remember**: SOLID doesn't force microservices; start monolith, break apart when needed
