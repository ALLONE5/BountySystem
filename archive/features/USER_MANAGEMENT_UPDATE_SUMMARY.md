# User Management Interface Update

## Changes
Updated the User Management table to display the list of assigned positions instead of just the count.

### Frontend
*   **File**: `packages/frontend/src/pages/admin/UserManagementPage.tsx`
*   **Change**: Modified the "positions" column definition.
    *   **Before**: Displayed `record.positions?.length || 0` with title "岗位数".
    *   **After**: Displays a list of Tags with position names using `record.positions.map(...)` with title "岗位".

## Verification
*   Go to Admin -> User Management.
*   The "岗位" column now shows tags like `[Frontend Developer] [Backend Developer]` instead of numbers like `2`.
