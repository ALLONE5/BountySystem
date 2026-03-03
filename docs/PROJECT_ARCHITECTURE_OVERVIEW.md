# 赏金猎人平台 - 项目架构全览

**最后更新**: 2026-02-09

## 项目概述

赏金猎人平台是一个企业级任务管理和赏金分配系统，支持任务发布、承接、执行和赏金结算的完整生命周期。系统采用现代化的技术栈，提供任务层级管理、团队协作、权限控制、实时通知和数据可视化等功能。

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
- **运行时**: Node.js 18+ + TypeScript 5
- **框架**: Express.js 4
- **数据库**: PostgreSQL 14+
- **缓存**: Redis 7+
- **认证**: JWT (jsonwebtoken)
- **日志**: Winston (结构化日志)
- **任务队列**: Bull (基于 Redis)
- **实时通信**: WebSocket (ws)
- **测试**: Vitest + Supertest
- **代码质量**: ESLint + Prettier

### 开发工具
- **包管理**: npm workspaces (monorepo)
- **版本控制**: Git
- **容器化**: Docker + Docker Compose
- **进程管理**: PM2 (生产环境)

### 数据库设计
- **核心表**: users, tasks, positions, project_groups, task_groups
- **辅助表**: notifications, rankings, bounty_transactions, avatars, bounty_algorithms
- **关系**: 复杂的多对多和一对多关系，使用外键约束保证数据完整性
- **交易记录**: bounty_transactions 表记录所有赏金交易，支持交易历史查询和审计
- **索引优化**: 在常用查询字段上建立索引，提升查询性能
- **迁移管理**: 使用 SQL 迁移文件管理数据库版本

### 代码质量
- **结构化日志**: 所有日志使用 Winston 记录，包含上下文信息
- **错误处理**: 统一的错误处理机制，自定义错误类型
- **代码复用**: Repository 模式、辅助方法、工具类
- **类型安全**: 完整的 TypeScript 类型定义
- **测试覆盖**: 单元测试和集成测试覆盖核心功能

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
- **母任务**: 可以包含多个子任务
  - 母任务必须先被承接，才能创建子任务
  - 母任务被承接后，承接者负责管理和分解任务
- **子任务**: 继承母任务的部分属性（项目组、可见性等）
  - 子任务可以独立发布和承接
  - 子任务可以由不同的用户承接和执行
  - 子任务的执行独立于母任务的承接者
- **深度限制**: 最多 2 层（depth 0-1）
  - depth 0: 顶级任务（母任务）
  - depth 1: 一级子任务
  - 不允许子任务再创建子任务（不支持孙任务）
- **放弃逻辑**: 
  - 子任务放弃：清空执行者，可重新承接
  - 母任务放弃：保留已完成子任务的执行者和状态，清空未完成子任务的执行者

#### 任务可见性
- **PUBLIC**: 所有用户可见
- **POSITION_ONLY**: 仅特定岗位用户可见
- **PRIVATE**: 仅发布者和受邀用户可见

### 3. 赏金系统
- **赏金计算**: 基于任务复杂度、优先级、预估工时等因素
- **赏金分配**: 任务完成后自动分配给执行者
- **赏金算法**: 支持多版本算法，可配置
- **用户余额**: 每个用户有独立的赏金余额账户
- **交易历史**: 完整记录所有赏金交易，支持查询和审计
- **交易类型**: 
  - task_completion: 任务完成奖励
  - extra_reward: 额外奖励
  - assistant_share: 协作者分成
  - refund: 退款

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
  - 点击累计赏金卡片查看交易历史


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
  - 点击累计赏金卡片查看交易历史
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
Routes (路由层) - API 端点定义
    ↓
Middleware (中间件层) - 认证、权限、验证、限流
    ↓
Services (业务逻辑层) - 核心业务逻辑
    ↓
Repositories (数据访问层) - 数据库操作封装
    ↓
Models (数据模型层) - 数据结构定义
    ↓
