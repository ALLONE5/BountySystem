# Backend文件结构说明

## 目录概览

```
packages/backend/
├── src/                    # 源代码目录
│   ├── config/            # 配置文件
│   ├── middleware/        # 中间件
│   ├── models/            # 数据模型
│   ├── routes/            # 路由定义
│   ├── services/          # 业务逻辑服务
│   ├── utils/             # 工具函数
│   ├── workers/           # 后台任务处理
│   └── index.ts           # 应用入口
├── scripts/               # 脚本工具
├── dist/                  # 编译输出目录
├── node_modules/          # 依赖包
└── 配置文件
```

---

## 📁 src/ - 源代码目录

### 🔧 src/config/ - 配置管理

| 文件 | 用途 |
|------|------|
| `database.ts` | PostgreSQL数据库连接配置和连接池管理 |
| `redis.ts` | Redis连接配置，用于缓存和会话管理 |
| `env.ts` | 环境变量加载和验证 |
| `logger.ts` | 日志配置（Winston） |

**核心功能**：
- 数据库连接池管理
- Redis客户端初始化
- 环境变量验证和类型安全
- 日志级别配置



---

### 🛡️ src/middleware/ - 中间件层

| 文件 | 用途 |
|------|------|
| `auth.middleware.ts` | JWT身份验证中间件 |
| `permission.middleware.ts` | 权限检查中间件（角色和岗位权限） |
| `rateLimit.middleware.ts` | 速率限制中间件（防止API滥用） |
| `cache.middleware.ts` | 缓存中间件（Redis缓存） |
| `validation.middleware.ts` | 请求参数验证中间件（Zod） |
| `errorHandler.middleware.ts` | 全局错误处理中间件 |

**测试文件**：
- `rateLimit.middleware.test.ts` - 速率限制测试
- `validation.middleware.test.ts` - 参数验证测试

**文档**：
- `SECURITY.md` - 安全实现说明
- `SECURITY_IMPLEMENTATION_SUMMARY.md` - 安全实现总结

**核心功能**：
- JWT token验证和解析
- 基于角色的访问控制（RBAC）
- IP和用户级别的速率限制
- Redis缓存策略
- 请求参数验证和清理

---

### 📦 src/models/ - 数据模型

| 文件 | 用途 |
|------|------|
| `User.ts` | 用户模型（用户信息、角色、权限） |
| `Task.ts` | 任务模型（任务信息、状态、赏金） |
| `Position.ts` | 岗位模型（岗位定义、技能要求） |
| `TaskGroup.ts` | 任务组群模型（团队协作） |
| `TaskDependency.ts` | 任务依赖模型（任务间依赖关系） |
| `TaskAssistant.ts` | 任务协助者模型（赏金分配） |
| `Notification.ts` | 通知模型（系统通知） |
| `Ranking.ts` | 排名模型（用户排名数据） |
| `Avatar.ts` | 头像模型（用户头像） |
| `BountyAlgorithm.ts` | 赏金算法模型（赏金计算规则） |
| `AdminBudget.ts` | 管理员预算模型（预算管理） |
| `TaskReview.ts` | 任务评审模型（任务评分） |
| `Comment.ts` | 评论模型（任务评论） |
| `Attachment.ts` | 附件模型（任务附件） |

**核心功能**：
- TypeScript类型定义
- 数据传输对象（DTO）
- 枚举类型定义
- 数据验证规则

---

### 🛣️ src/routes/ - 路由定义

| 文件 | 路由前缀 | 用途 |
|------|---------|------|
| `auth.routes.ts` | `/api/auth` | 认证相关（登录、注册、登出） |
| `user.routes.ts` | `/api/users` | 用户管理（个人信息、岗位申请） |
| `task.routes.ts` | `/api/tasks` | 任务管理（CRUD、承接、完成） |
| `position.routes.ts` | `/api/positions` | 岗位管理（岗位CRUD、权限分配） |
| `group.routes.ts` | `/api/groups` | 组群管理（创建、成员管理） |
| `dependency.routes.ts` | `/api/dependencies` | 任务依赖管理 |
| `bounty.routes.ts` | `/api/bounty` | 赏金管理（算法、分配） |
| `notification.routes.ts` | `/api/notifications` | 通知管理（查询、标记已读） |
| `ranking.routes.ts` | `/api/rankings` | 排名管理（查询、计算） |
| `avatar.routes.ts` | `/api/avatars` | 头像管理（查询、解锁） |
| `admin.routes.ts` | `/api/admin` | 管理员功能（用户管理、审核） |
| `scheduler.routes.ts` | `/api/scheduler` | 定时任务管理 |

