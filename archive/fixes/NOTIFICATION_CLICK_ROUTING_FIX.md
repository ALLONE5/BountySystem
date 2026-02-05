# Notification Click Routing Fix

## Issue
When users clicked on notifications in the Notification Center, they encountered a 404 error:
```
Unexpected Application Error!
404 Not Found
```

The error message suggested providing an ErrorBoundary or errorElement prop on the route.

## Root Cause
The `NotificationPage` component was trying to navigate to `/tasks/{taskId}` when a notification with a related task was clicked:

```typescript
// Before - BROKEN
if (notification.relatedTaskId) {
  navigate(`/tasks/${notification.relatedTaskId}`);
}
```

However, this route doesn't exist in the router configuration. The application doesn't have individual task detail pages - instead, tasks are displayed in drawers/modals within the task list pages (Published Tasks, Assigned Tasks, Task Invitations).

## Solution
Updated the notification click handler to navigate to the appropriate task list page based on the notification type:

```typescript
// After - FIXED
if (notification.relatedTaskId) {
  // For task invitations, go to invitations page
  if (notification.type === 'task_invitation') {
    navigate('/tasks/invitations');
  }
  // For task assignments and other task-related notifications, go to assigned tasks
  else if (notification.type === 'task_assigned' || 
           notification.type === 'deadline_reminder' ||
           notification.type === 'dependency_resolved' ||
           notification.type === 'status_changed') {
    navigate('/tasks/assigned');
  }
  // For invitation responses, go to published tasks
  else if (notification.type === 'task_invitation_accepted' ||
           notification.type === 'task_invitation_rejected') {
    navigate('/tasks/published');
  }
  // Default: go to dashboard
  else {
    navigate('/dashboard');
  }
}
```

## Navigation Logic

| Notification Type | Destination | Reason |
|------------------|-------------|---------|
| `task_invitation` | `/tasks/invitations` | User needs to accept/reject the invitation |
| `task_assigned` | `/tasks/assigned` | Task is now in user's assigned tasks |
| `deadline_reminder` | `/tasks/assigned` | Reminder for user's assigned task |
| `dependency_resolved` | `/tasks/assigned` | User's task dependency is resolved |
| `status_changed` | `/tasks/assigned` | Status change on user's task |
| `task_invitation_accepted` | `/tasks/published` | Publisher sees who accepted |
| `task_invitation_rejected` | `/tasks/published` | Publisher sees who rejected |
| Other types | `/dashboard` | Default fallback |

## User Experience
After clicking a notification:
1. User is taken to the relevant task list page
2. User can find and click on the specific task to view details in the drawer
3. No more 404 errors

## Alternative Approaches Considered

### Option 1: Create a dedicated task detail route
- Would require creating a new route `/tasks/:taskId`
- Would need a new page component
- More complex implementation
- **Not chosen** because the app already uses drawers for task details

### Option 2: Pass task ID as URL parameter
- Navigate to `/tasks/assigned?taskId={id}` and auto-open drawer
- Would require modifying task list pages to read URL params
- More complex state management
- **Not chosen** for simplicity

### Option 3: Current solution (chosen)
- Navigate to appropriate list page
- Simple, uses existing routes
- Consistent with current UX patterns
- **Chosen** for simplicity and consistency

## Files Modified
- `packages/frontend/src/pages/NotificationPage.tsx`

## Testing
- ✅ TypeScript compilation passes with no diagnostics
- ✅ All notification types have appropriate navigation targets
- ✅ No 404 errors when clicking notifications

## Future Enhancements
If needed, we could enhance this by:
1. Adding URL parameters to auto-open the task drawer
2. Highlighting the specific task in the list
3. Auto-scrolling to the task in the list

## Status
**COMPLETED** - The fix has been applied and verified.
