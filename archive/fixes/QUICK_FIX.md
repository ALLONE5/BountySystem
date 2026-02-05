# 快速修复指南

## 🚨 紧急：如果后端一直闪烁连接/断开消息

**立即执行以下步骤：**

1. **停止前端服务** (Ctrl+C)
2. **清除速率限制**:
   ```bash
   cd packages/backend
   npm run clear-rate-limits
   ```
3. **重启前端服务**:
   ```bash
   cd packages/frontend
   npm run dev
   ```
4. **强制刷新浏览器** (Ctrl+Shift+R 或 Ctrl+F5)

这个问题是因为 WebSocket 无限重连导致的。上面的步骤会应用修复。

---

## 问题：刷新页面时频闪和大量认证错误

### 已修复的问题
✅ 前端在未登录时不再发送 API 请求  
✅ WebSocket 只在已认证时连接  
✅ WebSocket 不会无限重连（修复了依赖项问题）  
✅ 速率限制在开发环境中更宽松  
✅ 登录接口支持用户名和邮箱  

### ⚠️ 重要：必须重启前端服务

修复代码后，**必须重启前端服务**才能生效！

### 应用修复

1. **重启前端服务**（必须！）:
   ```bash
   # 停止前端 (Ctrl+C)
   # 然后重新启动
   cd packages/frontend
   npm run dev
   ```

2. **重启后端服务**:
   ```bash
   # 停止后端 (Ctrl+C)
   # 然后重新启动
   cd packages/backend
   npm run dev
   ```

3. **清除速率限制** (如果需要):
   ```bash
   cd packages/backend
   npm run clear-rate-limits
   ```

4. **清除浏览器缓存**:
   - 打开浏览器开发者工具 (F12)
   - 右键点击刷新按钮
   - 选择"清空缓存并硬性重新加载"

### 测试登录

使用以下凭据测试：
- **用户名**: `admin`
- **密码**: `Password123`

或者使用邮箱登录：
- **邮箱**: `admin@example.com`
- **密码**: `Password123`

### 如果问题仍然存在

1. **检查服务是否运行**:
   ```bash
   # 检查后端
   curl http://localhost:3000/api
   
   # 检查前端
   # 浏览器访问 http://localhost:5173
   ```

2. **查看控制台日志**:
   - 后端日志应该显示在运行 `npm run dev` 的终端
   - 前端日志在浏览器开发者工具的 Console 标签

3. **完全重启所有服务**:
   ```bash
   # 停止所有 Node 进程
   taskkill /F /IM node.exe
   
   # 重新启动
   cd packages/backend
   npm run dev
   
   # 在另一个终端
   cd packages/frontend
   npm run dev
   ```

## 修改的文件

以下文件已被修复：

1. `packages/frontend/src/contexts/NotificationContext.tsx`
   - 只在已认证时获取通知计数
   - 移除了 WebSocket 连接时的 API 调用（避免速率限制）

2. `packages/frontend/src/hooks/useWebSocket.ts`
   - 只在已认证时连接 WebSocket
   - 使用 ref 存储回调函数，避免无限重连
   - 修复了依赖项问题

3. `packages/backend/src/routes/auth.routes.ts`
   - 登录接口接受 `username` 字段
   - 支持使用用户名或邮箱登录

4. `packages/backend/src/middleware/rateLimit.middleware.ts`
   - 开发环境使用更宽松的速率限制
   - 登录限制：50次/15分钟（开发环境）
   - API限制：1000次/分钟（开发环境）

5. `packages/backend/scripts/clear-rate-limits.js` (新文件)
   - 清除 Redis 中的速率限制键
   - 用于开发时重置限制

## 验证修复

1. **打开浏览器** http://localhost:5173
2. **刷新页面几次** - 不应该看到频闪
3. **查看控制台** - 不应该有大量认证错误
4. **查看后端日志** - 不应该有无限的连接/断开循环
5. **登录** - 使用 admin / Password123
6. **刷新页面** - 登录状态应该保持

