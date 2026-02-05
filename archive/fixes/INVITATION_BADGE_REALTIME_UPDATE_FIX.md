# 任务邀请Badge实时更新修复

## 问题描述
用户接受或拒绝任务邀请后，"我的任务"菜单项旁边的红色Badge（邀请数量提示）仍然显示，没有立即更新。

## 根本原因
MainLayout中的邀请数量是通过定时器每30秒自动刷新的，而不是在用户操作后立即更新。这导致用户接受/拒绝邀请后，需要等待最多30秒才能看到Badge数量更新。

```typescript
// 原来的实现 - 只有定时刷新
useEffect(() => {
  const loadInvitationCount = async () => {
    const invitations = await taskApi.getTaskInvitations();
    setInvitationCount(invitations.length);
  };
  loadInvitationCount();
  
  // 每30秒刷新一次
  const interval = setInterval(loadInvitationCount, 30000);
  return () => clearInterval(interval);
}, []);
```

## 解决方案
使用自定义事件（Custom Event）机制，在用户接受或拒绝邀请后立即通知MainLayout更新邀请数量。

### 实现步骤

#### 1. MainLayout - 添加事件监听器
**文件**: `packages/frontend/src/layouts/MainLayout.tsx`

添加对 `invitation-updated` 事件的监听：

```typescript
useEffect(() => {
  const loadInvitationCount = async () => {
    try {
      const invitations = await taskApi.getTaskInvitations();
      setInvitationCount(invitations.length);
    } catch (error) {
      console.error('Failed to load invitation count:', error);
    }
  };
  loadInvitationCount();
  
  // 监听邀请更新事件
  const handleInvitationUpdate = () => {
    loadInvitationCount();
  };
  window.addEventListener('invitation-updated', handleInvitationUpdate);
  
  // 保留定时刷新作为备用
  const interval = setInterval(loadInvitationCount, 30000);
  
  return () => {
    clearInterval(interval);
    window.removeEventListener('invitation-updated', handleInvitationUpdate);
  };
}, []);
```

#### 2. AssignedTasksPage - 触发事件
**文件**: `packages/frontend/src/pages/AssignedTasksPage.tsx`

在接受邀请后触发事件：

```typescript
const handleAcceptInvitation = async (task: Task) => {
  setActionLoading(task.id);
  try {
    await taskApi.acceptTaskAssignment(task.id);
    message.success('已接受任务');
    await loadInvitations();
    await loadTasks();
    // 触发事件通知MainLayout更新
    window.dispatchEvent(new Event('invitation-updated'));
  } catch (error: any) {
    message.error(error.response?.data?.message || '接受任务失败');
  } finally {
    setActionLoading(null);
  }
};
```

在拒绝邀请后触发事件：

```typescript
const handleRejectInvitationConfirm = async () => {
  if (!selectedTask) return;

  setActionLoading(selectedTask.id);
  try {
    await taskApi.rejectTaskAssignment(selectedTask.id, rejectReason);
    message.success('已拒绝任务');
    setRejectModalVisible(false);
    setSelectedTask(null);
    setRejectReason('');
    await loadInvitations();
    // 触发事件通知MainLayout更新
    window.dispatchEvent(new Event('invitation-updated'));
  } catch (error: any) {
    message.error(error.response?.data?.message || '拒绝任务失败');
  } finally {
    setActionLoading(null);
  }
};
```

## 技术实现

### 自定义事件机制
使用浏览器原生的 `CustomEvent` API：

1. **触发事件**: `window.dispatchEvent(new Event('invitation-updated'))`
2. **监听事件**: `window.addEventListener('invitation-updated', handler)`
3. **清理监听**: `window.removeEventListener('invitation-updated', handler)`

### 优点
- **实时响应**: 用户操作后立即更新UI
- **解耦设计**: 组件间通过事件通信，不需要直接引用
- **可扩展**: 其他组件也可以监听同一事件
- **向后兼容**: 保留定时刷新作为备用机制

## 用户体验改进

### 修复前
1. 用户接受任务邀请
2. 邀请列表立即更新（邀请消失）
3. 但菜单上的Badge仍显示红点
4. 需要等待最多30秒才能看到Badge更新

### 修复后
1. 用户接受任务邀请
2. 邀请列表立即更新
3. **菜单上的Badge立即更新**（红点消失或数字减少）
4. 用户体验流畅，无需等待

## 事件流程图

```
用户操作
   ↓
接受/拒绝邀请
   ↓
API调用成功
   ↓
刷新本地邀请列表
   ↓
触发 'invitation-updated' 事件
   ↓
MainLayout监听到事件
   ↓
重新加载邀请数量
   ↓
更新Badge显示
```

## 文件变更

### 修改的文件
1. `packages/frontend/src/layouts/MainLayout.tsx`
   - 添加事件监听器
   - 在cleanup中移除监听器

2. `packages/frontend/src/pages/AssignedTasksPage.tsx`
   - 在 `handleAcceptInvitation` 中触发事件
   - 在 `handleRejectInvitationConfirm` 中触发事件

## 测试验证

### 测试步骤
1. ✅ 登录系统
2. ✅ 确认"我的任务"菜单有Badge显示（有待处理邀请）
3. ✅ 点击"我的任务"，切换到"任务邀请"Tab
4. ✅ 接受一个任务邀请
5. ✅ 观察菜单上的Badge是否立即更新
6. ✅ 拒绝一个任务邀请
7. ✅ 观察菜单上的Badge是否立即更新

### 预期结果
- Badge数量应该在操作完成后立即更新
- 不需要刷新页面或等待30秒
- 当所有邀请都处理完后，Badge应该完全消失

## 其他应用场景

这个事件机制也可以用于：
1. 通知中心的未读数量更新
2. 购物车数量更新
3. 任何需要跨组件实时同步的计数器

## 状态
**已完成** ✅ - 所有修改已实现并通过TypeScript编译检查

## 兼容性
- 使用浏览器原生API，无需额外依赖
- 支持所有现代浏览器
- 保留定时刷新作为降级方案
