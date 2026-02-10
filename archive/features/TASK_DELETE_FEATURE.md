# 任务删除功能实现

## 功能概述
在"我的悬赏"页面和"组群详情"页面添加任务删除操作，只有发布者可见删除按钮，且只能删除未开始和可承接状态的任务。

## 实现内容

### 1. 权限控制
- **可见性**: 只有任务发布者可以看到删除按钮
- **状态限制**: 只能删除以下状态的任务：
  - `NOT_STARTED` (未开始)
  - `AVAILABLE` (可承接)

### 2. 前端实现

#### 2.1 TaskListPage 组件修改

**文件**: `packages/frontend/src/pages/TaskListPage.tsx`

**新增内容**:

1. **导入删除图标**:
```typescript
import { DeleteOutlined } from '@ant-design/icons';
```

2. **添加 onDeleteTask 回调 prop**:
```typescript
interface TaskListPageProps {
  // ... 其他 props
  onDeleteTask?: (taskId: string) => void; // 新增
}
```

3. **删除权限判断逻辑**:
```typescript
const canDelete = isPublisher && onDeleteTask && (
  record.status === TaskStatus.NOT_STARTED || 
  record.status === TaskStatus.AVAILABLE
);
```

4. **删除按钮渲染**:
```typescript
if (canDelete) {
  buttons.push(
    <Button
      key="delete"
      danger
      size="small"
      icon={<DeleteOutlined />}
      onClick={(e) => {
        e.stopPropagation();
        Modal.confirm({
          title: '确定要删除这个任务吗？',
          content: '删除后将无法恢复',
          okText: '确定删除',
          cancelText: '取消',
          okButtonProps: { danger: true },
          onOk: () => onDeleteTask(record.id),
        });
      }}
    >
      删除
    </Button>
  );
}
```

#### 2.2 PublishedTasksPage 组件修改

**文件**: `packages/frontend/src/pages/PublishedTasksPage.tsx`

**新增内容**:

1. **删除处理函数**:
```typescript
const handleDeleteTask = async (taskId: string) => {
  try {
    await taskApi.deleteTask(taskId);
    message.success('任务已删除');
    loadTasks();
  } catch (error: any) {
    message.error(error.response?.data?.error || '删除任务失败');
    console.error('Failed to delete task:', error);
  }
};
```

2. **传递删除回调给 TaskListPage**:
```typescript
<TaskListPage 
  // ... 其他 props
  onDeleteTask={handleDeleteTask}
  isPublishedTasksPage={true}
/>
```

#### 2.3 GroupsPage 组件修改

**文件**: `packages/frontend/src/pages/GroupsPage.tsx`

**新增内容**:

1. **删除处理函数**:
```typescript
const handleDeleteTask = async (taskId: string) => {
  try {
    await taskApi.deleteTask(taskId);
    message.success('任务已删除');
    
    // 刷新组群任务列表
    if (selectedGroup) {
      const tasks = await groupApi.getGroupTasks(selectedGroup.id);
      setGroupTasks(tasks);
    }
  } catch (error: any) {
    message.error(error.response?.data?.error || '删除任务失败');
    console.error('Failed to delete task:', error);
  }
};
```

2. **传递删除回调给 TaskListPage**:
```typescript
<TaskListPage
  // ... 其他 props
  onDeleteTask={handleDeleteTask}
/>
```

### 3. 后端 API

**已存在的 API**:
- **路由**: `DELETE /api/tasks/:taskId`
- **文件**: `packages/backend/src/routes/task.routes.ts`
- **服务**: `taskService.deleteTask(taskId)`

前端 API 客户端也已经实现：
```typescript
// packages/frontend/src/api/task.ts
deleteTask: createApiMethodWithParams<void, string>('delete', (taskId) => `/tasks/${taskId}`)
```

## 用户体验

### 删除确认对话框
- **标题**: "确定要删除这个任务吗？"
- **内容**: "删除后将无法恢复"
- **确认按钮**: "确定删除" (红色危险按钮)
- **取消按钮**: "取消"

### 删除按钮样式
- **类型**: `danger` (红色危险按钮)
- **大小**: `small`
- **图标**: `<DeleteOutlined />`
- **文本**: "删除"

