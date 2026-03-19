# Message Queues & Event Streaming Systems

## Overview

Message queues are the backbone of distributed systems, enabling asynchronous communication, scalability, and resilience. They appear in 20-25% of SDE 3 system design interviews and are essential knowledge for building production systems.

### Why Message Queues Matter
- **Decoupling**: Producers and consumers operate independently
- **Scalability**: Process messages at variable rates without tight coupling
- **Reliability**: Persist messages, ensure delivery guarantees
- **Real-world criticality**: Kafka handles 1+ trillion messages daily across tech companies
- **Interview focus**: Companies like Uber, Netflix, LinkedIn all built on message queues

## Core Concepts

### Message Queue vs Event Stream

| Aspect | Message Queue | Event Stream |
|--------|---------------|--------------|
| **Message Retention** | Short (hours/days) | Long (weeks/months) |
| **Access Pattern** | Deque—consume once | Stream—replay, reprocess |
| **Consumption** | Typically serial | Parallel from any offset |
| **Use Case** | Tasks, RPC replacement | Analytics, event sourcing |
| **Examples** | RabbitMQ, SQS | Kafka, Kinesis |

**Interview Note**: Distinction matters. Modern architectures increasingly use "event streaming" (Kafka-style) for both patterns due to flexibility.

## Message Delivery Guarantees

### At-Most-Once (Fire and Forget)
- **Semantics**: Message delivered 0 or 1 time
- **Failure Mode**: Message may be lost after producer sends
- **Latency**: Fastest (no acknowledgment required)
- **Use Case**: Non-critical events (analytics, logging)

**Implementation**:
```
Producer sends → Message in queue → Consumer processes
No retries on failure
```

**When to use**: Metrics, non-critical logging, performance-critical applications

### At-Least-Once (With Retries)
- **Semantics**: Message delivered 1 or more times
- **Failure Mode**: Duplicate messages on producer/consumer failure
- **Latency**: Moderate (acks required, may retry)
- **Use Case**: Most practical systems, requires idempotent consumers

**Implementation**:
```
Producer → Message → Broker ack → Consumer processes → Consumer ack
If consumer fails: Broker retries → Consumer processes again (possible duplicate)
```

**Consumer Idempotency Pattern**:
```
Process message with unique message_id
Store processed message_ids in deduplication store
If message_id seen before → skip processing, return success
```

**Complexity**: O(lookup time) in deduplication store, typically O(1) with hash table

### Exactly-Once (Complex)
- **Semantics**: Message delivered exactly once
- **Failure Mode**: None (theoretically)
- **Latency**: Slowest (requires coordination)
- **Use Case**: Financial transactions, critical operations

**Implementation Approaches**:

**1. Distributed Transactions (2-Phase Commit)**
```
Phase 1 (Prepare):
- Producer: Save message + mark as "prepared"
- Broker: Receive + acknowledge

Phase 2 (Commit):
- Producer: Commit message
- Broker: Confirm visibility to consumers

Failure: Either roll back both or complete both
```
**Problem**: Blocks resources during prepare phase; slower

**2. Idempotent Producer + Deduplication**
```
Producer assigns unique ID per message
Broker deduplicates within [dedup window]
Consumer deduplicates (offset tracking ensures ordering)
Result: Exactly-once from consumer perspective
```
**Advantage**: Non-blocking; scales better

**3. Transactional Writes**
```
Write to message queue + write to database in same transaction
Broker ensures atomicity across both
```
**Challenge**: Requires broker-database coordination

**Interview Answer**: 
- Most systems tolerate at-least-once + idempotent consumers
- True exactly-once requires either transactions (slow) or idempotent design (practical)
- Kafka supports transactional writes for exactly-once semantics

## RabbitMQ: Traditional Message Queue

### Architecture

```
Producer → Exchange → Routing Key → Queue → Consumer
```

### Exchange Types

**Direct**:
- Routes to queues matching exact routing key
- 1:1 mapping for tasks, RPC

**Fanout**:
- Routes to all bound queues
- Broadcast pattern

