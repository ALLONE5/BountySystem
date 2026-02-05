# 子任务承接人显示问题修复

## 问题描述
用户报告：在"我的任务"中的一级任务中创建的子任务显示的是"待指派"状态，未直接由一级任务承接者承接。

## 问题分析

### 根本原因
1. **后端逻辑问题**: `createTask` 方法在处理子任务时，没有正确保留从母任务继承的 `assigneeId`
2. **数据查询问题**: `findSubtasks` 方法只返回基本任务数据，不包含 `assignee` 和 `publisher` 的关联用户信息
3. **前端显示逻辑**: 前端根据 `sub.assignee` 对象来判断是否有承接人，如果为空则显示"待指派"

## 修复方案

### 1. 修复 TaskService.createTask() 方法
**文件**: `packages/backend/src/services/TaskService.ts`

**问题**: 在设置子任务发布工作流默认值时，没有保留之前设置的 `assigneeId`

**修复**:
```typescript
if (parentId) {
  // ... 其他设置 ...
  
  // IMPORTANT: Preserve the assigneeId that was set earlier in the method
  // If no assigneeId was explicitly provided, default to parent's assignee
  if (!taskData.assigneeId && parent.assigneeId) {
    taskData.assigneeId = parent.assigneeId;
  }
}
```

### 2. 修复 TaskRepository.findSubtasks() 方法
**文件**: `packages/backend/src/repositories/TaskRepository.ts`

**问题**: 查询只返回任务基本字段，不包含关联的用户信息

**修复**: 
- 添加 LEFT JOIN 查询 users 和 avatars 表
- 映射 publisher 和 assignee 对象到返回结果
- 确保返回的任务对象包含完整的用户信息

**修改前**:
```typescript
const query = `
  SELECT ${this.getColumns().join(', ')}
  FROM ${this.tableName}
  WHERE parent_id = $1
  ORDER BY created_at ASC
`;
```

**修改后**:
```typescript
const query = `
  SELECT 
    t.id, t.name, t.description, t.parent_id, t.depth, t.is_executable,
    t.tags, t.created_at, t.planned_start_date, t.planned_end_date,
    t.actual_start_date, t.actual_end_date, t.estimated_hours,
    t.complexity, t.priority, t.status, t.position_id, t.visibility,
    t.bounty_amount, t.bounty_algorithm_version, t.is_bounty_settled,
    t.bounty_payer_id, t.is_published, t.published_at, t.published_by,
    t.publisher_id, t.assignee_id, t.group_id, t.project_group_id,
    t.progress, t.progress_locked, t.aggregated_estimated_hours,
    t.aggregated_complexity, t.updated_at,
    p.id as "publisher.id", p.username as "publisher.username", 
    p.email as "publisher.email", p.avatar_id as "publisher.avatarId", 
    p.role as "publisher.role", p.created_at as "publisher.createdAt",
    p.last_login as "publisher.lastLogin",
    pa.image_url as "publisher.avatarUrl",
    a.id as "assignee.id", a.username as "assignee.username", 
    a.email as "assignee.email", a.avatar_id as "assignee.avatarId", 
    a.role as "assignee.role", a.created_at as "assignee.createdAt",
    a.last_login as "assignee.lastLogin",
    aa.image_url as "assignee.avatarUrl"
  FROM ${this.tableName} t
  LEFT JOIN users p ON t.publisher_id = p.id
  LEFT JOIN avatars pa ON p.avatar_id = pa.id
  LEFT JOIN users a ON t.assignee_id = a.id
  LEFT JOIN avatars aa ON a.avatar_id = aa.id
  WHERE t.parent_id = $1
  ORDER BY t.created_at ASC
`;
```

### 3. 修复现有数据
**脚本**: `packages/backend/scripts/fix-existing-subtasks.js`

将现有未发布子任务的可见性更新为 PRIVATE：
```sql
UPDATE tasks
SET visibility = 'private'
WHERE depth = 1 AND is_published = false AND visibility != 'private'
```

## 验证结果

### 测试脚本
创建了 `packages/backend/scripts/test-subtask-assignee.js` 来验证修复

### 测试结果
```
Subtask 1:
  ID: 3050ca32-5513-46b4-b19a-159c20bb3b42
  Name: 1
  Assignee ID: 80affce2-7a90-48e2-a5c8-4f438a35356c
  Status: in_progress
  Visibility: private
  Is Published: false
  Bounty Amount: 0.00
  Bounty Payer ID: 80affce2-7a90-48e2-a5c8-4f438a35356c
  ✅ Assignee matches parent
```

所有字段都符合预期：
- ✅ `assignee_id`: 匹配母任务承接人
- ✅ `status`: `in_progress`
- ✅ `visibility`: `private`
- ✅ `is_published`: `false`
- ✅ `bounty_amount`: `0.00`
- ✅ `bounty_payer_id`: 匹配母任务承接人

## 预期行为

### 子任务创建时的默认值
1. **承接人** (`assignee_id`): 继承母任务的承接人
2. **状态** (`status`): `IN_PROGRESS` (因为有承接人)
3. **可见性** (`visibility`): `PRIVATE` (未发布)
4. **是否发布** (`is_published`): `false`
5. **赏金金额** (`bounty_amount`): `0`
6. **赏金支付者** (`bounty_payer_id`): 母任务承接人

### 前端显示
- 子任务列表应显示承接人的用户信息（头像和用户名）
- 不再显示"待指派"标签
- 显示 🔒 图标表示私有状态

## 相关文件

### 修改的文件
1. `packages/backend/src/services/TaskService.ts`
2. `packages/backend/src/repositories/TaskRepository.ts`

### 新增的脚本
1. `packages/backend/scripts/test-subtask-assignee.js` - 测试脚本
2. `packages/backend/scripts/fix-existing-subtasks.js` - 数据修复脚本

### 文档
1. `docs/SUBTASK_ASSIGNEE_FIX.md` - 本文档
2. `docs/SUBTASK_PUBLISHING_WORKFLOW_IMPLEMENTATION_STATUS.md` - 实施状态文档

## 后续步骤

1. **重启后端服务器**: 应用代码更改
2. **刷新前端页面**: 查看修复效果
3. **测试新建子任务**: 验证新创建的子任务是否正确继承承接人
4. **测试发布流程**: 验证子任务发布功能是否正常工作

## 注意事项

1. 这个修复确保了子任务创建时正确继承母任务的承接人
2. 子任务仍然是私有和未发布状态，需要母任务承接人手动发布
3. 发布后，其他用户才能看到并承接子任务
4. 发布时会从母任务承接人账户扣除赏金

## 版本信息
- 修复日期: 2026-02-03
- 相关功能: 子任务发布工作流
- 影响范围: 子任务创建和显示逻辑
