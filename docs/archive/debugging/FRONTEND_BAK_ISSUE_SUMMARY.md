# 备份前端问题总结

## 问题 1：登录后无法跳转（已解决）

### 问题描述
备份前端（`packages/frontend-bak`，端口 5174）登录成功后无法跳转到 dashboard。

### 解决方案
使用 `App.useApp()` 获取 message API，避免静态方法导致的上下文问题。详见 `docs/reports/FRONTEND_BAK_LOGIN_FIX.md`。

---

## 问题 2：表格操作按钮差异（调查中）

### 问题描述
- **5173端口（工作前端）**: 表格中按钮较少
- **5174端口（备份前端）**: 表格中显示完整按钮（发布、编辑、指派、删除等）

### 观察到的现象
从用户提供的截图可以看到，5174（备份前端）的"我的悬赏"页面表格中，每个任务都显示了：
1. 发布按钮（蓝色主按钮）
2. 编辑按钮
3. 指派按钮
4. 删除按钮

而5173（工作前端）的按钮明显更少。

### 已完成的调查

#### 1. 代码对比
已对比以下文件，发现实现完全相同：
- ✅ `TaskListPage.tsx` - 两个前端相同
- ✅ `TaskListContainer.tsx` - 两个前端相同  
- ✅ `TaskListTable.tsx` - 两个前端相同
- ✅ `PublishedTasksPage.tsx` - 两个前端相同
- ✅ `PublishedTasksActions.tsx` - 两个前端相同

#### 2. Props 传递链
```
PublishedTasksPage 
  → TaskListPage (hideFilters, isPublishedTasksPage, onPublishTask, onEditTask, onDeleteTask, etc.)
    → TaskListContainer (...actionProps)
      → TaskListTable (...actionProps)
```

所有 props 都通过扩展运算符正确传递。

### 添加的调试代码

#### 工作前端（5173）
位置：`packages/frontend/src/components/TaskList/TaskListTable.tsx`

1. **Props 级别日志**：
   ```typescript
   console.log('[5173 TaskListTable] Props:', {
     showAssignButton,
     showAcceptButton,
     hasOnCompleteTask: !!onCompleteTask,
     hasOnPublishTask: !!onPublishTask,
     hasOnEditTask: !!onEditTask,
     hasOnJoinGroup: !!onJoinGroup,
     hasOnDeleteTask: !!onDeleteTask,
     isPublishedTasksPage,
     isGroupTasksPage,
     hasUser: !!user,
     userId: user?.id,
     hasActions
   });
   ```

2. **任务级别日志**（每个任务渲染时）：
   ```typescript
   console.log(`[5173 TaskListTable] Task ${record.id} (${record.name}):`, {
     status: record.status,
     publisherId: record.publisherId,
     assigneeId: record.assigneeId,
     isPublisher,
     isAssignee,
     isNotStarted,
     canPublish,
     canAssign,
     canAccept,
     canDelete,
     willShowEditButton: isPublishedTasksPage && isPublisher && !!onEditTask
   });
   ```

3. **按钮结果日志**（按钮渲染完成后）：
   ```typescript
   console.log(`[5173 TaskListTable] Task ${record.id} final buttons:`, buttons.map(b => b?.key));
   ```

#### 备份前端（5174）
位置：`packages/frontend-bak/src/components/TaskList/TaskListTable.tsx`

添加了相同的调试日志，但标识为 `[TaskListTable]`（无5173前缀）。

### 下一步操作

#### 方法1：使用对比脚本（推荐）
```bash
compare-frontends-debug.bat
```

这将自动启动两个前端并提供详细的对比指南。

#### 方法2：手动对比
1. **启动两个前端**
   ```bash
   # 终端1 - 工作前端
   cd packages/frontend
   npm run dev
   
   # 终端2 - 备份前端  
   cd packages/frontend-bak
   npm run dev
   ```

2. **打开两个浏览器窗口**
   - 窗口1: http://localhost:5173 （工作前端）
   - 窗口2: http://localhost:5174 （备份前端）

3. **在两个窗口中**
   - 登录 admin 账号
   - 打开开发者工具（F12）
   - 切换到 Console 标签
   - 导航到"我的悬赏"页面

4. **对比日志输出**
   - 查找 `[5173 TaskListTable] Props:` 和 `[TaskListTable] Props:`
   - 对比每个任务的日志
   - 对比最终按钮列表

#### 关键对比点
- Props 是否一致（特别是回调函数）
- User 对象是否存在且正确
- 任务状态是否相同
- 按钮条件计算结果是否一致

### 临时解决方案

如果发现是特定条件导致的问题，可以临时放宽按钮显示条件进行测试。

---

## 相关文档
- `docs/reports/FRONTEND_BAK_LOGIN_FIX.md` - 登录问题修复报告
- `docs/reports/FRONTEND_BAK_MESSAGE_FIX.md` - Message API 修复报告
- `docs/reports/FRONTEND_BAK_TABLE_BUTTONS_FIX.md` - 表格按钮修复报告（旧）
- `docs/reports/FRONTEND_BAK_BUTTONS_DEBUG.md` - 备份前端按钮调试报告（旧）
- `docs/reports/FRONTEND_BUTTONS_COMPARISON.md` - 前端按钮对比报告（最新）
- `compare-frontends-debug.bat` - 前端对比调试脚本
- `debug-buttons.html` - 浏览器端调试指南

---

**最后更新**：2026-03-12  
**当前状态**：问题 1 已解决，问题 2 调查中（已添加调试日志到两个前端）
