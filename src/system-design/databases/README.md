# SQL & Database Design

## SQL Fundamentals

### SELECT Statement

**Basic query**:
```sql
SELECT column1, column2 FROM table_name WHERE condition;
```

**Common clauses**:
- WHERE: Filter rows
- ORDER BY: Sort results
- LIMIT: Limit number of rows
- DISTINCT: Remove duplicates

**Example**:
```sql
SELECT DISTINCT country FROM users WHERE age > 18 ORDER BY country LIMIT 10;
```

### Aggregation Functions

```sql
-- COUNT: Number of rows
SELECT COUNT(*) as total_users FROM users;

-- SUM: Add up values
SELECT SUM(amount) as total_revenue FROM orders;

-- AVG: Average
SELECT AVG(price) as avg_price FROM products;

-- MIN/MAX: Minimum/maximum
SELECT MIN(price) as cheapest, MAX(price) as most_expensive FROM products;

-- GROUP BY: Group results
SELECT country, COUNT(*) as users_per_country FROM users GROUP BY country;

-- HAVING: Filter groups (like WHERE for groups)
SELECT country, COUNT(*) as user_count FROM users GROUP BY country HAVING user_count > 100;
```

### Joins

**INNER JOIN**: Only matching rows
```sql
SELECT users.name, orders.amount 
FROM users 
INNER JOIN orders ON users.id = orders.user_id;
```

**LEFT JOIN**: All from left table + matching from right
```sql
SELECT users.name, COUNT(orders.id) as order_count
FROM users 
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.id;
```

**RIGHT JOIN**: All from right table + matching from left

**FULL OUTER JOIN**: All rows from both tables

**Self Join**: Join table to itself
```sql
-- Find employees and their managers
SELECT e.name as employee, m.name as manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

### Subqueries

```sql
-- Find users with above-average orders
SELECT name FROM users 
WHERE id IN (
    SELECT user_id FROM orders 
    WHERE amount > (SELECT AVG(amount) FROM orders)
);
```

**Correlated subquery** (references outer query):
```sql
SELECT user_id, order_count FROM (
    SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id
) as user_orders
WHERE order_count > 5;
```

### Window Functions

```sql
-- ROW_NUMBER: Rank rows
SELECT name, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) as rank
FROM employees;

-- RANK: Skip numbers for ties
SELECT name, salary, RANK() OVER (ORDER BY salary DESC) as rank
FROM employees;

-- Running total
SELECT order_date, amount, 
       SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders;

-- LAG/LEAD: Access previous/next rows
SELECT order_date, amount,
       LAG(amount) OVER (ORDER BY order_date) as prev_amount,
       LEAD(amount) OVER (ORDER BY order_date) as next_amount
FROM orders;
```

### Indexes

```sql
-- Create index for faster searches
CREATE INDEX idx_user_email ON users(email);

-- Composite index
CREATE INDEX idx_order_user_date ON orders(user_id, order_date);

-- Unique index (enforces uniqueness)
CREATE UNIQUE INDEX idx_email ON users(email);
```

**When to index**:
- Columns in WHERE clauses
- JOIN columns
- Columns in ORDER BY/GROUP BY
- Foreign keys

**Tradeoff**: Faster reads, slower writes (must update index)

---

## Database Design

### Normalization

**1NF (First Normal Form)**: Eliminate repeating groups
```
BAD:
users table:
| id | name | phone |
|  1 | John | 555-1, 555-2 |  ← repeating values

GOOD:
users table: | id | name |
phones table: | id | user_id | phone |
```

**2NF (Second Normal Form)**: Remove partial dependencies
```
BAD:
| course_id | student_id | instructor_id | instructor_department |
↑ instructor_department depends on instructor_id, not both keys

GOOD:
courses: | course_id | instructor_id |
instructors: | instructor_id | department |
```

**3NF (Third Normal Form)**: Remove transitive dependencies
```
BAD:
| student_id | course_id | professor_name | professor_phone |
↑ professor_phone depends on professor_name, not keys

GOOD:
enrollments: | student_id | course_id | professor_id |
professors: | professor_id | name | phone |
```

**Denormalization**: Violate normalization for performance
```sql
-- 3NF: Multiple joins needed
SELECT user.name, COUNT(orders.id) as total_orders
FROM users
JOIN orders ON users.id = orders.user_id
GROUP BY users.id;

-- Denormalized: Store order_count on users table
SELECT name, order_count FROM users;
-- But must update order_count whenever order added/deleted
```

### Primary & Foreign Keys

```sql
-- Primary key: Unique identifier
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE
);

