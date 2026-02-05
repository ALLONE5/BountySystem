# 我的悬赏页面操作栏布局优化

## 概述
优化了"我的悬赏"页面（PublishedTasksPage）的操作栏布局，使其更符合发布者的使用场景。

## 修改内容

### 1. 按钮顺序调整
**原顺序**：待接受标签 → 指派 → 完成 → 放弃 → 群组 → 编辑

**新顺序**（我的悬赏页面）：编辑 → 待接受标签 → 指派 → 其他信息

### 2. 指派按钮样式统一
- **原样式**: `type="link"` （链接样式）
- **新样式**: `type="default"` （标准按钮样式）
- 与其他操作按钮保持一致的视觉风格

### 3. 移除不相关按钮
在"我的悬赏"页面中移除了以下按钮：
- **完成按钮**：发布者不需要完成任务
- **放弃按钮**：发布者不需要放弃任务

这些按钮只在承接者视角（如"我的任务"页面）中显示。

## 实现细节

### 1. TaskListPage 组件
添加了新的 prop `isPublishedTasksPage` 来标识是否为"我的悬赏"页面：

```typescript
interface TaskListPageProps {
  // ... 其他 props
  isPublishedTasksPage?: boolean; // 标识是否为"我的悬赏"页面
}
```

### 2. 操作列渲染逻辑
根据 `isPublishedTasksPage` 标识调整按钮顺序和显示：

```typescript
// 如果是"我的悬赏"页面，编辑按钮放在最前面
if (isPublishedTasksPage && isPublisher && onEditTask) {
  buttons.push(编辑按钮);
}

// 指派按钮 - 在"我的悬赏"页面使用同风格按钮
if (canAssign && onAssignTask) {
  buttons.push(
    <Button type={isPublishedTasksPage ? "default" : "link"} />
  );
}

// 完成和放弃按钮 - 在"我的悬赏"页面不显示
if (!isPublishedTasksPage && ...) {
  buttons.push(完成/放弃按钮);
}

// 编辑按钮 - 在非"我的悬赏"页面放在最后
if (!isPublishedTasksPage && isPublisher && onEditTask) {
  buttons.push(编辑按钮);
}
```

### 3. PublishedTasksPage 组件
传递 `isPublishedTasksPage={true}` 给 TaskListPage：

```typescript
<TaskListPage 
  tasks={tasks} 
  loading={loading} 
  hideFilters={true} 
  onTaskUpdated={handleTaskUpdated}
  showAssignButton={true}
  onAssignTask={handleAssignTask}
  onCompleteTask={handleCompleteTask}
  onAbandonTask={handleAbandonTask}
  onEditTask={handleEdit}
  isPublishedTasksPage={true}
/>
```

## 用户体验改进

### 1. 更清晰的操作优先级
- 编辑按钮放在最前面，方便发布者快速修改任务信息
- 指派按钮紧随其后，便于发布者分配任务

### 2. 统一的视觉风格
- 所有操作按钮使用相同的样式
- 避免链接样式按钮与标准按钮混用

### 3. 简化的操作界面
- 移除了发布者不需要的操作（完成、放弃）
- 减少视觉干扰，提高操作效率

### 4. 角色明确
- "我的悬赏"页面：发布者视角，关注任务管理和分配
- "我的任务"页面：承接者视角，关注任务执行和完成

## 修改的文件

1. **packages/frontend/src/pages/TaskListPage.tsx**
   - 添加 `isPublishedTasksPage` prop
   - 调整操作列渲染逻辑
   - 根据页面类型显示不同的按钮组合

2. **packages/frontend/src/pages/PublishedTasksPage.tsx**
   - 传递 `isPublishedTasksPage={true}` 给 TaskListPage

## 测试建议

1. 访问"我的悬赏"页面，验证：
   - 编辑按钮在最前面
   - 指派按钮为标准按钮样式
   - 没有完成和放弃按钮

2. 访问"我的任务"页面，验证：
   - 按钮顺序保持原样
   - 完成和放弃按钮正常显示

3. 访问"浏览任务"页面，验证：
   - 承接按钮正常显示
   - 其他功能不受影响
