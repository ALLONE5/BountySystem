# 数据库迁移管理

**最后更新**: 2026-03-11

本目录包含赏金猎人平台数据库的 SQL 迁移脚本。

---

## 迁移命名规范

迁移文件应遵循以下命名模式：
`YYYYMMDD_HHMMSS_description.sql`

示例: `20241210_000001_create_core_tables.sql`

---

## 可用迁移

### 核心迁移

#### 20241210_000001_create_core_tables.sql
创建核心数据库表：
- `users` - 用户账户、角色和认证
- `positions` - 系统中的职位/角色
- `user_positions` - 用户和岗位的多对多关系（每用户最多3个）
- `position_admins` - 特定岗位的管理员
- `tasks` - 任务管理，支持层级（最多3层）、依赖和赏金追踪
- `task_dependencies` - 任务依赖关系，防止循环依赖

包含触发器：
- 强制每用户3个岗位限制
- 自动管理叶子任务的可执行标志
- 循环依赖检测

#### 20241210_000002_create_auxiliary_tables.sql
创建辅助和关联表：
- `task_groups` - 团队协作组（项目组）
- `group_members` - 项目组成员
- `task_assistants` - 任务协助者及赏金分配
- `position_applications` - 岗位申请工作流
- `notifications` - 系统通知管理
- `avatars` - 用户头像系统，带等级要求
- `rankings` - 按周期的用户排名（月度/季度/总排名）
- `bounty_algorithms` - 赏金计算算法版本控制
- `admin_budgets` - 管理员额外赏金预算追踪
- `task_reviews` - 任务评审，带评分和额外赏金

包含触发器：
- 验证协助者赏金分配
- 验证管理员预算使用
- 额外赏金自动扣除预算

### 性能优化迁移

#### 20260306_000001_add_performance_indexes.sql
添加性能索引以优化查询速度。

#### 20260310_000002_add_p1_performance_indexes.sql
添加 P1 优先级性能索引。

---

## 运行迁移

### 使用数据库管理工具（推荐）

```bash
# 检查数据库连接
node packages/backend/scripts/db-manager.js check

# 运行所有迁移和种子数据
node packages/backend/scripts/db-manager.js seed
```

### 手动执行

```bash
# 首先运行初始化脚本
psql -h localhost -U postgres -d bounty_hunter -f packages/database/scripts/init.sql

# 然后按顺序运行迁移
psql -h localhost -U postgres -d bounty_hunter -f packages/database/migrations/20241210_000001_create_core_tables.sql
psql -h localhost -U postgres -d bounty_hunter -f packages/database/migrations/20241210_000002_create_auxiliary_tables.sql
psql -h localhost -U postgres -d bounty_hunter -f packages/database/migrations/20260306_000001_add_performance_indexes.sql
psql -h localhost -U postgres -d bounty_hunter -f packages/database/migrations/20260310_000002_add_p1_performance_indexes.sql
```

---

## 验证架构

迁移后验证数据库架构：

```bash
psql -h localhost -U postgres -d bounty_hunter -f packages/database/scripts/verify_schema.sql
```

---

## 回滚迁移

为每个迁移提供了回滚脚本：

```bash
# 回滚辅助表（由于依赖关系必须先回滚）
psql -h localhost -U postgres -d bounty_hunter -f packages/database/migrations/20241210_000002_rollback_auxiliary_tables.sql

# 回滚核心表
psql -h localhost -U postgres -d bounty_hunter -f packages/database/migrations/20241210_000001_rollback_core_tables.sql
```

---

## 迁移指南

1. 迁移应尽可能幂等
2. 数据迁移使用事务
3. 适当时包含回滚脚本
4. 部署前在生产数据副本上测试迁移
5. 始终按顺序运行迁移
6. 运行迁移后验证架构

---

## 数据库约束和业务规则

迁移实现了几个重要的业务规则：

1. **用户岗位限制**: 用户不能拥有超过3个岗位（触发器强制）
2. **任务层级**: 任务只能嵌套3层深（深度 0-2）
3. **循环依赖**: 任务依赖不能形成循环（触发器强制）
4. **可执行任务**: 只有叶子节点（没有子任务的任务）可以执行
5. **赏金分配**: 协助者的总固定分配不能超过任务赏金
6. **管理员预算**: 额外赏金授予受管理员月度预算限制
7. **排名周期**: 排名分别追踪月度、季度和总排名

---

## 相关文档

- [数据库架构](SCHEMA.md) - 完整的数据库设计参考
- [数据库设置](../setup/DATABASE_SETUP.md) - 数据库安装和配置
- [数据库模型](../DATABASE_MODELS_OVERVIEW.md) - 数据库模型概览

---

**维护者**: 开发团队  
**版本**: 2.0.0
