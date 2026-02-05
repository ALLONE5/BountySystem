# Group Task Display Implementation

## Summary

We have implemented the display of Group Names for tasks assigned to groups.

### 1. Backend Updates
- **Task Model**: Added `groupName` optional property to `Task` interface.
- **Task Service**:
  - Updated `getTask`, `getTasksByUser`, `getVisibleTasks`, and `getAvailableTasks` queries to `LEFT JOIN task_groups` and select `tg.name as "groupName"`.
  - Updated `mapTasksWithUsers` to include `groupName` in the returned object.

### 2. Frontend Updates
- **Task Type**: Updated `Task` interface in `types/index.ts` to include `groupName`.
- **My Tasks (AssignedTasksPage)**:
  - Added a "Group" tag (Geekblue color with Team icon) next to the task name if the task is assigned to a group.
- **Published Tasks (PublishedTasksPage)**:
  - Added a new "Assignee" column.
  - Displays User Avatar and Name if assigned to a user.
  - Displays Group Tag if assigned to a group.
  - Displays "Unassigned" if neither.
- **Task Detail (TaskDetailDrawer)**:
  - Updated "Assignee / Collaborators" section to display the Group Tag if the task is assigned to a group.

## Files Modified

### Backend
- `packages/backend/src/models/Task.ts`
- `packages/backend/src/services/TaskService.ts`

### Frontend
- `packages/frontend/src/types/index.ts`
- `packages/frontend/src/pages/AssignedTasksPage.tsx`
- `packages/frontend/src/pages/PublishedTasksPage.tsx`
- `packages/frontend/src/components/TaskDetailDrawer.tsx`

## Verification
- Check "My Tasks" page: Group tasks should have a tag.
- Check "Published Tasks" page: Assignee column should show group name.
- Check Task Detail: Assignee section should show group name.

## Test Data
We have created a script `packages/backend/scripts/populate-group-tasks.js` to inject test data for verifying the display.
- Creates "Alpha Squad" and "Beta Team".
- Creates tasks assigned to these groups.
- Creates subtasks assigned to users within these groups.

Run with:
```bash
cd packages/backend
node scripts/populate-group-tasks.js
```
