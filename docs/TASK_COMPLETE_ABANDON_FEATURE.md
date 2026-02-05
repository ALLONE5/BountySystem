# Task Complete and Abandon Feature Implementation

## Overview
Added "Complete" and "Abandon" functionality to task details across all task view pages, allowing users to complete or abandon tasks they are assigned to directly from the task detail drawer.

## Implementation Date
January 30, 2026

## Feature Description

### Complete Task
- Allows the assignee to mark a task as completed
- Changes task status to "completed"
- Shows confirmation dialog before completing
- Only available for tasks in "in_progress" status

### Abandon Task
- Allows the assignee to abandon a task they've accepted
- Restores task to unassigned/available state
- Shows confirmation dialog before abandoning
- Only available for tasks in "in_progress" status
- Cannot abandon completed tasks

## Implementation Details

### Frontend Changes

#### 1. TaskDetailDrawer Component
**File**: `packages/frontend/src/components/TaskDetailDrawer.tsx`

**Props Added**:
- `onAbandonTask?: (taskId: string) => void`
- `onCompleteTask?: (taskId: string) => void`

**Footer Logic**:
```typescript
footer={
  task && onAbandonTask && task.status === TaskStatus.IN_PROGRESS ? (
    <Space>
      {onCompleteTask && (
        <Button
          type="primary"
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          onClick={() => {
            Modal.confirm({
              title: '确定要完成这个任务吗？',
              content: '完成任务后将无法再更新进度',
              onOk: () => onCompleteTask(task.id),
            });
          }}
        >
          完成任务
        </Button>
      )}
      <Button
        danger
        onClick={() => {
          Modal.confirm({
            title: '确定要放弃这个任务吗？',
            content: '放弃后任务将恢复为未承接状态',
            onOk: () => onAbandonTask(task.id),
          });
        }}
      >
        放弃任务
      </Button>
    </Space>
  ) : (
    <Button onClick={onClose}>关闭</Button>
  )
}
```

#### 2. Pages Updated

All task view pages now include complete and abandon handlers:

**TaskListPage** (`packages/frontend/src/pages/TaskListPage.tsx`):
```typescript
const handleAbandonTask = async (taskId: string) => {
  try {
    await taskApi.abandonTask(taskId);
    message.success('任务已放弃');
    setDrawerVisible(false);
    if (!propTasks) {
      loadTasks();
    }
  } catch (error) {
    message.error('放弃任务失败');
    console.error('Failed to abandon task:', error);
  }
};

const handleCompleteTask = async (taskId: string) => {
  try {
    await taskApi.updateTask(taskId, { status: TaskStatus.COMPLETED });
    message.success('任务已完成');
    setDrawerVisible(false);
    if (!propTasks) {
      loadTasks();
    }
  } catch (error) {
    message.error('完成任务失败');
    console.error('Failed to complete task:', error);
  }
};
```

**Pages with handlers added**:
- ✅ `AssignedTasksPage.tsx` (already had handlers)
- ✅ `TaskListPage.tsx` (added)
- ✅ `KanbanPage.tsx` (added)
- ✅ `GanttChartPage.tsx` (added)
- ✅ `CalendarPage.tsx` (added)
- ✅ `PublishedTasksPage.tsx` (uses TaskViews which uses TaskListPage)

### Backend Implementation

#### API Endpoints

**Abandon Task**:
- **Route**: `POST /tasks/:taskId/abandon`
- **Authentication**: Required
- **Authorization**: Only the assigned user can abandon
- **Validation**:
  - Task must exist
  - User must be the assignee
  - Task cannot be completed

**Complete Task**:
- **Route**: `PUT /tasks/:taskId`
- **Body**: `{ status: 'completed' }`
- **Authentication**: Required
- **Authorization**: Task owner or assignee

#### TaskService Methods

