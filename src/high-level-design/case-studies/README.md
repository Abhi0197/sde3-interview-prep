# High-Level Design: Case Studies

## Overview

Learning system design through real-world case studies prepares you for interview scenarios. These cases demonstrate architectural patterns, tradeoffs, and scaling solutions. Master 3-4 in depth for interviews.

## Case Study 1: YouTube Architecture

### Requirements

**Functional**:
- Users upload, watch, share videos
- Search and recommendation
- Comments and metadata
- Live streaming support

**Non-functional**:
- Availability: 99.99% uptime
- Latency: < 2s for video start
- Scale: 2B+ users, 500+ hours uploaded/min, 1B+ videos watched/day

### Key Challenges

1. **Storage**: Petabytes of video data
2. **Processing**: Convert videos to multiple resolutions/formats
3. **Bandwidth**: Billions of streams simultaneously
4. **Recommendations**: Personalize for billions users

### Architecture

```
┌─────────────────┐
│  Client/App     │
└────────┬────────┘
         │
    ┌────▼────┐
    │   CDN   │ ← Geographically distributed
    └────┬────┘
         │
    ┌────▼──────────────────────┐
    │  Load Balancer (L7)        │
    └────┬──────────────────────┘
         │
    ┌─────────────────────────────────────┐
    │      API Gateway + Services         │
    ├─────────────────────────────────────┤
    │ ┌──────────┐ ┌──────────────────┐  │
    │ │ Upload   │ │ Video Processing │  │
    │ │ Service  │ │ (Queue)          │  │
    │ └──────────┘ └──────────────────┘  │
    │ ┌──────────┐ ┌──────────────────┐  │
    │ │ Video    │ │ Recommendation   │  │
    │ │ Service  │ │ Service          │  │
    │ └──────────┘ └──────────────────┘  │
    │ ┌──────────┐ ┌──────────────────┐  │
    │ │ Search   │ │ Comment Service  │  │
    │ └──────────┘ └──────────────────┘  │
    └─────────────────────────────────────┘
         │
    ┌─────┴──────────┬──────────┬────────────┐
    │                │          │            │
┌───▼───┐      ┌─────▼──┐ ┌────▼────┐ ┌─────▼──┐
│ Video │      │ Cache  │ │ Search  │ │ Config │
│ Store │      │ Layer  │ │ Index   │ │ Store  │
└───────┘      │ (Redis)│ │ (ES)    │ └────────┘
               └────────┘ └─────────┘
               
               ┌──────────────────────┐
               │  Message Queue       │
               │  (Kafka/RabbitMQ)    │
               └──────────────────────┘
```

### Key Components

**Upload Service**:
- Accepts video file
- Stores in object storage (S3, Cloud Storage)
- Queues for processing
- Returns video ID

**Video Processing**:
- Consumed from queue
- Transcodes to multiple resolutions (720p, 480p, 360p)
- Stores encoded versions
- Updates video metadata

**CDN (Content Delivery Network)**:
- Stores video copies geographically
- User watches from nearest edge location
- Reduced latency, bandwidth from origin

**Recommendation Service**:
- Real-time and batch processing
- Analyzes watch history
- ML models for personalization
- Billions users × millions videos problem

**Search Service**:
- Elasticsearch indexes all metadata
- Real-time indexing on upload
- Distributed search queries

### Scaling Strategy

**Storage**: Object storage (S3) - unlimited scale
**Processing**: Message queue + workers (scale workers for backlog)
**Delivery**: CDN (geographic distribution)
**Database**: Read replicas for metadata, caching for popular videos
**Recommendations**: Offline batch models + real-time scoring

### Key Tradeoffs

- **Consistency vs availability**: Recommendations slightly stale but always available
- **Accuracy vs speed**: Fast recommendations > perfect but slow
- **Live processing vs batch**: Hybrid approach (batch for background, real-time for trending)

---

## Case Study 2: Uber Real-Time System

### Requirements

**Functional**:
- Driver-passenger matching
- Real-time location tracking
- ETA calculation
- Payment processing

**Non-functional**:
- Latency: < 100ms for location update
- Scale: 10M users, 1M concurrent
- Availability: 99.95% uptime

### Key Challenges

1. **Real-time updates**: 1M drivers × 4 updates/min = 66k QPS of location
2. **Geographic search**: Find nearest drivers quickly
3. **Matching algorithm**: Billion+ possible pairs
4. **Consistency**: Drivers and passengers must agree on trip state

