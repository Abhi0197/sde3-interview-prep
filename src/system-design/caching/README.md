# Caching - System Design Interview Guide

## 🎯 Purpose of Caching

**Problem**: Databases are slow, storage costs money

**Solution**: Keep frequently accessed data in fast, temporary storage

**Benefits**:
- ✅ Reduced latency (microseconds vs milliseconds)
- ✅ Decreased database load
- ✅ Lower costs (fewer DB queries)
- ✅ Better user experience

---

## 🏗️ Cache Hierarchy (Speed vs Cost)

```
CPU L1 Cache (microseconds, expensive)
    ↓
CPU L2/L3 Cache (microseconds)
    ↓
RAM / In-Memory Store (milliseconds, moderate cost)
    ↓
Disk/SSD (milliseconds-seconds, cheap)
    ↓
Database (seconds, cheapest per GB)
```

**Real world** (System Design):
```
Application Cache
    ↓ (milliseconds)
Distributed Cache (Redis, Memcached)
    ↓ (milliseconds)
Database
    ↓
Disk / External Services
```

---

## 💾 Cache Types

### 1. In-Memory Cache (Application Level)

**Where**: RAM within application process  
**Speed**: Microseconds  
**Size**: Limited by single machine memory  
**Sharing**: Only for single instance

**Example**:
```java
HashMap<String, UserData> cache = new HashMap<>();

// Put
cache.put(userId, userData);

// Get
UserData data = cache.get(userId);
```

### 2. Distributed Cache (Across Network)

**Where**: Separate service (Redis, Memcached)  
**Speed**: Milliseconds (network latency)  
**Size**: Can be very large (multiple servers)  
**Sharing**: Multi-instance access

**Example**:
```java
// Redis client
Redis redis = new Redis("cache.example.com");
redis.set("user:123", userData); // O(1)
UserData data = redis.get("user:123");
```

### 3. CDN / Edge Cache

**Where**: Geographically distributed servers  
**Speed**: Depends on network (closest edge)  
**Content**: Static assets (images, JS, CSS)  
**Example**: Cloudflare, AWS CloudFront

### 4. Database Cache

**Where**: Built-in to database  
**Speed**: Milliseconds  
**Content**: Query results, frequently accessed rows  
**Example**: MySQL query cache, MongoDB cache

---

## 📝 Cache Writing Strategies

### 1. Cache-Aside (Lazy Loading)

**Process**:
```
Read Request → Cache Hit? (return) : Miss → Fetch from DB → Update Cache → Return

Write Request → Update DB → Invalidate Cache
```

**Pros**:
- ✅ Simple to implement
- ✅ Cache only stores accessed data
- ✅ Only accessed data cached

**Cons**:
- ❌ Cache miss penalty (3 calls: miss, fetch, cache)
- ❌ Stale data possible

**Code**:
```java
public UserData getUser(String userId) {
    // Check cache
    UserData cached = cache.get(userId);
    if (cached != null) return cached;
    
    // Cache miss - fetch from DB
    UserData data = db.getUser(userId);
    
    // Update cache
    cache.set(userId, data, TTL);
    return data;
}

public void updateUser(String userId, UserData newData) {
    // Update DB first
    db.update(userId, newData);
    
    // Invalidate cache
    cache.del(userId);
}
```

**When to use**: General-purpose application cache

### 2. Write-Through

**Process**:
```
Write Request → Cache + DB (both) → Return

Read Request → Cache (hit) : Miss → DB → Cache → Return
```

**Pros**:
- ✅ Cache always has latest data
- ✅ No stale data issues

**Cons**:
- ❌ Slow write (must wait for both)
- ❌ Overhead writing unused data
- ❌ Cache miss still slow on read

**Code**:
```java
public void updateUser(String userId, UserData newData) {
    // Write to cache AND database
    cache.set(userId, newData);
    db.update(userId, newData);
}
```

**When to use**: Critical data requiring consistency (payments)

### 3. Write-Behind (Write-Back)

**Process**:
```
Write Request → Cache (return immediately) → Async DB Update

Read Request → Cache (hit) : Miss → DB → Cache → Return
```

**Pros**:
- ✅ Fast writes (only update cache)
- ✅ Batches DB writes
- ✅ Reduced DB load

**Cons**:
- ❌ Data loss if cache dies before flush
- ❌ Stale data between write and DB update
- ❌ Complex implementation

**Code**:
```java
public void updateUser(String userId, UserData newData) {
    cache.set(userId, newData);
    
    // Async flush to DB (batch writes)
    dirtyQueue.add(userId);
    if (dirtyQueue.size() >= BATCH_SIZE) {
        flushToDB();
    }
}

void flushToDB() {
    // Batch update all dirty records
    List<String> dirty = dirtyQueue.poll(BATCH_SIZE);
    db.batchUpdate(dirty);
}
```

**When to use**: High-traffic, non-critical data (metrics, analytics)

---

## 🔄 Cache Invalidation Strategies

### 1. TTL (Time-To-Live)

```
Cache Entry → TTL expires → Auto-remove
```

**Simple**: In milliseconds after write

**Trade-off**: Shorter TTL = fresher data but more DB hits

```java
cache.set("user:123", userData, 3600000); // 1 hour TTL
```

### 2. Explicit Invalidation

```
Data Updated → Invalidate Cache Key
```

**When**: Coordinated with application logic

```java
db.updateUser(userId, newData);
cache.delete("user:" + userId);  // Explicit delete
```

### 3. Event-Based Invalidation

