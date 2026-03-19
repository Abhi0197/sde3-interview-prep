# Object-Oriented Programming (OOP) Principles

## Overview

OOP principles are fundamental to designing scalable, maintainable software. Master these 5 principles for SDE 3 interviews and real-world system design.

---

## 🔍 SOLID Principles Deep Dive

### 1. **S**ingle Responsibility Principle

**Definition**: A class should have only one reason to change—one responsibility.

**Bad Example** ❌:
```java
class User {
  void saveToDatabase() { /* ... */ }
  void sendEmail() { /* ... */ }
  void generateReport() { /* ... */ }
  void validateEmail() { /* ... */ }
}
// Multiple responsibilities: persistence, communication, reporting, validation
```

**Good Example** ✅:
```java
class User {
  String name;
  String email;
  // Only user data encapsulation
}

class UserRepository {
  void save(User user) { /* ... */ }  // Persistence only
}

class EmailService {
  void sendEmail(User user) { /* ... */ }  // Communication only
}

class ReportGenerator {
  void generateUserReport(User user) { /* ... */ }  // Reporting only
}

class EmailValidator {
  boolean isValid(String email) { /* ... */ }  // Validation only
}
```

**Interview Tip**: "Each class should have one reason to change." If you say "and" when describing a class's responsibility, it violates SRP.

**Benefits**:
- Easier to test (mock single responsibility)
- Easier to maintain (changes isolated)
- Easier to reuse (focused functionality)

---

### 2. **O**pen/Closed Principle

**Definition**: Open for extension, closed for modification. Add behavior without changing existing code.

**Bad Example** ❌:
```java
class PaymentProcessor {
  void processPayment(String type, BigDecimal amount) {
    if (type.equals("CREDIT_CARD")) {
      // Process credit card
    } else if (type.equals("PAYPAL")) {
      // Process PayPal
    } else if (type.equals("STRIPE")) {
      // Process Stripe
    }
    // Adding new payment method = modify existing code!
  }
}
```

**Good Example** ✅:
```java
// Interface for extension
interface PaymentMethod {
  void pay(BigDecimal amount);
  void refund(BigDecimal amount);
}

// Implementations (closed for modification, open for extension)
class CreditCardPayment implements PaymentMethod {
  public void pay(BigDecimal amount) { /* ... */ }
  public void refund(BigDecimal amount) { /* ... */ }
}

class PayPalPayment implements PaymentMethod {
  public void pay(BigDecimal amount) { /* ... */ }
  public void refund(BigDecimal amount) { /* ... */ }
}

class StripePayment implements PaymentMethod {
  public void pay(BigDecimal amount) { /* ... */ }
  public void refund(BigDecimal amount) { /* ... */ }
}

// Client code - NO CHANGES when adding new payment method
class PaymentProcessor {
  private PaymentMethod paymentMethod;
  
  public PaymentProcessor(PaymentMethod method) {
    this.paymentMethod = method;  // Dependency injection
  }
  
  void processPayment(BigDecimal amount) {
    paymentMethod.pay(amount);  // Works with any PaymentMethod
  }
}

// Add new payment method = just add new class, no modifications!
class BitcoinPayment implements PaymentMethod {
  public void pay(BigDecimal amount) { /* ... */ }
  public void refund(BigDecimal amount) { /* ... */ }
}
```

**Interview Question**: "How would you add a new payment method without changing existing code?"
**Answer**: Use interfaces/abstraction - OCP design.

**Benefits**:
- Safer: less chance of breaking existing code
- Scalable: add features without risk
- Maintainable: clear extension points

---

### 3. **L**iskov Substitution Principle

**Definition**: Derived classes must be substitutable for base classes without breaking the system.