### Architecture

```
┌──────────────────┐
│  Driver/Rider    │
│  Mobile App      │
└────────┬─────────┘
         │ Location update
    ┌────▼──────────────┐
    │ API Gateway + LB  │
    └────┬──────────────┘
         │
┌────────┴────────────────┬──────────────┬─────────────┐
│                         │              │             │
│  ┌──────────────────┐   │  ┌────────┐ │  ┌────────┐ │
│  │ Matching Service │   │  │ ETA    │ │  │ Payment│ │
│  │ (Real-time)      │   │  │ Service│ │  │Service │ │
│  └──────────────────┘   │  └────────┘ │  └────────┘ │
│                         │              │             │
│  ┌──────────────────┐   │              │             │
│  │ Location Service │───┘              │             │
│  │ (Hot spot)       │                  │             │
│  └──────────────────┘                  │             │
│                                         │             │
└─────────────────────────────────────────┴─────────────┘
         │           │           │            │
    ┌────▼──┐   ┌────▼──┐  ┌────▼───┐  ┌────▼────┐
    │Geohash│   │ Redis │  │Database │  │ Message │
    │Index  │   │(Cache)│  │(Pending │  │ Queue   │
    │       │   │       │  │ trips)  │  │ (Events)│
    └───────┘   └───────┘  └────────┘  └─────────┘
```

### Key Components

**Location Service**:
- Receives location updates from 1M drivers
- Uses geohashing for spatial indexing
- Stores in Redis (fast, in-memory)
- Publishes to message queue for subscribers

**Matching Service**:
- Subscribes to location updates
- When rider requests: Find K nearest drivers
- Score by distance, acceptance rate, surge
- Send match requests to top drivers
- First to accept gets the trip

**ETA Service**:
- Google Maps integration
- Calculates route and time
- Updates as traffic changes
- Impacts pricing and matching

**Payment Service**:
- Process payment after trip
- Handle disputes
- Surge pricing calculation

### Scaling Strategy

**Location updates**: Partition by geography (geohash buckets)
- Each region's updates go to dedicated location server
- Reduces global contention
- Matching queries only contact relevant servers

**Matching**: Stateless service (scales horizontally)
- Can add instances during peak hours
- Each instance processes matching independently

**Database**: Separate read/write paths
- Writes: Trip creation (transactional)
- Reads: Pending trips (can lag)

### Key Tradeoffs

- **Matching latency vs optimal match**: Fast match (user sees driver quickly) > perfect match that takes 10s
- **Consistency vs availability**: Occasional duplicate matches acceptable (one gets cancelled)
- **Cost vs accuracy**: Approximate nearest neighbor > exact (cheaper to compute)

---

## Case Study 3: Twitter Feed System

### Requirements

**Functional**:
- Tweet creation and deletion
- Follow/unfollow
- Home feed (tweets from followed users)
- Notifications

**Non-functional**:
- Latency: < 200ms for feed load
- Scale: 300M+ users, 500M tweets/day, 100M+ daily active
- Availability: 99.9% uptime

### Key Challenges

1. **Read/write ratio**: 100:1 (mostly reading feeds)
2. **Fan-out problem**: Tweet visible to all followers instantly
3. **Denormalization**: Precompute feeds for speed
4. **Consistency**: New tweet should appear for followers quickly

### Two Approaches

**Approach 1: Write Fan-Out (Push on tweet)**
```
User tweets → 
Service publishes to all 1M followers' feed queues →
Feeds updated in real-time
```

**Pros**: Followers see tweet immediately  
**Cons**: Heavy on write, hard if user has billions followers  
**Better for**: Normal users

**Approach 2: Read Fan-In (Pull on view)**
```
User requests feed →
Service fetches tweets from all 5000 followed users →
Merge and sort by time →
Return top 100
```

**Pros**: Lightweight writes  
**Cons**: Followers see tweet with delay, more read latency  
**Better for**: When followers > resources

**Actual approach**: Hybrid
- Normal users: Push (write fan-out)
- Celebrities: Pull (read fan-in) to avoid overload

### Architecture

