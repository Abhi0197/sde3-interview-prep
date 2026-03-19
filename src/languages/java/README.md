# Java Language Specialization

## Overview

Java remains the dominant language for backend systems at FAANG companies. This guide covers Java-specific knowledge expected for SDE 3 interviews: Collections framework, concurrency utilities, memory management, JVM concepts, and performance optimization.

## 📚 Java Collections Framework

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

**ArrayList - Random Access**:
```java
List<String> list = new ArrayList<>();
list.add("item");              // O(1) amortized
list.get(0);                   // O(1) random access
list.remove(0);                // O(n) shifts elements
list.add(5, "item");           // O(n)

// Use when: Random access dominant, minimal insertions/deletions
// Capacity: Grows by ~1.5x when full (amortized O(1) add)
```

**LinkedList - Insertion/Deletion**:
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

**HashSet - O(1) Operations**:
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

**TreeSet - Sorted, Range Queries**:
```java
Set<Integer> set = new TreeSet<>();
set.add(3); set.add(1); set.add(2);
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

**HashMap - O(1) Fast Lookup**:
```java
Map<String, Integer> map = new HashMap<>();
map.put("key", 1);             // O(1) average
map.get("key");                // O(1) average
map.containsKey("key");        // O(1) average
map.remove("key");             // O(1) average

// Custom sizing
Map<String, Integer> map2 = 
  new HashMap<String, Integer>(initialCapacity, loadFactor);
// Load factor: Rehash when 75% full (default)
// Rehashing cost: O(n) but amortized O(1) per operation
```

**TreeMap - Sorted Keys, Range Operations**:
```java
Map<Integer, String> map = new TreeMap<>();
map.put(3, "c"); map.put(1, "a"); map.put(2, "b");
// Iteration order: [1, 2, 3]—sorted by key

map.floorEntry(2);             // Entry(1, "a")—greatest <= 2
map.ceilingEntry(2);           // Entry(2, "b")—least >= 2
map.subMap(1, 3);              // {1, 2}—range

// All operations: O(log n) with red-black tree
// Use when: Sorted by key or range queries
```

**ConcurrentHashMap - Thread-Safe**:
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

### Failed-Safe Iteration

```java
// ✅ SAFE: Using iterator
Iterator<String> it = list.iterator();
while (it.hasNext()) {
  if (it.next().equals("target")) {
    it.remove();  // Safe during iteration
  }
}

// ✅ SAFE: Copy list first
List<String> toRemove = new ArrayList<>();
for (String item : list) {
  if (item.equals("target")) {
    toRemove.add(item);
  }
}
list.removeAll(toRemove);

// ❌ WRONG: Direct modification
for (String item : list) {
  if (item.equals("target")) {
    list.remove(item);  // ConcurrentModificationException!
  }
}
```

**Interview Question**: "How do you safely modify a collection during iteration?"
Answer: Use iterator.remove(), copy then removeAll(), or CopyOnWriteArrayList for readers.

### Sorting Collections

```java
List<Integer> list = Arrays.asList(3, 1, 2);
Collections.sort(list);           // O(n log n)

// Custom comparator (descending)
Collections.sort(list, (a, b) -> b - a);

// Stream API
List<Integer> sorted = list.stream()
  .sorted()
  .collect(Collectors.toList());

// Sort then custom comparator
List<User> users = Arrays.asList(...);
Collections.sort(users, 
  Comparator.comparingInt((User u) -> u.age)
    .thenComparing(u -> u.name));
```

## Java Generics

### Type Erasure (Critical Interview Topic)

```java
// At COMPILE TIME: Full type info
List<String> list = new ArrayList<String>();
list.add("hello");

// At RUNTIME: Type info ERASED
List list = new ArrayList();  // Raw type
// Accessing: String item = (String) list.get(0);  // Implicit cast added by compiler
```

**Implication**: Can't check generic types at runtime:
```java
// ❌ COMPILE ERROR: Can't check generic type at runtime
if (list instanceof List<String>) { }

// ✅ CORRECT: Check raw type
if (list instanceof List) { }

// Get runtime class (requires reflection)
Class<?> type = list.getClass();  // Returns List class, not <String>
```

**Interview Question**: "Why can't you do `instanceof List<String>`?"
Answer: Type erasure. Generic type info is compile-time only, not available at runtime.

### Wildcards & PECS Rule

```java
// Invariant (exact type)
void process(List<Number> list) { }  // Only List<Number>

