# 故障排除指南

## 常见"错误"（实际上是正常行为）

### ❌ 误解：Authentication Error

**看到的错误**:
```
Error: AuthenticationError: No token provided
```

**实际情况**: ✅ **这是正常的！**

**原因**:
- 前端应用在加载时会尝试获取用户数据
- 如果用户还没有登录，就没有认证token
- 后端正确地拒绝了未认证的请求

**解决方案**: 
- 这不需要"修复"
- 用户登录后，这些错误就会消失
- 这证明你的认证系统正常工作

**⚠️ 如果刷新页面时出现大量认证错误和频闪**:
- 已修复：`NotificationContext` 和 `useWebSocket` 现在只在已认证时才会发送请求
- 如果仍有问题，请重启前端服务

---

### ❌ 误解：Rate Limit Error

**看到的错误**:
```
Error: RATE_LIMIT_EXCEEDED: Too many requests, please try again later
```

**实际情况**: ✅ **这是安全功能！**

**原因**:
- 系统检测到短时间内有太多请求
- 速率限制器正在保护API不被滥用
- 这是一个重要的安全功能

**当前限制**:
- IP限制: 60请求/分钟
- API限制: 100请求/分钟
- 登录限制: 5次尝试/15分钟

**解决方案**:
- 等待60秒后重试
- 在开发环境中，可以临时调整限制（见下文）
- 运行 `cd packages/backend && npm run clear-rate-limits` 清除速率限制

---

## 真正的错误 vs 正常日志

### ✅ 正常日志（不用担心）

1. **Authentication errors** - 未登录用户访问受保护的端点
2. **Rate limit exceeded** - 速率限制正常工作
3. **Not found errors** - 访问不存在的资源
4. **Validation errors** - 输入验证正常工作

### ❌ 真正的错误（需要关注）

1. **Database connection failed** - 数据库连接问题
2. **Redis connection failed** - Redis连接问题
3. **Uncaught exceptions** - 未捕获的异常
4. **Server crash** - 服务器崩溃

---

## 开发环境调整

### 临时禁用速率限制（仅开发环境）

如果在开发时速率限制太严格，可以临时调整：

**方法1: 修改环境变量**

在 `packages/backend/.env` 中添加：
```env
RATE_LIMIT_ENABLED=false
```

**方法2: 修改速率限制配置**

编辑 `packages/backend/src/middleware/rateLimit.middleware.ts`:

```typescript
// 开发环境使用更宽松的限制
export const ipRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: process.env.NODE_ENV === 'development' ? 1000 : 60, // 开发环境1000次
  keyPrefix: 'ip',
});
```

**⚠️ 警告**: 生产环境必须启用速率限制！

---

## 验证系统正常工作

### 1. 检查API响应

```bash
curl http://localhost:3000/api
```

**期望输出**:
```json
{"message":"Bounty Hunter Platform API","version":"1.0.0"}
```

### 2. 检查健康状态

```bash
curl http://localhost:3000/health
```

**期望输出**:
```json
{"status":"ok","timestamp":"2025-12-11T...","environment":"development"}
```

### 3. 测试注册功能

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123456"}'
```

### 4. 测试登录功能

**使用用户名登录**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Password123"}'
```

**使用邮箱登录**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@example.com","password":"Password123"}'
```

**期望输出**: 包含JWT token的响应

**注意**: 
- 登录接口的字段名是 `username`，但可以接受用户名或邮箱
- 默认测试账号密码是 `Password123`

---

## 前端访问

### 正常流程

1. **访问应用**: http://localhost:5173
2. **看到登录页面**: 这是正常的
3. **注册新账号**: 填写表单注册
4. **登录**: 使用注册的账号登录
5. **使用应用**: 登录后可以使用所有功能

### 前端常见"错误"

**控制台看到401错误**:
- ✅ 正常！未登录时访问受保护的资源
- 登录后会自动消失

**控制台看到429错误**:
- ✅ 正常！速率限制保护
- 等待一分钟后重试

**WebSocket连接失败**:
- 检查后端是否运行
- 检查端口3000是否可访问

---

## 数据库问题

### 检查数据库连接

```bash
psql -U postgres -d postgres -c "SELECT 1;"
```

### 查看数据库表

```bash
psql -U postgres -d postgres -c "\dt"
```

### 重置数据库（如果需要）

```bash
# 删除所有表
psql -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 重新运行迁移
psql -U postgres -d postgres -f packages/database/migrations/20241210_000001_create_core_tables.sql
psql -U postgres -d postgres -f packages/database/migrations/20241210_000002_create_auxiliary_tables.sql
```

---

## Redis问题

### 检查Redis连接

```bash
redis-cli ping
```

**期望输出**: `PONG`

### 清空Redis缓存

```bash
redis-cli FLUSHALL
```

---

## 日志分析

### 正常的日志模式

```
✅ Database connection successful
✅ Redis client connected
✅ Redis client ready
✅ WebSocket service initialized
✅ Server running on port 3000
```

### 需要关注的日志

```
❌ Database connection failed
❌ Redis connection failed
❌ Uncaught Exception
❌ Unhandled Rejection
```

---

## 性能监控

### 查看进程状态

```bash
# Windows
tasklist | findstr node

# 查看端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

### 查看内存使用

```bash
# Windows PowerShell
Get-Process node | Select-Object Name, CPU, WorkingSet
```

---

## 重启服务

### 完全重启

1. 停止所有Node进程:
   ```bash
   taskkill /F /IM node.exe
   ```

2. 重新启动:
   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

### 仅重启后端

```bash
# 找到后端进程ID
tasklist | findstr tsx

# 停止进程
taskkill /F /PID <进程ID>

# 重新启动
npm run dev:backend
```

---

## 获取帮助

### 检查日志

后端日志会显示在运行 `npm run dev:backend` 的终端中。

### 常用调试命令

```bash
# 查看后端进程
tasklist | findstr node

# 查看端口占用
netstat -ano | findstr :3000

# 测试API
curl http://localhost:3000/api

# 查看Redis
redis-cli INFO

# 查看PostgreSQL
psql -U postgres -d postgres -c "SELECT version();"
```

---

## 总结

记住：
- ✅ Authentication errors 在未登录时是**正常的**
- ✅ Rate limit errors 表示安全功能**正常工作**
- ✅ 这些"错误"证明系统正确地保护自己
- ❌ 只有连接失败和崩溃才是真正的问题

**系统正常运行的标志**:
1. 可以访问 http://localhost:5173
2. 可以注册新用户
3. 可以登录
4. 登录后可以使用功能

如果这些都能做到，系统就是正常的！🎉