```
┌──────────────┐
│Mobile App    │
└──────┬───────┘
       │
   ┌───▼────────────────────┐
   │  Load Balancer (CDN)   │
   └───┬────────────────────┘
       │
   ┌───┴──────────────────────────────────┐
   │         API Gateway                   │
   ├────────────────────────────────────────┤
   │ ┌────────────┐  ┌────────────────┐   │
   │ │ Tweet      │  │ Relation       │   │
   │ │ Service    │  │ Service        │   │
   │ └────────────┘  │ (Follow graph) │   │
   │ ┌────────────┐  └────────────────┘   │
   │ │ Feed       │  ┌────────────────┐   │
   │ │ Service    │  │ Timeline Cache │   │
   │ └────────────┘  │ (Redis)        │   │
   │ ┌────────────┐  └────────────────┘   │
   │ │ Notification
   │ │ Service    │                       │
   │ └────────────┘                       │
   └────┬───────────────────────────────────┘
        │
    ┌───┴────────┬──────────┬────────────┐
    │            │          │            │
 ┌──▼──┐  ┌──────▼──┐ ┌───▼────┐ ┌────▼────┐
 │Tweet│  │Timeline │ │ Follow │ │ Search  │
 │Store│  │Cache    │ │ Graph  │ │ Index   │
 └─────┘  │ (Redis) │ │(Graph) │ └─────────┘
          └─────────┘ └────────┘
          
          ┌─────────────────┐
          │ Message Queue   │
          │ (Fan-out tasks) │
          └─────────────────┘
```

### Key Components

**Tweet Service**:
- Store tweet in database
- Index for search
- Publish to message queue

**Feed Service**:
- For push model: Subscribe to followed users' tweets, add to feed cache
- For pull model: Fetch last N tweets from all followed users, merge
- Cache result in Redis

**Relation Service**:
- Maintain follow graph
- Query: "Get all followers of user X"
- Often in graph database (Neo4j) or denormalized

**Timeline Cache (Redis)**:
- Cache top 100 tweets for popular feeds
- Pre-compute feeds for active users
- LRU eviction for inactive users

### Scaling Strategy

**Graph database**: For follow relationships (social network queries)
**Timeline cache**: Precompute for active users, compute on-demand for inactive
**Message queue**: Batch processing for fan-out
**Search index**: Elasticsearch for tweet search

### Key Tradeoffs

- **Push vs pull**: Normal users push (fast), celebrities pull (cheap)
- **Consistency vs latency**: Eventually consistent feeds (fast) vs immediate update
- **Cache**: Popular accounts cached, inactive users computed on-demand

---

## Case Study 4: Spotify Music Streaming

### Requirements

**Functional**:
- Search and browse music
- Streaming (high quality audio)
- Playlists and recommendations
- Offline mode

**Non-functional**:
- Availability: 99.99% (music service down = bad)
- Latency: < 500ms for search/browse
- Scale: 400M+ users, 70M+ songs

### Key Challenges

1. **Copyright management**: License agreements per country
2. **Audio quality variation**: Bitrate adaptation (10mbps to 320kbps)
3. **Recommendations**: Personalize billions users × millions songs
4. **Caching**: Popular songs (Top 100) vs long tail

### Architecture

```
┌──────────────┐
│Client App    │
└──────┬───────┘
       │
   ┌───▼────────────────┐
   │  CDN (Audio edge)  │ ← Per stream
   └───┬────────────────┘
       │
   ┌───┴──────────────────────────────┐
   │      API Services                 │
   ├──────────────────────────────────┤
   │ ┌────────────┐ ┌──────────────┐ │
   │ │ Search     │ │ Playback     │ │
   │ │ Service    │ │ Service      │ │
   │ └────────────┘ └──────────────┘ │
   │ ┌────────────┐ ┌──────────────┐ │
   │ │ Catalog    │ │ Recommendation
   │ │ Service    │ │ Service      │ │
   │ └────────────┘ └──────────────┘ │
   │ ┌────────────┐ ┌──────────────┐ │
   │ │ Playlist   │ │ Offline Sync │ │
   │ │ Service    │ │ Queue        │ │
   │ └────────────┘ └──────────────┘ │
   └────┬──────────────────────────────┘
        │
    ┌───┴────────┬───────────┬──────────┐
    │            │           │          │
 ┌──▼──┐  ┌──────▼──┐ ┌────▼───┐ ┌────▼────┐
 │Audio│  │ Cache   │ │ Catalog│ │ User    │
 │Store│  │ (Redis) │ │ DB     │ │ Service │
 └─────┘  └─────────┘ │(Hits)  │ └─────────┘
                       └────────┘
                       
          ┌──────────────────────┐
          │ Recommendation       │
          │ Engine (ML off-batch)│
          └──────────────────────┘
```