// Covariant (upper bound) - PRODUCER EXTENDS
void read(List<? extends Number> list) {
  Number n = list.get(0);  // Safe—upper bound guarantees Number
  // list.add(1);  // ❌ Unsafe—don't know actual type
}

// Contravariant (lower bound) - CONSUMER SUPER
void write(List<? super Number> list) {
  list.add(1);  // ✅ Safe—adding Number or subclass
  // Number n = list.get(0);  // ❌ Unsafe—could be Object
}

// Unbounded
void print(List<?> list) {
  System.out.println(list);  // Works for any type
}

// PECS Rule: Producer Extends, Consumer Super
// Reading from collection? Use extends
// Writing to collection? Use super
```

## Java Memory Model

### Heap vs Stack

**Stack (Thread-Local)**:
- Automatic cleanup on method exit
- Stores primitive values and object references
- LIFO: Last In First Out
- Faster access, smaller size (StackOverflowError if exceed)

**Heap (Shared)**:
- Garbage-collected when no references
- Stores object data
- Larger size, slower access

```java
void method() {
  int x = 10;           // Stack: primitive value
  String s = "hello";   // Stack: reference; Heap: String object
  List list = new ArrayList();  // Stack: ref; Heap: ArrayList object
}  // Stack cleanup; Heap objects eligible for GC if no more refs
```

### Garbage Collection

**Mark-and-Sweep Algorithm**:
```
1. Mark: Trace from roots (locals, statics), mark reachable objects
2. Sweep: Delete unmarked objects
* Pause the world (stop all threads during collection)
```

**Generational Collection (Most JVMs)**:
```
Young Generation (Fast GC)
├── Eden space (new objects allocated here)
├── Survivor 0 (young survivors)
└── Survivor 1 (young survivors)

Old Generation (Slow GC)
└── Long-lived objects (moved after multiple young GCs)

Permanent/Metaspace
└── Class definitions, method metadata
```

**Process**:
1. New objects → Eden space
2. Eden fills → Minor GC (fast, frequent)
3. Surviving objects → Survivor → Old generation
4. Old generation fills → Major/Full GC (slow, rare, pause world)

**Interview Context**: GC pauses impact latency; optimize allocation patterns and heap sizing.

## 🔄 Concurrency (Critical for Cloud Systems)

### Threads & Synchronization

**5 Synchronization Approaches**:

```java
// Option 1: Synchronized method (coarse-grain lock)
class Counter {
  private int count = 0;
  public synchronized void increment() {
    count++;  // Thread-safe but full lock (slow under contention)
  }
  public synchronized int getCount() { return count; }
}

// Option 2: Synchronized block (fine-grain lock)
class FineGrainedCounter {
  private int count = 0;
  private final Object lock = new Object();
  public void increment() {
    synchronized(lock) {  // Only critical section
      count++;
    }  // Non-critical work without lock
  }
}

// Option 3: Volatile (visibility guarantee only, NOT atomicity)
class VolatileFlag {
  private volatile boolean running = true;
  public void stop() { running = false; }  // All threads see this immediately
  // WRONG: volatile int count; increment() { count++; }  // NOT atomic!
}

// Option 4: Atomic classes (lock-free, high performance via CAS)
class AtomicCounter {
  private AtomicInteger count = new AtomicInteger(0);
  public void increment() { count.incrementAndGet(); }  // Atomic via CAS
  public int getCount() { return count.get(); }
}

// Option 5: ReadWriteLock (multiple readers, exclusive writer)
class CachedData {
  private String data;
  private final ReadWriteLock lock = new ReentrantReadWriteLock();
  public String readData() {
    lock.readLock().lock();
    try { return data; }  // Multiple threads can read concurrently
    finally { lock.readLock().unlock(); }
  }
  public void updateData(String newData) {
    lock.writeLock().lock();
    try { data = newData; }  // Exclusive write access
    finally { lock.writeLock().unlock(); }
  }
}
```

**When to use each**:
- **Synchronized**: Simple cases, moderate contention
- **AtomicInteger**: High contention, simple counters
- **ReadWriteLock**: Read-heavy workloads
- **Volatile**: Simple flags, memory visibility only

### Java Memory Model (Happens-Before)

Ensures visibility across threads without explicit synchronization:

```java
class CorrectInitialization {
  private int value = 0;
  private volatile boolean ready = false;  // Memory barrier
  
