# 赏金猎人平台 - 后端

Node.js + TypeScript + Express 后端服务，提供完整的 REST API 和 WebSocket 实时通信。

---

## 技术栈

- 运行时: Node.js 18+ + TypeScript (ESM)
- 框架: Express.js 4.x
- 数据库: PostgreSQL 14+ (pg 驱动)
- 缓存: Redis 6+ (ioredis)
- 认证: JWT (jsonwebtoken)
- 实时通信: Socket.IO 4.x
- 日志: Winston + winston-daily-rotate-file
- 验证: Zod
- 测试: Vitest + Supertest
- 进程管理: PM2 (生产环境)

---

## 项目结构

```
src/
├── config/           # 配置模块
│   ├── container.ts  # 依赖注入容器
│   ├── database.ts   # PostgreSQL 连接池
│   ├── env.ts        # 环境变量解析
│   ├── logger.ts     # Winston 日志配置
│   └── redis.ts      # Redis 客户端
├── constants/        # 全局常量
├── middleware/       # Express 中间件
│   ├── audit.middleware.ts       # 审计日志中间件
│   ├── auth.middleware.ts        # JWT 认证
│   ├── cache.middleware.ts       # 响应缓存
│   ├── errorHandler.middleware.ts # 全局错误处理
│   ├── performance.middleware.ts  # 性能追踪
│   ├── permission.middleware.ts   # 权限控制
│   ├── queryPerformance.middleware.ts # 慢查询监控
│   ├── rateLimit.middleware.ts    # 速率限制
│   └── validation.middleware.ts   # 请求验证
├── models/           # TypeScript 接口和枚举 (18 个模型)
├── repositories/     # 数据访问层 (10 个 Repository)
├── routes/           # 路由定义 (23 个路由文件)
├── services/         # 业务逻辑层 (50+ 个 Service)
├── utils/            # 工具类
│   ├── decorators/   # 缓存、错误处理装饰器
│   ├── mappers/      # Model → DTO 转换器
│   ├── DIContainer.ts
│   ├── errors.ts     # 自定义错误类
│   ├── jwt.ts
│   ├── pagination.ts
│   ├── PermissionChecker.ts
│   ├── QueryBuilder.ts
│   └── TransactionManager.ts
├── workers/          # 后台队列 Worker
└── index.ts          # 应用入口
```

---

## API 路由总览

| 前缀 | 说明 | 认证 |
|------|------|------|
| `POST /api/auth/register` | 用户注册 | 无 |
| `POST /api/auth/login` | 用户登录 | 无 |
| `GET /api/auth/me` | 获取当前用户 | JWT |
| `GET /api/public/*` | 公开数据 | 无 |
| `GET /api/system-config` | 公开系统配置 | 无 |
| `/api/users` | 用户管理 | JWT |
| `/api/tasks` | 任务 CRUD + 全生命周期操作 | JWT |
| `/api/positions` | 岗位管理 | JWT |
| `/api/groups` | 任务组管理 | JWT |
| `/api/project-groups` | 项目组管理 | JWT |
| `/api/dependencies` | 任务依赖关系 | JWT |
| `/api/bounty` | 赏金算法和分配 | JWT |
| `/api/bounty-history` | 赏金历史记录 | JWT |
| `/api/rankings` | 排行榜 | JWT |
| `/api/avatars` | 头像管理 | JWT |
| `/api/notifications` | 通知管理 | JWT |
| `/api/upload` | 文件上传 | JWT |
| `/api/admin/*` | 管理员功能 | JWT + Admin |
| `/api/admin/system` | 系统配置管理 | JWT + Admin |
| `/api/admin/audit` | 审计日志 (管理员) | JWT + Admin |
| `/api/dev/audit` | 审计日志 (开发者) | JWT + Developer |
| `/api/system-monitor` | 系统监控 | JWT + Developer |
| `/api/performance` | 性能监控 | JWT + Developer |
| `/api/metrics` | 实时指标 | JWT |
| `/api/scheduler` | 定时任务管理 | JWT + Admin |
| `GET /health` | 健康检查 | 无 |

