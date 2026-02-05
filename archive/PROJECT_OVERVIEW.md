# 赏金猎人平台 - 项目总览

## 📋 项目简介

赏金猎人平台是一个企业级任务管理和协作系统，支持多层级任务拆解、智能赏金计算、团队协作、实时通知和多维度数据可视化。

## 🏗️ 系统架构

### 技术栈

**后端 (Backend)**
- **运行时**: Node.js 18+
- **语言**: TypeScript 5.3+
- **框架**: Express.js
- **数据库**: PostgreSQL 14+
- **缓存**: Redis 6+
- **实时通信**: Socket.io
- **认证**: JWT
- **测试**: Vitest
- **队列**: Bull (Redis-based)

**前端 (Frontend)**
- **框架**: React 18
- **语言**: TypeScript 5.3+
- **构建工具**: Vite
- **UI库**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router 6
- **HTTP客户端**: Axios
- **实时通信**: Socket.io-client

**数据库 (Database)**
- **主数据库**: PostgreSQL
- **缓存层**: Redis
- **迁移工具**: 自定义SQL迁移脚本

### 项目结构

```
bounty-hunter-platform/
├── packages/
│   ├── backend/              # 后端服务
│   │   ├── src/
│   │   │   ├── config/       # 配置文件
│   │   │   ├── models/       # 数据模型
│   │   │   ├── services/     # 业务逻辑服务
│   │   │   ├── routes/       # API路由
│   │   │   ├── middleware/   # 中间件
│   │   │   ├── workers/      # 后台任务处理
│   │   │   └── utils/        # 工具函数
│   │   ├── scripts/          # 运维脚本
│   │   └── tests/            # 测试文件
│   │
│   ├── frontend/             # 前端应用
│   │   ├── src/
│   │   │   ├── api/          # API客户端
│   │   │   ├── components/   # React组件
│   │   │   ├── pages/        # 页面组件
│   │   │   ├── stores/       # 状态管理
│   │   │   ├── hooks/        # 自定义Hooks
│   │   │   ├── contexts/     # React Contexts
│   │   │   ├── layouts/      # 布局组件
│   │   │   └── utils/        # 工具函数
│   │   └── public/           # 静态资源
│   │
│   └── database/             # 数据库相关
│       ├── migrations/       # 数据库迁移
│       └── scripts/          # 数据库脚本
│
├── .kiro/                    # Kiro规范文档
│   └── specs/                # 功能规范
│
├── docs/                     # 项目文档（待整理）
└── docker-compose.*.yml      # Docker配置
```

## 🎯 核心功能模块

### 1. 用户与权限管理
- **用户认证**: JWT令牌认证，支持登录/注册/登出
- **角色系统**: 超级管理员、管理员、普通用户
- **岗位系统**: 用户可申请和管理岗位，岗位决定任务权限
- **权限控制**: 基于角色和岗位的细粒度权限控制

### 2. 任务管理系统
- **任务创建**: 支持多层级任务拆解（父任务-子任务）
- **任务属性**: 名称、描述、优先级、复杂度、预估工时、计划时间
- **任务状态**: 待发布、已发布、进行中、已完成、已取消
- **任务依赖**: 支持任务间依赖关系，自动阻塞检测
- **任务承接**: 用户申请承接任务，发布者审批
- **任务操作**: 放弃任务、转让任务、完成任务

### 3. 赏金系统
- **自动计算**: 基于算法自动计算任务赏金
- **算法管理**: 超级管理员可创建和管理赏金算法版本
- **算法参数**: 基础金额、紧急度权重、重要度权重、工时权重
- **赏金分配**: 支持主要承接者和辅助用户的赏金分配
- **分配类型**: 固定金额、百分比分配
- **额外奖励**: 任务完成后可追加额外赏金
- **版本隔离**: 任务使用创建时的算法版本，不受后续算法变更影响

### 4. 协作功能
- **任务组群**: 创建任务组，支持组内任务协作
- **辅助用户**: 为任务添加辅助用户，共同完成任务
- **任务评审**: 任务完成后的评分和评论系统
- **管理员预算**: 管理员有月度额外赏金预算

### 5. 通知系统
- **实时推送**: 基于WebSocket的实时通知
- **通知类型**: 任务相关、赏金相关、系统通知
- **通知管理**: 标记已读、删除通知
- **异步处理**: 使用消息队列处理通知发送

### 6. 排名与头像系统
- **排名计算**: 基于任务完成数、赏金收入、评分等多维度计算
- **排名类型**: 周排名、月排名、总排名
- **头像系统**: 根据排名解锁不同头像
- **头像管理**: 管理员可上传和管理头像资源

### 7. 任务可视化
- **列表视图**: 传统表格视图，支持筛选和排序
- **看板视图**: Kanban风格，按状态分组
- **日历视图**: 按时间维度展示任务
- **甘特图**: 展示任务时间线和依赖关系

### 8. 管理功能
- **用户管理**: 查看、编辑、禁用用户
- **任务管理**: 查看所有任务，管理任务状态
- **申请审核**: 审核岗位申请和任务承接申请
- **岗位管理**: 创建、编辑、删除岗位
- **头像管理**: 上传、配置头像资源
- **赏金算法**: 创建和管理赏金计算算法

### 9. 调度系统
- **定时任务**: 支持创建定时执行的任务
- **Cron表达式**: 灵活的任务调度配置
- **任务监控**: 查看调度任务执行历史

### 10. 性能优化
- **数据库优化**: 索引优化、查询优化
- **缓存策略**: Redis缓存热点数据
- **异步处理**: 消息队列处理耗时操作
- **速率限制**: API请求速率限制
- **连接池**: 数据库连接池管理

