# Caching Strategy Documentation

## Overview

The bounty hunter platform implements a comprehensive caching strategy using Redis to improve performance and reduce database load. This document describes the caching patterns, TTL policies, and invalidation strategies.

## Cache Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  API Routes  │  │  Services    │  │  Middleware  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │           │
│         └─────────────────┼──────────────────┘           │
│                           │                              │
└───────────────────────────┼──────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────┐
│                    Cache Service                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Session | Tasks | Rankings | Avatars | Profiles │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────────┬───────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────┐
│                      Redis Cache                          │
│  Key-Value Store with TTL-based Expiration               │
└───────────────────────────────────────────────────────────┘
```

## Cache Categories and TTL Policies

### 1. Session Data
- **TTL**: 24 hours (86400 seconds)
- **Key Pattern**: `session:{userId}`
- **Purpose**: Store user authentication sessions
- **Invalidation**: On logout or session expiry

### 2. Task Lists
- **TTL**: 5 minutes (300 seconds)
- **Key Pattern**: `tasks:{role}:{userId}`
- **Purpose**: Cache user's published or assigned tasks
- **Invalidation**: 
  - On task creation/update/deletion
  - On task status change
  - On task assignment change

### 3. Rankings
- **TTL**: 1 hour (3600 seconds)
- **Key Pattern**: `ranking:{period}:{year}:{month}:{quarter}`
- **Purpose**: Cache leaderboard data
- **Invalidation**: 
  - When rankings are recalculated
  - On task completion (affects bounty totals)

### 4. User Avatars
- **TTL**: 24 hours (86400 seconds)
- **Key Pattern**: `avatars:{userId}`
- **Purpose**: Cache available avatars based on user ranking
- **Invalidation**: 
  - When rankings are updated
  - When new avatars are added

### 5. User Profiles
- **TTL**: 30 minutes (1800 seconds)
- **Key Pattern**: `user:profile:{userId}`
- **Purpose**: Cache user profile information
- **Invalidation**: 
  - On profile update
  - On position changes

### 6. User Positions
- **TTL**: 30 minutes (1800 seconds)
- **Key Pattern**: `positions:{userId}`
- **Purpose**: Cache user's positions
- **Invalidation**: 
  - On position application approval
  - On position removal

### 7. Notification Counts
- **TTL**: 1 minute (60 seconds)
- **Key Pattern**: `notifications:unread:{userId}`
- **Purpose**: Cache unread notification count
- **Invalidation**: 
  - On new notification
  - On notification read

### 8. Task Dependencies
- **TTL**: 5 minutes (300 seconds)
- **Key Pattern**: `dependencies:{taskId}`
- **Purpose**: Cache task dependency relationships
- **Invalidation**: 
  - On dependency addition/removal
  - On dependent task completion

### 9. Bounty Algorithm
- **TTL**: 1 hour (3600 seconds)
- **Key Pattern**: `bounty:algorithm:current`
- **Purpose**: Cache current bounty calculation algorithm
- **Invalidation**: 
  - When algorithm is updated by admin

### 10. API Response Cache
- **TTL**: 5 minutes (300 seconds)
- **Key Pattern**: `api:{userId}:{url}`
- **Purpose**: Cache GET request responses
- **Invalidation**: 
  - On related data modification
  - Pattern-based invalidation

## Cache Invalidation Strategies

### 1. Write-Through Invalidation
When data is modified, immediately invalidate related cache entries:

```typescript
// Example: Task update
await taskService.updateTask(taskId, updates);
await CacheService.invalidateAllTaskLists();
await CacheService.deletePattern(`api:*:/api/tasks*`);
```

### 2. Pattern-Based Invalidation
Invalidate multiple related cache entries using patterns:

```typescript
// Invalidate all task-related caches
await CacheService.deletePattern('tasks:*');
```

### 3. Cascade Invalidation
When one entity changes, invalidate dependent caches:

```typescript
// Ranking update cascades to avatar unlocking
await CacheService.invalidateRankings();
await CacheService.invalidateAllAvatars();
```

### 4. Time-Based Expiration
Let cache entries expire naturally based on TTL for less critical data.

## Usage Examples

### Caching in Services

```typescript
// Check cache first
const cached = await CacheService.getTaskList(userId, 'publisher');
if (cached) {
  return cached;
}

// Cache miss - fetch from database
const tasks = await this.fetchTasksFromDB(userId);

// Store in cache
await CacheService.setTaskList(userId, 'publisher', tasks);

return tasks;
```

### Using Cache Middleware

```typescript
// Apply cache middleware to GET routes
router.get('/api/rankings/monthly', 
  cacheMiddleware({ ttl: 3600 }),
  rankingController.getMonthlyRankings
);

// Apply cache invalidation on write operations
router.post('/api/tasks',
  cacheInvalidationMiddleware(['tasks:*', 'api:*:/api/tasks*']),
  taskController.createTask
);
```

### Manual Cache Management

```typescript
// Invalidate user-specific caches
await invalidateUserCache(userId);

// Invalidate task-related caches
await invalidateTaskCache();

// Invalidate ranking caches
await invalidateRankingCache();
```

## Performance Considerations

### Cache Hit Ratio
- Target: > 80% for frequently accessed data
- Monitor using `CacheService.getStats()`

### Memory Usage
- Redis memory limit: Configure based on data size
- Use TTL to prevent unbounded growth
- Monitor key count and memory usage

### Cache Warming
For critical data, pre-populate cache:

```typescript
// Warm up current month rankings on server start
await rankingService.getCurrentMonthRankings();
```

## Monitoring and Maintenance

### Cache Statistics
```typescript
const stats = await CacheService.getStats();
console.log('Cache stats:', stats);
```

### Cache Health Checks
- Monitor Redis connection status
- Track cache hit/miss ratios
- Alert on high miss rates

### Maintenance Tasks
- Clear stale data periodically
- Analyze unused cache keys
- Optimize TTL values based on usage patterns

## Best Practices

1. **Always set TTL**: Prevent memory leaks from abandoned keys
2. **Use namespaced keys**: Organize cache with prefixes
3. **Invalidate proactively**: Don't wait for TTL on data changes
4. **Handle cache failures gracefully**: Fall back to database
5. **Monitor cache performance**: Track hit rates and latency
6. **Use appropriate TTL**: Balance freshness vs. performance
7. **Batch invalidations**: Group related invalidations together
8. **Document cache dependencies**: Track what invalidates what

## Troubleshooting

### High Cache Miss Rate
- Check if TTL is too short
- Verify invalidation isn't too aggressive
- Ensure cache warming for critical data

### Stale Data Issues
- Verify invalidation logic is correct
- Check for missing invalidation triggers
- Consider shorter TTL for frequently changing data

### Memory Issues
- Review TTL settings
- Implement cache size limits
- Use Redis eviction policies (LRU)

### Connection Issues
- Check Redis server status
- Verify network connectivity
- Implement connection retry logic

## Future Enhancements

1. **Cache Warming Service**: Automatically pre-populate cache
2. **Adaptive TTL**: Adjust TTL based on access patterns
3. **Cache Compression**: Reduce memory usage for large objects
4. **Multi-Level Caching**: Add in-memory cache layer
5. **Cache Analytics**: Detailed metrics and insights