-- Foreign key: Reference another table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Benefits**:
- Enforces referential integrity (can't add order for non-existent user)
- Cascading updates/deletes available
- Database prevents orphaned records

---

## Common Interview Questions

### Q1: Find top 3 users by total spending

```sql
SELECT user_id, SUM(amount) as total_spending
FROM orders
GROUP BY user_id
ORDER BY total_spending DESC
LIMIT 3;
```

### Q2: Get users who haven't ordered in 30 days

```sql
SELECT users.* FROM users
WHERE users.id NOT IN (
    SELECT DISTINCT user_id FROM orders 
    WHERE order_date > DATE_SUB(NOW(), INTERVAL 30 DAY)
);

-- Or using LEFT JOIN
SELECT users.* FROM users
LEFT JOIN orders ON users.id = orders.user_id 
  AND order_date > DATE_SUB(NOW(), INTERVAL 30 DAY)
WHERE orders.id IS NULL;
```

### Q3: Find duplicate email addresses

```sql
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING count > 1;
```

### Q4: Get second highest salary

```sql
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Using window function
SELECT salary FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rank
    FROM employees
) as ranked
WHERE rank = 2;
```

### Q5: Monthly revenue trend

```sql
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') as month,
    SUM(amount) as revenue,
    COUNT(*) as orders
FROM orders
GROUP BY month
ORDER BY month DESC;
```

### Q6: Find users with most recent purchase

```sql
SELECT user_id, amount, order_date FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date DESC) as rn
    FROM orders
) as latest
WHERE rn = 1;
```

### Q7: Running total per user

```sql
SELECT 
    user_id,
    order_date,
    amount,
    SUM(amount) OVER (PARTITION BY user_id ORDER BY order_date) as running_total
FROM orders
ORDER BY user_id, order_date;
```

---

## Query Optimization

### Explain Plan

```sql
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```

**Look for**:
- **type**: ALL (full scan, bad), INDEX (uses index, good), const (single row)
- **key**: NULL (no index used), actual index name
- **rows**: Estimated rows examined (lower = better)

**Example**:
```
id | select_type | table | type  | key       | rows | Extra
1  | SIMPLE      | users | const | PRIMARY   | 1    | NULL
```

### Common Optimizations

**1. Use indexes**:
```sql
-- Slow: Full table scan
SELECT * FROM users WHERE status = 'active';

-- Fast: Index on status
CREATE INDEX idx_status ON users(status);
```

**2. Avoid SELECT ***:
```sql
-- Slow: Returns all columns
SELECT * FROM users;

-- Fast: Only needed columns
SELECT id, name FROM users;
```

**3. Filter early**:
```sql
-- Slow: Join then filter
SELECT u.name, COUNT(*) FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id
HAVING COUNT(*) > 10;

-- Fast: Filter first
SELECT u.name, COUNT(*) FROM users u
WHERE u.status = 'active'
JOIN orders o ON u.id = o.user_id
GROUP BY u.id
HAVING COUNT(*) > 10;
```

**4. Use appropriate joins**:
```sql
-- Inefficient: Multiple subqueries
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- Better: Single join
SELECT DISTINCT users.* FROM users
JOIN orders ON users.id = orders.user_id;
```

**5. Batch operations**:
```sql
-- Slow: 100 individual inserts
INSERT INTO users VALUES ('John');
INSERT INTO users VALUES ('Jane');
...

-- Fast: Single batch insert
INSERT INTO users VALUES ('John'), ('Jane'), ('Bob');
```

---

## Transactions & ACID

**ACID Properties**:
- **Atomicity**: All or nothing (either all changes commit or all rollback)
- **Consistency**: Data valid before and after
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed data survives crashes

```sql
START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- If any error, both changes rollback
COMMIT;
```

**Isolation Levels**:
- **READ UNCOMMITTED**: Dirty reads possible (bad)
- **READ COMMITTED**: No dirty reads (most common, good)
- **REPEATABLE READ**: Phantom reads possible (good)
- **SERIALIZABLE**: No concurrent issues (slow, safest)

---

## Schema Design Interview Pattern

### User Service Schema

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_created_at ON users(created_at);
```

### Order Service Schema

```sql
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2),
    status ENUM('pending', 'completed', 'cancelled'),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date)
);

CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT,
    quantity INT,
    price DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

## Database Architecture at Scale

### Replication vs Sharding

