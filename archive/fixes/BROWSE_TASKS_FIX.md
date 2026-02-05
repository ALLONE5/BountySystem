# Browse Tasks Visibility Fix

## Issue
The user reported that the "Browse Tasks" page (Bounty Hall) was not showing all available public tasks and tasks belonging to the user's position.

## Analysis
The `TaskService.getAvailableTasks` method filters tasks based on:
1. `is_executable = true` (Only leaf tasks).
2. `assignee_id IS NULL` (Not taken).
3. Visibility rules:
   - `public`: Visible to everyone.
   - `position_only`: Visible only if the user has the matching position.
   - `private`: Visible only to the publisher.

The issue likely stems from:
1. **Admin Visibility**: Administrators (Super Admin, Position Admin) expect to see ALL tasks, including `position_only` tasks for positions they don't explicitly hold. The previous logic hid these tasks if the admin didn't have the specific position assigned.
2. **Data Integrity**: If a user believes they have a position but the `user_positions` table is not updated, they won't see the tasks. (This is a data issue, not code).

## Fix
Updated `TaskService.ts` and `task.routes.ts` to:
1. Pass the `userRole` (from the authenticated user) to `getAvailableTasks` and `getVisibleTasks`.
2. Modify the SQL query to allow `super_admin` and `position_admin` to see `position_only` tasks regardless of their assigned positions.
3. Allow `super_admin` to see `private` tasks as well.

## Changes
- `packages/backend/src/services/TaskService.ts`: Updated `getAvailableTasks` and `getVisibleTasks` signatures and queries.
- `packages/backend/src/routes/task.routes.ts`: Updated `/available` and `/visible` endpoints to pass `req.user.role`.

## Verification
- Log in as a Super Admin or Position Admin.
- Go to "Browse Tasks".
- You should now see tasks for ALL positions, even if you don't have those positions assigned to your profile.
