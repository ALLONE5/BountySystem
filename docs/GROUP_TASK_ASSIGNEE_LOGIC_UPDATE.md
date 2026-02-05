# 群组任务承接人显示逻辑更新

## 需求描述

修改群组任务的逻辑：承接人显示为某个具体用户，而不是只显示群组名。

## 问题分析

### 原有逻辑

在原有的实现中，群组任务的承接人显示逻辑是：
1. 如果有`assignee`（具体用户），显示用户
2. 如果没有`assignee`但有`assigneeFallback`，显示fallback用户
3. **如果都没有但有`groupName`，只显示群组标签**
4. 如果都没有，显示"未分配"

这导致群组任务如果没有分配具体承接人，就只会显示群组名，用户无法知道具体是谁在负责这个任务。

### 新需求

群组任务应该：
- **必须有具体的承接人（用户）**
- 群组名作为附加信息显示在承接人旁边
- 用户可以同时看到"谁在负责"和"属于哪个群组"

## 解决方案

### 1. 前端显示逻辑修改

**文件**: `packages/frontend/src/components/TaskDetailDrawer.tsx`

**修改前**:
```typescript
<InfoRow label="承接者 / 协作者">
  <Space wrap>
    {task.assignee ? (
      <UserChip ... />
    ) : assigneeFallback ? (
      <UserChip ... />
    ) : task.groupName ? (
      <Tag color="geekblue" icon={<TeamOutlined />}>
        {task.groupName}
      </Tag>
    ) : (
      <Text type="secondary">未分配</Text>
    )}
  </Space>
</InfoRow>
```

**修改后**:
```typescript
<InfoRow label="承接者 / 协作者">
  <Space wrap>
    {task.assignee ? (
      <>
        <UserChip
          avatarUrl={task.assignee.avatarUrl}
          username={task.assignee.username}
          tip="承接者"
          size={32}
          highlight
        />
        {task.groupName && (
          <Tag color="geekblue" icon={<TeamOutlined />}>
            {task.groupName}
          </Tag>
        )}
      </>
    ) : assigneeFallback ? (
      <>
        <UserChip
          avatarUrl={assigneeFallback.avatarUrl}
          username={assigneeFallback.username}
          tip="承接者"
          size={32}
          highlight
        />
        {task.groupName && (
          <Tag color="geekblue" icon={<TeamOutlined />}>
            {task.groupName}
          </Tag>
        )}
      </>
    ) : (
      <>
        <Text type="secondary">未分配</Text>
        {task.groupName && (
          <Tag color="geekblue" icon={<TeamOutlined />}>
            {task.groupName}
          </Tag>
        )}
      </>
    )}
  </Space>
</InfoRow>
```

**关键改进**:
- 群组名始终作为标签显示（如果存在）
- 承接人优先显示，群组名作为附加信息
- 即使没有承接人，也会显示"未分配"和群组标签

### 2. 数据修复脚本

**文件**: `packages/backend/scripts/assign-group-task-assignees.js`

创建了一个脚本来为现有的群组任务分配承接人：

```javascript
// 1. 查找所有没有承接人的群组任务
// 2. 获取该群组的成员列表
// 3. 将第一个成员分配为承接人
// 4. 更新任务的assignee_id字段
```

**执行结果**:
```
✓ [后端开发组] API 性能优化 → admin
✓ [前端开发组] 前端界面重构 → admin
```

### 3. 测试数据更新

**文件**: `packages/backend/scripts/seed-enhanced-test-data.js`

更新了测试数据生成脚本，在创建群组任务时就分配承接人：

**修改前**:
```javascript
await createTask({
  key: 'frontend-redesign',
  name: '前端界面重构',
  publisher: 'admin',
  group: '前端开发组',
  assignee: null,  // 没有承接人
  ...
});
```

**修改后**:
```javascript
await createTask({
  key: 'frontend-redesign',
  name: '前端界面重构',
  publisher: 'admin',
  group: '前端开发组',
  assignee: 'developer1',  // 分配给群组中的一个成员
  ...
});
```

## 显示效果

### 修改前
- **群组任务（无承接人）**: 只显示群组标签 "前端开发组"
- **群组任务（有承接人）**: 显示用户头像和用户名

### 修改后
- **群组任务（有承接人）**: 显示用户头像和用户名 + 群组标签 "前端开发组"
- **群组任务（无承接人）**: 显示"未分配" + 群组标签 "前端开发组"

## 业务逻辑说明

### 群组任务的承接人分配

1. **创建群组任务时**:
   - 发布者可以选择将任务分配给群组中的某个成员
   - 或者先不分配，让群组成员自己承接

2. **群组成员承接任务**:
   - 群组成员可以在"浏览任务"或"群组"页面看到群组任务
   - 点击"承接任务"按钮后，成为该任务的承接人
   - 任务的`assignee_id`字段会更新为该成员的ID

3. **显示逻辑**:
   - 承接人：显示具体的用户（头像 + 用户名）
   - 群组标签：显示任务所属的群组名称
   - 两者同时显示，让用户清楚地知道"谁在负责"和"属于哪个群组"

## 数据库字段说明

群组任务相关的字段：
- `group_id`: 任务所属的群组ID（UUID）
- `assignee_id`: 任务承接人的用户ID（UUID）
- 两个字段可以同时存在，表示"这是一个群组任务，由某个具体用户负责"

## 相关文件

### 前端文件
- `packages/frontend/src/components/TaskDetailDrawer.tsx` - 任务详情抽屉（主要修改）
- `packages/frontend/src/pages/AssignedTasksPage.tsx` - 我的任务页面（已正确显示）
- `packages/frontend/src/pages/GroupsPage.tsx` - 群组页面（使用TaskListPage）

### 后端脚本
- `packages/backend/scripts/assign-group-task-assignees.js` - 数据修复脚本（新增）
- `packages/backend/scripts/seed-enhanced-test-data.js` - 测试数据生成脚本（已更新）

## 测试建议

1. **查看群组任务详情**:
   - 打开一个群组任务的详情抽屉
   - 确认同时显示承接人和群组标签
   - 确认群组标签显示在承接人旁边

2. **查看任务列表**:
   - 在"我的任务"页面查看群组任务
   - 确认任务名旁边显示群组标签
   - 确认可以正常点击查看详情

3. **查看群组页面**:
   - 打开"我的组群"页面
   - 选择一个群组查看其任务
   - 确认任务显示正确

4. **承接群组任务**:
   - 在"浏览任务"页面找到一个未承接的群组任务
   - 点击"承接任务"
   - 确认承接后显示自己的用户名和群组标签

## 注意事项

1. **向后兼容**: 修改后的显示逻辑仍然支持没有承接人的群组任务，会显示"未分配"和群组标签。

2. **数据一致性**: 建议运行`assign-group-task-assignees.js`脚本为现有的群组任务分配承接人。

3. **业务规则**: 群组任务应该始终有承接人，如果没有，应该鼓励群组成员承接。

## 未来改进建议

1. **自动分配**: 创建群组任务时，可以自动分配给群组中的某个成员（如群组创建者）。

2. **转移承接人**: 允许群组管理员将任务从一个成员转移给另一个成员。

3. **多人协作**: 支持多个群组成员同时作为承接人（通过协作者功能）。

4. **承接提醒**: 当群组任务没有承接人时，向群组成员发送提醒通知。

## 日期

2026-02-02
