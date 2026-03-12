# 赏金猎人平台

企业级任务管理和赏金分配系统

> **最新更新**: 2026-03-12 - 完成文档重新分类整理（单层子目录结构）✅

---

## 📚 文档

完整文档请查看 [docs/README.md](docs/README.md)

### 快速链接
- [项目概览](docs/PROJECT_OVERVIEW.md) - 项目简介和状态
- [快速开始](docs/guides/QUICK_START.md) - 5分钟上手
- [开发指南](docs/guides/DEVELOPMENT.md) - 开发规范
- [系统架构](docs/reference/ARCHITECTURE.md) - 架构设计

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

## 🧹 维护命令

### 快速命令
```bash
# 清理缓存
npm run clean:cache

# 清理临时文件
npm run clean:temp

# 运行项目审计
npm run audit

# 类型检查
npm run check:types
```

### 完整维护工具
```bash
# 查看所有维护命令
node scripts/maintenance.js help

# 清理缓存
node scripts/maintenance.js clean-cache

# 清理临时文件
node scripts/maintenance.js clean-temp

# 类型检查
node scripts/maintenance.js check-types

# 列出所有脚本
node scripts/maintenance.js list-scripts
```

### 数据库管理
```bash
# 检查数据库连接
node packages/backend/scripts/db-manager.js check

# 运行种子脚本
node packages/backend/scripts/db-manager.js seed

# 创建测试数据
node packages/backend/scripts/db-manager.js seed-test

# 重置管理员密码
node packages/backend/scripts/db-manager.js reset-admin

# 刷新排名数据
node packages/backend/scripts/db-manager.js refresh-ranks
```

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
**最后更新**: 2026-03-12  
**项目状态**: ✅ 优秀 (文档结构优化完成)
