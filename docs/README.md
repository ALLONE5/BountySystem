# 项目文档中心

**最后更新**: 2026-03-19 | **文档版本**: 9.0.0

欢迎来到赏金猎人平台文档中心。

---

## 📚 快速导航

### 🚀 入门指南
- [项目概览](PROJECT_OVERVIEW.md) - 项目简介、技术栈、功能状态
- [快速开始](guides/QUICK_START.md) - 5分钟快速上手
- [开发指南](guides/DEVELOPMENT.md) - 开发规范和最佳实践
- [运维指南](guides/OPERATIONS.md) - 部署和运维

### 🗄️ 数据库文档
- [数据库模型](database/MODELS.md) - 18个数据模型详解
- [数据库架构](database/SCHEMA.md) - 完整的表结构和约束
- [数据库迁移](database/MIGRATIONS.md) - 迁移文件管理
- [数据库设置](database/SETUP.md) - 安装和配置

### 📖 参考文档
- [系统架构](reference/ARCHITECTURE.md) - 系统架构和技术设计
- [功能说明](reference/FEATURES.md) - 功能模块详细说明
- [性能优化](reference/OPTIMIZATION.md) - 性能优化参考

### 📊 项目管理
- [变更日志](CHANGELOG.md) - 项目变更历史

---

## 📂 文档结构

```
docs/
├── README.md                    # 📚 文档导航中心（本文件）
├── PROJECT_OVERVIEW.md          # 📋 项目概览
├── CHANGELOG.md                 # 📝 变更日志
│
├── guides/                      # 🚀 指南文档
│   ├── QUICK_START.md          # 快速开始
│   ├── DEVELOPMENT.md          # 开发指南
│   └── OPERATIONS.md           # 运维指南
│
├── database/                    # 🗄️ 数据库文档
│   ├── MODELS.md               # 数据库模型（18个）
│   ├── SCHEMA.md               # 数据库架构
│   ├── MIGRATIONS.md           # 数据库迁移
│   └── SETUP.md                # 数据库设置
│
├── reference/                   # 📖 参考文档
│   ├── ARCHITECTURE.md         # 系统架构
│   ├── FEATURES.md             # 功能说明
│   └── OPTIMIZATION.md         # 性能优化
│
└── archive/                     # 📦 历史归档
    ├── README.md               # 归档说明
    ├── debugging/              # 调试报告
    ├── fixes/                  # 修复报告
    ├── optimizations/          # 优化报告
    └── refactors/              # 重构报告
```

---

## 🔍 按角色查找文档

### 新手开发者
1. [项目概览](PROJECT_OVERVIEW.md)
2. [快速开始](guides/QUICK_START.md)
3. [开发指南](guides/DEVELOPMENT.md)

### 后端开发
1. [系统架构](reference/ARCHITECTURE.md)
2. [数据库架构](database/SCHEMA.md)
3. [数据库模型](database/MODELS.md)

### 前端开发
1. [快速开始](guides/QUICK_START.md)
2. [功能说明](reference/FEATURES.md)
3. [开发指南](guides/DEVELOPMENT.md)

### 运维人员
1. [数据库设置](database/SETUP.md)
2. [运维指南](guides/OPERATIONS.md)

### 项目经理
1. [项目概览](PROJECT_OVERVIEW.md)
2. [功能说明](reference/FEATURES.md)
3. [变更日志](CHANGELOG.md)

---

## 🛠️ 常用命令速查

### 启动开发环境
```bash
docker-compose -f docker-compose.dev.yml up -d  # 启动数据库
npm run dev:backend   # 后端 http://localhost:3001
npm run dev:frontend  # 前端 http://localhost:5173
```

### 数据库管理
```bash
node packages/backend/scripts/db-manager.js check        # 检查连接
node packages/backend/scripts/db-manager.js seed         # 初始化数据
node packages/backend/scripts/db-manager.js seed-test    # 测试数据
node packages/backend/scripts/db-manager.js reset-admin  # 重置管理员
node packages/backend/scripts/db-manager.js refresh-ranks # 刷新排名
```

### 维护
```bash
npm run check:types   # TypeScript 类型检查
npm run audit         # 项目审计
npm run clean:temp    # 清理临时文件
npm run clean:cache   # 清理缓存
npm test              # 运行测试
```

---

## 📊 项目统计

| 类别 | 数量 |
|------|------|
| 前端页面 | 39（主页面 16 + 管理页面 11 + 开发者页面 3 + 认证页面 2 + 其他 7） |
| 后端路由模块 | 23 |
| 后端服务 | 50+ |
| 数据模型 | 18 |
| 数据库迁移文件 | 26 |
| 后端测试文件 | 32 |
| 前端测试文件 | 6 |
| 文档文件 | 13（不含归档） |

---

**维护者**: 开发团队 | **文档版本**: 9.0.0 | **最后更新**: 2026-03-19
