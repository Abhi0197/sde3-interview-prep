# Design Patterns & SOLID Principles

## Design Patterns Overview

Design patterns are reusable solutions to common programming problems. They're not code—they're blueprints you customize for specific situations. Critical for LLD interviews.

### Pattern Categories

**Creational**: How objects are created  
**Structural**: How objects relate and compose  
**Behavioral**: How objects interact and communicate  

---

## Creational Patterns

### 1. Singleton Pattern

**Problem**: Need exactly one instance of a class (logger, database connection)

**Solution**: Private constructor, static getInstance()

```java
public class Logger {
    private static Logger instance;
    
    private Logger() {} // Private constructor
    
    public static synchronized Logger getInstance() {
        if (instance == null) {
            instance = new Logger();
        }
        return instance;
    }
    
    public void log(String message) {
        System.out.println(message);
    }
}

// Usage
Logger logger = Logger.getInstance();
logger.log("This is a message");
```

**Thread-safe variant** (eager initialization):
```java
public class Logger {
    private static final Logger instance = new Logger();
    
    private Logger() {}
    
    public static Logger getInstance() {
        return instance;
    }
}
```

**When to use**: Logger, cache, configuration manager, thread pool  
**Pitfall**: Hides dependency (hard to test), global state, concurrent access issues

**Interview Q**: Why is Singleton tricky in multithreaded environments?  
**Answer**: Multiple threads could call getInstance() simultaneously, creating multiple instances. Solutions: synchronized method (slow), double-checked locking, eager initialization, or class loader initialization.

### 2. Factory Pattern

**Problem**: Create objects without specifying exact classes

**Solution**: Factory method returns interface, hides implementation

```java
// Interface
interface Database {
    void connect();
}

// Implementations
class MysqlDatabase implements Database {
    public void connect() { System.out.println("MySQL connected"); }
}

class PostgresDatabase implements Database {
    public void connect() { System.out.println("Postgres connected"); }
}

// Factory
class DatabaseFactory {
    public static Database createDatabase(String type) {
        if (type.equals("mysql")) return new MysqlDatabase();
        if (type.equals("postgres")) return new PostgresDatabase();
        return null;
    }
}

// Usage
Database db = DatabaseFactory.createDatabase("mysql");
db.connect();
```

**When to use**: Creating different types of objects based on runtime conditions  
**Benefit**: Decouples client from concrete classes  

**Interview Q**: What's the difference between Factory and Abstract Factory?  
**Answer**: Factory creates one type of object. Abstract Factory creates families of related objects (e.g., UI components for different OS).

### 3. Builder Pattern

**Problem**: Creating complex objects with many optional parameters

**Solution**: Step-by-step construction with fluent interface

```java
public class User {
    private String name;
    private String email;
    private String phone;
    private int age;
    
    private User(Builder builder) {
        this.name = builder.name;
        this.email = builder.email;
        this.phone = builder.phone;
        this.age = builder.age;
    }
    
    public static class Builder {
        private String name;
        private String email;
        private String phone;
        private int age;
        
        public Builder name(String name) {
            this.name = name;
            return this;
        }
        
        public Builder email(String email) {
            this.email = email;
            return this;
        }
        
        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }
        
        public Builder age(int age) {
            this.age = age;
            return this;
        }
        
        public User build() {
            return new User(this);
        }
    }
}

// Usage - much cleaner!
User user = new User.Builder()
    .name("John")
    .email("john@example.com")
    .age(30)
    .build();
```

**When to use**: Objects with many optional parameters  
**Benefit**: Clear, readable construction, immutability possible

---

## Structural Patterns

### 1. Adapter Pattern

**Problem**: Two incompatible interfaces need to work together

**Solution**: Create adapter that translates between them

