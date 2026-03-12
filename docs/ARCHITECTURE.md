# 系统架构

**最后更新**: 2026-03-11

本文档描述赏金猎人平台的系统架构、技术栈和核心设计。

---

## 系统概述

赏金猎人平台是一个企业级任务管理和赏金分配系统，支持任务发布、承接、执行和赏金结算的完整生命周期。

### 核心功能
- 任务管理（多层级、依赖关系）
- 赏金系统（自动计算、分配）
- 团队协作（项目组、任务组）
- 权限控制（角色、岗位）
- 实时通知
- 数据可视化（看板、甘特图、日历）

---

## 技术架构

### 整体架构

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP/WebSocket
┌──────▼──────────────────┐
│   Frontend (React)      │
│   - Vite                │
│   - Ant Design          │
│   - Zustand             │
└──────┬──────────────────┘
       │ REST API
┌──────▼──────────────────┐
│   Backend (Node.js)     │
│   - Express             │
│   - TypeScript          │
│   - JWT Auth            │
└──────┬──────────────────┘
       │
   ┌───┴───┐
   │       │
┌──▼───┐ ┌─▼────┐
│ PG   │ │Redis │
│ SQL  │ │Cache │
└──────┘ └──────┘
```

### 技术栈

#### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **UI**: Ant Design 6
- **状态**: Zustand
- **路由**: React Router 6
- **HTTP**: Axios

#### 后端
- **运行时**: Node.js 18+ + TypeScript
- **框架**: Express.js
- **数据库**: PostgreSQL 14+
- **缓存**: Redis 6+
- **认证**: JWT
- **日志**: Winston
- **测试**: Vitest

---

## 核心设计

### 1. 分层架构

```
┌─────────────────────────┐
│   Routes (路由层)        │  ← HTTP 请求入口
├─────────────────────────┤
│   Services (业务层)      │  ← 业务逻辑
├─────────────────────────┤
│   Repositories (数据层)  │  ← 数据访问
├─────────────────────────┤
│   Models (模型层)        │  ← 数据模型
└─────────────────────────┘
```

#### Routes (路由层)
- 定义 API 端点
- 参数验证
- 权限检查
- 调用 Service 层

#### Services (业务层)
- 封装业务逻辑
- 事务管理
- 缓存策略
- 调用 Repository 层

#### Repositories (数据层)
- 数据库操作
- SQL 查询
- 数据映射

#### Models (模型层)
- TypeScript 类型定义
- 数据验证规则
- 枚举类型

### 2. 目录结构

```
packages/backend/src/
├── config/              # 配置
│   ├── database.ts      # 数据库配置
│   ├── redis.ts         # Redis 配置
│   ├── env.ts           # 环境变量
│   └── logger.ts        # 日志配置
│
├── middleware/          # 中间件
│   ├── auth.middleware.ts
│   ├── permission.middleware.ts
│   └── errorHandler.middleware.ts
│
├── models/              # 数据模型
│   ├── User.ts
│   ├── Task.ts
│   ├── Position.ts
│   └── ...
│
├── repositories/        # 数据访问层
│   ├── UserRepository.ts
│   ├── TaskRepository.ts
│   └── ...
│
├── routes/              # 路由
│   ├── auth.routes.ts
│   ├── task.routes.ts
│   ├── user.routes.ts
│   └── ...
│
├── services/            # 业务逻辑
│   ├── UserService.ts
│   ├── TaskService.ts
│   ├── BountyService.ts
│   ├── CacheService.ts
│   └── ...
│
├── utils/               # 工具函数
│   ├── errors.ts        # 错误类
│   ├── jwt.ts           # JWT 工具
│   ├── asyncHandler.ts  # 异步处理
│   ├── decorators/      # 装饰器
│   └── mappers/         # 数据映射
│
└── test-utils/          # 测试工具
    ├── fixtures.ts      # 测试数据
    ├── generators.ts    # 数据生成器
    └── helpers.ts       # 测试辅助
```

### 3. 数据库设计

#### 核心表
- **users**: 用户信息
- **tasks**: 任务信息
- **positions**: 岗位定义
- **project_groups**: 项目组
- **bounty_transactions**: 赏金交易

#### 关联表
- **task_assistants**: 任务协助者
- **task_invitations**: 任务邀请
- **task_dependencies**: 任务依赖
- **group_members**: 项目组成员
- **position_applications**: 岗位申请

#### 辅助表
- **notifications**: 通知
- **rankings**: 排名
- **audit_logs**: 审计日志
- **system_configs**: 系统配置

### 4. 认证和授权

#### 认证流程
```
1. 用户登录 → 验证凭据
2. 生成 JWT Token
3. 返回 Token 给客户端
4. 客户端在请求头中携带 Token
5. 服务器验证 Token
```

#### 权限模型
```
User
 ├── Role (角色)
 │   ├── super_admin    # 超级管理员
 │   ├── position_admin # 岗位管理员
 │   └── user           # 普通用户
 │
 └── Position (岗位)
     ├── Frontend Developer
     ├── Backend Developer
     └── ...