  public void writer() {
    value = 42;       // Write 1
    ready = true;     // Write 2 (happens-before next read)
  }
  
  public void reader() {
    while (!ready) ;   // Guaranteed to eventually see true
    System.out.println(value);  // GUARANTEED to see 42 (not 0)
  }
}
```

**Happens-before rules**:
1. **Monitor exit → monitor entry** of same lock
2. **Volatile write → volatile read** of same variable
3. **Thread.start()** happens-before thread body
4. **Thread.join()** happens-before return
5. **All actions in thread** happen-before thread.join() returns

### Virtual Threads (Java 19+, 2026 Game Changer)

Lightweight threads enabling millions of concurrent tasks:

```java
// OLD: Platform threads (OS-level, expensive)
ExecutorService executor = Executors.newFixedThreadPool(100);  // Only 100 concurrent!
// Cost: ~2MB per thread, slow creation

// NEW: Virtual threads (JVM-level, cheap)
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();  // Millions!
// Cost: ~KB per thread, instant creation

// Creating virtual threads
Thread vthread = Thread.ofVirtual()
  .name("worker-1")
  .start(() -> {
    // This task can block I/O without consuming platform thread
    var response = HttpClient.newHttpClient()
      .send(request, HttpResponse.BodyHandlers.ofString());
    // Scheduler parks this virtual thread, reuses platform thread for others
  });

// Virtual threads + structured concurrency (Java 21+)
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
  Callable<Integer> task1 = scope.fork(() -> expensiveOp1());
  Callable<Integer> task2 = scope.fork(() -> expensiveOp2());
  scope.join();  // Wait for both without manual CompletableFuture
  return task1.get() + task2.get();
}
```

**Why virtual threads matter for 2026**:
- Traditional server (50 platform threads) → 50 concurrent requests
- Virtual threads server → 10,000+ concurrent requests same hardware
- Enables synchronous-style code with async performance

### CompletableFuture (Non-blocking Async)

For high-latency operations across microservices:

```java
// Create future
CompletableFuture<String> future = CompletableFuture.completedFuture("result");

// Async computation
CompletableFuture<Integer> asyncTask = CompletableFuture.supplyAsync(() -> {
  return expensiveOperation();  // Runs on ForkJoinPool
});

// Chain operations (non-blocking)
asyncTask
  .thenApply(x -> x * 2)  // Transform
  .thenAccept(result -> System.out.println(result))  // Consume
  .exceptionally(e -> {
    System.err.println("Error: " + e.getMessage());
    return null;
  });

// Combine multiple async operations
CompletableFuture<String> user = fetchUserAsync(id);
CompletableFuture<List<Post>> posts = fetchPostsAsync(userId);

CompletableFuture<UserProfile> combined = user.thenCombine(posts, (u, p) -> 
  new UserProfile(u, p)
);

// Wait for all with timeout
CompletableFuture.allOf(
  fetchUser(1), fetchUser(2), fetchUser(3)
).get(5, TimeUnit.SECONDS);  // Throws TimeoutException if slow

// Handle any outcome
future.handle((result, exception) -> 
  exception != null ? "fallback" : result
);
```

---

## 🍃 Spring Framework & Spring Boot

### Spring Boot Application

```java
@SpringBootApplication  // Enables component scan, auto-config, properties
public class ApiApplication {
  public static void main(String[] args) {
    SpringApplication.run(ApiApplication.class, args);
  }
  // Auto-configures: Tomcat, database, logging, metrics from classpath
}
```

### REST Controller

```java
@RestController
@RequestMapping("/api/users")
@Slf4j  // Lombok: injects logger
public class UserController {
  
  @Autowired
  private UserService userService;
  
  @GetMapping
  public ResponseEntity<List<User>> getUsers() {
    return ResponseEntity.ok(userService.getAllUsers());  // 200
  }
  
  @GetMapping("/{id}")
  public ResponseEntity<User> getUser(@PathVariable Long id) {
    return userService.getUserById(id)
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.notFound().build());  // 404
  }
  
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)  // 201
  public User createUser(@Valid @RequestBody CreateUserRequest req) {
    return userService.createUser(req);
  }
  
  @PutMapping("/{id}")
  public User updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest req) {
    return userService.updateUser(id, req);
  }
  
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)  // 204
  public void deleteUser(@PathVariable Long id) {
    userService.deleteUser(id);
  }
  
  @ExceptionHandler(ResourceNotFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public ErrorResponse handleNotFound(ResourceNotFoundException e) {
    return new ErrorResponse("NOT_FOUND", e.getMessage());
  }
}
```

### Service Layer

```java
@Service
@Transactional(readOnly = true)
@Slf4j
public class UserService {
  
