# JavaScript/Node.js Specialization

## Overview

JavaScript is the most widely used language for web development and increasingly popular for backend (Node.js). Understanding JavaScript fundamentals, especially async patterns and runtime behavior, is critical for full-stack and backend positions.

## JavaScript Fundamentals

### The Event Loop

JavaScript is **single-threaded** but handles asynchronous operations through the **event loop**.

**How it works**:
1. **Call Stack**: Executes synchronous code
2. **Web APIs**: Browser/Node.js APIs for async operations (timers, fetch, file I/O)
3. **Callback Queue/Task Queue**: Stores callbacks waiting to execute
4. **Event Loop**: Monitors call stack; when empty, moves callback from queue to stack

**Execution Order**:
```
1. All synchronous code (call stack)
2. Microtasks (Promises, async/await, MutationObserver)
3. Macrotasks (setTimeout, setInterval, I/O)
4. Repeat
```

**Critical**: Microtasks execute BEFORE the next macrotask. This is why:
```javascript
console.log('1');
setTimeout(() => console.log('2'), 0); // Macrotask
Promise.resolve().then(() => console.log('3')); // Microtask
console.log('4');
// Output: 1, 4, 3, 2
```

### Closures

A closure is a function with access to its outer scope's variables, even after the outer function completes.

**Memory implication**: Variables in closure remain in memory as long as closure exists.

```javascript
function createMultiplier(x) {
    return function(y) {
        return x * y; // 'x' is captured in closure
    };
}
const double = createMultiplier(2);
console.log(double(5)); // 10
// 'x' remains in memory
```

**Interview pattern**: Data privacy through closures
```javascript
function createCounter() {
    let count = 0; // Private variable
    return {
        increment: () => ++count,
        decrement: () => --count,
        get: () => count
    };
}
const counter = createCounter();
```

### this Context

**Rules** (in order of precedence):
1. **Explicit binding**: `call()`, `apply()`, `bind()`
2. **Method context**: Called as object method → this = object
3. **Constructor**: `new` keyword → this = new object
4. **Global**: Default → this = globalThis (or undefined in strict mode)

**Arrow functions**: Lexical this binding (inherit from outer scope, NOT called on)

```javascript
const obj = {
    name: 'Object',
    regularFunction: function() { return this.name; },
    arrowFunction: () => { return this.name; }
};
obj.regularFunction(); // 'Object' (this = obj)
obj.arrowFunction(); // Undefined (this = global/undefined)
```

### Scope & Hoisting

**var**: Function-scoped, hoisted with initialization undefined  
**let/const**: Block-scoped, hoisted but not initialized (Temporal Dead Zone)

```javascript
console.log(x); // undefined (hoisted)
var x = 5;

console.log(y); // ReferenceError (TDZ)
let y = 10;
```

## Asynchronous JavaScript

### Callbacks

The original async pattern. Execute function when operation completes.

**Problem: Callback Hell**
```javascript
getData(id, function(data) {
    getRelated(data.id, function(related) {
        processRelated(related, function(result) {
            console.log(result); // Deep nesting
        });
    });
});
```

### Promises

**States**: Pending → Settled (Fulfilled or Rejected)

**Key methods**:
- `.then()`: Handle fulfillment
- `.catch()`: Handle rejection
- `.finally()`: Execute regardless of outcome
- `Promise.all()`: Wait for all promises, reject if any fails
- `Promise.race()`: First promise wins
- `Promise.allSettled()`: Wait for all, includes failures

```javascript
Promise.all([fetch('/api/1'), fetch('/api/2')])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .catch(error => console.error('One failed:', error));
```

**Common mistake**: Unhandled promise rejections crash Node!

### Async/Await

Sugar over Promises. Makes async code look synchronous.

```javascript
async function fetchData(id) {
    try {
        const response = await fetch(`/api/${id}`);
        const data = await response.json();
        return data;
    } catch(error) {
        console.error('Fetch failed:', error);
        throw error;
    }
}
```

**Benefits**:
- Easier to read and debug
- Natural error handling with try/catch
- Simpler to write multiple sequential awaits

**Pitfall**: `await` in loops can serialize when parallelization needed
```javascript
// Slow: Sequential
for (let id of ids) {
    const data = await fetch(`/api/${id}`);
}

// Fast: Parallel
const promises = ids.map(id => fetch(`/api/${id}`));
const results = await Promise.all(promises);
```

## Node.js Runtime

### Module System

**CommonJS** (Node.js default):
```javascript
// Export
module.exports = { function1, function2 };
const imported = module.exports;

// Require
const { function1 } = require('./module');
```

