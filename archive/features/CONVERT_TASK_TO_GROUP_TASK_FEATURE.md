# 将任务转换为组群任务功能

## 概述

实现了承接人将已承接的任务转换为组群任务的功能。承接人可以选择自己所属的任何组群，将任务与该组群关联，使组群成员可以查看和协作该任务。

## 需求

1. **权限控制**：只有任务的承接人（assignee）可以转换任务
2. **组群选择**：承接人可以从自己所属的组群中选择一个
3. **状态保持**：转换后承接人仍然是任务的承接者
4. **可见性**：转换后组群成员可以查看任务详情
5. **不可逆**：转换操作不可撤销

## 实现的功能

### 后端功能

#### 1. GroupService 新增方法

**`convertTaskToGroupTask(taskId, groupId, userId)`**
- 验证组群存在
- 验证用户是组群成员
- 验证用户是任务的承接者
- 验证任务还不是组群任务
- 将任务的 `group_id` 设置为指定的组群ID
- 保持任务的 `assignee_id` 不变

**权限验证**：
- 用户必须是组群成员
- 用户必须是任务的承接者（assignee）
- 任务不能已经是组群任务

#### 2. 新增 API 路由

**POST `/api/groups/:groupId/tasks/:taskId/convert`**
- 将任务转换为组群任务
- 需要认证
- 参数：
  - `groupId` - 要关联的组群ID
  - `taskId` - 要转换的任务ID

### 前端功能

#### 1. group API 更新

**新增方法**
- `convertTaskToGroupTask(groupId, taskId)` - 将任务转换为组群任务

#### 2. TaskDetailDrawer 组件增强

**新增状态**
- `convertToGroupModalVisible` - 控制转换模态框显示
- `userGroups` - 用户所属的组群列表
- `selectedGroupId` - 选中的组群ID
- `convertingToGroup` - 转换中的加载状态

**新增方法**
- `loadUserGroups()` - 加载用户所属的组群列表
- `handleConvertToGroup()` - 打开转换模态框
- `handleConvertToGroupConfirm()` - 确认转换操作

**UI 更新**
- 在任务详情的 footer 中添加"转换为组群任务"按钮
- 添加转换为组群任务的模态框
- 显示组群选择下拉框
- 显示转换说明和注意事项

**显示条件**
- 用户是任务的承接者（isAssignee）
- 任务还不是组群任务（!task.groupId）
- 用户至少属于一个组群（userGroups.length > 0）

## 技术细节

### 数据库操作

**转换任务 SQL**
```sql
UPDATE tasks
SET group_id = $1, updated_at = NOW()
WHERE id = $2
```

### 权限验证流程

1. **验证组群存在**
   ```typescript
   const group = await this.groupRepository.findById(groupId);
   if (!group) throw new NotFoundError('Task group not found');
   ```

2. **验证用户是组群成员**
   ```typescript
   const isMember = await this.groupRepository.isMember(groupId, userId);
   if (!isMember) throw new AuthorizationError('You must be a member of the group');
   ```

3. **验证用户是任务承接者**
   ```typescript
   if (task.assignee_id !== userId) {
     throw new AuthorizationError('Only the task assignee can convert it to a group task');
   }
   ```

4. **验证任务不是组群任务**
   ```typescript
   if (task.group_id) {
     throw new ValidationError('Task is already a group task');
   }
   ```

### 转换后的效果

**保持不变**：
- `assignee_id` - 承接者不变
- `status` - 任务状态不变
- `publisher_id` - 发布者不变
- 其他任务属性保持不变

**改变**：
- `group_id` - 设置为选定的组群ID
- `updated_at` - 更新为当前时间

## 用户体验

### 转换任务流程

1. 用户打开已承接任务的详情页面
2. 在页面底部看到"转换为组群任务"按钮（如果满足条件）
3. 点击"转换为组群任务"按钮
4. 弹出模态框，显示：
   - 任务名称
   - 转换说明
   - 组群选择下拉框（显示用户所属的所有组群）
   - 注意事项
5. 选择要关联的组群
6. 点击"确认转换"
7. 转换成功后：
   - 显示成功提示
   - 关闭模态框
   - 刷新任务详情
   - 任务现在关联到选定的组群

### UI 设计

**转换按钮**
- 图标：TeamOutlined（团队图标）
- 文本："转换为组群任务"
- 位置：任务详情 footer，在"编辑"和"关闭"按钮之间

**转换模态框**
- 标题："转换为组群任务"
- 内容：
  - 说明文字
  - 组群选择下拉框（带图标和成员数）
  - 注意事项（灰色背景框）
- 按钮：
  - "确认转换"（主按钮，带加载状态）
  - "取消"（次要按钮）

**组群选项显示**
```
🔹 组群名称 (X 成员)
```

**注意事项**
- 转换后，您仍然是任务的承接者
- 组群成员可以查看任务详情和进度
- 此操作不可撤销

## 错误处理

### 后端错误

1. **组群不存在** - 返回 404 NotFoundError
2. **用户不是组群成员** - 返回 403 AuthorizationError
3. **用户不是任务承接者** - 返回 403 AuthorizationError
4. **任务已是组群任务** - 返回 400 ValidationError
5. **任务不存在** - 返回 404 NotFoundError

