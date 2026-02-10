# 赏金猎人平台 - 项目架构全览

## 项目概述

赏金猎人平台是一个任务管理和赏金分配系统，允许管理员发布任务、用户接受任务、完成任务并获得赏金奖励。系统支持复杂的任务层级、团队协作、权限管理和实时通知。

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **路由**: React Router v6
- **状态管理**: Zustand
- **UI 组件库**: Ant Design 5
- **HTTP 客户端**: Axios
- **构建工具**: Vite
- **样式**: CSS + Ant Design 主题定制

### 后端
- **运行时**: Node.js + TypeScript
- **框架**: Express.js
- **数据库**: PostgreSQL
- **缓存**: Redis
- **认证**: JWT
- **日志**: Winston
- **任务队列**: Bull (基于 Redis)
- **实时通信**: WebSocket

### 数据库设计
- **核心表**: users, tasks, positions, project_groups, task_groups
- **辅助表**: notifications, rankings, bounty_transactions, avatars
- **关系**: 复杂的多对多和一对多关系

---

## 核心业务概念

### 1. 用户角色系统

- **普通用户 (user)**: 可以浏览任务、接受任务、完成任务
- **岗位管理员 (position_admin)**: 管理特定岗位的用户和任务
- **超级管理员 (super_admin)**: 拥有所有权限，管理整个系统

### 2. 任务系统

#### 任务状态流转
```
not_started → available → pending_acceptance → in_progress → completed
                                              ↓
                                          abandoned
```

#### 任务层级结构
- **父任务**: 可以包含多个子任务
- **子任务**: 继承父任务的部分属性（项目组、可见性等）
- **深度限制**: 最多 3 层嵌套
- **可执行性**: 只有叶子节点任务（没有子任务）才能被接受和执行

#### 任务可见性
- **PUBLIC**: 所有用户可见
- **POSITION_ONLY**: 仅特定岗位用户可见
- **PRIVATE**: 仅发布者和受邀用户可见

### 3. 赏金系统
- **赏金计算**: 基于任务复杂度、优先级、预估工时等因素
- **赏金分配**: 任务完成后自动分配给执行者
- **赏金算法**: 支持多版本算法，可配置
- **用户余额**: 每个用户有独立的赏金余额账户

### 4. 组织结构


#### 岗位 (Position)
- 用于组织用户和任务
- 每个岗位有管理员
- 用户可以申请加入岗位

#### 项目组 (Project Group)
- 用于组织相关任务
- 支持任务的项目维度分组
- 可以在日历、甘特图等视图中按项目组筛选

#### 任务组 (Task Group)
- 用于团队协作
- 多个用户可以共同完成一个任务
- 支持组内成员管理

---

## 前端架构

### 页面结构

#### 1. 认证页面 (Auth)
**登录页 (LoginPage)**
- 路径: `/auth/login`
- 功能: 用户登录，JWT 认证
- 状态管理: 登录成功后保存 token 和用户信息到 Zustand store

**注册页 (RegisterPage)**
- 路径: `/auth/register`
- 功能: 新用户注册
- 验证: 用户名、邮箱、密码格式验证

#### 2. 主要功能页面

**仪表板 (DashboardPage)**
- 路径: `/dashboard`
- 功能: 
  - 显示用户统计数据（任务数、赏金总额等）
  - 快速访问常用功能
  - 最近任务动态


**我的任务 (TaskListPage)**
- 路径: `/tasks/my-tasks`
- 功能:
  - 显示当前用户的所有任务
  - 支持按状态筛选（进行中、已完成等）
  - 支持按项目组分组显示
  - 任务详情抽屉（TaskDetailDrawer）
- 操作:
  - 查看任务详情
  - 完成任务
  - 放弃任务
  - 创建子任务

**已发布任务 (PublishedTasksPage)**
- 路径: `/tasks/published`
- 功能:
  - 显示当前用户发布的所有任务
  - 查看任务状态和执行者
  - 管理子任务
- 操作:
  - 编辑任务
  - 删除任务
  - 发布/取消发布任务
  - 邀请用户执行任务

**已分配任务 (AssignedTasksPage)**
- 路径: `/tasks/assigned`
- 功能:
  - 显示分配给当前用户的任务
  - 区分待接受和进行中的任务
- 操作:
  - 接受任务
  - 拒绝任务
  - 开始执行

**浏览任务 (BrowseTasksPage)**
- 路径: `/tasks/browse`
- 功能:
  - 浏览所有可用的公开任务
  - 根据可见性规则过滤任务
  - 搜索和筛选功能
