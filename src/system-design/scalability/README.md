# System Design: Scalability

## Overview

Scalability is the ability of a system to handle increasing load. It's distinct from performance (how fast it is) and includes infrastructure, database, and architectural considerations. This is critical for system design interviews as real systems must scale from 100 users to millions.

## Scaling Dimensions

### Vertical Scaling (Scale Up)
**Add more power to single machine**: CPU, RAM, storage

**Pros**:
- Simpler implementation initially
- Fewer coordination issues
- Lower latency between components

**Cons**:
- Hardware limits (can't have infinite RAM)
- Single point of failure (SPOF)
- Downtime for upgrades
- Expensive at extreme scales

**When**: Good for first 10-100k concurrent users

### Horizontal Scaling (Scale Out)
**Add more machines**: Distribute load across servers

**Pros**:
- No theoretical limit (add machines)
- Redundancy and fault tolerance
- No downtime for scaling
- Better resource utilization

**Cons**:
- Complex architecture (consistency, coordination)
- Network latency between nodes
- Data replication challenges
- Debugging distributed systems hard

**When**: Production systems, millions+ concurrent users

## Load Balancing

Distributes incoming requests across multiple servers.

### Algorithms

**Round Robin**: Cycle through servers sequentially
- Simple, even distribution
- Ignores server health/resources
- Good baseline

**Least Connections**: Send to server with fewest active connections
- Better for connection-heavy workloads
- Accounts for connection time
- Still ignores response time

**Weighted Round Robin**: Prioritize powerful servers
- Server 1: 3x weight, Server 2: 1x weight → 3:1 traffic ratio
- Good when servers heterogeneous

**IP Hash**: Hash source IP to same server
- Session persistence (important for stateful apps)
- Same client always hits same server
- Risk: Uneven distribution if few clients

**Least Response Time**: Route to fastest responding server
- Adaptive to actual performance
- More overhead (must measure response times)

**Random**: No specific order
- Simple to implement
- Surprisingly effective probabilistically

### Load Balancer Placement

**Layer 4 (Transport)**: TCP/UDP level
- Very fast (no content inspection)
- Blind to protocol
- Hardware LBs often here

**Layer 7 (Application)**: HTTP level
- Can route based on content (path, host, headers)
- More flexibility, more overhead
- Software LBs (nginx, HAProxy)

## Database Scalability

### Replication

**Master-Slave (Primary-Replica)**:
- One master accepts writes
- Slaves replicate data, serve reads
- Read throughput scales, write throughput doesn't
- Asynchronous replication: Lag before reads see new data
- Synchronous replication: Slower writes, guaranteed consistency

**Master-Master**:
- Both masters accept writes
- Conflict resolution needed
- Complex, prone to inconsistencies
- Rare in practice

**Use case**: Read-heavy workloads (90% reads)

### Sharding (Horizontal Partitioning)

**Split data across multiple databases** by shard key

**Shard key selection critical**:
- **User ID**: Good if queries by user (accounts, orders)
- **Geographic region**: Good for geo-distributed systems
- **Hash-based**: Even distribution but makes range queries hard
- **Directory service**: Maintains mapping (extra lookup)

**Challenges**:
- **Hot shard**: One shard gets all traffic (e.g., celebrities)
- **Uneven distribution**: Some shards larger than others
- **Cross-shard joins**: Expensive query across multiple databases
- **Re-sharding**: Growing database requires moving data (painful)

**Example**:
```
User 1-1M → Shard A
User 1M-2M → Shard B
User 2M-3M → Shard C
```

Query for User 500K → Look up shard A → Query shard A only

### Read Replicas

Create read-only copies of data for scaling reads
- Primary handles writes
- Replicas handle reads
- Replicas lag behind primary (stale reads possible)

**Consistency levels**:
- **Strong consistency**: Write immediately visible (slow)
- **Eventual consistency**: Visible after replication (fast)

**Typical approach**: Use replicas for non-critical reads, primary for critical reads

### Caching to Reduce Database Load

```
Request → Check Cache → Hit: Return data
         → Miss: Query DB, cache result, return
```

**Cache invalidation strategies**:
- **TTL (Time To Live)**: Auto-expire after N seconds
- **Write-through**: Update cache when data changes
- **Write-behind**: Async update cache
- **Invalidation on write**: Delete on update (must rebuild)

## Caching Layer

### Where to Cache

**Browser/Client**: Browser cache, local storage
- Fastest (no network)
- Limited size
- User specific

**CDN Edge**: Distributed geographically
- Near user (fast)
- Static content (images, JS, CSS)
- ~1000 edge locations globally

**In-Memory Cache**: Redis, Memcached
- Between app and database
- Very fast (microseconds)
- Shared across servers

### Cache Strategies

**Cache-aside**:
1. Check cache
2. If miss: Query database
3. Store in cache
4. Return

Most common. Application manages cache.

**Write-through**:
1. Write to cache
2. Write to database
3. Return

Slower but consistent. Cache always has data.

**Write-behind**:
1. Write to cache
2. Return immediately
3. Async write to database

Fast but risk losing data if cache crashes before write.

## Asynchronous Processing

Decouple slow operations from request-response cycle

**Pattern**:
```
1. Client sends request
2. Server queues job, returns immediately
3. Worker processes job asynchronously
4. Client polls for results or receives via webhook
```

**Benefits**:
- Faster response times
- Spikes handled without blocking
- Can retry failed jobs

**Tools**: Message queues (RabbitMQ, Kafka), task queues (Celery)

## Database Choice Scaling

### SQL (RDBMS)
- **Strengths**: Consistency, complex queries, ACID transactions
- **Limits**: Scaling writes hard, complex joins at scale
- **Use**: Financial, structured data, strong consistency needed

### NoSQL
- **Document DB** (MongoDB): Flexible schema, good for rapid iteration
- **Key-Value** (Redis): Ultra-fast, simple operations
- **Graph** (Neo4j): Relationships, social networks
- **Time-Series** (InfluxDB): Metrics, logs
- **Search** (Elasticsearch): Full-text search at scale

## Scaling Patterns

### Database Per Service
Microservices with separate databases
- Services scale independently
- No shared database bottleneck
- Hard to maintain transactions across services

### Event Sourcing
Store sequence of events instead of current state
- Replay events to reconstruct state
- Natural audit trail
- Easy to scale (events immutable)

### CQRS (Command Query Responsibility Segregation)
Separate reads from writes
- Write database optimized for inserts
- Read database (denormalized) optimized for queries
- Reads and writes scale independently

## Real-World Scaling Examples

### YouTube Scale
- Millions concurrent users
- Upload + delivery challenging
- Solution: Geographic distribution, CDN, adaptive bitrate

### Uber Scale
- Real-time location tracking millions users
- Solutions: Geospatial sharding, message queues, microservices

### Twitter Scale
- Billions tweets, millions concurrent
- Solutions: Distributed caching, eventual consistency, fan-out on write/read

## Performance Metrics

### Key Metrics
- **QPS (Queries Per Second)**: Throughput
- **Latency (p50, p99, p99.9)**: Response time percentiles
- **Availability**: % uptime (99%, 99.9%, 99.99%)
- **Bandwidth**: Data transfer rate

### Scaling Targets (Rules of Thumb)
- Single server: 1,000-10,000 QPS
- Single database: 10,000-100,000 QPS
- Distributed system: 1,000,000+ QPS

## Bottleneck Detection

### Common Bottlenecks

**CPU-bound**:
- Algorithm optimization
- Caching results
- Parallel processing

**I/O-bound**:
- Batch requests
- Connection pooling
- Asynchronous processing

**Memory-bound**:
- Compression
- Data pruning
- Garbage collection tuning

**Network-bound**:
- Optimize payload size
- Protocol choice (gRPC faster than REST)
- Reduce hops

## Interview Approach

### Question Analysis
1. **Current scale**: How many users/requests?
2. **Growth**: How fast growing?
3. **Critical path**: What must be fast?
4. **Data freshness**: Can data be stale?
5. **Availability needs**: How available must system be?

### Scalability Checklist
- [ ] Load balancing for horizontal scaling
- [ ] Database read replicas or sharding
- [ ] Caching layer (Redis/Memcached)
- [ ] CDN for static assets
- [ ] Async queues for slow operations
- [ ] Monitoring and alerting
- [ ] Graceful degradation

### Common Mistakes
- Over-caching (cache inconsistency bugs)
- Premature optimization (90% time in 10% code)
- Ignoring failure scenarios
- Not measuring (optimize wrong thing)
- Too many dependencies (complexity)

## Estimation Examples

### Twitter-like System
- 100M users, 5M tweets/day, 50M daily active users
- Tweet writes: 5M/86,400 sec ≈ 58 QPS
- Home feed reads: 50M active × 100 reads/day ÷ 86,400 ≈ 58,000 QPS
- **Need**: Read-heavy (1000:1 ratio)
- **Solution**: Caching, feed denormalization, geographic sharding

### Uber-like System
- 1M drivers, 10M users, 1M concurrent active
- Location update: 1M drivers × 4 updates/min ÷ 60 ≈ 66,000 QPS
- Request match: 1M concurrent × varies ≈ 10,000-100,000 QPS
- **Need**: Real-time, geospatial, low latency
- **Solution**: Geo-sharding, message queues, eventual consistency

## Key Takeaways

1. **Vertical scaling has limits**: Eventually need horizontal scaling
2. **Read and write scaling differ**: Reads easier to scale (cache, replicas)
3. **Cache everything (carefully)**: Invalidation is hard but worth it
4. **Async for resilience**: Don't block on slow operations
5. **Database choice matters**: SQL/NoSQL tradeoffs affect scalability
6. **Measure first**: Don't optimize blind
7. **Stateless services scale**: Single responsibility easier to scale horizontally
