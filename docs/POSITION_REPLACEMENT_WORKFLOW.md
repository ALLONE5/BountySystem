# Position Replacement Workflow Implementation

## Overview
Implemented a position replacement workflow that allows users to select multiple positions (up to 3) and replace their current positions with the new selection. The system handles the replacement atomically during admin approval to avoid position limit violations.

## Implementation Date
January 30, 2026

## Problem Solved
Previously, when users tried to change positions, the system would attempt to add new positions before removing old ones, causing a "User cannot have more than 3 positions" error when the user already had 3 positions.

## Solution Architecture

### Frontend (ProfilePage.tsx)
- Changed position selection from single to multiple (`mode="multiple"`, `maxCount={3}`)
- Pre-populates the Select dropdown with user's current positions when modal opens
- Calculates `positionsToRemove` and `positionsToAdd` arrays based on selection changes
- Calls `positionApi.requestPositionReplacement()` with both arrays

### Backend (PositionService.ts)

#### `requestPositionReplacement()` Method
- Validates that final position count doesn't exceed 3
- Validates that at least one position remains after replacement
- Stores replacement metadata in JSON format in the application's `reason` field:
  ```json
  {
    "type": "replacement",
    "positionsToRemove": ["pos-id-1", "pos-id-2"],
    "positionsToRemoveNames": ["Position 1", "Position 2"],
    "oldPositions": "Position 1, Position 2",
    "newPosition": "Position 3"
  }
  ```
- Creates position applications for each new position with this metadata

#### `reviewApplication()` Method
- Parses the `reason` field to detect replacement applications
- When approved:
  1. **FIRST**: Removes old positions from `user_positions` table
  2. **THEN**: Adds the new position
- This order prevents the "User cannot have more than 3 positions" error
- Uses database transaction to ensure atomicity

### API Endpoint
- Route: `POST /positions/applications/replacement`
- Request body:
  ```json
  {
    "positionsToRemove": ["pos-id-1", "pos-id-2"],
    "positionsToAdd": ["pos-id-3", "pos-id-4"]
  }
  ```
- Response: Array of created position applications

## User Flow

1. **User initiates change**:
   - Clicks "申请岗位变更" button in ProfilePage
   - Modal opens with Select dropdown pre-populated with current positions
   - User can add/remove positions (max 3 total)

2. **User submits request**:
   - Frontend calculates which positions to remove and which to add
   - Calls replacement API endpoint
   - Success message shows: "岗位变更申请已提交，申请新增 X 个岗位，移除 Y 个岗位。等待管理员审核，审核通过后将按新选择的岗位更新。"

3. **Admin reviews**:
   - Admin sees position applications in review queue
   - Application reason field contains replacement metadata (JSON format)
   - Admin approves or rejects the application

4. **System processes approval**:
   - Parses replacement metadata from reason field
   - Removes old positions first (within transaction)
   - Adds new position second (within transaction)
   - Sends notification to user about approval/rejection

## Key Features

### Validation
- Maximum 3 positions enforced at multiple levels:
  - Frontend: `maxCount={3}` on Select component
  - Backend: Validation in `requestPositionReplacement()`
  - Database: Trigger on `user_positions` table
- Minimum 1 position required (cannot remove all positions)
- Prevents duplicate position applications

### Atomic Operations
- Uses database transactions to ensure all-or-nothing behavior
- Removes old positions before adding new ones to avoid limit violations
- Rollback on any error during the process

### User Experience
- Pre-populated dropdown shows current positions
- Clear success messages indicate what will happen
- Supports adding, removing, or replacing positions in one operation
- Admin sees clear indication that it's a replacement request

## Files Modified

### Frontend
- `packages/frontend/src/pages/ProfilePage.tsx`
  - Changed `selectedPosition` to `selectedPositions` (array)
  - Added multiple selection support
  - Implemented position change calculation logic
  - Updated modal UI and messaging

### Backend
- `packages/backend/src/services/PositionService.ts`
  - Added `requestPositionReplacement()` method
  - Modified `reviewApplication()` to handle replacement logic
  - Added JSON parsing for replacement metadata
  - Implemented remove-then-add order

### API
- `packages/frontend/src/api/position.ts`
  - Added `requestPositionReplacement` method definition
- `packages/backend/src/routes/position.routes.ts`
  - Route already existed: `POST /positions/applications/replacement`

## Testing Recommendations

1. **Test replacement with 3 existing positions**:
   - User has 3 positions
   - User selects 3 different positions
   - Admin approves
   - Verify old positions removed and new ones added

2. **Test partial replacement**:
   - User has 3 positions
   - User keeps 1, removes 2, adds 2 new ones
   - Verify correct positions remain

3. **Test validation**:
   - Try to select more than 3 positions (should be blocked by UI)
   - Try to remove all positions (should show error)
   - Try to apply for position user already has (should skip)

4. **Test edge cases**:
   - User has pending replacement applications
   - Admin rejects replacement application
   - Multiple replacement applications for same user

## Future Improvements

1. **Admin UI Enhancement**:
   - Display replacement applications differently in admin panel
   - Show "旧岗位 → 新岗位" format for better clarity
   - Add one-click approval for replacement batches

2. **Batch Approval**:
   - Allow admin to approve all position changes for a user at once
   - Currently each position application is separate

3. **Application History**:
   - Show user's position change history
   - Track why positions were changed

4. **Notification Enhancement**:
   - Send detailed notification showing old vs new positions
   - Notify when all replacement applications are processed

## Related Documentation
- Position System: `packages/backend/src/models/Position.ts`
- User Positions: Database table `user_positions`
- Position Applications: Database table `position_applications`
