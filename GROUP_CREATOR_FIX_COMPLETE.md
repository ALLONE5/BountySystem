# Group Creator Display Fix - Complete

## Issue
Group creators were showing as "Unknown" in the task management interface, and the API was returning 500 errors with "字段 g.description 不存在" (field g.description does not exist).

## Root Causes
1. The `GroupService.getUserGroups()` method was referencing a non-existent table `task_group_members`. The correct table name is `group_members`.
2. Multiple queries were trying to SELECT a `description` field that doesn't exist in the `task_groups` table schema.

## Solution Applied

### 1. Fixed Table References
Changed all references from `task_group_members` to `group_members` in:
- `GroupService.getUserGroups()` - Line 193
- `GroupService.getUserGroupTasks()` - Line 449

### 2. Removed Non-Existent Description Field
Removed all references to the `description` field which doesn't exist in the database schema:
- `GroupService.getUserGroups()` query
- `GroupMapper.toDTO()` method
- `GroupMapper.getSelectFields()` method
- Frontend `TaskGroup` interface in `types/index.ts`

### 3. Verified Data Flow
✅ Database schema: `group_members` table exists with proper structure
✅ Database schema: `task_groups` table has NO `description` column
✅ Backend model: `TaskGroup` interface includes `creatorName` and `creatorAvatarUrl`
✅ Frontend type: `TaskGroup` interface includes creator fields (description removed)
✅ GroupMapper: Properly maps snake_case to camelCase for creator fields
✅ GroupCard component: Displays `group.creatorName` with fallback to "Unknown"

### 4. Query Structure
All group queries now properly JOIN with users and avatars tables without referencing non-existent columns:
```sql
SELECT 
  g.id, 
  g.name, 
  g.creator_id as "creatorId", 
  g.created_at as "createdAt",
  g.updated_at as "updatedAt",
  u.username as "creatorName",
  a.image_url as "creatorAvatarUrl"
FROM task_groups g
INNER JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN users u ON g.creator_id = u.id
LEFT JOIN avatars a ON u.avatar_id = a.id
WHERE gm.user_id = $1
```

## Files Modified
- `packages/backend/src/services/GroupService.ts`
- `packages/backend/src/utils/mappers/GroupMapper.ts`
- `packages/frontend/src/types/index.ts`

## Testing
The fix resolves both the database table error and the missing column error. The groups API should now return creator information correctly, and the frontend GroupCard component will display the actual creator username instead of "Unknown".

## Status
✅ Complete - Ready for testing
