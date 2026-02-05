# Group Task & Hierarchy Implementation Summary

## Features Implemented

1.  **Group Member Invitation UI**:
    -   Created `InviteMemberModal` component (`packages/frontend/src/components/common/InviteMemberModal.tsx`).
    -   Supports searching users by **Username**, **Email**, or **ID**.
    -   Integrated into `GroupsPage` (`packages/frontend/src/pages/GroupsPage.tsx`).

2.  **Group Task Display Logic**:
    -   **Assignee Display**: Level 1 tasks assigned to a group now display the **Group Name** (implemented in previous step).
    -   **Status Display**: If a task is assigned to a group (has `groupName`), it is displayed as **"In Progress"** in the Task Detail Drawer, even if the underlying status is "Not Started".

3.  **Subtask Assignment & Inheritance Logic**:
    -   **Backend Enforcement** (`packages/backend/src/services/TaskService.ts`):
        -   **Max Depth**: Enforced limit of 3 levels (0, 1, 2).
        -   **Personal Task Inheritance**: If the parent task is assigned to a specific user (and not a group task), any new subtask is automatically assigned to the same user.
        -   **Group Task Inheritance**: If the parent task is a group task:
            -   Subtasks automatically inherit the `groupId`.
            -   If an `assigneeId` is provided for the subtask, the system verifies that the user is a **member of the group**.

4.  **User Search Update**:
    -   Updated `UserService.searchUsers` (`packages/backend/src/services/UserService.ts`) to support searching by **User ID**.

## Verification Steps

1.  **Invite Member**:
    -   Go to "My Groups".
    -   Click "Invite Member".
    -   Search by a User ID (e.g., copy one from the database or logs).
    -   Verify user is found and invitation can be sent.

2.  **Group Task Status**:
    -   View a task assigned to a group.
    -   Verify status shows "In Progress" (进行中).

3.  **Subtask Creation (Personal)**:
    -   As User A, create a subtask for a task assigned to User A.
    -   Verify subtask is automatically assigned to User A.

4.  **Subtask Creation (Group)**:
    -   Create a subtask for a Group Task.
    -   Try to assign to a non-member -> Should fail (Backend validation).
    -   Try to assign to a member -> Should succeed.
    -   Leave unassigned -> Should succeed (available for members to pick up).