#### Replication (Same Data, Multiple Copies)
```
Master DB ─→ Replica 1 (read-only)
         ─→ Replica 2 (read-only)
         ─→ Replica 3 (read-only)
```

**When**: Read-heavy workloads (95% reads, 5% writes)  
**Benefit**: High availability, fault tolerance  
**Limitation**: Can't resolve write scalability

```
Example: Master handles 1000 writes/sec
         Replicas handle millions of reads/sec (distributed)
```

#### Sharding (Data Split Across Multiple Databases)
```
User 1-1M    ─→ Shard 1 (DB1)
User 1M-2M   ─→ Shard 2 (DB2)
User 2M-3M   ─→ Shard 3 (DB3)
User 3M-4M   ─→ Shard 4 (DB4)
```

**When**: Can't fit all data on one machine  
**Benefit**: Solves write scalability + storage limits  
**Challenge**: Distributed transactions, cross-shard queries

**Sharding Key Selection** (CRITICAL):
```
✓ GOOD: user_id, customer_id (evenly distributed)
✓ GOOD: hash-based (consistent hashing)

✗ BAD: country (uneven - US gets 50% of traffic)
✗ BAD: timestamp (all new data goes to one shard - hot partition)
✗ BAD: status (active/inactive - 90% inactive shard sits idle)
```

---

### Sharding Strategies

#### 1. Range-Based Sharding
```
User ID ranges:
├── 1-1M       → Shard 1
├── 1M-2M      → Shard 2
├── 2M-3M      → Shard 3
└── 3M-4M      → Shard 4
```

**Pros**: Easy to understand, simple to implement  
**Cons**: Uneven distribution, hot shards (if IDs are sequential)

#### 2. Hash-Based Sharding
```
hash(user_id) % 4:
├── hash(user_1) % 4 = 2 → Shard 2
├── hash(user_2) % 4 = 0 → Shard 0
├── hash(user_3) % 4 = 3 → Shard 3
└── hash(user_4) % 4 = 1 → Shard 1
```

**Pros**: Even distribution, simple  
**Cons**: Modulo resizing (if add new shard, all keys rehash)

#### 3. Consistent Hashing (Better for Scaling)
```
Ring of hash values [0 ─────────────────────── 2^32-1]

Shards at positions:
├── Shard 1 at position 100
├── Shard 2 at position 500
├── Shard 3 at position 1000
└── Shard 4 at position 2000

User ID hashes to position on ring
Gets assigned to next shard clockwise

KEY BENEFIT: When adding Shard 5, only ~25% of keys rehash
Instead of 100% rehashing with modulo
```

**Implementation**:
```python
class ConsistentHash:
    def __init__(self, nodes=None):
        self.ring = {}
        self.sorted_keys = []
        
    def add_node(self, node):
        # Add 150 virtual nodes per shard (better distribution)
        for i in range(150):
            virtual_node = f"{node}:{i}"
            key = hash(virtual_node)
            self.ring[key] = node
        self.sorted_keys = sorted(self.ring.keys())
    
    def get_node(self, object_key):
        # Find next shard clockwise on ring
        key = hash(object_key)
        for ring_key in self.sorted_keys:
            if ring_key >= key:
                return self.ring[ring_key]
        return self.ring[self.sorted_keys[0]]  # Wrap around
```

---

### Addressing Sharding Problems

#### Problem 1: Hot Shard (Uneven Load)
```
Example: Sharding by location
├── US shard      → 40M requests/sec (HOT!)
├── EU shard      → 5M requests/sec
├── APAC shard    → 3M requests/sec
└── Other shard   → 2M requests/sec
```

**Solutions**:
1. **Re-shard with better key**: Use hash(user_id) instead of location
2. **Split hot shard**: 
   ```
   US shard → US-East + US-West
   ```
3. **Cache hot data**: Redis in front of hot shard
4. **Write amplification**: Accept the load, add replicas

#### Problem 2: Cross-Shard Queries
```
Query: "Find all users aged 25-30 in US"
Problem: Users distributed across shards, age not shard key
```

**Solutions**:
1. **Scatter-gather**: Query all shards, combine results (slow)
2. **Secondary index**: Maintain separate index by age
3. **Denormalization**: Store redundant data
4. **Search engine**: Use Elasticsearch for complex queries

#### Problem 3: Distributed Transactions Across Shards
```
Transfer $100 from user_1 (shard 1) to user_2 (shard 4)
Problem: Can't use transactions across shards
```