### Key Components

**Playback Service**:
- Start playing track
- Adaptive bitrate (check client bandwidth, cache quality accordingly)
- Track position and skip events
- Log for analytics

**Catalog Service**:
- Billions songs catalog
- Metadata (artist, album, genre)
- Licensed by region:
  - Some songs available in some countries
  - Cache decision results

**Recommendation Service**:
- Batch ML jobs overnight
- Score: tracks user likely to stream
- Real-time scoring for context (time of day, activity)
- Collaborative filtering (users similar to you)

**Audio Store**:
- Multiple bitrates per song: 96kbps, 160kbps, 320kbps
- At stream time: Fetch most appropriate quality
- CDN edge locations cache popular songs

### Scaling Strategy

**CDN for audio**: Geo-replicate to edge locations near users  
**Multi-bitrate**: Serve appropriate quality to reduce bandwidth  
**Recommend offline**: Batch jobs, not real-time  
**Cache hot songs**: Top 100 on every edge, tail songs on demand

### Key Tradeoffs

- **Audio quality vs bandwidth**: Adapt to user connection
- **Recommendation accuracy vs latency**: Batch models (better) run nightly
- **Licensing complexity**: Reduced catalog but available

---

## Comparison Table

| Factor | YouTube | Uber | Twitter | Spotify |
|--------|---------|------|---------|---------|
| **Main challenge** | Storage/CDN | Real-time location | Fan-out scale | Licensing/Quality |
| **Read/write ratio** | 100:1 | 1:1 | 100:1 | 100:1 |
| **Critical path** | Video delivery | Matching latency | Feed generation | Playback start |
| **Scaling focus** | CDN + encoding | Geographic partitioning | Cache + denormalization | Bitrate adaptation |
| **Consistency needs** | High | High (trip state) | Low (eventual ok) | Medium |

---

## Interview Tips

### Approach

1. **Understanding phase**: Ask clarifying questions
2. **Requirement definition**: Write functional and non-functional
3. **Data estimates**: QPS, storage, bandwidth
4. **API design**: Write key APIs
5. **Database schema**: Show tables/documents
6. **Architecture diagram**: Draw services, data flow
7. **Discuss tradeoffs**: Why this approach?
8. **Scale discussion**: What happens at 10x load?

### What Interviewers Evaluate

- [ ] Do you clarify before designing?
- [ ] Did you estimate data at scale?
- [ ] Is architecture modular (services)?
- [ ] Did you address bottlenecks proactively?
- [ ] Can you defend your choices?
- [ ] Do you know relevant technologies?

### Common Mistakes

- Designing monolith instead of services
- Ignoring replication/redundancy
- Not estimating data requirements
- No caching strategy discussed
- Forgetting about CDN for content delivery
- Not mentioning monitoring/alerting

## Key Takeaways

1. **Understand requirements first**: Many mistakes from wrong assumptions
2. **Estimates drive architecture**: 100 QPS vs 100k QPS need different solutions
3. **Service-oriented design**: Easier to scale services independently
4. **Caching is powerful**: Can 100x throughput
5. **Redundancy costs**: But necessary for availability
6. **Tradeoffs are everywhere**: Consistency vs latency, cost vs accuracy

---

## Deep Dive Interview Questions & Answers

### YouTube Q&A

**Q1: How would you handle the case where millions of users try to view the same viral video simultaneously (say, post-match highlights)?**

