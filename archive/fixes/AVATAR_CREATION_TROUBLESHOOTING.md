# 头像创建失败 - 故障排查指南

## 问题描述
管理员创建头像时显示失败

## 已修复的问题

### 1. SQL占位符错误 ✅
**问题**: `AvatarService.ts` 中的 `updateAvatar` 方法使用了错误的SQL占位符格式
**原因**: 使用了 `${paramIndex}` 而不是 `$${paramIndex}`
**修复**: 已修复所有SQL占位符，现在使用正确的格式 `$1`, `$2`, `$3` 等

## 排查步骤

### 1. 检查后端是否运行
```bash
# 检查后端进程
curl http://localhost:3000/health

# 如果没有响应，启动后端
cd packages/backend
npm run dev
```

### 2. 检查数据库连接
```bash
# 确保PostgreSQL正在运行
# 检查.env文件中的数据库配置
cat packages/backend/.env | grep DB_
```

### 3. 检查avatars表是否存在
```sql
-- 连接到数据库
psql -U postgres -d bounty_hunter

-- 检查avatars表
\d avatars

-- 应该看到以下列：
-- id, name, image_url, required_rank, created_at
```

### 4. 测试API端点
```bash
# 首先登录获取admin token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Password123"}'

# 使用返回的token测试创建头像
curl -X POST http://localhost:3000/api/avatars \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "测试头像",
    "imageUrl": "https://via.placeholder.com/150",
    "requiredRank": 10
  }'
```

### 5. 使用测试脚本
```bash
cd packages/backend

# 首先获取admin token（登录后从响应中获取）
# 然后运行测试脚本
ADMIN_TOKEN=your_admin_token node scripts/test-avatar-creation.js
```

## 常见错误及解决方案

### 错误 1: "Failed to create avatar"
**可能原因**:
- 后端未运行
- 数据库连接失败
- avatars表不存在

**解决方案**:
1. 启动后端: `cd packages/backend && npm run dev`
2. 检查数据库连接
3. 运行数据库迁移: `cd packages/database && node scripts/run_migrations.js`

### 错误 2: "Only super admins can create avatars"
**可能原因**:
- 使用的不是super_admin账户
- Token无效或过期

**解决方案**:
1. 使用admin账户登录 (username: `admin`, password: `Password123`)
2. 确保使用最新的token

### 错误 3: "Name, imageUrl, and requiredRank are required"
**可能原因**:
- 请求数据不完整
- 字段名称错误

**解决方案**:
确保请求包含所有必需字段：
```json
{
  "name": "头像名称",
  "imageUrl": "https://example.com/avatar.png",
  "requiredRank": 10
}
```

### 错误 4: SQL语法错误
**可能原因**:
- SQL占位符格式错误（已修复）

**解决方案**:
- 确保使用最新的代码
- 重启后端服务

## 前端调试

### 1. 检查浏览器控制台
打开浏览器开发者工具 (F12)，查看：
- Console标签：查看JavaScript错误
- Network标签：查看API请求和响应

### 2. 检查API请求
在Network标签中找到失败的请求：
- 查看Request Headers（确认Authorization header存在）
- 查看Request Payload（确认数据格式正确）
- 查看Response（查看错误信息）

### 3. 常见前端错误

**错误**: "Failed to create avatar"
```javascript
// 检查avatarApi.createAvatar的调用
// 确保传递了正确的参数
await avatarApi.createAvatar({
  name: '头像名称',
  imageUrl: 'https://example.com/avatar.png',
  requiredRank: 10
});
```

## 验证修复

### 1. 重启服务
```bash
# 重启后端
cd packages/backend
# 停止当前进程 (Ctrl+C)
npm run dev

# 重启前端
cd packages/frontend
# 停止当前进程 (Ctrl+C)
npm run dev
```

### 2. 测试完整流程
1. 以admin身份登录
2. 进入 管理功能 → 头像管理
3. 点击"添加头像"
4. 填写信息：
   - 名称: 测试头像
   - 图片URL: https://via.placeholder.com/150
   - 所需排名: 10
5. 点击"保存"
6. 应该看到成功消息并在列表中看到新头像

## 后端日志检查

查看后端控制台输出，寻找：
- SQL错误
- 认证错误
- 数据验证错误

常见日志模式：
```
Error creating avatar: <错误信息>
Error: <具体错误>
```

## 数据库直接检查

如果API调用成功但前端显示失败，检查数据库：

```sql
-- 连接数据库
psql -U postgres -d bounty_hunter

-- 查看所有头像
SELECT * FROM avatars;

-- 查看最近创建的头像
SELECT * FROM avatars ORDER BY created_at DESC LIMIT 5;
```

## 联系支持

如果以上步骤都无法解决问题，请提供：
1. 后端控制台完整错误日志
2. 浏览器控制台错误信息
3. Network标签中的请求/响应详情
4. 数据库avatars表结构 (`\d avatars`)

## 快速修复检查清单

- [ ] 后端正在运行
- [ ] 数据库连接正常
- [ ] avatars表存在
- [ ] 使用admin账户登录
- [ ] Token有效且未过期
- [ ] 请求数据格式正确
- [ ] SQL占位符已修复（最新代码）
- [ ] 前端已重启
- [ ] 后端已重启

---

**最后更新**: 2025-12-12
**状态**: SQL占位符错误已修复
