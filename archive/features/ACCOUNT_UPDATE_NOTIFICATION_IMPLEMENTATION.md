# Account Update Notification Implementation

## Overview
Implemented a notification system to inform users when an administrator updates their account details (specifically Role or Positions).

## Changes

### Backend

1.  **Database**:
    *   Added `account_updated` to `notification_type` enum in PostgreSQL.
    *   Migration file: `packages/database/migrations/20241215_000005_add_account_updated_notification.sql`.

2.  **Model**:
    *   Updated `NotificationType` enum in `packages/backend/src/models/Notification.ts` to include `ACCOUNT_UPDATED`.

3.  **Service**:
    *   Added `notifyAccountUpdated(userId: string, changes: string[])` method to `NotificationService` in `packages/backend/src/services/NotificationService.ts`.

4.  **Routes**:
    *   Updated `PUT /users/:userId` in `packages/backend/src/routes/admin.routes.ts`.
    *   Added logic to detect changes in Role and Positions.
    *   Triggers `notificationService.notifyAccountUpdated` if changes are detected.

### Frontend

1.  **Notification Page**:
    *   Updated `packages/frontend/src/pages/NotificationPage.tsx`.
    *   Added `UserOutlined` icon for `account_updated` notifications.
    *   Added "账户变更" tag with `geekblue` color for `account_updated` notifications.

## Verification
*   When an admin changes a user's role, the user receives a notification: "您的账户信息已被管理员修改。变更内容: 角色变更 (user -> position_admin)".
*   When an admin changes a user's positions, the user receives a notification: "您的账户信息已被管理员修改。变更内容: 岗位分配变更".
*   If both change, both are listed.
