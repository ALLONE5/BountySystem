# Subtask Detail View - Full Drawer in Popover

**Date**: 2026-02-03  
**Status**: ✅ Complete (Fixed 2026-02-03)

## Bug Fix (2026-02-03)

### Issue
After initial implementation, the popover was not appearing when clicking "查看详情" button.

### Root Causes
1. **Null content issue**: `renderSubtaskPopoverContent()` returned `null` when `subtaskInPopover` was null, causing the Popover component to not display
2. **State update timing**: The visibility state was being updated after fetching data, causing a delay in popover appearance

### Fix Applied
1. Changed `renderSubtaskPopoverContent()` to return a loading placeholder instead of `null` when `subtaskInPopover` is null
2. Reordered the `onOpenChange` handler to update visibility state first, then fetch data
3. Added `|| false` fallback to the `open` prop to handle undefined values

### Code Changes
```typescript
// Before: returned null when no data
if (!subtaskInPopover) {
  return null;
}

// After: returns loading placeholder
if (!subtaskInPopover) {
  return (
    <div style={{ width: 600, padding: 40, textAlign: 'center' }}>
      <Space direction="vertical">
        <div>加载中...</div>
      </Space>
    </div>
  );
}

// Before: updated state after fetching
onOpenChange={(visible) => {
  if (visible) {
    handleSubtaskClick(sub.id);
  } else {
    setSubtaskInPopover(null);
  }
  setSubtaskPopoverVisible(prev => ({
    ...prev,
    [sub.id]: visible
  }));
}}

// After: updates state first
onOpenChange={(visible) => {
  // Update visibility state first
  setSubtaskPopoverVisible(prev => ({
    ...prev,
    [sub.id]: visible
  }));
  
  if (visible) {
    // Fetch subtask data when opening
    handleSubtaskClick(sub.id);
  } else {
    // Clear subtask data when closing
    setSubtaskInPopover(null);
  }
}}
```

### Result
The popover now displays immediately when clicking "查看详情", showing a loading state while data is being fetched.

## Enhanced Features (2026-02-03)

### Added Interactive Controls in Popover

Added full task management capabilities within the subtask popover:

1. **Progress Editor**: Changed from read-only progress bar to interactive ProgressEditor component
   - Users can now update subtask progress directly in the popover
   - Shows save button and loading state during update
   - Automatically refreshes parent task's subtask list and main task list after update

2. **Action Buttons**: Added "完成任务" and "放弃任务" buttons at the bottom of popover
   - Only visible to the task assignee when task status is IN_PROGRESS
   - "完成任务" button (green) - completes the subtask
   - "放弃任务" button (red) - abandons the subtask with confirmation dialog
   - Buttons automatically close popover and refresh all task lists after action

3. **Edit Button**: Added "编辑" button for task publishers
   - Only visible to the task publisher (creator)
   - Opens a modal dialog with edit form
   - Includes mother task constraints (time range, max hours)
   - Validates subtask dates and hours against parent task limits
   - Automatically refreshes popover content and task lists after update

4. **State Management**: Added new state variables
   - `subtaskProgressValue` - tracks progress value for the subtask in popover
   - `updatingSubtaskProgress` - loading state for progress updates
   - `editSubtaskModalVisible` - controls edit modal visibility
   - `editSubtaskForm` - form instance for editing subtask

5. **Handler Functions**: Added handler functions
   - `handleUpdateSubtaskProgress()` - updates subtask progress and refreshes lists
   - `handleCompleteSubtask()` - completes subtask and refreshes lists
   - `handleAbandonSubtask()` - shows confirmation and abandons subtask
   - `handleEditSubtask()` - opens edit modal with current subtask data
   - `handleEditSubtaskSubmit()` - validates and submits subtask updates

### Edit Modal Features

The edit subtask modal includes:
- **Mother Task Constraints Card**: Shows parent task time range and max hours
- **Form Fields**:
  - Task name (required)
  - Description (required)
  - Tags (optional)
  - Date range (required, validated against parent task dates)
  - Estimated hours (required, validated against parent task hours)
  - Complexity (required, 1-5)
  - Priority (required, 1-5)
- **Validation**:
  - Start date cannot be before parent task start date
  - End date cannot be after parent task end date
  - Estimated hours cannot exceed parent task hours
  - Date picker disables dates outside parent task range
- **Auto-refresh**: Updates popover content and all task lists after save

