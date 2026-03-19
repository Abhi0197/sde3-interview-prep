# Java Language Specialization

## Overview

Java remains the dominant language for backend systems at FAANG companies. This guide covers Java-specific knowledge expected for SDE 3 interviews: Collections framework, concurrency utilities, memory management, JVM concepts, and performance optimization.

## Java Collections Framework

### Core Interfaces Hierarchy

```
Collection
├── List (ordered, duplicates allowed)
│   ├── ArrayList (resizable array, random access O(1))
│   ├── LinkedList (doubly-linked list, insertion O(1))
│   └── CopyOnWriteArrayList (read-heavy, thread-safe)
├── Set (no duplicates, unordered)
│   ├── HashSet (O(1) lookup, no ordering)
│   ├── TreeSet (sorted, O(log n) operations)
│   ├── LinkedHashSet (insertion order preserved)
│   └── ConcurrentSkipListSet (sorted, thread-safe)
└── Queue (FIFO ordering)
    ├── LinkedList (doubly-linked, deque operations)
    ├── PriorityQueue (heap, priority-ordered)
    ├── ConcurrentLinkedQueue (lock-free)
    └── ArrayBlockingQueue (blocking, bounded)

Map
├── HashMap (O(1) average, no ordering)
├── TreeMap (sorted, O(log n) operations)
├── LinkedHashMap (insertion order preserved)
├── ConcurrentHashMap (thread-safe, segmented)
├── WeakHashMap (weak references, GC-eligible)
└── IdentityHashMap (reference equality)
```

### List Implementations

**ArrayList**:
```java
List<String> list = new ArrayList<>();
list.add("item");              // O(1) amortized
list.get(0);                   // O(1) random access
list.remove(0);                // O(n) shifts elements
list.add(5, "item");           // O(n)

// Use when: Random access dominant, minimal insertions/deletions
// Capacity: Grows by ~1.5x when full (amortized O(1) add)
```

**LinkedList**:
```java
LinkedList<String> list = new LinkedList<>();
list.add("item");              // O(1) append
list.addFirst("priority");     // O(1)
list.removeFirst();            // O(1)
list.get(5);                   // O(n) traversal
list.remove(0);                // O(1) if at front

// Use when: Frequent additions/removals at ends
// Not recommended for random access
// Deque operations available (stack/queue)
```

**Comparison**:
| Operation | ArrayList | LinkedList |
|-----------|-----------|-----------|
| Get(i) | O(1) | O(n) |
| Add/Remove (end) | O(1) amortized | O(1) |
| Add/Remove (middle) | O(n) | O(n) to find, O(1) to remove |
| Memory | Dense | Extra pointers |

### Set Implementations

**HashSet**:
```java
Set<Integer> set = new HashSet<>();
set.add(1);                    // O(1) average
set.contains(1);               // O(1) average
set.remove(1);                 // O(1) average
set.size();                    // O(1)

// Hash-based lookup
// Iteration order undefined
// Thread-unsafe; use Collections.synchronizedSet() if needed
```

**TreeSet**:
```java
Set<Integer> set = new TreeSet<>();
set.add(3);
set.add(1);
set.add(2);
// Automatically sorted: [1, 2, 3]

set.headSet(2);                // [1]—elements < 2
set.tailSet(2);                // [2, 3]—elements >= 2
set.subSet(1, 3);              // [1, 2]—range query

// All operations: O(log n) with red-black tree
// Use when: Sorted access or range queries needed
```

**Interview Tip**: Choice between HashSet and TreeSet:
- Hash: Fastest, unsorted
- Tree: Sorted, slower, range operations

### Map Implementations

**HashMap**:
```java
Map<String, Integer> map = new HashMap<>();
map.put("key", 1);             // O(1) average
map.get("key");                // O(1) average
map.containsKey("key");        // O(1) average
map.remove("key");             // O(1) average

// Custom hash function
Map<String, Integer> map2 = 
  new HashMap<String, Integer>(initialCapacity, loadFactor);
// Load factor: Rehash when 75% full (default)
// Rehashing cost: O(n) but amortized O(1) per operation
```

**TreeMap**:
```java
Map<Integer, String> map = new TreeMap<>();
map.put(3, "c");
map.put(1, "a");
map.put(2, "b");
// Iteration order: [1, 2, 3]—sorted by key

map.floorEntry(2);             // Entry(1, "a")—greatest <= 2
map.ceilingEntry(2);           // Entry(2, "b")—least >= 2
map.subMap(1, 3);              // {1, 2}—range

// All operations: O(log n) with red-black tree
// Use when: Sorted by key or range queries
```

**ConcurrentHashMap** (Thread-safe):
```java
ConcurrentHashMap<String, Integer> map = 
  new ConcurrentHashMap<>();

map.put("key", 1);             // O(1) average, thread-safe
map.putIfAbsent("key", 2);     // Atomic if-then-put
map.compute("key", (k, v) -> v == null ? 1 : v + 1);

// Internal segmentation (bucket locks)
// Iteration doesn't throw ConcurrentModificationException
// Safe for multi-threaded access without full synchronization
```

### Common Operations