  @Autowired
  private UserRepository userRepository;
  
  @Autowired
  private CacheManager cacheManager;
  
  public Optional<User> getUserById(Long id) {
    return userRepository.findById(id);
  }
  
  @Transactional(readOnly = false)  // NEW transaction
  public User createUser(CreateUserRequest req) {
    if (userRepository.existsByEmail(req.getEmail())) {
      throw new DuplicateEmailException(req.getEmail());
    }
    User user = new User(req.getName(), req.getEmail());
    return userRepository.save(user);
  }
  
  @Cacheable("users")  // Cache result
  public List<User> getAllUsers() {
    return userRepository.findAll();
  }
  
  @CacheEvict("users")  // Invalidate cache
  @Transactional(readOnly = false)
  public User updateUser(Long id, UpdateUserRequest req) {
    User user = userRepository.findById(id)
      .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    user.setName(req.getName());
    return userRepository.save(user);
  }
  
  @Async  // Return immediately, run on separate thread pool
  public CompletableFuture<List<User>> getAllUsersAsync() {
    return CompletableFuture.completedFuture(userRepository.findAll());
  }
}
```

### Repository (Data Access)

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
  // Derived query methods (Spring generates SQL)
  Optional<User> findByEmail(String email);
  boolean existsByEmail(String email);
  List<User> findByStatusOrderByCreatedDateDesc(UserStatus status);
  
  // Custom JPQL query
  @Query("SELECT u FROM User u WHERE u.email = :email")
  Optional<User> findUserByEmail(@Param("email") String email);
  
  // Native SQL
  @Query(value = "SELECT * FROM users WHERE status = ?", nativeQuery = true)
  List<User> findActiveUsers(String status);
}
```

### Entity & ORM

```java
@Entity
@Table(name = "users", indexes = {
  @Index(name = "idx_email", columnList = "email", unique = true)
})
@Data  // Lombok: generates getters, setters, equals, hashCode, toString
@NoArgsConstructor
public class User {
  
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  
  @Column(nullable = false)
  private String name;
  
  @Column(nullable = false, unique = true)
  private String email;
  
  @Enumerated(EnumType.STRING)
  private UserStatus status = UserStatus.ACTIVE;
  
  @CreationTimestamp
  private LocalDateTime createdAt;
  
  @UpdateTimestamp
  private LocalDateTime updatedAt;
  
  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
  private List<Post> posts = new ArrayList<>();
  
  @ManyToOne(fetch = FetchType.LAZY)  // Avoid N+1 queries
  @JoinColumn(name = "team_id")
  private Team team;
}
```

### Application Properties

```properties
spring.application.name=my-api
server.port=8080
server.servlet.context-path=/api

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/mydb
spring.datasource.username=root
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.generate_statistics=true

# Connection pool
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.connection-timeout=20000

# Logging
logging.level.root=INFO
logging.level.com.mycompany=DEBUG
```

---

## 🧪 Testing (JUnit 5 & Mockito)

```java
@SpringBootTest  // Full application context
class UserServiceTest {
  
  @Autowired
  private UserService userService;
  
  @MockBean  // Mock repository
  private UserRepository userRepository;
  
  @Test
  void shouldCreateUser() {
    // Arrange
    when(userRepository.save(any(User.class)))
      .thenReturn(new User(1L, "John", "john@ex.com"));
    
    // Act
    User result = userService.createUser(new CreateUserRequest("John", "john@ex.com"));
    
    // Assert
    assertThat(result.getEmail()).isEqualTo("john@ex.com");
    verify(userRepository, times(1)).save(any(User.class));
  }
  
  @Test
  void shouldThrowOnDuplicateEmail() {
    when(userRepository.existsByEmail("john@ex.com")).thenReturn(true);
    assertThrows(DuplicateEmailException.class, () -> 
      userService.createUser(new CreateUserRequest("John", "john@ex.com"))
    );
  }
}
```

---

## ☁️ Cloud Deployment

