# Task Management Publisher and Assignee Display

## Overview
Added "Publisher" (发布人) and "Assignee" (承接人) columns to the Task Management page in the Admin interface.

## Changes

### Backend

1.  **Model**: `packages/backend/src/models/Task.ts`
    *   Added optional `publisher` and `assignee` fields to `Task` interface.

2.  **Service**: `packages/backend/src/services/TaskService.ts`
    *   Renamed `mapTasksWithPublisher` to `mapTasksWithUsers`.
    *   Updated `mapTasksWithUsers` to map both publisher and assignee details from query results.
    *   Updated `getAllTasks` and `getTasksByPositions` queries to `LEFT JOIN` with the `users` table twice (aliased as `p` for publisher and `a` for assignee) to fetch user details.

### Frontend

1.  **Types**: `packages/frontend/src/types/index.ts`
    *   Added optional `assignee` field to `Task` interface (`publisher` was already there).

2.  **Page**: `packages/frontend/src/pages/admin/TaskManagementPage.tsx`
    *   Added "发布人" (Publisher) column to the table.
    *   Added "承接人" (Assignee) column to the table.
    *   Added Publisher and Assignee fields to the Task Details drawer.

## Verification
*   Go to Admin -> Task Management.
*   The table should now show the username of the publisher and assignee for each task.
*   Clicking on a task name should open the drawer, which also displays the publisher and assignee.