Database (数据库) - PostgreSQL
```

### 设计模式

#### 1. Repository 模式
- **BaseRepository**: 提供通用的 CRUD 操作
- **具体 Repository**: 继承 BaseRepository，实现特定业务查询
- **优势**: 数据访问逻辑集中管理，易于测试和维护

#### 2. Service 层模式
- **单一职责**: 每个 Service 负责特定领域的业务逻辑
- **依赖注入**: 通过构造函数注入依赖，便于测试
- **事务管理**: 使用 TransactionManager 统一管理数据库事务

#### 3. 工具类模式
- **Validator**: 统一的数据验证工具
- **PermissionChecker**: 权限检查工具
- **TransactionManager**: 事务管理工具
- **OwnershipValidator**: 资源所有权验证工具


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

#### 4.1 赏金历史服务 (BountyHistoryService)
- 交易历史查询（分页、筛选）
- 交易统计汇总（总收入、总支出、净余额）
- 支持按交易类型筛选
- 关联任务信息查询

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

#### 13. 性能监控服务 (PerformanceMonitor)
- API 响应时间监控
- 数据库查询性能追踪
- 系统资源使用监控
- 性能指标收集

---

## 代码优化和最佳实践

### 1. 结构化日志
**实施状态**: ✅ 已完成

所有后端代码已从 `console.log/error` 迁移到结构化日志：
```typescript
// ✅ 推荐做法
logger.error('Error finding user by ID', {
  error: error instanceof Error ? error.message : String(error),
  userId,
  stack: error instanceof Error ? error.stack : undefined
});
```

**优势**:
- 包含业务上下文（userId, taskId 等）
- 错误对象正确序列化
- 统一的日志格式
- 便于生产环境问题追踪

**详细文档**: `docs/LOGGING_BEST_PRACTICES.md`

### 2. 代码重复消除
**实施状态**: ✅ 已完成

创建辅助方法消除重复代码：
```typescript
// TaskService.getTaskOrThrow() - 消除 12 处重复的 null 检查
private async getTaskOrThrow(taskId: string): Promise<Task> {
  const task = await this.getTask(taskId);
  if (!task) {
    throw new NotFoundError(`Task ${taskId} not found`);
  }
  return task;
}
```

**效果**:
- 减少 36+ 行重复代码
- 提高代码一致性
- 更易维护

### 3. 错误处理
**实施状态**: ✅ 已完成

统一的错误处理机制：
- 自定义错误类型（ValidationError, NotFoundError, AuthorizationError）
- 错误中间件统一处理
- 所有 Repository 和 Service 方法都有 try-catch
- 错误日志包含完整上下文

### 4. 性能优化
**实施状态**: 🔄 持续优化

- ✅ Redis 缓存常用数据
- ✅ 数据库索引优化
- ✅ 查询优化（避免 N+1 查询）
- ✅ 异步任务队列
- 🔄 数据库连接池优化
- 🔄 API 响应时间监控

**详细文档**: `docs/CODE_OPTIMIZATION_ACTION_PLAN.md`

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

### 8. 赏金交易历史查询流程
```
用户点击累计赏金卡片（ProfilePage 或 DashboardPage）
→ 打开赏金交易历史抽屉（BountyHistoryDrawer）
→ 发送 API 请求获取交易历史
→ 后端查询 bounty_transactions 表
→ 关联 tasks 表获取任务名称
→ 计算统计数据（总收入、总支出、净余额）
→ 返回分页数据和统计信息
→ 前端展示交易列表和统计卡片
→ 用户可以按交易类型筛选
→ 用户可以翻页查看更多记录
```

---

## 数据库设计要点

### 核心表关系

#### Users (用户表)
- 存储用户基本信息
- 关联 positions（多对多）
- 关联 avatars（一对一）
- 关联 tasks（一对多，作为发布者或执行者）
- 关联 bounty_transactions（一对多，作为发送者或接收者）

#### Bounty_Transactions (赏金交易表)
**表结构**:
- id: UUID 主键
- task_id: 关联任务（可为空）
- from_user_id: 发送者用户 ID
- to_user_id: 接收者用户 ID
- amount: 交易金额（DECIMAL）
- type: 交易类型（ENUM）
  - task_completion: 任务完成奖励
  - extra_reward: 额外奖励
  - assistant_share: 协作者分成
  - refund: 退款
- description: 交易描述
- status: 交易状态（默认 completed）
- created_at: 创建时间

**索引优化**:
- from_user_id, to_user_id: 用户交易查询
- created_at: 时间排序
- type: 交易类型筛选
- task_id: 任务关联查询

**用途**:
1. **交易历史查询**: 用户可查看完整的赏金收支记录
2. **累计赏金计算**: 计算用户总收入、总支出、净余额
3. **排名系统**: 基于交易记录计算用户排名
4. **财务审计**: 追踪所有赏金流动，确保系统财务透明


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
- 支持交易类型分类（任务完成、额外奖励、协作者分成、退款）
- 用于交易历史查询、累计赏金计算、排名系统、财务审计

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
- [ ] 赏金交易历史导出（CSV/PDF）
- [ ] 赏金交易图表可视化
- [ ] 交易历史日期范围筛选
- [ ] 交易历史全文搜索

### 2. 性能优化
- [ ] 全文搜索（Elasticsearch）
- [ ] CDN 加速
- [ ] 图片压缩和优化
- [ ] 数据库分库分表
- [ ] 交易历史 Redis 缓存
- [ ] 虚拟滚动优化长列表

### 3. 监控和运维
- [ ] 日志聚合（ELK）
- [ ] 性能监控（Prometheus + Grafana）
- [ ] 错误追踪（Sentry）
- [ ] 自动化部署（CI/CD）


---

## 赏金交易历史查看器 (Bounty History Viewer)

### 功能概述
赏金交易历史查看器允许用户查看完整的赏金收支记录，包括交易详情、统计汇总和筛选功能。用户可以通过点击个人资料页或仪表板页的"累计赏金"卡片来访问此功能。

### 访问入口
1. **个人资料页 (ProfilePage)**: 点击"累计赏金"卡片
2. **仪表板页 (DashboardPage)**: 点击"累计赏金"卡片

### 核心功能

#### 1. 交易历史展示
以表格形式展示用户的所有赏金交易记录：
- **日期**: 交易发生时间（YYYY-MM-DD HH:mm 格式）
- **任务名称**: 关联的任务名称（通过 LEFT JOIN 查询）
- **金额**: 
  - 收入显示为绿色 +金额
  - 支出显示为红色 -金额
- **类型**: 交易类型标签（带颜色区分）
- **描述**: 交易的详细描述信息

#### 2. 统计汇总
在抽屉顶部显示三个关键统计指标：
- **总收入**: 所有收入交易的总和（绿色，向上箭头图标）
- **总支出**: 所有支出交易的总和（红色，向下箭头图标）
- **净余额**: 总收入 - 总支出（根据正负值显示不同颜色）

#### 3. 交易类型筛选
支持按以下交易类型筛选：
- **全部**: 显示所有交易类型
- **任务完成** (task_completion): 完成任务获得的赏金奖励
- **额外奖励** (extra_reward): 发布者给予的额外奖励
- **协作者分成** (assistant_share): 作为协作者获得的赏金分成
- **退款** (refund): 退回的赏金金额

#### 4. 分页功能
- 每页显示 20 条交易记录
- 显示当前页码和总页数
- 支持页码跳转导航
- 筛选条件改变时自动重置到第一页
- 翻页时保持筛选条件

### 技术实现

#### 后端 API 端点

**端点 1: GET /api/bounty-history/:userId**

获取用户的分页交易历史记录。

**查询参数**:
- `page` (可选，默认 1): 当前页码
- `limit` (可选，默认 20): 每页记录数（范围 1-100）
- `type` (可选): 交易类型筛选

**返回数据结构**:
```typescript
{
  transactions: BountyTransactionWithDetails[],  // 交易列表
  pagination: {
    currentPage: number,      // 当前页码
    pageSize: number,         // 每页大小
    totalCount: number,       // 总记录数
    totalPages: number        // 总页数
  },
  summary: {
    totalEarned: number,      // 总收入
    totalSpent: number,       // 总支出
    netBalance: number,       // 净余额
    transactionCount: number  // 交易数量
  }
}
```

**权限控制**:
- 普通用户只能查看自己的交易记录
- 超级管理员可以查看任何用户的交易记录
- 未授权访问返回 403 Forbidden

**端点 2: GET /api/bounty-history/:userId/summary**

仅获取统计汇总信息，不返回交易列表。

**查询参数**:
- `type` (可选): 按交易类型筛选统计

**返回数据**: 总收入、总支出、净余额、交易数量

#### 数据库查询优化

**主查询** - 使用窗口函数和 LEFT JOIN:
```sql
SELECT 
  bt.id, bt.task_id, bt.from_user_id, bt.to_user_id,
  bt.amount, bt.type, bt.description, bt.created_at,
  t.name as task_name,
  COUNT(*) OVER() as total_count