**Bad Example** ❌:
```java
abstract class Bird {
  abstract void fly();
}

class Sparrow extends Bird {
  public void fly() { /* flies across sky */ }
}

class Penguin extends Bird {
  public void fly() {
    throw new UnsupportedOperationException("Penguins cannot fly");
    // Violates LSP: can't substitute Penguin for Bird!
  }
}

// Code expecting Bird breaks when given Penguin
void makeBirdFly(Bird bird) {
  bird.fly();  // Works with Sparrow, crashes with Penguin!
}
```

**Good Example** ✅:
```java
// Separate contracts
interface Flyable {
  void fly();
}

interface Swimmable {
  void swim();
}

class Sparrow implements Flyable {
  public void fly() { /* flies */ }
}

class Penguin implements Swimmable {
  public void swim() { /* swims */ }
}

// Code can now check capability
void moveAnimal(Animal animal) {
  if (animal instanceof Flyable) {
    ((Flyable) animal).fly();
  } else if (animal instanceof Swimmable) {
    ((Swimmable) animal).swim();
  }
}
```

**Interview Tip**: If you need `instanceof` checks, you might be violating LSP. Child classes should be truly substitutable.

**Benefits**:
- Correct polymorphism
- Predictable behavior
- No runtime surprises

---

### 4. **I**nterface Segregation Principle

**Definition**: Clients should not depend on interfaces they don't need. Many specific interfaces are better than one general-purpose interface.

**Bad Example** ❌:
```java
// General-purpose interface (too many responsibilities)
interface Animal {
  void eat();
  void sleep();
  void fly();     // Not all animals fly!
  void swim();    // Not all animals swim!
  void walk();    // Not all animals walk!
}

class Duck implements Animal {
  public void eat() { /* ... */ }
  public void sleep() { /* ... */ }
  public void fly() { /* ... */ }
  public void swim() { /* ... */ }
  public void walk() { /* ... */ }
}

class Snake implements Animal {
  public void eat() { /* ... */ }
  public void sleep() { /* ... */ }
  public void fly() { throw new Exception(); }  // Forced to implement!
  public void swim() { throw new Exception(); }
  public void walk() { throw new Exception(); }
}
```

**Good Example** ✅:
```java
// Segregated, focused interfaces
interface Eater {
  void eat();
}

interface Sleeper {
  void sleep();
}

interface Flyer {
  void fly();
}

interface Swimmer {
  void swim();
}

interface Walker {
  void walk();
}

// Clients implement only what they need
class Duck implements Eater, Sleeper, Flyer, Swimmer {
  public void eat() { /* ... */ }
  public void sleep() { /* ... */ }
  public void fly() { /* ... */ }
  public void swim() { /* ... */ }
}

class Snake implements Eater, Sleeper, Walker {
  public void eat() { /* ... */ }
  public void sleep() { /* ... */ }
  public void walk() { /* ... */ }
  // No forced implementations!
}
```

**Interview Question**: "How many interfaces should a class implement?"
**Answer**: As many as it needs - no "forced" empty implementations.

**Benefits**:
- Smaller, focused contracts
- Clients depend only on what they use
- Easier to implement correctly

---

### 5. **D**ependency Inversion Principle

**Definition**: Depend on abstractions, not concrete implementations. High-level modules should not depend on low-level modules.

**Bad Example** ❌ (Tight Coupling):
```java
// High-level module depends on low-level module
class OrderService {
  private MySQLDatabase database;  // Concrete class
  
  OrderService() {
    this.database = new MySQLDatabase();  // Hard dependency!
  }
  
  void placeOrder(Order order) {
    database.save(order);  // Tightly coupled
  }
  // If we want to switch to PostgreSQL, we change OrderService code!
}

class MySQLDatabase {
  void save(Order order) { /* ... */ }
}
```