- 操作:
  - 申请执行任务
  - 查看任务详情


**任务邀请 (TaskInvitationsPage)**
- 路径: `/tasks/invitations`
- 功能:
  - 显示收到的任务邀请
  - 查看邀请详情
- 操作:
  - 接受邀请
  - 拒绝邀请

**团队/组 (GroupsPage)**
- 路径: `/groups`
- 功能:
  - 显示用户所属的所有团队
  - 查看团队任务
  - 管理团队成员
- 操作:
  - 创建团队
  - 加入团队
  - 退出团队

#### 3. 可视化页面

**任务可视化 (TaskVisualizationPage)**
- 路径: `/tasks/visualization`
- 功能: 提供多种任务视图切换入口

**看板视图 (KanbanPage)**
- 路径: `/tasks/kanban`
- 功能:
  - 按状态列显示任务卡片
  - 拖拽改变任务状态
  - 直观的任务流程管理

**甘特图 (GanttChartPage)**
- 路径: `/tasks/gantt`
- 功能:
  - 时间轴视图显示任务
  - 显示任务依赖关系
  - 按项目组筛选

**日历视图 (CalendarPage)**
- 路径: `/tasks/calendar`
- 功能:
  - 日历形式显示任务
  - 按开始/结束日期展示
  - 按项目组筛选


#### 4. 用户相关页面

**排名页 (RankingPage)**
- 路径: `/ranking`
- 功能:
  - 显示用户赏金排名
  - 支持月度、季度、总榜
  - 显示当前用户排名
- 数据:
  - 累计赏金
  - 完成任务数
  - 排名变化

**通知页 (NotificationPage)**
- 路径: `/notifications`
- 功能:
  - 显示所有通知
  - 标记已读/未读
  - 通知分类（任务、系统、邀请等）
- 实时更新: WebSocket 推送

**个人资料 (ProfilePage)**
- 路径: `/profile`
- 功能:
  - 查看和编辑个人信息
  - 选择头像
  - 查看个人统计
- 数据:
  - 用户名、邮箱
  - 所属岗位
  - 赏金余额
  - 任务统计

**设置页 (SettingsPage)**
- 路径: `/settings`
- 功能:
  - 修改密码
  - 通知偏好设置
  - 界面主题设置


#### 5. 管理员页面 (Admin)

**用户管理 (UserManagementPage)**
- 路径: `/admin/users`
- 权限: position_admin, super_admin
- 功能:
  - 查看所有用户列表
  - 编辑用户信息
  - 修改用户角色
  - 管理用户岗位
  - 查看用户统计报告

**岗位管理 (PositionManagementPage)**
- 路径: `/admin/positions`
- 权限: super_admin
- 功能:
  - 创建/编辑/删除岗位
  - 管理岗位管理员
  - 查看岗位成员
  - 审核岗位申请

**团队管理 (GroupManagementPage)**
- 路径: `/admin/groups`
- 权限: position_admin, super_admin
- 功能:
  - 查看所有团队
  - 管理团队成员
  - 解散团队

**任务管理 (TaskManagementPage)**
- 路径: `/admin/tasks`
- 权限: position_admin, super_admin
- 功能:
  - 查看所有任务
  - 批量操作任务
  - 强制完成/取消任务
  - 任务数据分析


**岗位申请审核 (ApplicationReviewPage)**
- 路径: `/admin/approval`
- 权限: position_admin, super_admin
- 功能:
  - 查看待审核的岗位申请
  - 批准/拒绝申请
  - 查看申请历史

**头像管理 (AvatarManagementPage)**
- 路径: `/admin/avatars`
- 权限: super_admin
- 功能:
  - 上传新头像
  - 管理头像库
  - 设置头像可用性

**赏金算法管理 (BountyAlgorithmPage)**
- 路径: `/admin/bounty-algorithm`
- 权限: super_admin
- 功能:
  - 配置赏金计算参数
  - 查看算法版本
  - 测试算法效果
  - 切换算法版本

---

## 后端架构

### 分层架构

```
Routes (路由层)
    ↓
Middleware (中间件层)
    ↓
Services (业务逻辑层)
    ↓
Repositories (数据访问层)
    ↓
Models (数据模型层)
    ↓
Database (数据库)
```


### 核心服务

#### 1. 认证服务 (UserService)
- 用户注册、登录
- JWT token 生成和验证
- 密码加密（bcrypt）
- 用户信息管理

