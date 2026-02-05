# Task Edit Form Standardization

## Overview
Updated the task edit form in `TaskDetailDrawer` component to match the create task form layout in `PublishedTasksPage`, ensuring consistency across the application. Added support for editing task visibility and position restrictions.

## Changes Made

### 1. Form Layout Standardization

**Before:**
- Used separate `DatePicker` components for start and end dates
- Used `Space` component to group estimatedHours/complexity/priority in one row
- Tags field at the bottom
- No placeholders on some fields
- Missing visibility and positionId fields

**After:**
- Uses `RangePicker` for date range (计划时间) - matches create task form
- All fields are full-width (no Space grouping)
- Field order matches create task form exactly:
  1. 任务名称 (name)
  2. 任务描述 (description)
  3. 标签 (tags)
  4. 计划时间 (dateRange - RangePicker)
  5. 预估工时 (estimatedHours)
  6. 复杂度 (complexity)
  7. 优先级 (priority)
  8. 可见性 (visibility) - **NEW**
  9. 岗位限制 (positionId) - **NEW** (conditional based on visibility)

### 2. New Features Added

#### Visibility Editing
- Added `visibility` field with three options:
  - 公开 (PUBLIC)
  - 仅特定岗位 (POSITION_ONLY)
  - 私有 (PRIVATE)
- Required field with validation

#### Position Restriction Editing
- Added `positionId` field for position-based task restrictions
- Conditionally displayed based on visibility selection
- Required when visibility is set to "仅特定岗位"
- Includes tooltip explaining the position restriction behavior
- Loads available positions from API on component mount

### 3. Handler Updates

#### `handleEditTask()`
- Changed from setting `plannedStartDate` and `plannedEndDate` separately
- Now sets `dateRange` as an array: `[dayjs(startDate), dayjs(endDate)]`
- Added `visibility` and `positionId` to form initial values

```typescript
editForm.setFieldsValue({
  name: task.name,
  description: task.description,
  tags: task.tags,
  dateRange: task.plannedStartDate && task.plannedEndDate 
    ? [dayjs(task.plannedStartDate), dayjs(task.plannedEndDate)] 
    : null,
  estimatedHours: task.estimatedHours,
  complexity: task.complexity,
  priority: task.priority,
  visibility: task.visibility,
  positionId: task.positionId,
});
```

#### `handleEditSubmit()`
- Added logic to extract dates from RangePicker
- Converts `dateRange` array back to separate `plannedStartDate` and `plannedEndDate` for API
- Added `visibility` and `positionId` to update data

```typescript
const updateData: any = {
  name: values.name,
  description: values.description,
  tags: values.tags,
  estimatedHours: values.estimatedHours,
  complexity: values.complexity,
  priority: values.priority,
  visibility: values.visibility,
  positionId: values.positionId || null,
};

if (values.dateRange && values.dateRange.length === 2) {
  updateData.plannedStartDate = values.dateRange[0].toDate();
  updateData.plannedEndDate = values.dateRange[1].toDate();
}
```

### 4. New Imports and State

#### Added Imports
- `Visibility` enum from types
- `positionApi` for fetching available positions

#### New State
- `positions` state to store available positions for the dropdown
- Loads positions on component mount via `useEffect`

### 5. Removed Features
- Removed `Space` component grouping for three fields in one row
- Removed individual placeholders (using default Ant Design placeholders)

## Benefits

1. **Consistency**: Edit form now matches create task form exactly
2. **Feature Parity**: Users can now edit visibility and position restrictions
3. **User Experience**: Users see the same interface whether creating or editing tasks
4. **Maintainability**: Single form pattern to maintain across the application
5. **Simplicity**: Cleaner layout with full-width fields
6. **Flexibility**: Publishers can adjust task visibility and access restrictions after creation

## Files Modified

- `packages/frontend/src/components/TaskDetailDrawer.tsx`
  - Added `Visibility` and `positionApi` imports
  - Added `positions` state and loading logic
  - Updated edit form modal structure with visibility and position fields
  - Modified `handleEditTask()` function to include visibility and positionId
  - Modified `handleEditSubmit()` function to handle visibility and positionId updates

## Testing Recommendations

1. Open a task detail drawer
2. Click "编辑" button
3. Verify form layout matches create task form
4. Edit task fields including date range, visibility, and position
5. Test visibility field:
   - Select "公开" - position field should be optional
   - Select "仅特定岗位" - position field should become required
   - Select "私有" - position field should be optional
6. Submit and verify changes are saved correctly
7. Confirm dates, visibility, and position are properly converted and stored

## Notes

- The subtask creation form remains unchanged as it has different requirements (parent task constraints)
- The form still validates all required fields
- Date conversion logic ensures compatibility with backend API expectations
- Position field is conditionally required based on visibility selection
- Positions are loaded once on component mount and cached for the session