**Answer**:
```
Traffic spike scenario: 10M users × 1M concurrent = Instant bottleneck

Solution layers (defense in depth):

1. CDN Edge Caching (Primary):
   - Video cached on CDN edge servers
   - Geo-distributed (1000+ edge locations)
   - Requests served from nearest edge, not origin
   - Cache TTL: 1 hour or until unpopular
   
2. Application-level cache (Cache hit rate important):
   - Redis cluster storing popular video metadata/thumbnails
   - Cache structure: metadata:video_id → {title, views, duration}
   - Cache invalidation on update (low frequency for old videos)
   
3. Database read replicas:
   - Video metadata in Postgres
   - 10 read replicas for metadata queries
   - Writes go to primary, reads distributed
   
4. Connection pooling:
   - Limit DB connections (prevent exhaustion)
   - Pool size: 100 connections per app server
   - Use queue for excess requests
   
5. Rate limiting & throttling:
   - Per-user rate limit: 100 requests/min
   - Per-IP rate limit: 1000 requests/min
   - Return 429 (Too Many Requests) when exceeded
   
Implementation:
VideoService {
    public Video getVideo(String videoId, String userId) {
        // 1. Try cache first
        Video cached = cache.get("video:" + videoId);
        if (cached != null) return cached;
        
        // 2. Query read replica (not primary)
        ReadReplica replica = getRandomReplica();
        Video video = replica.query("SELECT * FROM videos WHERE id = " + videoId);
        
        // 3. Cache for next request
        cache.set("video:" + videoId, video, TTL_1_HOUR);
        
        // 4. Increment view counter (eventual consistency ok)
        asyncQueue.add(new IncrementViewCountTask(videoId));
        
        return video;
    }
}

Watch playback delivery:
- GET /stream/video_id/format/quality
- CDN intercepts, checks if cached
- If hit: Serve from edge (instant, <100ms)
- If miss: Pull from origin, cache, serve
```

**Q2: Video transcoding can take hours. How do you prevent users from watching incompletely transcoded videos?**

**Answer**:
```
Problem: User uploads, starts processing to 5 formats
- 720p: 10 minutes to transcode
- 480p: 5 minutes to transcode
- 360p: 2 minutes to transcode

User tries to watch after 30 seconds → Only 360p available

Solution approach:

1. State machine for transcoding:
   enum TranscodingState {
       UPLOADED,      // Initial state
       PROCESSING,    // Any format processing
       READY_360p,    // At least lowest quality
       READY_480p,
       READY_FULL,    // All formats done
   }
   
2. When user requests playback:
   VideoMetadata video = getVideoMetadata(videoId);
   if (video.getState() == UPLOADED || 
       video.getState() == PROCESSING) {
       // Show "Processing, please try again"
       return 202 Accepted;
   }
   
   // Return highest available quality
   String availableQuality = video.getHighestAvailableQuality();
   // User might see 360p initially, upgrade to 720p later
   return streamVideo(videoId, availableQuality);

3. Client behavior (adaptive):
   - Start with lowest quality (always ready)
   - As higher qualities become available, upgrade
   - No interruption, just quality improvement
   
4. Background processing:
   - Process in order: 360p → 480p → 720p
   - As soon as 360p done, mark READY_360p
   - Users can watch immediately in low quality
   - Higher qualities become available over time
```

**Q3: How do you prevent DDoS attacks on video streaming?**

**Answer**:
```
Vulnerability: Attackers request same video millions of times
- Goal: Exhaust bandwidth or origin server

Multi-layer defense:

1. Rate limiting (per user, per IP):
   - User viewing same video: Max 5 requests/sec (reasonable user behavior)
   - IP viewing same video: Max 100 requests/sec
   - Violators get 429 Too Many Requests
   
2. CAPTCHA for suspicious traffic:
   - If IP requests from 100 different countries in 1 sec
   - If viewing time doesn't match video duration
   - Trigger challenge before serving
   
3. CDN DDoS protection:
   - Cloudflare, Akamai, etc., filter malicious traffic
   - Before it reaches origin
   - Uses reputation databases, behavioral analysis
   
4. Signature validation:
   - Signed URLs (only valid for 1 hour)
   - GET /stream?token=signed_JWT&expires=1234567890
   - Prevents leaking URL to attackers for amplification
   
5. Client authentication:
   - User must be logged in to stream
   - Prevents anon DDoS
   - Browser session identification
   
6. Monitoring (detect anomalies):
   - Alert when requests for same video spike >10x baseline
   - Monitor bandwidth from origin
   - Alert when uneven load (single video vs distributed)
   
Implementation:
class RateLimitFilter {
    public boolean allowRequest(String userId, String videoId, String ipAddress) {
        String key = "rate:" + userId + ":" + videoId;
        int count = redis.incr(key);
        redis.expire(key, 1_SECOND);
        
        if (count > 5) {
            logger.warn("Rate limit exceeded: " + userId);
            return false;
        }
        return true;
    }
}
```

---

### Uber Q&A

**Q1: What happens if the matching service goes down? Can drivers/riders still use the app?**

