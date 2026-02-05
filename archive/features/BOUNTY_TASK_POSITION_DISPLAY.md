# Bounty Task Position Requirement Display

## Issue
The user requested to display the position requirement information on the Bounty Task page (Browse Tasks). Previously, tasks with position requirements were filtered correctly but the user couldn't see *which* position was required on the card itself.

## Changes

### Backend
- **File**: `packages/backend/src/services/TaskService.ts`
- **Change**: Updated `getAvailableTasks` and `getVisibleTasks` queries to `LEFT JOIN positions` and select `p.name as "positionName"`.

### Frontend
- **File**: `packages/frontend/src/types/index.ts`
- **Change**: Added `positionName?: string;` to the `Task` interface.
- **File**: `packages/frontend/src/pages/BrowseTasksPage.tsx`
- **Change**:
    - Updated `groupTasks` to use `task.positionName` for the group header (instead of the raw UUID).
    - Updated `renderTaskCard` to display a purple Tag with the position name if it exists.

### UI Refinement
- Moved the Position Tag to the right side of the card, below the bounty amount.
- Highlighted the Deadline (Planned End Date) with bold text and a warning color.

## Verification
1. Go to "Browse Tasks" page.
2. Look for tasks that have a position requirement.
3. You should see a purple tag (e.g., "Frontend Developer") on the task card.
4. Try grouping by "Position" using the dropdown. The group headers should now show the position names instead of IDs.