```java
// Old system - expects specific interface
interface AudioPlayer {
    void play(String filePath);
}

// New system - we have MediaPlayer interface
interface MediaPlayer {
    void playMedia(String filePath);
}

// Adapter bridges the gap
class MediaPlayerAdapter implements AudioPlayer {
    private MediaPlayer mediaPlayer;
    
    public MediaPlayerAdapter(MediaPlayer mediaPlayer) {
        this.mediaPlayer = mediaPlayer;
    }
    
    @Override
    public void play(String filePath) {
        mediaPlayer.playMedia(filePath); // Translate call
    }
}

// Old code works with new system
AudioPlayer player = new MediaPlayerAdapter(new ModernMediaPlayer());
player.play("song.mp3");
```

**Real-world**: Converting Java object to JSON, SQL adapter to NoSQL, etc.

### 2. Decorator Pattern

**Problem**: Add features to objects dynamically without inheritance explosion

```java
interface Coffee {
    double cost();
    String describe();
}

class SimpleCoffee implements Coffee {
    public double cost() { return 1.0; }
    public String describe() { return "Coffee"; }
}

abstract class CoffeeDecorator implements Coffee {
    protected Coffee coffee;
    
    public CoffeeDecorator(Coffee coffee) {
        this.coffee = coffee;
    }
}

class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) { super(coffee); }
    public double cost() { return coffee.cost() + 0.3; }
    public String describe() { return coffee.describe() + " + Milk"; }
}

// Usage - compose features
Coffee coffee = new SimpleCoffee();
coffee = new MilkDecorator(coffee);
coffee = new CaramelDecorator(coffee);

System.out.println(coffee.describe()); // Coffee + Milk + Caramel
System.out.println(coffee.cost()); // 1.0 + 0.3 + 0.4
```

**When to use**: Adding responsibilities to objects, avoiding class explosion  
**Better than**: Inheritance (creates many subclasses), if-else flags

### 3. Facade Pattern

**Problem**: Complex subsystems with many classes, client code too complicated

**Solution**: Simple wrapper provides unified interface

```java
// Complex subsystem
class DatabaseConnection { /* ... */ }
class CacheManager { /* ... */ }
class LoggerService { /* ... */ }

// Facade - simple interface
class UserRepository {
    private DatabaseConnection db;
    private CacheManager cache;
    private LoggerService logger;
    
    public User getUser(int id) {
        logger.log("Getting user " + id);
        User user = cache.get(id);
        if (user != null) return user;
        
        user = db.query("SELECT * FROM users WHERE id = " + id);
        cache.set(id, user);
        return user;
    }
}

// Client uses simple interface
UserRepository repo = new UserRepository();
User user = repo.getUser(123); // Complex logic hidden
```

---

## Behavioral Patterns

### 1. Observer Pattern

**Problem**: Notify multiple objects when state changes

```java
interface Observer {
    void update(String event);
}

class Subject {
    private List<Observer> observers = new ArrayList<>();
    
    public void attach(Observer observer) {
        observers.add(observer);
    }
    
    public void detach(Observer observer) {
        observers.remove(observer);
    }
    
    public void notifyObservers(String event) {
        for (Observer observer : observers) {
            observer.update(event);
        }
    }
}

// Concrete observers
class EmailNotifier implements Observer {
    public void update(String event) {
        System.out.println("Sending email: " + event);
    }
}

class SlackNotifier implements Observer {
    public void update(String event) {
        System.out.println("Posting to Slack: " + event);
    }
}

// Usage
Subject subject = new Subject();
subject.attach(new EmailNotifier());
subject.attach(new SlackNotifier());
subject.notifyObservers("User logged in");
```

**Real-world**: Event listeners, pub/sub systems, MVC pattern (model notifies views)

### 2. Strategy Pattern

**Problem**: Multiple algorithms, client picks at runtime

```java
interface PaymentStrategy {
    void pay(double amount);
}

class CreditCardPayment implements PaymentStrategy {
    public void pay(double amount) {
        System.out.println("Charging $" + amount + " to credit card");
    }
}

class PayPalPayment implements PaymentStrategy {
    public void pay(double amount) {
        System.out.println("Charging $" + amount + " via PayPal");
    }
}

class ShoppingCart {
    private PaymentStrategy strategy;
    
    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.strategy = strategy;
    }
    
    public void checkout(double total) {
        strategy.pay(total);
    }
}

// Usage
ShoppingCart cart = new ShoppingCart();
cart.setPaymentStrategy(new CreditCardPayment());
cart.checkout(99.99);

cart.setPaymentStrategy(new PayPalPayment());
cart.checkout(150.00);
```

