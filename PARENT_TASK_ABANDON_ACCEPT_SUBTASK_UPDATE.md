# 母任务放弃/承接时子任务自动更新功能

## 实施日期
2026-02-05

## 功能概述
当母任务的承接人放弃或有新人承接母任务时，自动更新所有子任务的状态和承接人。

## 业务需求

### 需求 1: 母任务放弃时子任务变为私有且清除承接人
当母任务承接人点击"放弃"时：
- 所有子任务自动变为私有状态（`visibility = PRIVATE`）
- 所有子任务的承接人清空（`assignee_id = NULL`）
- 所有子任务的状态重置为未开始（`status = NOT_STARTED`）
- 子任务不再显示在赏金任务列表中

**业务逻辑**：
- 母任务被放弃后，子任务应该重新规划
- 子任务的承接人依赖于母任务的承接人，母任务放弃后子任务也应该重置
- 在新的承接人接手母任务之前，子任务不应该对外可见

### 需求 2: 母任务承接时子任务承接人更新
当有人承接母任务时：
- 所有子任务的承接人自动更改为新的母任务承接人
- 所有子任务的赏金支付者（`bounty_payer_id`）更新为新的母任务承接人
- 子任务的可见性保持不变（需要新承接人手动发布）

**业务逻辑**：
- 子任务的执行依赖于母任务的承接人
- 新的母任务承接人应该负责所有子任务的管理和赏金支付

## 技术实现

### 1. 修改 `abandonTask` 方法

**文件**: `packages/backend/src/services/TaskService.ts`

**修改内容**:
```typescript
async abandonTask(taskId: string, userId: string): Promise<{ task: Task; publisherId: string }> {
  // ... 现有验证逻辑 ...

  // NEW: If this task has subtasks, set all subtasks to PRIVATE visibility and clear assignee
  const subtasks = await this.getSubtasks(taskId);
  if (subtasks.length > 0) {
    await this.transactionManager.executeInTransaction(async (client) => {
      // Set all subtasks to PRIVATE visibility and clear assignee
      await client.query(
        `UPDATE tasks 
         SET visibility = $1, assignee_id = NULL, status = $2, updated_at = NOW()
         WHERE parent_id = $3`,
        [Visibility.PRIVATE, TaskStatus.NOT_STARTED, taskId]
      );
    });
  }

  // ... 现有放弃逻辑 ...
}
```

**执行流程**:
1. 验证用户权限（只有承接人可以放弃）
2. 查询所有子任务
3. 如果有子任务，在事务中：
   - 将所有子任务的 `visibility` 设为 `PRIVATE`
   - 将所有子任务的 `assignee_id` 设为 `NULL`
   - 将所有子任务的 `status` 设为 `NOT_STARTED`
4. 更新母任务状态（设为未承接）
5. 清除缓存

### 2. 修改 `acceptTask` 方法

**文件**: `packages/backend/src/services/TaskService.ts`

**修改内容**:
```typescript
async acceptTask(taskId: string, userId: string): Promise<Task> {
  // ... 现有验证和承接逻辑 ...

  // NEW: If this is a parent task (has subtasks), update all subtask assignees
  const subtasks = await this.getSubtasks(taskId);
  if (subtasks.length > 0) {
    await this.transactionManager.executeInTransaction(async (client) => {
      // Update all subtasks' assignee to the new parent task assignee
      await client.query(
        `UPDATE tasks 
         SET assignee_id = $1, bounty_payer_id = $1, updated_at = NOW()
         WHERE parent_id = $2`,
        [userId, taskId]
      );
    });
  }

  // ... 现有缓存清除逻辑 ...
}
```

**执行流程**:
1. 验证用户权限和任务状态
2. 更新母任务状态（分配给用户）
3. 查询所有子任务
4. 如果有子任务，在事务中更新所有子任务的 `assignee_id` 和 `bounty_payer_id`
5. 清除缓存

## 数据流示例

### 场景 1: 放弃母任务

**初始状态**:
```
母任务 (ID: task-001)
├─ assignee_id: user-A
├─ status: IN_PROGRESS
└─ 子任务 (ID: task-002)
   ├─ assignee_id: user-A
   ├─ visibility: PUBLIC
   └─ bounty_payer_id: user-A
```

**用户 A 放弃母任务后**:
```
母任务 (ID: task-001)
├─ assignee_id: null
├─ status: NOT_STARTED
└─ 子任务 (ID: task-002)
   ├─ assignee_id: null  (✅ 自动清空)
   ├─ visibility: PRIVATE  (✅ 自动变为私有)
   ├─ status: NOT_STARTED  (✅ 自动重置)
   └─ bounty_payer_id: user-A  (保持不变)
```

