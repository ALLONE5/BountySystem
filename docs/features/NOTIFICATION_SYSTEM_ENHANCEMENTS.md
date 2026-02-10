# 通知系统增强功能

## 功能概述
本次更新为通知系统添加了两个重要功能：
1. **额外奖赏通知**：当承接人收到额外奖赏时自动发送通知
2. **管理员通知发布**：允许管理员向指定用户或用户组发送自定义通知

## 实现日期
2026年2月10日

---

## 功能一：额外奖赏通知

### 功能描述
当管理员为已完成的任务添加额外奖赏时，系统会自动向任务承接人发送通知，告知其获得了额外奖赏。

### 通知类型
- **类型代码**: `BONUS_REWARD`
- **通知标题**: "您收到了额外奖赏"
- **通知内容**: "恭喜！您完成的任务"{任务名称}"获得了 ${金额} 的额外奖赏{：原因}"

### 实现细节

#### 1. 后端实现

**新增通知类型** (`Notification.ts`):
```typescript
export enum NotificationType {
  // ... 其他类型
  BONUS_REWARD = 'bonus_reward',
  ADMIN_ANNOUNCEMENT = 'admin_announcement',
}
```

**TaskService 更新** (`TaskService.ts`):
```typescript
async addBonusReward(taskId, bonusAmount, adminId, reason?) {
  // ... 现有逻辑
  
  // 发送通知给承接人
  await this.notificationService.createNotification({
    userId: task.assigneeId,
    type: NotificationType.BONUS_REWARD,
    title: '您收到了额外奖赏',
    message: `恭喜！您完成的任务"${task.name}"获得了 $${bonusAmount.toFixed(2)} 的额外奖赏${reason ? `：${reason}` : ''}`,
    relatedTaskId: taskId,
    senderId: adminId,
  });
  
  // ... 其余逻辑
}
```

#### 2. 通知触发时机
- 管理员点击"额外奖赏"按钮
- 填写金额和原因（可选）
- 点击"确认发放"
- 系统完成以下操作：
  1. 更新任务赏金金额
  2. 创建赏金交易记录
  3. 更新用户余额
  4. **发送通知给承接人** ✨
  5. 触发排名更新

#### 3. 通知内容示例

**有原因**:
```
标题: 您收到了额外奖赏
内容: 恭喜！您完成的任务"开发用户登录功能"获得了 $50.00 的额外奖赏：任务完成质量优秀
```

**无原因**:
```
标题: 您收到了额外奖赏
内容: 恭喜！您完成的任务"开发用户登录功能"获得了 $50.00 的额外奖赏
```

---

## 功能二：管理员通知发布

### 功能描述
允许超级管理员和岗位管理员向系统用户发送自定义通知。支持多种发送方式：
- 发送给所有用户
- 发送给指定用户
- 发送给指定角色的用户
- 发送给指定岗位的用户

### 权限要求
- **超级管理员** (super_admin): 可以使用所有发送方式
- **岗位管理员** (position_admin): 可以使用所有发送方式

### 实现细节

#### 1. 后端实现

**NotificationService 新增方法** (`NotificationService.ts`):

1. **按角色发送**:
```typescript
async broadcastToRole(
  adminId: string,
  role: string,
  title: string,
  message: string
): Promise<number> {
  // 获取指定角色的所有用户
  const userQuery = 'SELECT id FROM users WHERE role = $1';
  const userResult = await pool.query(userQuery, [role]);
  const userIds = userResult.rows.map((row) => row.id);
  
  // 批量创建通知
  // ...
  
  return userIds.length;
}
```

2. **按岗位发送**:
```typescript
async broadcastToPosition(
  adminId: string,
  positionId: string,
  title: string,
  message: string
): Promise<number> {
  // 获取指定岗位的所有已批准用户
  const userQuery = `
    SELECT DISTINCT u.id 
    FROM users u
    INNER JOIN user_positions up ON u.id = up.user_id
    WHERE up.position_id = $1 AND up.status = 'approved'
  `;
  const userResult = await pool.query(userQuery, [positionId]);
  const userIds = userResult.rows.map((row) => row.id);
  
  // 批量创建通知
  // ...
  
  return userIds.length;
}
```

