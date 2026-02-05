# Subtask Assignee Display Fix

## Issue
The subtask list in the Task Detail Drawer was not displaying the assignee (undertaker) information, even though the frontend code had logic to render it.

## Root Cause
The backend endpoint `GET /tasks/:taskId/subtasks` (handled by `TaskService.getSubtasks`) was performing a simple `SELECT * FROM tasks` query. It was not joining with the `users` table to populate the `assignee` (and `publisher`) details. As a result, the `assignee` field in the response was undefined.

## Fix
Updated `TaskService.getSubtasks` in `packages/backend/src/services/TaskService.ts` to:
1.  Select specific fields with aliases (matching the `Task` model).
2.  `LEFT JOIN users` and `avatars` tables for both `publisher` and `assignee`.
3.  `LEFT JOIN task_groups` for `groupName`.
4.  Use `this.mapTasksWithUsers(result.rows)` to correctly format the response object with nested `publisher` and `assignee` objects.

## Verification
1.  Open the Task Detail Drawer for a task with subtasks (e.g., "改进任务详情页面体验").
2.  Go to the "子任务" (Subtasks) tab.
3.  Verify that the assignee's avatar and username are now displayed next to each subtask.
