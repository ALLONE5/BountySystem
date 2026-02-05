# Notification System

## Overview

The notification system provides comprehensive notification management for the Bounty Hunter Platform, including:

- Core notification CRUD operations
- Task-related notifications (assignment, deadline reminders, status changes)
- Dependency resolution notifications
- Broadcast notifications for administrators
- Real-time notification push via Redis Pub/Sub

## Architecture

The notification system consists of three main components:

1. **NotificationService**: Core notification management (create, read, mark as read)
2. **NotificationPushService**: Real-time notification delivery via Redis Pub/Sub
3. **Notification Routes**: REST API endpoints for notification operations

## Notification Types

The system supports the following notification types:

- `TASK_ASSIGNED`: User assigned to a task
- `DEADLINE_REMINDER`: Task deadline approaching
- `DEPENDENCY_RESOLVED`: Task dependencies completed, task now available
- `STATUS_CHANGED`: Task status updated
- `POSITION_APPROVED`: Position application approved
- `POSITION_REJECTED`: Position application rejected
- `REVIEW_REQUIRED`: Admin review required (e.g., new position application submitted)
- `BROADCAST`: System-wide announcement from administrators

## Usage

### Creating Notifications

#### Task Assignment Notification

```typescript
const notificationService = new NotificationService();

await notificationService.sendTaskAssignedNotification(
  userId,
  taskId,
  taskName
);
```

#### Deadline Reminder

```typescript
await notificationService.sendDeadlineReminderNotification(
  userId,
  taskId,
  taskName,
  deadline
);
```

#### Status Change Notification

```typescript
await notificationService.sendStatusChangedNotification(
  userId,
  taskId,
  taskName,
  oldStatus,
  newStatus
);
```

#### Dependency Resolved Notification

```typescript
await notificationService.sendDependencyResolvedNotification(
  userId,
  taskId,
  taskName
);
```

#### Review Required Notification (admin alert)

Triggered when a new position application is created. `PositionService.applyForPosition` collects super admins and the position's admins, then calls:

```typescript
await notificationService.notifyAdminsReviewRequired(
  adminIds,
  '有新的审核请求',
  `${applicantName} 申请了岗位 ${positionName}，请及时审核。`
);
```

This creates `REVIEW_REQUIRED` notifications for each admin and pushes them in real time.

### Broadcast Notifications

#### Broadcast to All Users

```typescript
const count = await notificationService.broadcastNotification(
  adminId,
  'System Announcement',
  'Maintenance scheduled for tonight'
);
```

#### Broadcast to Specific Users

```typescript
const count = await notificationService.broadcastToUsers(
  adminId,
  [userId1, userId2, userId3],
  'Team Update',
  'New project requirements available'
);
```

### Reading Notifications

#### Get User Notifications

```typescript
// Get all notifications
const allNotifications = await notificationService.getUserNotifications(userId);

// Get only unread notifications
const unreadNotifications = await notificationService.getUserNotifications(userId, true);
```

#### Get Unread Count

```typescript
const count = await notificationService.getUnreadCount(userId);
```

### Marking as Read

#### Mark Single Notification

```typescript
await notificationService.markAsRead(notificationId);
```

#### Mark All as Read

```typescript
await notificationService.markAllAsRead(userId);
```

## Real-Time Notifications

The system uses Redis Pub/Sub for real-time notification delivery. This allows WebSocket servers or other real-time services to subscribe to notification events.

### Publishing Notifications

Notifications are automatically published when created:

```typescript
// This automatically publishes to Redis
const notification = await notificationService.createNotification({
  userId,
  type: NotificationType.TASK_ASSIGNED,
  title: 'New Task',
  message: 'You have been assigned a task',
});
```

### Subscribing to Notifications

```typescript
const pushService = new NotificationPushService();

// Subscribe to user-specific notifications
await pushService.subscribeToUserNotifications(userId, (notification) => {
  console.log('New notification:', notification);
  // Send to WebSocket client, etc.
});

// Subscribe to broadcast notifications
await pushService.subscribeToBroadcasts((notification) => {
  console.log('Broadcast:', notification);
  // Send to all connected WebSocket clients
});
```

### Unsubscribing

```typescript
await pushService.unsubscribeFromUserNotifications(userId);
await pushService.unsubscribeFromBroadcasts();
```

## API Endpoints

### GET /api/notifications

Get user's notifications.

**Query Parameters:**
- `unreadOnly` (optional): Set to `true` to get only unread notifications

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "task_assigned",
      "title": "New Task Assigned",
      "message": "You have been assigned to task: Build API",
      "relatedTaskId": "uuid",
      "isRead": false,
      "senderId": null,
      "createdAt": "2024-12-11T10:00:00Z"
    }
  ]
}
```

### GET /api/notifications/unread-count

Get count of unread notifications.

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### PATCH /api/notifications/:id/read

Mark a notification as read.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isRead": true,
    ...
  }
}
```

### PATCH /api/notifications/read-all

Mark all notifications as read for the current user.

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### POST /api/notifications/broadcast

Send broadcast notification (admin only).

**Request Body:**
```json
{
  "title": "System Announcement",
  "message": "Maintenance scheduled for tonight",
  "userIds": ["uuid1", "uuid2"]  // Optional: specific users, omit for all users
}
```

**Response:**
```json
{
  "success": true,
  "message": "Broadcast notification sent to 150 users",
  "data": {
    "count": 150
  }
}
```

## Integration with Other Services

### TaskService Integration

When a task is assigned:

```typescript
// In TaskService
async assignTask(taskId: string, userId: string): Promise<void> {
  // ... assign task logic ...
  
  const task = await this.getTask(taskId);
  await notificationService.sendTaskAssignedNotification(
    userId,
    taskId,
    task.name
  );
}
```

### DependencyService Integration

When dependencies are resolved:

```typescript
// In DependencyService
async resolveDownstreamDependencies(completedTaskId: string): Promise<void> {
  const resolvedTaskIds = await this.getResolvedTasks(completedTaskId);
  
  for (const taskId of resolvedTaskIds) {
    const task = await taskService.getTask(taskId);
    if (task.assigneeId) {
      await notificationService.sendDependencyResolvedNotification(
        task.assigneeId,
        taskId,
        task.name
      );
    }
  }
}
```

## Database Schema

Notifications are stored in the `notifications` table:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- `(user_id, is_read, created_at)` - Optimized for fetching user notifications
- `(user_id)` - User lookup
- `(created_at)` - Time-based queries
- `(type)` - Type filtering

## Performance Considerations

1. **Pagination**: For users with many notifications, implement pagination in the API
2. **Cleanup**: Use `deleteOldNotifications()` to remove old read notifications
3. **Redis Pub/Sub**: Scales horizontally - multiple servers can publish/subscribe
4. **Database Indexes**: Ensure indexes are maintained for optimal query performance

## Future Enhancements

1. **WebSocket Server**: Implement dedicated WebSocket server for real-time delivery
2. **Email Notifications**: Send email for important notifications
3. **Push Notifications**: Mobile push notifications via FCM/APNS
4. **Notification Preferences**: Allow users to configure notification preferences
5. **Notification Grouping**: Group similar notifications together
6. **Rich Notifications**: Support for images, actions, and rich content
