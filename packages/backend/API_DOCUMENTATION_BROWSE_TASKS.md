# Browse Tasks API Documentation

## Overview
The Browse Tasks API provides optimized access to available tasks with support for pagination, caching, and performance monitoring.

## Endpoints

### GET /api/tasks/available

Returns available tasks that the authenticated user can accept.

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `page` (optional): Page number (integer >= 1, default: 1)
- `pageSize` (optional): Items per page (integer 1-100, default: 50)

**Response Formats**:

#### Non-paginated (backward compatible):
When no pagination parameters are provided, returns an array of tasks directly.

```json
[
  {
    "id": "uuid",
    "name": "Task name",
    "description": "Task description",
    "status": "available",
    "visibility": "public",
    "isExecutable": true,
    "assigneeId": null,
    "publisherId": "uuid",
    "publisher": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "avatarUrl": "https://...",
      "role": "hunter"
    },
    "positionId": "uuid",
    "positionName": "Backend Developer",
    "groupId": null,
    "groupName": null,
    "projectGroupId": "uuid",
    "projectGroupName": "Platform Core",
    "bountyAmount": 500,
    "estimatedHours": 8,
    "complexity": 3,
    "priority": 2,
    "tags": ["backend", "api"],
    "createdAt": "2025-01-06T10:00:00Z",
    "plannedStartDate": "2025-01-10T00:00:00Z",
    "plannedEndDate": "2025-01-15T00:00:00Z",
    "depth": 0,
    "parentId": null,
    "progress": 0,
    "progressLocked": false
  }
]
```

#### Paginated:
When pagination parameters are provided, returns a pagination envelope.

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Task name",
      // ... (same task structure as above)
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 50,
    "totalItems": 640,
    "totalPages": 13
  }
}
```

**Filtering Rules**:
- Only returns unassigned tasks (`assigneeId` is null)
- Only returns executable tasks (leaf nodes, `isExecutable` is true)
- Applies visibility rules:
  - **PUBLIC**: Visible to all users
  - **POSITION_ONLY**: Visible to users with matching position or admins
  - **PRIVATE**: Visible to publisher or super admins

**Sorting**:
- Results are sorted by `createdAt` in descending order (newest first)

**Caching**:
- Results are cached for 60 seconds
- Cache key format: `available_tasks:{userId}:{role}:{page}:{pageSize}`
- Cache is automatically invalidated when any task is created, updated, deleted, or assigned

**Performance**:
- Target response time: < 15ms
- Cache hit response time: < 5ms
- Database query time: < 10ms

**Error Responses**:

```json
// 400 Bad Request - Invalid pagination parameters
{
  "error": "Page must be a positive integer >= 1"
}

// 400 Bad Request - Invalid page size
{
  "error": "Page size must be between 1 and 100"
}

// 401 Unauthorized - Missing or invalid token
{
  "error": "Authentication required"
}

// 500 Internal Server Error - Database error
{
  "error": "Internal server error"
}
```

**Examples**:

```bash
# Get first page with default page size (50)
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/tasks/available?page=1

# Get second page with custom page size
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/tasks/available?page=2&pageSize=25

# Non-paginated request (backward compatible)
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/tasks/available
```

---

## Performance Monitoring Endpoints

### GET /api/metrics/performance

Returns aggregated performance metrics for all tracked operations.

**Authentication**: Required (Admin only)

**Query Parameters**:
- `timeWindow` (optional): Time window in milliseconds (default: 3600000 = 1 hour)

**Response**:

```json
{
  "timeWindowMs": 3600000,
  "operations": {
    "getAvailableTasks": {
      "operation": "getAvailableTasks",
      "count": 150,
      "avgDuration": 12.5,
      "minDuration": 8,
      "maxDuration": 45,
      "p50Duration": 11,
      "p95Duration": 18,
      "p99Duration": 25,
      "cacheHitRate": 85.3
    }
  }
}
```

**Metrics Explanation**:
- `count`: Number of operations in time window
- `avgDuration`: Average duration in milliseconds
- `minDuration`: Minimum duration in milliseconds
- `maxDuration`: Maximum duration in milliseconds
- `p50Duration`: 50th percentile (median) duration
- `p95Duration`: 95th percentile duration
- `p99Duration`: 99th percentile duration
- `cacheHitRate`: Percentage of requests served from cache (0-100)

**Error Responses**:

```json
// 403 Forbidden - Non-admin user
{
  "error": "Admin access required"
}
```

**Example**:

```bash
# Get metrics for last hour
curl -H "Authorization: Bearer <admin-token>" \
  https://api.example.com/api/metrics/performance

# Get metrics for last 5 minutes
curl -H "Authorization: Bearer <admin-token>" \
  https://api.example.com/api/metrics/performance?timeWindow=300000
```

---

### GET /api/metrics/performance/:operation

Returns performance metrics for a specific operation.

**Authentication**: Required (Admin only)

**Path Parameters**:
- `operation`: Operation name (e.g., "getAvailableTasks")

**Query Parameters**:
- `timeWindow` (optional): Time window in milliseconds (default: 3600000 = 1 hour)

**Response**:

```json
{
  "operation": "getAvailableTasks",
  "count": 150,
  "avgDuration": 12.5,
  "minDuration": 8,
  "maxDuration": 45,
  "p50Duration": 11,
  "p95Duration": 18,
  "p99Duration": 25,
  "cacheHitRate": 85.3
}
```

**Error Responses**:

```json
// 403 Forbidden - Non-admin user
{
  "error": "Admin access required"
}

