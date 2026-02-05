# User Management Position Display Fix

## Issue
The "Positions" column in the User Management page was displaying "-" because the API endpoint `GET /api/admin/users` was not returning position information for the users.

## Fix

### Backend

1.  **Service**: `packages/backend/src/services/UserService.ts`
    *   Updated `getAllUsers()` to use `LEFT JOIN` and `json_agg` to fetch assigned positions for each user.
    *   Updated `getUsersByPositions()` to also fetch positions for the filtered users.
    *   Updated `toUserResponse()` to include the `positions` field in the response object.

2.  **Model**: `packages/backend/src/models/User.ts`
    *   Updated `UserResponse` interface to include optional `positions` array.

## Verification
*   Refresh the User Management page.
*   The "Positions" column should now correctly display the tags for assigned positions (e.g., `[Frontend]`, `[Backend]`) instead of `-`.