**When to use**: Different algorithms at runtime, reduce if-else statements

### 3. State Pattern

**Problem**: Behavior changes based on internal state

```java
interface State {
    void handle(Order order);
}

class PendingState implements State {
    public void handle(Order order) {
        System.out.println("Processing payment...");
        order.setState(new ProcessingState());
    }
}

class ProcessingState implements State {
    public void handle(Order order) {
        System.out.println("Preparing shipment...");
        order.setState(new ShippedState());
    }
}

class ShippedState implements State {
    public void handle(Order order) {
        System.out.println("Order shipped!");
    }
}

class Order {
    private State state = new PendingState();
    
    public void setState(State state) {
        this.state = state;
    }
    
    public void process() {
        state.handle(this);
    }
}
```

**When to use**: Finite state machines (order status, traffic light, etc.)

---

## SOLID Principles

### S - Single Responsibility Principle

**Definition**: A class should have only one reason to change

**Bad**:
```java
class User {
    public void saveToDatabase() { }
    public void sendEmailNotification() { }
    public void generateReport() { }
    public void validateEmail() { }
}
// Reasons to change: Database schema, email format, report format, validation rules
```

**Good**:
```java
class User { // Only user data
    private String name, email;
    public String getName() { return name; }
}

class UserRepository { // Database persistence
    public void save(User user) { }
}

class EmailService { // Send notifications
    public void sendWelcomeEmail(User user) { }
}

class UserValidator { // Validation logic
    public boolean isValidEmail(String email) { }
}
```

**Interview Q**: How do you know if a class violates SRP?  
**Answer**: If it has multiple reasons to change, or if describing class requires the word "and"

### O - Open/Closed Principle

**Definition**: Open for extension, closed for modification

**Bad**:
```java
public class PaymentProcessor {
    public void process(String type, double amount) {
        if (type.equals("creditCard")) {
            // charge credit card
        } else if (type.equals("paypal")) {
            // charge paypal
        }
        // Adding new payment method requires modifying this class
    }
}
```

**Good**:
```java
interface PaymentMethod {
    void process(double amount);
}

class CreditCardProcessor implements PaymentMethod {
    public void process(double amount) { /* ... */ }
}

class PayPalProcessor implements PaymentMethod {
    public void process(double amount) { /* ... */ }
}

class PaymentProcessor {
    private PaymentMethod method;
    
    public void process(PaymentMethod method, double amount) {
        method.process(amount); // Extensible without modification
    }
}
```

**Key**: Use interfaces, inheritance, polymorphism for extension

### L - Liskov Substitution Principle

**Definition**: Subtypes must be substitutable for their base types

**Bad**:
```java
class Bird {
    public void fly() { System.out.println("Flying"); }
}

class Penguin extends Bird {
    @Override
    public void fly() {
        throw new UnsupportedOperationException("Penguins can't fly!");
    }
}

// Invalid substitution
Bird bird = new Penguin();
bird.fly(); // Throws exception - violates LSP
```

**Good**:
```java
interface Bird { }

interface FlyingBird extends Bird {
    void fly();
}

interface SwimmingBird extends Bird {
    void swim();
}

class Penguin implements SwimmingBird {
    public void swim() { System.out.println("Swimming"); }
}

class Eagle implements FlyingBird {
    public void fly() { System.out.println("Flying"); }
}
```

**Key**: Don't force subclasses to implement methods they don't support

### I - Interface Segregation Principle

**Definition**: Clients shouldn't depend on interfaces they don't use

**Bad**:
```java
interface Worker {
    void work();
    void manage();
    void report();
}

class Developer implements Worker {
    public void work() { System.out.println("Coding"); }
    public void manage() { /* Not applicable */ }
    public void report() { /* Not applicable */ }
}
```