// 404 Not Found - No metrics for operation
{
  "error": "No metrics found for this operation"
}
```

**Example**:

```bash
curl -H "Authorization: Bearer <admin-token>" \
  https://api.example.com/api/metrics/performance/getAvailableTasks
```

---

### DELETE /api/metrics/performance/:operation

Clears performance metrics for a specific operation.

**Authentication**: Required (Super Admin only)

**Path Parameters**:
- `operation`: Operation name (e.g., "getAvailableTasks")

**Response**:

```json
{
  "message": "Metrics cleared for operation: getAvailableTasks"
}
```

**Error Responses**:

```json
// 403 Forbidden - Non-super-admin user
{
  "error": "Super admin access required"
}
```

**Example**:

```bash
curl -X DELETE \
  -H "Authorization: Bearer <super-admin-token>" \
  https://api.example.com/api/metrics/performance/getAvailableTasks
```

---

### DELETE /api/metrics/performance

Clears all performance metrics.

**Authentication**: Required (Super Admin only)

**Response**:

```json
{
  "message": "All metrics cleared"
}
```

**Error Responses**:

```json
// 403 Forbidden - Non-super-admin user
{
  "error": "Super admin access required"
}
```

**Example**:

```bash
curl -X DELETE \
  -H "Authorization: Bearer <super-admin-token>" \
  https://api.example.com/api/metrics/performance
```

---

## Performance Characteristics

### Cache Behavior

**Cache TTL**: 60 seconds

**Cache Key Format**: `available_tasks:{userId}:{role}:{page}:{pageSize}`

**Cache Invalidation**: Automatic on:
- Task creation
- Task update (status, assignee, or visibility changes)
- Task deletion
- Task assignment (assign, accept, abandon, transfer)
- Task completion

**Circuit Breaker**:
- Opens after 5 consecutive Redis failures
- Cooldown period: 30 seconds
- System continues with database-only mode when circuit is open

### Database Indexes

The following indexes optimize the available tasks query:

1. **idx_tasks_available_browse**: Composite index on (is_executable, assignee_id, created_at DESC)
   - Optimizes main WHERE clause and ORDER BY
   
2. **idx_tasks_visibility_browse**: Index on visibility
   - Optimizes visibility filtering
   
3. **idx_tasks_position_browse**: Index on position_id
   - Optimizes POSITION_ONLY task filtering
   
4. **idx_tasks_publisher_browse**: Index on (publisher_id, visibility)
   - Optimizes PRIVATE task filtering

### Performance Targets

- **Query Planning**: < 5ms
- **Query Execution**: < 10ms
- **Total Response Time**: < 15ms
- **Cache Hit Rate**: > 80% after warmup

### Monitoring

Performance is automatically logged for every request:
- Operation duration
- Cache hit/miss status
- Result count
- Timestamp

Warnings are logged when operations exceed 15ms.

---

## Migration Guide

### For Frontend Developers

**No changes required** for existing code that doesn't use pagination:

```javascript
// This continues to work as before
const tasks = await fetch('/api/tasks/available', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

// tasks is an array of Task objects
```

**To use pagination**:

```javascript
// Request with pagination
const response = await fetch('/api/tasks/available?page=1&pageSize=50', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

// response.data is an array of Task objects
// response.pagination contains metadata
const { data: tasks, pagination } = response;
console.log(`Page ${pagination.currentPage} of ${pagination.totalPages}`);
console.log(`Total tasks: ${pagination.totalItems}`);
```

### For Backend Developers

**Cache invalidation is automatic** - no changes needed when modifying tasks.

**To monitor performance**:

```javascript
// Get performance metrics (admin only)
const metrics = await fetch('/api/metrics/performance', {
  headers: { Authorization: `Bearer ${adminToken}` }
}).then(r => r.json());

console.log('Average response time:', metrics.operations.getAvailableTasks.avgDuration);
console.log('Cache hit rate:', metrics.operations.getAvailableTasks.cacheHitRate);
```

---

## Troubleshooting

### High Response Times

1. Check cache hit rate via `/api/metrics/performance`
2. If cache hit rate is low, investigate cache invalidation frequency
3. Check Redis connection status
4. Verify database indexes are created

### Cache Not Working

1. Check Redis connection: `redis-cli ping`
2. Check circuit breaker status in logs
3. Verify cache TTL is appropriate for your use case
4. Check for excessive cache invalidation

### Stale Data

1. Verify cache invalidation is working in all task mutation methods
2. Check cache TTL (default 60 seconds)
3. Manually clear cache if needed: `redis-cli KEYS "available_tasks:*" | xargs redis-cli DEL`

---

## Best Practices

1. **Use pagination** for better performance and user experience
2. **Monitor metrics** regularly to identify performance issues
3. **Adjust page size** based on your UI needs (default 50 is recommended)
4. **Don't disable caching** unless absolutely necessary
5. **Test with realistic data volumes** to ensure performance targets are met

---

## Support

For issues or questions:
1. Check logs for performance warnings
2. Review metrics endpoint for performance data
3. Verify database indexes are created
4. Check Redis connection status
5. Contact the backend team with specific error messages and metrics