### 场景 2: 承接母任务

**初始状态**:
```
母任务 (ID: task-001)
├─ assignee_id: null
├─ status: NOT_STARTED
└─ 子任务 (ID: task-002)
   ├─ assignee_id: null
   ├─ visibility: PRIVATE
   ├─ status: NOT_STARTED
   └─ bounty_payer_id: user-A
```

**用户 B 承接母任务后**:
```
母任务 (ID: task-001)
├─ assignee_id: user-B
├─ status: IN_PROGRESS
└─ 子任务 (ID: task-002)
   ├─ assignee_id: user-B  (✅ 自动更新)
   ├─ visibility: PRIVATE  (保持不变，需要手动发布)
   └─ bounty_payer_id: user-B  (✅ 自动更新)
```

## 事务处理

两个操作都使用事务确保数据一致性：

1. **放弃母任务**:
   - 更新所有子任务的 `visibility` 为 `PRIVATE`
   - 更新所有子任务的 `assignee_id` 为 `NULL`
   - 更新所有子任务的 `status` 为 `NOT_STARTED`
   - 更新母任务的 `assignee_id` 和 `status`
   - 如果任何步骤失败，整个操作回滚

2. **承接母任务**:
   - 更新母任务的 `assignee_id` 和 `status`
   - 更新所有子任务的 `assignee_id` 和 `bounty_payer_id`
   - 如果任何步骤失败，整个操作回滚

## 缓存失效

两个操作都会清除可承接任务缓存：
```typescript
await this.cacheService.deletePattern('available_tasks:*');
```

这确保赏金任务列表立即反映最新的任务状态。

## 影响范围

### 后端
- ✅ `TaskService.abandonTask()` - 添加子任务可见性更新逻辑
- ✅ `TaskService.acceptTask()` - 添加子任务承接人更新逻辑

### 前端
- 无需修改（前端只是展示后端返回的数据）

### 数据库
- 无需修改（使用现有字段）

## 测试建议

### 测试场景 1: 放弃有子任务的母任务
1. 用户 A 创建母任务并承接
2. 用户 A 创建子任务并发布（`visibility = PUBLIC`）
3. 用户 A 放弃母任务
4. 验证：
   - 母任务状态变为 `NOT_STARTED`
   - 母任务 `assignee_id` 变为 `null`
   - 所有子任务 `visibility` 变为 `PRIVATE`
   - 所有子任务 `assignee_id` 变为 `null`
   - 所有子任务 `status` 变为 `NOT_STARTED`
   - 子任务不再显示在赏金任务列表中

### 测试场景 2: 承接有子任务的母任务
1. 母任务处于未承接状态
2. 母任务有多个子任务（承接人为 null，状态为 NOT_STARTED）
3. 用户 B 承接母任务
4. 验证：
   - 母任务 `assignee_id` 变为 user-B
   - 所有子任务 `assignee_id` 变为 user-B
   - 所有子任务 `bounty_payer_id` 变为 user-B
   - 子任务 `visibility` 保持不变

### 测试场景 3: 放弃后重新承接
1. 用户 A 创建母任务并承接
2. 用户 A 创建并发布子任务
3. 用户 A 放弃母任务（子任务变为私有）
4. 用户 B 承接母任务（子任务承接人变为 user-B）
5. 用户 B 重新发布子任务（`visibility = PUBLIC`）
6. 验证：整个流程正常工作

### 测试场景 4: 事务回滚
1. 模拟数据库错误
2. 验证：如果子任务更新失败，母任务状态也不会改变

## 边界情况

### 1. 母任务没有子任务
- 行为：正常放弃/承接，不执行子任务更新逻辑
- 性能：避免不必要的数据库查询

### 2. 子任务已被其他用户承接
- 放弃母任务：子任务承接人被强制清空，状态重置为 NOT_STARTED
- 承接母任务：子任务承接人被强制更改为新的母任务承接人
- 理由：子任务的执行依赖于母任务承接人，必须保持一致

### 3. 子任务有未结算的赏金
- 承接母任务时：`bounty_payer_id` 更新为新承接人
- 理由：新的母任务承接人应该负责支付子任务赏金

## 相关文件

- `packages/backend/src/services/TaskService.ts` - 主要修改文件
- `packages/backend/src/models/Task.ts` - Task 模型定义
- `docs/SUBTASK_PUBLISHING_WORKFLOW_IMPLEMENTATION_STATUS.md` - 子任务发布工作流
- `docs/BROWSE_TASKS_VISIBILITY_LOGIC.md` - 赏金任务可见性逻辑

## 完成日期
2026-02-05