FROM bounty_transactions bt
LEFT JOIN tasks t ON bt.task_id = t.id
WHERE (bt.from_user_id = $1 OR bt.to_user_id = $1)
  AND bt.type = $2  -- 可选的类型筛选
ORDER BY bt.created_at DESC
LIMIT $3 OFFSET $4;
```

**统计查询** - 使用 CASE 语句分别计算:
```sql
SELECT 
  COALESCE(SUM(CASE WHEN to_user_id = $1 THEN amount ELSE 0 END), 0) as total_earned,
  COALESCE(SUM(CASE WHEN from_user_id = $1 THEN amount ELSE 0 END), 0) as total_spent,
  COUNT(*) as transaction_count
FROM bounty_transactions
WHERE (from_user_id = $1 OR to_user_id = $1);
```

**性能优化**:
- 使用 `COUNT(*) OVER()` 窗口函数在单次查询中获取总数
- 在 from_user_id、to_user_id、created_at、type 字段上建立索引
- 参数化查询防止 SQL 注入并启用查询计划缓存

#### 前端组件实现

**BountyHistoryDrawer 组件**
- **位置**: `packages/frontend/src/components/BountyHistoryDrawer.tsx`
- **技术栈**: React + TypeScript + Ant Design
- **响应式设计**: 
  - 桌面端: 800px 固定宽度
  - 移动端: 100% 全屏宽度

**组件状态管理**:
```typescript
interface BountyHistoryDrawerState {
  transactions: BountyTransactionWithDetails[];  // 交易列表
  loading: boolean;                              // 加载状态
  error: string | null;                          // 错误信息
  currentPage: number;                           // 当前页码
  pageSize: number;                              // 每页大小
  totalCount: number;                            // 总记录数
  selectedType: TransactionType | 'all';         // 选中的类型
  summary: BountySummary | null;                 // 统计汇总
}
```

**交互流程**:
1. 用户点击累计赏金卡片
2. 打开抽屉，显示加载动画（Spin 组件）
3. 发送 API 请求获取第一页数据
4. 渲染统计卡片、筛选下拉框、交易表格
5. 用户可以选择交易类型筛选或翻页
6. 关闭抽屉时自动清理所有状态

### 用户体验优化

#### 视觉反馈
- **悬停效果**: 累计赏金卡片悬停时上浮并增强阴影（0.3s 过渡动画）
- **加载状态**: 显示 Spin 组件和"加载中..."提示文字
- **空状态**: 无交易记录时显示"暂无交易记录"提示
- **错误处理**: 显示错误 Alert 组件和重试按钮
- **金额颜色**: 收入绿色、支出红色，直观区分

#### 性能优化
- **懒加载**: 抽屉内容仅在打开时才加载数据
- **状态清理**: 关闭抽屉时重置所有状态，释放内存
- **分页查询**: 每次仅加载 20 条记录，减少数据传输量
- **索引优化**: 数据库索引加速常用查询
- **缓存策略**: 可选的 Redis 缓存层（未来增强）

#### 安全性
- **认证检查**: 所有 API 请求需要有效的 JWT token
- **权限验证**: 用户只能查看自己的交易记录
- **参数验证**: 后端严格验证所有输入参数
  - UUID 格式验证
  - 分页参数范围验证（page >= 1, limit 1-100）
  - 交易类型枚举验证
- **SQL 注入防护**: 使用参数化查询

### 测试覆盖

#### 后端测试 (16 个测试用例 - 全部通过)
**BountyHistoryService.test.ts**:
- getUserTransactionHistory 方法（11 个测试）
  - 空结果处理
  - 接收者交易查询
  - 发送者交易查询
  - 混合交易查询（发送者和接收者）
  - 时间倒序排序验证
  - 任务名称 LEFT JOIN 关联
  - 空任务 ID 处理
  - 交易类型筛选
  - 分页正确性验证
  - 无效页码参数错误处理
  - 无效限制参数错误处理
- getUserBountySummary 方法（5 个测试）
  - 零交易统计
  - 总收入计算
  - 总支出计算
  - 混合交易净余额计算
  - 按类型筛选统计

**测试执行时间**: 472ms

#### 前端测试 (14 个测试用例 - 全部通过)
**BountyHistoryDrawer.test.tsx**:
- 组件结构验证
- Props 接口验证
- 状态管理验证
- 交易类型标签和颜色映射
- 需求覆盖验证
- 分页逻辑测试
- 金额显示逻辑（正负号和颜色）
- 响应式设计验证

### 交易类型说明

| 类型 | 中文标签 | 标签颜色 | 说明 | 示例场景 |
|------|---------|---------|------|---------|
| `task_completion` | 任务完成 | 绿色 | 完成任务获得的赏金奖励 | 用户完成任务，系统自动发放赏金 |
| `extra_reward` | 额外奖励 | 蓝色 | 发布者给予的额外奖励 | 任务完成质量优秀，发布者额外奖励 |
| `assistant_share` | 协作者分成 | 紫色 | 作为协作者获得的赏金分成 | 协作完成任务，主执行者分配赏金 |
| `refund` | 退款 | 橙色 | 退回的赏金金额 | 任务取消或异常，退回已支付赏金 |

### 数据示例

```typescript
// 任务完成奖励
{
  id: 'uuid-1',
  type: 'task_completion',
  from_user_id: 'admin-id',
  to_user_id: 'user-id',
  amount: 500,
  task_id: 'task-id',
  task_name: '开发用户登录功能',
  description: '完成任务获得赏金',
  created_at: '2026-02-06T10:30:00Z'
}