**核心功能**：
- RESTful API端点定义
- 路由参数验证
- 中间件应用（认证、权限、速率限制）
- 请求处理和响应



---

### 🔨 src/services/ - 业务逻辑服务

#### 核心服务

| 文件 | 用途 |
|------|------|
| `UserService.ts` | 用户管理（注册、登录、个人信息） |
| `TaskService.ts` | 任务管理（创建、更新、承接、完成） |
| `PositionService.ts` | 岗位管理（岗位CRUD、权限分配） |
| `GroupService.ts` | 组群管理（创建、成员管理、任务分配） |
| `DependencyService.ts` | 任务依赖管理（依赖检查、循环检测） |
| `BountyService.ts` | 赏金计算（基于算法计算任务赏金） |
| `BountyDistributionService.ts` | 赏金分配（分配给承接者和协助者） |
| `NotificationService.ts` | 通知管理（创建、查询、推送） |
| `RankingService.ts` | 排名管理（计算、查询用户排名） |
| `AvatarService.ts` | 头像管理（查询、解锁条件检查） |
| `PermissionService.ts` | 权限管理（权限检查、角色验证） |

#### 辅助服务

| 文件 | 用途 |
|------|------|
| `TaskAssistantService.ts` | 任务协助者管理 |
| `TaskReviewService.ts` | 任务评审管理 |
| `CommentService.ts` | 评论管理 |
| `AttachmentService.ts` | 附件管理 |
| `ReportService.ts` | 报表生成 |
| `SchedulerService.ts` | 定时任务调度 |
| `CacheService.ts` | 缓存管理（Redis） |
| `QueueService.ts` | 消息队列管理（BullMQ） |
| `WebSocketService.ts` | WebSocket实时通信 |
| `AsyncNotificationService.ts` | 异步通知处理 |
| `NotificationPushService.ts` | 通知推送服务 |
| `DatabaseOptimizationService.ts` | 数据库优化（物化视图） |

#### 测试文件

| 文件 | 测试内容 |
|------|---------|
| `UserService.test.ts` | 用户服务测试 |
| `TaskService.test.ts` | 任务服务测试 |
| `PositionService.test.ts` | 岗位服务测试 |
| `GroupService.test.ts` | 组群服务测试 |
| `DependencyService.test.ts` | 依赖服务测试 |
| `DependencyBlocking.test.ts` | 依赖阻塞测试 |
| `BountyService.test.ts` | 赏金计算测试 |
| `BountyDistributionService.test.ts` | 赏金分配测试 |
| `NotificationService.test.ts` | 通知服务测试 |
| `NotificationPushService.test.ts` | 通知推送测试 |
| `RankingService.test.ts` | 排名服务测试 |
| `AvatarService.test.ts` | 头像服务测试 |
| `PermissionService.test.ts` | 权限服务测试 |
| `SchedulerService.test.ts` | 调度服务测试 |
| `TaskReviewService.test.ts` | 评审服务测试 |
| `CacheService.test.ts` | 缓存服务测试 |

#### 文档

| 文件 | 内容 |
|------|------|
| `BOUNTY_SYSTEM.md` | 赏金系统设计文档 |
| `BOUNTY_DISTRIBUTION_SYSTEM.md` | 赏金分配系统文档 |
| `DEPENDENCY_SYSTEM.md` | 任务依赖系统文档 |
| `GROUP_SYSTEM.md` | 组群系统文档 |
| `NOTIFICATION_SYSTEM.md` | 通知系统文档 |
| `RANKING_AVATAR_SYSTEM.md` | 排名和头像系统文档 |
| `RANKING_AVATAR_IMPLEMENTATION_SUMMARY.md` | 排名头像实现总结 |
| `AVATAR_IMPLEMENTATION_SUMMARY.md` | 头像实现总结 |
| `SCHEDULER_SYSTEM.md` | 调度系统文档 |
| `SCHEDULER_IMPLEMENTATION_SUMMARY.md` | 调度实现总结 |
| `PROGRESS_TRACKING_IMPLEMENTATION_SUMMARY.md` | 进度跟踪实现总结 |
| `USER_PROFILE_MANAGEMENT.md` | 用户资料管理文档 |
| `CACHING_STRATEGY.md` | 缓存策略文档 |

