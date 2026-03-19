# JPA & Hibernate - ORM Deep Dive for SDE 3

## 🏛️ What is Hibernate?

**Hibernate**: Most popular Object-Relational Mapping (ORM) framework for Java

**Core Problem**: Object model ≠ Relational model (Object-Relational Impedance Mismatch)

**Hibernate Solution**:
```
Java Objects ↔ (Hibernate) ↔ Relational Database
```

---

## 🔄 Entity Lifecycle

Hibernate tracks entity state through lifecycle:

```
┌────────────────┐
│  Transient     │  (new, not in DB, not in session)
│  (New Object)  │
└────────┬───────┘
         │ save()
         ▼
┌────────────────┐
│  Persistent    │  (in DB, in session, tracked)
│  (Managed)     │
└────────┬───────┘
    ↙       ↖
deleted    evict
    ↓       ↑
┌────────────────┐
│  Detached      │  (in DB, NOT in session, not tracked)
└────────────────┘
```

### Entity Example

```java
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(length = 100)
    private String name;
    
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;
    
    @Transient  // Not persisted
    private transient String tempPassword;
}
```

---

## 📊 Associations & Relationships

### One-to-Many

```java
@Entity
public class Author {
    @Id
    private Long id;
    private String name;
    
    @OneToMany(mappedBy = "author", fetch = FetchType.LAZY)
    private List<Book> books = new ArrayList<>();
}

@Entity
public class Book {
    @Id
    private Long id;
    private String title;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id")
    private Author author;
}

// Database:
// authors: id, name
// books: id, title, author_id
```

### Many-to-Many

```java
@Entity
public class Student {
    @Id
    private Long id;
    private String name;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "student_course",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set<Course> courses = new HashSet<>();
}

@Entity
public class Course {
    @Id
    private Long id;
    private String title;
    
    @ManyToMany(mappedBy = "courses")
    private Set<Student> students = new HashSet<>();
}

// Database:
// students: id, name
// courses: id, title
// student_course: student_id, course_id (junction table)
```

### One-to-One

```java
@Entity
public class User {
    @Id
    private Long id;
    private String name;
    
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "profile_id")
    private UserProfile profile;
}

@Entity
public class UserProfile {
    @Id
    private Long id;
    private String bio;
    private String profilePictureUrl;
    
    @OneToOne(mappedBy = "profile")
    private User user;
}
```

---

## ⚠️ Lazy Loading Problem

### N+1 Query Problem

```java
// Query 1: Get all authors
List<Author> authors = session.createQuery("FROM Author").list();

// Loop triggers N additional queries!
for (Author author : authors) {
    System.out.println(author.getBooks().size());  // LAZY! Triggers query
}
// Result: 1 + N queries (N authors = N+1 queries)
```

### Solutions

**1. Eager Loading (Careful!)**
```java
@ManyToOne(fetch = FetchType.EAGER)  // Load immediately
private Author author;
```

**2. Fetch Join Query**
```java
@Query("SELECT a FROM Author a LEFT JOIN FETCH a.books")
List<Author> findAllWithBooks();
// Single query with JOIN: efficient!
```

**3. Projection/DTO**
```java
@Query("SELECT new com.example.AuthorDTO(a.id, a.name) FROM Author a")
List<AuthorDTO> findAll();
// Load only needed fields
```

---

## 🔒 Cascade Types

```java
@Entity
public class Author {
    @OneToMany(cascade = {
        CascadeType.PERSIST,   // Save author → save books
        CascadeType.MERGE,     // Update author → update books
        CascadeType.REMOVE     // Delete author → delete books
    }, orphanRemoval = true)    // Delete books if removed from list
    private List<Book> books;
}

// ALL = PERSIST + MERGE + REMOVE + REFRESH + DETACH
```

### Orphan Removal

```java
author.getBooks().remove(0);  // Remove first book
session.update(author);        // With orphanRemoval=true, book deleted!
```

---

## 🎯 Session & Transaction Management

### Session vs Transaction

```java
@Service
@Transactional  // ONE transaction per method
public class UserService {
    
    public void updateUser(User user) {
        // Behind the scenes:
        // 1. Begin transaction
        session.saveOrUpdate(user);  // Queued, not executed yet
        // 2. Commit sends batch update to DB
        // 3. Session cleared
    }
}

// Without @Transactional:
public void updateUserManual() {
    Session session = sessionFactory.openSession();
    Transaction tx = session.beginTransaction();
    try {
        session.saveOrUpdate(user);
        tx.commit();
    } catch (Exception e) {
        tx.rollback();
    } finally {
        session.close();
    }
}
```

### Dirty Checking (Automatic Updates)

```java
@Transactional
public void updateName(Long userId, String newName) {
    User user = session.find(User.class, userId);
    user.setName(newName);  // Dirty! Marked for update
    // No session.update() needed!
    // On commit, Hibernate detects change and executes UPDATE
}
```

---

## 🔍 Query Methods

### HQL (Hibernate Query Language)

