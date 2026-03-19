# 项目概览

**项目名称**: 赏金猎人平台  
**项目类型**: 企业级任务管理和赏金分配系统  
**版本**: 3.0.0  
**最后更新**: 2026-03-19

---

## 项目简介

赏金猎人平台是一个基于任务和赏金系统的项目管理平台，支持任务发布、承接、执行和赏金结算的完整生命周期。

### 核心特性

- 任务管理（多层级、依赖关系、子任务）
- 赏金系统（自动计算、分配、历史记录）
- 团队协作（项目组、任务组、成员管理）
- 权限控制（角色、岗位、细粒度权限）
- 实时通知（WebSocket、邮件通知）
- 数据可视化（看板、甘特图、日历视图）
- 排行榜系统（月度、季度、总榜）
- 审计日志（操作追踪、安全审计，覆盖任务全生命周期）
- 系统配置（站点设置、主题、Logo 管理）

---

## 技术栈

### 前端
- 框架: React 18.2.0 + TypeScript
- 构建: Vite
- UI: Ant Design 6.x
- 状态: Zustand
- 路由: React Router 6.x
- 可视化: D3.js

### 后端
- 运行时: Node.js 18+ + TypeScript
- 框架: Express.js
- 数据库: PostgreSQL 14+
- 缓存: Redis 6+
- 认证: JWT
- 日志: Winston
- 测试: Vitest

### 部署
- 容器: Docker + Docker Compose
- 代理: Nginx
- 进程: PM2

---

## 项目结构

```
BountyHunterPlatform/
├── packages/
│   ├── frontend/          # React 前端应用
│   ├── backend/           # Node.js 后端 API
│   └── database/          # 数据库迁移和脚本
├── docs/                  # 完整项目文档
├── docker-compose.dev.yml
├── docker-compose.production.yml
└── nginx.conf
```

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动数据库
docker-compose -f docker-compose.dev.yml up -d

# 3. 初始化数据库
node packages/backend/scripts/db-manager.js seed

# 4. 启动应用
npm run dev:backend  # 终端1
npm run dev:frontend # 终端2
```

访问: http://localhost:5173  
默认账户: `admin` / `admin123`

---

## 文档导航

### 核心文档
- [快速开始](guides/QUICK_START.md) - 环境搭建和启动
- [开发指南](guides/DEVELOPMENT.md) - 开发规范和工具
- [运维指南](guides/OPERATIONS.md) - 部署和运维
- [变更日志](CHANGELOG.md) - 变更历史

### 参考文档
- [系统架构](reference/ARCHITECTURE.md) - 架构设计
- [功能说明](reference/FEATURES.md) - 功能详解
- [性能优化](reference/OPTIMIZATION.md) - 优化策略

### 数据库文档
- [数据库模型](database/MODELS.md) - 18 个模型说明
- [数据库架构](database/SCHEMA.md) - 完整表结构
- [数据库迁移](database/MIGRATIONS.md) - 迁移管理
- [数据库设置](database/SETUP.md) - 安装配置

---

## 维护命令

```bash
# 开发
npm run dev:backend   # 启动后端 (port 3001)
npm run dev:frontend  # 启动前端 (port 5173)

# 数据库
node packages/backend/scripts/db-manager.js check        # 检查连接
node packages/backend/scripts/db-manager.js seed         # 初始化数据
node packages/backend/scripts/db-manager.js reset-admin  # 重置管理员密码
```

---

## 项目统计

| 指标 | 数量 |
|------|------|
| 前端页面 | 39 个 |
| 后端路由文件 | 23 个 |
| 后端服务 | 50+ 个 |
| 数据库模型 | 18 个 |
| 数据库迁移 | 26 个 |

---

**维护者**: 开发团队  
**项目状态**: 健康  