**Good Example** ✅ (Loose Coupling):
```java
// Depend on abstraction
interface Database {
  void save(Order order);
}

class MySQLDatabase implements Database {
  public void save(Order order) { /* ... */ }
}

class PostgresDatabase implements Database {
  public void save(Order order) { /* ... */ }
}

// High-level module depends on abstraction, not concrete class
class OrderService {
  private Database database;  // Abstraction
  
  // Dependency injection - inject concrete implementation
  OrderService(Database database) {
    this.database = database;
  }
  
  void placeOrder(Order order) {
    database.save(order);  // Works with any Database implementation
  }
}

// Usage - can swap implementations without changing OrderService
OrderService service1 = new OrderService(new MySQLDatabase());
OrderService service2 = new OrderService(new PostgresDatabase());
```

**Interview Tip**: Dependency Injection is the practical implementation of DIP. Use DI frameworks (Spring, Guice) to manage dependencies.

**Benefits**:
- Loose coupling: easy to swap implementations
- Testable: inject mocks for testing
- Flexible: change implementation at runtime

---

## 💡 OOP Pillars vs SOLID

| Pillar | Focus | SOLID Relation |
|--------|-------|----------------|
| **Encapsulation** | Hide internal details | Enables SRP (expose minimal) |
| **Inheritance** | Code reuse, "is-a" relationships | LSP (proper hierarchy) |
| **Polymorphism** | Different behavior, same interface | Enables OCP (override safely) |
| **Abstraction** | Generalize concepts | Enables DIP (depend on abstractions) |

---

## 🎯 Common Interview Patterns

### Q1: "Explain SOLID principles with real examples"

**Answer Framework**:
1. Give each principle a one-liner
2. Show concrete code example (bad → good)
3. Explain the benefit (testability, maintainability, extensibility)
4. Connect to real projects you've worked on

**Example**:
```
SRP: OrderService only handles orders, validation goes to OrderValidator
OCP: PaymentProcessor works with any PaymentMethod without modification
LSP: All Repository implementations behave consistently
ISP: UserRepository only exposes methods clients actually use
DIP: Services depend on interfaces, not concrete implementations
```

### Q2: "How would you refactor a God Class?"

**Answer**:
```
1. Identify multiple responsibilities
2. Create separate classes for each responsibility
3. Make dependencies explicit via constructor injection
4. Apply SOLID principles to each new class
5. Ensure dependencies flow through interfaces

Example: UserManagementService
- Breaks into: UserRepository, PasswordValidator, EmailService, AuditLogger
- Each with single responsibility
- Loosely coupled via interfaces
```

### Q3: "Design a payment system following SOLID"

**Answer Template**:
```
SRP: PaymentProcessor handles orchestration
     PaymentMethod implementations handle specific logic
     
OCP: Add new payment method = new class implementing PaymentMethod
     Existing code unchanged
     
LSP: All PaymentMethods pay() behavior is consistent
     Can substitute any PaymentMethod
     
ISP: Different interfaces for different capabilities
     RefundablePayment, PreAuthPayment, etc.
     
DIP: PaymentProcessor depends on PaymentMethod interface
     Inject concrete implementation at runtime
```

---

## 🏗️ Real-World Example: E-commerce Order System

