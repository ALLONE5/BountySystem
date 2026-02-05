# 组群任务视图优化

## 概述
将"我的组群"页面中的组群任务视图改为使用 TaskViews 组件，与"我的任务"界面对齐，增加看板视图。

## 实现内容

### 1. 导入必要的组件和 API
- 添加 `taskApi` 导入用于任务操作
- 添加统计相关的图标：`CheckCircleOutlined`, `ClockCircleOutlined`, `PlayCircleOutlined`
- 已有的 `TaskViews`, `TaskListPage`, `TaskDetailDrawer` 组件

### 2. 添加状态管理
- `taskDetailDrawerVisible`: 控制任务详情抽屉的显示
- `selectedTask`: 当前选中的任务

### 3. 实现任务操作函数
- `handleCompleteTask`: 完成任务（带确认对话框）
- `handleAbandonTask`: 放弃任务
- `handleTaskUpdated`: 任务更新后刷新列表
- `handleTaskClick`: 点击任务查看详情

### 4. 添加统计卡片
在组群详情抽屉中添加了四个统计卡片：
- **总任务数**：显示组群中的所有任务数量
- **进行中**：显示正在进行的任务数量
- **已完成**：显示已完成的任务数量
- **总赏金**：显示所有任务的赏金总额

### 5. 使用 TaskViews 组件
替换原有的 Tabs 组件，使用 TaskViews 组件提供四个视图：
- **列表视图**：使用 TaskListPage 组件
- **甘特图视图**：显示任务的时间线
- **看板视图**：按状态分组显示任务
- **日历视图**：在日历上显示任务

### 6. TaskListPage 配置
传递以下 props 给 TaskListPage：
- `tasks`: 组群任务列表
- `loading`: 加载状态
- `hideFilters`: 隐藏过滤器
- `showAcceptButton`: 显示承接按钮
- `onAcceptTask`: 承接任务回调
- `onCompleteTask`: 完成任务回调
- `onAbandonTask`: 放弃任务回调
- `onTaskUpdated`: 任务更新回调

### 7. 添加任务详情抽屉
在页面底部添加 TaskDetailDrawer 组件，用于显示任务详情。

## 技术细节

### 统计数据计算
```typescript
const stats = {
  total: groupTasks.length,
  inProgress: groupTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
  completed: groupTasks.filter(t => t.status === TaskStatus.COMPLETED).length,
  totalBounty: groupTasks.reduce((sum, t) => sum + (Number(t.bountyAmount) || 0), 0),
};
```

### TaskViews 使用
```typescript
<TaskViews
  tasks={groupTasks}
  loading={loadingTasks}
  listView={
    <TaskListPage
      key={selectedGroup.id}
      tasks={groupTasks}
      loading={loadingTasks}
      hideFilters
      showAcceptButton
      onAcceptTask={handleAcceptTask}
      onCompleteTask={handleCompleteTask}
      onAbandonTask={handleAbandonTask}
      onTaskUpdated={handleTaskUpdated}
    />
  }
/>
```

## 用户体验改进

1. **统一的视图体验**：组群任务视图与"我的任务"界面保持一致
2. **多视图切换**：用户可以根据需要在列表、甘特图、看板、日历四个视图之间切换
3. **直观的统计信息**：通过统计卡片快速了解组群任务的整体情况
4. **保留承接功能**：组群成员可以直接在列表中承接任务
5. **完整的任务操作**：支持完成、放弃任务等操作

## 文件修改
- `packages/frontend/src/pages/GroupsPage.tsx`

## 测试建议

1. 打开"我的组群"页面
2. 点击查看某个组群详情
3. 验证统计卡片显示正确的数据
4. 切换不同的视图（列表、甘特图、看板、日历）
5. 在列表视图中测试承接按钮
6. 测试完成和放弃任务功能
7. 点击任务查看详情抽屉

## 状态
✅ 已完成