**Topic**:
- Routes based on pattern matching with wildcards (#=multi-word, *=single-word)
- Flexible pub-sub

**Headers**:
- Routes based on message headers
- Complex routing logic

### Queue Characteristics
- **Durability**: Can survive broker restarts (durable queues)
- **Message TTL**: Auto-delete messages after TTL or keep indefinitely
- **Dead Letter Queue (DLQ)**: Route rejected messages for debugging

### RabbitMQ Use Cases
✅ Task queues (worker pool pattern)
✅ RPC over message queue
✅ Scheduled job distribution
❌ High-throughput event streaming
❌ Real-time analytics pipelines

### RabbitMQ Scaling Challenges
- Disk I/O limited (messages go to disk for persistence)
- Queue master bottleneck in clusters
- Not designed for replay/reprocessing patterns

## Kafka: Modern Event Streaming

### Architecture

```
Topic (log structure)
├── Partition 0: [M0, M1, M2, ...] ← Leader (primary)
├── Partition 1: [M0, M1, ...] ← Follower replicas
└── Partition 2: [M0, ...] ← Follower replicas

Producer chooses partition → Broker writes to log → Consumers read from offset
```

### Why Kafka is Different

**1. Log-Based Storage**
- Append-only log of immutable messages
- Consumers read from offset, can rewind to past
- Enables replay, debugging, new subscribers

**2. Partitioning for Parallelism**
- Topic split into P partitions for parallel processing
- Each partition consumed by one consumer (in group)
- Consumer group distributes partitions among members

**3. Durability & Replication**
```
Replication Factor = 3 means:
- Message written to leader
- Replicated to 2 follower brokers asynchronously
- Broker failure tolerates 2 failures (RF-1)
- Stronger consistency with in-sync replicas (ISR)
```

**4. Consumer Groups for Scalability**
```
Topic with 6 partitions
Consumer Group A: 3 consumers → Each handles 2 partitions (parallel)
Consumer Group B: 2 consumers → Each handles 3 partitions (different app)

Same topic, different consumption patterns
```

### Key Configurations

**Producer Side**:
- `acks=0`: Fire and forget (at-most-once)
- `acks=1`: Leader ack (at-least-once)
- `acks=all`: All ISR ack (strong durability, slower)
- `retries`: Automatic retry on failure
- `idempotence`: Enabled by default in recent versions (exactly-once)

**Broker Side**:
- `replication.factor`: Durability
- `min.insync.replicas`: Consistency guarantee
- `log.retention.ms`: Message retention window

**Consumer Side**:
- `fetch.min.bytes`: Batch efficiency
- `session.timeout.ms`: Detect dead consumers
- `max.poll.records`: Batch size per poll

### Kafka Delivery Guarantees

**At-Most-Once**:
```
config: acks=1, retries=0
Risk: Broker crash between ack and replication
```

**At-Least-Once**:
```
config: acks=all, retries=∞
Risk: Duplicate on consumer restart before offset commit
Solution: Idempotent consumer
```

**Exactly-Once**:
```
config: acks=all, retries=∞, enable.idempotence=true
Plus: Transactional producer for atomic writes
Result: Guaranteed exactly-once at consumer offset
```

## Consumer Patterns & Offset Management

### Offset Tracking

**Auto-Commit** (Risky):
```
Consumer polls messages
Auto-commits offset every 5 seconds (configurable)
Process message
If crash between commit and process → message reprocessed
If crash after process before commit → message lost
```

**Manual Commit** (Safe):
```
Consumer polls messages
Process all messages
Commit offset
If crash during processing → messages reprocessed on restart
Guarantees processing acknowledgment
```

**Interview Note**: Always use manual commit for exactly-once semantics

### Consumer Group Rebalancing

**Scenario**: Consumer group has 3 consumers, 6 partitions

```
Initial:
Consumer A: [Partition 0, 1]
Consumer B: [Partition 2, 3]
Consumer C: [Partition 4, 5]

Consumer B fails:
Rebalancing triggered
New distribution:
Consumer A: [Partition 0, 1, 2]
Consumer C: [Partition 3, 4, 5]
```

**Rebalance Listener Pattern**:
```
Before rebalance: Commit offsets for assigned partitions
Rebalance occurs
After rebalance: Resume from committed offsets (may have duplicates)
```

**Optimization**: Minimize rebalance time → reduce processing pause

## RabbitMQ vs Kafka Comparison

| Factor | RabbitMQ | Kafka |
|--------|----------|-------|
| **Throughput** | 100K-1M msg/sec | 100K-1M+ msg/sec (optimized) |
| **Latency** | Low (push-based) | Higher (pull-based) |
| **Persistence** | Disk-based, limited retention | Distributed log, long retention |
| **Replayability** | Not designed for replay | Replay to any offset trivial |
| **Partitioning** | Queue-level | Topic-level (built-in) |
| **Scaling** | Add queues/brokers (queue not partitioned) | Add partitions → parallel consumers |
| **Setup Complexity** | Simpler for simple patterns | Higher learning curve, more config |
| **Ecosystem** | Standard middleware | Analytics, streaming (Spark, Flink, etc.) |
| **Use Case** | Task queues, work distribution | Event streaming, analytics, log aggregates |

**Interview Decision Tree**:
- Simple task queue? → RabbitMQ (or AWS SQS)
- Need replay/reprocessing? → Kafka
- Analytics pipeline? → Kafka
- RPC replacement? → RabbitMQ
- Microservice messaging at scale? → Kafka

## System Design Patterns

### Pattern 1: Task Queue

**Architecture**:
```
Producer → Queue → [Consumer Pool Workers] → Results DB
```

**Use Case**: Background job processing, image resizing, email sending

**Kafka Implementation**:
- 1 partition if strict ordering required (single consumer)
- Multiple partitions for parallelism (consumer per partition)
- Manual offset commit after task completion

**RabbitMQ Implementation**:
- Task queue (durable, auto-ack off)
- Multiple worker consumers (queue distributes)
- Manual ack after task completion

### Pattern 2: Event Sourcing

**Architecture**:
```
Events → Event Store (Kafka topic) → Event Processors
                      ↓
              State Snapshots (DB)
```

**Benefits**:
- Complete audit trail of all state changes
- Replay events to rebuild state
- Temporal queries ("what was state at time T?")

**Implementation**:
```
1. Command arrives (e.g., "TransferMoney")
2. Validate against current state
3. Emit Event (e.g., "MoneyTransferred")
4. Persist event to Kafka
5. Process event → update state DB
6. ACK to client
```

**Kafka Advantage**: Perfect for event stream storage (immutable log)

### Pattern 3: Log Aggregation

**Architecture**:
```
Service A logs → Kafka topic → Log Processor → Elasticsearch
Service B logs →
Service C logs →
```

**Kafka Characteristics Enable This**:
- Durability: Logs won't be lost (replication)
- Retention: Keep logs for compliance (30+ days)
- Separation: Different log types/services to different partitions
- Replay: Reprocess logs if indexing fails

### Pattern 4: Stream Processing

**Architecture**:
```
Kafka Source → [Transform/Aggregate] → Kafka Destination
                     ↓
                 State Store
                     ↓
            Sink (DB, cache, etc.)
```

**Kafka Semantics Enable**:
- Ordering guarantees (per partition)
- Exactly-once processing
- Windowed aggregations (tumble, slide, session)
- Complex joins

**Frameworks**: Kafka Streams (embedded), Flink, Spark

## Interview Questions

### Q1: "Design the notification system for an e-commerce platform"

**Requirements**:
- Users receive notifications after order placement
- Analytics team needs access to all notifications
- Notifications may take seconds (eventual consistency OK)

**Solution**:
```
Order Service → Kafka Topic "orders" → Notification Service → Push to user
                                     ↓
                            Analytics Service → Data Warehouse

Kafka Rationale:
- Durability: No order loss
- Replay: Analytics can process past orders
- Decoupling: Notification failures don't affect order service
- Scaling: Each partition processes independently
```

**Configs**:
```
Topic: orders (6 partitions, RF=3)
Partition key: user_id (same user's orders go to same partition)
Producer: acks=all, retries=∞ (don't lose orders)
Consumer (Notification): max.poll.records=100, manual commit
Consumer (Analytics): auto-commit (tolerates duplicates)
Retention: 30 days (analytics window)
```

### Q2: "Design the job scheduling system for a distributed compute platform"

**Requirements**:
- Submit jobs, track execution, handle failures
- Thousands of job workers
- Retry failures, maintain order for dependent jobs

**Solution**:
```
Client → Job Queue (Kafka/RabbitMQ) → [Job Workers] → Result Store

Choice: RabbitMQ
Reason: 
- Strict ordering per job (no replay needed)
- Worker pool pattern (queue distributes)
- Dead letter queue for failed jobs
- Simple model for task distribution
```

**Alternative with Kafka**:
```
Topic: jobs (K partitions, K ≥ num_workers)
Partition key: job_id (strict ordering)
Consumer group: workers (rebalance distributes load)
Manual commit: After job completion
Result topic: job_results (for status tracking)
```

### Q3: "Detect fraudulent transactions in real-time"

**Requirements**:
- Decisions within 100ms
- Access to user's last 100 transactions, last 1 hour pattern
- Model updates without redeployment

**Solution**:
```
Payment streams → Kafka → Streaming Processor → Fraud Detection Model → Result
                           ↓
                      State Store (user transaction window)
                      
Framework: Kafka Streams or Flink
Windowing: Sliding window (5 min) for user patterns
State: RocksDB (local state store) for transaction history
Exactly-once: Enable for fraud decision consistency
Model serving: Sidecar service for ML model predictions
```

**Kafka Advantage**:
- Source of truth for all transactions
- Replay capability for model retraining
- Exactly-once semantics critical for fraud decisions

## Scaling Message Queues

### Producer Scaling
```
Single Producer → Bottleneck at broker connection
Solution: Connection pooling, batch compression

Multiple Producers → Linear throughput increase
Consideration: Partition selection (round-robin, custom key)
```

### Consumer Scaling
```
Kafka: Partition count = num_consumers (ideal)
If consumers > partitions: Some sit idle
If consumers < partitions: One consumer processes multiple

RabbitMQ: Add consumers to queue (queue distributes)
Limitation: Queue master single-threaded
```

### Broker Scaling
```
Single broker → Limited by hardware (CPU, disk, network)
Broker cluster → Replicate partitions across brokers

Kafka:
- Broker failure → Auto-elect new leader (seconds)
- Partition rebalance → Redistribute to healthy brokers
- Scaling: Add broker → increase RF → rebalance

RabbitMQ:
- Queue master on one broker (bottleneck)
- Mirroring across nodes (not true sharding)
- Scaling: Limited by master node capacity
```

## Reliability & Failure Modes

### Producer Failures
**Scenario**: Producer crashes mid-send

**Kafka**: 
- Message partially replicated to brokers
- Recovery: ACK not sent, producer retries → possible duplicate
- Idempotence: Broker deduplicates within window

**RabbitMQ**:
- Same pattern, relies on publisher confirms

### Consumer Failures
**Scenario**: Consumer crashes during processing

**Kafka**:
- Last committed offset known
- On restart: Reprocess from last commit (duplicates possible)
- Fix: Manual commit after processing

**RabbitMQ**:
- Queue holds message if consumer didn't ACK
- On restart: Message redelivered to next consumer

### Broker Failures
**Kafka**:
- Replication factor = 3 → tolerates 2 broker failures
- ISR (In-Sync Replicas): Elect new leader from ISR
- Recovery: Data integrity maintained

**RabbitMQ**:
- Queue master on specific broker → loss if not mirrored
- Mirror nodes: Single-master (not partition-tolerant)

## Configuration Tuning

### High Throughput
```
Kafka:
- Batch size: 16KB-32KB (tradeoff latency/throughput)
- Compression: snappy/lz4 (CPU vs network)
- acks=1 (fast, acceptable loss)
- num.threads: 8+ (parallel processing)

RabbitMQ:
- Prefetch: 10-100 (balance latency/throughput)
- Durable: false if durability not critical
```

### Low Latency
```
Kafka:
- linger.ms=0 (send immediately, no batching)
- acks=1 (avoid all-replica sync)
- fetch.min.bytes=1 (pull immediately)
- num.fetch.sessions=1 (metadata caching)

RabbitMQ:
- Prefetch: 1 (immediate processing)
- No batching (process each message individually)
```

### Exactly-Once Requirements
```
Kafka:
- enable.idempotence=true
- acks=all
- retries=MAX_INT
- isolation.level=read_committed
- (Optional) transactional.id + initTransactions()

Consumer:
- Manual offset commit after processing
- Deduplication store for idempotency
```

## Key Takeaways

1. **Message queues are fundamental** to distributed system design—understand both RabbitMQ and Kafka
2. **Delivery semantics matter**: at-most-once, at-least-once, exactly-once have different tradeoffs
3. **Kafka for replay**: Built-in replayability makes it superior for analytics and event sourcing
4. **RabbitMQ for simplicity**: Better fit for simple task queues and RPC patterns
5. **Partitioning is critical**: Understand how it enables parallelism and ordering guarantees
6. **Consumer groups democratize scale**: In Kafka, adding consumers scales processing automatically
7. **Offsets are checkpoints**: Manual commit ensures exactly-once semantics
8. **Failure modes matter**: Design idempotent consumers to handle duplicates naturally
9. **Retention policy determines use case**: Long retention enables analytics; short retention for task queues
10. **Monitor lag**: Consumer lag (offset lag) is key metric for system health