**ES6 Modules** (via `"type": "module"` in package.json):
```javascript
// Export
export { function1, function2 };
export default DefaultClass;

// Import
import { function1 } from './module.js';
import DefaultClass from './module.js';
```

**Differences**:
- CommonJS: Dynamic, evaluated on require
- ES6: Static imports, tree-shakeable, optimizable

### Node.js Internals

**Libuv**: Handles asynchronous I/O
- Thread pool for file I/O, DNS, crypto (4 threads by default)
- **Why?** File system is blocking; offload to thread pool
- Network I/O via OS-level async (epoll, kqueue)

**V8 Engine**: JavaScript compiler
- JIT compilation: Interprets first, compiles hot code
- Garbage collection: Generational, mark-and-sweep
- Memory limit: ~1.4GB on 64-bit (configurable with --max-old-space-size)

**Event Loop in Node**:
```
1. Timers (setTimeout, setInterval)
2. Pending callbacks (deferred I/O)
3. Idle/Prepare
4. Poll (I/O events)
5. Check (setImmediate)
6. Close callbacks
7. Repeat (if anything pending)
```

### require() vs import Performance

**require()**: Synchronous, whole file loaded  
**import**: Asynchronous, can partially load and optimize

For large apps: **import** usually slightly faster due to bundler optimization

## Error Handling

### Error Types

- **SyntaxError**: Parse-time error
- **ReferenceError**: Undefined variable
- **TypeError**: Wrong type operand
- **RangeError**: Invalid range/length
- **Error**: Generic, throw custom here

### Best Practices

```javascript
// Good: Custom error class
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

try {
    if (!data) throw new ValidationError('Data required');
} catch(error) {
    if (error instanceof ValidationError) {
        // Handle validation specifically
    }
}

// Node: Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection:', reason);
    // Log, alert monitoring system
});
```

## Performance Optimization

### Memory Management

**Garbage collection**: Keep young generation small
- Short-lived objects: Collect frequently (cheap)
- Long-lived objects: Collected rarely (expensive)

**Leaks to avoid**:
- Global variables
- Closures retaining large objects
- Event listeners not removed
- Timer references not cleared

```javascript
const timer = setInterval(() => {
    // work
}, 1000);

// Don't forget to clear!
clearInterval(timer);
```

### CPU Optimization

**Profiling**:
```bash
node --prof app.js
node --prof-process isolate-*.log > profile.txt
```

**Common bottlenecks**:
- Sync operations in async context
- Large JSON parsing/stringifying
- Regular expressions on large strings
- Unoptimized loops with allocations

### Caching

```javascript
const cache = new Map();

function memoize(fn) {
    return function(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);
        
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}
```

## Common Node.js Patterns

### Request Handling

```javascript
app.get('/api/data/:id', async (req, res, next) => {
    try {
        const data = await Data.findById(req.params.id);
        res.json(data);
    } catch(error) {
        next(error); // Pass to error middleware
    }
});
```

### Middleware Chain

```javascript
app.use(authMiddleware);
app.use(loggingMiddleware);
app.use(errorHandlingMiddleware);
```

### Connection Pooling

```javascript
const pool = mysql.createPool({
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
});

pool.query(sql, (error, results) => {
    if (error) throw error;
    // results
});
```

## Interview Checklist

### Core Concepts
- [ ] Event loop and microtask/macrotask queues
- [ ] Promises: states, then/catch/finally, error propagation
- [ ] Async/await: advantages, pitfalls, error handling
- [ ] Closures: memory implications, data privacy patterns
- [ ] Scoping: var vs let vs const, hoisting, TDZ

### Node.js
- [ ] CommonJS vs ES6 modules
- [ ] require() behavior and circular dependencies
- [ ] Libuv thread pool and non-blocking I/O
- [ ] Process and global objects
- [ ] Buffer for binary data

### Performance
- [ ] Memory leaks: causes and detection
- [ ] Profiling with --prof
- [ ] Event loop blocking detection
- [ ] Callback queue management

## LeetCode Equivalents

While JavaScript-specific algorithmic problems less common, master:
- LeetCode 2625: Flatten Deeply Nested Array
- LeetCode 2629: Function Composition
- LeetCode 2714: Find Value of Parameter After Calling a Function Twice
- LeetCode 2631: Group By
- LeetCode 2649: Nested Array Generator

## TypeScript Fundamentals

TypeScript is essentially mandatory in modern JavaScript development (2026). It adds static typing and catches errors at compile time.

### Type System Basics

