# 可承接任务 is_published 过滤逻辑优化

## 问题描述
用户报告：可承接任务是公开状态，但未在赏金任务界面中显示。

## 根本原因
系统存在逻辑冗余：
- 子任务创建时的可见性默认为 `PRIVATE`
- 子任务发布后可见性变为 `PUBLIC`
- 不需要额外的 `is_published` 字段来判断任务是否应该显示在赏金任务列表中
- 只需要通过 `visibility` 字段来控制即可

## 解决方案

### 1. 移除 is_published 过滤条件
**文件**: `packages/backend/src/services/TaskService.ts`

在 `getAvailableTasks()` 方法中移除了两处 `is_published` 检查：

1. **主查询** (已完成)
   - 移除了 `AND t.is_published = true` 条件
   - 只保留 `visibility` 检查

2. **COUNT 查询** (已完成)
   - 移除了 `AND t.is_published = true` 条件
   - 确保分页元数据计算正确

### 2. 更新文档
**文件**: `docs/BROWSE_TASKS_VISIBILITY_LOGIC.md`

更新了赏金任务可见性逻辑文档：
- 移除了 "Is Published" 作为必需条件
- 添加了说明：`is_published` 字段用于跟踪目的，但不用于过滤逻辑
- 更新了示例和场景说明
- 强调了 `visibility` 字段是控制任务可见性的唯一字段

## 新的过滤逻辑

赏金任务列表现在只检查以下条件：

1. ✅ **Is Unassigned** (`assignee_id IS NULL`)
   - 任务必须未被承接

2. ✅ **Visibility Check**
   - `PUBLIC`: 所有用户可见
   - `POSITION_ONLY`: 仅特定岗位用户可见
   - `PRIVATE`: 仅发布者可见

**注意**: `is_executable` 和 `is_published` 字段用于跟踪目的，但不用于过滤逻辑。母任务和子任务都可以显示在赏金任务列表中。

## 子任务发布流程

1. **创建子任务**
   - `visibility = PRIVATE` (默认)
   - 不显示在赏金任务列表中

2. **发布子任务**
   - 母任务承接人将 `visibility` 改为 `PUBLIC`
   - 同时设置 `is_published = true` (用于跟踪)
   - 任务显示在赏金任务列表中

3. **承接子任务**
   - 用户承接任务
   - `assignee_id` 被设置
   - 任务从赏金任务列表中消失

## 技术细节

### 修改前
```sql
WHERE 
  t.is_executable = true  -- ❌ 不必要的条件
  AND t.assignee_id IS NULL
  AND t.is_published = true  -- ❌ 冗余条件
  AND t.visibility = 'public'
```

### 修改后
```sql
WHERE 
  t.assignee_id IS NULL
  AND t.visibility = 'public'  -- ✅ 唯一的必要条件
```

## 影响范围

### 后端
- ✅ `TaskService.getAvailableTasks()` - 主查询
- ✅ `TaskService.getAvailableTasks()` - COUNT 查询

### 文档
- ✅ `docs/BROWSE_TASKS_VISIBILITY_LOGIC.md` - 更新可见性逻辑说明

### 数据库
- `is_published` 字段保留用于跟踪目的
- 不影响现有数据

## 测试建议

1. **创建私有子任务**
   - 验证：不显示在赏金任务列表中

2. **发布子任务**
   - 将 `visibility` 改为 `PUBLIC`
   - 验证：显示在赏金任务列表中

3. **承接任务**
   - 验证：从赏金任务列表中消失

4. **分页功能**
   - 验证：总数计算正确

## 相关文件

- `packages/backend/src/services/TaskService.ts` - 业务逻辑
- `docs/BROWSE_TASKS_VISIBILITY_LOGIC.md` - 可见性逻辑文档
- `docs/SUBTASK_PUBLISHING_WORKFLOW_IMPLEMENTATION_STATUS.md` - 子任务发布工作流

## 完成日期
2026-02-05
