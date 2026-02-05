# 子任务删除功能

## 更新日期
2026-02-03

## 功能概述

在任务详情的子任务列表中添加删除按钮，允许用户删除子任务。

## 功能特性

### 1. 删除按钮位置
- 位于子任务列表每一项的右侧
- 与"查看详情"按钮并列显示
- 使用红色危险样式（danger）突出显示

### 2. 删除确认
- 点击删除按钮时弹出确认对话框
- 显示子任务名称，确保用户知道要删除的内容
- 提示"此操作不可恢复"
- 提供"确认删除"和"取消"两个选项

### 3. 删除后行为
- 删除成功后显示成功提示
- 自动刷新子任务列表
- 如果该子任务的详情弹窗正在显示，自动关闭
- 通知父组件刷新任务数据（更新母任务统计信息）

## 实现细节

### 前端实现

#### 文件位置
`packages/frontend/src/components/TaskDetailDrawer.tsx`

#### 1. 删除处理函数

```typescript
const handleDeleteSubtask = async (subtaskId: string, subtaskName: string) => {
  if (!task) return;
  
  Modal.confirm({
    title: '确认删除子任务',
    content: `确定要删除子任务"${subtaskName}"吗？此操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await taskApi.deleteTask(subtaskId);
        message.success('子任务删除成功');
        
        // Refresh subtasks
        const updatedSubtasks = await taskApi.getSubtasks(task.id);
        setSubtasks(updatedSubtasks);
        
        // Close popover if it's open for this subtask
        setSubtaskPopoverVisible(prev => ({
          ...prev,
          [subtaskId]: false
        }));
        setSubtaskInPopover(null);
        
        // Notify parent to refresh task data
        if (onTaskUpdated) {
          onTaskUpdated();
        }
      } catch (error) {
        console.error('Failed to delete subtask:', error);
        message.error('删除子任务失败');
      }
    },
  });
};
```

#### 2. UI 按钮

```tsx
<Button
  key="delete"
  type="link"
  size="small"
  danger
  icon={<DeleteOutlined />}
  onClick={() => handleDeleteSubtask(sub.id, sub.name)}
>
  删除
