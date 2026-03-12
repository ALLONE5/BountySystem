# 项目文档

**最后更新**: 2026-03-11

欢迎来到赏金猎人平台文档中心。本目录包含项目的完整文档，按类别组织。

---

## 📚 文档导航

### 🚀 快速开始
- [快速开始指南](guides/QUICK_START.md) - 5分钟快速上手项目

### 📖 核心文档
- [项目状态](PROJECT_STATUS.md) - 项目概览和当前状态
- [开发指南](DEVELOPMENT.md) - 开发规范、工具和最佳实践
- [系统架构](ARCHITECTURE.md) - 系统架构和技术设计
- [功能指南](FEATURES_GUIDE.md) - 功能模块详细说明

### ⚙️ 设置文档
- [数据库设置](setup/DATABASE_SETUP.md) - 数据库安装和配置
- [后端设置](setup/BACKEND_SETUP.md) - 后端环境配置

### 🗄️ 数据库文档
- [数据库模型](DATABASE_MODELS_OVERVIEW.md) - 数据库表结构和关系
- [数据库架构](database/SCHEMA.md) - 完整的数据库设计
- [数据库迁移](database/MIGRATIONS.md) - 迁移文件管理

### 🔧 运维文档
- [运维指南](operations/OPERATIONS_GUIDE.md) - 部署、配置和运维

### 📊 优化文档
- [优化索引](OPTIMIZATION_INDEX.md) - 性能优化记录和历史

### 📝 报告和历史
- [变更日志](CHANGELOG.md) - 项目变更历史
- [文档清理报告](reports/DOCUMENTATION_DEEP_CLEANUP_REPORT.md) - 文档清理记录
- [深度清理报告](reports/DEEP_CLEANUP_REPORT.md) - 代码清理记录
- [清理完成报告](reports/CLEANUP_COMPLETE.md) - 项目清理总结
- [文档重组报告](reports/DOCUMENTATION_REORGANIZATION.md) - 文档重组记录
- [历史报告归档](reports/archive/) - 历史修复、优化和重构报告（35个）

---

## 🛠️ 维护工具

### 项目维护
```bash
# 类型检查
node scripts/maintenance.js check-types

# 项目审计
node scripts/maintenance.js audit

# 清理临时文件
node scripts/maintenance.js clean-temp

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

## 📂 文档结构

```
docs/
├── README.md                    # 文档导航 (本文档)
│
├── 核心文档/
│   ├── PROJECT_STATUS.md        # 项目状态
│   ├── CHANGELOG.md             # 变更日志
│   ├── DEVELOPMENT.md           # 开发指南
│   ├── ARCHITECTURE.md          # 系统架构
│   ├── FEATURES_GUIDE.md        # 功能指南
│   ├── DATABASE_MODELS_OVERVIEW.md  # 数据库模型
│   └── OPTIMIZATION_INDEX.md    # 优化索引
│
├── guides/                      # 指南文档
│   └── QUICK_START.md          # 快速开始
│
├── setup/                       # 设置文档
│   ├── DATABASE_SETUP.md       # 数据库设置
│   └── BACKEND_SETUP.md        # 后端设置
│
├── database/                    # 数据库文档
│   ├── SCHEMA.md               # 数据库架构
│   └── MIGRATIONS.md           # 迁移管理
│
├── operations/                  # 运维文档
│   └── OPERATIONS_GUIDE.md     # 运维指南
│
└── reports/                     # 报告文档
    ├── DOCUMENTATION_DEEP_CLEANUP_REPORT.md  # 文档清理
    ├── DEEP_CLEANUP_REPORT.md  # 代码清理
    ├── CLEANUP_COMPLETE.md     # 清理总结
    ├── DOCUMENTATION_REORGANIZATION.md  # 文档重组
    └── archive/                # 历史报告归档
        ├── fixes/              # 修复报告 (15个)
        ├── optimizations/      # 优化报告 (6个)
        └── refactors/          # 重构报告 (10个)
```

---

## 📖 文档规范

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

### 文档分类
- **guides/**: 教程和快速开始指南
- **setup/**: 安装和配置文档
- **database/**: 数据库相关文档
- **operations/**: 运维和部署文档
- **reports/**: 项目报告和记录

---

## 🔍 查找文档

### 按主题查找
- **开始使用**: guides/QUICK_START.md
- **开发**: DEVELOPMENT.md
- **架构**: ARCHITECTURE.md
- **数据库**: database/ 目录
- **部署**: operations/OPERATIONS_GUIDE.md
- **功能**: FEATURES_GUIDE.md

### 按角色查找
- **新手开发者**: guides/QUICK_START.md → DEVELOPMENT.md
- **后端开发**: ARCHITECTURE.md → database/SCHEMA.md
- **前端开发**: DEVELOPMENT.md → FEATURES_GUIDE.md
- **运维人员**: setup/ → operations/OPERATIONS_GUIDE.md
- **项目经理**: PROJECT_STATUS.md → FEATURES_GUIDE.md

---

## 🔗 相关链接

- [GitHub 仓库](#)
- [问题追踪](#)
- [更新日志](#)
- [API 文档](#)

---

## 💡 贡献文档

如果您想改进文档：

1. 确保文档准确且最新
2. 遵循文档规范
3. 使用清晰的语言
4. 包含代码示例
5. 更新文档日期

---

**维护者**: 开发团队  
**文档版本**: 3.0.0