**核心功能**：
- 业务逻辑封装
- 数据库操作
- 事务管理
- 错误处理
- 数据验证



---

### 🔧 src/utils/ - 工具函数

| 文件 | 用途 |
|------|------|
| `errors.ts` | 自定义错误类（ValidationError, NotFoundError等） |
| `jwt.ts` | JWT token生成和验证工具 |
| `asyncHandler.ts` | 异步路由处理器包装 |

**测试文件**：
- `jwt.test.ts` - JWT工具测试

**核心功能**：
- 统一的错误处理
- JWT token管理
- 异步错误捕获

---

### ⚙️ src/workers/ - 后台任务处理

| 文件 | 用途 |
|------|------|
| `QueueWorker.ts` | 消息队列工作进程（处理异步任务） |
| `startWorkers.ts` | 启动后台工作进程 |

**文档**：
- `ASYNC_PROCESSING.md` - 异步处理系统文档

**核心功能**：
- 异步任务处理
- 通知发送
- 定时任务执行
- 后台数据处理

---

### 🚀 src/index.ts - 应用入口

**功能**：
- Express应用初始化
- 中间件配置
- 路由注册
- 数据库连接
- Redis连接
- WebSocket服务初始化
- 错误处理
- 服务器启动



---

## 📜 scripts/ - 脚本工具目录

### 数据库管理脚本

| 文件 | 用途 |
|------|------|
| `create_db.ts` | 创建数据库 |
| `setup_db.ts` | 初始化数据库结构 |
| `reset_db.ts` | 重置数据库 |
| `seed_db.ts` | 填充初始数据 |
| `run-migration.js` | 运行数据库迁移 |
| `list_tables.ts` | 列出所有表 |
| `check_postgres_db.ts` | 检查PostgreSQL连接 |

### 数据管理脚本

| 文件 | 用途 |
|------|------|
| `seed-enhanced-test-data.js` | 填充增强测试数据（包含子任务和组群任务） |
| `seed-bounty-transactions.cjs` | 填充赏金交易数据 |
| `populate-group-members.js` | 填充组群成员关系 |
| `populate-group-tasks.js` | 填充组群任务 |
| `rebuild-rankings.js` | 重建排名数据 |
| `inject_project_groups.ts` | 注入项目组数据 |
| `clean-orphaned-notifications.cjs` | 清理孤立通知 |

### 用户管理脚本

| 文件 | 用途 |
|------|------|
| `reset_admin_password.ts` | 重置管理员密码 |
| `check_admin_password.ts` | 检查管理员密码 |
| `check_admin_data.ts` | 检查管理员数据 |
| `check_admin_tasks.ts` | 检查管理员任务 |
| `assign_data_to_admin.ts` | 分配数据给管理员 |
| `test-user-search.js` | 测试用户搜索 |
| `check-developer2.js` | 检查developer2用户 |
| `check-user2.js` | 检查user2用户 |

### 任务管理脚本

| 文件 | 用途 |
|------|------|
| `create_available_tasks.ts` | 创建可用任务 |
| `check_available_tasks.ts` | 检查可用任务 |
| `debug_task_service.ts` | 调试任务服务 |
| `verify-group-tasks.js` | 验证组群任务 |
| `find-500-bounty.js` | 查找500赏金的任务 |
| `find-high-bounty.js` | 查找高赏金任务 |
| `fix-developer2-bounty.js` | 修复developer2的赏金 |

### 排名和头像脚本

