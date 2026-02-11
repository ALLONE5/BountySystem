# Developer Role Implementation

## Overview
Added a new "DEVELOPER" role to the user role system with the same permissions as SUPER_ADMIN, while restricting SUPER_ADMIN access to system configuration and audit logs.

## Changes Made

### Backend Changes

#### 1. User Model (`packages/backend/src/models/User.ts`)
- Added `DEVELOPER = 'developer'` to the `UserRole` enum

#### 2. Permission Service (`packages/backend/src/services/PermissionService.ts`)
- Updated `canAccessPage()` method to treat DEVELOPER role same as SUPER_ADMIN
- DEVELOPER role has access to all pages

#### 3. Validator Utility (`packages/backend/src/utils/Validator.ts`)
- Updated `isAdmin()` to include DEVELOPER role
- Updated `isSuperAdmin()` to include DEVELOPER role (for permission purposes)

#### 4. Permission Middleware (`packages/backend/src/middleware/permission.middleware.ts`)
- Updated `requireAdmin` to include DEVELOPER role
- Updated `requireSuperAdmin` to include DEVELOPER role

#### 5. Test Utilities (`packages/backend/src/test-utils/generators.ts`)
- Added DEVELOPER to `userRoleArbitrary` for property-based testing

### Frontend Changes

#### 1. Types (`packages/frontend/src/types/index.ts`)
- Added `DEVELOPER = 'developer'` to the `UserRole` enum

#### 2. Status Tag Component (`packages/frontend/src/components/common/StatusTag.tsx`)
- Added DEVELOPER role mapping with purple color and "开发者" text

#### 3. Permission Hook (`packages/frontend/src/hooks/usePermission.ts`)
- Updated `isAdmin()` to include DEVELOPER role
- Updated `isSuperAdmin()` to include DEVELOPER role
- Added `isDeveloper()` method for specific developer checks

#### 4. Main Layout (`packages/frontend/src/layouts/MainLayout.tsx`)
- Updated admin menu items to specify role access:
  - System Config: Only DEVELOPER role
  - Audit Logs: Only DEVELOPER role
  - Other admin functions: SUPER_ADMIN, DEVELOPER, and POSITION_ADMIN as appropriate
- Updated menu filtering logic to properly handle role-based access

### Database Changes

#### 1. Migration (`packages/database/migrations/20260211_000001_add_developer_role.sql`)
- Added 'developer' value to the `user_role` enum type

#### 2. Migration Script (`packages/backend/scripts/run-developer-role-migration.cjs`)
- Automated script to run the database migration

#### 3. User Creation Script (`packages/backend/scripts/create-developer-user.cjs`)
- Script to create a test developer user

## Role Permissions Matrix

| Feature | USER | POSITION_ADMIN | SUPER_ADMIN | DEVELOPER |
|---------|------|----------------|-------------|-----------|
| Personal Dashboard | ✅ | ✅ | ✅ | ✅ |
| Task Management | ✅ | ✅ | ✅ | ✅ |
| User Management | ❌ | ✅ (limited) | ✅ | ✅ |
| Group Management | ❌ | ❌ | ✅ | ✅ |
| Avatar Management | ❌ | ❌ | ✅ | ✅ |
| Position Management | ❌ | ❌ | ✅ | ✅ |
| Bounty Algorithm | ❌ | ❌ | ✅ | ✅ |
| Notification Broadcast | ❌ | ✅ | ✅ | ✅ |
| **System Configuration** | ❌ | ❌ | ❌ | ✅ |
| **Audit Logs** | ❌ | ❌ | ❌ | ✅ |

## Key Changes Summary

1. **New DEVELOPER Role**: Has all permissions that SUPER_ADMIN previously had
2. **Restricted SUPER_ADMIN**: No longer has access to System Configuration and Audit Logs
3. **Backward Compatibility**: All existing functionality remains the same for other roles
4. **Clear Separation**: System-level configuration is now restricted to developers only

## Test Credentials

- **Developer User**:
  - Username: `developer`
  - Email: `developer@example.com`
  - Password: `Password123`
  - Role: `developer`

## Migration Instructions

1. Run the database migration:
   ```bash
   cd packages/backend
   node scripts/run-developer-role-migration.cjs
   ```

2. Create a developer user (optional):
   ```bash
   cd packages/backend
   node scripts/create-developer-user.cjs
   ```

3. Restart the backend and frontend services to apply changes

## Impact

- **SUPER_ADMIN users**: Will no longer see System Configuration and Audit Logs in admin menu
- **DEVELOPER users**: Have full access to all admin functions including system config and audit logs
- **Other roles**: No changes to existing permissions
- **API endpoints**: All existing endpoints continue to work with updated permission checks

## Files Modified

### Backend
- `packages/backend/src/models/User.ts`
- `packages/backend/src/services/PermissionService.ts`
- `packages/backend/src/utils/Validator.ts`
- `packages/backend/src/middleware/permission.middleware.ts`
- `packages/backend/src/test-utils/generators.ts`

### Frontend
- `packages/frontend/src/types/index.ts`
- `packages/frontend/src/components/common/StatusTag.tsx`
- `packages/frontend/src/hooks/usePermission.ts`
- `packages/frontend/src/layouts/MainLayout.tsx`

### Database
- `packages/database/migrations/20260211_000001_add_developer_role.sql`
- `packages/database/migrations/20260211_000001_rollback_developer_role.sql`

### Scripts
- `packages/backend/scripts/run-developer-role-migration.cjs`
- `packages/backend/scripts/create-developer-user.cjs`