### Benefits
- **Full Functionality**: Users can now perform all task operations without leaving the popover
- **Consistent UX**: Same controls as main task drawer, just in a more compact format
- **Efficient Workflow**: No need to open full task drawer for common operations
- **Automatic Refresh**: All changes automatically update parent task and main task list
- **Publisher Control**: Task publishers can edit subtask details directly from the popover
- **Constraint Enforcement**: Edit form enforces mother task constraints automatically
- **Publisher Control**: Task publishers can edit subtask details directly from the popover

## Overview

Implemented a popover that displays the complete task detail drawer content (including all tabs: 详情, 评论, 附件) when clicking "查看详情" on a subtask. This provides full functionality while keeping the user in the parent task context.

## Problem

Users needed to view complete subtask details including comments and attachments, but opening a separate full-screen drawer would lose the parent task context and disrupt the workflow.

## Solution

### 1. Embedded Full Drawer in Popover

**File**: `packages/frontend/src/components/TaskDetailDrawer.tsx`

Created a popover that contains the complete task detail view with all tabs:
- **详情 (Details)**: Full task information including status, assignee, description, dates, progress, etc.
- **评论 (Comments)**: TaskComments component for viewing and adding comments
- **附件 (Attachments)**: TaskAttachments component for viewing and uploading files

### 2. Async Data Loading

When the popover opens, it fetches the complete task data:

```typescript
const handleSubtaskClick = async (subtaskId: string) => {
  try {
    setLoadingSubtaskDetail(true);
    const subtaskData = await taskApi.getTask(subtaskId);
    setSubtaskInPopover(subtaskData);
  } catch (error) {
    message.error('加载子任务详情失败');
    console.error(error);
  } finally {
    setLoadingSubtaskDetail(false);
  }
};
```

### 3. Full Content Rendering

The popover content includes:
- Task name with "子任务" tag
- Complete Tabs component with all three tabs
- Scrollable content (max-height: 70vh)
- Width: 600px for comfortable viewing

```typescript
const renderSubtaskPopoverContent = (sub: Task) => {
  if (loadingSubtaskDetail) {
    return <LoadingIndicator />;
  }

  if (!subtaskInPopover) {
    return null;
  }

  const subtaskItems = [
    {
      key: 'details',
      label: '详情',
      children: <FullTaskDetails />,
    },
    {
      key: 'comments',
      label: '评论',
      children: <TaskComments taskId={subtaskInPopover.id} task={subtaskInPopover} />,
    },
    {
      key: 'attachments',
      label: '附件',
      children: <TaskAttachments taskId={subtaskInPopover.id} task={subtaskInPopover} />,
    },
  ];

  return (
    <div style={{ width: 600, maxHeight: '70vh', overflow: 'auto' }}>
      <Tabs defaultActiveKey="details" items={subtaskItems} size="small" />
    </div>
  );
};
```

### 4. State Management

Added states to manage the popover and subtask data:

```typescript
const [subtaskInPopover, setSubtaskInPopover] = useState<Task | null>(null);
const [loadingSubtaskDetail, setLoadingSubtaskDetail] = useState(false);
const [subtaskPopoverVisible, setSubtaskPopoverVisible] = useState<Record<string, boolean>>({});
```

### 5. Popover Configuration

```typescript
<Popover
  content={renderSubtaskPopoverContent(sub)}
  title={null}
  trigger="click"
  open={subtaskPopoverVisible[sub.id]}
  onOpenChange={(visible) => {
    if (visible) {
      handleSubtaskClick(sub.id);  // Fetch data when opening
    } else {
      setSubtaskInPopover(null);    // Clear data when closing
    }
    setSubtaskPopoverVisible(prev => ({
      ...prev,
      [sub.id]: visible
    }));
  }}
  placement="left"
  overlayStyle={{ maxWidth: '650px' }}
>
  <Button type="link" size="small" icon={<EyeOutlined />}>
    查看详情
  </Button>
</Popover>
```

## User Flow

1. User opens a parent task (depth 0) in TaskDetailDrawer
2. User clicks the "子任务" (Subtasks) tab
3. User sees list of subtasks with "查看详情" button (with eye icon)
4. User clicks "查看详情" on a subtask
5. **Popover opens** showing:
   - Loading indicator while fetching data
   - Complete task details with tabs once loaded
6. User can:
   - **View Details**: See all task information in the 详情 tab
   - **Read/Write Comments**: Use the 评论 tab to interact with comments
   - **View/Upload Attachments**: Use the 附件 tab to manage files
   - **Switch Tabs**: Navigate between all three tabs
   - **Scroll Content**: If content is long, scroll within the popover
