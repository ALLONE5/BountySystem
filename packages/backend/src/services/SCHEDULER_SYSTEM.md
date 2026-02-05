# Task Scheduler System

## Overview

The Task Scheduler System provides automatic task scheduling, workload evaluation, task recommendations, and priority management. It implements Requirements 3.5, 28.1, 28.2, 28.3, 28.4, and 28.5 from the specification.

## Core Features

### 1. Dependency Resolution and Task Availability (Requirements 3.5, 28.1)

The scheduler automatically manages task availability based on dependency resolution:

- **Dependency Checking**: Verifies if all dependencies for a task are resolved
- **Automatic Status Updates**: Changes task status from `NOT_STARTED` to `AVAILABLE` when dependencies are resolved
- **Downstream Processing**: When a task is completed, automatically checks and updates all dependent tasks
- **Notifications**: Sends notifications to relevant users when tasks become available

**Key Methods:**
- `checkDependenciesResolved(taskId)`: Check if all dependencies are resolved
- `updateTaskAvailability(taskId)`: Update task status based on dependency resolution
- `processCompletedTask(completedTaskId)`: Process completed task and update downstream dependencies

### 2. Workload Evaluation (Requirement 28.3)

The scheduler evaluates user workload to prevent overload and provide recommendations:

**Workload Metrics:**
- Active task count (tasks in `IN_PROGRESS` or `AVAILABLE` status)
- Total estimated hours
- Average complexity of active tasks

**Overload Thresholds:**
- 5 or more active tasks
- 40 or more estimated hours
- High average complexity (≥4 out of 5)

**Key Method:**
- `evaluateWorkload(userId)`: Returns workload analysis with recommendations

**Example Response:**
```typescript
{
  userId: "user-id",
  activeTaskCount: 3,
  totalEstimatedHours: 25.5,
  averageComplexity: 3.2,
  isOverloaded: false,
  recommendation: "Your workload looks manageable. You can take on more tasks if needed."
}
```

### 3. Task Recommendations (Requirements 28.3, 28.4)

The scheduler recommends suitable tasks based on:

- User's positions and qualifications
- Current workload (no recommendations if overloaded)
- Task visibility rules
- Dependency resolution status
- Time waiting (prioritizes older tasks)

**Recommendation Criteria:**
- Task must be executable (leaf node)
- Task must be unassigned
- Task must have status `AVAILABLE` (dependencies resolved)
- Task must match user's positions OR have no position requirement
- Task must be visible to the user

**Prioritization:**
1. Tasks waiting longer (hours since creation)
2. Higher priority tasks
3. Higher bounty amount

**Key Method:**
- `recommendTasks(userId, limit)`: Returns recommended tasks for a user

### 4. Long-Unaccepted Task Notifications (Requirements 28.4, 28.5)

The scheduler proactively pushes notifications for tasks that have been waiting too long:

**Default Threshold:** 48 hours (configurable)

**Process:**
1. Identify tasks waiting longer than threshold
2. Find qualified users based on position requirements
3. Check each user's workload
4. Send notifications only to users who are not overloaded

**Key Method:**
- `pushLongUnacceptedTasks(hoursThreshold)`: Push notifications for long-waiting tasks

### 5. Priority Adjustment (Requirement 28.2)

The scheduler automatically adjusts task priorities based on deadline proximity:

**Priority Boost Rules:**
- Deadline within 24 hours: +2 priority boost
- Deadline within 3 days: +1 priority boost
- Maximum priority capped at 5

**Key Method:**
- `reprioritizeTasks()`: Update priorities for tasks with approaching deadlines

## API Endpoints

### GET /api/scheduler/workload/:userId
Evaluate user's workload.

**Authentication:** Required  
**Authorization:** User can only check their own workload (unless admin)

**Response:**
```json
{
  "userId": "user-id",
  "activeTaskCount": 3,
  "totalEstimatedHours": 25.5,
  "averageComplexity": 3.2,
  "isOverloaded": false,
  "recommendation": "Your workload looks manageable..."
}
```