```typescript
// Primitives
let name: string = "John";
let age: number = 30;
let active: boolean = true;
let unknown: any = "anything";  // Escape hatch (avoid)
let unknown2: unknown = "type-safe any"; // Safer than any

// Collections
let ids: number[] = [1, 2, 3];
let tuples: [string, number] = ["id", 1];
let union: string | number = "mixed";

// Objects with interfaces
interface User {
  id: number;
  name: string;
  email?: string;  // Optional
  readonly created: Date;  // Immutable
}

const user: User = {
  id: 1,
  name: "John",
  created: new Date()
};
```

### Generics (Key for Library Code)

```typescript
// Generic function
function identity<T>(value: T): T {
  return value;
}

const strResult = identity<string>("hello");  // Type: string
const numResult = identity<number>(42);        // Type: number

// Generic with constraints
function getLength<T extends { length: number }>(obj: T): number {
  return obj.length;  // T must have length property
}

// Generic class (common for repositories, caches)
class Cache<T> {
  private store = new Map<string, T>();
  
  set(key: string, value: T): void {
    this.store.set(key, value);
  }
  
  get(key: string): T | undefined {
    return this.store.get(key);
  }
}

const userCache = new Cache<User>();
userCache.set("user:1", user);
```

### Advanced Patterns

```typescript
// Decorators (experimental, used in NestJS)
@Injectable()
class UserService {
  @Cacheable()
  async getUser(id: number): Promise<User> {
    return db.users.findById(id);
  }
}

// Utility types
type PartialUser = Partial<User>;              // All fields optional
type ReadonlyUser = Readonly<User>;            // Immutable
type UserKeys = keyof User;                    // "id" | "name" | "email" | "created"
type UserWithoutId = Omit<User, "id">;        // Exclude fields
type UserIdOnly = Pick<User, "id">;           // Select fields
type UserWithEmail = Required<User>;           // All fields required

// Mapped types
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
};

type UserGetters = Getters<User>;
// Results in: { getId: () => number; getName: () => string; ... }
```

**Interview Tip**: Know generics well—they separate junior from senior TypeScript developers.

## Testing Frameworks

Production code must be tested. Master Jest (React/Node testing), Mocha (Node-specific), or Vitest (modern alternative).

### Jest (Most Common)

```typescript
// Test suite
describe('UserService', () => {
  let userService: UserService;
  let mockDb: any;
  
  // Setup before each test
  beforeEach(() => {
    mockDb = { users: { find: jest.fn() } };
    userService = new UserService(mockDb);
  });
  
  // Individual test
  test('should fetch user by id', async () => {
    const mockUser = { id: 1, name: 'John' };
    mockDb.users.find.mockResolvedValue(mockUser);
    
    const result = await userService.getUser(1);
    
    expect(result).toEqual(mockUser);
    expect(mockDb.users.find).toHaveBeenCalledWith(1);
  });
  
  // Async test
  test('should handle errors', async () => {
    mockDb.users.find.mockRejectedValue(new Error('DB error'));
    
    await expect(userService.getUser(1)).rejects.toThrow('DB error');
  });
});
```

### Mocking Patterns

```typescript
// Mock external API
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock timers
jest.useFakeTimers();
setTimeout(() => console.log('delayed'), 1000);
jest.runAllTimers();  // Execute immediately

// Mock modules
const mockFs = jest.mock('fs');

// Spy on functions
const spyLog = jest.spyOn(console, 'log');
spyLog.mockImplementation(() => {});
// Verify called: expect(spyLog).toHaveBeenCalled();
```

**Interview Tip**: Know how to test async code, mock external dependencies, and verify function calls.

## API Design & REST Patterns

Designing APIs is critical for full-stack roles. Follow RESTful principles.

### REST Best Practices

```typescript
// Resource design (nouns, not verbs)
GET    /api/users              // List all users
GET    /api/users/:id          // Get specific user
POST   /api/users              // Create user
PUT    /api/users/:id          // Replace user
PATCH  /api/users/:id          // Partial update
DELETE /api/users/:id          // Delete user

// Status codes
200 OK                  // Successful GET/PUT/PATCH
201 Created             // POST created resource
204 No Content          // DELETE successful (no body)
400 Bad Request         // Invalid input
401 Unauthorized        // Missing auth
403 Forbidden           // Auth insufficient
404 Not Found           // Resource doesn't exist
409 Conflict            // Duplicate (e.g., email exists)
429 Too Many Requests   // Rate limit exceeded
500 Internal Error      // Server error
503 Service Unavailable // Temporary outage

// Response format (consistent)
{
  "status": "success",
  "data": { /* resource */ },
  "error": null,
  "meta": { "timestamp": "2026-03-18T...", "path": "/api/users" }
}

// Error response
{
  "status": "error",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [{ "field": "email", "message": "Email is required" }]
  }
}
```

