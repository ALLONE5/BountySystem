# Admin Group Management Implementation

## Overview
Implemented a Group Management interface for Super Admins to view and manage all task groups in the system.

## Changes

### Frontend
1.  **New Page**: `packages/frontend/src/pages/admin/GroupManagementPage.tsx`
    - Displays a list of all groups.
    - Allows searching by group name.
    - Allows viewing group members.
    - Allows deleting groups.
2.  **API Update**: `packages/frontend/src/api/admin.ts`
    - Added `getGroups()` to fetch all groups.
    - Added `deleteGroup(groupId)` to delete a group.
3.  **Router Update**: `packages/frontend/src/router/index.tsx`
    - Added route `/admin/groups` pointing to `GroupManagementPage`.
4.  **Layout Update**: `packages/frontend/src/layouts/MainLayout.tsx`
    - Added "Group Management" (组群管理) to the Admin sidebar menu.
    - Restricted visibility to Super Admins.

### Backend
1.  **Service Update**: `packages/backend/src/services/GroupService.ts`
    - Added `getAllGroups()` to fetch all groups for admin.
    - Added `deleteGroupAsAdmin(groupId)` to allow admins to delete groups without being the creator.
2.  **Route Update**: `packages/backend/src/routes/admin.routes.ts`
    - Added `GET /api/admin/groups` endpoint (Super Admin only).
    - Added `DELETE /api/admin/groups/:groupId` endpoint (Super Admin only).

## Verification
- Super Admins can access the "Group Management" page via the URL `/admin/groups` (or navigation if added to sidebar).
- The page lists all groups in the system.
- Admins can view members of any group.
- Admins can delete any group.