---

## 用户角色

| 角色 | 说明 | 权限 |
|------|------|------|
| `user` | 普通用户 | 浏览任务、承接任务、个人管理 |
| `position_admin` | 岗位管理员 | 用户权限 + 岗位管理、任务审核 |
| `super_admin` | 超级管理员 | 全部权限 |
| `developer` | 开发者 | 用户权限 + 系统监控、审计日志、系统配置 |

---

## 认证流程

所有受保护路由需要在请求头中携带 JWT Token：

```http
Authorization: Bearer <token>
```

JWT payload 结构：
```json
{
  "userId": "uuid",
  "username": "string",
  "role": "user | position_admin | super_admin | developer"
}
```

---

## 错误响应格式

```json
{
  "code": "AUTHENTICATION_ERROR",
  "message": "Invalid email or password",
  "timestamp": "2026-03-19T..."
}
```

| 错误类 | HTTP 状态码 | 说明 |
|--------|------------|------|
| `ValidationError` | 400 | 请求参数无效 |
| `AuthenticationError` | 401 | 未认证或 Token 无效 |
| `AuthorizationError` | 403 | 权限不足 |
| `NotFoundError` | 404 | 资源不存在 |
| `ConflictError` | 409 | 资源冲突（如重复邮箱） |

---

## 中间件说明

### 认证中间件
```typescript
import { authenticate } from './middleware/auth.middleware.js';
import { requireRole } from './middleware/permission.middleware.js';

// 需要登录
router.get('/protected', authenticate, handler);

// 需要特定角色
router.post('/admin-only', authenticate, requireRole(['super_admin']), handler);
```

### 审计日志中间件
```typescript
import { auditLog } from './middleware/audit.middleware.js';
import { AuditAction, AuditResource } from './models/AuditLog.js';

router.post('/tasks', authenticate, auditLog(AuditAction.CREATE_TASK, AuditResource.TASK), handler);
```

### 缓存中间件
```typescript
import { cacheMiddleware } from './middleware/cache.middleware.js';

router.get('/rankings', cacheMiddleware(300), handler); // 缓存 300 秒
```

---

## 环境变量

复制 `.env.example` 为 `.env` 并按需修改：

```bash
cp .env.example .env
```

关键配置项：

```env
PORT=3001
NODE_ENV=development

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bounty_hunter
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建
npm run build

# 生产启动
npm start

# 运行测试
npm test

# 启动后台 Worker
npm run workers
```

---

## 测试

测试框架使用 Vitest + Supertest，测试文件与源文件同目录（`*.test.ts`）。

```bash
npm test
```

测试覆盖范围：
- JWT 工具函数
- 权限服务
- 用户服务
- 任务服务
- 赏金服务
- 通知服务
- 缓存服务
- 排名服务
- 中间件（速率限制、验证）
- Repository 连接
- DI 容器
- 工具类（Validator、TransactionManager 等）

---

## 数据库管理

```bash
# 检查连接
node scripts/db-manager.js check

# 初始化（迁移 + 种子数据）
node scripts/db-manager.js seed

# 仅运行迁移
cd packages/database && node scripts/run_migrations.js

# 重置管理员密码
node scripts/db-manager.js reset-admin

# 刷新排名数据
node scripts/db-manager.js refresh-ranks
```

---

## 生产部署

使用 PM2 管理进程：

```bash
npm run build
pm2 start ecosystem.config.js
```

日志文件位于 `logs/` 目录：
- `combined.log` — 所有日志
- `error.log` — 仅错误日志

---

## 架构说明

后端采用分层架构：

```
Routes → Middleware → Services → Repositories → Database
```

- Routes: 路由定义和请求解析
- Middleware: 认证、权限、缓存、审计、限流
- Services: 业务逻辑，通过 DI 容器注入依赖
- Repositories: 封装 SQL 查询，使用参数化查询防止注入
- Database: PostgreSQL 连接池

WebSocket 通过 `WebSocketService` 管理，支持按用户 ID 推送实时通知。