```
Data Update Event → Listeners → Cache Delete
```

**When**: Multiple caches need invalidation

```java
EventBus.publish("user:updated", userId);

// Listener
@Subscribe
public void onUserUpdated(UserUpdatedEvent event) {
    cache.delete("user:" + event.userId);
}
```

### 4. LRU (Least Recently Used)

```
Cache Full → Remove least recently used item → Add new item
```

**When**: Memory limited, frequent access patterns

---

## ⚡ Distributed Cache Implementation (LRU)

**Problem**: Build LRU cache for distributed system

**Solution**: HashMap + Doubly-Linked List

```java
class Node {
    String key, value;
    Node prev, next;
}

class LRUCache {
    int capacity;
    Map<String, Node> cache;
    Node head, tail;  // Dummy nodes
    
    public LRUCache(int capacity) {
        this.capacity = capacity;
        cache = new HashMap<>();
        head = new Node();  // MRU sentinel
        tail = new Node();  // LRU sentinel
        head.next = tail;
        tail.prev = head;
    }
    
    public String get(String key) {
        if (!cache.containsKey(key)) return null;
        
        Node node = cache.get(key);
        moveToHead(node);  // Mark as recently used
        return node.value;
    }
    
    public void put(String key, String value) {
        if (cache.containsKey(key)) {
            // Update value
            Node node = cache.get(key);
            node.value = value;
            moveToHead(node);
            return;
        }
        
        // New key
        if (cache.size() >= capacity) {
            // Evict LRU (tail.prev)
            Node lru = tail.prev;
            remove(lru);
            cache.remove(lru.key);
        }
        
        // Add new node
        Node newNode = new Node(key, value);
        addToHead(newNode);
        cache.put(key, newNode);
    }
    
    void moveToHead(Node node) {
        removeNode(node);
        addToHead(node);
    }
    
    void addToHead(Node node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }
    
    void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
}

// Complexity: get O(1), put O(1)
```

---

## 🔥 Common Caching Issues

### 1. Cache Stampede

**Problem**: Cache expires, all requests hit DB simultaneously

```
10:00:00 Cache expires for "user:123"
10:00:00 Request 1: Cache miss
10:00:01 Requests 2-100: All hit DB (DB overload!)
10:00:02 Request 101: Gets new cache
```

**Solutions**:

A) Early refresh
```java
if (expiryTime - now < threshold) {
    refresh cache in background
}
```

B) Probabilistic early expiration
```java
if (random() < probability) {
    refresh cache
}
```

C) Distributed locking
```java
if (cache miss) {
    if (acquire_lock(key)) {
        refresh cache
        release_lock()
    } else {
        wait for refresh
    }
}
```

### 2. Cache Invalidation (Hard Problem)

**Issue**: When to remove stale cache?

**Options**:
- TTL (stale but automatic)
- Event-based (fresh but complex)
- Hybrid (reasonable compromise)

### 3. Hot Spot

**Problem**: One cache entry accessed disproportionately

```
"trending:video" accessed 1M times/sec
→ Single cache node bottleneck
→ Network saturation
```

**Solution**:
- Replicate across multiple nodes
- Local cache + distributed cache
- Sharding if hot subset exists

### 4. Thundering Herd

**Problem**: Cache failure causes spike

**Solution**:
- Multiple cache replicas
- Circuit breaker pattern
- Fallback to DB

---

## 📊 Cache vs Load vs Memory

| Aspect | More Cache | Less Cache |
|--------|-----------|-----------|
| Hit Ratio | High | Low |
| Latency | Low | High |
| Memory | More expensive | Cheaper |
| Consistency | Harder | Easier |
| Eviction | Complex logic | Simple |

**Sweet spot**: 80-95% hit ratio

---

## 🏆 Popular Cache Products

### Redis
```
- In-memory data structure store
- Distributed cache
- Supports strings, lists, sets, hashes, sorted sets
- TTL support
- Persistence (RDB, AOF)
```

### Memcached
```
- Distributed memory caching
- Simple key-value
- Lightning fast
- No persistence
```

### Hazelcast
```
- In-memory data grid
- Distributed computing
- Java-native
```

### Amazon ElastiCache
```
- Managed Redis/Memcached
- Auto-scaling
- Multi-AZ
```

---

## 🎓 Interview Checklist

- [ ] Understand cache hierarchy and latency
- [ ] Know 3+ writing strategies (cache-aside, write-through, write-behind)
- [ ] Understand TTL vs explicit invalidation
- [ ] Can implement LRU cache efficiently
- [ ] Identify cache stampede and solutions
- [ ] Trade-offs between consistency and performance
- [ ] Know product options (Redis, Memcached, etc.)
- [ ] Can design cache strategy for specific use case
- [ ] Understand eviction policies
- [ ] Know when NOT to use cache

---

## 💡 Pro Tips for Interviews

**"What caching strategy would you use for..."**

| Scenario | Answer |
|----------|--------|
| User profile | Cache-aside + TTL (1 hour) |
| Shopping cart | Write-through (accuracy needed) |
| Analytics | Write-behind (performance > accuracy) |
| Session | Distributed Redis (multi-instance) |
| Static content | CDN edge cache |
| Hot data | Replicated cache + sharding |
| Real-time counter | Write-through or cache bypass |

---

## 📚 References

- Redis documentation: https://redis.io
- Memcached: https://memcached.org
- Cache design patterns: https://www.usenix.org/system/files/2024-osdi-newby-paper.pdf