**abandonTask()**:
```typescript
async abandonTask(taskId: string, userId: string): Promise<{ task: Task; publisherId: string }> {
  const task = await this.getTask(taskId);
  
  // Verify the user is the current assignee
  if (task.assigneeId !== userId) {
    throw new ValidationError('Only the assigned user can abandon this task');
  }
  
  // Cannot abandon completed tasks
  if (task.status === TaskStatus.COMPLETED) {
    throw new ValidationError('Cannot abandon a completed task');
  }
  
  // Reset task to available state
  // Invalidate cache
  // Return updated task
}
```

### API Client

**File**: `packages/frontend/src/api/task.ts`

```typescript
// Abandon task
abandonTask: createApiMethodWithParams<Task, string>(
  'post', 
  (taskId) => `/tasks/${taskId}/abandon`
),

// Update task (used for completing)
updateTask: createApiMethodWithParams<Task, string>(
  'put', 
  (taskId) => `/tasks/${taskId}`
),
```

## User Experience

### Button Visibility
- Buttons only appear when:
  1. Task status is `IN_PROGRESS`
  2. Handlers are provided to TaskDetailDrawer
  3. User is viewing the task detail

### Confirmation Dialogs
- **Complete**: "确定要完成这个任务吗？完成任务后将无法再更新进度"
- **Abandon**: "确定要放弃这个任务吗？放弃后任务将恢复为未承接状态"

### Success Messages
- **Complete**: "任务已完成"
- **Abandon**: "任务已放弃"

### Error Messages
- **Complete**: "完成任务失败"
- **Abandon**: "放弃任务失败"

### Post-Action Behavior
1. Close the task detail drawer
2. Reload the task list (if not using prop-driven mode)
3. Show success/error message

## Security & Validation

### Frontend Validation
- Buttons only shown for IN_PROGRESS tasks
- Confirmation required before action

### Backend Validation
- **Abandon**:
  - User must be authenticated
  - User must be the assignee
  - Task cannot be completed
  - Task must exist
  
- **Complete**:
  - User must be authenticated
  - User must have permission (owner or assignee)
  - Task must exist

## Testing Recommendations

1. **Test Complete Functionality**:
   - Assign a task to yourself
   - Open task details
   - Click "完成任务"
   - Confirm the dialog
   - Verify task status changes to "completed"
   - Verify buttons disappear after completion

2. **Test Abandon Functionality**:
   - Assign a task to yourself
   - Open task details
   - Click "放弃任务"
   - Confirm the dialog
   - Verify task becomes available again
   - Verify assignee is cleared

3. **Test Button Visibility**:
   - Verify buttons only show for IN_PROGRESS tasks
   - Verify buttons don't show for completed tasks
   - Verify buttons don't show for available tasks

4. **Test Across All Views**:
   - Test in Task List view
   - Test in Kanban view
   - Test in Gantt Chart view
   - Test in Calendar view
   - Test in Assigned Tasks page

5. **Test Error Handling**:
   - Try to abandon someone else's task (should fail)
   - Try to abandon a completed task (should fail)
   - Test network errors

## Related Files

### Frontend
- `packages/frontend/src/components/TaskDetailDrawer.tsx`
- `packages/frontend/src/pages/AssignedTasksPage.tsx`
- `packages/frontend/src/pages/TaskListPage.tsx`
- `packages/frontend/src/pages/KanbanPage.tsx`
- `packages/frontend/src/pages/GanttChartPage.tsx`
- `packages/frontend/src/pages/CalendarPage.tsx`
- `packages/frontend/src/api/task.ts`

### Backend
- `packages/backend/src/routes/task.routes.ts`
- `packages/backend/src/services/TaskService.ts`
- `packages/backend/src/services/TaskService.test.ts`

## Future Enhancements

1. **Batch Operations**: Allow completing/abandoning multiple tasks at once
2. **Reason Field**: Add optional reason when abandoning a task
3. **Undo Feature**: Allow undoing abandon within a time window
4. **Notifications**: Notify publisher when task is completed or abandoned
5. **Analytics**: Track completion/abandon rates for insights