**Answer**:
```
Failure scenario: Matching service crashes

Immediate impact:
- New ride requests from riders → Can't find drivers
- Drivers waiting for requests → No new matches

Solution (graceful degradation):

1. Circuit breaker pattern:
   if (matchingService.isDown()) {
       return failoverMatching();  // Fallback logic
   }
   
2. Fallback strategies (in priority order):

   A. Fallback queue:
      - When matching service fails, queue ride requests
      - Rider sees: "Drivers busy, waiting to connect"
      - When service recovers, process queued requests
      - Riders wait longer but don't lose ride
      
   B. Simple geo-based matching:
      - If advanced matching unavailable
      - Use only geohash to find drivers
      - Match to closest N drivers without scoring
      - Less optimal but works
      
   C. Manual assignment:
      - Dispatch center manually assigns drivers
      - Slower but ensures riders < can get rides
      
   D. Redirect to competitor:
      - If willing to pay more money
      - Partner with Lyft, show option
      - Defection but maintains user satisfaction

3. Prediction & proactive mitigation:
   - Monitor matching service latency
   - If latency rising (p99 > 500ms), scale up
   - Add canary deployment for code changes
   - If deployment causes issues, auto-rollback
   
Implementation:
class MatchingServiceWrapper {
    private final MatchingService matching;
    private final Queue<RideRequest> fallbackQueue;
    private final CircuitBreaker circuitBreaker;
    
    public List<Driver> findDrivers(RideRequest request) {
        try {
            if (circuitBreaker.isClosed()) {
                return matching.findNearestDrivers(request);
            }
        } catch (ServiceException e) {
            circuitBreaker.recordFailure();
        }
        
        // Fallback
        logger.warn("Using fallback matching for request: " + request.id);
        fallbackQueue.add(request);
        return getSimpleGeohashMatch(request);
    }
}
```

**Q2: How far apart should location updates be? Too frequent = too much data, too sparse = stale location**

**Answer**:
```
Tradeoff analysis:

Too frequent (every 1 second):
- Pro: Accurate location, smooth UX
- Con: 1M drivers × 1 update/sec = 1M QPS
  - CDN cost: ~$100k/month for Location Service alone
  
Too sparse (every 30 seconds):
- Pro: 33k QPS (manageable)
- Con: Rider sees driver 30 seconds away from actual position
  - Driver may be out of view, feels weird
  - ETA calculation off
  
Optimal strategy (dynamic): Adaptive update frequency

Every 4 seconds is common:
- 1M drivers × 0.25 updates/sec = 250k QPS (manageable)
- Error margin: ±200m (pedestrian speed in 4 sec)
- Felt as near real-time to user

Adaptive (based on context):
event LocationUpdate {
    driver_id: string
    latitude: float
    longitude: float
    update_frequency: UpdateFrequency  // Server tells driver
}

enum UpdateFrequency {
    IDLE: 30s        // Driver waiting at parking lot
    MOVING: 4s       // Driver has active ride or searching
    EMERGENCY: 1s    // Accident, police call
}

Server decision:
MatchingService {
    public void onLocationUpdate(LocationUpdate update) {
        if (driver.hasActiveRide()) {
            recommendFrequency = UpdateFrequency.MOVING;  // 4s
        } else if (driver.isSearching()) {
            recommendFrequency = UpdateFrequency.MOVING;  // 4s
        } else {
            recommendFrequency = UpdateFrequency.IDLE;    // 30s
        }
        response.setNextUpdateFrequency(recommendFrequency);
    }
}

Cost calculation:
- Idle drivers: 100k × (1 update / 30s) = 3.3k QPS
- Active drivers: 900k × (1 update / 4s) = 225k QPS
- Total: ~230k QPS (vs 1M if always frequent)
- Cost: ~$23k/month (vs $100k)

Advantage: Flexibility
- Network capacity exceeded? → Increase idle frequency to 60s
- Need more accuracy? → Decrease moving frequency to 2s
```

**Q3: What's the data model for storing a completed trip? What queries must be fast?**

