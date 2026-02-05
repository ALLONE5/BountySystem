# Browse Tasks Visibility Logic

## Overview

This document explains why tasks appear or don't appear in the "赏金任务" (Browse Tasks) page.

## Filtering Logic

The browse tasks page uses the `/api/tasks/available` endpoint, which applies the following filters:

### Required Conditions (ALL must be true)

1. **Is Unassigned** (`assignee_id IS NULL`)
   - Task must not have an assignee
   - Once a task is accepted, it disappears from browse tasks

2. **Visibility Check** (one of the following):
   - **PUBLIC**: Visible to all users
   - **POSITION_ONLY**: Visible only to users with matching position
   - **PRIVATE**: Visible only to publisher (and admins)

**Note**: The system uses the `visibility` field to control task visibility. Subtasks are created with `visibility = PRIVATE` by default and change to `visibility = PUBLIC` when published. The `is_published` and `is_executable` fields exist for tracking purposes but are not used in filtering logic.

## Common Scenarios

### Scenario 1: Parent Task with Subtasks

**Both parent and subtasks can appear in browse tasks:**
- Parent task can be accepted if it's unassigned and has appropriate visibility
- Subtasks can also be accepted independently if they meet the criteria
- Users can choose to accept the parent task (taking responsibility for all subtasks) or accept individual subtasks

**Example:**
```
Parent Task (depth 0)
├─ assignee_id: null
├─ visibility: public
├─ ✅ Will show in browse tasks
└─ Subtask (depth 1)
   ├─ assignee_id: null
   ├─ visibility: public
   └─ ✅ Will also show in browse tasks
```

### Scenario 2: Task Has Assignee

**Why It Doesn't Show:**
- Task has `assignee_id` set (someone already accepted it)
- Browse tasks only shows unassigned tasks

**Solution:**
- Task will reappear if assignee abandons the task

### Scenario 3: Subtask Not Published

**Why It Doesn't Show:**
- Subtask has `visibility = PRIVATE`
- Only tasks with PUBLIC or POSITION_ONLY visibility appear in browse tasks (based on user permissions)

**Solution:**
- Parent task assignee must publish the subtask (which changes visibility to PUBLIC)

### Scenario 4: Private or Position-Only Visibility

**Why It Doesn't Show (to some users):**
- **PRIVATE**: Only visible to publisher
- **POSITION_ONLY**: Only visible to users with matching position

**Solution:**
- Change visibility to PUBLIC for wider visibility

## Diagnostic Script

Use the diagnostic script to check why a specific task doesn't appear:

```bash
cd packages/backend
node scripts/check-task-visibility.js <taskId>
```

The script will show:
- Complete task information
- Which filter conditions pass/fail
- Why the task does or doesn't appear
- Subtask information (if applicable)

## Cache Considerations

Browse tasks results are cached for 60 seconds. If you:
- Publish a subtask (change visibility to PUBLIC)
- Change task visibility
- Abandon a task

The changes may take up to 60 seconds to appear in browse tasks due to caching.

**Cache Invalidation:**
Cache is automatically invalidated when:
- New task is created
- Task is updated (status, assignee, visibility changes)
- Task is deleted
- Task is accepted
- Task is abandoned

## Related Files

- **Backend Service**: `packages/backend/src/services/TaskService.ts` (getAvailableTasks method)
- **Backend Route**: `packages/backend/src/routes/task.routes.ts` (/api/tasks/available)
- **Frontend Page**: `packages/frontend/src/pages/BrowseTasksPage.tsx`
- **Diagnostic Script**: `packages/backend/scripts/check-task-visibility.js`
- **Database Triggers**: `packages/database/migrations/20241210_000001_create_core_tables.sql` (is_executable triggers)
- **Detailed Explanation**: `docs/IS_EXECUTABLE_LOGIC_EXPLANATION.md` (complete trigger logic documentation)

## Summary

**For a task to appear in browse tasks, it must:**
1. ✅ Be unassigned (no assignee)
2. ✅ Have appropriate visibility (PUBLIC for all users, POSITION_ONLY for specific positions)

**Both parent tasks and subtasks can appear in browse tasks** as long as they meet the above criteria. Users can choose to accept parent tasks (taking responsibility for managing subtasks) or accept individual subtasks.

**Subtask Publishing**: Subtasks are created with `visibility = PRIVATE` and change to `visibility = PUBLIC` when published by the parent task assignee.