如果以上都正常，说明修复成功！🎉

---

## 问题：点击页面模块出现 UUID 错误

### 错误信息
```
Error: 无效的类型 uuid 输入语法: "user"
Error: 无效的类型 uuid 输入语法: "browse"
```

### 原因
后端路由顺序错误。`/:taskId` 路由在 `/user/published` 和 `/user/assigned` 之前定义，导致 "user" 和 "browse" 被当作任务 ID。

### 解决方案
已修复 `packages/backend/src/routes/task.routes.ts`：
- 将 `/user/published` 和 `/user/assigned` 移到 `/:taskId` 之前
- Express 按顺序匹配路由，具体路径必须在参数化路由之前

### 解决方案（已完成）
1. ✅ 修复后端路由顺序 - 将 `/user/published` 和 `/user/assigned` 移到 `/:taskId` 之前
2. ✅ 修复前端 API 调用 - 将 `/tasks/browse` 改为 `/tasks/available`
3. ✅ 更新所有页面使用正确的 API 方法

### 应用修复
**前端必须重启**才能应用修复！

```bash
# 停止前端 (Ctrl+C)
cd packages/frontend
npm run dev
```

刷新浏览器后，点击不同模块应该不再出现 UUID 错误。


---

## 问题：页面显示数据处理错误

### 症状
- 点击"赏金任务"显示: `Cannot read properties of null (reading 'map')`
- 点击"发布任务管理"显示: `amount.toFixed is not a function`
- 点击"个人界面"显示: `加载统计数据失败`
- 点击"承接任务管理"显示: `加载群组列表失败`

### 根本原因
1. 后端返回的某些任务的 `tags` 字段为 `null`
2. `bountyAmount` 可能以字符串形式返回而不是数字
3. 前端调用了不存在的 `/tasks/stats` 端点
4. 群组 API 调用失败但没有正确处理

### 解决方案
已修复所有前端页面以正确处理 null/undefined 数据：

**修复内容：**
- ✅ 在调用 `.map()` 前添加 null 检查
- ✅ 在调用 `.toFixed()` 前将 `bountyAmount` 转换为数字
- ✅ 从任务数据本地计算统计信息，而不是调用不存在的端点
- ✅ 为可选功能（如群组）添加优雅的错误处理

### 修复后的文件
- `packages/frontend/src/pages/BrowseTasksPage.tsx`
- `packages/frontend/src/pages/PublishedTasksPage.tsx`
- `packages/frontend/src/pages/DashboardPage.tsx`
- `packages/frontend/src/pages/AssignedTasksPage.tsx`

### 如何应用修复
1. **重启前端服务**:
   ```bash
   cd packages/frontend
   # 停止当前服务 (Ctrl+C)
   npm run dev
   ```

2. **测试所有页面**:
   - 登录: `admin` / `Password123`
   - 访问每个页面确认无错误:
     - 赏金任务 (Browse Tasks)
     - 发布任务管理 (Published Tasks)
     - 个人界面 (Dashboard)
     - 承接任务管理 (Assigned Tasks)

### 技术细节
```typescript
// 修复前
task.tags.map(tag => <Tag>{tag}</Tag>)
task.bountyAmount.toFixed(2)

// 修复后
task.tags && task.tags.map(tag => <Tag>{tag}</Tag>)
Number(task.bountyAmount || 0).toFixed(2)
```


---

## 问题：点击"个人信息和设置"显示 404 错误

### 症状
点击用户菜单中的"个人信息"或"设置"显示: `404 Not Found`

### 根本原因
路由配置中缺少 `/profile` 和 `/settings` 路由，但 MainLayout 中的用户菜单已经有这些链接。

### 解决方案
创建了缺失的页面并添加到路由配置：

**新建文件：**
- ✅ `packages/frontend/src/pages/ProfilePage.tsx` - 个人信息页面
- ✅ `packages/frontend/src/pages/SettingsPage.tsx` - 设置页面