### 前端错误

1. **未选择组群** - 显示"请选择要关联的组群"
2. **转换失败** - 显示具体错误信息
3. **网络错误** - 显示"转换失败"

## 文件修改清单

### 后端文件

1. **packages/backend/src/services/GroupService.ts**
   - 添加 `convertTaskToGroupTask()` 方法

2. **packages/backend/src/routes/group.routes.ts**
   - 添加 `POST /:groupId/tasks/:taskId/convert` 路由

### 前端文件

1. **packages/frontend/src/api/group.ts**
   - 添加 `convertTaskToGroupTask()` 方法

2. **packages/frontend/src/components/TaskDetailDrawer.tsx**
   - 添加转换相关状态
   - 添加 `loadUserGroups()` 方法
   - 添加 `handleConvertToGroup()` 和 `handleConvertToGroupConfirm()` 方法
   - 在 footer 中添加"转换为组群任务"按钮
   - 添加转换模态框UI
   - 导入 `groupApi`

## 测试建议

### 功能测试

1. **转换任务**
   - ✅ 承接者可以转换自己承接的任务
   - ✅ 非承接者无法转换任务
   - ✅ 可以选择自己所属的任何组群
   - ✅ 转换后任务关联到正确的组群
   - ✅ 转换后承接者保持不变

2. **权限控制**
   - ✅ 只有承接者可以看到转换按钮
   - ✅ 已是组群任务的不显示转换按钮
   - ✅ 没有加入任何组群的用户不显示转换按钮
   - ✅ 非组群成员无法转换到该组群

3. **UI 交互**
   - ✅ 模态框正确显示用户的组群列表
   - ✅ 组群选项显示名称和成员数
   - ✅ 转换时显示加载状态
   - ✅ 转换成功后显示提示并刷新

### 边界情况测试

1. **并发转换** - 多个用户同时转换同一任务
2. **组群删除** - 转换时组群被删除
3. **用户移除** - 转换时用户被移出组群
4. **任务状态变化** - 转换时任务状态改变
5. **网络中断** - 转换过程中网络中断

### 用户体验测试

1. **加载状态** - 转换时显示加载状态
2. **成功提示** - 转换成功后显示友好提示
3. **错误提示** - 转换失败后显示清晰的错误信息
4. **数据刷新** - 转换后自动刷新任务详情

## 安全考虑

1. **认证** - API端点需要认证
2. **授权** - 验证用户是任务承接者和组群成员
3. **数据验证** - 后端验证所有输入数据
4. **SQL注入防护** - 使用参数化查询
5. **幂等性** - 防止重复转换

## 性能优化

1. **组群列表缓存** - 可以缓存用户的组群列表
2. **批量查询** - 一次性加载所需数据
3. **乐观更新** - 前端可以先更新UI再等待后端响应

## 使用场景

### 场景1：个人任务转为团队协作

**背景**：用户承接了一个任务，发现需要团队协作完成

**操作流程**：
1. 打开任务详情
2. 点击"转换为组群任务"
3. 选择相关的团队组群
4. 确认转换
5. 团队成员现在可以查看和协作该任务

### 场景2：将任务纳入项目管理

**背景**：用户承接的任务属于某个项目，希望纳入项目组群管理

**操作流程**：
1. 打开任务详情
2. 点击"转换为组群任务"
3. 选择项目组群
4. 确认转换
5. 任务现在在项目组群中可见

### 场景3：寻求团队支持

**背景**：用户在完成任务时遇到困难，需要团队成员的帮助

**操作流程**：
1. 打开任务详情
2. 点击"转换为组群任务"
3. 选择技术团队组群
4. 确认转换
5. 团队成员可以查看任务并提供帮助

## 后续改进建议

1. **撤销转换** - 允许承接者撤销转换（如果没有其他成员参与）
2. **转换历史** - 记录任务的转换历史
3. **通知机制** - 转换时通知组群成员
4. **批量转换** - 支持批量转换多个任务
5. **转换权限配置** - 允许组群配置谁可以转换任务
6. **转换审批** - 需要组群管理员审批才能转换
7. **转移承接者** - 转换时可以选择转移承接者给组群成员

## 与其他功能的关系

### 与组群任务创建的区别

**组群任务创建**：
- 在组群中直接创建新任务
- 任务从创建时就属于组群
- 任务默认为私有

**任务转换为组群任务**：
- 将已存在的个人任务转换为组群任务
- 任务原本不属于任何组群
- 承接者保持不变

### 与任务分配的关系

**任务分配**：
- 将未分配的任务分配给用户
- 改变 `assignee_id`

**任务转换**：
- 将已分配的任务关联到组群
- 改变 `group_id`
- `assignee_id` 保持不变

## 完成状态

✅ **功能已完成**

所有计划的功能都已实现并通过编译检查：
- 后端 GroupService 添加了转换任务的方法
- 后端路由添加了相应的API端点
- 前端 group API 添加了调用方法
- 前端 TaskDetailDrawer 添加了转换UI和逻辑
- 所有文件编译通过，无TypeScript错误

---

**实现日期**: 2026-02-04
**实现者**: Kiro AI Assistant
