# Apache Kafka - Complete System Design Guide

## 🔔 What is Kafka?

**Kafka**: Distributed event streaming platform (not "just a message queue")

**Key Difference**:
- Traditional queues: Fire & forget (messages deleted after consumption)
- **Kafka**: Messages persisted on disk, replayed, distributed across cluster

**Use Cases**:
- Real-time data pipelines
- Event sourcing
- Stream processing
- Log aggregation
- Metrics collection

---

## 🏗️ Kafka Architecture

### Core Components

```
Producer → Kafka Cluster → Consumers
              ↓
         Brokers (Nodes)
         Partitions
         Replicas
```

### Broker
- Stores messages in partitions
- Manages replication
- Handles producer/consumer requests

### Topic
- Collection of messages on a specific subject
- Divided into partitions

### Partition
```
Partition 0
├── Message 0 (offset 0)
├── Message 1 (offset 1)
├── Message 2 (offset 2)
└── ...

Partition 1
├── Message 0 (offset 0)
├── Message 1 (offset 1)
└── ...
```

**Key Points**:
- Ordered within partition (NOT across partitions)
- Replicated across brokers
- Each partition has 1 leader + N-1 replicas

---

## 📊 Kafka Replication & Durability

### Replication Strategy

```
Replication Factor = 3

Broker 1: Partition 0 (Leader)
Broker 2: Partition 0 (Replica)
Broker 3: Partition 0 (Replica)
```

### Write Guarantees (acks parameter)

| acks | Behavior | Risk | Latency |
|------|----------|------|---------|
| 0 | No wait | Data loss | Fastest |
| 1 | Wait for leader | Replica loss | Medium |
| all | Wait for all replicas | None | Slowest |

**Best Practice for critical data**: `acks=all` + min.insync.replicas=2

### In-Sync Replicas (ISR)

```
ISR = [Broker1, Broker2]  (up-to-date replicas)
OSR = [Broker3]           (out-of-sync replicas)

Only ISR replicas count for "all" acks
```

---

## 🔄 Producer - Consumer Model

### Producer

```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("acks", "all");  // Wait for all replicas
props.put("retries", 3);
props.put("linger.ms", 10);  // Batch messages for 10ms

KafkaProducer<String, String> producer = new KafkaProducer<>(props);

// Send message
ProducerRecord<String, String> record = 
    new ProducerRecord<>("my-topic", "key-1", "value-1");

producer.send(record, (metadata, exception) -> {
    if (exception != null) {
        System.err.println("Error: " + exception);
    } else {
        System.out.println("Message sent to partition: " + metadata.partition());
    }
});
```

**Key Concepts**:
- **Key**: Determines partition (same key = same partition)
- **Partitioner**: Custom routing logic
- **Compression**: snappy, lz4, gzip for bandwidth savings
- **Batching**: Improves throughput significantly

### Consumer

```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("group.id", "my-group");
props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("auto.offset.reset", "earliest");
props.put("enable.auto.commit", true);

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(Arrays.asList("my-topic"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        System.out.printf("Topic: %s, Partition: %d, Offset: %d, Key: %s, Value: %s%n",
            record.topic(), record.partition(), record.offset(),
            record.key(), record.value());
    }
}
```

**Key Concepts**:
- **Consumer Group**: Multiple consumers partition a topic
- **Offset**: Position in partition (consumer tracks this)
- **Rebalancing**: When consumer joins/leaves group
- **auto.offset.reset**: What to do if offset invalid (earliest/latest/none)

---

## 🎯 Consumer Groups & Rebalancing

### Consumer Group Mechanics

```
Topic: "orders" (3 partitions)

Consumer Group: "order-processors"
├── Consumer 1 → Partition 0
├── Consumer 2 → Partition 1
└── Consumer 3 → Partition 2

Partitions = 3, Consumers = 3
Result: Even distribution, 1 partition per consumer
```

### Rebalancing Types

**Eager Rebalancing**:
```
Old: C1→P0, C2→P1, C3→P2
New consumer joins
Stop all consumers
Rebalance everything
Resume: C1→P0, C2→P1, C3→P2, C4→P0
```

**Cooperative Rebalancing** (newer):
```
Only affected partitions reassigned
Less stop-the-world pauses
Better for streaming workloads
```

---

## 🔐 Exactly-Once Semantics (EOS)

### Challenge: Duplicates

```
Consumer reads message
Process it
Crashes before committing offset
Restart: Re-reads message → Duplicate!
```