### Express Route Handler Pattern

```typescript
// Middleware for async errors (prevents uncaught promise rejections)
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validation middleware
app.post('/api/users',
  validateBody(createUserSchema),        // Validate input
  authenticate,                          // Check auth
  authorize('admin'),                    // Check permission
  asyncHandler(async (req, res, next) => {
    const user = await User.create(req.body);
    res.status(201).json({
      status: 'success',
      data: user
    });
  })
);

// Centralized error handling
app.use((error, req: Request, res: Response, next: NextFunction) => {
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';
  
  res.status(status).json({
    status: 'error',
    data: null,
    error: { code: error.code, message }
  });
});
```

## Security Best Practices

Security is non-negotiable in production systems. Know at least these:

### Input Validation & Sanitization

```typescript
// Prevent SQL injection
// ❌ WRONG
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ RIGHT: Parameterized queries
const query = 'SELECT * FROM users WHERE id = ?';
const result = await db.query(query, [userId]);

// Sanitize HTML (prevent XSS)
import DOMPurify from 'dompurify';
const cleanHtml = DOMPurify.sanitize(userInput);

// Validate with schemas
import Joi from 'joi';
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  age: Joi.number().integer().min(18).max(150)
});

const { error, value } = userSchema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

### Authentication & Authorization

```typescript
// JWT-based authentication
import jwt from 'jsonwebtoken';

// Create token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Verify middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Authorization (role-based)
function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

### CORS & Security Headers

```typescript
import helmet from 'helmet';
cors import cors from 'cors';

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers
app.use(helmet());  // Sets: X-Frame-Options, X-Content-Type-Options, etc.

// Rate limiting (prevent brute force)
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests'
});

app.use('/api/', limiter);

// Stricter limit for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 5 attempts
  skipSuccessfulRequests: true  // Don't count successful logins
});

app.post('/api/login', loginLimiter, async (req, res) => {
  // Handle login
});
```

## Database Integration Patterns

### ORM Usage (Prisma/TypeORM)

```typescript
// Prisma (modern, type-safe)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Type-safe queries
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true }  // Eager load relations
});

// Transactions
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { name: 'John' } });
  const post = await tx.post.create({
    data: { title: 'Hello', authorId: user.id }
  });
  return { user, post };
});
```

### Connection Pooling

```typescript
// MongoDB with connection pool
const mongoUri = `mongodb+srv://user:pass@cluster.mongodb.net/db?maxPoolSize=10&minPoolSize=5`;
const client = new MongoClient(mongoUri);
await client.connect();

// Express middleware for connection
app.use(async (req, res, next) => {
  req.db = client.db('myapp');
  next();
});

// The pool automatically manages connections
// maxPoolSize: Maximum concurrent connections
// minPoolSize: Keep these as warm standby
```

### Query Optimization

```typescript
// Eager load to avoid N+1 queries
// ❌ SLOW: N+1 queries
const users = await User.find();
for (const user of users) {
  const posts = await Post.find({ userId: user.id });  // Query per user!
}

// ✅ FAST: Single query with join
const users = await User.find().populate('posts');

// Indexes on frequently queried fields
db.users.createIndex({ email: 1 });           // Single field
db.users.createIndex({ email: 1, status: 1 }); // Compound  
db.users.createIndex({ email: 1 }, { unique: true });  // Unique

// Query analysis
const explain = await db.collection('users').find({ email: 'test@ex.com' }).explain('executionStats');
console.log(explain.executionStats.executionStages);  // Check index usage
```

## Cloud Deployment Patterns (2026)

### Docker & Containerization

```dockerfile
# Dockerfile for Node app
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production  # Smaller than npm install

COPY . .
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode==200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/index.js"]
```

### Kubernetes Deployment (Common for 2026)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
      - name: api-server
        image: myregistry.azurecr.io/api-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: LoadBalancer
  selector:
    app: api-server
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

### Serverless (AWS Lambda/Azure Functions)

```typescript
// AWS Lambda handler
import { APIGatewayProxyHandler } from 'aws-lambda';

