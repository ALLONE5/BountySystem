# Task Complete API Fix

## Issue Date
February 2, 2026

## Problem Description
When users clicked the "完成任务" (Complete Task) button, they received error messages after a long wait:
- ❌ 网络错误，请检查网络连接
- ❌ 完成任务失败

However, after refreshing the page, the task status was correctly updated to "completed" and progress was set to 100%, indicating the backend successfully processed the request.

## Root Causes

### 1. Wrong API Endpoint (Initial Issue)
The frontend was using the generic `updateTask` API (`PUT /api/tasks/:taskId`) to complete tasks by updating both status and progress fields, instead of using the dedicated `completeTask` endpoint (`POST /api/tasks/:taskId/complete`).

### 2. Request Timeout (Secondary Issue)
The frontend API client had a 10-second timeout, but the `completeTask` operation can take longer due to:
- Bounty distribution calculations
- Dependency resolution
- Notification creation
- Database transactions
- Cache invalidation

## Solution

### 1. Added `completeTask` Method to Frontend API
**File**: `packages/frontend/src/api/task.ts`

Added a new method that calls the correct backend endpoint:

```typescript
// 完成任务
completeTask: createApiMethodWithParams<{ message: string; resolvedTaskIds: string[] }, string>('post', (taskId) => `/tasks/${taskId}/complete`),
```

### 2. Increased API Timeout
**File**: `packages/frontend/src/api/client.ts`

Increased timeout from 10 seconds to 30 seconds to accommodate longer-running operations:

```typescript
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000, // Increased from 10000
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 3. Improved User Feedback
**Files Modified**: All task view pages

Updated the confirmation dialog to inform users that the operation may take a few seconds:

```typescript
Modal.confirm({
  title: '确定要完成这个任务吗？',
  content: '完成任务后将无法再更新进度，此操作可能需要几秒钟时间',
  okText: '确定',
  cancelText: '取消',
  onOk: async () => {
    try {
      await taskApi.completeTask(taskId);
      message.success('任务已完成');
      // ... refresh logic
    } catch (error) {
      message.error('完成任务失败');
      throw error; // Let Modal show loading state
    }
  },
});
```

### 4. Updated All Task View Pages
**Files Modified**:
1. `packages/frontend/src/pages/TaskListPage.tsx`
2. `packages/frontend/src/pages/KanbanPage.tsx`
3. `packages/frontend/src/pages/GanttChartPage.tsx`
4. `packages/frontend/src/pages/CalendarPage.tsx`
5. `packages/frontend/src/pages/AssignedTasksPage.tsx`
6. `packages/frontend/src/components/TaskDetailDrawer.tsx`

## Benefits

1. **No More Timeout Errors**: 30-second timeout accommodates longer operations
2. **Proper Backend Processing**: Uses the dedicated complete endpoint
3. **Better User Experience**: 
   - Clear message that operation may take time
   - Modal shows loading state during async operation
   - Immediate success feedback
4. **Consistent Behavior**: All task views use the same completion flow
5. **Automatic Progress Update**: Progress is automatically set to 100% by the backend

## Testing

To verify the fix:

1. Create a task and assign it to yourself
2. Set the task progress to any value (e.g., 50%)
3. Click "完成任务" (Complete Task)
4. Verify:
   - ✅ Confirmation dialog appears with timeout warning
   - ✅ Modal shows loading state during operation
   - ✅ Success message appears: "任务已完成"
   - ✅ No timeout errors (even if operation takes 10-20 seconds)
   - ✅ Task status changes to "已完成"
   - ✅ Progress updates to 100%
   - ✅ No need to refresh the page

## Performance Considerations

The `completeTask` operation may take longer when:
- Task has many dependencies to resolve
- Multiple notifications need to be created
- Complex bounty distribution calculations
- Database is under heavy load

The 30-second timeout provides adequate buffer for these scenarios while still catching genuine network issues.

## Related Documentation
- Task Complete and Abandon Feature: `docs/TASK_COMPLETE_ABANDON_FEATURE.md`
- Task Complete Auto Progress Update: `docs/TASK_COMPLETE_AUTO_PROGRESS_UPDATE.md`
- Backend Task Routes: `packages/backend/src/routes/task.routes.ts`

## Technical Notes

The backend `/api/tasks/:taskId/complete` endpoint (POST) provides:
- Automatic progress update to 100%
- Task status change to COMPLETED
- Bounty distribution to assignee and assistants
- Subtask resolution
- Dependency resolution
- Notification creation
- Transaction management
- Cache invalidation

This is more comprehensive than the generic `updateTask` endpoint and ensures data consistency.