### Solutions

**1. Idempotent Producer**:
```
producer.enable.idempotence = true
Kafka deduplicates on broker side
```

**2. Transactional Writes** (within topic):
```java
producer.beginTransaction();
producer.send(new ProducerRecord<>(...));
producer.send(new ProducerRecord<>(...));
producer.commitTransaction();  // All-or-nothing
```

**3. Transactional Reads** (with offset management):
```
producer.sendOffsetsToTransaction(offsets, group);
producer.commitTransaction();
// Offset and message written atomically
```

### Exactly-Once in Streams

```
Enable EOS: processing.guarantee = exactly_once_v2

Process → Write to output topic → Commit offset
All atomic within transaction
```

---

## 📈 Performance Tuning

### Producer Optimization

| Setting | Default | Recommendation | Impact |
|---------|---------|-----------------|--------|
| batch.size | 16KB | 32KB-100KB | Throughput ↑ |
| linger.ms | 0 | 10-100ms | Batching ↑ |
| compression.type | none | snappy/lz4 | Network ↓ |
| acks | 1 | all | Safety ↑, Latency ↑ |
| buffer.memory | 32MB | 64MB-256MB | Large batches |

### Consumer Optimization

| Setting | Default | Recommendation | Impact |
|---------|---------|-----------------|--------|
| fetch.min.bytes | 1B | 10KB-100KB | Latency ↓ |
| fetch.max.wait.ms | 500ms | 100-500ms | Batching ↑ |
| max.poll.records | 500 | 100-1000 | Memory ↓ |
| session.timeout.ms | 10s | 30s | Stability ↑ |

### Throughput vs Latency Trade-off

```
High Throughput: batch.size=100KB, linger.ms=100ms
→ Messages accumulate → Sent in bulk → High throughput

Low Latency: batch.size=0, linger.ms=0
→ Send immediately → Real-time delivery → Lower throughput
```

---

## 🔴 Common Interview Questions

### Q1: Scale handling

**Question**: "Your system produces 1M messages/second. How do you partition?"

**Answer**:
```
Messages/second = 1M
Target throughput per partition = 1MB/s = ~100K messages/s
Partitions needed = 1M / 100K = 10 partitions

Use hash(userId) % 10 for even distribution
```

### Q2: Message ordering

**Question**: "How do you guarantee message ordering?"

**Answer**:
```
Use same key for related messages
Key → Same partition → Ordered processing

Example: For user-123's transactions:
Key = "user-123"
→ Always goes to same partition
→ Consumer processes in order
```

### Q3: Rebalancing issues

**Question**: "Why do you see message loss during rebalancing?"

**Answer**:
```
If auto.commit.interval.ms is short:
- Consumer crashes before committing offset
- On rebalance, offset reset to last committed
- Messages between committed offset and crash are reprocessed

Solution:
1. Commit after processing (manual commit)
2. Use EOS mode
3. Increase session.timeout.ms to reduce rebalancing
```

---

## 🎓 Interview Checklist

- [ ] Know partition vs topic distinction
- [ ] Understand replication & ISR concept
- [ ] Can explain acks parameter effect
- [ ] Know producer batching optimization
- [ ] Understand consumer group mechanics
- [ ] Can solve ordering problem with keys
- [ ] Know exactly-once semantics solution
- [ ] Can design multi-partition strategy
- [ ] Understand rebalancing triggers
- [ ] Know performance tuning parameters

---

## 🏆 Real-World Scenarios

### Scenario 1: Payment Processing
```
Requirements: No duplicate charges

Solution:
- Enable idempotent producer
- Use transactional writes
- Exactly-once semantics with EOS
- Idempotency key at application level
```

### Scenario 2: User Activity Analytics
```
Requirements: Real-time metrics, 100K events/sec

Solution:
- Multiple partitions: 10 (1M events/sec / 100K per partition)
- Compression: snappy
- Log retention: 7 days
- Batch processing: flush every 5 minutes
```

### Scenario 3: Multi-Datacenter Replication
```
Requirements: Disaster recovery

Solution:
- Topic replication factor = 3+
- min.insync.replicas = 2
- Use MirrorMaker for cross-DC replication
- Multiple brokers across availability zones
```

---

## 📚 References

- Apache Kafka Documentation: https://kafka.apache.org/documentation
- KIP (Kafka Improvement Proposals): https://cwiki.apache.org/confluence/display/KAFKA
- Confluent Blog: Real-world patterns and use cases
