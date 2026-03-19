# Concurrency & Multithreading

## Overview

Concurrency is critical for building scalable backend systems. 60%+ of SDE 3 interviews involve concurrency concepts: thread safety, synchronization, deadlocks, and concurrent data structures. This guide covers practical concurrency patterns used at scale in production systems.

## Process vs Thread

### Process
- Independent program execution with separate memory space
- Separate heap, stack, code segment
- Context switch expensive (OS-level overhead)
- Inter-process communication (IPC) slower

### Thread
- Lightweight execution unit within single process
- Shared heap, separate stack per thread
- Context switch cheaper than processes
- Share memory directly (requires synchronization)

**Interview Context**: When asked "process vs thread," emphasize memory model and synchronization requirements.

## Threads in Java

### Thread Creation

**Option 1: Extend Thread Class**
```java
class MyThread extends Thread {
  public void run() {
    System.out.println("Thread running");
  }
}

MyThread t = new MyThread();
t.start(); // NOT t.run() directly!
```

**Option 2: Implement Runnable (Preferred)**
```java
class MyTask implements Runnable {
  public void run() {
    System.out.println("Task running");
  }
}

Thread t = new Thread(new MyTask());
t.start();

// Modern: Lambda
Thread t = new Thread(() -> System.out.println("Running"));
t.start();
```

**Why Runnable is preferred**: Single inheritance in Java; allows class to extend other base classes while implementing Runnable.

### Thread Lifecycle

```
NEW → RUNNABLE ⇄ RUNNING → WAITING → RUNNABLE → TERMINATED
      │                        ↑
      └─────────────────────────┘
        (yield, waits, notified)
```

**States**:
- **NEW**: Created but not started
- **RUNNABLE**: Ready or currently executing
- **BLOCKED**: Waiting to acquire lock
- **WAITING**: Explicitly waiting (wait(), join(), LockSupport.park())
- **TIMED_WAITING**: Time-limited wait (sleep(), wait(timeout), join(timeout))
- **TERMINATED**: Execution finished

### Thread Methods

