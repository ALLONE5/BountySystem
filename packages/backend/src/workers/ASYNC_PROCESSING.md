# Asynchronous Task Processing Documentation

## Overview

The bounty hunter platform implements asynchronous task processing using Redis-based message queues. This allows time-consuming operations to be processed in the background without blocking API responses.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Controllers │→ │  Services    │→ │ Queue Service│  │
│  └──────────────┘  └──────────────┘  └──────┬───────┘  │
└─────────────────────────────────────────────┼───────────┘
                                              ↓
┌─────────────────────────────────────────────────────────┐
│                  Redis Message Queues                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │Notifications │  │   Reports    │  │    Emails    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   Rankings   │  │    Bounty    │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────┬───────────┘
                                              ↓
┌─────────────────────────────────────────────────────────┐
│                  Queue Workers                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Notification │  │    Report    │  │    Email     │  │
│  │   Worker     │  │   Worker     │  │   Worker     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   Ranking    │  │    Bounty    │                    │
│  │   Worker     │  │   Worker     │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## Queue Types

### 1. Notification Queue
- **Queue Name**: `queue:notifications`
- **Purpose**: Process notification sending and real-time push
- **Job Types**:
  - `send_notification`: Send individual notification
  - `broadcast_notification`: Send notification to all users
- **Processing Time**: < 1 second
- **Retry Policy**: 3 attempts with 5-second delay

### 2. Report Queue
- **Queue Name**: `queue:reports`
- **Purpose**: Generate user task reports
- **Job Types**:
  - `generate_report`: Generate daily/weekly/monthly/total reports
- **Processing Time**: 1-10 seconds (depending on data volume)
- **Retry Policy**: 3 attempts with 5-second delay

### 3. Email Queue
- **Queue Name**: `queue:emails`
- **Purpose**: Send emails asynchronously
- **Job Types**:
  - `send_email`: Send individual email
- **Processing Time**: 1-5 seconds
- **Retry Policy**: 3 attempts with 5-second delay

### 4. Ranking Queue
- **Queue Name**: `queue:rankings`
- **Purpose**: Calculate user rankings
- **Job Types**:
  - `calculate_ranking`: Calculate monthly/quarterly/all-time rankings
- **Processing Time**: 5-30 seconds (depending on user count)
- **Retry Policy**: 3 attempts with 5-second delay

### 5. Bounty Calculation Queue
- **Queue Name**: `queue:bounty`
- **Purpose**: Calculate task bounties
- **Job Types**:
  - `calculate_bounty`: Calculate bounty for a task
- **Processing Time**: < 1 second
- **Retry Policy**: 3 attempts with 5-second delay

## Job Structure

```typescript
interface QueueJob<T> {
  id: string;              // Unique job identifier
  type: string;            // Job type (e.g., 'send_notification')
  data: T;                 // Job-specific data
  attempts: number;        // Current attempt count
  maxAttempts: number;     // Maximum retry attempts
  createdAt: Date;         // Job creation timestamp
  processedAt?: Date;      // Job processing timestamp
  error?: string;          // Error message if failed
}
```

## Usage Examples

### Sending Notifications Asynchronously

```typescript
import { AsyncNotificationService } from '../services/AsyncNotificationService';

// Send task assignment notification
await AsyncNotificationService.notifyTaskAssignment(
  userId,
  taskId,
  'Complete API Documentation'
);

// Send broadcast notification
await AsyncNotificationService.sendBroadcastAsync(
  adminId,
  'System Maintenance',
  'The system will be down for maintenance on Sunday'
);
```

### Generating Reports Asynchronously

```typescript
import { ReportService } from '../services/ReportService';

const reportService = new ReportService(pool);

// Generate monthly report
const jobId = await reportService.generateMonthlyReport(userId);

// Generate custom date range report
const jobId = await reportService.generateReportAsync(
  userId,
  'custom',
  startDate,
  endDate
);
```

### Calculating Rankings Asynchronously

```typescript
import { QueueService } from '../services/QueueService';

// Enqueue ranking calculation
await QueueService.enqueueRankingCalculation({
  period: 'monthly',
  year: 2024,
  month: 12,
});
```

### Calculating Bounties Asynchronously

```typescript
import { QueueService } from '../services/QueueService';

// Enqueue bounty calculation
await QueueService.enqueueBountyCalculation({
  taskId: 'task-123',
  recalculate: true,
});
```

## Worker Management

### Starting Workers

```bash
# Start workers as a separate process
npm run workers

# Or start with the main application
npm run dev
```

```typescript
import { startWorkers } from './workers/startWorkers';

// Start all workers
await startWorkers();
```

### Stopping Workers

```typescript
import { stopWorkers } from './workers/startWorkers';

// Gracefully stop all workers
await stopWorkers();
```

### Checking Worker Status

```typescript
import { getWorkerStatus } from './workers/startWorkers';

const status = getWorkerStatus();
console.log('Workers running:', status.running);
console.log('Active workers:', status.activeWorkers);
```

## Error Handling

### Retry Mechanism