### GET /api/scheduler/recommendations
Get task recommendations for the current user.

**Authentication:** Required  
**Query Parameters:**
- `limit` (optional): Maximum number of recommendations (default: 10)

**Response:**
```json
[
  {
    "id": "task-id",
    "name": "Task Name",
    "bountyAmount": 500,
    "priority": 4,
    "estimatedHours": 8,
    "complexity": 3,
    ...
  }
]
```

### POST /api/scheduler/push-unaccepted
Push notifications for long-unaccepted tasks.

**Authentication:** Required  
**Authorization:** Super Admin only

**Request Body:**
```json
{
  "hoursThreshold": 48
}
```

**Response:**
```json
{
  "message": "Notifications sent successfully",
  "count": 15
}
```

### POST /api/scheduler/reprioritize
Reprioritize tasks based on deadline proximity.

**Authentication:** Required  
**Authorization:** Super Admin only

**Response:**
```json
{
  "message": "Tasks reprioritized successfully",
  "count": 23
}
```

### POST /api/scheduler/process-completed/:taskId
Process a completed task and update downstream dependencies.

**Authentication:** Required

**Response:**
```json
{
  "message": "Completed task processed successfully",
  "resolvedTaskIds": ["task-id-1", "task-id-2"]
}
```

## Integration with Task Completion

When a task is completed, the scheduler should be invoked to:

1. Update downstream task availability
2. Send notifications to affected users
3. Return list of newly available tasks

**Example Integration:**
```typescript
// In TaskService.completeTask()
const task = await taskService.updateTask(taskId, {
  status: TaskStatus.COMPLETED
});

// Process downstream dependencies
const resolvedTaskIds = await schedulerService.processCompletedTask(taskId);

// resolvedTaskIds contains IDs of tasks that became available
```

## Scheduled Jobs

The following operations should be run periodically:

### Daily Jobs
- **Reprioritize Tasks**: Run daily to adjust priorities based on deadlines
  ```typescript
  await schedulerService.reprioritizeTasks();
  ```

### Hourly Jobs
- **Push Long-Unaccepted Tasks**: Run every few hours to notify users
  ```typescript
  await schedulerService.pushLongUnacceptedTasks(48);
  ```

## Testing

The scheduler service includes comprehensive unit tests covering:

- Dependency resolution checking
- Task availability updates
- Workload evaluation with various scenarios
- Task recommendations with filtering and prioritization
- Long-unaccepted task notifications
- Priority adjustment based on deadlines

**Run Tests:**
```bash
npm test -- SchedulerService.test.ts
```

## Performance Considerations

### Database Queries
- Workload evaluation uses aggregation queries for efficiency
- Task recommendations use indexed columns (status, position_id, created_at)
- Priority updates use batch UPDATE with conditions

### Caching Opportunities
- User workload can be cached for short periods (5 minutes)
- Task recommendations can be cached per user (5 minutes)
- Position-user mappings can be cached

### Scalability
- Batch processing for long-unaccepted task notifications
- Limit recommendation queries to prevent large result sets
- Use pagination for large task lists

## Error Handling

The scheduler service handles:

- Missing tasks or users (returns null or empty arrays)
- Database connection errors (propagates to caller)
- Invalid parameters (throws ValidationError)

## Future Enhancements

Potential improvements:

1. **Machine Learning Recommendations**: Use historical data to improve task recommendations
2. **Smart Workload Balancing**: Automatically suggest task transfers when users are overloaded
3. **Deadline Prediction**: Predict task completion times based on historical data
4. **Team Workload**: Evaluate workload at team/group level
5. **Custom Notification Preferences**: Allow users to configure notification thresholds
6. **Priority Algorithms**: Support multiple priority calculation strategies

## Related Systems

- **Dependency System**: Manages task dependencies and circular dependency detection
- **Notification System**: Sends real-time notifications to users
- **Task System**: Core task management and status updates
- **Permission System**: Controls access to scheduler operations