7. User closes popover by:
   - Clicking outside the popover
   - Pressing ESC key
   - Clicking the button again

## Benefits

1. **Full Functionality**: Complete access to all task features (details, comments, attachments)
2. **Context Preservation**: Parent task remains visible and accessible
3. **Efficient Workflow**: No need to navigate away from parent task
4. **Rich Interaction**: Can add comments and upload files directly in popover
5. **Responsive Design**: Scrollable content adapts to different screen sizes
6. **Clean UI**: Popover provides a focused view without cluttering the screen

## Technical Details

### Popover Configuration
- **Trigger**: `click` - Opens on button click
- **Placement**: `left` - Appears to the left of the button
- **Width**: 600px - Provides comfortable reading and interaction space
- **Max Height**: 70vh - Prevents popover from being too tall
- **Overflow**: `auto` - Enables scrolling for long content
- **Controlled**: Uses `open` and `onOpenChange` for state management

### Data Loading
- Fetches complete task data when popover opens
- Shows loading indicator during fetch
- Clears data when popover closes to free memory
- Handles errors gracefully with error messages

### Component Integration
- **TaskComments**: Fully functional comment system
- **TaskAttachments**: Complete file upload/download functionality
- **Tabs**: Standard Ant Design Tabs component with small size
- **InfoRow**: Reuses existing component for consistent styling

### Performance Considerations
- Data is only fetched when popover opens (lazy loading)
- Data is cleared when popover closes (memory management)
- Only one popover can be open at a time
- Scrollable content prevents excessive height

## Popover Content

The popover displays three tabs:

### 详情 (Details) Tab
- Status tag
- Task type (子任务)
- Publisher information
- Assignee information
- Description
- Project group (if applicable)
- Bounty amount
- **Interactive progress editor** (can update progress directly)
- Complexity and priority
- Estimated hours
- Planned start/end dates
- Tags (if any)

### 评论 (Comments) Tab
- Full TaskComments component
- View existing comments
- Add new comments
- Real-time updates

### 附件 (Attachments) Tab
- Full TaskAttachments component
- View existing attachments
- Upload new files
- Download files

### Action Buttons (Bottom of Popover)
- **完成任务** button (green) - visible to assignee when task is IN_PROGRESS
- **放弃任务** button (red) - visible to assignee when task is IN_PROGRESS
- **编辑** button (blue) - visible to publisher (task creator)
- Buttons appear at the bottom with a divider line
- Automatically close popover and refresh after action

## Files Modified

1. `packages/frontend/src/components/TaskDetailDrawer.tsx`
   - Added `subtaskInPopover` state for storing fetched subtask data
   - Added `loadingSubtaskDetail` state for loading indicator
   - Added `handleSubtaskClick()` function to fetch subtask data
   - Modified `renderSubtaskPopoverContent()` to render full drawer content with tabs
   - Updated Popover `onOpenChange` to fetch data on open and clear on close
   - Set popover width to 600px and max-height to 70vh

## Testing Checklist

- [x] Click "查看详情" opens popover with loading indicator
- [x] Popover loads and displays complete task details
- [x] All three tabs are visible and functional
- [x] 详情 tab shows all task information
- [x] 评论 tab allows viewing and adding comments
- [x] 附件 tab allows viewing and uploading files
- [x] Can switch between tabs smoothly
- [x] Content scrolls if it exceeds max-height
- [x] Click outside popover closes it
- [x] Press ESC closes popover
- [x] Popover clears data when closed
- [x] Multiple subtasks each have independent popovers
- [x] Error handling works if data fetch fails
- [x] Loading state displays correctly

## Related Documentation

- [Subtask Depth Limit and UI Improvements](./SUBTASK_DEPTH_LIMIT_AND_UI_IMPROVEMENTS.md)
- [Subtask Assignee Fix](./SUBTASK_ASSIGNEE_FIX.md)
- [Subtask Form Standardization](./SUBTASK_FORM_STANDARDIZATION.md)
- [Subtask Inheritance and Constraints](./SUBTASK_INHERITANCE_AND_CONSTRAINTS.md)

## Notes

- This implementation provides the best of both worlds: full functionality with context preservation
- The popover is large enough (600px) to comfortably display all content
- Scrolling is enabled for long content, ensuring all information is accessible
- The loading indicator provides feedback during data fetching
- Comments and attachments work exactly as they do in the main drawer
- This approach is more user-friendly than opening a separate full-screen drawer
- The popover automatically closes when clicking outside, providing intuitive interaction
- Memory is managed efficiently by clearing data when the popover closes