// 额外奖励
{
  id: 'uuid-2',
  type: 'extra_reward',
  from_user_id: 'publisher-id',
  to_user_id: 'executor-id',
  amount: 100,
  task_id: 'task-id',
  task_name: '优化数据库查询性能',
  description: '任务完成质量优秀，额外奖励',
  created_at: '2026-02-05T15:20:00Z'
}

// 协作者分成
{
  id: 'uuid-3',
  type: 'assistant_share',
  from_user_id: 'executor-id',
  to_user_id: 'assistant-id',
  amount: 150,
  task_id: 'task-id',
  task_name: '实现支付接口集成',
  description: '协作完成任务，分成赏金',
  created_at: '2026-02-04T09:15:00Z'
}

// 退款
{
  id: 'uuid-4',
  type: 'refund',
  from_user_id: 'system',
  to_user_id: 'user-id',
  amount: 200,
  task_id: null,
  task_name: null,
  description: '任务取消，退回赏金',
  created_at: '2026-02-03T14:45:00Z'
}
```

### 实现文件清单

#### 后端文件
- ✅ `packages/backend/src/services/BountyHistoryService.ts` - 核心业务逻辑
- ✅ `packages/backend/src/services/BountyHistoryService.test.ts` - 单元测试
- ✅ `packages/backend/src/routes/bountyHistory.routes.ts` - API 路由定义
- ✅ `packages/backend/src/index.ts` - 路由注册
- ✅ `packages/database/migrations/20241212_000001_update_bounty_transactions_schema.sql` - 数据库迁移

#### 前端文件
- ✅ `packages/frontend/src/api/bounty.ts` - API 客户端方法
- ✅ `packages/frontend/src/components/BountyHistoryDrawer.tsx` - 抽屉组件
- ✅ `packages/frontend/src/components/BountyHistoryDrawer.test.tsx` - 组件测试
- ✅ `packages/frontend/src/pages/ProfilePage.tsx` - 个人资料页集成
- ✅ `packages/frontend/src/pages/DashboardPage.tsx` - 仪表板页集成
- ✅ `packages/frontend/src/types/index.ts` - TypeScript 类型定义

### 未来增强方向

#### 已规划的功能
1. **导出功能**: 支持导出交易历史为 CSV 或 PDF 格式
2. **日期范围筛选**: 添加日期选择器，支持按自定义时间段查询
3. **搜索功能**: 按任务名称或交易描述进行全文搜索
4. **交易详情模态框**: 点击交易行查看完整的交易详情
5. **实时更新**: 通过 WebSocket 推送新交易通知
6. **图表可视化**: 显示收支趋势折线图和交易类型饼图
7. **批量操作**: 支持批量导出或标记交易
8. **交易备注**: 允许用户为交易添加个人备注

#### 性能优化方向
1. **Redis 缓存**: 缓存用户最近的交易历史
2. **虚拟滚动**: 对于大量交易记录使用虚拟滚动优化
3. **预加载**: 预加载下一页数据提升翻页体验
4. **压缩传输**: 启用 gzip 压缩减少数据传输量

### 实施状态

**状态**: ✅ 已完成并上线

**完成时间**: 2026年2月6日

**测试状态**: 
- 后端测试: 16/16 通过 ✅
- 前端测试: 14/14 通过 ✅
- 集成测试: 手动测试通过 ✅

**文档状态**: 
- API 文档: 完整 ✅
- 用户手册: 完整 ✅
- 开发文档: 完整 ✅

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
│   ├── bounty.ts          # 赏金相关 API（含交易历史）
│   └── ...
├── components/            # 可复用组件
│   ├── common/           # 通用组件
│   ├── TaskDetailDrawer.tsx
│   ├── BountyHistoryDrawer.tsx  # 赏金交易历史抽屉
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
│   ├── bountyHistory.routes.ts  # 赏金交易历史路由
│   └── ...
├── services/             # 业务逻辑层
│   ├── UserService.ts
│   ├── TaskService.ts
│   ├── BountyService.ts
│   ├── BountyHistoryService.ts  # 赏金交易历史服务
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

## 项目文档结构

### 核心文档
- **PROJECT_ARCHITECTURE_OVERVIEW.md** (本文档) - 项目架构全览
- **README.md** - 项目介绍和快速开始
- **DEVELOPMENT_GUIDE.md** - 开发指南
- **DATABASE_MODELS_OVERVIEW.md** - 数据库模型概览
- **BACKEND_FILE_STRUCTURE.md** - 后端文件结构说明

### 功能文档
- **MY_TASKS_PAGE_LOGIC.md** - 我的任务页面逻辑说明
- **BROWSE_TASKS_VISIBILITY_LOGIC.md** - 浏览任务可见性逻辑
- **NOTIFICATION_SYSTEM_REVIEW_LOGIC.md** - 通知系统审核逻辑
- **GROUP_DISSOLUTION_FEATURE.md** - 组群解散功能
- **TASK_ASSIGNMENT_INVITATION_FEATURE.md** - 任务分配邀请功能
- **SUBTASK_*.md** - 子任务相关功能文档
- **POSITION_*.md** - 岗位管理相关文档
- **RANKING_*.md** - 排名系统相关文档

### 代码质量文档
- **LOGGING_BEST_PRACTICES.md** - 日志记录最佳实践
- **CODE_OPTIMIZATION_ACTION_PLAN.md** - 代码优化行动计划
- **CODE_OPTIMIZATION_COMPLETED_WORK.md** - 已完成的优化工作
- **DEEP_CODE_REVIEW_FINDINGS.md** - 深度代码审查发现

### 修复文档
- **ADMIN_TASK_MANAGEMENT_FIX.md** - 管理任务页面修复
- **GANTT_CHART_PROGRESS_FIX.md** - 甘特图进度显示修复
- **TASK_COMPLETE_*.md** - 任务完成相关修复

### 分析文档 (docs/analysis/)
- **BACKEND_CODE_REVIEW_AND_REFACTORING_PLAN.md** - 后端代码审查和重构计划
- **DATABASE_MODEL_SERVICE_MAPPING.md** - 数据库模型和服务映射
- **TASK_RELATIONSHIP_*.md** - 任务关系设计分析

---

## 开发规范

### 1. 代码规范
- **TypeScript**: 严格模式，完整类型定义
- **ESLint**: 代码质量检查，遵循 Airbnb 规范
- **Prettier**: 代码格式化，统一代码风格
- **命名规范**: 
  - 组件/类: PascalCase (例: TaskService, UserRepository)
  - 函数/变量: camelCase (例: getUserById, taskList)
  - 常量: UPPER_SNAKE_CASE (例: MAX_RETRY_COUNT)
  - 文件名: kebab-case 或 PascalCase (例: task-service.ts, TaskService.ts)
  - 私有方法: 以下划线开头或使用 private 关键字

### 2. 日志规范
- **禁止使用**: console.log, console.error, console.warn
- **使用 logger**: 
  ```typescript
  logger.error('操作描述', { error, userId, taskId });
  logger.warn('警告信息', { context });
  logger.info('重要操作', { data });
  logger.debug('调试信息', { details });
  ```
- **包含上下文**: 所有日志必须包含相关的业务上下文
- **错误序列化**: 使用 `error instanceof Error ? error.message : String(error)`

### 3. Git 规范
- **分支策略**: 
  - main: 生产环境，受保护
  - develop: 开发环境
  - feature/*: 新功能分支
  - fix/*: 修复分支
  - refactor/*: 重构分支
- **提交信息格式**: 
  ```
  <type>(<scope>): <subject>
  
  <body>
  
  <footer>
  ```
- **提交类型**:
  - feat: 新功能
  - fix: 修复 bug
  - docs: 文档更新
  - refactor: 代码重构
  - test: 测试相关
  - chore: 构建/工具相关
  - perf: 性能优化

### 4. API 设计规范
- **RESTful 风格**: 使用标准 HTTP 方法（GET, POST, PUT, DELETE）
- **统一响应格式**:
  ```typescript
  // 成功
  { data: T, message?: string }
  
  // 错误
  { error: string, type: string, details?: any }
  ```
- **错误码规范**:
  - 400: 请求参数错误
  - 401: 未认证
  - 403: 无权限
  - 404: 资源不存在
  - 500: 服务器错误
- **版本控制**: 通过 URL 路径版本化（/api/v1/...）

### 5. 测试规范
- **单元测试**: 覆盖率 > 70%
- **测试文件命名**: `*.test.ts` 或 `*.spec.ts`
- **测试结构**: Arrange-Act-Assert (AAA) 模式
- **Mock 数据**: 使用 test-utils 中的 fixtures 和 generators
- **集成测试**: 覆盖核心业务流程
- **E2E 测试**: 覆盖关键用户场景

### 6. 文档规范
- **代码注释**: 
  - 所有 public 方法必须有 JSDoc 注释
  - 复杂逻辑必须有行内注释
  - 注释使用中文或英文，保持一致
- **README**: 每个模块/包都应有 README.md
- **变更日志**: 重要变更记录在 CHANGELOG.md
- **API 文档**: 使用 JSDoc 或 Swagger 生成

---

## 常见问题和解决方案

### 1. 任务重复显示问题
**问题**: 排名页面用户重复显示  
**原因**: 数据库中存在重复的排名记录  
**解决**: 
- 添加唯一约束 `UNIQUE(user_id, period_type, period_value)`
- 运行清理脚本删除重复数据
- 修复排名计算逻辑

### 2. 权限检查失败
**问题**: 用户无法访问有权限的资源  
**原因**: 权限检查逻辑错误或缓存未更新  
**解决**: 
- 检查 PermissionChecker 逻辑
- 清除 Redis 缓存
- 重新登录刷新 token

### 3. WebSocket 连接断开
**问题**: 实时通知不工作  
**原因**: 网络问题或服务器重启  
**解决**: 
- 实现自动重连机制
- 添加心跳检测
- 检查 WebSocket 服务状态

### 4. 任务状态不一致
**问题**: 前后端任务状态不同步  
**原因**: 缓存未失效或 WebSocket 推送失败  
**解决**: 
- 强制刷新页面
- 清除浏览器缓存
- 检查 WebSocket 连接状态
- 重新登录

### 5. 数据库连接池耗尽
**问题**: 大量请求时数据库连接失败  
**原因**: 连接池配置不当或连接泄漏  
**解决**:
- 增加连接池大小
- 检查是否有未释放的连接
- 使用 TransactionManager 确保连接正确释放

### 6. 赏金交易历史查询慢
**问题**: 用户交易记录多时查询缓慢  
**原因**: 缺少索引或查询未优化  
**解决**:
- 在 from_user_id, to_user_id, created_at 上建立索引
- 使用分页查询
- 考虑添加 Redis 缓存

---

## 性能监控和优化

### 监控指标
- **API 响应时间**: P50, P95, P99
- **数据库查询时间**: 慢查询日志
- **缓存命中率**: Redis 统计
- **错误率**: 按端点统计
- **并发连接数**: WebSocket 连接数
- **内存使用**: Node.js 堆内存
- **CPU 使用率**: 进程 CPU 占用

### 性能优化策略
1. **数据库优化**
   - 添加必要的索引
   - 优化复杂查询
   - 使用连接池
   - 定期 VACUUM 和 ANALYZE

2. **缓存策略**
   - 用户信息缓存（TTL: 1小时）
   - 任务列表缓存（TTL: 30分钟）
   - 排名数据缓存（TTL: 5分钟）
   - 缓存失效策略：主动失效 + TTL

3. **异步处理**
   - 排名计算异步化
   - 通知推送异步化
   - 邮件发送异步化
   - 使用 Bull 队列管理

4. **前端优化**
   - 代码分割和懒加载
   - 虚拟滚动长列表
   - 防抖节流
   - 图片懒加载和压缩

---

## 部署架构

### 开发环境
```
Frontend (Vite Dev Server) :5173
    ↓
