# Task Management User Details Interaction

## Overview
Made the "Publisher" and "Assignee" columns in the Task Management page clickable. Clicking them now opens a User Details drawer, similar to the User Management interface.

## Changes

### Frontend

1.  **Page**: `packages/frontend/src/pages/admin/TaskManagementPage.tsx`
    *   Added `userDrawerVisible` and `selectedUser` state.
    *   Added `handleViewUser` function to fetch and display user details.
    *   Added `getRoleTag` helper function (copied from UserManagementPage).
    *   Updated "Publisher" and "Assignee" columns to render as clickable Links with `UserOutlined` icon.
    *   Added a new `Drawer` component to display user details (reusing the structure from UserManagementPage).

## Verification
*   Go to Admin -> Task Management.
*   Click on a Publisher's name. A drawer should open showing their details (Role, Positions, etc.).
*   Click on an Assignee's name. The same drawer should open with their details.
