# 前端表格按钮对比报告

## 问题描述

根据用户反馈和截图：
- **5173端口（工作前端）**: 表格操作栏按钮较少
- **5174端口（备份前端）**: 表格操作栏显示完整按钮（发布、编辑、指派、删除等）

这与之前的理解相反，现在需要找出为什么工作前端的按钮反而更少。

## 截图分析

从5174（备份前端）的截图可以看到，每个任务都有以下按钮：
1. **发布按钮**（蓝色主按钮）- 用于发布未开始的任务
2. **编辑按钮** - 用于编辑任务信息
3. **指派按钮** - 用于指派任务给其他用户
4. **删除按钮** - 用于删除未开始的任务

## 已添加的调试代码

### 工作前端（5173）
在 `packages/frontend/src/components/TaskList/TaskListTable.tsx` 中添加了调试日志：

```typescript
// Props 级别
console.log('[5173 TaskListTable] Props:', {
  showAssignButton,
  showAcceptButton,
  hasOnPublishTask: !!onPublishTask,
  hasOnEditTask: !!onEditTask,
  hasOnDeleteTask: !!onDeleteTask,
  isPublishedTasksPage,
  hasUser: !!user,
  userId: user?.id,
  hasActions
});

// 任务级别
console.log(`[5173 TaskListTable] Task ${record.id} (${record.name}):`, {
  status: record.status,
  publisherId: record.publisherId,
  isPublisher,
  canPublish,
  canAssign,
  canDelete,
  willShowEditButton: isPublishedTasksPage && isPublisher && !!onEditTask
});

// 按钮结果
console.log(`[5173 TaskListTable] Task ${record.id} final buttons:`, buttons.map(b => b?.key));
```

### 备份前端（5174）
在 `packages/frontend-bak/src/components/TaskList/TaskListTable.tsx` 中也添加了类似的调试日志。

## 调试步骤

### 1. 重启两个前端
```bash
# 工作前端
cd packages/frontend
npm run dev

# 备份前端
cd packages/frontend-bak
npm run dev
```

### 2. 对比日志输出

打开两个浏览器窗口：
- 窗口1: http://localhost:5173 （工作前端）
- 窗口2: http://localhost:5174 （备份前端）

在两个窗口中：
1. 登录 admin 账号
2. 打开开发者工具（F12）
3. 切换到 Console 标签
4. 导航到"我的悬赏"页面
5. 对比日志输出

### 3. 关键对比点

#### Props 对比
检查两个前端的 Props 是否一致：
- `showAssignButton`: 应该都是 true
- `hasOnPublishTask`: 应该都是 true
- `hasOnEditTask`: 应该都是 true
- `hasOnDeleteTask`: 应该都是 true
- `isPublishedTasksPage`: 应该都是 true
- `hasUser`: 应该都是 true

#### 任务状态对比
检查同一个任务在两个前端中的状态：
- `status`: 应该相同
- `publisherId`: 应该相同
- `isPublisher`: 应该都是 true（对于 admin 创建的任务）

#### 按钮条件对比
检查按钮显示条件的计算结果：
- `canPublish`: 应该相同
- `canAssign`: 应该相同
- `canDelete`: 应该相同

## 可能的原因

### 1. Props 传递差异
工作前端可能在某个环节没有正确传递 props：
- PublishedTasksPage 可能没有传递某些回调函数
- TaskListContainer 可能没有正确转发 props
- TaskListTable 可能没有接收到某些 props

### 2. 用户对象差异
工作前端的 user 对象可能：
- 为 null 或 undefined
- user.id 与任务的 publisherId 不匹配
- 缺少某些必要字段

### 3. 任务数据差异
工作前端加载的任务数据可能：
- 状态不是 NOT_STARTED
- publisherId 字段缺失或不正确
- 数据结构与备份前端不同

### 4. 代码版本差异
虽然我们对比了代码，但可能：
- 浏览器缓存了旧版本代码
- 构建产物不同步
- 依赖版本不一致

## 下一步行动

1. **运行调试** - 重启两个前端并查看控制台日志
2. **对比日志** - 找出两个前端在 Props、任务状态、按钮条件上的差异
3. **定位问题** - 根据日志差异确定问题根源
4. **实施修复** - 修复工作前端的问题

## 临时解决方案

如果需要快速恢复功能，可以：
1. 从备份前端复制相关代码到工作前端
2. 或者暂时使用备份前端作为主要环境

---

**创建日期**: 2026-03-12  
**状态**: 调试中  
**优先级**: 高