**API 路由更新** (`notification.routes.ts`):
```typescript
POST /api/notifications/broadcast

请求体:
{
  "title": "通知标题",
  "message": "通知内容",
  "targetType": "all" | "users" | "role" | "position",
  "targetValue": string | string[] // 根据 targetType 不同而不同
}

响应:
{
  "success": true,
  "message": "Notification sent to 10 users",
  "data": {
    "count": 10
  }
}
```

#### 2. 前端实现

**通知发布页面** (`NotificationBroadcastPage.tsx`):

**页面路径**: `/admin/notifications`

**菜单位置**: 管理功能 → 发布通知

**页面功能**:
1. **通知标题输入**:
   - 必填
   - 最大100个字符
   - 示例：系统维护通知

2. **通知内容输入**:
   - 必填
   - 最大500个字符
   - 支持字符计数
   - 多行文本框

3. **发送对象选择**:
   - **所有用户**: 发送给系统中的所有注册用户
   - **指定用户**: 通过搜索选择特定用户（支持多选）
   - **指定角色**: 选择用户角色（普通用户、岗位管理员、超级管理员）
   - **指定岗位**: 选择岗位（从岗位列表中选择）

4. **动态表单**:
   - 根据选择的发送对象类型，显示不同的输入字段
   - 实时提示将发送给多少用户

5. **用户搜索**:
   - 支持按用户名或邮箱搜索
   - 最少输入2个字符
   - 显示搜索结果（用户名 + 邮箱）

**API 接口** (`notification.ts`):
```typescript
export interface BroadcastRequest {
  title: string;
  message: string;
  targetType: 'all' | 'users' | 'role' | 'position';
  targetValue?: string | string[];
}

export const broadcastNotification = async (
  data: BroadcastRequest
): Promise<number> => {
  const response = await apiClient.post(
    '/notifications/broadcast',
    data
  );
  return response.data.data.count;
};
```

#### 3. 使用流程

**发送给所有用户**:
1. 进入"管理功能" → "发布通知"
2. 输入通知标题和内容
3. 选择"所有用户"
4. 点击"发送通知"
5. 系统显示发送成功，告知发送给了多少用户

**发送给指定用户**:
1. 进入"管理功能" → "发布通知"
2. 输入通知标题和内容
3. 选择"指定用户"
4. 在搜索框中输入用户名或邮箱
5. 从搜索结果中选择用户（可多选）
6. 点击"发送通知"

**发送给指定角色**:
1. 进入"管理功能" → "发布通知"
2. 输入通知标题和内容
3. 选择"指定角色"
4. 从下拉列表中选择角色
5. 点击"发送通知"

**发送给指定岗位**:
1. 进入"管理功能" → "发布通知"
2. 输入通知标题和内容
3. 选择"指定岗位"
4. 从下拉列表中选择岗位
5. 点击"发送通知"

---

## 数据库影响

### 通知表 (notifications)
无需修改表结构，使用现有字段：
- `type`: 新增 `BONUS_REWARD` 和 `ADMIN_ANNOUNCEMENT` 类型
- `sender_id`: 存储发送通知的管理员ID
- `related_task_id`: 对于额外奖赏通知，存储相关任务ID

---

## 安全考虑

### 1. 权限验证
- 只有管理员可以发送通知
- 在路由层和服务层都进行权限检查
- 防止普通用户通过API直接调用

### 2. 输入验证
- 标题最大100个字符
- 内容最大500个字符
- 验证 targetType 的有效性
- 验证 targetValue 的格式和内容

### 3. 防止滥用
- 建议添加频率限制（未实现）
- 记录所有通知发送日志
- 管理员ID记录在通知中

### 4. 数据完整性
- 验证用户ID存在
- 验证角色有效
- 验证岗位ID存在
- 使用数据库事务确保一致性

---

## 用户体验

### 额外奖赏通知
1. **即时性**: 发放奖赏后立即收到通知
2. **信息完整**: 包含任务名称、金额、原因
3. **可追溯**: 通知关联到具体任务，可点击查看
4. **友好提示**: 使用"恭喜"等积极语言