```java
// ========== SOLID-Based Design ==========

// DIP: Depend on abstractions
interface PaymentMethod {
  PaymentResult pay(BigDecimal amount);
  PaymentResult refund(BigDecimal amount);
}

interface NotificationService {
  void notify(String channel, String message);
}

interface OrderRepository {
  Order save(Order order);
  Order findById(String id);
}

// SRP: Each class has ONE responsibility
class PaymentService {
  private PaymentMethod paymentMethod;
  
  PaymentService(PaymentMethod method) {
    this.paymentMethod = method;  // DIP
  }
  
  PaymentResult processPayment(Order order) {
    return paymentMethod.pay(order.getTotal());  // OCP: works with any PaymentMethod
  }
}

class OrderService {
  private OrderRepository repository;
  private PaymentService paymentService;
  private NotificationService notifier;
  
  // DIP: Inject dependencies
  OrderService(OrderRepository repo, PaymentService payment, NotificationService notify) {
    this.repository = repo;
    this.paymentService = payment;
    this.notifier = notify;
  }
  
  void placeOrder(Order order) {
    // Process payment
    PaymentResult result = paymentService.processPayment(order);
    
    if (result.isSuccess()) {
      // Save order
      repository.save(order);  // ISP: only uses save/find methods
      
      // Notify customer
      notifier.notify("EMAIL", "Order confirmed: " + order.getId());
    } else {
      notifier.notify("EMAIL", "Payment failed");
    }
  }
}

// OCP: Add new payment method = new class, no changes to existing code
class StripePayment implements PaymentMethod {
  public PaymentResult pay(BigDecimal amount) {
    // Stripe API call
    return new PaymentResult(true, "stripe-txn-123");
  }
  
  public PaymentResult refund(BigDecimal amount) {
    return new PaymentResult(true, "stripe-refund-456");
  }
}

class PayPalPayment implements PaymentMethod {
  public PaymentResult pay(BigDecimal amount) {
    // PayPal API call
    return new PaymentResult(true, "paypal-txn-789");
  }
  
  public PaymentResult refund(BigDecimal amount) {
    return new PaymentResult(true, "paypal-refund-012");
  }
}

// Usage - swap implementations easily
OrderService service1 = new OrderService(
  new JpaOrderRepository(),
  new PaymentService(new StripePayment()),
  new EmailNotificationService()
);

OrderService service2 = new OrderService(
  new JpaOrderRepository(),
  new PaymentService(new PayPalPayment()),
  new SMSNotificationService()  // Different notifier
);
```

---

## � Advanced OOP for Senior Engineers (2026)

### Memory Model & Object Layout (JVM Deep Dive)

**Java Object Memory Layout** (Important for performance):
```
All objects in memory follow this structure:

Object Header:
├─ Mark Word (64 bits on 64-bit JVM)
│  ├─ Hash code
│  ├─ Age (for GC)
│  └─ Lock state (unlocked, biased, lightweight, heavyweight)
├─ Klass pointer (32 or 64 bits)
│  └─ Points to class definition
└─ Array length (if array, 32 bits)

Field Data:
├─ All fields (including inherited)
├─ Primitive types use their size
├─ Object references use pointer size
└─ Note: Order rearranged by JVM for alignment

Padding:
└─ Align to 8-byte boundary
```

**Example - Memory Usage**:
```java
class User {
    String name;     // 8 bytes (reference)
    int age;         // 4 bytes
    boolean active;  // 1 byte
}

Memory layout:
Mark Word:      8 bytes  (hash, age, lock state)
Klass pointer:  8 bytes  (reference to User class)
name:           8 bytes  (reference)
age:            4 bytes
active:         1 byte
padding:        3 bytes  (alignment)
─────────────────────────
Total:          32 bytes

Without padding would be 29 bytes, but JVM aligns to 8-byte boundary!
```

**Cache-Line Alignment (Performance Critical)**:
```
Modern CPU L1 cache line: 64 bytes
If two fields accessed together, should fit in one cache line

Problem: False Sharing
class Point {
    long x;  // Accessed by thread 1
    long y;  // Accessed by thread 2
}
// If x and y in same cache line → Cache invalidation thrashing!

Solution: Padding
@jdk.internal.vm.annotation.Contended
class Point {
    long x;  // Thread 1, isolated in cache line
    long padding = 0;  // 56 bytes padding
    long y;  // Thread 2, different cache line
}
// Slightly more memory, but 10x faster with contention!
```

### Composition vs. Inheritance (When & Why)

**Inheritance Pitfalls (Use Carefully)**:
```java
// ❌ Inheritance Anti-Pattern: Stack extends Vector
public class Stack extends Vector {  // Java's original mistake!
    public void push(Object o) { add(o); }
    public Object pop() { return remove(size()-1); }
}

Problems:
- Stack can call inherited Vector methods: insertAt(), elementAt()
- But these violate LIFO invariant!
- Stack s = new Stack();
  s.insertAt("first", 0);  // Breaks stack semantics!
- Violates LSP: Stack should be substitutable for Vector
```

