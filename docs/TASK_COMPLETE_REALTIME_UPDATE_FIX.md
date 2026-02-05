# 任务完成后进度实时更新修复

## 问题描述

用户报告：点击"完成任务"按钮后，任务详情抽屉中的进度更新了，但外层表格中的任务进度没有实时更新到100%。

## 问题分析

### 根本原因

1. **状态同步问题**：`TaskDetailDrawer`组件接收的`task` prop是从父组件传入的，当任务完成后，虽然后端数据已更新，但父组件的状态没有及时刷新。

2. **刷新时机问题**：在`TaskListPage`中，`handleCompleteTask`函数在完成任务后会调用`loadTasks()`刷新列表，但这个刷新是在Modal确认后执行的，而且没有等待刷新完成就关闭了抽屉。

3. **selectedTask未更新**：即使任务列表刷新了，`selectedTask`状态也没有更新，导致`TaskDetailDrawer`仍然显示旧的任务数据。

### 数据流

```
用户点击"完成任务" 
  → TaskDetailDrawer调用onCompleteTask(taskId)
  → TaskListPage.handleCompleteTask执行
  → 调用taskApi.completeTask(taskId)
  → 后端更新任务状态和进度
  → 前端需要刷新任务列表
  → 前端需要更新selectedTask
  → TaskDetailDrawer接收新的task prop
  → 界面显示更新后的进度
```

## 解决方案

### 1. 修改`TaskListPage.handleCompleteTask`

**文件**: `packages/frontend/src/pages/TaskListPage.tsx`

**修改前**:
```typescript
const handleCompleteTask = async (taskId: string) => {
  Modal.confirm({
    title: '确定要完成这个任务吗？',
    content: '完成任务后将无法再更新进度，此操作可能需要几秒钟时间',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await taskApi.completeTask(taskId);
        message.success('任务已完成');
        setDrawerVisible(false);
        if (!propTasks) {
          loadTasks();  // 没有等待刷新完成
        }
      } catch (error) {
        message.error('完成任务失败');
        console.error('Failed to complete task:', error);
        throw error;
      }
    },
  });
};
```

**修改后**:
```typescript
const handleCompleteTask = async (taskId: string) => {
  Modal.confirm({
    title: '确定要完成这个任务吗？',
    content: '完成任务后将无法再更新进度，此操作可能需要几秒钟时间',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await taskApi.completeTask(taskId);
        message.success('任务已完成');
        
        // 刷新任务列表 - 等待刷新完成
        if (!propTasks) {
          await loadTasks();
        } else if (onTaskUpdated) {
          await onTaskUpdated();
        }
        
        // 关闭抽屉
        setDrawerVisible(false);
      } catch (error) {
        message.error('完成任务失败');
        console.error('Failed to complete task:', error);
        throw error;
      }
    },
  });
};
```

**关键改进**:
- 使用`await`等待`loadTasks()`或`onTaskUpdated()`完成
- 在刷新完成后再关闭抽屉
- 支持通过`onTaskUpdated`回调刷新外部传入的任务列表

### 2. 添加`selectedTask`自动更新逻辑

**文件**: `packages/frontend/src/pages/TaskListPage.tsx`

**新增代码**:
```typescript
// Update selected task when tasks array changes
useEffect(() => {
  if (selectedTask && drawerVisible) {
    const updatedTask = tasks.find(t => t.id === selectedTask.id);
    if (updatedTask) {
      console.log('[TaskListPage] Updating selectedTask with new data, progress:', updatedTask.progress);
      setSelectedTask(updatedTask);
    }
  }
}, [tasks, selectedTask?.id, drawerVisible]);
```

**功能说明**:
- 监听`tasks`数组的变化
- 当任务列表更新时，自动查找并更新`selectedTask`
- 确保`TaskDetailDrawer`始终显示最新的任务数据
- 只在抽屉打开且有选中任务时执行更新

## 修复效果

### 修复前
1. 用户点击"完成任务"
2. 后端更新成功
3. 抽屉关闭
4. 外层表格中的任务进度仍显示旧值（如60%）
5. 需要手动刷新页面才能看到100%

### 修复后
1. 用户点击"完成任务"
2. 后端更新成功
3. 前端自动刷新任务列表
4. `selectedTask`自动更新
5. 抽屉中显示最新进度（100%）
6. 抽屉关闭
7. 外层表格中的任务进度立即显示100%

## 相关文件

- `packages/frontend/src/pages/TaskListPage.tsx` - 主要修复文件
- `packages/frontend/src/components/TaskDetailDrawer.tsx` - 任务详情抽屉组件
- `packages/frontend/src/pages/AssignedTasksPage.tsx` - 参考实现（已有类似逻辑）

## 测试建议

1. **基本功能测试**:
   - 打开任务列表页面
   - 点击一个进行中的任务
   - 在任务详情抽屉中点击"完成任务"
   - 确认后观察外层表格中的进度是否立即更新到100%

2. **边界情况测试**:
   - 测试网络延迟情况下的表现
   - 测试完成任务失败的情况
   - 测试同时打开多个任务详情的情况

3. **不同页面测试**:
   - 在"我的任务"页面测试
   - 在"我的悬赏"页面测试
   - 在"任务列表"页面测试
   - 在"群组"页面测试

## 注意事项

1. **性能考虑**：`useEffect`会在`tasks`数组每次变化时执行，但由于有条件判断（`selectedTask && drawerVisible`），实际执行频率不高。

2. **依赖项**：`useEffect`的依赖项包括`tasks`、`selectedTask?.id`和`drawerVisible`，确保在正确的时机触发更新。

3. **异步处理**：使用`await`确保刷新完成后再关闭抽屉，避免用户看到中间状态。

## 相关问题

这个修复也解决了以下相关问题：
- 更新任务进度后，外层表格不实时更新
- 编辑任务信息后，外层表格不实时更新
- 放弃任务后，外层表格不实时更新

## 日期

2026-02-02
