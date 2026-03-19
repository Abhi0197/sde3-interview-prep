# Spring Boot - Production-Ready Framework Guide

## ⚙️ What is Spring Boot?

**Spring Boot**: Opinionated framework for building production-ready Spring applications

**Core Philosophy**: Convention over Configuration

**Key Problems Solved**:
- ✅ Auto-configuration (no XML)
- ✅ Embedded servers (Tomcat, Jetty)
- ✅ Production-ready features out-of-the-box
- ✅ Microservices-ready
- ✅ Cloud-native support

---

## 🚀 Auto-Configuration Magic

### How Spring Boot Works

```
1. Scan classpath
   └─ Is spring-webmvc in classpath?
   
2. Check @ConditionalOnClass annotations
   └─ If yes, create DispatcherServlet configuration
   
3. Load application.properties
   └─ Apply user overrides
   
4. Create beans
   └─ Use defaults for unconfigured beans
```

### Disabling Auto-Configuration

```java
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

---

## 📦 Core Annotations

### @SpringBootApplication

```java
// Equivalent to:
@Configuration
@EnableAutoConfiguration
@ComponentScan
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### @RestController

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
    
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.save(user);
    }
    
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteById(id);
    }
}
```

### @Repository & @Service

```java
@Repository
public class UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
    List<User> findByStatusOrderByCreatedDesc(String status);
}

@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository repository;
    
    public User createUser(User user) {
        // @Transactional handles begin/commit/rollback
        return repository.save(user);
    }
    
    @Transactional(readOnly = true)
    public User getUser(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new UserNotFoundException());
    }
}
```

---

## 🗄️ Data Access with Spring Data JPA

### Repository Pattern

```java
// Automatic CRUD implementation
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Query method (derived from method name)
    User findByEmail(String email);
    
    // Multiple conditions
    List<User> findByStatusAndCreatedAfter(String status, LocalDateTime date);
    
    // Custom @Query
    @Query("SELECT u FROM User u WHERE u.status = :status")
    List<User> findActiveUsers(@Param("status") String status);
    
    // Native SQL
    @Query(
        value = "SELECT * FROM users WHERE created > NOW() - INTERVAL 1 DAY",
        nativeQuery = true
    )
    List<User> findRecentUsers();
}
```

### Pagination & Sorting

```java
public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByCategory(String category, Pageable pageable);
}

// Usage:
@GetMapping("/products")
public Page<Product> getProducts(
    @RequestParam String category,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size,
    @RequestParam(defaultValue = "name") String sortBy) {
    
    Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
    return repository.findByCategory(category, pageable);
}
```

---

## 🔄 Transaction Management

### @Transactional Isolation Levels

```java
// SERIALIZABLE: Highest isolation, lowest concurrency
@Transactional(isolation = Isolation.SERIALIZABLE)
public void criticalOperation() { }

// REPEATABLE_READ: Prevents phantom reads
@Transactional(isolation = Isolation.REPEATABLE_READ)
public void transfer() { }

// READ_COMMITTED: Default, prevents dirty reads
@Transactional(isolation = Isolation.READ_COMMITTED)
public void updateBalance() { }

// READ_UNCOMMITTED: Lowest isolation, highest concurrency
@Transactional(isolation = Isolation.READ_UNCOMMITTED)
public void readMetrics() { }
```

### Propagation Levels

```java
@Service
public class PaymentService {
    
    @Transactional
    public void processPayment(Payment payment) {
        // Transaction T1
        auditService.logTransaction(payment);
    }
}

@Service
public class AuditService {
    
    // REQUIRED: Reuse T1 if exists
    @Transactional(propagation = Propagation.REQUIRED)
    public void logTransaction(Payment payment) {
        // Uses T1 - if T1 rolls back, this rolls back too
    }
    
    // REQUIRES_NEW: Create new transaction
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void criticalLog(Payment payment) {
        // New transaction - commits even if T1 rolls back
    }
    
    // NOT_SUPPORTED: Don't use transaction
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void readMetrics(Payment payment) {
        // Executes without transaction
    }
}
```

---

## 🛠️ Configuration Management

### application.properties

```properties
# Server
server.port=8080
server.servlet.context-path=/api

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/mydb
spring.datasource.username=root
spring.datasource.password=secret
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# Connection Pooling (HikariCP)
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000

# Logging
logging.level.root=WARN
logging.level.com.myapp=DEBUG
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n