**Solutions**:
1. **Two-phase commit** (slow, locks databases)
2. **Accept eventual consistency**: Retry logic + compensation
3. **Redesign DB**: Keep related data on same shard
4. **Event sourcing**: Log all changes, replay to correct state

---

## Database Types Comparison

### 1. SQL (Relational) - PostgreSQL, MySQL, Oracle

**Best for**: 
- Structured data with relationships
- Complex queries with joins
- ACID transactions
- Strong consistency

```
Schema: Fixed, normalized
Example: User → has many Orders → has many Items
Queries: SELECT u.*, COUNT(o.id) FROM users u 
         LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id
```

**Use Cases**: 
- Financial systems (banking, payments)
- E-commerce (inventory, orders)
- HR systems (employees, departments)

---

### 2. Document DB - MongoDB, Firebase

**Best for**:
- Flexible schema
- Nested data
- Fast development
- JSON-like documents

```javascript
// Flexible schema - each document can differ
db.users.insertOne({
  _id: 1,
  name: "John",
  email: "john@example.com",
  orders: [
    { id: 101, amount: 50 },
    { id: 102, amount: 75 }
  ],
  metadata: { joined: "2020-01-01" }
  // Different documents can have different fields
})
```

**Pros**: 
- Flexible, evolving schema
- Nested queries easy
- Horizontal scaling (sharding)
- Developer friendly

**Cons**:
- No ACID across documents (until recent versions)
- Denormalization duplication
- No joins
- Can be slower for complex queries

**Interview Focus**:
```
- Know when to use (flexible schema, horizontal scale)
- Understand indexing in MongoDB
- Sharding strategies (similar to SQL)
- Consistency models (eventual)
```

---

### 3. Key-Value DB - Redis, Memcached, DynamoDB

**Best for**:
- Session storage
- Caching
- Real-time analytics
- High throughput reads

```
Key: "user:123"
Value: {"name": "John", "age": 30, "email": "john@example.com"}

Key: "leaderboard:game1"
Value: Sorted set of scores
```

**Pros**:
- Extremely fast (in-memory)
- Simple operations (get, set, delete)
- Horizontal scaling (sharding by key)
- Perfect for caching

**Cons**:
- No complex queries
- Limited data types
- RAM is expensive (smaller datasets)
- Eventual consistency

**Common Operations**:
```python
# Redis example
redis.set("user:1", json.dumps(user))           # O(1)
redis.get("user:1")                              # O(1)
redis.incr("page:views")                         # Atomic increment
redis.zadd("leaderboard", score, user_id)       # Sorted set
redis.zrange("leaderboard", 0, 10)               # Top 10
redis.expire("session:123", 3600)                # Set expiration
```

---

### 4. Column-Family DB - Cassandra, HBase

**Best for**:
- Time-series data
- Massive scale (petabytes)
- Write-heavy workloads
- Distributed across data centers

```
Cassandra example:
Partition Key: user_id
Clustering Key: timestamp

user_1 → 2024-01-01 → {metric: 95, cpu: 45}
      → 2024-01-02 → {metric: 87, cpu: 52}
      → 2024-01-03 → {metric: 92, cpu: 48}

user_2 → 2024-01-01 → {metric: 65, cpu: 30}
```

**Use Cases**: 
- Time-series metrics (1B+ metrics/sec)
- IoT data
- Analytics data

---

### 5. Search DB - Elasticsearch, Solr

**Best for**:
- Full-text search
- Complex filtering
- Logging & observability
- Analytics

```javascript
// Query: Find all users aged 25-30 from US containing "developer"
GET /users/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "bio": "developer" } },
        { "range": { "age": { "gte": 25, "lte": 30 } } },
        { "term": { "country": "US" } }
      ]
    }
  }
}
```

**Use Cases**: 
- e-commerce product search
- Log aggregation (ELK stack)
- Internal search

---

## Indexing Strategies In-Depth

### Index Types

#### 1. B-Tree Index (Default for SQL)
```
  ┌─────────┐
  │   30    │
  ├────┬────┤
  │    │    │
┌─┴─┐┌─┴─┐┌─┴─┐
│10 ││20-│││40-│
│20 ││30 ││├50 │
└───┘└────┘└───┘

Each level can be in different disk block
Balanced: All leaf nodes at same depth
Time: O(log n) search, insert, delete
```

**Good for**: Range queries, sorting  
**Used for**: MySQL, PostgreSQL, Oracle

#### 2. Hash Index
```
Hash function → Direct O(1) lookup
Example: hash(user_id) → direct memory address

user_id: 123 → hash(123) = 45000 → value at memory 45000
```

