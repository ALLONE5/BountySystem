# Position Admin Logic Update

## Overview
Updated the logic for Position Administrators to explicitly define which positions they manage, while allowing them to hold multiple positions themselves.

## Changes

### Backend

1.  **Database**:
    *   Existing `position_admins` table already supports the relationship between admins and positions.

2.  **Model**:
    *   Updated `UserResponse` in `packages/backend/src/models/User.ts` to include `managedPositions`.

3.  **Service**:
    *   Updated `UserService.getUserWithPositions` in `packages/backend/src/services/UserService.ts` to fetch `managedPositions` from `position_admins` table.
    *   Updated `UserService.toUserResponse` to include `managedPositions`.
    *   Added `UserService.updateUserManagedPositions` to update the `position_admins` table.

4.  **Routes**:
    *   Updated `PUT /users/:userId` in `packages/backend/src/routes/admin.routes.ts` to handle `managedPositionIds` in the request body.
    *   Added logic to update managed positions using `userService.updateUserManagedPositions`.
    *   Added "管理岗位变更" (Managed Position Change) to the change tracking for notifications.

### Frontend

1.  **Types**:
    *   Updated `User` interface in `packages/frontend/src/types/index.ts` to include `managedPositions`.
    *   Updated `UpdateUserRequest` in `packages/frontend/src/api/admin.ts` to include `managedPositionIds`.

2.  **UI**:
    *   Updated `packages/frontend/src/pages/admin/UserManagementPage.tsx`.
    *   **User Details**: Added "管理岗位" (Managed Positions) section in the user details drawer, visible only for Position Admins.
    *   **Edit User**: Added "管理岗位" (Managed Positions) multi-select field in the edit modal, visible only when the selected role is `POSITION_ADMIN`.

## Verification
1.  **View Admin Info**:
    *   Go to User Management.
    *   Click on a Position Admin user.
    *   The details drawer should show "管理岗位" with the list of positions they manage.
2.  **Edit Admin Info**:
    *   Edit a user and set role to "Position Admin".
    *   A new field "管理岗位" appears.
    *   Select positions and save.
    *   The user is now a manager for those positions.
3.  **Scoped Access**:
    *   Log in as that Position Admin.
    *   They should only see users/tasks/applications related to the positions they manage (this was already implemented in backend routes).