**Iteration** (avoid ConcurrentModificationException):
```java
// ❌ WRONG: Modify collection during iteration
for (String item : list) {
  if (item.equals("target")) {
    list.remove(item); // Exception!
  }
}

// ✅ RIGHT: Use iterator
Iterator<String> it = list.iterator();
while (it.hasNext()) {
  if (it.next().equals("target")) {
    it.remove(); // Safe
  }
}

// ✅ RIGHT: Copy list first
List<String> toRemove = new ArrayList<>();
for (String item : list) {
  if (item.equals("target")) {
    toRemove.add(item);
  }
}
list.removeAll(toRemove);
```

**Sorting**:
```java
List<Integer> list = Arrays.asList(3, 1, 2);
Collections.sort(list);           // O(n log n)

// Custom comparator
Collections.sort(list, (a, b) -> b - a); // Descending

// Stream API
List<Integer> sorted = list.stream()
  .sorted()
  .collect(Collectors.toList());
```

## Java Concurrency Collections

### BlockingQueue

```java
BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(10);

// Producer
queue.put(1);                  // Block if queue full
queue.offer(2, 1, TimeUnit.SECONDS); // Don't block > timeout

// Consumer
int item = queue.take();       // Block if queue empty
int item2 = queue.poll(1, TimeUnit.SECONDS);
```

**Types**:
- `ArrayBlockingQueue`: Fixed size, bounded
- `LinkedBlockingQueue`: Unbounded (or bounded)
- `PriorityBlockingQueue`: Priority-ordered
- `SynchronousQueue`: Direct hand-off (0 capacity)

### ConcurrentLinkedQueue

```java
Queue<Integer> queue = new ConcurrentLinkedQueue<>();
queue.offer(1);                // Lock-free, thread-safe
queue.poll();                  // O(1)
```

**Use**: High concurrency, lock-free operations

### CopyOnWriteArrayList

```java
List<String> list = new CopyOnWriteArrayList<>();
list.add("item");              // O(n)—copies array
list.get(0);                   // O(1)
list.remove(0);                // O(n)—copies array

// Iteration never throws ConcurrentModificationException
for (String item : list) {
  list.add("new"); // Safe—iteration on snapshot
}
```

**Use**: Read-heavy workloads, safe iteration

## Generics in Java

### Type Erasure

```java
// At compile time:
List<String> list = new ArrayList<>();
list.add("item");

// At runtime: Type information ERASED
List list = new ArrayList(); // Raw type at runtime
// When accessing: String item = (String) list.get(0); // Implicit cast
```

**Implication**: Can't do runtime type checks:
```java
// ❌ WRONG: Can't check generic type at runtime
if (list instanceof List<String>) { } // Compile error

// ✅ RIGHT: Check raw type
if (list instanceof List) { } // OK

// Get actual class (requires reflection)
ClassType<?> type = list.getClass(); // Returns List class, not type param
```

### Wildcards & Bounds

```java
// Invariant (exact type)
void process(List<Number> list) { } // Only List<Number>

// Covariant (upper bound)
void read(List<? extends Number> list) { // List<Integer>, List<Double>, etc.
  Number n = list.get(0); // Safe—upper bound
  // list.add(1); // Unsafe—can't add (don't know exact type)
}

// Contravariant (lower bound)
void write(List<? super Number> list) {
  list.add(1); // Safe—adding Number or subclass
  // Number n = list.get(0); // Unsafe—could be Object
}

// Unbounded
void print(List<?> list) {
  System.out.println(list); // Works for any type
}
```

**PECS Rule** (Producer Extends, Consumer Super):
- **Extends**: When reading from collection (producer)
- **Super**: When writing to collection (consumer)

## Java Memory Model

### Heap vs Stack

**Stack**:
- Thread-local, automatic cleanup on method exit
- Stores primitive values, references
- LIFO (Last In First Out)
- Faster access, limited size (overflow → StackOverflowError)

**Heap**:
- Shared across threads
- Stores object data
- Manual (GC) cleanup when no references
- Larger size, slower access

```java
void method() {
  int x = 10;           // Stack: primitive value
  String s = "hello";   // Stack: reference; Heap: String object
  List list = new ArrayList(); // Stack: reference; Heap: ArrayList object
} // Stack cleanup when method returns; Heap objects eligible for GC
```

### Garbage Collection

**Mark-and-Sweep**:
```
1. Mark: Trace from roots (local variables, static fields), mark reachable objects
2. Sweep: Delete unmarked objects
```

**Generational Collection**:
```
Young Generation (Fast)
├── Eden space (new objects)
├── Survivor 0
└── Survivor 1

Old Generation (Slow)
└── Long-lived objects
```

**Process**:
1. New objects allocated in Eden
2. Young generation fills → Minor GC (fast, frequent)
3. Surviving objects → Old generation
4. Old generation fills → Major/Full GC (slow, rare)

**Interview Context**: GC pauses impact latency; know when GC occurs and tuning options

## Performance Optimization Patterns

### String Operations

```java
// ❌ SLOW: String concatenation in loop
String result = "";
for (int i = 0; i < 1000; i++) {
  result += "item" + i; // Creates new String each iteration O(n²)
}

// ✅ FAST: StringBuilder
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
  sb.append("item").append(i);
}
String result = sb.toString();
```