| 文件 | 用途 |
|------|------|
| `rebuild-rankings.js` | 重建排名 |
| `force-refresh-rankings.ts` | 强制刷新排名 |
| `debug-ranking.js` | 调试排名 |
| `test-avatar-creation.js` | 测试头像创建 |
| `fix-avatar-urls.cjs` | 修复头像URL |

### 缓存和速率限制脚本

| 文件 | 用途 |
|------|------|
| `clear-cache.cjs` | 清除Redis缓存 |
| `clear-rate-limits.js` | 清除速率限制 |

### 测试脚本

| 文件 | 用途 |
|------|------|
| `test_login.ts` | 测试登录功能 |
| `test_login_api.ts` | 测试登录API |
| `test_login_api_v2.ts` | 测试登录API v2 |



---

## 📋 配置文件

### 环境配置

| 文件 | 用途 |
|------|------|
| `.env` | 本地环境变量（不提交到Git） |
| `.env.example` | 环境变量示例模板 |
| `.env.production.example` | 生产环境变量示例 |

**环境变量包括**：
- 数据库连接信息
- Redis连接信息
- JWT密钥
- 端口配置
- 日志级别

### TypeScript配置

| 文件 | 用途 |
|------|------|
| `tsconfig.json` | TypeScript编译配置 |

**配置内容**：
- 编译目标：ES2020
- 模块系统：ESNext
- 输出目录：dist/
- 严格模式：启用
- 源码映射：启用

### 测试配置

| 文件 | 用途 |
|------|------|
| `vitest.config.ts` | Vitest测试框架配置 |

**配置内容**：
- 测试环境：Node
- 覆盖率报告
- 测试文件匹配模式

### 依赖管理

| 文件 | 用途 |
|------|------|
| `package.json` | NPM包配置和脚本 |

**主要依赖**：
- Express - Web框架
- PostgreSQL (pg) - 数据库驱动
- Redis (ioredis) - 缓存
- Socket.io - WebSocket
- BullMQ - 消息队列
- Zod - 数据验证
- Winston - 日志
- JWT - 身份验证

**脚本命令**：
- `npm run dev` - 开发模式
- `npm run build` - 构建生产版本
- `npm test` - 运行测试
- `npm run lint` - 代码检查

### Docker配置

| 文件 | 用途 |
|------|------|
| `Dockerfile` | Docker镜像构建配置 |
| `.dockerignore` | Docker构建忽略文件 |
| `ecosystem.config.js` | PM2进程管理配置 |



---

## 📊 dist/ - 编译输出目录

**说明**：TypeScript编译后的JavaScript文件和类型声明文件

**结构**：与src/目录结构相同
- `dist/config/` - 编译后的配置文件
- `dist/middleware/` - 编译后的中间件
- `dist/models/` - 编译后的模型
- `dist/routes/` - 编译后的路由
- `dist/services/` - 编译后的服务
- `dist/utils/` - 编译后的工具
- `dist/workers/` - 编译后的工作进程

**文件类型**：
- `.js` - JavaScript代码
- `.d.ts` - TypeScript类型声明
- `.js.map` - 源码映射文件
- `.d.ts.map` - 类型声明映射文件

---

## 🗂️ 文档文件

| 文件 | 用途 |
|------|------|
| `src/README.md` | Backend源码说明 |
| `PERFORMANCE_OPTIMIZATION_SUMMARY.md` | 性能优化总结 |

---

## 📐 架构层次

```
┌─────────────────────────────────────────┐
│           HTTP Request                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Middleware Layer                 │
│  - Authentication                        │
│  - Authorization                         │
│  - Rate Limiting                         │
│  - Validation                            │
│  - Caching                               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Routes Layer                    │
│  - API Endpoints                         │
│  - Request Routing                       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Services Layer                   │
│  - Business Logic                        │
│  - Data Processing                       │
│  - Transaction Management                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Models Layer                    │
│  - Data Structures                       │
│  - Type Definitions                      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Database Layer                   │
│  - PostgreSQL                            │
│  - Redis                                 │
└─────────────────────────────────────────┘
```

---

## 🔄 数据流

### 请求处理流程