export const createUser: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const user = await User.create(body);
    
    return {
      statusCode: 201,
      body: JSON.stringify(user)
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Cold start optimization
// 1. Minimize bundle size (use webpack/esbuild)
// 2. Initialize connections outside handler
// 3. Warm functions with scheduled invocations
const dbConnection = new Database(process.env.DATABASE_URL);

export const handler: APIGatewayProxyHandler = async (event) => {
  // Use pre-initialized connection
  const user = await dbConnection.users.findById(event.pathParameters.id);
  return { statusCode: 200, body: JSON.stringify(user) };
};
```

## Logging & Monitoring

Production applications must be observable. Know logging and APM tools.

```typescript
// Structured logging (machine-readable)
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Structured logs for search/analysis
logger.info('User created', {
  userId: user.id,
  email: user.email,
  timestamp: new Date(),
  severity: 'INFO',
  traceId: req.traceId  // For distributed tracing
});

// Application Performance Monitoring (APM)
import newrelic from 'newrelic';  // or DataDog, Elastic APM

// Automatic instrumentation of:
// - HTTP requests
// - Database queries
// - External API calls
// - Error rates
// Reports to dashboard with metrics/alerts
```

## Caching Strategies

### In-Memory Caching

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

function getCachedUser(id: number): User | null {
  const cached = cache.get(`user:${id}`);
  if (cached) return cached;
  
  const user = await fetchUserFromDb(id);
  cache.set(`user:${id}`, user, 600);  // 10 minutes
  return user;
}
```

### Redis Caching (Distributed)

```typescript
import redis from 'redis';

const client = redis.createClient({ host: 'localhost', port: 6379 });
await client.connect();

// Cache with TTL
await client.setEx(`user:${id}`, 600, JSON.stringify(user));  // 10 min TTL

// Retrieve
const cached = await client.get(`user:${id}`);
const user = cached ? JSON.parse(cached) : await fetchUserFromDb(id);

// Cache invalidation pattern
app.put('/api/users/:id', async (req, res) => {
  const user = await User.update(req.params.id, req.body);
  
  // Invalidate cache
  await client.del(`user:${req.params.id}`);
  await client.del('users:all');  // Cascade invalidation
  
  res.json(user);
});
```

## Session Management

```typescript
// Session-based (cookies)
import session from 'express-session';
import RedisStore from 'connect-redis';

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // HTTPS only
    httpOnly: true,  // JS can't access (prevents XSS-stealing)
    sameSite: 'strict',  // CSRF protection
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));

// Session middleware
app.get('/api/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json(req.user);
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    res.json({ message: 'Logged out' });
  });
});
```

## Performance Optimization

### Async Optimization

```typescript
// ❌ SLOW: Sequential await
const user = await fetchUser(id);
const posts = await fetchPosts(userId);
const comments = await fetchComments(postIds);

// ✅ FAST: Parallel await
const [user, posts, comments] = await Promise.all([
  fetchUser(id),
  fetchPosts(userId),
  fetchComments(postIds)
]);

// For error resilience (partial failures acceptable)
const results = await Promise.allSettled([
  fetchUser(id),
  fetchPosts(userId)
]);
// results[0].status === 'fulfilled' ? results[0].value : null
```

### Stream Handling (Large Data)

```typescript
// Stream large files instead of buffering
app.get('/api/export/users', (req, res) => {
  const stream = fs.createReadStream('users.csv');
  stream.pipe(res);  // Backpressure handled automatically
});

// Backpressure handling
function writeData(stream: fs.WriteStream, data: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    let i = 0;
    
    const write = () => {
      if (i === data.length) {
        stream.end();
        resolve();
        return;
      }
      
      const canContinue = stream.write(data[i] + '\n');
      i++;
      
      if (!canContinue) {
        // Buffer full; wait for drain
        stream.once('drain', write);
      } else {
        // Buffer has space; continue
        setImmediate(write);
      }
    };
    
    write();
  });
}
```

## Key Takeaways

1. **TypeScript is standard**: Know generics, interfaces, utility types—not optional
2. **Testing is not optional**: Jest/Mocha required for all production code
3. **Security first**: Input validation, SQL injection prevention, JWT tokens
4. **Async patterns matter**: Promise.all() for parallelism, proper error handling
5. **Database optimization essential**: Indexes, connection pools, N+1 prevention
6. **Cloud deployment skills**: Docker, Kubernetes, serverless (Lambda/Functions)
7. **Logging & monitoring required**: Structured logs, APM tools, observability
8. **Caching layer critical**: Redis for distributed systems, TTL strategies
9. **API design consistency**: RESTful patterns, proper status codes, error formats
10. **Stream handling for scale**: Backpressure awareness for large data transfers