**Composition (Better Choice)**:
```java
// ✅ Composition Pattern
public class Stack {
    private Vector elements = new Vector();  // Composition
    
    public void push(Object o) {
        elements.add(o);
    }
    
    public Object pop() {
        return elements.remove(elements.size()-1);
    }
    // Only exposes needed methods
}

Advantages:
- Tight contracts (only push/pop exposed)
- Can change internal implementation (Vector → LinkedList)
- No LSP violations
- Flexibility: "Favor composition over inheritance"
```

**When Inheritance IS Appropriate**:
```java
// ✅ Proper Inheritance: IS-A relationship
abstract class Animal {
    abstract void eat();
    abstract void sleep();
}

class Dog extends Animal {  // Dog IS-A Animal
    @Override
    void eat() { System.out.println("Eating bone"); }
    @Override
    void sleep() { System.out.println("Sleeping in bed"); }
}

// Dog fully replaces Animal in any context
void feedAnimal(Animal a) {
    a.eat();  // Works for Dog, Cat, etc.
}

Rule of thumb:
- Inheritance: IS-A relationships (Dog IS-A Animal)
- Composition: HAS-A relationships (Car HAS-A Engine)
```

### Advanced Design Patterns for Performance

**Object Pool Pattern** (Reduce GC pressure):
```java
// Problem: GC pause when creating many short-lived objects
for (int i = 0; i < 1_000_000; i++) {
    Request req = new Request();  // 1M allocations = GC pauses
    processRequest(req);  // May trigger stop-the-world GC!
}

// Solution: Object Pool
public class RequestPool {
    private Queue<Request> available = new LinkedList<>();
    private int poolSize = 1000;
    
    public RequestPool() {
        for (int i = 0; i < poolSize; i++) {
            available.offer(new Request());
        }
    }
    
    public Request acquire() {
        Request req = available.poll();
        if (req == null) req = new Request();  // Fallback
        return req.reset();
    }
    
    public void release(Request req) {
        available.offer(req);
    }
}

Usage:
RequestPool pool = new RequestPool();
for (int i = 0; i < 1_000_000; i++) {
    Request req = pool.acquire();
    try {
        processRequest(req);
    } finally {
        pool.release(req);  // Return to pool
    }
}
// Result: Fewer allocations, less GC pressure!
```

**Immutable Objects Design**:
```java
// ✅ Properly Immutable
public final class ImmutableUser {  // final prevents subclassing
    private final String name;
    private final int age;
    private final List<String> emails;
    
    public ImmutableUser(String name, int age, List<String> emails) {
        this.name = name;
        this.age = age;
        this.emails = Collections.unmodifiableList(
            new ArrayList<>(emails)  // Defensive copy!
        );
    }
    
    public String getName() { return name; }
    public int getAge() { return age; }
    public List<String> getEmails() { 
        return emails;  // Returns unmodifiable list
    }
}

Benefits:
- Thread-safe without synchronization
- Can be cached/reused safely
- Suitable for constants
- Better for functional programming

// ❌ Weakly Immutable (Mutable field!)
public final class WeakUser {
    private final List<String> emails;
    
    public WeakUser(List<String> emails) {
        this.emails = emails;  // Should be Collections.unmodifiableList()!
    }
    
    public List<String> getEmails() { return emails; }
}
// Caller can: getEmails().add("hacker@example.com");
```

### Concurrent Design Patterns