```java
// HQL: Entity-oriented, not SQL
Query<User> = session.createQuery("FROM User u WHERE u.email = ?1");
query.setParameter(1, "john@example.com");
User user = query.getSingleResult();

// Named queries (reusable)
@NamedQuery(
    name = "User.findByEmail",
    query = "FROM User u WHERE u.email = :email"
)
User = session.getNamedQuery("User.findByEmail")
              .setParameter("email", "john@example.com")
              .getSingleResult();
```

### Native SQL

```java
List<Object[]> = session.createNativeQuery(
    "SELECT u.id, u.name FROM users u WHERE u.status = :status"
)
.setParameter("status", "ACTIVE")
.list();
```

### Criteria Query (Type-safe)

```java
CriteriaBuilder cb = session.getCriteriaBuilder();
CriteriaQuery<User> query = cb.createQuery(User.class);
Root<User> user = query.from(User.class);

query.select(user)
     .where(cb.and(
         cb.equal(user.get("status"), "ACTIVE"),
         cb.greaterThan(user.get("createdAt"), someDate)
     ))
     .orderBy(cb.desc(user.get("createdAt")));

List<User> = session.createQuery(query).list();
```

---

## 🗄️ Batch Processing

### Problem: Processing 1M records

```java
// WRONG: Memory overflow
List<User> all = session.createQuery("FROM User").list();
for (User u : all) {
    process(u);  // 1M objects in memory!
}
```

### Solution: Batch Processing

```java
int BATCH_SIZE = 50;
Query<User> = session.createQuery("FROM User");
query.setFetchSize(BATCH_SIZE);

try (ScrollableResults results = query.scroll(ScrollMode.FORWARD_ONLY)) {
    int count = 0;
    while (results.next()) {
        User user = (User) results.get(0);
        process(user);
        
        if (++count % BATCH_SIZE == 0) {
            session.flush();   // Flush update commands
            session.clear();   // Clear session (free memory)
        }
    }
}
```

---

## 🎯 Performance Optimization

### First-Level Cache (Session Cache)

```java
// Same session, returns from cache (no DB query)
User user1 = session.find(User.class, 1L);
User user2 = session.find(User.class, 1L);
// user1 == user2 (same object reference)
```

### Second-Level Cache (SessionFactory Cache)

```java
@Configuration
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("users");
    }
}

@Entity
@Cacheable  // Cache this entity
public class User {
    @Id
    private Long id;
    private String name;
}

// Queries:
User u1 = session.find(User.class, 1L);  // DB query
session.clear();
User u2 = session.find(User.class, 1L);  // Cache! No query
```

### Query ResultSet Caching

```java
@QueryHints({
    @QueryHint(name = "org.hibernate.cacheable", value = "true"),
    @QueryHint(name = "org.hibernate.cacheMode", value = "NORMAL")
})
@Query("SELECT u FROM User u")
List<User> findAllCached();
```

---

## 🔐 Locking

### Optimistic Locking

```java
@Entity
public class User {
    @Id
    private Long id;
    
    @Version
    private Long version;  // Incremented on every update
    
    private String name;
}

// Two transactions try to update:
// T1: version=1 → update → version=2
// T2: version=1 → update → FAIL (version mismatch)
```

### Pessimistic Locking

```java
// Lock immediately (prevent others from reading/writing)
User user = session.find(User.class, 1L, LockMode.PESSIMISTIC_WRITE);

// Now only this transaction can modify user
user.setName("New Name");
session.flush();
// Lock released on commit
```

---

## 🚨 Common Pitfalls

### 1. Lazy Loading Outside Transaction

```java
@Transactional
public User getUser(Long id) {
    return userRepository.findById(id).orElse(null);
}

// Later:
User user = getUser(1L);
user.getBooks().size();  // ERROR! LazyInitializationException
// Session closed after @Transactional method ends
```

**Fix**: Use fetch join or eager

### 2. Detached Entity Modifications

```java
@Transactional
public void updateUser(User user) {
    // user is detached (from different session)
    session.saveOrUpdate(user);  // Reattach
    user.setName("New");         // Now tracked
}
```

### 3. Cascading Too Much

```java
@OneToMany(cascade = CascadeType.ALL)  // DANGEROUS
private List<Book> books;

// Deleting author accidentally deletes all books!
```

---

## 🎓 Interview Checklist

- [ ] Understand entity lifecycle (transient, persistent, detached)
- [ ] Know N+1 problem and solutions (fetch join, eager loading)
- [ ] Can explain lazy vs eager loading trade-offs
- [ ] Understand cascade types and orphan removal
- [ ] Know first vs second-level cache
- [ ] Can implement optimistic locking with @Version
- [ ] Understand dirty checking mechanism
- [ ] Can solve LazyInitializationException
- [ ] Know batch processing for large datasets
- [ ] Can write efficient HQL/Criteria queries

---

**2026 Interview Expectation**: Deep understanding of Hibernate mechanics, not just CRUD operations. Expect questions on performance optimization and transaction management.
