# 项目文档中心

**最后更新**: 2026-03-12  
**文档版本**: 8.0.0

欢迎来到赏金猎人平台文档中心。所有文档经过重新分类整理，采用清晰的单层子目录结构。

---

## 📚 快速导航

### 🚀 入门指南
- [项目概览](PROJECT_OVERVIEW.md) - 项目简介、技术栈、状态
- [快速开始](guides/QUICK_START.md) - 5分钟快速上手
- [开发指南](guides/DEVELOPMENT.md) - 开发规范和最佳实践
- [运维指南](guides/OPERATIONS.md) - 部署和运维

### 🗄️ 数据库文档
- [数据库模型](database/MODELS.md) - 数据表结构和关系
- [数据库架构](database/SCHEMA.md) - 完整的数据库设计
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
├── README.md                    # 📚 文档导航中心
├── PROJECT_OVERVIEW.md          # 📋 项目概览
├── CHANGELOG.md                 # 📝 变更日志
│
├── guides/                      # 🚀 指南文档
│   ├── QUICK_START.md          # 快速开始
│   ├── DEVELOPMENT.md          # 开发指南
│   └── OPERATIONS.md           # 运维指南
│
├── database/                    # 🗄️ 数据库文档
│   ├── MODELS.md               # 数据库模型
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
    ├── FINAL_CLEANUP_REPORT.md # 清理报告
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
3. [开发指南](guides/DEVELOPMENT.md)

### 前端开发
1. [开发指南](guides/DEVELOPMENT.md)
2. [功能说明](reference/FEATURES.md)
3. [快速开始](guides/QUICK_START.md)

### 运维人员
1. [数据库设置](database/SETUP.md)
2. [运维指南](guides/OPERATIONS.md)

### 项目经理
1. [项目概览](PROJECT_OVERVIEW.md)
2. [功能说明](reference/FEATURES.md)
3. [变更日志](CHANGELOG.md)

---

## 🛠️ 维护工具

### 项目维护
```bash
npm run check:types   # TypeScript类型检查
npm run audit         # 项目审计
npm run clean:temp    # 清理临时文件
npm run clean:cache   # 清理缓存
```

### 数据库管理
```bash
node packages/backend/scripts/db-manager.js check        # 检查连接
node packages/backend/scripts/db-manager.js seed         # 初始化数据
node packages/backend/scripts/db-manager.js seed-test    # 测试数据
node packages/backend/scripts/db-manager.js reset-admin  # 重置管理员
```

---

## 📖 文档规范

### 目录结构
- **单层子目录**: 最多一层子目录分类
- **清晰分类**: guides（指南）、database（数据库）、reference（参考）
- **简洁命名**: 使用清晰的文件名

### 文档格式
- 使用 Markdown 格式
- 包含标题和更新日期
- 长文档包含目录导航
- 代码示例使用代码块

### 文档维护
- 功能变更时更新相关文档
- 定期检查文档准确性
- 保持文档简洁明了
- 及时归档过时文档

---

## 📊 文档统计

| 类别 | 数量 | 位置 |
|------|------|------|
| 核心文档 | 3 | 根目录 |
| 指南文档 | 3 | guides/ |
| 数据库文档 | 4 | database/ |
| 参考文档 | 3 | reference/ |
| 归档文档 | 43 | archive/ |
| **总计** | **56** | |

---

## 🔗 相关链接

- [项目主页](../README.md)
- [变更日志](CHANGELOG.md)
- [归档文档](archive/README.md)

---

**维护者**: 开发团队  
**文档版本**: 8.0.0  
**最后更新**: 2026-03-12
