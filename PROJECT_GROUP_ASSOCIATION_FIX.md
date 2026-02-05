# 项目组关联功能修复

## 问题描述
在"我的悬赏"界面中为任务选择所属项目后，任务并未实际关联到所属项目。

## 根本原因
后端 `TaskService.updateTask()` 方法中没有处理 `projectGroupId` 字段。虽然前端正确地将 `projectGroupId` 包含在更新请求中，但后端在更新任务时忽略了这个字段。

## 修复内容

### 1. 更新 TaskUpdateDTO 接口
**文件**: `packages/backend/src/models/Task.ts`

在 `TaskUpdateDTO` 接口中添加了 `projectGroupId` 字段：

```typescript
export interface TaskUpdateDTO {
  // ... 其他字段
  positionId?: string;
  projectGroupId?: string | null;  // 新增
  visibility?: Visibility;
  // ... 其他字段
}
```

### 2. 更新 TaskService.updateTask() 方法
**文件**: `packages/backend/src/services/TaskService.ts`

#### 2.1 添加 projectGroupId 字段处理
在 `positionId` 和 `visibility` 之间添加了 `projectGroupId` 的处理逻辑：

```typescript
if (updates.positionId !== undefined) {
  fields.push(`position_id = $${paramCount++}`);
  values.push(updates.positionId);
}

// 新增：处理 projectGroupId
if (updates.projectGroupId !== undefined) {
  fields.push(`project_group_id = $${paramCount++}`);
  values.push(updates.projectGroupId);
}

if (updates.visibility !== undefined) {
  fields.push(`visibility = $${paramCount++}`);
  values.push(updates.visibility);
}
```

#### 2.2 更新 RETURNING 子句
在 SQL 查询的 RETURNING 子句中添加了 `project_group_id` 字段：

```typescript
RETURNING 
  // ... 其他字段
  complexity, priority, status, position_id as "positionId", 
  project_group_id as "projectGroupId",  // 新增
  visibility,
  // ... 其他字段
```

## 验证步骤

1. 启动后端服务
2. 登录到"我的悬赏"页面
3. 编辑一个任务
4. 在"项目分组"下拉框中选择一个项目组
5. 保存任务
6. 刷新页面或查看任务详情，确认项目组已正确关联

## 相关文件
- `packages/backend/src/models/Task.ts` - Task 模型定义
- `packages/backend/src/services/TaskService.ts` - Task 服务实现
- `packages/frontend/src/pages/PublishedTasksPage.tsx` - 前端发布任务页面

## 技术细节
- 使用参数化查询防止 SQL 注入
- 支持将 `projectGroupId` 设置为 `null` 以移除项目组关联
- 更新操作会自动更新 `updated_at` 时间戳
- 返回完整的更新后任务对象，包括新的 `projectGroupId` 字段

## 状态
✅ 已完成并验证


## 后续修复：项目组显示问题

### 问题描述
任务已经成功关联到项目组，但在"我的悬赏"页面中仍然显示在"无项目组"分组中。

### 根本原因
后端 `TaskService.getTasksByUser()` 方法的 SQL 查询中，`project_groups` 表的 `name` 字段使用了错误的别名：
- 使用的别名：`pg.name as project_group_name`（snake_case）
- 前端期望的字段名：`projectGroupName`（camelCase）

由于字段名不匹配，前端无法正确读取项目组名称，导致所有任务都被分组到"无项目组"中。

### 修复内容
**文件**: `packages/backend/src/services/TaskService.ts`

将 SQL 查询中的别名从 `project_group_name` 改为 `"projectGroupName"`（使用双引号保持 camelCase）：

```typescript
// 修复前
pg.name as project_group_name

// 修复后
pg.name as "projectGroupName"
```

### 影响范围
- ✅ "我的悬赏"页面的项目组分组显示
- ✅ 所有使用 `getTasksByUser()` 方法的地方
- ✅ 前端的 TaskListPage、KanbanPage、GanttChartPage、CalendarPage 等组件

### 验证步骤
1. 重启后端服务
2. 刷新"我的悬赏"页面
3. 确认任务正确显示在对应的项目组分组中
4. 确认"无项目组"分组只包含未关联项目组的任务

## 状态
✅ 已完成并验证

## 实现日期
2026-02-05