**Answer**:
```
Trips table schema:

CREATE TABLE trips (
    id BIGINT PRIMARY KEY,
    rider_id BIGINT,
    driver_id BIGINT,
    request_time TIMESTAMP,
    pickup_time TIMESTAMP,
    dropoff_time TIMESTAMP,
    pickup_lat DECIMAL(10,8),
    pickup_lng DECIMAL(11,8),
    dropoff_lat DECIMAL(10,8),
    dropoff_lng DECIMAL(11,8),
    distance_km DECIMAL(8,3),
    duration_sec INT,
    fare_amount DECIMAL(8,2),
    rating INT,
    status ENUM('completed', 'cancelled'),
    
    INDEX idx_rider_time (rider_id, request_time DESC),
    INDEX idx_driver_time (driver_id, request_time DESC),
    INDEX idx_status (status),
    INDEX idx_created_date (DATE(request_time))
);

Fast query patterns:

1. User's trip history (most common):
   SELECT * FROM trips 
   WHERE rider_id = ? 
   ORDER BY request_time DESC 
   LIMIT 10;
   → Index: (rider_id, request_time DESC)

2. Driver's earnings (for payment):
   SELECT SUM(fare_amount), COUNT(*) 
   FROM trips 
   WHERE driver_id = ? 
   AND request_time >= DATE_SUB(NOW(), INTERVAL 7 DAY);
   → Index: (driver_id, request_time DESC)

3. Nightly settlement (batch job):
   SELECT driver_id, SUM(fare_amount) 
   FROM trips 
   WHERE DATE(request_time) = ? 
   GROUP BY driver_id;
   → Index: (DATE(request_time), driver_id)

4. Map tile heat (where are requests coming from):
   SELECT COUNT(*) 
   FROM trips 
   WHERE pickup_lat BETWEEN ? AND ? 
   AND pickup_lng BETWEEN ? AND ? 
   AND request_time >= ?;
   → Spatial index or geohash pre-aggregation
   
Optimization technique: Pre-aggregate
- Compute daily rolling aggregates in batch
- Store in separate table: trips_daily_stats
- Most queries don't need real-time, day-old ok
- Reduces query load on main trips table
```

---

### Microservices Design Q&A

**Q1: Design a recommendation service for an e-commerce platform using microservices. What are the key tradeoffs?**

**Answer**:
```
Problem: Recommend products to user browsing items

Option 1: Monolith (one service)

Pros:
- Simple to deploy
- Single database transaction (ACID)
- One code base

Cons:
- Recommendation engine (CPU intensive) blocks user requests
- Can't independently scale recommender
- Update recommendation algorithm → redeploy entire app
- Bug in recommendation → entire system down

Option 2: Separated microservices

Architecture:
┌────────────────────┐
│   API Gateway      │
└─────────┬──────────┘
          │
    ┌─────┴──────────┐
    │                │
    ▼                ▼
┌─────────────┐  ┌──────────────────┐
│   Product   │  │ Recommendation   │
│   Service   │  │ Service (CPU-     │
│             │  │ intensive)       │
└─────────────┘  │                  │
                 │ Cache results    │
                 └──────────────────┘

Pros:
- Recommendation latency doesn't block product load
- Scale recommender independently (needs more CPU)
- Deploy new recommendation algorithm without touching product service
- Can use different language (Python/ML in recommender vs Node.js in product)

Cons:
- Network calls between services add latency
- Eventual consistency (recommendation lag)
- More operational complexity (deploy 2 services)
- Testing harder (need mock recommendation service)

Implementation:

1. Recommendation service returns precomputed scores:

   GET /recommendations?user_id=123&num_items=10
   Response: [
       { product_id: 456, score: 0.95 },
       { product_id: 789, score: 0.89 }
   ]
   (Scores precomputed via batch ML job)

2. Product service calls when needed:

   def get_user_feed(user_id):
       # Get user's recent items
       recent_items = product_service.getRecent(user_id)
       
       # Get recommendations (async cache)
       recommendations = recommendation_service.getRecommendations(user_id)
       
       # Merge and return
       return merge_and_rank(recent_items, recommendations)

3. Caching for scalability:

   class RecommendationService:
       def getRecommendations(user_id):
           cache_key = f"recs:{user_id}"
           
           # Try cache first
           cached = cache.get(cache_key)
           if cached:
               return cached
           
           # Compute if not cached
           recs = compute_recommendations(user_id)
           cache.set(cache_key, recs, TTL=1_HOUR)
           return recs

4. Error handling (service down):

   try:
       recs = recommendation_service.getRecommendations(user_id)
   except ServiceException:
       # Fallback to trending items if recommendation unavailable
       recs = cache.get("trending_items")
   
   return merge(recent_items, recs)

Tradeoff analysis:
- Latency: Monolith ~50ms, Microservices ~150ms (network calls)
  But recommendation doesn't block, so user sees product faster
- Scalability: Monolith can handle 1000 QPS with 10 servers
  Microservices: Product=10 servers, Recommendation=5 servers (independent)
- Cost: Microservices slightly higher (2 deployments, 2 databases)
```

