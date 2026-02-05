# Position Removal-Only Application Fix

## Overview
Fixed the issue where users could not remove positions without adding new ones. The system now supports "removal-only" position change requests.

## Implementation Date
January 30, 2026

## Problem Description
When a user tried to remove positions without selecting any new positions to add, the system showed an error: "At least one position to add is required". This prevented users from simply reducing their number of positions.

## Root Cause
The backend route validation required `positionsToAdd.length > 0`, which blocked removal-only operations.

## Solution

### 1. Backend Route Validation Update
**File**: `packages/backend/src/routes/position.routes.ts`

**Before**:
```typescript
if (positionsToAdd.length === 0) {
  return res.status(400).json({ 
    error: 'At least one position to add is required' 
  });
}
```

**After**:
```typescript
// Allow removal-only operations (no new positions to add)
if (positionsToRemove.length === 0 && positionsToAdd.length === 0) {
  return res.status(400).json({ 
    error: 'At least one position change is required' 
  });
}
```

### 2. PositionService Enhancement
**File**: `packages/backend/src/services/PositionService.ts`

#### requestPositionReplacement() Method
Added logic to handle removal-only requests:

```typescript
// If only removing positions (no new positions to add), create a special removal application
if (positionsToAdd.length === 0 && positionsToRemove.length > 0) {
  // Create a removal-only application using one of the remaining positions as the "target"
  const remainingPositionId = remainingPositions[0];
  const remainingPosition = currentPositions.find((p: any) => p.id === remainingPositionId);
  
  const replacementData = {
    type: 'removal-only',
    positionsToRemove,
    positionsToRemoveNames,
    oldPositions: positionsToRemoveNames.join(', '),
    remainingPosition: remainingPosition.name,
  };
  
  // Create application record
  // Notify admins
  return applications;
}
```

#### reviewApplication() Method
Updated to handle "removal-only" applications:

```typescript
try {
  const reasonData = JSON.parse(application.reason);
  if (reasonData.type === 'replacement' && Array.isArray(reasonData.positionsToRemove)) {
    isReplacement = true;
    positionsToRemove = reasonData.positionsToRemove;
  } else if (reasonData.type === 'removal-only' && Array.isArray(reasonData.positionsToRemove)) {
    isRemovalOnly = true;
    positionsToRemove = reasonData.positionsToRemove;
  }
} catch (e) {
  // Not a JSON reason, treat as regular application
}

// Remove old positions for both replacement and removal-only
if ((isReplacement || isRemovalOnly) && positionsToRemove.length > 0) {
  // Remove positions
}

// For removal-only applications, we don't grant a new position
if (!isRemovalOnly) {
  // Grant new position
}
```

### 3. Admin UI Update
**File**: `packages/frontend/src/pages/admin/ApplicationReviewPage.tsx`

Updated `formatReason()` to display removal-only applications:

```typescript
const formatReason = (reason: string | null | undefined): string => {
  if (!reason) return '无';
  
  try {
    const parsed = JSON.parse(reason);
    if (parsed.type === 'replacement') {
      const oldPositions = parsed.oldPositions || '无';
      const newPosition = parsed.newPosition || '未知岗位';
      return `岗位变更申请：${oldPositions} → ${newPosition}`;
    } else if (parsed.type === 'removal-only') {
      const oldPositions = parsed.oldPositions || '无';
      const remainingPosition = parsed.remainingPosition || '未知岗位';
      return `岗位移除申请：移除 ${oldPositions}，保留 ${remainingPosition}`;
    }
  } catch (e) {
    // Not JSON, return as-is
  }
  
  return reason;
};
```

## Application Types

### 1. Regular Application
- User applies for a new position
- No positions removed
- **Reason format**: Plain text or no JSON

### 2. Replacement Application
- User removes some positions and adds new ones
- **Reason format**:
  ```json
  {
    "type": "replacement",
    "positionsToRemove": ["pos-id-1"],
    "positionsToRemoveNames": ["Position 1"],
    "oldPositions": "Position 1",
    "newPosition": "Position 2"
  }
  ```
- **Admin display**: "岗位变更申请：Position 1 → Position 2"

### 3. Removal-Only Application (NEW)
- User only removes positions, no new positions added
- **Reason format**:
  ```json
  {
    "type": "removal-only",
    "positionsToRemove": ["pos-id-1", "pos-id-2"],
    "positionsToRemoveNames": ["Position 1", "Position 2"],
    "oldPositions": "Position 1, Position 2",
    "remainingPosition": "Position 3"
  }
  ```
- **Admin display**: "岗位移除申请：移除 Position 1, Position 2，保留 Position 3"

## Validation Rules

### Frontend Validation
- At least one position must remain after removal
- Cannot remove all positions
- Maximum 3 positions total

### Backend Validation
- `positionsToRemove` and `positionsToAdd` must be arrays
- At least one change required (either add or remove)
- Final position count must be between 1 and 3
- Cannot remove all positions

## User Flow

### Removal-Only Scenario
1. User has 3 positions: A, B, C
2. User opens position change modal
3. User removes A and B from selection (only C remains)
4. User clicks "提交申请"
5. System creates a "removal-only" application
6. Admin sees: "岗位移除申请：移除 A, B，保留 C"
7. Admin approves
8. System removes positions A and B
9. User now has only position C

## Technical Details

### Application Record
For removal-only applications:
- `position_id`: Set to one of the remaining positions (for record keeping)
- `reason`: JSON string with type "removal-only"
- `status`: "pending" initially

### Approval Process
When admin approves a removal-only application:
1. Parse the reason JSON
2. Identify it as "removal-only" type
3. Remove all positions in `positionsToRemove` array
4. Do NOT grant any new position (skip the INSERT step)
5. Update application status to "approved"

## Testing Recommendations

1. **Test Removal-Only**:
   - User with 3 positions removes 2
   - Verify application created successfully
   - Verify admin sees correct display
   - Verify approval removes correct positions

2. **Test Edge Cases**:
   - Try to remove all positions (should fail)
   - Try to submit with no changes (should fail)
   - Remove 2, add 2 (should work as replacement)

3. **Test Admin Review**:
   - Verify removal-only applications display correctly
   - Verify approval works correctly
   - Verify rejection works correctly

## Files Modified

### Backend
- `packages/backend/src/routes/position.routes.ts`
  - Removed requirement for positionsToAdd.length > 0
  - Added validation for at least one change

- `packages/backend/src/services/PositionService.ts`
  - Added removal-only logic in `requestPositionReplacement()`
  - Updated `reviewApplication()` to handle removal-only type

### Frontend
- `packages/frontend/src/pages/admin/ApplicationReviewPage.tsx`
  - Updated `formatReason()` to display removal-only applications

## Related Documentation
- Position Replacement Workflow: `docs/POSITION_REPLACEMENT_WORKFLOW.md`
- Position Application Review UI: `docs/POSITION_APPLICATION_REVIEW_UI_IMPROVEMENT.md`
