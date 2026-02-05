# Group Task Display Fix

## Summary

Fixed an issue where tasks viewed from the "Group Tasks" list (in Groups Page) were not displaying the Group Name in the Task Detail view.

### Problem
- The `GroupService.getGroupTasks` method was fetching tasks but NOT joining with `task_groups` to get the `groupName`.
- It was also missing `publisher` details.
- As a result, when opening `TaskDetailDrawer` from the Groups page, `task.groupName` was undefined, causing the UI to fall back to other display logic (or show nothing/wrong info).

### Solution
- Updated `GroupService.getGroupTasks` to:
  - `LEFT JOIN task_groups` to fetch `groupName`.
  - `LEFT JOIN users` (publisher) to fetch publisher details.
  - Map the results to include the `publisher` object and `groupName` property, matching the structure returned by `TaskService`.

## Files Modified
- `packages/backend/src/services/GroupService.ts`

## Verification
- Open "Groups" page.
- Select a group (e.g., "体验设计组").
- Click on a task (e.g., "改进任务详情页面体验").
- The Task Detail drawer should now correctly display the Group Name tag in the "Assignee / Collaborators" section.