## 🔐 安全特性

- **JWT认证**: 安全的令牌认证机制
- **密码加密**: bcrypt加密存储
- **输入验证**: 严格的输入验证和清理
- **SQL注入防护**: 参数化查询
- **XSS防护**: 输入输出转义
- **CSRF防护**: CSRF令牌验证
- **速率限制**: 防止暴力攻击
- **安全头部**: Helmet中间件配置

## 📊 数据模型

### 核心表
- **users**: 用户信息
- **positions**: 岗位定义
- **user_positions**: 用户岗位关系
- **tasks**: 任务信息
- **task_dependencies**: 任务依赖关系
- **task_applications**: 任务申请记录
- **bounty_algorithms**: 赏金算法
- **bounty_assistants**: 赏金辅助用户
- **bounty_transactions**: 赏金交易记录
- **task_reviews**: 任务评审
- **admin_budgets**: 管理员预算
- **task_groups**: 任务组群
- **notifications**: 通知记录
- **rankings**: 排名数据
- **avatars**: 头像资源
- **user_avatars**: 用户头像关系

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd bounty-hunter-platform
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp packages/backend/.env.example packages/backend/.env
# 编辑 .env 文件配置数据库和Redis连接
```

4. **初始化数据库**
```bash
cd packages/database
./scripts/run_migrations.sh bounty_hunter postgres localhost
```

5. **启动服务**
```bash
# 终端1: 启动后端
npm run dev:backend

# 终端2: 启动前端
npm run dev:frontend
```

6. **访问应用**
- 前端: http://localhost:5173
- 后端: http://localhost:3000

### 测试账号
- **超级管理员**: admin / Password123
- **普通用户**: user1 / Password123

## 📖 文档索引

### 快速指南
- [快速启动](./QUICK_START.md) - 快速启动指南
- [服务启动](./START_SERVICES.md) - 详细的服务启动说明
- [测试账号](./TEST_ACCOUNTS.md) - 测试账号信息

### 配置与部署
- [配置说明](./CONFIGURATION.md) - 环境配置详解
- [部署指南](./DEPLOYMENT.md) - 生产环境部署
- [运维手册](./OPERATIONS.md) - 日常运维操作
- [故障排查](./TROUBLESHOOTING.md) - 常见问题解决

### 功能文档
- [赏金系统](./packages/backend/src/services/BOUNTY_SYSTEM.md)
- [赏金分配](./packages/backend/src/services/BOUNTY_DISTRIBUTION_SYSTEM.md)
- [依赖系统](./packages/backend/src/services/DEPENDENCY_SYSTEM.md)
- [组群系统](./packages/backend/src/services/GROUP_SYSTEM.md)
- [通知系统](./packages/backend/src/services/NOTIFICATION_SYSTEM.md)
- [排名头像](./packages/backend/src/services/RANKING_AVATAR_SYSTEM.md)
- [调度系统](./packages/backend/src/services/SCHEDULER_SYSTEM.md)
- [缓存策略](./packages/backend/src/services/CACHING_STRATEGY.md)
- [异步处理](./packages/backend/src/workers/ASYNC_PROCESSING.md)
- [安全机制](./packages/backend/src/middleware/SECURITY.md)

### 实施记录
- [赏金算法管理](./BOUNTY_ALGORITHM_MANAGEMENT.md)
- [岗位管理实施](./POSITION_MANAGEMENT_IMPLEMENTATION.md)
- [头像系统实施](./PROFILE_AVATAR_POSITION_IMPLEMENTATION.md)
- [管理页面重设计](./ADMIN_PAGES_IMPLEMENTATION_COMPLETE.md)
- [UI重构总结](./UI_RESTRUCTURING_SUMMARY.md)

## 🔄 开发工作流

### 分支策略
- `main`: 生产环境分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 紧急修复分支

### 代码规范
- TypeScript严格模式
- ESLint代码检查
- Prettier代码格式化
- 提交前运行测试

### 测试策略
- 单元测试: Vitest
- 集成测试: API测试
- E2E测试: (待实施)

## 📈 性能指标

### 目标指标
- API响应时间: < 200ms (P95)
- 页面加载时间: < 2s
- 数据库查询: < 100ms (P95)
- 缓存命中率: > 80%

### 监控
- 应用日志: Winston
- 性能监控: (待实施)
- 错误追踪: (待实施)

## 🛠️ 维护与支持

### 日常维护
- 数据库备份: 每日自动备份
- 日志清理: 定期清理旧日志
- 缓存清理: Redis内存管理
- 性能监控: 定期性能审查

### 故障处理
1. 查看日志文件
2. 检查服务状态
3. 验证数据库连接
4. 检查Redis连接
5. 参考故障排查文档

## 📝 更新日志

### v1.0.0 (2024-12-31)
- ✅ 完整的用户认证和权限系统
- ✅ 任务管理核心功能
- ✅ 赏金计算和分配系统
- ✅ 实时通知系统
- ✅ 排名和头像系统
- ✅ 多维度任务可视化
- ✅ 完整的管理后台
- ✅ 性能优化和安全加固
- ✅ 生产环境部署配置

## 🤝 贡献指南

### 提交代码
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

### 报告问题
- 使用Issue模板
- 提供详细的复现步骤
- 附上相关日志和截图

## 📄 许可证

私有项目 - 保留所有权利

## 📞 联系方式

如有问题，请通过以下方式联系：
- 项目Issue
- 技术文档
- 团队内部沟通渠道

---

**最后更新**: 2024-12-31
**版本**: 1.0.0
**状态**: 生产就绪 ✅