#### 2. 任务服务 (TaskService)
- 任务 CRUD 操作
- 任务状态管理
- 任务分配和接受
- 子任务管理
- 任务依赖关系
- 任务可见性控制

#### 3. 权限服务 (PermissionService)
- 基于角色的访问控制 (RBAC)
- 资源所有权验证
- 岗位权限检查
- 操作权限验证

#### 4. 赏金服务 (BountyService)
- 赏金计算
- 赏金分配
- 赏金交易记录
- 用户余额管理

#### 5. 排名服务 (RankingService)
- 定期计算用户排名
- 月度/季度/总榜统计
- 排名缓存优化
- 排名历史记录

#### 6. 通知服务 (NotificationService)
- 创建通知
- 推送通知（WebSocket）
- 通知已读管理
- 通知类型分类


#### 7. 团队服务 (GroupService)
- 团队创建和管理
- 成员管理
- 团队任务分配

#### 8. 岗位服务 (PositionService)
- 岗位 CRUD
- 岗位申请审核
- 岗位成员管理
- 岗位管理员管理

#### 9. 项目组服务 (ProjectGroupService)
- 项目组 CRUD
- 任务关联管理

#### 10. 缓存服务 (CacheService)
- Redis 缓存管理
- 缓存键生成
- 缓存失效策略
- 常用数据缓存（用户信息、任务列表等）

#### 11. 队列服务 (QueueService)
- 异步任务处理
- 定时任务调度
- 排名计算任务
- 通知推送任务

#### 12. WebSocket 服务 (WebSocketService)
- 实时通信
- 用户连接管理
- 消息广播
- 房间管理

---

## 核心业务流程

### 1. 用户注册登录流程
```
用户输入信息 → 前端验证 → 发送请求 → 后端验证 
→ 密码加密 → 创建用户 → 生成 JWT → 返回 token 
→ 前端保存 token → 跳转到仪表板
```


### 2. 任务发布流程
```
管理员创建任务 → 填写任务信息（标题、描述、赏金等）
→ 选择可见性和岗位 → 选择项目组（可选）
→ 保存为草稿（is_published=false）
→ 发布任务（is_published=true）
→ 任务进入可用状态（status=available）
→ 符合条件的用户可以看到任务
```

### 3. 任务接受和执行流程

#### 公开任务
```
用户浏览任务 → 申请执行 → 发布者收到通知
→ 发布者审核 → 批准申请
→ 任务状态变为 pending_acceptance
→ 用户接受任务 → 任务状态变为 in_progress
→ 用户完成任务 → 任务状态变为 completed
→ 自动分配赏金
```

#### 邀请任务
```
发布者创建私有任务 → 邀请特定用户
→ 被邀请用户收到通知 → 用户接受邀请
→ 任务状态变为 in_progress
→ 用户完成任务 → 赏金分配
```

### 4. 子任务管理流程
```
父任务创建 → 用户创建子任务
→ 子任务继承父任务属性（项目组、可见性）
→ 子任务独立管理（可分配给不同用户）
→ 所有子任务完成 → 父任务进度自动更新
→ 父任务可以标记为完成
```


### 5. 赏金计算和分配流程
```
任务创建时 → 根据算法计算赏金
→ 考虑因素：复杂度、优先级、预估工时
→ 任务完成时 → 验证任务状态
→ 创建赏金交易记录
→ 更新用户余额
→ 发送通知给用户
→ 更新排名数据（异步）
```

### 6. 排名计算流程
```
定时任务触发（每天/每周）
→ 计算所有用户的赏金总额
→ 按周期分组（月度、季度、总榜）
→ 计算排名（相同赏金相同排名）
→ 保存到 rankings 表
→ 刷新缓存
→ 前端查询时直接从 rankings 表读取
```

### 7. 通知推送流程
```
业务事件触发（任务分配、完成等）
→ 创建通知记录
→ 保存到数据库
→ 检查用户是否在线
→ 如果在线：通过 WebSocket 实时推送
→ 如果离线：下次登录时拉取
→ 用户查看通知 → 标记为已读
```

---

## 数据库设计要点

### 核心表关系

#### Users (用户表)
- 存储用户基本信息
- 关联 positions（多对多）
- 关联 avatars（一对一）
- 关联 tasks（一对多，作为发布者或执行者）


#### Tasks (任务表)
- 存储任务详细信息
- 自关联（parent_id）支持任务层级
- 关联 users（发布者、执行者）
- 关联 positions（可见性控制）
- 关联 project_groups（项目分组）
- 关联 task_groups（团队任务）