**Synchronized Collections vs. Concurrent Collections**:
```java
// ❌ Synchronized: Locks entire collection
Map<String, Integer> map = Collections.synchronizedMap(
    new HashMap<String, Integer>()
);
// Lock held during entire iteration
for (Integer count : map.values()) {  // Blocks all threads
    println(count);
}

// ✅ Concurrent: Segment-based locking
Map<String, Integer> map = new ConcurrentHashMap<>();
map.putIfAbsent("count", 1);
// Different segments can be accessed concurrently
```

**Double Checked Locking** (Singleton with performance):
```java
// ❌ Naive: Lock on every access (slow!)
public class Singleton {
    private static Singleton instance;
    
    public synchronized static Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}

// ✅ Double Checked Locking
public class Singleton {
    private static volatile Singleton instance;  // volatile!
    
    public static Singleton getInstance() {
        if (instance == null) {  // First check (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {  // Second check (locked)
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
// Fast path: reads instance without lock
// Slow path: only locks on first creation
```

### Type System & Generics (Advanced)

**Covariance & Contravariance**:
```java
interface Producer<T> {
    T produce();  // Covariant position (out)
}

interface Consumer<T> {
    void consume(T item);  // Contravariant position (in)
}

// Covariance: Dog list can be assigned to Animal producer
Producer<Dog> dogProducer = new DogProducer();
Producer<Animal> animalProducer = dogProducer;  // OK!
// Why? dogProducer.produce() returns Dog, which IS-A Animal

// Contravariance: Animal consumer can be assigned to Dog consumer
Consumer<Animal> animalConsumer = new AnimalConsumer();
Consumer<Dog> dogConsumer = animalConsumer;  // OK!
// Why? animalConsumer.consume() accepts any Animal, including Dog

// Not variant (Invariant):
List<Dog> dogs = new ArrayList<>();
List<Animal> animals = dogs;  // ❌ Compile error!
// Why? Could add Cat to animals, breaking dogs list!
```

**Bounded Type Parameters**:
```java
// Generic method with bounds
public <T extends Comparable<T>> T findMax(T a, T b) {
    return a.compareTo(b) > 0 ? a : b;
}

// Generic class with bounds
public class Cache<T extends Serializable> {
    private Map<String, T> data = new HashMap<>();
    
    public void put(String key, T value) {
        if (!(value instanceof Serializable)) {
            throw new IllegalArgumentException("Not serializable!");
        }
        data.put(key, value);
    }
}
```

---

## �📋 Interview Checklist - OOP & SOLID

### Understanding
- [ ] Can explain each SOLID principle in one sentence
- [ ] Can give real code examples for each principle
- [ ] Know how SOLID relates to OOP pillars
- [ ] Understand violation = harder to maintain/test/extend

### Application
- [ ] Can identify SOLID violations in code
- [ ] Can refactor code to follow SOLID
- [ ] Know when to apply each principle
- [ ] Can design systems using SOLID

### Real-World
- [ ] Dependency injection implementation
- [ ] Factory patterns for object creation
- [ ] Strategy pattern for behavior variants
- [ ] Adapter pattern for integration
- [ ] Observer pattern for notifications

### Trade-offs
- [ ] SOLID can over-engineer simple code
- [ ] Know when to apply vs when it's overkill
- [ ] Over-abstraction creates complexity
- [ ] Pragmatism beats purity

---

## 🎓 Key Takeaways

1. **SRP**: Each class one reason to change → Single responsibility
2. **OCP**: Add features without modifying existing code → Use abstractions
3. **LSP**: Child classes fully substitute parent → Proper inheritance
4. **ISP**: Don't force unused dependencies → Segregated interfaces
5. **DIP**: Depend on abstractions → Loose coupling via dependency injection
6. **Interview Skill**: Show these in design discussions, code reviews, system design
7. **Red Flag**: If you need `instanceof` checks, likely violating LSP
8. **Goal**: Code that's easy to understand, test, maintain, and extend
9. **Practice**: Refactor legacy code to follow SOLID
10. **Remember**: SOLID principles solve real problems → maintainability, testability, flexibility