Backend (Express + Nodemon) :3000
    ↓
PostgreSQL :5432
Redis :6379
```

### 生产环境
```
Nginx (反向代理 + 负载均衡)
    ↓
Frontend (静态文件服务)
Backend (PM2 集群模式，4 实例)
    ↓
PostgreSQL (主从复制)
    ├── Master (读写)
    └── Slave (只读)
Redis (哨兵模式，3 节点)
    ├── Master
    ├── Slave 1
    └── Slave 2
```

### Docker 部署
- **开发环境**: `docker-compose.dev.yml`
- **生产环境**: `docker-compose.production.yml`
- **服务**:
  - frontend: Nginx + 静态文件
  - backend: Node.js + PM2
  - postgres: PostgreSQL 14
  - redis: Redis 7

---

## 总结

赏金猎人平台是一个功能完整、架构清晰的企业级任务管理系统。通过采用现代化的技术栈和最佳实践，系统具有良好的可维护性、可扩展性和性能表现。

**核心优势**:
1. **清晰的架构**: 分层设计，职责明确，易于理解和维护
2. **完善的权限**: 基于角色的访问控制，细粒度权限管理
3. **实时通信**: WebSocket 实时推送，用户体验流畅
4. **性能优化**: 多层缓存、异步处理、数据库优化
5. **代码质量**: 结构化日志、统一错误处理、高测试覆盖率
6. **可扩展性**: 模块化设计，易于添加新功能

**适用场景**:
- 企业内部任务管理和协作
- 项目管理和进度跟踪
- 外包任务分配和管理
- 团队绩效考核和激励
- 知识工作者的工作量化

**技术亮点**:
- Monorepo 架构，统一管理前后端代码
- Repository 模式，数据访问层抽象
- 结构化日志，生产环境可观测性强
- 完整的赏金交易历史追踪
- 实时通知和状态同步
- 多维度数据可视化（看板、甘特图、日历）

**持续改进**:
- 代码质量持续优化（已完成 P0 任务）
- 性能监控和优化（进行中）
- 功能扩展和用户体验提升（规划中）
- 测试覆盖率提升（目标 80%+）

---

**文档维护**: 本文档随项目演进持续更新  
**最后更新**: 2026-02-09  
**维护者**: 开发团队