### 成功/失败提示
- **成功**: "任务已删除"
- **失败**: 显示具体错误信息或"删除任务失败"

## 权限验证

### 前端验证
```typescript
const isPublisher = user && record.publisherId === user.id;
const canDelete = isPublisher && onDeleteTask && (
  record.status === TaskStatus.NOT_STARTED || 
  record.status === TaskStatus.AVAILABLE
);
```

### 后端验证
后端 API 应该也会验证：
1. 用户是否为任务发布者
2. 任务状态是否允许删除
3. 任务是否存在

## 使用场景

### 1. 我的悬赏页面
- 用户可以删除自己发布的未开始或可承接状态的任务
- 删除按钮位于操作栏中
- 删除后自动刷新任务列表

### 2. 组群详情页面
- 组群成员可以删除自己在组群中创建的未开始或可承接状态的任务
- 删除按钮位于任务列表的操作栏中
- 删除后自动刷新组群任务列表

## 限制条件

### 不可删除的任务状态
- `IN_PROGRESS` (进行中) - 已有人承接
- `PENDING_ACCEPTANCE` (待接受) - 已指派但未接受
- `COMPLETED` (已完成)
- `CANCELLED` (已取消)
- `REVIEW` (审核中)

### 原因
- 保护已承接任务的完整性
- 避免影响承接者的工作
- 保持任务历史记录的完整性

## 测试建议

### 功能测试

1. **我的悬赏页面测试**:
   ```
   1. 登录系统
   2. 进入"我的悬赏"页面
   3. 找到一个未开始或可承接状态的任务
   4. 验证删除按钮可见
   5. 点击删除按钮
   6. 确认删除对话框出现
   7. 点击"确定删除"
   8. 验证任务被删除且列表刷新
   ```

2. **组群详情页面测试**:
   ```
   1. 登录系统
   2. 进入"我的组群"页面
   3. 选择一个组群，点击"查看详情"
   4. 找到一个自己创建的未开始或可承接状态的任务
   5. 验证删除按钮可见
   6. 点击删除按钮
   7. 确认删除对话框出现
   8. 点击"确定删除"
   9. 验证任务被删除且组群任务列表刷新
   ```

3. **权限测试**:
   ```
   - 验证非发布者看不到删除按钮
   - 验证进行中的任务没有删除按钮
   - 验证已完成的任务没有删除按钮
   ```

4. **取消操作测试**:
   ```
   1. 点击删除按钮
   2. 在确认对话框中点击"取消"
   3. 验证任务未被删除
   ```

### 边界测试

1. **网络错误处理**:
   - 模拟网络错误，验证错误提示
   - 验证删除失败后任务仍然存在

2. **并发操作**:
   - 同时删除多个任务
   - 验证每个任务都正确处理

3. **状态变化**:
   - 任务在删除前状态发生变化
   - 验证后端正确拒绝删除

## 相关文件

### 修改的文件
- `packages/frontend/src/pages/TaskListPage.tsx`
- `packages/frontend/src/pages/PublishedTasksPage.tsx`
- `packages/frontend/src/pages/GroupsPage.tsx`

### 相关文件（未修改）
- `packages/frontend/src/api/task.ts` - 前端 API 客户端（已有 deleteTask 方法）
- `packages/backend/src/routes/task.routes.ts` - 后端路由（已有 DELETE 路由）
- `packages/backend/src/services/TaskService.ts` - 后端服务（已有 deleteTask 方法）

## 注意事项

1. **数据完整性**: 删除操作不可逆，需要用户确认
2. **权限控制**: 前后端都需要验证用户权限
3. **状态检查**: 只允许删除特定状态的任务
4. **级联删除**: 后端需要处理相关数据的清理（如通知、评论等）
5. **审计日志**: 建议记录删除操作以便追踪

## 后续优化建议

1. **软删除**: 考虑实现软删除而非物理删除，保留历史记录
2. **批量删除**: 允许用户一次删除多个任务
3. **删除原因**: 可选地要求用户提供删除原因
4. **恢复功能**: 实现任务恢复功能（如果使用软删除）
5. **权限细化**: 考虑管理员可以删除任何任务的权限

## 状态
✅ 已实现并测试
