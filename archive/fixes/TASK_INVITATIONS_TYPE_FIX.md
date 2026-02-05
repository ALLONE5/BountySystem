# Task Invitations Page Type Error Fix

## Issue
When users visited the Task Invitations page (`/task-invitations`), they encountered a runtime error:
```
TypeError: amount.toFixed is not a function
```

This occurred in the `formatBounty` function at line 110 of `TaskInvitationsPage.tsx`.

## Root Cause
The `bountyAmount` field from the API response could be serialized as a string type, even though the TypeScript interface defines it as `number`. When the code tried to call `.toFixed(2)` directly on a string value, it failed.

## Solution
Updated the `formatBounty` function to ensure type safety:

```typescript
// Before
const formatBounty = (amount: number) => {
  return `¥${amount.toFixed(2)}`;
};

// After
const formatBounty = (amount: number) => {
  return `¥${Number(amount || 0).toFixed(2)}`;
};
```

This change:
- Converts the value to a number using `Number()`
- Provides a fallback value of `0` if the amount is null/undefined
- Ensures `.toFixed(2)` is always called on a valid number

## Consistency
This pattern is already used throughout the codebase:
- `BrowseTasksPage.tsx`: `Number(task.bountyAmount || 0).toFixed(2)`
- `DashboardPage.tsx`: `safeNumber(task.bountyAmount).toFixed(2)`
- `TaskManagementPage.tsx`: `Number(taskDrawer.data.bountyAmount || 0).toFixed(2)`

## Files Modified
- `packages/frontend/src/pages/TaskInvitationsPage.tsx`

## Testing
- ✅ TypeScript compilation passes with no diagnostics
- ✅ Pattern matches existing codebase conventions
- ✅ Handles edge cases (null, undefined, string values)

## Status
**COMPLETED** - The fix has been applied and verified.
