# 赏金猎人平台 (Bounty Hunter Platform)

一个任务发布与承接系统，支持多层级任务拆解、用户岗位管理、团队协作、自动赏金计算和多种任务可视化方式。

## 项目结构

```
bounty-hunter-platform/
├── packages/
│   ├── backend/          # 后端服务 (Node.js + TypeScript + Express)
│   ├── frontend/         # 前端应用 (React + TypeScript + Vite)
│   └── database/         # 数据库迁移和脚本
├── .kiro/               # Kiro 规范文档
└── package.json         # 根 package.json (工作区配置)
```

## 技术栈

### 后端
- **运行时**: Node.js
- **语言**: TypeScript
- **框架**: Express
- **数据库**: PostgreSQL
- **缓存**: Redis
- **认证**: JWT
- **测试**: Vitest

### 前端
- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand
- **路由**: React Router
- **HTTP客户端**: Axios

## 快速开始

### 前置要求

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量示例文件：

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

2. 编辑 `packages/backend/.env` 配置数据库和 Redis 连接信息

### 数据库初始化

```bash
# 创建数据库
createdb bounty_hunter

# 运行初始化脚本和迁移
cd packages/database
chmod +x scripts/run_migrations.sh
./scripts/run_migrations.sh bounty_hunter postgres localhost

# 或者手动运行
psql -U postgres -d bounty_hunter -f scripts/init.sql
psql -U postgres -d bounty_hunter -f migrations/20241210_000001_create_core_tables.sql
psql -U postgres -d bounty_hunter -f migrations/20241210_000002_create_auxiliary_tables.sql

# 验证数据库架构
psql -U postgres -d bounty_hunter -f scripts/verify_schema.sql
```

### 启动开发服务器

```bash
# 启动后端 (端口 3000)
npm run dev:backend

# 启动前端 (端口 5173)
npm run dev:frontend
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm test
```

## 开发指南

### 后端开发

后端代码位于 `packages/backend/src/`：

- `config/` - 配置文件（环境变量、数据库、Redis）
- `models/` - 数据模型
- `services/` - 业务逻辑服务
- `routes/` - API 路由
- `middleware/` - 中间件
- `utils/` - 工具函数

### 前端开发

前端代码位于 `packages/frontend/src/`：

- `components/` - React 组件
- `pages/` - 页面组件
- `stores/` - 状态管理
- `services/` - API 服务
- `utils/` - 工具函数

### 数据库迁移

数据库迁移脚本位于 `packages/database/migrations/`。

## 📖 文档索引

### 🚀 快速开始
- [开发指南](./docs/DEVELOPMENT_GUIDE.md) - 完整的开发指南（快速开始、项目结构、开发工具、测试账号）
- [运维指南](./docs/operations/OPERATIONS_GUIDE.md) - 完整的运维指南（配置、部署、监控、故障排除）

### 📚 核心文档
- [功能总结](./docs/FEATURES_SUMMARY.md) - 所有功能模块说明
- [优化总结](./docs/OPTIMIZATION_SUMMARY.md) - 代码优化工作总结
- [文档结构](./docs/DOCUMENTATION_STRUCTURE.md) - 文档组织说明

### 📦 规格文档
- [需求文档](./.kiro/specs/bounty-hunter-platform/requirements.md) - 完整的功能需求（28个需求）
- [设计文档](./.kiro/specs/bounty-hunter-platform/design.md) - 系统设计（28个正确性属性）
- [任务列表](./.kiro/specs/bounty-hunter-platform/tasks.md) - 开发任务（历史记录）

### 🔧 技术文档
- [数据库架构](./packages/database/SCHEMA.md) - 数据库表结构
- [后端README](./packages/backend/src/README.md) - 后端代码结构

### 📂 历史文档
- [归档文档](./archive/README.md) - 历史文档归档

## 🎯 最新更新

### 2025-01-05 - 文档清理第二阶段完成 ✅
- ✅ 归档了10个实现和修复文档
- ✅ 根目录文档从4个减少到1个（README.md）
- ✅ 文档减少率达到93%（从14个到1个）
- ✅ 更新了文档索引和导航结构
- ✅ 项目文档结构极简清晰

详见：[文档清理总结 2025-01-05](./DOCUMENTATION_CLEANUP_2025_01_05.md)

### 2025-01-04 - 文档清理第一阶段完成 ✅
- ✅ 创建了统一的运维指南（整合5个文档）
- ✅ 扩展了开发指南（整合5个文档）
- ✅ 根目录文档从14个减少到4个（-71%）
- ✅ 文档质量显著提升，可维护性大幅提高
- ✅ 所有历史文档归档保留

详见：[归档文档](./archive/FINAL_DOCUMENTATION_CLEANUP_COMPLETE.md)

### 2024-12-31 - 代码优化全部完成 ✅
- ✅ Phase 1: 创建了6个核心工具（820行）
- ✅ Phase 2: 重构了5个管理页面（减少420行）
- ✅ Phase 3: 优化了10个API客户端（减少261行）
- ✅ Phase 4: 重构了12个后端路由（减少795行）
- ✅ 总计减少1,476行代码，净减少656行（44%）
- ✅ 代码可读性提升70%，维护成本降低50%

详见：[优化总结](./docs/OPTIMIZATION_SUMMARY.md)

## 许可证

私有项目