**Why**: String immutable; += creates new object, concatenates, discards old

### Collection Sizing

```java
// ❌ SLOW: HashMap rehashes multiple times as size grows
Map<String, Integer> map = new HashMap(); // Initial capacity 16
for (int i = 0; i < 1000; i++) {
  map.put("key" + i, i); // Multiple rehashes growing capacity
}

// ✅ FAST: Pre-size collection
Map<String, Integer> map = new HashMap(2000); // Capacity > 1.5 * expected size
// Reduces rehashing overhead
```

### ArrayList vs LinkedList

```java
// ❌ SLOW: Frequent insertions at beginning
List<Integer> list = new ArrayList<>();
for (int i = 0; i < 1000; i++) {
  list.add(0, i); // O(n) each insertion → O(n²) total
}

// ✅ FAST: If possible, append then sort
List<Integer> list = new ArrayList<>();
for (int i = 0; i < 1000; i++) {
  list.add(i);
}
Collections.sort(list); // O(n log n)
```

## Java Features & Idioms

### Equals and HashCode

```java
class User {
  private String id;
  private String name;
  
  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof User)) return false;
    User other = (User) obj;
    return this.id.equals(other.id);
  }
  
  @Override
  public int hashCode() {
    return id.hashCode(); // Consistent with equals
  }
}

// CONTRACT: If a.equals(b), then a.hashCode() == b.hashCode()
// Violation breaks HashMap/HashSet behavior
```

**Why important**: HashMap uses hashCode for bucket selection, equals for key matching

### Try-With-Resources

```java
// ❌ WRONG: Manual resource management (error-prone)
FileReader reader = new FileReader("file.txt");
try {
  // ...
} finally {
  reader.close(); // Can throw exception, masking original
}

// ✅ RIGHT: Try-with-resources (auto-closes)
try (FileReader reader = new FileReader("file.txt")) {
  // ...
} // Automatically calls close() even if exception
```

### Comparable vs Comparator

```java
// Comparable: Natural ordering
class User implements Comparable<User> {
  @Override
  public int compareTo(User other) {
    return this.id.compareTo(other.id);
  }
}

Collections.sort(users); // Uses natural order

// Comparator: Custom ordering
Comparator<User> byName = (a, b) -> a.name.compareTo(b.name);
Collections.sort(users, byName); // Uses custom order
```

### Stream API

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// Functional pipeline
int sum = numbers.stream()
  .filter(n -> n % 2 == 0)       // [2, 4]
  .map(n -> n * 2)               // [4, 8]
  .reduce(0, Integer::sum);      // 12

// Collect to new collection
List<Integer> evens = numbers.stream()
  .filter(n -> n % 2 == 0)
  .collect(Collectors.toList());

// Parallel stream (for large data)
long count = numbers.parallelStream()
  .filter(n -> n > 2)
  .count();
```

**Performance Note**: Streams add overhead; use for clarity, not speed

## Common Interview Patterns

### Q1: "Implement a thread-safe counter"

```java
class Counter {
  private int count = 0;
  
  // Option 1: Synchronized
  public synchronized void increment() {
    count++;
  }
  
  // Option 2: Atomic (better under contention)
  private AtomicInteger atomicCount = new AtomicInteger(0);
  
  public void increment() {
    atomicCount.incrementAndGet();
  }
}
```

### Q2: "Design a cache with capacity limit and eviction"

```java
class LRUCache<K, V> {
  private final int capacity;
  private final Map<K, V> cache = new LinkedHashMap<K, V>() {
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
      return size() > capacity;
    }
  };
  
  public V get(K key) {
    return cache.get(key); // LinkedHashMap updates access order
  }
  
  public void put(K key, V value) {
    if (cache.containsKey(key)) {
      cache.remove(key); // Reinsert at end for LRU order
    }
    cache.put(key, value);
  }
}
```

### Q3: "Sort a list of custom objects by multiple criteria"

```java
class User {
  String name;
  int age;
  
  // Multi-field comparator
  public static Comparator<User> BY_AGE_THEN_NAME =
    Comparator.comparingInt((User u) -> u.age)
      .thenComparing(u -> u.name);
}

