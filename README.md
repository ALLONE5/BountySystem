# 赏金猎人平台

企业级任务管理和赏金分配系统

**版本**: 3.1.0 | **最后更新**: 2026-03-19 | **状态**: ✅ 运行中

---

## 📚 文档

完整文档请查看 [docs/README.md](docs/README.md)

### 快速链接
- [项目概览](docs/PROJECT_OVERVIEW.md) - 项目简介和状态
- [快速开始](docs/guides/QUICK_START.md) - 5分钟上手
- [开发指南](docs/guides/DEVELOPMENT.md) - 开发规范
- [系统架构](docs/reference/ARCHITECTURE.md) - 架构设计
- [功能说明](docs/reference/FEATURES.md) - 功能模块详解

---

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动数据库（PostgreSQL + Redis）
docker-compose -f docker-compose.dev.yml up -d

# 3. 配置环境变量
cd packages/backend && cp .env.example .env
# 编辑 .env 设置数据库连接信息

# 4. 初始化数据库
node packages/backend/scripts/db-manager.js seed

# 5. 启动应用
npm run dev:backend  # 终端1：后端 http://localhost:3001
npm run dev:frontend # 终端2：前端 http://localhost:5173
```

**默认账户**:
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | `admin` | `admin123` |
| 开发者 | `developer` | `dev123` |
| 普通用户 | `user` | `user123` |

---

## 🌟 核心功能

- ✅ **任务管理** — 多层级任务、依赖关系、子任务、进度跟踪
- ✅ **赏金系统** — 自动计算、分配、历史记录、协助者分成
- ✅ **团队协作** — 项目组、任务组、成员管理、任务邀请
- ✅ **权限控制** — 角色（user/position_admin/super_admin）、岗位、细粒度权限
- ✅ **实时通知** — WebSocket 推送、多种通知类型
- ✅ **数据可视化** — 看板、甘特图、日历视图、任务可视化
- ✅ **排行榜** — 月度、季度、总榜，头像解锁系统
- ✅ **审计日志** — 完整操作追踪，支持管理员和开发者视图
- ✅ **文件上传** — Logo 上传、附件管理
- ✅ **系统配置** — 站点名称、Logo、主题、注册开关等

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18.2 + TypeScript 5.3 + Vite 5 |
| 前端 UI | Ant Design 6.1 |
| 前端状态 | Zustand 4.4 |
| 前端路由 | React Router 6.21 |
| 前端可视化 | D3.js 7.9、FullCalendar 6.1 |
| 后端框架 | Node.js 18+ + Express.js 4.18 + TypeScript |
| 数据库 | PostgreSQL 14+ |
| 缓存 | Redis 6+ |
| 实时通信 | Socket.IO 4.8 |
| 认证 | JWT (jsonwebtoken 9) + bcrypt |
| 日志 | Winston 3.11 |
| 验证 | Zod 3.22 |
| 测试 | Vitest 1.1 |
| 部署 | Docker + Nginx + PM2 |

---

## 📦 项目结构

```
BountyHunterPlatform/
├── packages/
│   ├── frontend/          # React 前端应用 (Vite + TypeScript)
│   │   └── src/
│   │       ├── pages/     # 页面组件（主页面 + admin + developer + auth）
│   │       ├── layouts/   # 布局组件
│   │       ├── contexts/  # React Context（Auth、Theme、SystemConfig、Notification）
│   │       ├── api/       # API 客户端封装
│   │       ├── components/# 公共组件
│   │       └── styles/    # 全局样式
│   ├── backend/           # Node.js 后端 API
│   │   └── src/
│   │       ├── routes/    # 路由层（23 个模块）
│   │       ├── services/  # 业务逻辑层（50+ 个服务）
│   │       ├── repositories/ # 数据访问层
│   │       ├── models/    # 数据模型（18 个）
│   │       ├── middleware/# 中间件（认证、权限、审计、缓存等）
│   │       └── config/    # 配置（数据库、Redis、日志、环境变量）
│   └── database/          # 数据库迁移脚本
├── scripts/               # 项目维护脚本
├── docs/                  # 完整项目文档
├── docker-compose.dev.yml      # 开发环境 Docker 配置
├── docker-compose.production.yml # 生产环境 Docker 配置
└── nginx.conf             # Nginx 反向代理配置
```

---

## 🔧 常用命令

### 开发
```bash
npm run dev:backend   # 启动后端 (http://localhost:3001)
npm run dev:frontend  # 启动前端 (http://localhost:5173)
npm test              # 运行测试
npm run build         # 构建生产版本
npm run check:types   # TypeScript 类型检查
```

### 数据库管理
```bash
node packages/backend/scripts/db-manager.js check        # 检查数据库连接
node packages/backend/scripts/db-manager.js seed         # 初始化种子数据
node packages/backend/scripts/db-manager.js seed-test    # 创建测试数据
node packages/backend/scripts/db-manager.js seed-bounty  # 创建赏金测试数据
node packages/backend/scripts/db-manager.js reset-admin  # 重置管理员密码
node packages/backend/scripts/db-manager.js refresh-ranks # 刷新排名数据
```

### 维护
```bash
npm run clean:cache   # 清理缓存
npm run clean:temp    # 清理临时文件
npm run audit         # 项目审计
```

---

## 📝 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Redis >= 6.0
- Docker（可选，用于容器化部署）

---

## 📄 许可证

MIT License

---

**维护者**: 开发团队 | **版本**: 3.1.0 | **最后更新**: 2026-03-19
