# Design Document: Browse Tasks Page Optimization

## Overview

This design optimizes the Browse Tasks page performance by addressing three key areas: query optimization, pagination, and caching. The current implementation suffers from high query planning time (19ms) due to an unnecessary `SELECT DISTINCT` clause and lack of result pagination. By removing the DISTINCT clause, implementing pagination, and adding Redis-based caching, we can reduce total response time from 29ms to under 15ms while maintaining backward compatibility.

The optimization strategy focuses on:
1. **Query Optimization**: Remove unnecessary DISTINCT, maintain existing JOINs
2. **Pagination**: Limit result sets to reduce data transfer and processing
3. **Caching**: Store frequently accessed results in Redis with smart invalidation
4. **Monitoring**: Track performance metrics for ongoing optimization

## Architecture

### Current Architecture

```
Client Request → Express Route → TaskService.getAvailableTasks() → PostgreSQL Query → Response
```

**Current Query Structure:**
- SELECT DISTINCT with 6 LEFT JOINs
- No pagination (returns all 640 tasks)
- No caching layer
- Query planning: 19ms, Execution: 6.3ms, Total: ~29ms

### Optimized Architecture

```
Client Request → Express Route → TaskService.getAvailableTasks()
                                        ↓
                                  Check Redis Cache
                                   ↓           ↓
                            Cache Hit    Cache Miss
                                   ↓           ↓
                            Return Cached  PostgreSQL Query
                                              ↓
                                        Cache Result
                                              ↓
                                          Response
```

**Optimized Query Structure:**
- Remove SELECT DISTINCT
- Add LIMIT/OFFSET for pagination
- Maintain all LEFT JOINs for data completeness
- Add Redis caching layer with 60s TTL
- Expected: Planning <5ms, Execution <10ms, Total <15ms

### Cache Invalidation Flow

```
Task Mutation (Create/Update/Delete/Assign)
        ↓
TaskService Method
        ↓
Execute Database Operation
        ↓
Invalidate Cache Pattern: "available_tasks:*"
        ↓
Next Request Rebuilds Cache
```

## Components and Interfaces

### 1. CacheService

A new service responsible for Redis operations with fallback handling.

**Interface:**
```typescript
interface CacheService {
  // Get cached value by key
  get<T>(key: string): Promise<T | null>;
  
  // Set cached value with expiration
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  
  // Delete specific cache key
  delete(key: string): Promise<void>;
  
  // Delete all keys matching pattern
  deletePattern(pattern: string): Promise<void>;
  
  // Check if Redis is available
  isAvailable(): boolean;
}
```

**Implementation Details:**
- Wraps Redis client with error handling
- Returns null on cache miss or Redis unavailability
- Logs all cache operations for monitoring
- Implements circuit breaker to prevent cascading failures
- Serializes/deserializes JSON automatically

### 2. TaskService (Modified)

Enhanced with caching and pagination support.

**New Method Signature:**
```typescript
interface PaginationParams {
  page?: number;      // Default: 1
  pageSize?: number;  // Default: 50, Max: 100
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

async getAvailableTasks(
  userId: string,
  userRole?: string,
  pagination?: PaginationParams
): Promise<Task[] | PaginatedResponse<Task>>
```

**Cache Key Strategy:**
```typescript
// Cache key format: available_tasks:{userId}:{role}:{page}:{pageSize}
function buildCacheKey(userId: string, role: string, page: number, pageSize: number): string {
  return `available_tasks:${userId}:${role}:${page}:${pageSize}`;
}
```

**Modified Methods for Cache Invalidation:**
- `createTask()` - Invalidate after successful creation
- `updateTask()` - Invalidate after successful update
- `deleteTask()` - Invalidate after successful deletion
- `assignTask()` - Invalidate after successful assignment
- `acceptTask()` - Invalidate after successful acceptance
- `abandonTask()` - Invalidate after successful abandonment
- `transferTask()` - Invalidate after successful transfer
- `completeTask()` - Invalidate after successful completion

### 3. Task Routes (Modified)

Enhanced route handler with pagination parameter parsing.

**Route Handler:**
```typescript
router.get('/available', authMiddleware, async (req, res) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  
  // Parse pagination parameters
  const page = parseInt(req.query.page as string) || undefined;
  const pageSize = parseInt(req.query.pageSize as string) || undefined;
  
  // Validate pagination parameters
  if (page !== undefined && page < 1) {
    return res.status(400).json({ error: 'Page must be >= 1' });
  }
  if (pageSize !== undefined && (pageSize < 1 || pageSize > 100)) {
    return res.status(400).json({ error: 'Page size must be between 1 and 100' });
  }
  
  const pagination = (page || pageSize) ? { page, pageSize } : undefined;
  
  const result = await taskService.getAvailableTasks(userId, userRole, pagination);
  res.json(result);
});
```