</Button>
```

#### 3. 图标导入

```typescript
import { PlusOutlined, TeamOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
```

### 后端API

使用现有的任务删除API：
- **端点**: `DELETE /api/tasks/:taskId`
- **权限**: 需要认证
- **功能**: 删除任务（包括子任务）

## 用户交互流程

### 正常删除流程

```
1. 用户打开母任务详情
   ↓
2. 在子任务列表中找到要删除的子任务
   ↓
3. 点击该子任务右侧的"删除"按钮（红色）
   ↓
4. 弹出确认对话框
   标题: "确认删除子任务"
   内容: "确定要删除子任务"XXX"吗？此操作不可恢复。"
   ↓
5. 用户点击"确认删除"
   ↓
6. 系统删除子任务
   ↓
7. 显示成功提示: "子任务删除成功"
   ↓
8. 子任务列表自动刷新，已删除的子任务消失
   ↓
9. 母任务的统计信息自动更新（子任务数量、聚合工时等）
```

### 取消删除流程

```
1-4. 同上
   ↓
5. 用户点击"取消"或关闭对话框
   ↓
6. 对话框关闭，不执行任何操作
   ↓
7. 子任务保持不变
```

## 数据库影响

### 级联删除

由于数据库设置了 `ON DELETE CASCADE`，删除子任务时会自动删除：
- 任务依赖关系（task_dependencies）
- 任务评论（comments）
- 任务附件（attachments）
- 任务助手（task_assistants）
- 赏金交易记录（bounty_transactions）

### 触发器影响

删除子任务后，数据库触发器会自动：
1. 检查母任务是否还有其他子任务
2. 如果没有子任务了，将母任务的 `is_executable` 设置为 `true`
3. 母任务可以重新出现在赏金任务列表中

## 权限控制

### 谁可以删除子任务？

根据现有的任务删除API权限：
- 任务创建者（publisher）
- 系统管理员（super_admin）

**注意**: 当前实现使用通用的任务删除API，没有特殊的子任务删除权限检查。如果需要更严格的权限控制（例如只允许母任务承接者删除子任务），需要在后端添加额外的验证逻辑。

## 安全考虑

### 1. 确认对话框
- 防止误删除
- 显示子任务名称确保用户知道要删除什么
- 明确提示"此操作不可恢复"

### 2. 错误处理
- 删除失败时显示错误提示
- 不会导致页面崩溃
- 保持UI状态一致

### 3. 数据一致性
- 删除后自动刷新列表
- 关闭相关的弹窗
- 通知父组件更新数据

## UI/UX 设计

### 按钮样式
- **类型**: Link button（链接按钮）
- **大小**: Small
- **颜色**: Danger（红色）
- **图标**: DeleteOutlined（删除图标）
- **文本**: "删除"

### 确认对话框
- **标题**: "确认删除子任务"
- **内容**: 包含子任务名称的确认消息
- **确认按钮**: "确认删除"（红色危险样式）
- **取消按钮**: "取消"（默认样式）

### 反馈提示
- **成功**: "子任务删除成功"（绿色提示）
- **失败**: "删除子任务失败"（红色提示）

## 测试建议

### 手动测试

1. **基本删除测试**:
   - 创建一个母任务并添加子任务
   - 点击删除按钮
   - 确认删除
   - 验证子任务被删除且列表刷新

2. **取消删除测试**:
   - 点击删除按钮
   - 点击"取消"
   - 验证子任务未被删除

3. **最后一个子任务删除测试**:
   - 删除母任务的最后一个子任务
   - 验证母任务的 `is_executable` 变为 `true`
   - 验证母任务出现在赏金任务列表中

4. **弹窗打开时删除测试**:
   - 打开子任务详情弹窗
   - 删除该子任务
   - 验证弹窗自动关闭

5. **权限测试**:
   - 使用非创建者账号尝试删除
   - 验证权限控制是否正确

### 自动化测试建议

```typescript
describe('Subtask Delete Feature', () => {
  it('should show delete button for each subtask', () => {
    // 测试删除按钮显示
  });

  it('should show confirmation dialog when clicking delete', () => {
    // 测试确认对话框
  });

  it('should delete subtask when confirmed', async () => {
    // 测试删除功能
  });

  it('should not delete subtask when cancelled', async () => {
    // 测试取消删除
  });

  it('should refresh subtask list after deletion', async () => {
    // 测试列表刷新
  });

  it('should close popover if open for deleted subtask', async () => {
    // 测试弹窗关闭
  });

  it('should update parent task after deletion', async () => {
    // 测试母任务更新
  });
});
```

## 相关文档

- **子任务创建要求**: `docs/SUBTASK_CREATION_REQUIREMENT.md`
- **子任务详情视图**: `docs/SUBTASK_DETAIL_VIEW_FULL_DRAWER.md`
- **子任务继承约束**: `docs/SUBTASK_INHERITANCE_AND_CONSTRAINTS.md`
- **is_executable 逻辑**: `docs/IS_EXECUTABLE_LOGIC_EXPLANATION.md`

## 未来改进建议

### 1. 批量删除
- 添加复选框选择多个子任务
- 提供批量删除功能

### 2. 软删除
- 实现软删除机制（标记为已删除而不是物理删除）
- 提供恢复功能

### 3. 删除权限细化
- 只允许母任务承接者删除子任务
- 添加更细粒度的权限控制

### 4. 删除历史
- 记录删除操作日志
- 显示谁在什么时候删除了哪个子任务

### 5. 删除影响提示
- 在确认对话框中显示删除影响
- 例如："该子任务有3条评论和2个附件将被一并删除"

## 总结

子任务删除功能为用户提供了管理子任务的灵活性。通过确认对话框和清晰的反馈，确保了操作的安全性和用户体验。删除后的自动刷新和数据同步保证了数据的一致性。