### 管理员通知发布
1. **灵活性**: 支持多种发送方式
2. **便捷性**: 搜索用户、选择角色/岗位都很方便
3. **反馈明确**: 显示发送给了多少用户
4. **使用说明**: 页面底部提供详细说明

---

## 测试建议

### 额外奖赏通知测试
1. **正常流程**:
   - 管理员为已完成任务添加额外奖赏
   - 验证承接人收到通知
   - 验证通知内容正确（任务名、金额、原因）
   - 验证通知关联到正确的任务

2. **边界情况**:
   - 有原因和无原因的通知
   - 不同金额的通知
   - 验证通知类型为 BONUS_REWARD

### 管理员通知发布测试
1. **发送给所有用户**:
   - 验证所有用户都收到通知
   - 验证通知内容正确

2. **发送给指定用户**:
   - 选择1个用户，验证只有该用户收到
   - 选择多个用户，验证所有选中用户收到
   - 验证未选中用户不会收到

3. **发送给指定角色**:
   - 选择"普通用户"，验证所有普通用户收到
   - 选择"岗位管理员"，验证所有岗位管理员收到
   - 选择"超级管理员"，验证所有超级管理员收到

4. **发送给指定岗位**:
   - 选择某个岗位，验证该岗位的所有已批准用户收到
   - 验证未批准用户不会收到
   - 验证其他岗位用户不会收到

5. **权限测试**:
   - 普通用户尝试访问页面，验证被拒绝
   - 普通用户尝试调用API，验证返回403

6. **输入验证**:
   - 标题超过100字符，验证被拒绝
   - 内容超过500字符，验证被拒绝
   - 空标题或空内容，验证被拒绝
   - 无效的 targetType，验证被拒绝

---

## 相关文件

### 后端
- `packages/backend/src/models/Notification.ts` - 通知类型定义
- `packages/backend/src/services/NotificationService.ts` - 通知服务
- `packages/backend/src/services/TaskService.ts` - 任务服务（额外奖赏）
- `packages/backend/src/routes/notification.routes.ts` - 通知路由

### 前端
- `packages/frontend/src/pages/admin/NotificationBroadcastPage.tsx` - 通知发布页面
- `packages/frontend/src/api/notification.ts` - 通知API
- `packages/frontend/src/router/index.tsx` - 路由配置
- `packages/frontend/src/layouts/MainLayout.tsx` - 主布局（菜单）

---

## 未来扩展

### 1. 通知模板
- 预设常用通知模板
- 支持变量替换
- 模板管理功能

### 2. 定时发送
- 支持设置发送时间
- 定时任务调度
- 取消定时通知

### 3. 通知历史
- 查看已发送的通知
- 统计发送数量和阅读率
- 导出通知记录

### 4. 富文本支持
- 支持Markdown格式
- 支持图片和链接
- 更丰富的通知样式

### 5. 通知分组
- 按类型分组显示
- 按重要性排序
- 批量操作通知

### 6. 频率限制
- 限制管理员发送频率
- 防止通知轰炸
- 用户通知偏好设置

---

## 注意事项

1. **额外奖赏通知**:
   - 通知会立即发送，无法撤回
   - 通知内容包含敏感信息（金额），请确保准确
   - 通知关联到任务，用户可以点击查看任务详情

2. **管理员通知发布**:
   - 发送前请仔细检查通知内容
   - 发送给所有用户时要特别谨慎
   - 建议先测试发送给少数用户
   - 通知无法撤回或修改
   - 大量发送可能影响系统性能

3. **权限管理**:
   - 只有管理员可以发送通知
   - 建议定期审查通知发送记录
   - 防止滥用通知功能

4. **用户体验**:
   - 避免频繁发送通知
   - 通知内容要简洁明了
   - 重要通知可以考虑其他渠道（邮件等）

---

## 更新日志

### 2026年2月10日
- ✅ 添加额外奖赏通知功能
- ✅ 添加管理员通知发布功能
- ✅ 支持按角色发送通知
- ✅ 支持按岗位发送通知
- ✅ 创建通知发布页面
- ✅ 更新路由和菜单
- ✅ 完成文档编写