```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/app.jar app.jar
ENTRYPOINT ["java", "-Xmx256m", "-Xms256m", "-jar", "app.jar"]
EXPOSE 8080
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-api
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: user-api
    spec:
      containers:
      - name: app
        image: myregistry.azurecr.io/user-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_DATASOURCE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 5
```

---

## 💡 Design Patterns

### Factory Pattern
```java
@Configuration
public class ServiceFactory {
  @Bean
  public UserService userService(UserRepository repo) {
    return new UserService(repo);
  }
}
```

### Builder Pattern
```java
@Builder
public class User {
  private final Long id;
  private final String email;
}

User user = User.builder().id(1L).email("test@ex.com").build();
```

### Strategy Pattern
```java
interface PaymentStrategy {
  void pay(BigDecimal amount);
}

class CreditCardPayment implements PaymentStrategy {
  public void pay(BigDecimal amount) { /* ... */ }
}

class Order {
  private PaymentStrategy payment;
  public void checkout() { payment.pay(total); }
}
```

---

## � Java Version Comparisons (Interview Questions)

### Java 8 vs Java 17

| Feature | Java 8 | Java 17 |
|---------|--------|---------|
| **Lambdas & Streams** | ✅ Introduced | ✅ Mature, optimized |
| **Records** | ❌ | ✅ Immutable data classes |
| **Sealed Classes** | ❌ | ✅ Control inheritance |
| **Pattern Matching** | ❌ | ✅ instanceof patterns |
| **Text Blocks** | ❌ | ✅ Multi-line strings |
| **Virtual Threads** | ❌ | ⚠️ Preview |
| **Garbage Collection** | G1GC default | G1GC, ZGC improvements |
| **Performance** | Baseline | 50%+ improvements |
| **LTS (Support)** | March 2022 | September 2026 |

### Java 8 → Java 17 Migration Benefits

**1. Records (Data Classes)**
```java
// Java 8 (verbose)
public class User {
    private final String name;
    private final int age;
    
    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public String name() { return name; }
    public int age() { return age; }
    
    @Override
    public boolean equals(Object o) { /* verbose */ }
    @Override
    public int hashCode() { return Objects.hash(name, age); }
    @Override
    public String toString() { /* verbose */ }
}

// Java 17+ (cleaner)
public record User(String name, int age) {}
// Auto-generates: constructor, getters, equals, hashCode, toString
```

**2. Sealed Classes (Type Hierarchy Control)**
```java
// Java 8: Can't control who extends your class
public class Shape { }  // Anyone can extend

// Java 17: Control inheritance explicitly
public sealed class Shape permits Circle, Square, Rectangle { }

public final class Circle extends Shape { }
public final class Square extends Shape { }
public final class Rectangle extends Shape { }

// Only Circle, Square, Rectangle can extend Shape!
```

**3. Pattern Matching**
```java
// Java 8 (verbose type checks)
Object obj = new User("John", 25);
if (obj instanceof User) {
    User user = (User) obj;
    System.out.println(user.name());
}

// Java 17+ (pattern matching)
if (obj instanceof User user) {
    System.out.println(user.name());
}

// Guard patterns (with conditions)
if (obj instanceof User user && user.age() > 18) {
    System.out.println("Adult: " + user.name());
}
```

**4. Text Blocks**
```java
// Java 8 (string concatenation hell)
String json = "{\n" +
    "  \"name\": \"John\",\n" +
    "  \"age\": 25\n" +
    "}";

// Java 17+ (multi-line strings)
String json = """
    {
      "name": "John",
      "age": 25
    }
    """;
```

**5. Virtual Threads (Project Loom)**
```java
// Java 8: Limited by OS threads (thousands)
for (int i = 0; i < 1000; i++) {
    new Thread(() -> handleRequest()).start();  // Can't scale
}

// Java 17+ Preview (millions of threads!)
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
for (int i = 0; i < 1_000_000; i++) {
    executor.submit(() -> handleRequest());  // Scales!
}
```

### Java 11 vs Java 17

| Feature | Java 11 | Java 17 |
|---------|---------|---------|
| **LTS Support** | Sept 2023 (EOL) | Sept 2026+ |
| **HTTP Client API** | ✅ Stable | ✅ Improved |
| **Sealed Classes** | ❌ | ✅ |
| **Records** | ❌ | ✅ |
| **Pattern Matching** | ❌ | ✅ |
| **Performance** | Good | Excellent |

### Key Interview Q&A

**Q: Why migrate from Java 8 to Java 17?**