**Good for**: Exact match lookups  
**Bad for**: Range queries ("age > 25")

#### 3. Composite Index (Multiple Columns)
```sql
-- Query: Find user by (email, created_date)
CREATE INDEX idx_email_date ON users(email, created_date);

-- Can use this index:
SELECT * FROM users WHERE email = 'john@example.com' 
  AND created_date > '2020-01-01';

-- Column order MATTERS (email first, then date)
-- Can't efficiently use for: WHERE created_date > '2020-01-01' (without email)
```

**Column Order Rules**:
1. **Equality columns first**: (email, ...)
2. **Range columns second**: (..., age)
3. **Sort columns last**: (..., created_at DESC)

#### 4. Partial Index
```sql
-- Only index active users (saves space)
CREATE INDEX idx_active_email ON users(email) 
WHERE status = 'active';

-- Efficient for: WHERE status = 'active' AND email = ...
-- Does NOT help: WHERE status = 'inactive' AND email = ...
```

### Indexing Best Practices

**When to Index**:
1. WHERE clause columns (high cardinality)
2. JOIN columns (foreign keys)
3. ORDER BY / GROUP BY columns
4. Avoid low-cardinality columns (status, country)

**When NOT to Index**:
1. Small tables (< 1000 rows)
2. Low cardinality (only 2-3 unique values)
3. Columns updated frequently (B-tree rebalancing cost)
4. Columns rarely in queries

**Monitoring Indexes**:
```sql
-- Find unused indexes (waste space, slow writes)
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- Find missing indexes (show slow queries)
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';
-- If shows "Seq Scan", likely needs index on status
```

---

## Common Production Issues & Solutions

### Issue 1: N+1 Query Problem

**Problem**:
```python
users = get_all_users()  # 1 query
for user in users:
    orders = get_orders(user.id)  # N queries!
# Total: 1 + N queries (100 users = 101 queries)
```

**Solutions**:

**Solution 1: Batch Fetch**
```python
# Fetch all order data in 1 query
user_ids = [u.id for u in users]
orders_by_user = get_orders_batch(user_ids)  # 1 query

for user in users:
    user.orders = orders_by_user[user.id]
```

**Solution 2: Join Query**
```sql
SELECT u.id, u.name, o.id, o.amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
```

**Solution 3: Denormalization + Caching**
```sql
-- Store order_count on users table
SELECT id, name, order_count FROM users;
```

---

### Issue 2: Missing Indexes (Slow Queries)

**Symptom**: Query takes 10+ seconds

**Diagnosis**:
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending' AND user_id = 123;
-- Output: "Seq Scan on orders" (bad - full table scan)
-- Output: "Index Scan using idx_user_status" (good - using index)
```

**Fix**:
```sql
-- Create composite index on filter columns
CREATE INDEX idx_user_status ON orders(user_id, status);
```

**Result**: 10s → 50ms (200x improvement!)

---

### Issue 3: Slow Writes (Too Many Indexes)

**Problem**: Every INSERT/UPDATE must update all indexes
```
Table has 10 indexes
INSERT 1 row → Must write to table + update 10 indexes
= 11 writes instead of 1
```

**Solution**: 
```sql
-- Review and remove unused indexes
DROP INDEX idx_unused;

-- Batch inserts instead of individual
INSERT INTO users VALUES 
  ('John'), ('Jane'), ('Bob');  -- 1 write vs 3