Jobs that fail are automatically retried up to 3 times with a 5-second delay between attempts:

1. **Attempt 1**: Immediate processing
2. **Attempt 2**: After 5 seconds (if attempt 1 fails)
3. **Attempt 3**: After 10 seconds (if attempt 2 fails)

### Dead Letter Queue (DLQ)

Jobs that fail after all retry attempts are moved to a Dead Letter Queue for manual inspection:

- **DLQ Pattern**: `{queue_name}:dlq`
- **Examples**:
  - `queue:notifications:dlq`
  - `queue:reports:dlq`
  - `queue:emails:dlq`

### Inspecting Failed Jobs

```typescript
import { redisClient } from '../config/redis';

// Get failed jobs from DLQ
const dlqName = 'queue:notifications:dlq';
const failedJobs = await redisClient.lRange(dlqName, 0, -1);

failedJobs.forEach((jobStr) => {
  const job = JSON.parse(jobStr);
  console.log('Failed job:', job.id);
  console.log('Error:', job.error);
  console.log('Data:', job.data);
});
```

## Monitoring

### Queue Statistics

```typescript
import { QueueService } from '../services/QueueService';

// Get statistics for all queues
const stats = await QueueService.getQueueStats();

console.log('Notification queue length:', stats['queue:notifications']);
console.log('Report queue length:', stats['queue:reports']);
console.log('Email queue length:', stats['queue:emails']);
```

### Queue Length Monitoring

```typescript
import { QueueService, QueueName } from '../services/QueueService';

// Get length of specific queue
const length = await QueueService.getQueueLength(QueueName.NOTIFICATIONS);
console.log('Pending notifications:', length);
```

## Performance Considerations

### Queue Sizing

- **Notification Queue**: High throughput, short processing time
  - Expected: 100-1000 jobs/hour
  - Target processing time: < 1 second per job

- **Report Queue**: Medium throughput, longer processing time
  - Expected: 10-100 jobs/hour
  - Target processing time: 1-10 seconds per job

- **Email Queue**: Medium throughput, medium processing time
  - Expected: 50-500 jobs/hour
  - Target processing time: 1-5 seconds per job

- **Ranking Queue**: Low throughput, long processing time
  - Expected: 1-10 jobs/day
  - Target processing time: 5-30 seconds per job

### Worker Scaling

For high-load scenarios, run multiple worker processes:

```bash
# Terminal 1
npm run workers

# Terminal 2
npm run workers

# Terminal 3
npm run workers
```

Each worker process will compete for jobs from the same queues, providing horizontal scaling.

### Blocking Pop Timeout

Workers use blocking pop with a 5-second timeout to efficiently wait for jobs without busy-waiting:

```typescript
const job = await QueueService.dequeue(queueName, 5); // 5-second timeout
```

## Best Practices

1. **Use Async for Time-Consuming Operations**
   - Report generation
   - Email sending
   - Bulk notifications
   - Complex calculations

2. **Keep Jobs Idempotent**
   - Jobs should be safe to retry
   - Avoid side effects that can't be repeated

3. **Set Appropriate Max Attempts**
   - Critical operations: 5 attempts
   - Standard operations: 3 attempts
   - Non-critical operations: 1 attempt

4. **Monitor Queue Lengths**
   - Alert when queues grow too large
   - Indicates worker capacity issues

5. **Handle Failures Gracefully**
   - Log errors with context
   - Move to DLQ for manual review
   - Alert on high failure rates

6. **Use Job IDs for Tracking**
   - Return job ID to client
   - Allow status checking
   - Enable job cancellation

## Troubleshooting

### Queue Not Processing

**Symptoms**: Jobs accumulate in queue but aren't processed

**Solutions**:
1. Check if workers are running: `getWorkerStatus()`
2. Check Redis connection: `testRedisConnection()`
3. Check worker logs for errors
4. Restart workers: `stopWorkers()` then `startWorkers()`

### High Failure Rate

**Symptoms**: Many jobs in DLQ

**Solutions**:
1. Inspect DLQ jobs for common errors
2. Check external service availability (email, database)
3. Review job data for invalid inputs
4. Increase retry attempts if transient failures

### Slow Processing

**Symptoms**: Queue length growing, jobs taking too long

**Solutions**:
1. Scale workers horizontally (run multiple processes)
2. Optimize job processing logic
3. Add indexes to database queries
4. Use caching for frequently accessed data

### Memory Issues

**Symptoms**: Workers crashing, high memory usage

**Solutions**:
1. Limit job data size
2. Process large datasets in batches
3. Increase worker memory limits
4. Clear completed jobs from memory

## Future Enhancements

1. **Job Prioritization**: High-priority jobs processed first
2. **Scheduled Jobs**: Cron-like scheduling for recurring tasks
3. **Job Cancellation**: Cancel pending jobs
4. **Job Status API**: Check job status via API
5. **Worker Dashboard**: Web UI for monitoring queues
6. **Rate Limiting**: Limit job processing rate
7. **Job Dependencies**: Chain jobs together
8. **Batch Processing**: Process multiple jobs together
