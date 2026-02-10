# 移除 is_executable 过滤条件

## 实施日期
2026-02-05

## 问题描述
用户反馈：`is_executable = true` 这个逻辑没有必要。

## 根本原因
`is_executable` 字段原本用于区分叶子节点（可执行任务）和父节点（有子任务的任务）。但这个限制不合理：
- 母任务也应该可以被承接
- 用户应该可以选择承接母任务（负责管理所有子任务）或承接单个子任务
- `is_executable` 字段应该只用于跟踪目的，不应该用于过滤

## 解决方案

### 1. 移除 getAvailableTasks 中的 is_executable 过滤
**文件**: `packages/backend/src/services/TaskService.ts`

**修改内容**:
- 主查询：移除 `AND t.is_executable = true` 条件
- COUNT 查询：移除 `AND t.is_executable = true` 条件

### 2. 移除 acceptTask 中的 is_executable 检查
**文件**: `packages/backend/src/services/TaskService.ts`

**修改内容**:
- 移除了 `if (!task.isExecutable)` 检查
- 允许用户承接任何未被承接的任务（包括母任务）

### 3. 更新文档
**文件**: `docs/BROWSE_TASKS_VISIBILITY_LOGIC.md`

**修改内容**:
- 移除了 "Is Executable" 作为必需条件
- 更新了场景说明：母任务和子任务都可以显示在赏金任务列表中
- 强调了 `is_executable` 字段只用于跟踪目的

## 新的过滤逻辑

赏金任务列表现在只检查以下条件：

1. ✅ **Is Unassigned** (`assignee_id IS NULL`)
   - 任务必须未被承接

2. ✅ **Visibility Check**
   - `PUBLIC`: 所有用户可见
   - `POSITION_ONLY`: 仅特定岗位用户可见
   - `PRIVATE`: 仅发布者可见

## 业务逻辑变化

### 修改前
- 只有叶子节点（没有子任务的任务）可以显示在赏金任务列表中
- 母任务一旦有子任务就不能被承接
- 用户只能承接最底层的子任务

### 修改后
- 母任务和子任务都可以显示在赏金任务列表中
- 用户可以选择承接母任务（负责管理所有子任务）
- 用户也可以选择承接单个子任务
- 更灵活的任务分配方式

## 技术细节

### 修改前
```sql
WHERE 
  t.is_executable = true  -- ❌ 限制只显示叶子节点
  AND t.assignee_id IS NULL
  AND t.visibility = 'public'
```

### 修改后
```sql
WHERE 
  t.assignee_id IS NULL  -- ✅ 只检查是否未被承接
  AND t.visibility = 'public'  -- ✅ 只检查可见性
```

## 影响范围

### 后端
- ✅ `TaskService.getAvailableTasks()` - 主查询和 COUNT 查询
- ✅ `TaskService.acceptTask()` - 移除 is_executable 检查

### 文档
- ✅ `docs/BROWSE_TASKS_VISIBILITY_LOGIC.md` - 更新可见性逻辑说明
- ✅ `AVAILABLE_TASKS_IS_PUBLISHED_FIX.md` - 更新过滤逻辑说明

### 数据库
- `is_executable` 字段保留用于跟踪目的
- 不影响现有数据

## 测试建议

### 测试场景 1: 母任务显示在赏金任务列表
1. 创建一个母任务
2. 为母任务创建子任务
3. 验证：母任务仍然显示在赏金任务列表中

### 测试场景 2: 承接母任务
1. 用户 A 承接有子任务的母任务
2. 验证：
   - 母任务 `assignee_id` 变为 user-A
   - 所有子任务 `assignee_id` 变为 user-A
   - 母任务从赏金任务列表中消失

### 测试场景 3: 承接子任务
1. 母任务未被承接
2. 用户 B 承接单个子任务
3. 验证：
   - 子任务 `assignee_id` 变为 user-B
   - 子任务从赏金任务列表中消失
   - 母任务仍然显示在赏金任务列表中

### 测试场景 4: 混合场景
1. 母任务有 3 个子任务
2. 用户 A 承接子任务 1
3. 用户 B 承接子任务 2
4. 用户 C 承接母任务
5. 验证：
   - 子任务 1 和 2 的承接人不变
   - 子任务 3 的承接人变为 user-C
   - 母任务承接人变为 user-C

## 相关文件

- `packages/backend/src/services/TaskService.ts` - 主要修改文件
- `docs/BROWSE_TASKS_VISIBILITY_LOGIC.md` - 可见性逻辑文档
- `AVAILABLE_TASKS_IS_PUBLISHED_FIX.md` - is_published 逻辑优化说明

## 完成日期
2026-02-05