### 4. PerformanceMonitor

A utility for tracking and logging performance metrics.

**Interface:**
```typescript
interface PerformanceMetrics {
  operation: string;
  duration: number;
  cacheHit?: boolean;
  timestamp: Date;
}

interface PerformanceMonitor {
  // Start timing an operation
  startTimer(operation: string): () => void;
  
  // Log performance metrics
  logMetrics(metrics: PerformanceMetrics): void;
  
  // Get aggregated metrics
  getMetrics(operation: string, timeWindow: number): AggregatedMetrics;
}
```

## Data Models

### Pagination Parameters

```typescript
interface PaginationParams {
  page?: number;      // Page number (1-indexed), default: 1
  pageSize?: number;  // Items per page, default: 50, max: 100
}
```

### Paginated Response

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

### Cache Configuration

```typescript
interface CacheConfig {
  ttl: number;              // Time to live in seconds
  keyPrefix: string;        // Prefix for cache keys
  invalidationPattern: string; // Pattern for bulk invalidation
}

const AVAILABLE_TASKS_CACHE_CONFIG: CacheConfig = {
  ttl: 60,                           // 60 seconds
  keyPrefix: 'available_tasks',
  invalidationPattern: 'available_tasks:*'
};
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  operation: string;        // e.g., "getAvailableTasks"
  duration: number;         // Execution time in milliseconds
  cacheHit?: boolean;       // Whether cache was hit
  resultCount?: number;     // Number of results returned
  timestamp: Date;          // When the operation occurred
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Query Result Completeness
*For any* task returned by getAvailableTasks, the task object should include all required fields: id, name, description, publisher information (id, username, email, avatarId, avatarUrl, role), position name, group name, project group name, and all task metadata fields.
**Validates: Requirements 1.4, 5.1, 5.2**

### Property 2: Visibility Filtering Correctness
*For any* user and task combination, the task should only be included in getAvailableTasks results if: (1) the task visibility is PUBLIC, OR (2) the task visibility is POSITION_ONLY and the user has the required position or is an admin, OR (3) the task visibility is PRIVATE and the user is the publisher or is a super admin.
**Validates: Requirements 1.5, 5.5**

### Property 3: Pagination Size Constraint
*For any* valid pagination request with page size N (where 1 ≤ N ≤ 100), the returned result should contain at most N tasks.
**Validates: Requirements 2.2**

### Property 4: Pagination Metadata Completeness
*For any* paginated request, the response should include a pagination object with fields: currentPage, pageSize, totalItems, and totalPages, where totalPages = ceil(totalItems / pageSize).
**Validates: Requirements 2.3**

### Property 5: Result Ordering Invariant
*For any* result set from getAvailableTasks (paginated or not), tasks should be ordered by created_at in descending order (newest first).
**Validates: Requirements 2.4**

### Property 6: Invalid Pagination Rejection
*For any* invalid pagination parameters (page < 1, pageSize < 1, or pageSize > 100), the system should reject the request with a validation error.
**Validates: Requirements 2.5, 8.3**

### Property 7: Cache Write Behavior
*For any* successful query execution, if Redis is available, the result should be cached with a key in the format "available_tasks:{userId}:{role}:{page}:{pageSize}" and TTL of 60 seconds.
**Validates: Requirements 3.1, 3.4**

### Property 8: Cache Hit Behavior
*For any* request where a valid cached result exists, the system should return the cached result without executing a database query.
**Validates: Requirements 3.2**

### Property 9: Cache Invalidation on Mutations
*For any* task mutation operation (create, update, delete, assign, accept, abandon, transfer, complete), all cache keys matching the pattern "available_tasks:*" should be invalidated.
**Validates: Requirements 3.3, 6.1, 6.2, 6.3, 6.4**

### Property 10: Redis Failure Resilience
*For any* request when Redis is unavailable or fails, the system should fall back to direct database queries and return correct results without caching.
**Validates: Requirements 3.5, 8.1**

### Property 11: Non-Paginated Response Format
*For any* request without pagination parameters, the response should be a plain array of task objects (not wrapped in a pagination envelope).
**Validates: Requirements 5.3**

### Property 12: Paginated Response Format
*For any* request with pagination parameters, the response should be an object with "data" field (array of tasks) and "pagination" field (metadata object).
**Validates: Requirements 5.4**

### Property 13: Cache Deserialization Resilience
*For any* cached value that fails to deserialize, the system should log the error, invalidate the corrupted cache entry, and re-query the database to return correct results.
**Validates: Requirements 8.4**

### Property 14: Circuit Breaker Behavior
*For any* sequence of Redis operations, after N consecutive failures (N=5), subsequent Redis operations should be bypassed for a cooldown period, and the system should use database-only mode.
**Validates: Requirements 8.5**

## Error Handling

### Error Categories

1. **Validation Errors (400)**
   - Invalid pagination parameters (page < 1, pageSize out of range)
   - Return: `{ error: "Descriptive validation message" }`

2. **Database Errors (500)**
   - Query execution failures
   - Connection issues
   - Return: `{ error: "Internal server error" }` (no sensitive data)

3. **Cache Errors (Transparent)**
   - Redis connection failures → Log and continue with database
   - Cache deserialization failures → Log, invalidate, and re-query
   - Circuit breaker activation → Log and use database-only mode

### Error Handling Strategy

```typescript
async getAvailableTasks(userId: string, userRole?: string, pagination?: PaginationParams) {
  try {
    // Validate pagination parameters
    if (pagination) {
      validatePagination(pagination); // Throws ValidationError
    }
    
    // Try cache first (with circuit breaker)
    if (cacheService.isAvailable()) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // Query database
    const result = await queryDatabase(userId, userRole, pagination);
    
    // Cache result (best effort, don't fail on cache errors)
    try {
      await cacheService.set(cacheKey, result, 60);
    } catch (cacheError) {
      logger.warn('Failed to cache result', { error: cacheError });
    }
    
    return result;
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error; // Let route handler convert to 400
    }
    logger.error('Failed to get available tasks', { error, userId });
    throw new Error('Internal server error'); // Convert to 500
  }
}
```

### Circuit Breaker Implementation

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  private readonly FAILURE_THRESHOLD = 5;
  private readonly COOLDOWN_MS = 30000; // 30 seconds
  
  async execute<T>(operation: () => Promise<T>): Promise<T | null> {
    // If circuit is open, check if cooldown period has passed
    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailureTime!.getTime();
      if (timeSinceFailure < this.COOLDOWN_MS) {
        return null; // Circuit still open, skip operation
      }
      this.state = 'HALF_OPEN'; // Try one request
    }
    
    try {
      const result = await operation();
      // Success - reset circuit
      this.failureCount = 0;
      this.state = 'CLOSED';
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = new Date();
      
      if (this.failureCount >= this.FAILURE_THRESHOLD) {
        this.state = 'OPEN';
        logger.warn('Circuit breaker opened', { failureCount: this.failureCount });
      }
      
      return null;
    }
  }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of pagination (first page, last page, empty results)
- Cache key format validation
- Error message content
- Circuit breaker state transitions
- Logging behavior verification

**Property-Based Tests** focus on:
- Universal properties across all valid inputs (Properties 1-14)
- Pagination behavior with random page sizes and page numbers
- Visibility filtering with random user/task combinations
- Cache invalidation across all mutation types
- Resilience behavior with simulated failures

### Property-Based Testing Configuration

We will use **fast-check** (for TypeScript/JavaScript) as the property-based testing library. Each property test will:
- Run a minimum of 100 iterations to ensure comprehensive input coverage
- Be tagged with a comment referencing the design property
- Use custom generators for domain objects (users, tasks, pagination params)

**Tag Format:**
```typescript
// Feature: browse-tasks-optimization, Property 2: Visibility Filtering Correctness
test('visibility filtering applies correct rules for all user/task combinations', async () => {
  await fc.assert(
    fc.asyncProperty(
      userGenerator(),
      taskGenerator(),
      async (user, task) => {
        // Property test implementation
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

```
tests/
  unit/
    CacheService.test.ts          # Cache operations, circuit breaker
    TaskService.pagination.test.ts # Pagination logic
    TaskService.caching.test.ts    # Cache integration
  property/
    visibility-filtering.property.test.ts  # Property 2
    pagination.property.test.ts            # Properties 3-6
    caching.property.test.ts               # Properties 7-10
    response-format.property.test.ts       # Properties 11-12
    resilience.property.test.ts            # Properties 13-14
  integration/
    available-tasks.integration.test.ts    # End-to-end flow
```

### Key Test Scenarios

**Unit Test Examples:**
1. Default pagination returns 50 tasks
2. Cache key format matches pattern
3. Circuit breaker opens after 5 failures
4. Invalid page number returns 400 error
5. Redis unavailable logs warning and continues

**Property Test Examples:**
1. For all valid pagination params, result size ≤ pageSize
2. For all users and tasks, visibility rules are correctly applied
3. For all task mutations, cache is invalidated
4. For all cache hits, database is not queried
5. For all Redis failures, system returns correct results

### Performance Testing

While not part of automated unit/property tests, performance should be validated through:
- Load testing with 1000+ concurrent requests
- Query execution time monitoring (target: <15ms)
- Cache hit rate monitoring (target: >80% after warmup)
- Database query plan analysis (EXPLAIN ANALYZE)

## Implementation Notes

### Query Optimization Details

**Before (with DISTINCT):**
```sql
SELECT DISTINCT t.id, t.name, ... -- 30+ fields
FROM tasks t
LEFT JOIN user_positions up ON ...
LEFT JOIN users u ON ...
LEFT JOIN avatars a ON ...
LEFT JOIN positions p ON ...
LEFT JOIN task_groups tg ON ...
LEFT JOIN project_groups pg ON ...
WHERE t.is_executable = true AND t.assignee_id IS NULL AND (...)
ORDER BY t.created_at DESC
```

**After (without DISTINCT, with pagination):**
```sql
SELECT t.id, t.name, ... -- 30+ fields
FROM tasks t
LEFT JOIN user_positions up ON ...
LEFT JOIN users u ON ...
LEFT JOIN avatars a ON ...
LEFT JOIN positions p ON ...
LEFT JOIN task_groups tg ON ...
LEFT JOIN project_groups pg ON ...
WHERE t.is_executable = true AND t.assignee_id IS NULL AND (...)
ORDER BY t.created_at DESC
LIMIT $3 OFFSET $4
```

**Why DISTINCT is unnecessary:**
- The tasks table is the primary table (FROM tasks t)
- All JOINs are LEFT JOINs to related tables
- Each task has at most one publisher, one position, one group, one project group
- The user_positions JOIN is filtered by user_id, so at most one match per task
- Therefore, each task appears exactly once in the result set

### Database Indexes

Required indexes for optimal performance:

```sql
-- Composite index for main WHERE clause
CREATE INDEX IF NOT EXISTS idx_tasks_available 
ON tasks(is_executable, assignee_id, created_at DESC);

-- Index for visibility filtering
CREATE INDEX IF NOT EXISTS idx_tasks_visibility 
ON tasks(visibility);

-- Index for position filtering
CREATE INDEX IF NOT EXISTS idx_tasks_position 
ON tasks(position_id) WHERE position_id IS NOT NULL;

-- Index for publisher filtering (private tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_publisher 
ON tasks(publisher_id) WHERE visibility = 'private';
```

### Cache Key Design

Cache keys follow a hierarchical pattern for efficient invalidation:

```
available_tasks:{userId}:{role}:{page}:{pageSize}
```

**Examples:**
- `available_tasks:user123:hunter:1:50` - First page for hunter
- `available_tasks:user456:super_admin:2:100` - Second page for admin

**Invalidation:**
- Use pattern `available_tasks:*` to invalidate all cached task lists
- Redis SCAN + DEL for pattern-based deletion
- Efficient bulk invalidation on any task mutation

### Backward Compatibility

To maintain backward compatibility:

1. **Non-paginated requests** (no query params) return array directly:
   ```typescript
   GET /tasks/available
   Response: Task[]
   ```

2. **Paginated requests** (with query params) return pagination envelope:
   ```typescript
   GET /tasks/available?page=1&pageSize=50
   Response: { data: Task[], pagination: {...} }
   ```

3. **Client detection:**
   ```typescript
   const hasPaginationParams = req.query.page || req.query.pageSize;
   if (hasPaginationParams) {
     return paginatedResponse;
   } else {
     return taskArray;
   }
   ```

### Monitoring and Observability

**Metrics to track:**
- Query execution time (p50, p95, p99)
- Cache hit rate
- Cache invalidation frequency
- Circuit breaker state changes
- Error rates by type

**Logging:**
```typescript
logger.info('Available tasks query', {
  userId,
  role,
  pagination,
  duration,
  cacheHit,
  resultCount
});
```

**Performance warnings:**
```typescript
if (duration > 15) {
  logger.warn('Slow query detected', {
    userId,
    duration,
    threshold: 15
  });
}
```