#### Positions (岗位表)
- 存储岗位信息
- 关联 users（多对多）
- 关联 tasks（可见性控制）

#### Project_Groups (项目组表)
- 存储项目组信息
- 关联 tasks（一对多）

#### Task_Groups (任务组表)
- 存储团队任务信息
- 关联 users（多对多）
- 关联 tasks（一对一）

#### Notifications (通知表)
- 存储通知信息
- 关联 users（接收者）
- 支持多种通知类型

#### Rankings (排名表)
- 存储用户排名数据
- 按周期分组（月度、季度、总榜）
- 定期更新

#### Bounty_Transactions (赏金交易表)
- 记录所有赏金交易
- 关联 users（发送者、接收者）
- 关联 tasks（交易来源）

---

## 安全机制

### 1. 认证机制
- JWT token 认证
- Token 过期时间：24小时
- 刷新 token 机制


### 2. 权限控制
- 基于角色的访问控制 (RBAC)
- 资源级权限检查
- 中间件层权限验证
- 前端路由守卫

### 3. 数据验证
- 前端表单验证（Ant Design Form）
- 后端参数验证（Validator 工具类）
- SQL 注入防护（参数化查询）
- XSS 防护（输入过滤）

### 4. 速率限制
- API 请求频率限制
- 基于 IP 和用户的限流
- Redis 存储限流计数

---

## 性能优化

### 1. 缓存策略
- **用户信息缓存**: 减少数据库查询
- **任务列表缓存**: 常用查询结果缓存
- **排名数据缓存**: 预计算排名结果
- **缓存失效**: 数据更新时主动失效

### 2. 数据库优化
- **索引优化**: 常用查询字段建立索引
- **查询优化**: 避免 N+1 查询
- **连接池**: 复用数据库连接
- **物化视图**: 复杂查询结果预计算

### 3. 前端优化
- **代码分割**: 路由级别懒加载
- **虚拟滚动**: 长列表性能优化
- **防抖节流**: 搜索、滚动等操作优化
- **状态管理**: Zustand 轻量级状态管理


### 4. 异步处理
- **任务队列**: 耗时操作异步处理
- **定时任务**: 排名计算、数据清理等
- **WebSocket**: 实时通知推送

---

## 实时功能

### WebSocket 通信
- **连接管理**: 用户上线/下线状态
- **房间机制**: 按用户 ID 分组
- **消息类型**:
  - 任务状态更新
  - 新通知推送
  - 排名变化通知
  - 系统公告

### 实时更新场景
1. **任务状态变化**: 执行者完成任务 → 发布者实时收到通知
2. **新任务分配**: 管理员分配任务 → 用户实时收到通知
3. **排名更新**: 排名计算完成 → 用户实时看到新排名
4. **团队消息**: 团队成员操作 → 其他成员实时更新

---

## 部署架构

### 开发环境
```
Frontend (Vite Dev Server) :5173
    ↓
Backend (Express) :3000
    ↓
PostgreSQL :5432
Redis :6379
```

### 生产环境
```
Nginx (反向代理)
    ↓
Frontend (静态文件)
Backend (PM2 集群)
    ↓
PostgreSQL (主从复制)
Redis (哨兵模式)
```


---

## 关键技术决策

### 1. 为什么选择 Zustand 而不是 Redux？
- 更轻量级，学习曲线低
- 无需 Provider 包裹
- TypeScript 支持更好
- 适合中小型项目

### 2. 为什么使用 PostgreSQL？
- 强大的关系型数据库
- 支持复杂查询和事务
- JSON 字段支持
- 成熟的生态系统

### 3. 为什么引入 Redis？
- 高性能缓存
- 支持任务队列（Bull）
- 支持发布订阅（WebSocket）
- 速率限制存储

### 4. 为什么使用 Repository 模式？
- 分离数据访问逻辑
- 便于单元测试
- 统一数据访问接口
- 易于切换数据源

---

## 未来扩展方向

### 1. 功能扩展
- [ ] 任务评论和讨论
- [ ] 任务附件上传
- [ ] 任务模板系统
- [ ] 工作流自动化
- [ ] 移动端 App

### 2. 性能优化
- [ ] 全文搜索（Elasticsearch）
- [ ] CDN 加速
- [ ] 图片压缩和优化
- [ ] 数据库分库分表

### 3. 监控和运维
- [ ] 日志聚合（ELK）
- [ ] 性能监控（Prometheus + Grafana）
- [ ] 错误追踪（Sentry）
- [ ] 自动化部署（CI/CD）