A:
```
1. Performance: 50%+ improvement in throughput
   - Better GC (ZGC can handle multi-TB heaps)
   - JIT improvements
   - Virtual threads for high concurrency

2. Developer Experience: Modern language features
   - Records reduce boilerplate
   - Pattern matching makes code cleaner
   - Sealed classes enforce better design

3. Security: Regular security updates
   - Java 8 (extended support ended)
   - Java 11 (EOL Sept 2023)
   - Java 17 (LTS until Sept 2026+)

4. Ecosystem: Libraries assume Java 17+
   - Spring Boot 3.0+ requires Java 17+
   - New frameworks target modern Java
```

**Q: Explain Records with an example**

A:
```java
// Before (Java 8): 50 lines
public class Person {
    private final String name;
    private final int age;
    private final String email;
    
    public Person(String name, int age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }
    
    @Override
    public String toString() { return "Person{" + ... }
    public boolean equals(Object o) { ... }
    public int hashCode() { ... }
}

// After (Java 17): 1 line!
public record Person(String name, int age, String email) {}

// Usage:
Person p = new Person("John", 25, "john@example.com");
System.out.println(p.name());     // "John"
System.out.println(p.toString()); // Person[name=John, age=25, email=john@example.com]
```

**Q: When should you NOT use Records?**

A:
```
1. Mutable data - Records are immutable
2. Complex validation - Use regular classes
3. Inheritance required - Records can't extend classes
4. Need custom getter logic - Records provide direct access

Example of when NOT to use:
Instead of record User(String password) {}
Use regular class with password validation/hashing
```

**Q: Virtual Threads vs Platform Threads**

A:
```
Platform Threads (Java 8-16):
- OS-level threads (heavy, ~2MB memory)
- Limited to ~10,000 per server
- Context switching cost

Virtual Threads (Java 19+):
- JVM-managed, lightweight (<1KB memory)
- Millions per server
- Minimal context switching overhead
- Non-blocking I/O automatically handled

Use case:
500 concurrent users with blocking I/O
Platform threads:  Need 500 threads, costly
Virtual threads:   Can use 500,000, no problem!
```

---

## �📋 Interview Checklist

### Core Collections
- [ ] ArrayList vs LinkedList trade-offs
- [ ] HashMap vs TreeMap vs ConcurrentHashMap
- [ ] HashSet vs TreeSet use cases
- [ ] Generics, wildcards, PECS rule
- [ ] Type erasure and runtime behavior

### Concurrency
- [ ] Happens-before relationships and memory visibility
- [ ] Synchronized vs AtomicInteger vs locks trade-offs
- [ ] Virtual threads for high-concurrency I/O-bound systems
- [ ] CompletableFuture for async operations and microservices
- [ ] BlockingQueue for producer-consumer patterns

### Spring Boot
- [ ] @Transactional isolation levels and propagation
- [ ] Lazy vs eager loading and N+1 problem
- [ ] Caching annotations (@Cacheable, @CacheEvict)
- [ ] Circuit breaker and resilience patterns
- [ ] Dependency injection and bean lifecycle

### Performance
- [ ] GC tuning (-Xms, -Xmx, G1GC vs ZGC)
- [ ] Query optimization and indexes
- [ ] Connection pooling configuration
- [ ] Profiling tools (JProfiler, async-profiler)
- [ ] Memory leaks detection

### Cloud & Deployment
- [ ] Docker containerization and image optimization
- [ ] Kubernetes pods, deployments, services
- [ ] Health checks (liveness, readiness, startup)
- [ ] Configuration externalization and secret management
- [ ] Horizontal scaling and load balancing

## 🎯 Key Takeaways

1. **Virtual threads fundamentally change concurrency**: Design for millions of tasks in 2026
2. **Spring Boot is mandatory**: Almost every Java project uses it
3. **Async patterns essential**: CompletableFuture, virtual threads, microservices
4. **Happens-before critical**: Understanding memory visibility prevents subtle bugs
5. **Test with mocks**: @MockBean for dependencies, @SpringBootTest for integration
6. **Cloud-native patterns**: Stateless design, horizontal scaling, health checks
7. **Performance matters**: Profile first, optimize facts not assumptions
8. **Transactions careful**: Understand isolation levels and propagation
9. **Optional over null**: Eliminate null pointer exceptions
10. **Design for failure**: Circuit breakers, timeouts, fallbacks