**Good**:
```java
interface Doer {
    void work();
}

interface Manager {
    void manage();
}

interface Reporter {
    void report();
}

class Developer implements Doer, Reporter {
    public void work() { System.out.println("Coding"); }
    public void report() { System.out.println("Reporting progress"); }
}

class TeamLead implements Doer, Manager, Reporter {
    public void work() { System.out.println("Coding"); }
    public void manage() { System.out.println("Managing team"); }
    public void report() { System.out.println("Reporting status"); }
}
```

**Key**: Many specific interfaces better than one general interface

### D - Dependency Inversion Principle

**Definition**: Depend on abstractions, not concrete implementations

**Bad**:
```java
class UserRepository {
    private MySQLDatabase database = new MySQLDatabase();
    
    public User getUser(int id) {
        return database.query("SELECT * FROM users WHERE id = " + id);
    }
}
// Tightly coupled to MySQLDatabase
```

**Good**:
```java
interface Database {
    User query(String sql);
}

class UserRepository {
    private Database database;
    
    public UserRepository(Database database) {
        this.database = database;
    }
    
    public User getUser(int id) {
        return database.query("SELECT * FROM users WHERE id = " + id);
    }
}

// Can use any database implementation
UserRepository repo = new UserRepository(new MySQLDatabase());
UserRepository repo2 = new UserRepository(new MongoDatabase());
```

**Key**: Use dependency injection, interfaces as contracts

---

## Pattern Comparison

| Pattern | When to Use | Benefit |
|---------|------------|---------|
| Singleton | One instance needed | Resource control, global access |
| Factory | Decouple object creation | Easy to extend, change implementations |
| Builder | Complex object construction | Readable, maintainable, immutable |
| Adapter | Incompatible interfaces | Reuse legacy code |
| Decorator | Add features dynamically | Avoid class explosion |
| Facade | Simplify complex subsystem | Easy to use, encapsulation |
| Observer | Multiple objects subscribe to events | Loose coupling, event-driven |
| Strategy | Multiple algorithms | Runtime selection, testable |
| State | Behavior changes with state | Clear state transitions |

---

## Interview Questions & Answers

### Q1: When would you use a Singleton instead of static methods?

**Answer**: 
- Singleton allows inheritance and implementation of interfaces
- Can be lazily initialized (time/resource intensive tasks)
- Static methods are simpler for true singletons (utility functions)
- Singleton useful for stateful objects (cache, logger with state)

### Q2: How to make Singleton thread-safe AND lazy?

**Answer**: Double-checked locking or eager initialization
```java
public class Logger {
    private static volatile Logger instance;
    
    public static Logger getInstance() {
        if (instance == null) {
            synchronized(Logger.class) {
                if (instance == null) {
                    instance = new Logger();
                }
            }
        }
        return instance;
    }
}
```

### Q3: What's the difference between Strategy and State patterns?

**Answer**:
- **Strategy**: Client chooses algorithm (PaymentStrategy)
- **State**: Object changes behavior based on internal state (Order states)
- Strategy: Logic outside object  
- State: Logic inside object

### Q4: Can you give a real-world OCP violation?

**Answer**: Logger with multiple outputs
```
// Violates OCP
if (type == "console") print();
if (type == "file") writeFile();
if (type == "database") writeDB();
// Adding email logging requires modifying class

// Follows OCP
interface LoggingStrategy { void log(); }
class ConsoleLogger implements LoggingStrategy { }
class FileLogger implements LoggingStrategy { }
class EmailLogger implements LoggingStrategy { }
```

---

## Key Takeaways

1. **Patterns are solutions**: No silver bullet, apply when problem arises
2. **SOLID = clean code**: Principles lead to maintainable, testable code
3. **Composition over inheritance**: Many patterns exhibit this
4. **Know tradeoffs**: Each pattern has complexity cost
5. **Refactor to patterns**: Don't force patterns day 1
6. **Interview focus**: Singleton, Factory, Observer, Strategy, Builder most common