---

## 项目目录结构

### 前端目录结构
```
packages/frontend/src/
├── api/                    # API 请求封装
│   ├── client.ts          # Axios 实例配置
│   ├── auth.ts            # 认证相关 API
│   ├── task.ts            # 任务相关 API
│   ├── user.ts            # 用户相关 API
│   └── ...
├── components/            # 可复用组件
│   ├── common/           # 通用组件
│   ├── TaskDetailDrawer.tsx
│   └── ...
├── contexts/             # React Context
│   └── NotificationContext.tsx
├── hooks/                # 自定义 Hooks
├── layouts/              # 布局组件
│   ├── MainLayout.tsx
│   └── AuthLayout.tsx
├── pages/                # 页面组件
│   ├── auth/            # 认证页面
│   ├── admin/           # 管理员页面
│   └── ...
├── router/               # 路由配置
│   └── index.tsx
├── store/                # Zustand 状态管理
│   └── authStore.ts
├── styles/               # 全局样式
├── theme/                # Ant Design 主题配置
├── types/                # TypeScript 类型定义
└── utils/                # 工具函数
```

### 后端目录结构
```
packages/backend/src/
├── config/               # 配置文件
│   ├── database.ts      # 数据库配置
│   ├── redis.ts         # Redis 配置
│   └── logger.ts        # 日志配置
├── middleware/           # 中间件
│   ├── auth.middleware.ts
│   ├── permission.middleware.ts
│   └── rateLimit.middleware.ts
├── models/               # 数据模型
│   ├── User.ts
│   ├── Task.ts
│   └── ...
├── repositories/         # 数据访问层
│   ├── BaseRepository.ts
│   ├── UserRepository.ts
│   └── ...
├── routes/               # 路由定义
│   ├── auth.routes.ts
│   ├── task.routes.ts
│   └── ...
├── services/             # 业务逻辑层
│   ├── UserService.ts
│   ├── TaskService.ts
│   ├── BountyService.ts
│   └── ...
├── utils/                # 工具类
│   ├── Validator.ts
│   ├── PermissionChecker.ts
│   └── ...
├── workers/              # 后台任务
│   └── QueueWorker.ts
└── index.ts              # 应用入口
```


---

## 开发规范

### 1. 代码规范
- **TypeScript**: 严格模式，类型完整
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **命名规范**: 
  - 组件: PascalCase
  - 函数/变量: camelCase
  - 常量: UPPER_SNAKE_CASE
  - 文件名: kebab-case 或 PascalCase

### 2. Git 规范
- **分支策略**: 
  - main: 生产环境
  - develop: 开发环境
  - feature/*: 功能分支
  - fix/*: 修复分支
- **提交信息**: 
  - feat: 新功能
  - fix: 修复
  - docs: 文档
  - refactor: 重构
  - test: 测试

### 3. API 设计规范
- RESTful 风格
- 统一响应格式
- 错误码规范
- 版本控制

### 4. 测试规范
- 单元测试覆盖率 > 70%
- 集成测试覆盖核心流程
- E2E 测试覆盖关键场景

---

## 常见问题和解决方案

### 1. 任务重复显示问题
**问题**: 排名页面用户重复显示
**原因**: 数据库中存在重复的排名记录
**解决**: 添加唯一约束，清理重复数据

### 2. 权限检查失败
**问题**: 用户无法访问有权限的资源
**原因**: 权限检查逻辑错误或缓存未更新
**解决**: 检查权限逻辑，清除缓存

### 3. WebSocket 连接断开
**问题**: 实时通知不工作
**原因**: 网络问题或服务器重启
**解决**: 实现自动重连机制

### 4. 任务状态不一致
**问题**: 前后端任务状态不同步
**原因**: 缓存未失效或 WebSocket 推送失败
**解决**: 强制刷新或重新登录

---

## 总结

赏金猎人平台是一个功能完整的任务管理和赏金分配系统，采用现代化的技术栈和架构设计。系统支持复杂的任务层级、团队协作、权限管理和实时通知，能够满足企业级任务管理的需求。

**核心优势**:
1. **清晰的架构**: 分层设计，职责明确
2. **完善的权限**: 基于角色的访问控制
3. **实时通信**: WebSocket 实时推送
4. **性能优化**: 缓存、异步处理、数据库优化
5. **可扩展性**: 模块化设计，易于扩展

**适用场景**:
- 企业内部任务管理
- 项目协作平台
- 外包任务分配
- 团队绩效考核