# Actuator
management.endpoints.web.exposure.include=health,metrics,prometheus
management.endpoint.health.show-details=when-authorized
```

### Profiles (Local, Dev, Prod)

```
application.properties       (shared config)
application-local.properties (local development)
application-dev.properties   (dev environment)
application-prod.properties  (production)
```

Usage: `java -jar app.jar --spring.profiles.active=prod`

---

## 📊 Monitoring & Actuator

### Endpoints

```
GET /actuator/health
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "redis": { "status": "DOWN" }
  }
}

GET /actuator/metrics
GET /actuator/metrics/jvm.memory.used
GET /actuator/metrics/http.server.requests

GET /actuator/prometheus  # Prometheus format
```

### Custom Metrics

```java
@Component
public class CustomMetrics {
    
    private final MeterRegistry meterRegistry;
    
    @Autowired
    public CustomMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }
    
    public void recordUserRegistration() {
        Counter.builder("user.registrations")
            .description("Number of user registrations")
            .tag("version", "1")
            .register(meterRegistry)
            .increment();
    }
    
    public void recordProcessingTime(long millis) {
        Timer.builder("processing.duration")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(meterRegistry)
            .record(millis, TimeUnit.MILLISECONDS);
    }
}
```

---

## 🔐 Security with Spring Security

### Basic Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeRequests()
                .antMatchers("/public/**").permitAll()
                .antMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .httpBasic();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### JWT Authentication

```java
@Component
public class JwtTokenProvider {
    
    private static final String SECRET = "SecretKey";
    private static final long EXPIRATION = 86400000; // 24 hours
    
    public String generateToken(String username) {
        return Jwts.builder()
            .setSubject(username)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
            .signWith(SignatureAlgorithm.HS512, SECRET)
            .compact();
    }
    
    public String getUsernameFromToken(String token) {
        return Jwts.parser()
            .setSigningKey(SECRET)
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

---

## 🧪 Testing

### Unit Tests with @WebMvcTest

```java
@WebMvcTest(UserController.class)
public class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserService userService;
    
    @Test
    public void testGetUser() throws Exception {
        User user = new User(1L, "John", "john@example.com");
        when(userService.getUserById(1L)).thenReturn(user);
        
        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John"));
    }
}
```

### Integration Tests with @SpringBootTest

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
public class UserServiceIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    public void testEndToEnd() {
        User newUser = new User(null, "Jane", "jane@example.com");
        ResponseEntity<User> response = restTemplate
            .postForEntity("/api/users", newUser, User.class);
        
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("Jane", response.getBody().getName());
    }
}
```

---

## 🚀 Performance Best Practices

### 1. Connection Pooling Tuning

```properties
# HikariCP defaults are good, but:
spring.datasource.hikari.maximum-pool-size=20  # For 4 core CPU
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
```

### 2. Lazy Loading vs Eager Loading

```java
// LAZY (default): Load related data on demand
@Entity
public class User {
    @OneToMany(fetch = FetchType.LAZY)
    private List<Order> orders;  // Loaded only when accessed
}

// EAGER: Load immediately
@Entity
public class User {
    @OneToMany(fetch = FetchType.EAGER)
    private List<Order> orders;  // Always loaded with user
}

# Best: Use projection queries instead
@Query("SELECT u.id, u.name FROM User u")
List<UserDTO> getAllUsers();
```

### 3. Caching

```java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("users", "products");
    }
}

@Service
public class UserService {
    @Cacheable("users")
    public User getUserById(Long id) {
        return repository.findById(id).orElse(null);
    }
    
    @CacheEvict("users")
    public void deleteUser(Long id) {
        repository.deleteById(id);
    }
}
```

---

## 🎓 Interview Checklist

- [ ] Understand auto-configuration mechanism
- [ ] Know @RestController, @Service, @Repository pattern
- [ ] Can explain transaction isolation levels
- [ ] Understand Propagation levels and when to use
- [ ] Can configure application.properties properly
- [ ] Know Spring Data JPA query methods
- [ ] Can implement custom metrics with Actuator
- [ ] Understand connection pooling tuning
- [ ] Can implement JWT authentication
- [ ] Know testing with @WebMvcTest vs @SpringBootTest

---

**Spring Boot is essential for SDE 3 interviews in 2026. Know not just how to use it, but understand the mechanisms behind auto-configuration and transaction management.**