```
1. HTTP Request
   ↓
2. Rate Limiting (速率限制检查)
   ↓
3. Authentication (JWT验证)
   ↓
4. Authorization (权限检查)
   ↓
5. Validation (参数验证)
   ↓
6. Cache Check (缓存检查)
   ↓
7. Route Handler (路由处理)
   ↓
8. Service Layer (业务逻辑)
   ↓
9. Database Query (数据库查询)
   ↓
10. Cache Update (更新缓存)
    ↓
11. Response (返回响应)
```

### 异步任务流程

```
1. API Request
   ↓
2. Create Job (创建任务)
   ↓
3. Add to Queue (加入队列)
   ↓
4. Return Response (立即返回)
   ↓
5. Worker Process (后台处理)
   ↓
6. Send Notification (发送通知)
```



---

## 🎯 核心功能模块

### 1. 用户认证和授权
**相关文件**：
- `services/UserService.ts` - 用户管理
- `services/PermissionService.ts` - 权限管理
- `middleware/auth.middleware.ts` - 认证中间件
- `middleware/permission.middleware.ts` - 权限中间件
- `routes/auth.routes.ts` - 认证路由
- `utils/jwt.ts` - JWT工具

### 2. 任务管理系统
**相关文件**：
- `services/TaskService.ts` - 任务核心逻辑
- `services/DependencyService.ts` - 任务依赖
- `services/TaskAssistantService.ts` - 任务协助者
- `services/TaskReviewService.ts` - 任务评审
- `routes/task.routes.ts` - 任务路由
- `models/Task.ts` - 任务模型

### 3. 赏金系统
**相关文件**：
- `services/BountyService.ts` - 赏金计算
- `services/BountyDistributionService.ts` - 赏金分配
- `routes/bounty.routes.ts` - 赏金路由
- `models/BountyAlgorithm.ts` - 赏金算法模型

### 4. 组群协作系统
**相关文件**：
- `services/GroupService.ts` - 组群管理
- `routes/group.routes.ts` - 组群路由
- `models/TaskGroup.ts` - 组群模型

### 5. 岗位管理系统
**相关文件**：
- `services/PositionService.ts` - 岗位管理
- `routes/position.routes.ts` - 岗位路由
- `models/Position.ts` - 岗位模型

### 6. 通知系统
**相关文件**：
- `services/NotificationService.ts` - 通知管理
- `services/NotificationPushService.ts` - 通知推送
- `services/AsyncNotificationService.ts` - 异步通知
- `services/WebSocketService.ts` - WebSocket实时通知
- `routes/notification.routes.ts` - 通知路由

### 7. 排名系统
**相关文件**：
- `services/RankingService.ts` - 排名计算
- `services/AvatarService.ts` - 头像管理
- `routes/ranking.routes.ts` - 排名路由
- `routes/avatar.routes.ts` - 头像路由

### 8. 缓存系统
**相关文件**：
- `services/CacheService.ts` - 缓存管理
- `middleware/cache.middleware.ts` - 缓存中间件
- `config/redis.ts` - Redis配置

### 9. 定时任务系统
**相关文件**：
- `services/SchedulerService.ts` - 任务调度
- `routes/scheduler.routes.ts` - 调度路由
- `workers/QueueWorker.ts` - 队列工作进程

### 10. 管理员功能
**相关文件**：
- `routes/admin.routes.ts` - 管理员路由
- `models/AdminBudget.ts` - 管理员预算
- `services/ReportService.ts` - 报表生成

---

## 🔐 安全特性

### 实现的安全措施

1. **身份验证**
   - JWT token验证
   - 密码哈希（bcrypt）
   - 会话管理

2. **授权控制**
   - 基于角色的访问控制（RBAC）
   - 岗位权限验证
   - 资源所有权检查

3. **速率限制**
   - IP级别限制
   - 用户级别限制
   - API端点限制

4. **输入验证**
   - Zod schema验证
   - SQL注入防护
   - XSS防护

5. **安全头部**
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection
   - Content-Security-Policy

---

## 📈 性能优化

### 实现的优化措施

1. **数据库优化**
   - 索引优化
   - 查询优化
   - 连接池管理
   - 物化视图

2. **缓存策略**
   - Redis缓存
   - 查询结果缓存
   - 会话缓存