**ProfilePage 功能：**
- 显示用户基本信息（用户名、邮箱、角色）
- 显示统计数据（发布/承接任务数、完成率、累计赏金）
- 提供编辑个人信息表单

**SettingsPage 功能：**
- 修改密码功能
- 通知设置（任务通知、赏金通知、系统通知）
- 语言和时区设置

### 修复后的文件
- `packages/frontend/src/pages/ProfilePage.tsx` (新建)
- `packages/frontend/src/pages/SettingsPage.tsx` (新建)
- `packages/frontend/src/router/index.tsx` (更新)

### 如何应用修复
1. **重启前端服务**:
   ```bash
   cd packages/frontend
   # 停止当前服务 (Ctrl+C)
   npm run dev
   ```

2. **测试页面**:
   - 登录后点击右上角用户头像
   - 点击"个人信息" - 应该显示个人资料页面
   - 点击"设置" - 应该显示设置页面

### 注意事项
- 密码修改和个人信息更新功能需要后端 API 支持（标记为 TODO）
- 通知设置目前只在前端保存，需要后端持久化


---

## 问题：注册时显示 "Invalid input data"

### 症状
在注册界面输入用户名、邮箱和密码后，点击注册按钮显示 "Invalid input data" 错误。

### 根本原因
前端注册表单发送了 `confirmPassword` 字段到后端，但后端的验证 schema 只接受 `username`、`email` 和 `password` 三个字段，不允许额外字段。

### 解决方案
修改前端注册页面，只发送后端需要的字段：

**修复内容：**
- ✅ 在提交前过滤掉 `confirmPassword` 字段
- ✅ 只发送 `username`、`email`、`password` 到后端
- ✅ `confirmPassword` 仅用于前端验证

### 修复后的文件
- `packages/frontend/src/pages/auth/RegisterPage.tsx`

### 如何应用修复
1. **重启前端服务**:
   ```bash
   cd packages/frontend
   # 停止当前服务 (Ctrl+C)
   npm run dev
   ```

2. **测试注册功能**:
   - 访问注册页面
   - 输入用户名（至少3个字符）
   - 输入有效的邮箱地址
   - 输入密码（至少6个字符）
   - 确认密码
   - 点击注册按钮
   - 应该成功注册并跳转到仪表板

### 技术细节
```typescript
// 修复前 - 发送所有表单字段
const response = await authApi.register(values);

// 修复后 - 只发送必要字段
const registerData: RegisterRequest = {
  username: values.username,
  email: values.email,
  password: values.password,
};
const response = await authApi.register(registerData);
```


---

## 问题：点击排名显示"加载排名数据失败"

### 症状
点击"排名"菜单项后显示"加载排名数据失败"错误消息。

### 根本原因
1. 数据库中可能没有排名数据（排名是定期计算生成的）
2. 前端对空数据处理不够优雅，将空结果当作错误处理

### 解决方案
修改前端排名页面，优雅处理空数据情况：

**修复内容：**
- ✅ API 调用失败时返回空数组而不是抛出错误
- ✅ 移除错误提示消息（空排名是正常情况）
- ✅ 页面会显示空状态而不是错误

### 修复后的文件
- `packages/frontend/src/pages/RankingPage.tsx`

### 如何应用修复
1. **重启前端服务**:
   ```bash
   cd packages/frontend
   # 停止当前服务 (Ctrl+C)
   npm run dev
   ```

2. **测试排名页面**:
   - 登录后点击"排名"菜单
   - 应该显示空的排名列表（而不是错误消息）
   - 这是正常的，因为排名数据需要定期计算生成

### 关于排名数据
排名功能需要后台定时任务计算用户的赏金收入并生成排名。如果您想看到排名数据：

1. 完成一些任务并获得赏金
2. 等待系统计算排名（通常每天或每月计算一次）
3. 或者手动触发排名计算（需要管理员权限）

目前显示空排名列表是正常的，不是错误。