**Q2: Design a distributed payment system using microservices. How do you ensure consistency across services?**

**Answer**:
```
Problem: Payment touches multiple services
- Order Service (create order)
- Inventory Service (reserve stock)
- Payment Service (charge card)
- Notification Service (send receipt)

If Order created but Payment fails:
- Customer shouldn't be charged
- Stock shouldn't be reserved
- Notification shouldn't be sent

Challenge: No distributed transactions (not ACID)

Solution 1: Saga pattern (choreography)

Order Service creates order:
{
    order_id: "123",
    state: "PENDING",
    items: [...]
}

order → emit(order.created) 

Inventory Service listens:
→ Reserves stock
→ Transitions order state to INVENTORY_RESERVED
→ Emit order.inventory_reserved

Payment Service listens:
→ Charges card
→ If fails: emit order.payment_failed
→ If succeeds: emit order.paid

Inventory Service listening to payment_failed:
→ Release reserved stock
→ Transition to CANCELLED

Notification Service listening to order.paid:
→ Send receipt email

Code example:

EventBus eventBus = new KafkaEventBus();

class OrderService {
    public void createOrder(Order order) {
        order.setState(PENDING);
        orderDB.save(order);
        eventBus.publish("order.created", order);  // ← Trigger others
    }
}

class InventoryService {
    public InventoryService(EventBus eventBus) {
        eventBus.subscribe("order.created", this::onOrderCreated);
        eventBus.subscribe("order.payment_failed", this::onPaymentFailed);
    }
    
    private void onOrderCreated(Order order) {
        try {
            inventory.reserveStock(order);
            eventBus.publish("order.inventory_reserved", order);
        } catch (OutOfStockException e) {
            eventBus.publish("order.inventory_reservation_failed", order);
        }
    }
    
    private void onPaymentFailed(Order order) {
        inventory.releaseStock(order);
    }
}

class PaymentService {
    public PaymentService(EventBus eventBus) {
        eventBus.subscribe("order.inventory_reserved", this::onInventoryReserved);
    }
    
    private void onInventoryReserved(Order order) {
        try {
            payment.charge(order);
            eventBus.publish("order.paid", order);
        } catch (PaymentException e) {
            eventBus.publish("order.payment_failed", order);
        }
    }
}

Tradeoffs:
- Pro: Loose coupling, no distributed locks
- Con: Hard to understand flow (distributed across services)
- Con: Eventual consistency (awkward UI if payment pending)
- Con: Compensating transactions (rollback logic everywhere)

Solution 2: Saga pattern (orchestration)

SagaOrchestrator coordinates:

state machine:
PENDING → 
  INVENTORY_RESERVED → 
    PAYMENT_CHARGED → 
      NOTIFICATION_SENT → 
    COMPLETED

Orchestrator:
class OrderSaga {
    public void execute(Order order) {
        try {
            orderService.createOrder(order);
            inventoryService.reserve(order);   // Throws if fail
            paymentService.charge(order);      // Throws if fail
            notificationService.notify(order);
            notificationService.sendReceipt(order);
        } catch (Exception e) {
            // Compensate
            inventoryService.release(order);
            paymentService.refund(order);
            orderService.cancel(order);
        }
    }
}

Better for: Simple flows with clear happy path
Worse for: Complex flows with many parallel steps
```

---

## Interview Success Checklist for HLD

- [ ] Clarify scale before designing (10k vs 10M users)
- [ ] Calculate rough QPS and storage requirements
- [ ] Draw architecture with services clearly separated
- [ ] Show how data flows (API requests, event streams)
- [ ] Explain why you chose specific technologies (SQL vs NoSQL)
- [ ] Discuss at least 2 scaling bottlenecks and solutions
- [ ] Address a failure scenario (service down, network partition)
- [ ] Show understanding of consistency (when stale data acceptable)
- [ ] Mention monitoring/alerting
- [ ] Discuss cost implications (CDN, databases, servers)