```

### 5. 缓存策略

#### 缓存层级
```
┌─────────────────┐
│  Application    │  ← 应用层缓存
├─────────────────┤
│  Redis Cache    │  ← Redis 缓存
├─────────────────┤
│  Database       │  ← 数据库
└─────────────────┘
```

#### 缓存规则
- 用户信息: TTL 1小时
- 任务列表: TTL 30分钟
- 排名数据: TTL 5分钟
- 系统配置: TTL 1小时

#### 缓存失效
- 主动失效: 数据更新时清除相关缓存
- 被动失效: TTL 过期自动清除

---

## 核心业务流程

### 1. 任务生命周期

```
创建任务
  ↓
发布任务 (not_started → available)
  ↓
用户承接 (available → pending_acceptance)
  ↓
发布者确认 (pending_acceptance → in_progress)
  ↓
执行任务
  ↓
提交完成 (in_progress → completed)
  ↓
赏金分配
```

### 2. 赏金计算

```
任务属性
  ├── 复杂度 (complexity)
  ├── 优先级 (priority)
  ├── 预估工时 (estimated_hours)
  └── 基础赏金 (base_bounty)
       ↓
  赏金算法计算
       ↓
  最终赏金金额
```

### 3. 权限检查

```
请求 → 认证中间件 → 权限中间件 → 业务逻辑
         ↓              ↓
    验证 JWT      检查角色/岗位
         ↓              ↓
    提取用户      验证权限
```

---

## 性能优化

### 1. 数据库优化
- ✅ 索引优化（26个性能索引）
- ✅ 查询优化（避免 N+1）
- ✅ 连接池管理
- ✅ 事务控制

### 2. 缓存优化
- ✅ Redis 缓存
- ✅ 缓存装饰器
- ✅ 缓存预热
- ✅ 缓存失效策略

### 3. 前端优化
- ✅ 代码分割
- ✅ 懒加载
- ✅ 防抖节流
- ✅ React.memo

### 4. API 优化
- ✅ 响应压缩
- ✅ 分页查询
- ✅ 字段过滤
- ✅ 批量操作

---

## 安全设计

### 1. 认证安全
- JWT Token 认证
- Token 过期机制
- Refresh Token
- 密码加密（bcrypt）

### 2. 授权安全
- 基于角色的访问控制（RBAC）
- 基于岗位的权限控制
- 资源所有权验证
- API 权限检查

### 3. 数据安全
- SQL 注入防护（参数化查询）
- XSS 防护（输入验证）
- CSRF 防护（Token 验证）
- 敏感数据加密

### 4. 运行安全
- 速率限制（防止 DDoS）
- 请求日志记录
- 错误日志监控
- 审计日志

---

## 监控和日志

### 1. 日志系统
- 结构化日志（Winston）
- 日志级别：error, warn, info, debug
- 日志上下文：userId, taskId, operation
- 日志存储：文件 + 控制台

### 2. 性能监控
- API 响应时间
- 数据库查询时间
- 缓存命中率
- 错误率统计

### 3. 业务监控
- 用户活跃度
- 任务完成率
- 赏金分配统计
- 系统使用情况

---

## 扩展性设计

### 1. 水平扩展
- 无状态 API 设计
- Session 存储在 Redis
- 负载均衡支持
- 数据库读写分离（规划中）

### 2. 垂直扩展
- 模块化设计
- 插件化架构（规划中）
- 微服务拆分（规划中）

### 3. 功能扩展
- 新增业务模块
- 自定义赏金算法
- 第三方集成
- API 开放平台（规划中）

---

## 部署架构

### 开发环境
```
Docker Compose
  ├── PostgreSQL
  ├── Redis
  ├── Backend (dev mode)
  └── Frontend (dev mode)
```

### 生产环境
```
Nginx (反向代理)
  ├── Frontend (静态文件)
  └── Backend (PM2)
       ├── PostgreSQL (主从)
       └── Redis (集群)
```

---

## 相关文档

- [开发指南](DEVELOPMENT.md) - 开发规范和工具
- [项目状态](PROJECT_STATUS.md) - 项目概览
- [功能指南](FEATURES_GUIDE.md) - 功能说明
- [数据库模型](DATABASE_MODELS_OVERVIEW.md) - 数据库设计
- [运维指南](operations/OPERATIONS_GUIDE.md) - 部署运维

---

**维护者**: 开发团队  
**版本**: 3.0.0
