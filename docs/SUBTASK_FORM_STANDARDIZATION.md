# Subtask Form Standardization

## Overview
Updated the subtask creation form in `TaskDetailDrawer` component to match the top-level task creation form layout, ensuring consistency across all task creation interfaces while maintaining parent task constraints.

## Changes Made

### 1. Form Layout Standardization

**Before:**
- Used separate `DatePicker` components for start and end dates
- Used `Space` component to group estimatedHours and priority in one row
- Missing tags field
- Missing complexity field
- Priority was optional (InputNumber 1-5)
- Description was optional
- Custom submit button inside form

**After:**
- Uses `RangePicker` for date range (计划时间) - matches create task form
- All fields are full-width (no Space grouping)
- Field order matches create task form exactly:
  1. 任务名称 (name)
  2. 任务描述 (description) - now required
  3. 标签 (tags)
  4. 计划时间 (dateRange - RangePicker)
  5. 预估工时 (estimatedHours)
  6. 复杂度 (complexity) - **NEW**
  7. 优先级 (priority) - now uses Select with descriptive options
- Uses Modal's built-in OK button instead of custom submit button

### 2. Parent Task Constraints

The form maintains all parent task constraints while using the new layout:

#### Constraint Info Card
- Displays parent task constraints at the top of the form
- Shows inherited assignee
- Shows allowed time range
- Shows maximum estimated hours

#### Date Range Validation
- Combined validation for both start and end dates in RangePicker
- Prevents selecting dates outside parent task's time range
- `disabledDate` function blocks invalid dates in the picker
- Custom validator provides clear error messages

```typescript
{
  validator: (_, value) => {
    if (!value || value.length !== 2) return Promise.resolve();
    
    const subtaskStart = dayjs(value[0]);
    const subtaskEnd = dayjs(value[1]);
    const parentStart = dayjs(task.plannedStartDate);
    const parentEnd = dayjs(task.plannedEndDate);
    
    if (subtaskStart.isBefore(parentStart)) {
      return Promise.reject(new Error(`开始时间不能早于母任务开始时间 (${parentStart.format('YYYY-MM-DD')})`));
    }
    
    if (subtaskEnd.isAfter(parentEnd)) {
      return Promise.reject(new Error(`结束时间不能晚于母任务结束时间 (${parentEnd.format('YYYY-MM-DD')})`));
    }
    
    return Promise.resolve();
  }
}
```

#### Estimated Hours Validation
- Validates that subtask hours don't exceed parent task hours
- Sets max value on InputNumber component
- Provides clear error message

### 3. New Fields Added

#### Tags Field
- Allows adding multiple tags to subtasks
- Uses Select with `mode="tags"`
- Matches parent task creation form

#### Complexity Field
- Required field with 5 levels
- Uses Select with descriptive options (1 - 非常简单 to 5 - 非常复杂)
- Matches parent task creation form

#### Priority Field Enhancement
- Changed from simple InputNumber to Select with descriptive options
- Now required field
- Options: 1 - 最低, 2 - 低, 3 - 中, 4 - 高, 5 - 最高
- Matches parent task creation form

### 4. Handler Updates

#### `handleCreateSubtask()`
Updated to handle the new form structure:

```typescript
const handleCreateSubtask = async (values: any) => {
  if (!task) return;
  try {
    setCreateSubtaskLoading(true);
    
    // Extract dates from RangePicker
    const subtaskData: any = {
      name: values.name,
      description: values.description,
      tags: values.tags || [],
      estimatedHours: values.estimatedHours,
      complexity: values.complexity,
      priority: values.priority,
      parentId: task.id,
      publisherId: task.publisherId,
    };
    
    // Convert dateRange to separate start and end dates
    if (values.dateRange && values.dateRange.length === 2) {
      subtaskData.plannedStartDate = values.dateRange[0].toDate();
      subtaskData.plannedEndDate = values.dateRange[1].toDate();
    }
    
    await taskApi.createTask(subtaskData);
    message.success('子任务创建成功');
    setCreateSubtaskVisible(false);
    subtaskForm.resetFields();
    
    // Refresh subtasks
    const updatedSubtasks = await taskApi.getSubtasks(task.id);
    setSubtasks(updatedSubtasks);
  } catch (error) {
    console.error('Failed to create subtask:', error);
    message.error('创建子任务失败');
  } finally {
    setCreateSubtaskLoading(false);
  }
};
```

### 5. Modal Improvements

**Before:**
- `footer={null}` with custom submit button inside form
- No built-in cancel/submit buttons

**After:**
- Uses Modal's built-in OK/Cancel buttons
- `onOk={() => subtaskForm.submit()}` triggers form submission
- `onCancel` resets form fields
- Consistent with other modals in the application

## Benefits

1. **Consistency**: Subtask creation form now matches top-level task creation form
2. **Feature Parity**: Subtasks can now have tags and complexity ratings
3. **Better UX**: Users see the same interface for all task creation
4. **Maintainability**: Single form pattern across the application
5. **Validation**: Improved date range validation with RangePicker
6. **Clarity**: Descriptive options for complexity and priority
7. **Safety**: Parent task constraints are still enforced

## Differences from Top-Level Task Form

While the subtask form now matches the top-level task form layout, it maintains these important differences:

1. **Constraint Info Card**: Shows parent task constraints at the top
2. **Date Validation**: Enforces parent task time range constraints
3. **Hours Validation**: Enforces parent task estimated hours limit
4. **No Visibility Field**: Subtasks inherit parent task visibility
5. **No Position Field**: Subtasks inherit parent task position restrictions
6. **Assignee Inheritance**: Subtasks automatically inherit parent's assignee (handled by backend)

## Files Modified

- `packages/frontend/src/components/TaskDetailDrawer.tsx`
  - Updated subtask creation modal structure
  - Changed from separate DatePickers to RangePicker
  - Added tags and complexity fields
  - Enhanced priority field with Select
  - Modified `handleCreateSubtask()` function to handle new form structure
  - Updated modal footer to use built-in buttons

## Testing Recommendations

1. Open a task detail drawer for a task with assignee, dates, and estimated hours
2. Click "创建子任务" button
3. Verify constraint info card shows parent task information
4. Test form fields:
   - Enter task name and description (both required)
   - Add tags
   - Select date range within parent task range
   - Try selecting dates outside parent range (should be disabled/show error)
   - Enter estimated hours less than parent hours
   - Try entering hours exceeding parent hours (should show error)
   - Select complexity level
   - Select priority level
5. Submit form and verify subtask is created with all fields
6. Verify subtask appears in subtasks list
7. Verify subtask inherits parent's assignee

## Backend Compatibility

The form sends data in the same format as before, with these additions:
- `tags`: array of strings
- `complexity`: number (1-5)
- `priority`: number (1-5)
- `plannedStartDate` and `plannedEndDate`: extracted from dateRange

The backend already supports these fields through the `TaskCreateDTO` interface and handles:
- Assignee inheritance
- Time range validation
- Estimated hours validation
- Bounty distribution

## Notes

- The constraint info card is preserved to remind users of parent task limits
- All parent task constraints are still enforced through validation
- The form provides better user feedback with descriptive options
- Date range validation is more intuitive with RangePicker
- The form is now consistent with all other task creation/editing forms in the application