| Method | Effect | Use Case |
|--------|--------|----------|
| `start()` | Begin thread execution | Always use to start thread |
| `run()` | Execute task (called by start) | Define task logic (override) |
| `join()` | Wait for thread to complete | Synchronize thread completion |
| `sleep(ms)` | Pause execution (doesn't release locks) | Delay, polling |
| `interrupt()` | Signal thread to stop (cooperatively) | Graceful shutdown |
| `isInterrupted()` | Check interrupt flag | Polling for interruption |
| `notify()` | Wake one waiting thread | Conditional synchronization |
| `notifyAll()` | Wake all waiting threads | Broadcast notification |
| `wait()` | Release lock, wait for notification | Condition-based coordination |
| `yield()` | Hint to scheduler to switch threads | Fair scheduling (unreliable) |

## Synchronization Fundamentals

### The Problem: Race Condition

```java
class Counter {
  private int count = 0;
  
  public void increment() {
    count++; // PROBLEM: Non-atomic operation
  }
  
  public int getCount() {
    return count;
  }
}

// Two threads increment concurrently
// Expected: 2, Actual: Could be 0 or 1 or 2 (DATA RACE!)
```

**Why?** `count++` expands to binary operations:
```
1. Read count value
2. Add 1
3. Write back

Two threads can interleave, overwriting each other's writes.
```

### Mutual Exclusion with Synchronized

```java
class Counter {
  private int count = 0;
  
  public synchronized void increment() {
    count++; // Protected by lock
  }
  
  public synchronized int getCount() {
    return count;
  }
}
```

**How it works**:
- Each object has intrinsic lock (monitor)
- `synchronized` acquires lock before entering method
- Releases lock on method exit (even if exception)
- Only one thread per object's lock (mutual exclusion)

**Complexity**:
- Lock acquisition: O(1) expected atomic operation
- Contention overhead: Threads waiting for lock degraded performance

### Synchronized Blocks

```java
public void complexMethod() {
  // Unsynchronized computation
  myExpensiveCalculation();
  
  // Critical section only
  synchronized(this) {
    sharedResource.update();
  }
  
  // More unsynchronized work
  moreCalculation();
}
```

**Benefit**: Minimize lock hold time (don't hold lock during I/O, calculations)

**Lock Reentrance**: Same thread can acquire same lock multiple times

```java
synchronized public void methodA() {
  synchronized(this) { // Same thread, same lock
    // Reentrant—allowed!
  }
}
```

## Visibility & Memory Model

### The Problem: Visibility Issue

```java
class StopFlag {
  private boolean stop = false;
  
  public void run() {
    while (!stop) { // Might see cached value!
      doWork();
    }
  }
  
  public void setStop() {
    stop = true; // Write visibility not guaranteed
  }
}

// Main thread sets stop=true
// Worker thread might never see update (cached in register)
```

### Solution: Volatile Keyword

```java
class StopFlag {
  private volatile boolean stop = false;
  
  // Now: Write always visible, reads see latest value
}
```

**Volatile semantics**:
- **Visibility**: Writes visible to all readers
- **Ordering guarantee**: Volatile write prevents reordering with subsequent operations
- **NO mutual exclusion**: Multiple threads can still see intermediate states

**When to use volatile**:
- Simple flags (stop, initialized)
- Status fields that don't require atomicity
- NOT for compound operations (volatile int i; i++) still unsafe

### Happens-Before Relationships

Java Memory Model defines ordering:

1. **Monitor lock**: Release before acquire (Unlock before next lock)
2. **Volatile**: Write visible before next read
3. **Thread.start()**: Action before run() executes
4. **Thread.join()**: run() completes before join() returns
5. **Transitivity**: A→B and B→C implies A→C

**Interview Question**: "What guarantees do we get from synchronized?"
- Mutual exclusion (only one thread in critical section)
- Visibility (changes visible to subsequent acquisitions)
- Ordering (no reordering across lock boundaries)

## Synchronization Issues

### Deadlock

```java
class A {
  synchronized void methodA(B b) {
    // Acquired: lock on A
    b.methodB(); // Wait: lock on B
  }
}

class B {
  synchronized void methodB() {
    // Need: We have lock on B, and need A
    // But A holds lock and waits for us → DEADLOCK
  }
}

// Thread 1: a.methodA(b) → holds A, waits for B
// Thread 2: b.methodB() → holds B, can't get A
```

**Conditions for deadlock** (all must be true):
1. **Mutual Exclusion**: Resources can't be shared
2. **Hold and Wait**: Thread holds resource and waits for another
3. **No Preemption**: Resource can't be forcibly taken
4. **Circular Wait**: Circular dependency in resource requests

**Prevention Strategies**:
- Lock ordering: Always acquire locks in same order across threads
- Timeout: Break deadlock with time limits
- Lock-free data structures: Avoid locks entirely
- Reduce scope: Minimize resources held

```java
// Safe pattern: Always A before B
synchronized(a) {
  synchronized(b) {
    // Work
  }
}
```

### Livelock

Threads keep taking actions but make no progress:

```java
class Utensil {
  synchronized void dine(Utensil other) {
    if (other.isBusy()) {
      this.putDown();
      // Release and retry
      return;
    }
    eat();
  }
}

// Thread 1 and 2: Both pick up fork, see other busy,
// put down fork, retry → endless loop but no deadlock
```

### Starvation

Low-priority thread never gets CPU due to continuous contention from higher-priority threads:

```java
// High-priority thread dominates:
while (true) {
  synchronized(lock) {
    doWork(); // Starves low-priority
  }
}
```

**Prevention**: Fair scheduling, higher-priority threads yield periodically

## Java Concurrency Utilities

### AtomicInteger / AtomicReference

Atomic operations without explicit locks:

```java
AtomicInteger counter = new AtomicInteger(0);

// Atomic operations
counter.incrementAndGet(); // ++ atomically
counter.getAndAdd(5);      // += atomically
counter.compareAndSet(0, 1); // CAS: Compare-And-Swap

int expected = 10;
int update = 20;
boolean success = counter.compareAndSet(expected, update);
// If counter == expected, set to update, return true
// Else return false
```

**Use atomic when**:
- Simple atomic operations needed
- No synchronized blocks needed
- Lock-free algorithms desired

**Performance**: Better than synchronized under high contention (atomic uses CAS instruction)

### Locks & Conditions

```java
Lock lock = new ReentrantLock();
Condition condition = lock.newCondition();

lock.lock();
try {
  while (!ready) {
    condition.await(); // Release lock, wait for signal
  }
  doWork();
} finally {
  lock.unlock();
}

// Another thread:
lock.lock();
try {
  ready = true;
  condition.signalAll(); // Wake waiting threads
} finally {
  lock.unlock();
}
```

**Advantages over synchronized wait/notify**:
- Multiple conditions per lock
- Timed waits: `condition.await(timeout, unit)`
- Fair lock: `new ReentrantLock(true)`
- More explicit control

### CountDownLatch

Synchronization point where threads wait for others:

```java
int count = 3;
CountDownLatch latch = new CountDownLatch(count);

// Thread 1, 2, 3: Do work
for (int i = 0; i < count; i++) {
  new Thread(() -> {
    doWork();
    latch.countDown(); // Signal completion
  }).start();
}

// Main thread: Wait for all to complete
latch.await(); // Blocks until count reaches 0
System.out.println("All done");
```

**Characteristic**: One-shot—can't reset

### CyclicBarrier

Reusable synchronization point where group threads meet:

```java
int parties = 3;
CyclicBarrier barrier = new CyclicBarrier(parties);

for (int i = 0; i < parties; i++) {
  new Thread(() -> {
    doPhase1Work();
    barrier.await(); // Wait for all
    
    doPhase2Work();
    barrier.await(); // Wait for all again
  }).start();
}
// Each phase waits for all threads to reach barrier
```

**Use cases**: Multi-phase computations, batch processing

### Semaphore

Controls access to limited resources:

```java
Semaphore semaphore = new Semaphore(3); // Allow 3 concurrent

for (int i = 0; i < 10; i++) {
  new Thread(() -> {
    semaphore.acquire(); // Get permit (blocks if none available)
    try {
      accessLimitedResource(); // Max 3 concurrent threads
    } finally {
      semaphore.release(); // Return permit
    }
  }).start();
}
```

**Use cases**: Connection pooling, resource throttling, rate limiting

### ConcurrentHashMap

Thread-safe HashMap without full synchronization:

```java
ConcurrentHashMap<String, Integer> map = 
  new ConcurrentHashMap<>();

map.put("key", 1); // Thread-safe
map.putIfAbsent("key", 2); // Atomic check-then-act
map.compute("key", (k, v) -> v == null ? 1 : v + 1); // Atomic function

// Iteration is not blocked by other operations
for (String key : map.keySet()) {
  System.out.println(key);
}
```

**How it works**: Segment locks (internal buckets), not full object lock

### CopyOnWriteArrayList

Thread-safe list optimized for read-heavy scenarios:

```java
CopyOnWriteArrayList<String> list = 
  new CopyOnWriteArrayList<>();

list.add("item"); // Creates new array copy (expensive)
list.addAll(Arrays.asList("a", "b")); // Full copy

// Iteration never throws ConcurrentModificationException
for (String item : list) {
  // Safe to modify list during iteration
  list.add("new");
}
```

**Use**: When reads >> writes (few modifications, many reads)

## Thread Pools & ExecutorService

### ExecutorService

```java
ExecutorService executor = Executors.newFixedThreadPool(10);

// Submit tasks
Future<Integer> future = executor.submit(() -> {
  return expensiveComputation();
});

// Wait for result
Integer result = future.get(5, TimeUnit.SECONDS); // Timeout

// Shutdown
executor.shutdown();
executor.awaitTermination(10, TimeUnit.SECONDS);
```

**Why thread pools?**:
- Thread creation is expensive
- Pool reuses threads (amortized cost)
- Control maximum concurrent threads
- Queue pending tasks (configurable queue)

**Types**:
```java
// Fixed: Fixed number of threads
ExecutorService fixed = Executors.newFixedThreadPool(10);

// Cached: Unbounded, thread reuse
ExecutorService cached = Executors.newCachedThreadPool();

// Single: Single worker thread with queue
ExecutorService single = Executors.newSingleThreadExecutor();

// Scheduled: Periodic/delayed tasks
ScheduledExecutorService scheduled = 
  Executors.newScheduledThreadPool(5);
scheduled.scheduleAtFixedRate(task, 0, 1, TimeUnit.SECONDS);
```

## Concurrent Design Patterns

### Producer-Consumer Pattern

```java
class ProducerConsumer {
  private Queue<Integer> queue = new LinkedList<>();
  private static final int CAPACITY = 10;
  private final Lock lock = new ReentrantLock();
  private final Condition notFull = lock.newCondition();
  private final Condition notEmpty = lock.newCondition();
  
  public void produce(int value) throws InterruptedException {
    lock.lock();
    try {
      while (queue.size() == CAPACITY) {
        notFull.await(); // Wait if full
      }
      queue.add(value);
      notEmpty.signalAll(); // Signal consumers
    } finally {
      lock.unlock();
    }
  }
  
  public int consume() throws InterruptedException {
    lock.lock();
    try {
      while (queue.isEmpty()) {
        notEmpty.await(); // Wait if empty
      }
      int value = queue.poll();
      notFull.signalAll(); // Signal producers
      return value;
    } finally {
      lock.unlock();
    }
  }
}
```

### Read-Write Lock Pattern

```java
class Cache<K, V> {
  private final Map<K, V> data = new HashMap<>();
  private final ReadWriteLock rwLock = 
    new ReentrantReadWriteLock();
  
  public V get(K key) {
    rwLock.readLock().lock();
    try {
      return data.get(key);
    } finally {
      rwLock.readLock().unlock();
    }
  }
  
  public void put(K key, V value) {
    rwLock.writeLock().lock();
    try {
      data.put(key, value);
    } finally {
      rwLock.writeLock().unlock();
    }
  }
}

// Multiple readers can proceed concurrently
// Writers block all readers and other writers
```

**Use**: Read-heavy workloads (cache, statistics)

### Thread-Safe Singleton Pattern

```java
class Singleton {
  private static Singleton instance;
  
  private Singleton() {}
  
  // Eager initialization (simplest)
  // static { instance = new Singleton(); }
  
  // Lazy initialization with double-check locking
  public static Singleton getInstance() {
    if (instance == null) { // Check without lock (fast path)
      synchronized(Singleton.class) {
        if (instance == null) { // Re-check with lock
          instance = new Singleton();
        }
      }
    }
    return instance;
  }
}

// Modern: Enum (thread-safe, serialization-safe)
enum Singleton {
  INSTANCE;
}
```

## Interview Patterns

### Q1: "Is this code thread-safe?"

```java
class UnsafeExample {
  private int counter = 0;
  
  public void increment() {
    counter++; // NO: Race condition
  }
}

class SafeExample {
  private volatile int counter = 0;
  
  public synchronized void increment() {
    counter++; // YES: Both volatile and sync
  }
}
```

**Answer**: Check for shared mutable state, atomicity of operations, visibility

### Q2: "Design a thread-safe LRU cache with capacity limit"

```java
class LRUCache<K, V> {
  private final int capacity;
  private final Map<K, V> cache = 
    new LinkedHashMap<K, V>(capacity, 0.75f, true) {
      protected boolean removeEldestEntry(Map.Entry eldest) {
        return size() > capacity;
      }
    };
  private final ReentrantReadWriteLock lock = 
    new ReentrantReadWriteLock();
  
  public V get(K key) {
    lock.readLock().lock();
    try {
      return cache.get(key);
    } finally {
      lock.readLock().unlock();
    }
  }
  
  public void put(K key, V value) {
    lock.writeLock().lock();
    try {
      cache.put(key, value);
    } finally {
      lock.writeLock().unlock();
    }
  }
}
```

### Q3: "Handle deadlock scenario in a multi-resource system"

**Deadlock scenario**: Threads A and B compete for resources R1 and R2

**Solution**: Lock ordering
```java
// ALWAYS acquire locks in same order
synchronized(R1) {
  synchronized(R2) {
    // Work safely
  }
}
```

## Key Takeaways

1. **synchronized**: Simplest synchronization; use for most cases
2. **volatile**: Only for simple flags (not for complex operations)
3. **AtomicX**: Low-contention simple operations (no locks needed)
4. **Lock/Condition**: Complex synchronization, multiple conditions, fairness
5. **ConcurrentHashMap**: Preferred over Hashtable/Collections.synchronizedMap()
6. **Deadlock prevention**: Lock ordering, timeouts, lock-free structures
7. **Choose thread count carefully**: Too few = low concurrency; too many = context switch overhead
8. **Know your utilities**: CountDownLatch, CyclicBarrier, Semaphore each solve specific problems
9. **Memory model matters**: Happens-before relationships determine visibility
10. **Test concurrency thoroughly**: Use stress tests, thread dumps, java.util.concurrent testing libraries
