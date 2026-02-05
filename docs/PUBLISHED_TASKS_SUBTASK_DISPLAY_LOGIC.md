# Published Tasks Subtask Display Logic

**Date**: 2026-02-03  
**Status**: ✅ Complete

## Overview

Implemented the same subtask display logic for "我的悬赏" (Published Tasks) page as exists in "我的任务" (Assigned Tasks) page. This prevents duplicate display of subtasks when both parent and subtask are published by the same user.

## Problem

Previously, the "我的悬赏" page would show ALL tasks published by the user, including:
- Parent tasks (depth 0)
- Subtasks (depth 1) where the parent was also published by the same user

This caused duplicate/redundant display because:
- The parent task would appear in the list
- The subtask would also appear separately in the list
- But the subtask is already accessible through the parent task's "子任务" tab

## Solution

Applied the same filtering logic used in "我的任务" to "我的悬赏":

### Backend Changes

#### 1. Updated Route Handler

**File**: `packages/backend/src/routes/task.routes.ts`

Changed the `getPublishedTasks` route to pass `onlyTopLevel = true`:

```typescript
router.get('/user/published', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // Added third parameter: true (onlyTopLevel)
  const tasks = await taskService.getTasksByUser(userId, 'publisher', true);

  res.json(tasks);
}));
```

#### 2. Extended TaskService Logic

**File**: `packages/backend/src/services/TaskService.ts`

Added filtering logic for `publisher` role in `getTasksByUser()` method:

```typescript
if (role === 'assignee' && onlyTopLevel) {
  query += `
    LEFT JOIN tasks p ON t.parent_id = p.id
    WHERE t.assignee_id = $1
    AND (t.parent_id IS NULL OR p.assignee_id IS DISTINCT FROM $1)
  `;
} else if (role === 'publisher' && onlyTopLevel) {
  // NEW: Added same logic for publisher role
  query += `
    LEFT JOIN tasks p ON t.parent_id = p.id
    WHERE t.publisher_id = $1
    AND (t.parent_id IS NULL OR p.publisher_id IS DISTINCT FROM $1)
  `;
} else {
  query += `
    WHERE ${column} = $1
  `;
}
```

## Display Logic

The filtering logic works as follows:

### What Gets Displayed

1. **All top-level tasks** (`parent_id IS NULL`) published by the user
2. **Subtasks where the parent publisher is different** (`p.publisher_id IS DISTINCT FROM $1`)

### What Gets Hidden

- **Subtasks where the parent publisher is the same user**
  - These are accessible through the parent task's "子任务" tab
  - Showing them separately would be redundant

## Examples

### Scenario 1: Same Publisher (Hidden)
- Parent task published by User A
- Subtask published by User A
- **Result**: User A's "我的悬赏" shows only the parent task
- **Reason**: Subtask is accessible via parent task's subtask tab

### Scenario 2: Different Publisher (Shown)
- Parent task published by User A
- Subtask published by User B
- **Result**: 
  - User A's "我的悬赏" shows the parent task
  - User B's "我的悬赏" shows the subtask
- **Reason**: Different publishers need to see their respective tasks

### Scenario 3: No Parent (Shown)
- Subtask with no parent (orphaned)
- Published by User A
- **Result**: User A's "我的悬赏" shows the subtask
- **Reason**: It's a top-level task (no parent)

## Benefits

1. **Cleaner UI**: Eliminates duplicate/redundant task display
2. **Consistent UX**: Same logic as "我的任务" page
3. **Better Organization**: Parent tasks serve as containers for their subtasks
4. **Reduced Clutter**: Users see only the tasks they need to manage directly
5. **Logical Hierarchy**: Maintains clear parent-child relationship

## User Experience

### Before
- User publishes a parent task
- User creates a subtask for that parent task
- Both parent and subtask appear in "我的悬赏" list
- Confusing and redundant

### After
- User publishes a parent task
- User creates a subtask for that parent task
- Only parent task appears in "我的悬赏" list
- Subtask is accessible via parent task's "子任务" tab
- Clean and organized

## Technical Details

### SQL Query Logic

The query uses a LEFT JOIN to check the parent task's publisher:

```sql
LEFT JOIN tasks p ON t.parent_id = p.id
WHERE t.publisher_id = $1
AND (t.parent_id IS NULL OR p.publisher_id IS DISTINCT FROM $1)
```

This means:
- `t.parent_id IS NULL`: Include all top-level tasks
- `OR p.publisher_id IS DISTINCT FROM $1`: Include subtasks where parent has different publisher
- `IS DISTINCT FROM` handles NULL values correctly (treats NULL as distinct from any value)

### Performance Considerations

- Single LEFT JOIN adds minimal overhead
- Query uses existing indexes on `publisher_id` and `parent_id`
- No additional database queries needed
- Filtering happens at database level (efficient)

## Files Modified

1. `packages/backend/src/routes/task.routes.ts`
   - Updated `/user/published` route to pass `onlyTopLevel = true`

2. `packages/backend/src/services/TaskService.ts`
   - Extended `getTasksByUser()` to handle `publisher` role with `onlyTopLevel` logic

## Testing

To test this feature:

1. **Setup**:
   - Login as User A
   - Create a parent task
   - Create a subtask for that parent task

2. **Verify**:
   - Go to "我的悬赏" page
   - Should see only the parent task
   - Click on parent task
   - Go to "子任务" tab
   - Should see the subtask there

3. **Test Different Publisher**:
   - Login as User B
   - Create a subtask for User A's parent task (if permissions allow)
   - Go to User B's "我的悬赏" page
   - Should see the subtask (because parent publisher is different)

## Related Documentation

- [Subtask Depth Limit and UI Improvements](./SUBTASK_DEPTH_LIMIT_AND_UI_IMPROVEMENTS.md)
- [Subtask Assignee Fix](./SUBTASK_ASSIGNEE_FIX.md)
- [Subtask Detail View Full Drawer](./SUBTASK_DETAIL_VIEW_FULL_DRAWER.md)

## Notes

- This change maintains consistency across both "我的任务" and "我的悬赏" pages
- The logic is symmetrical: same filtering for assignee and publisher roles
- No frontend changes required - filtering happens entirely in backend
- Existing subtasks will automatically be filtered correctly
- No database migration needed