List<User> users = Arrays.asList(...);
Collections.sort(users, User.BY_AGE_THEN_NAME);
```

## Key Takeaways

1. **Collections choice matters**: ArrayList for random access, LinkedList for frequent insertions/deletions
2. **HashMap vs TreeMap**: Hash for speed, Tree for ordering and range queries
3. **ConcurrentHashMap preferred**: Over Hashtable for thread-safe maps
4. **Generics are compile-time only**: Type erasure at runtime
5. **StringBuilder for string concatenation**: Especially in loops
6. **equals() and hashCode() must be consistent**: Contract violation breaks maps/sets
7. **Streams are functional**: Good for readability, not necessarily performance
8. **Atomic classes for simple synchronization**: Better than synchronized under high contention
9. **BlockingQueue for producer-consumer**: Standard pattern for inter-thread communication
10. **Memory model matters**: Volatile, synchronized, and happens-before relationships for visibility

## Java Version Features (Useful in Interviews)

### Java 8+: Functional Programming
- Lambdas, Streams, Functional interfaces

### Java 9+: Module System
- Encapsulation at module level

### Java 14+: Records
- Immutable data carriers (replacing POJO boilerplate)

### Java 15+: Sealed Classes
- Restrict inheritance hierarchy (useful for domain modeling)

### Java 17+: Pattern Matching (experimental)
- More expressive conditionals

**Interview Note**: Mention familiarity with recent features, but focus on core concepts that apply across versions

## Java Concurrency (Critical for Cloud Systems)\n\n### Threads & Synchronization\n\n```java\n// Thread basics\nclass Counter {\n  private int count = 0;\n  \n  // Option 1: Synchronized method (coarse-grain)\n  public synchronized void increment() {\n    count++;  // Thread-safe but full lock\n  }\n  \n  public synchronized int getCount() {\n    return count;\n  }\n}\n\n// Option 2: Synchronize specific block (fine-grain)\nclass FineCopiedCounter {\n  private int count = 0;\n  private final Object lock = new Object();\n  \n  public void increment() {\n    synchronized(lock) {  // Only protect critical section\n      count++;\n    }\n    // Some non-critical work without lock\n  }\n}\n\n// Option 3: Volatile (for simple flags; NOT for compound operations)\nclass FiniteFlag {\n  private volatile boolean running = true;  // JVM ensures visibility across threads\n  \n  public void stop() {\n    running = false;  // All threads see this immediately\n  }\n  \n  public boolean isRunning() {\n    return running;\n  }\n  \n  // WRONG: volatile doesn't prevent race condition here\n  // private volatile int count;\n  // public void increment() { count++; }  // NOT thread-safe!\n}\n\n// Option 4: Atomic classes (lock-free, high performance)\nclass AtomicCounter {\n  private AtomicInteger count = new AtomicInteger(0);\n  \n  public void increment() {\n    count.incrementAndGet();  // Atomic via CAS (compare-and-swap)\n  }\n  \n  public int getCount() {\n    return count.get();\n  }\n}\n\n// Option 5: ReadWriteLock (multiple readers, exclusive writer)\nclass CachedData {\n  private String data;\n  private final ReadWriteLock lock = new ReentrantReadWriteLock();\n  \n  public String readData() {\n    lock.readLock().lock();\n    try {\n      return data;  // Multiple threads can read concurrently\n    } finally {\n      lock.readLock().unlock();\n    }\n  }\n  \n  public void updateData(String newData) {\n    lock.writeLock().lock();\n    try {\n      data = newData;  // Exclusive access for writes\n    } finally {\n      lock.writeLock().unlock();\n    }\n  }\n}\n```\n\n**Interview Tip**: Synchronized slows down under high contention. Atomic classes (CAS-based) perform better. ReadWriteLock for read-heavy workloads.\n\n### Java Memory Model (Happens-Before)\n\nCrucial for understanding visibility across threads:\n\n```java\nclass DataHolder {\n  private int value = 0;\n  private volatile boolean ready = false;  // Volatile creates happens-before edge\n  \n  public void writer() {\n    value = 42;  // This happens-before...\n    ready = true;  // ...this write\n  }\n  \n  public void reader() {\n    while (!ready) ;  // Spin until read\n    System.out.println(value);  // Guaranteed to see 42 (not 0)\n    // Without volatile on ready, compiler could optimize away check\n  }\n}\n\n// Happens-before rules:\n// 1. synchronized: Exit lock happens-before entering same lock\n// 2. volatile: Write happens-before read of same variable\n// 3. start(): action before start() happens-before thread runs\n// 4. join(): thread completion happens-before return from join()\n// 5. Release/acquire (virtual threads)\n```\n\n### Virtual Threads (Java 19+, Game Changer for 2026)\n\nVirtual threads are lightweight, allowing millions of concurrent tasks. New standard for I/O-bound applications.\n\n```java\n// Old way: Thread per request (limited concurrency)\nexecutor = new ThreadPoolExecutor(\n  50,  // core threads\n  50,  // max threads  \n  keepaliveTime, SECONDS,\n  new LinkedBlockingQueue<>()\n);\n// Only ~50 concurrent requests! Memory overhead per thread: ~2MB\n\n// New way: Virtual threads (Java 21+)\nexecutor = Executors.newVirtualThreadPerTaskExecutor();\n// Millions of virtual threads! Memory overhead: ~KB per thread\n\n// Create virtual thread\nThread vthread = Thread.ofVirtual()\n  .name(\"virtual-worker-1\")\n  .start(() -> {\n    System.out.println(\"Running on virtual thread\");\n  });\n\n// Async HTTP request without callback hell\nvar client = HttpClient.newHttpClient();\nvar request = HttpRequest.newBuilder()\n  .uri(URI.create(\"https://api.example.com/data\"))\n  .build();\n\n// Old: async with callback\nclient.sendAsync(request, HttpResponse.BodyHandlers.ofString())\n  .thenApply(HttpResponse::body)\n  .thenAccept(System.out::println);\n\n// New: sync code on virtual thread (transparent async)\ntry {\n  var response = client.send(request, HttpResponse.BodyHandlers.ofString());\n  System.out.println(response.body());  // Looks sync, actually async!\n} catch (IOException | InterruptedException e) {\n  // Handle\n}\n\n// Virtual threads automatically park on blocking I/O\n// Scheduler transparently moves thread to CPU when ready\n```\n\n**Interview Tip**: Virtual threads fundamentally change Java concurrency. By 2026, expect questions like \"How would you structure this app with virtual threads?\"\n\n### CompletableFuture (Non-blocking Async)\n\nFor high-latency operations (microservices, external APIs):\n\n```java\n// Create completed future\nCompletableFuture<String> future = CompletableFuture.completedFuture(\"result\");\n\n// Async computation\nCompletableFuture<Integer> asyncTask = CompletableFuture.supplyAsync(() -> {\n  return expensiveOperation();  // Runs in ForkJoinPool\n});\n\n// Chain operations (non-blocking)\nasyncTask\n  .thenApply(x -> x * 2)  // Transform result\n  .thenAccept(result -> System.out.println(result))  // Consume result\n  .exceptionally(e -> {\n    System.err.println(\"Error: \" + e.getMessage());\n    return null;\n  });\n\n// Parallel async operations\nCompletableFuture<String> user = fetchUser(id);\nCompletableFuture<List<Post>> posts = fetchPosts(userId);\n\nCompletableFuture<UserProfile> combined = \n  user.thenCombine(posts, (u, p) -> {\n    return new UserProfile(u, p);\n  });\n\n// Wait for all (with timeout)\nCompletableFuture.allOf(\n  fetchUser(1),\n  fetchUser(2),\n  fetchUser(3)\n).get(5, TimeUnit.SECONDS);  // Timeout after 5s\n\n// Handle completion (regardless of success/failure)\nfuture.handle((result, exception) -> {\n  if (exception != null) {\n    return \"default\";\n  }\n  return result;\n});\n```\n\n**Know**: CompletableFuture for microservice calls, external APIs, parallel tasks\n\n## Spring Framework & Spring Boot\n\nUbiquitous in enterprise Java. Spring Boot is the go-to for new projects in 2026.\n\n### Spring Boot Basics\n\n```java\n// Application entry point\n@SpringBootApplication\npublic class ApiApplication {\n  public static void main(String[] args) {\n    SpringApplication.run(ApiApplication.class, args);\n  }\n}\n\n// Auto-configures: Tomcat, database, logging, metrics\n// Minimal boilerplate compared to raw Spring\n```\n\n### REST Controller\n\n```java\n@RestController\n@RequestMapping(\"/api/users\")\n@Slf4j  // Lombok: provides log field\npublic class UserController {\n  \n  @Autowired  // Dependency injection\n  private UserService userService;\n  \n  @GetMapping\n  public ResponseEntity<List<User>> getUsers() {\n    List<User> users = userService.getAllUsers();\n    return ResponseEntity.ok(users);  // 200 OK\n  }\n  \n  @GetMapping(\"/{id}\")\n  public ResponseEntity<User> getUser(@PathVariable Long id) {\n    return userService.getUserById(id)\n      .map(ResponseEntity::ok)         // 200 + body\n      .orElse(ResponseEntity.notFound().build());  // 404\n  }\n  \n  @PostMapping\n  @ResponseStatus(HttpStatus.CREATED)  // 201\n  public User createUser(@Valid @RequestBody CreateUserRequest req) {\n    // @Valid triggers validation based on annotations\n    return userService.createUser(req);\n  }\n  \n  @PutMapping(\"/{id}\")\n  public User updateUser(@PathVariable Long id, \n                         @RequestBody UpdateUserRequest req) {\n    return userService.updateUser(id, req);\n  }\n  \n  @DeleteMapping(\"/{id}\")\n  @ResponseStatus(HttpStatus.NO_CONTENT)  // 204\n  public void deleteUser(@PathVariable Long id) {\n    userService.deleteUser(id);\n  }\n  \n  @ExceptionHandler(ResourceNotFoundException.class)\n  @ResponseStatus(HttpStatus.NOT_FOUND)\n  public ErrorResponse handleNotFound(ResourceNotFoundException e) {\n    return new ErrorResponse(\"NOT_FOUND\", e.getMessage());\n  }\n}\n```\n\n### Service Layer (Business Logic)\n\n```java\n@Service  // Marks as bean; handles lifecycle\n@Transactional(readOnly = true)  // DB transactions\n@Slf4j\npublic class UserService {\n  \n  @Autowired\n  private UserRepository userRepository;\n  \n  @Autowired\n  private CacheManager cacheManager;  // For caching\n  \n  public Optional<User> getUserById(Long id) {\n    return userRepository.findById(id);\n  }\n  \n  @Transactional(readOnly = false)  // Writable transaction\n  public User createUser(CreateUserRequest req) {\n    // Validate\n    if (userRepository.existsByEmail(req.getEmail())) {\n      throw new DuplicateEmailException(req.getEmail());\n    }\n    \n    // Create and save\n    User user = new User(req.getName(), req.getEmail());\n    return userRepository.save(user);\n  }\n  \n  @Cacheable(\"users\")  // Cache result\n  public List<User> getAllUsers() {\n    return userRepository.findAll();\n  }\n  \n  @CacheEvict(\"users\")  // Clear cache on update\n  @Transactional(readOnly = false)\n  public User updateUser(Long id, UpdateUserRequest req) {\n    User user = userRepository.findById(id)\n      .orElseThrow(() -> new ResourceNotFoundException(\"User not found\"));\n    \n    user.setName(req.getName());\n    return userRepository.save(user);\n  }\n  \n  // Async method (returns future)\n  @Async\n  public CompletableFuture<List<User>> getAllUsersAsync() {\n    return CompletableFuture.completedFuture(userRepository.findAll());\n  }\n}\n```\n\n### Repository (Data Access)\n\n```java\n@Repository  // DAO/Repository pattern\npublic interface UserRepository extends JpaRepository<User, Long> {\n  // Derived query methods\n  Optional<User> findByEmail(String email);\n  boolean existsByEmail(String email);\n  \n  List<User> findByStatusOrderByCreatedDateDesc(UserStatus status);\n  \n  // Custom query\n  @Query(\"SELECT u FROM User u WHERE u.email = :email\")\n  Optional<User> findUserByEmail(@Param(\"email\") String email);\n  \n  // Native SQL\n  @Query(value = \"SELECT * FROM users WHERE status = ?\", nativeQuery = true)\n  List<User> findActiveUsers(String status);\n}\n\n// JpaRepository provides: save, findById, findAll, delete, etc.\n```\n\n### Entity & ORM (JPA/Hibernate)\n\n```java\n@Entity\n@Table(name = \"users\", indexes = {\n  @Index(name = \"idx_email\", columnList = \"email\", unique = true)\n})\n@Data  // Lombok: generates getters, setters, equals, hashCode, toString\n@NoArgsConstructor\npublic class User {\n  \n  @Id\n  @GeneratedValue(strategy = GenerationType.IDENTITY)\n  private Long id;\n  \n  @Column(nullable = false, length = 255)\n  private String name;\n  \n  @Column(nullable = false, unique = true)\n  private String email;\n  \n  @Enumerated(EnumType.STRING)\n  private UserStatus status = UserStatus.ACTIVE;\n  \n  @CreationTimestamp  // Hibernate annotation\n  private LocalDateTime createdAt;\n  \n  @UpdateTimestamp\n  private LocalDateTime updatedAt;\n  \n  // One-to-Many relationship\n  @OneToMany(mappedBy = \"user\", cascade = CascadeType.ALL, orphanRemoval = true)\n  private List<Post> posts = new ArrayList<>();\n  \n  // Many-to-One relationship\n  @ManyToOne(fetch = FetchType.LAZY)  // LAZY: avoid N+1 queries\n  @JoinColumn(name = \"team_id\")\n  private Team team;\n}\n\n@Entity\npublic class Post {\n  @Id\n  @GeneratedValue(strategy = GenerationType.IDENTITY)\n  private Long id;\n  \n  private String title;\n  \n  @ManyToOne(fetch = FetchType.LAZY)\n  @JoinColumn(name = \"user_id\")\n  private User user;\n}\n```\n\n**Lazy vs Eager Loading**:\n- `FetchType.LAZY`: Load only when accessed (avoid N+1 with proper queries)\n- `FetchType.EAGER`: Always load relation (can be inefficient if not needed)\n\n### Application Properties\n\n```properties\n# application.properties (or application.yml)\nspring.application.name=my-api\nserver.port=8080\nserver.servlet.context-path=/api\n\n# Database\nspring.datasource.url=jdbc:mysql://localhost:3306/mydb\nspring.datasource.username=root\nspring.datasource.password=password\nspring.jpa.hibernate.ddl-auto=validate  # Never auto-create in prod\nspring.jpa.show-sql=false\nspring.jpa.properties.hibernate.generate_statistics=true\n\n# Connection pool (HikariCP default)\nspring.datasource.hikari.maximum-pool-size=10\nspring.datasource.hikari.minimum-idle=2\nspring.datasource.hikari.connection-timeout=20000\n\n# Logging\nlogging.level.root=INFO\nlogging.level.com.mycompany=DEBUG\nlogging.pattern.console=%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n\n```\n\n## Testing Framework (JUnit 5 & Mockito)\n\n```java\n@SpringBootTest  // Full application context\nclass UserServiceTest {\n  \n  @Autowired\n  private UserService userService;\n  \n  @MockBean  // Mock repository\n  private UserRepository userRepository;\n  \n  @BeforeEach\n  void setUp() {\n    // Setup before each test\n  }\n  \n  @Test\n  void shouldCreateUser() {\n    // Arrange\n    CreateUserRequest request = new CreateUserRequest(\"John\", \"john@ex.com\");\n    User expectedUser = new User(1L, \"John\", \"john@ex.com\");\n    \n    when(userRepository.save(any(User.class)))\n      .thenReturn(expectedUser);\n    \n    // Act\n    User result = userService.createUser(request);\n    \n    // Assert\n    assertThat(result).isNotNull();\n    assertThat(result.getEmail()).isEqualTo(\"john@ex.com\");\n    verify(userRepository, times(1)).save(any(User.class));\n  }\n  \n  @Test\n  void shouldThrowWhenDuplicateEmail() {\n    // Arrange\n    when(userRepository.existsByEmail(\"john@ex.com\"))\n      .thenReturn(true);\n    \n    // Act & Assert\n    assertThrows(DuplicateEmailException.class, () -> {\n      userService.createUser(new CreateUserRequest(\"John\", \"john@ex.com\"));\n    });\n  }\n}\n\n// Unit test (no context)\nclass CalculatorTest {\n  private Calculator calculator;\n  \n  @BeforeEach\n  void setUp() {\n    calculator = new Calculator();\n  }\n  \n  @Test\n  void shouldAdd() {\n    int result = calculator.add(2, 3);\n    assertEquals(5, result);\n  }\n  \n  @ParameterizedTest\n  @ValueSource(ints = { 1, 2, 3 })\n  void shouldBePositive(int number) {\n    assertTrue(number > 0);\n  }\n}\n```\n\n## Cloud Deployment Patterns\n\n### Docker\n\n```dockerfile\nFROM eclipse-temurin:21-jre-alpine\nWORKDIR /app\nCOPY target/app.jar application.jar\n\nENTRYPOINT [\"java\",\"-Xmx256m\",\"-Xms128m\",\"-jar\",\"application.jar\"]\nEXPOSE 8080\n```\n\n### Kubernetes Deployment\n\n```yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: user-api\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n      - name: app\n        image: myregistry/user-api:latest\n        ports:\n        - containerPort: 8080\n        env:\n        - name: SPRING_DATASOURCE_URL\n          valueFrom:\n            secretKeyRef:\n              name: db-secret\n              key: url\n        - name: SPRING_DATASOURCE_PASSWORD\n          valueFrom:\n            secretKeyRef:\n              name: db-secret\n              key: password\n        livenessProbe:\n          httpGet:\n            path: /actuator/health\n            port: 8080\n          initialDelaySeconds: 30\n        readinessProbe:\n          httpGet:\n            path: /actuator/health/readiness\n            port: 8080\n          initialDelaySeconds: 5\n```\n\n### Spring Cloud for Microservices\n\n```java\n// Service discovery\n@EnableDiscoveryClient\n@SpringBootApplication\npublic class UserService {\n  // Automatically registers with Eureka/Consul\n}\n\n// Server-side load balancing\n@Configuration\npublic class RestClientConfig {\n  @Bean\n  public RestTemplate restTemplate() {\n    return new RestTemplate();\n  }\n  \n  // Access other services by name\n  // GET http://order-service/api/orders/123 (load-balanced)\n}\n\n// Circuit breaker (Resilience4j)\n@Service\npublic class UserServiceClient {\n  \n  @CircuitBreaker(name = \"userService\")\n  @Retry(name = \"userService\")\n  @Timeout(name = \"userService\")\n  public User getUser(Long id) {\n    return restTemplate.getForObject(\n      \"http://user-service/api/users/\" + id, User.class\n    );\n  }\n}\n\n// Application.yml configuration\n# resilience4j:\n#   circuitbreaker:\n#     instances:\n#       userService:\n#         slidingWindowSize: 10\n#         failureRateThreshold: 50.0\n#         waitDurationInOpenState: 60s\n```\n\n## Optional & Null Handling\n\nModern Java avoids null pointer exceptions:\n\n```java\n// Traditional (null checks everywhere)\nUser user = repository.findById(1L);\nif (user != null) {\n  String email = user.getEmail();\n  if (email != null) {\n    System.out.println(email.toLowerCase());\n  }\n}\n\n// Modern (Optional-based)\nrepository.findById(1L)\n  .map(User::getEmail)\n  .map(String::toLowerCase)\n  .ifPresent(System.out::println);\n\n// Handling absence\nString email = repository.findById(1L)\n  .map(User::getEmail)\n  .orElse(\"unknown@example.com\");  // Default value\n\nUser user = repository.findById(1L)\n  .orElseThrow(() -> new ResourceNotFoundException(\"User not found\"));\n\n// Chaining operations safely\nCompletableFuture<String> result = \n  CompletableFuture.of(findUser(id))\n    .thenApply(User::getEmail)\n    .thenApply(String::toLowerCase);\n```\n\n## Performance Optimization\n\n### Profiling\n\n```bash\n# Generate CPU profile\njava -XX:+UnlockDiagnosticVMOptions -XX:+TraceClassLoading myapp.jar\n\n# Heap dump\njmap -dump:live,format=b,file=heapdump.bin <pid>\njhat heapdump.bin  # Analyze in browser\n\n# Continuous profiling (production)\n# Use async-profiler: async-profiler.sh -d 30 -f myprofile.html <pid>\n```\n\n### Query Optimization\n\n```java\n// N+1 query problem\n// \u274c SLOW\nList<User> users = userRepository.findAll();\nfor (User user : users) {\n  System.out.println(user.getPosts());  // Extra query per user!\n}\n\n// \u2705 FAST: Eager loading\n@Query(\"SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.posts\")\nList<User> findAllWithPosts();\n\n// Or use EntityGraph\n@Repository\npublic interface UserRepository extends JpaRepository<User, Long> {\n  @EntityGraph(attributePaths = {\"posts\"})\n  List<User> findAll();\n}\n```\n\n### JVM Tuning\n\n```bash\n# Heap sizing (set initial = max to avoid resizing pauses)\njava -Xms2g -Xmx2g \\\n  -XX:+UseG1GC \\\n  -XX:MaxGCPauseMillis=200 \\\n  -XX:+ParallelRefProcEnabled \\\n  -jar app.jar\n\n# Analyze GC logs\njava -XX:+PrintGCDetails -XX:+PrintGCTimeStamps \\\n  -Xloggc:gc.log \\\n  -jar app.jar\n```\n\n## Design Patterns for Cloud Apps\n\n### Dependency Injection (Core Spring)\n\nAutomatically manage object lifecycle and dependencies.\n\n### Factory Pattern (Service Creation)\n\n```java\n@Configuration\npublic class ServiceFactory {\n  @Bean\n  public UserService userService() {\n    return new UserService(userRepository());\n  }\n  \n  @Bean\n  public UserRepository userRepository() {\n    return new JpaUserRepository();\n  }\n}\n```\n\n### Builder Pattern (Immutable Objects)\n\n```java\n@Builder\n@Getter\npublic class User {\n  private final Long id;\n  private final String name;\n  private final String email;\n}\n\n// Usage\nUser user = User.builder()\n  .id(1L)\n  .name(\"John\")\n  .email(\"john@ex.com\")\n  .build();\n```\n\n### Strategyategy Pattern (Runtime Behavior)\n\n```java\ninterface PaymentStrategy {\n  void pay(BigDecimal amount);\n}\n\nclass CreditCardPayment implements PaymentStrategy {\n  public void pay(BigDecimal amount) { /* ... */ }\n}\n\nclass Order {\n  private PaymentStrategy payment;\n  \n  public Order(PaymentStrategy payment) {\n    this.payment = payment;\n  }\n  \n  public void checkout() {\n    payment.pay(totalAmount);\n  }\n}\n```\n\n## Interview Checklist (Java/Cloud 2026)\n\n### Core Fundamentals\n- [ ] Collections framework hierarchy and use cases\n- [ ] HashMap vs TreeMap vs ConcurrentHashMap trade-offs\n- [ ] Generics: wildcards, bounds, type erasure\n- [ ] Streams API: filter, map, reduce, terminal operations\n\n### Concurrency\n- [ ] Synchronization: monitors, happens-before relationships\n- [ ] Volatile and visibility guarantees\n- [ ] AtomicInteger vs synchronized vs ReadWriteLock\n- [ ] Virtual threads (Java 19+) and their advantages\n- [ ] CompletableFuture and async patterns\n\n### Spring Boot (Mandatory 2026)\n- [ ] @SpringBootApplication, @RestController, @Service, @Repository\n- [ ] Dependency injection and wiring\n- [ ] REST controller mapping, request/response handling\n- [ ] Transaction management (@Transactional)\n- [ ] Spring Data JPA and derived queries\n\n### Database\n- [ ] JPA/Hibernate entities and relationships\n- [ ] Lazy vs eager loading, N+1 prevention\n- [ ] Connection pooling (HikariCP)\n- [ ] Transactional consistency and isolation levels\n- [ ] Query optimization and indexing\n\n### Cloud Deployment\n- [ ] Docker containerization\n- [ ] Kubernetes basics (pods, deployments, services)\n- [ ] Health checks and liveness/readiness probes\n- [ ] Configuration externalization (environment variables, secrets)\n- [ ] Horizontal scaling and load balancing\n\n### Testing\n- [ ] JUnit 5 and Mockito\n- [ ] @SpringBootTest vs @DataJpaTest\n- [ ] Mocking dependencies with @MockBean\n- [ ] Parameterized tests\n\n### Performance\n- [ ] GC tuning and heap sizing\n- [ ] Query optimization and N+1 problem\n- [ ] Connection pooling configuration\n- [ ] Async patterns for I/O operations\n- [ ] Profiling tools and heap dump analysis\n\n### Security\n- [ ] Spring Security for authentication/authorization\n- [ ] JWT token handling\n- [ ] SQL injection prevention (parameterized queries)\n- [ ] CORS and CSRF protection\n\n## Key Takeaways (2026 Java)\n\n1. **Virtual threads change the game**: Design for millions of concurrent tasks\n2. **Spring Boot is standard**: Almost all new Java projects use it\n3. **Async is required**: CompletableFuture, microservice orchestration\n4. **Cloud-native patterns essential**: Docker, Kubernetes, health checks\n5. **Concurrency fundamentals critical**: Happens-before, AtomicInteger, locks\n6. **Testing is non-negotiable**: JUnit + Mockito in every project\n7. **Optional over null**: Use Optional.map().orElseThrow()\n8. **JPA relationships careful**: Understand lazy loading, N+1 queries\n9. **Performance tuning matters**: GC logs, heap profiling, connection pools\n10. **Cloud migrations common**: Design for stateless scaling from day one
