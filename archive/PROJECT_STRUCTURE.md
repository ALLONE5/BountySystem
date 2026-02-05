# Bounty Hunter Platform - 项目结构详解 / Project Structure

本文档详细描述了 Bounty Hunter Platform 的目录结构、各模块职责及核心文件说明。

## 📂 目录结构概览 / Directory Tree

```text
BountyHunterPlatform/
├── 📄 package.json                  # 根项目配置 (Workspaces, Scripts)
├── 📄 docker-compose.dev.yml        # 开发环境编排 (PostgreSQL, Redis)
├── 📄 docker-compose.production.yml # 生产环境编排
├── 📄 nginx.conf                    # Nginx 反向代理配置
├── 📄 README.md                     # 项目主文档
├── 📂 .kiro/                        # 项目规范与文档
├── 📂 packages/                     # Monorepo 工作区
│   ├── 📂 backend/                  # 后端服务 (Node.js + Express)
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📂 src/
│   │   │   ├── 📄 index.ts          # 应用入口
│   │   │   ├── 📂 config/           # 配置文件
│   │   │   ├── 📂 middleware/       # 中间件 (Auth, Error, Logger)
│   │   │   ├── 📂 routes/           # API 路由定义
│   │   │   ├── 📂 services/         # 业务逻辑层
│   │   │   ├── 📂 models/           # 数据模型定义
│   │   │   ├── 📂 utils/            # 工具函数
│   │   │   └── 📂 workers/          # 后台任务/定时任务
│   │   └── 📂 scripts/              # 运维与数据修复脚本
│   │
│   ├── 📂 frontend/                 # 前端应用 (React + Vite)
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 vite.config.ts        # Vite 构建配置
│   │   ├── 📂 src/
│   │   │   ├── 📄 main.tsx          # 应用入口
│   │   │   ├── 📄 App.tsx           # 根组件
│   │   │   ├── 📂 api/              # API 接口封装
│   │   │   ├── 📂 components/       # 通用 UI 组件
│   │   │   ├── 📂 pages/            # 页面组件
│   │   │   ├── 📂 store/            # 全局状态管理 (Zustand)
│   │   │   ├── 📂 router/           # 路由配置
│   │   │   ├── 📂 hooks/            # 自定义 Hooks
│   │   │   ├── 📂 types/            # TypeScript 类型定义
│   │   │   └── 📂 utils/            # 前端工具函数
│   │
│   └── 📂 database/                 # 数据库管理
│       ├── 📄 SCHEMA.md             # 数据库设计文档
│       ├── 📂 migrations/           # 数据库迁移文件
│       └── 📂 scripts/              # 数据库维护脚本
```

---

## 📝 详细说明 / Detailed Description

### 1. 根目录 (Root Directory)

根目录负责整个 Monorepo 的编排与管理。

| 文件/目录 | 说明 |
| :--- | :--- |
| **`packages/`** | **核心工作区**。包含 Frontend, Backend, Database 三个子项目，使用 npm workspaces 管理依赖。 |
| **`docker-compose.dev.yml`** | **开发环境**。定义了本地开发所需的 PostgreSQL (DB) 和 Redis (Cache) 服务。使用 `docker compose up -d` 启动。 |
| **`package.json`** | **全局配置**。定义了工作区路径，以及跨项目的快捷命令（如 `npm run dev:backend`）。 |
| **`nginx.conf`** | **生产部署**。Nginx 配置文件，用于生产环境下的静态资源服务和 API 反向代理。 |

### 2. 后端服务 (Backend) - `packages/backend`

基于 Node.js + Express + TypeScript 的 RESTful API 服务。

| 目录/文件 | 职责详解 |
| :--- | :--- |
| **`src/index.ts`** | **启动入口**。初始化 Express App，连接数据库，挂载中间件和路由，启动 HTTP 服务器。 |
| **`src/config/`** | **配置中心**。管理环境变量 (`.env`)、数据库连接池配置、Redis 客户端配置等。 |
| **`src/middleware/`** | **请求拦截**。包含身份验证 (`auth`)、请求日志 (`logger`)、全局错误处理 (`error`) 等中间件。 |
| **`src/routes/`** | **路由分发**。定义 API URL (如 `/api/tasks`)，负责接收 HTTP 请求，参数校验，并调用 Service 层。 |
| **`src/services/`** | **核心业务**。封装具体的业务逻辑（如任务分配算法、赏金计算规则），与数据库交互。 |
| **`src/models/`** | **数据定义**。定义数据库表的 TypeScript 接口和类型，确保数据结构一致性。 |
| **`src/workers/`** | **异步任务**。处理耗时操作或定时任务（Cron Jobs），如每日任务结算、邮件发送。 |
| **`scripts/`** | **运维脚本**。包含数据修复、缓存清理、调试工具等独立运行的脚本。 |

### 3. 前端应用 (Frontend) - `packages/frontend`

基于 React 18 + Vite + Ant Design 的现代化 SPA 应用。

| 目录/文件 | 职责详解 |
| :--- | :--- |
| **`src/pages/`** | **页面视图**。对应路由的完整页面，如 `DashboardPage` (仪表盘), `TaskListPage` (任务列表)。 |
| **`src/components/`** | **UI 组件**。可复用的界面单元。`common/` 存放基础组件，其他目录存放业务相关组件。 |
| **`src/api/`** | **网络请求**。封装 Axios 请求，将后端 API 映射为前端函数 (如 `taskApi.getTasks`)。 |
| **`src/store/`** | **状态管理**。使用 Zustand 管理全局状态，如用户信息 (`authStore`)、UI 状态 (`uiStore`)。 |
| **`src/router/`** | **路由管理**。配置 URL 与页面的映射关系，处理路由守卫 (Auth Guard)。 |
| **`src/types/`** | **类型共享**。定义前端使用的 TypeScript 接口，通常与后端模型保持一致。 |
| **`vite.config.ts`** | **构建配置**。Vite 配置文件，包含插件配置、开发服务器代理 (Proxy) 设置等。 |

### 4. 数据库 (Database) - `packages/database`

负责数据库结构的版本控制与文档。

| 目录/文件 | 职责详解 |
| :--- | :--- |
| **`migrations/`** | **版本迁移**。记录数据库 Schema 的变更历史（SQL 文件），支持版本回滚。 |
| **`SCHEMA.md`** | **设计文档**。详细描述数据库表结构、字段含义、外键关系及索引设计。 |