3. **异步处理**
   - 消息队列（BullMQ）
   - 后台任务处理
   - 非阻塞操作

4. **代码优化**
   - 懒加载
   - 批量操作
   - 事务优化

---

## 🧪 测试

### 测试覆盖

**单元测试**：
- Services层测试
- Utils层测试
- Middleware层测试

**测试工具**：
- Vitest - 测试框架
- 测试覆盖率报告

**测试命令**：
```bash
npm test                 # 运行所有测试
npm run test:watch      # 监听模式
npm run test:coverage   # 生成覆盖率报告
```

---

## 📚 相关文档

### 系统设计文档
- `services/BOUNTY_SYSTEM.md` - 赏金系统设计
- `services/DEPENDENCY_SYSTEM.md` - 依赖系统设计
- `services/GROUP_SYSTEM.md` - 组群系统设计
- `services/NOTIFICATION_SYSTEM.md` - 通知系统设计
- `services/RANKING_AVATAR_SYSTEM.md` - 排名头像系统设计
- `services/SCHEDULER_SYSTEM.md` - 调度系统设计
- `middleware/SECURITY.md` - 安全实现文档
- `workers/ASYNC_PROCESSING.md` - 异步处理文档

### 实现总结文档
- `PERFORMANCE_OPTIMIZATION_SUMMARY.md` - 性能优化总结
- `services/AVATAR_IMPLEMENTATION_SUMMARY.md` - 头像实现总结
- `services/SCHEDULER_IMPLEMENTATION_SUMMARY.md` - 调度实现总结
- `services/PROGRESS_TRACKING_IMPLEMENTATION_SUMMARY.md` - 进度跟踪总结
- `middleware/SECURITY_IMPLEMENTATION_SUMMARY.md` - 安全实现总结

---

## 🚀 快速开始

### 开发环境启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 初始化数据库
npm run db:setup

# 4. 启动开发服务器
npm run dev
```

### 生产环境部署

```bash
# 1. 构建
npm run build

# 2. 启动
npm start

# 或使用PM2
pm2 start ecosystem.config.js
```

---

## 📞 常用命令

### 开发命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm test             # 运行测试
npm run lint         # 代码检查
```

### 数据库命令
```bash
npm run db:setup     # 初始化数据库
npm run db:reset     # 重置数据库
npm run db:seed      # 填充测试数据
npm run db:migrate   # 运行迁移
```

### 维护命令
```bash
npm run cache:clear  # 清除缓存
npm run logs         # 查看日志
```

---

## 🔍 故障排查

### 常见问题

1. **数据库连接失败**
   - 检查 `.env` 中的数据库配置
   - 确认PostgreSQL服务运行中
   - 检查网络连接

2. **Redis连接失败**
   - 检查Redis服务状态
   - 验证Redis配置
   - 检查端口占用

3. **端口被占用**
   - 修改 `.env` 中的PORT配置
   - 或停止占用端口的进程

4. **JWT验证失败**
   - 检查JWT_SECRET配置
   - 验证token有效期
   - 清除浏览器缓存

---

## 📝 代码规范

### 命名规范
- 文件名：PascalCase（服务、模型）或camelCase（工具）
- 类名：PascalCase
- 函数名：camelCase
- 常量：UPPER_SNAKE_CASE
- 接口：PascalCase，以I开头（可选）

### 目录规范
- 一个文件一个主要类/服务
- 测试文件与源文件同目录
- 文档文件与相关代码同目录

### 注释规范
- 使用JSDoc注释
- 复杂逻辑添加说明
- 公共API必须有文档

---

## 🎓 学习路径

### 新手入门
1. 阅读 `src/README.md`
2. 了解 `models/` 中的数据结构
3. 查看 `routes/` 中的API端点
4. 学习 `services/` 中的业务逻辑

### 进阶学习
1. 研究中间件实现
2. 了解缓存策略
3. 学习异步处理
4. 掌握测试编写

### 高级主题
1. 性能优化技巧
2. 安全最佳实践
3. 架构设计模式
4. 分布式系统

---

**文档版本**：1.0  
**最后更新**：2026-01-05  
**维护者**：Backend Team
