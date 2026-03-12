# 赏金猎人平台

企业级任务管理和赏金分配系统

---

## 🚀 快速开始

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

📖 **详细说明**: [快速开始指南](docs/guides/QUICK_START.md)

---

## 🌟 核心功能

- ✅ 任务管理（多层级、依赖关系、子任务）
- ✅ 赏金系统（自动计算、分配、历史记录）
- ✅ 团队协作（项目组、任务组、成员管理）
- ✅ 权限控制（角色、岗位、细粒度权限）
- ✅ 实时通知（WebSocket、邮件通知）
- ✅ 数据可视化（看板、甘特图、日历视图）
- ✅ 排行榜系统（月度、季度、总榜）
- ✅ 审计日志（操作追踪、安全审计）

---

## 🛠️ 技术栈

**前端**: React 18 + TypeScript + Vite + Ant Design 6 + Zustand  
**后端**: Node.js 18+ + TypeScript + Express.js + PostgreSQL 14+ + Redis 6+  
**部署**: Docker + Nginx + PM2

---

## 📦 项目结构

```
BountyHunterPlatform/
├── packages/
│   ├── frontend/          # React 前端应用
│   ├── backend/           # Node.js 后端 API
│   └── database/          # 数据库迁移和脚本
├── scripts/               # 项目维护脚本
├── docs/                  # 完整项目文档
└── .kiro/                 # Kiro AI 配置
```

---

## 📚 文档

### 快速导航
- 📖 [完整文档导航](docs/README.md) - 所有文档的索引
- 🚀 [快速开始](docs/guides/QUICK_START.md) - 5分钟上手
- 💻 [开发指南](docs/DEVELOPMENT.md) - 开发规范和工具
- 🏗️ [系统架构](docs/ARCHITECTURE.md) - 架构设计
- 🎯 [功能指南](docs/FEATURES_GUIDE.md) - 功能详解

### 设置和运维
- [数据库设置](docs/setup/DATABASE_SETUP.md)
- [运维指南](docs/operations/OPERATIONS_GUIDE.md)

---

## 🔧 常用命令

### 开发
```bash
npm run dev:backend   # 启动后端 (http://localhost:3001)
npm run dev:frontend  # 启动前端 (http://localhost:5173)
npm test              # 运行测试
npm run build         # 构建生产版本
```

### 维护工具
```bash
# 项目维护
node scripts/maintenance.js check-types  # 类型检查
node scripts/maintenance.js audit        # 项目审计

# 数据库管理
node packages/backend/scripts/db-manager.js check        # 检查连接
node packages/backend/scripts/db-manager.js seed         # 初始化数据
node packages/backend/scripts/db-manager.js reset-admin  # 重置管理员密码
```

---

## 📝 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Redis >= 6.0
- Docker (可选，用于容器化部署)

---

## 🤝 贡献

欢迎贡献！请查看 [开发指南](docs/DEVELOPMENT.md) 了解开发规范和流程。

---

## 📄 许可证

MIT License

---

**维护者**: 开发团队  
**版本**: 3.0.0  
**最后更新**: 2026-03-11