```

---

### Issue 4: Hot Shard (Uneven Load)

**Problem**:
```
Shard 1: 100K req/sec (HOT!)
Shard 2: 5K req/sec
Shard 3: 4K req/sec
```

**Causes**: Bad sharding key, skewed data

**Solutions**:
1. **Re-shard** with better key
2. **Consistent hashing** with virtual nodes
3. **Add read replicas** to hot shard
4. **Cache** frequently accessed data

---

### Issue 5: Database Connection Exhaustion

**Problem**:
```
Max connections: 100
Active connections: 100
New requests: REJECTED (can't connect)
```

**Causes**:
- Connections not returned to pool
- Slow queries hold connections
- Connection pool size too small

**Solutions**:

**Solution 1: Connection Pooling**
```python
# Without pooling: New connection per request (slow)
conn = create_connection()  # Creates socket, SSL handshake, etc.

# With pooling: Reuse connections
pool = ConnectionPool(max_size=50)
conn = pool.get()  # Fast - already connected
pool.release(conn)  # Return to pool
```

**Solution 2: Connection Timeout**
```python
# Close connections idle for > 5 minutes
pool.set_idle_timeout(300)

# Close connections stuck in query for > 30 seconds
pool.set_query_timeout(30)
```

---

### Issue 6: Slow Table Scans (SELECT *)

**Problem**:
```sql
SELECT * FROM users;
-- Fetches 100 columns, but only need 2
```

**Fix**:
```sql
SELECT id, name FROM users;
```

**Result**: 50MB → 2MB data transferred (25x improvement!)

---

### Issue 7: Lock Contention (Transaction Conflicts)

**Problem**:
```
Multiple processes updating same row simultaneously
Process 1: UPDATE users SET balance = balance - 100 WHERE id = 1
Process 2: UPDATE users SET balance = balance + 50 WHERE id = 1
→ Deadlock or slow execution
```

**Solutions**:
1. **Shorter transactions**: Release locks faster
2. **Optimistic locking**: Use version numbers
   ```sql
   UPDATE users SET balance = 100, version = 2 
   WHERE id = 1 AND version = 1;
   ```
3. **Partitioning**: Different rows → different locks → parallelism

---

## Database Selection Guide

### Use SQL (PostgreSQL/MySQL) When:
✓ Structured data with clear relationships  
✓ ACID transactions critical  
✓ Complex queries with joins  
✓ Data < 100GB fits on one machine  
**Examples**: SaaS platforms, financial systems, e-commerce

### Use Document DB (MongoDB) When:
✓ Flexible, evolving schema  
✓ Highly nested data  
✓ Need horizontal scaling  
✓ Developer velocity important  
**Examples**: Mobile apps, content management, IoT platforms

### Use Key-Value DB (Redis) When:
✓ Cache layer needed  
✓ Session/token storage  
✓ Real-time leaderboards  
✓ Sub-millisecond latency required  
**Examples**: Caching, rate limiting, real-time analytics

### Use Column-Family DB (Cassandra) When:
✓ Massive write throughput (millions/sec)  
✓ Time-series data  
✓ Multi-datacenter replication  
✓ Data > 10TB across cluster  
**Examples**: Metrics, logs, analytics

### Use Search DB (Elasticsearch) When:
✓ Full-text search needed  
✓ Complex filtering required  
✓ Analytics on logs  
✓ Autocomplete, suggestions  
**Examples**: Product search, logging, dashboards

---

## Interview Checklist

- [ ] Understand replication vs sharding (and when each)
- [ ] Know sharding strategies (range, hash, consistent hashing)
- [ ] Can identify hot shard problems and solutions
- [ ] Understand index types (B-tree, hash, composite)
- [ ] Can spot N+1 query problems
- [ ] Know ACID properties and isolation levels
- [ ] Can compare SQL vs NoSQL vs Document vs Key-Value
- [ ] Understand connection pooling concept
- [ ] Can design schema for scale (denormalization, indexing)
- [ ] Know common production issues (slow queries, hot shards, lock contention)
- [ ] Can select right database for problem
- [ ] Understand distributed transactions challenges

---

## Key Takeaways

1. **Pick right DB type**: SQL vs NoSQL vs KV—each solves different problems
2. **Sharding before you need it**: Hash distribution, consistent hashing, virtual nodes
3. **Indexes are critical**: B-tree for ranges, composite for multi-column queries
4. **Monitor, don't guess**: EXPLAIN ANALYZE, slow query logs, index usage
5. **Denormalize strategically**: Trade write complexity for read performance
6. **Connection pooling essential**: Resource management at scale
7. **Watch out for**: N+1 queries, missing indexes, hot shards, lock contention

- [ ] Know basic SELECT, WHERE, JOIN syntax
- [ ] Understand GROUP BY and aggregate functions
- [ ] Window functions (ROW_NUMBER, RANK, LAG/LEAD)
- [ ] Subqueries and CTEs (WITH clause)
- [ ] Dates and time functions
- [ ] Normalization (1NF, 2NF, 3NF)
- [ ] Indexes and their impact
- [ ] ACID properties and transactions
- [ ] Query optimization and EXPLAIN
- [ ] Denormalization tradeoffs

## Key Takeaways

1. **SQL is essential**: Know how to write efficient queries
2. **Indexes matter**: Can 1000x performance, but affect writes
3. **Normalize by default**: Denormalize only for proven performance gains
4. **Transactions are critical**: For data consistency in multi-step operations
5. **Understand joins**: INNER, LEFT, RIGHT, FULL—know when each applies
6. **Optimize with EXPLAIN**: Don't guess, measure query performance
