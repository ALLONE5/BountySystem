# Task List Project Grouping Feature Fix

**Date**: 2026-01-30  
**Status**: ✅ Completed

## Problem

User reported that the project group collapsible feature was not visible in the list view tab when accessing through "我的任务" (My Tasks) page.

### Root Cause Analysis

The issue was caused by a misunderstanding of the component hierarchy:

**Expected Structure** (incorrect assumption):
```
AssignedTasksPage → TaskViews → TaskListPage
```

**Actual Structure**:
```
AssignedTasksPage → TaskViews → inline Table component
```

The `TaskListPage` component (which had the project grouping feature) was only used in `TaskVisualizationPage`, NOT in the `AssignedTasksPage → TaskViews` flow. The `listView` prop passed to `TaskViews` was just a simple inline `<Table>` component without any grouping functionality.

## Solution

Updated both `AssignedTasksPage` and `PublishedTasksPage` to use the `TaskListPage` component instead of inline Table components for the `listView` prop in `TaskViews`.

### Changes Made

#### 1. AssignedTasksPage.tsx
- Added import: `import { TaskListPage } from './TaskListPage';`
- Changed `listView` prop from inline Table to:
  ```tsx
  <TaskListPage tasks={tasks} loading={loading} hideFilters={true} />
  ```

#### 2. PublishedTasksPage.tsx
- Added import: `import { TaskListPage } from './TaskListPage';`
- Changed `listView` prop from inline Table to:
  ```tsx
  <TaskListPage tasks={tasks} loading={loading} hideFilters={true} />
  ```

#### 3. TaskListPage.tsx
- Fixed `getProjectStats` to properly handle `bountyAmount` as number:
  ```tsx
  const totalBounty = tasks.reduce((sum, t) => sum + (Number(t.bountyAmount) || 0), 0);
  ```

#### 4. KanbanPage.tsx (NEW)
- Added project group grouping functionality to Kanban view
- Added imports: `Switch`, `Collapse`, `FolderOutlined`
- Added state: `groupByProject`, `expandedProjects`
- Added functions: `groupTasksByProject()`, `getProjectStats()`, `renderKanbanBoard()`
- Added conditional rendering based on `hideFilters` prop
- When `hideFilters=false`: Full page with title and controls (standalone page)
- When `hideFilters=true`: Control bar + kanban board (embedded in tabs)
- Each project group displayed as collapsible panel with statistics
- Drag-and-drop functionality preserved within each project group

## Features Now Available

### List View Tab
When users click the "列表" (List) tab in either "我的任务" or "我的悬赏" pages, they now have access to:

1. **Project Group Grouping Toggle**: Switch to enable/disable grouping by project
2. **Collapsible Panels**: Each project group displayed as a collapsible panel with:
   - Project name with folder icon (purple)
   - Task count badge
   - Statistics: tasks in progress, completed tasks, total bounty
3. **Automatic Expansion**: All project groups expanded by default when grouping is enabled
4. **Search and Filters**: Search by task name/description, filter by status
5. **Full Table Features**: All columns, sorting, and row click to view details

### Kanban View Tab (NEW)
When users click the "看板" (Kanban) tab, they now have access to:

1. **Project Group Grouping Toggle**: Switch to enable/disable grouping by project
2. **Collapsible Panels**: Each project group displayed as a collapsible panel with:
   - Project name with folder icon (purple)
   - Task count badge
   - Statistics: tasks in progress, completed tasks, total bounty
3. **Automatic Expansion**: All project groups expanded by default when grouping is enabled
4. **Drag-and-Drop**: Full drag-and-drop functionality preserved within each project group
5. **Status Columns**: Tasks organized by status (未开始, 可承接, 进行中, 已完成, 已放弃)
6. **Visual Feedback**: Hover effects, drag indicators, and smooth transitions

## Component Hierarchy (Corrected)

### My Tasks Page (我的任务)
```
AssignedTasksPage
├── Statistics Cards
├── Group By Selector (page-level, for table view)
└── TaskViews (when groupBy === 'none')
    ├── Tab: 列表 → TaskListPage (with hideFilters={true})
    ├── Tab: 甘特图 → GanttChartPage (with hideFilters={true})
    ├── Tab: 看板 → KanbanPage (with hideFilters={true}) ✨ NEW GROUPING
    └── Tab: 日历 → CalendarPage (with hideFilters={true})
```

### My Bounties Page (我的悬赏)
```
PublishedTasksPage
├── Statistics Cards
├── Group By Selector (page-level, for table view)
└── TaskViews (when groupBy === 'none')
    ├── Tab: 列表 → TaskListPage (with hideFilters={true})
    ├── Tab: 甘特图 → GanttChartPage (with hideFilters={true})
    ├── Tab: 看板 → KanbanPage (with hideFilters={true}) ✨ NEW GROUPING
    └── Tab: 日历 → CalendarPage (with hideFilters={true})
```

## Testing

To verify the fix:

1. Navigate to "我的任务" (My Tasks) page
2. Ensure "不分组" is selected in the page-level dropdown
3. Click the "看板" (Kanban) tab
4. Look for the "按项目组分组" switch in the control bar above the kanban board
5. Toggle the switch to enable project grouping
6. Verify that tasks are grouped by project with collapsible panels
7. Test drag-and-drop functionality within each project group
8. Repeat for "我的悬赏" (My Bounties) page

## Related Files

- `packages/frontend/src/pages/AssignedTasksPage.tsx`
- `packages/frontend/src/pages/PublishedTasksPage.tsx`
- `packages/frontend/src/pages/TaskListPage.tsx`
- `packages/frontend/src/pages/KanbanPage.tsx` ✨ NEW
- `packages/frontend/src/components/TaskViews.tsx`

## Previous Documentation

- `docs/PROJECT_GROUP_COLLAPSIBLE_VIEWS_IMPLEMENTATION.md` - Initial implementation
- `docs/PROJECT_GROUP_COLLAPSIBLE_VIEWS_STATUS.md` - Status tracking
- `docs/PROJECT_GROUP_GANTT_CALENDAR_OPTIMIZATION.md` - Gantt and Calendar optimizations
