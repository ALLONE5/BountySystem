# 任务描述字段空值处理修复

## 问题描述

在任务管理页面中，点击"按项目组分类"时页面跳转到 404 错误页面。

### 错误日志
```
TaskListPage.tsx:331 Uncaught TypeError: Cannot read properties of null (reading 'length')
```

### 根本原因
- 后端 Task 模型中 `description` 字段定义为 `string | null`
- 前端 Task 接口中 `description` 字段定义为 `string`（不允许 null）
- 多个组件直接访问 `description.length` 或 `description.toLowerCase()` 而没有进行空值检查
- 当某些任务的 description 为 null 时，导致运行时错误

## 修复内容

### 1. 更新类型定义
**文件**: `packages/frontend/src/types/index.ts`
- 将 Task 接口中的 `description` 字段从 `string` 改为 `string | null`，与后端模型保持一致

### 2. 添加空值检查
修复了以下文件中所有访问 `description` 字段的地方：

#### 列表显示
- `packages/frontend/src/pages/TaskListPage.tsx`
  - 搜索过滤：添加 `task.description &&` 检查
  - 列表渲染：添加 `record.description &&` 检查，显示 "无描述" 作为默认值

- `packages/frontend/src/pages/CalendarPage.tsx`
  - 搜索过滤：添加空值检查

- `packages/frontend/src/pages/KanbanPage.tsx`
  - 搜索过滤：添加空值检查

- `packages/frontend/src/pages/GanttChartPage.tsx`
  - 搜索过滤：添加空值检查

#### 详情显示
- `packages/frontend/src/components/TaskDetailDrawer.tsx`
  - 任务详情：显示 `task.description || '无描述'`
  - 子任务详情：显示 `subtaskInPopover.description || '无描述'`

- `packages/frontend/src/pages/BrowseTasksPage.tsx`
  - 任务卡片：显示 `task.description || '无描述'`
  - 详情模态框：显示 `selectedTask.description || '无描述'`

- `packages/frontend/src/pages/AssignedTasksPage.tsx`
  - 任务列表：显示 `task.description || '无描述'`

- `packages/frontend/src/pages/TaskInvitationsPage.tsx`
  - 邀请列表：显示 `task.description || '无描述'`

## 修复效果

- ✅ 修复了按项目组分类时的 404 错误
- ✅ 所有页面都能正确处理 description 为 null 的情况
- ✅ 统一显示 "无描述" 作为空值的默认文本
- ✅ 类型定义与后端模型保持一致

## 测试建议

1. 创建一个没有描述的任务
2. 在各个视图中查看该任务（列表、看板、甘特图、日历）
3. 点击"按项目组分类"查看任务列表
4. 打开任务详情查看描述字段
5. 在浏览任务页面查看该任务

所有场景都应该正常显示 "无描述" 而不是报错。
