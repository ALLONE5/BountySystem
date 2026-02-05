# 设计文档

## 概述

赏金猎人平台是一个基于Web的任务管理和悬赏系统，支持多层级任务拆解、基于岗位的权限控制、团队协作、自动赏金计算和多种可视化方式。系统采用前后端分离架构，后端提供RESTful API，前端使用现代Web框架构建响应式用户界面。

核心功能包括：
- 三层任务层级结构管理
- 基于岗位的用户权限系统
- 任务依赖和自动调度
- 动态赏金计算引擎
- 多种任务可视化（甘特图、看板、日历、列表）
- 实时通知系统
- 团队协作和赏金分配

## 架构

### 系统架构

系统采用三层架构：

```
┌─────────────────────────────────────────────────────────┐
│                    前端层 (Frontend)                      │
│  React/Vue + TypeScript + 可视化库 (D3.js/Chart.js)      │
└─────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────┐
│                   应用层 (Application)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  任务服务    │  │  用户服务    │  │  通知服务    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  赏金服务    │  │  权限服务    │  │  调度服务    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   数据层 (Data Layer)                     │
│  关系型数据库 (PostgreSQL) + 缓存 (Redis)                 │
└─────────────────────────────────────────────────────────┘
```

### 技术栈建议

**后端：**
- 语言：Node.js (TypeScript) 或 Python (FastAPI)
- 数据库：PostgreSQL（支持复杂查询和事务）
- 缓存：Redis（用于会话、通知队列）
- 消息队列：Redis Pub/Sub 或 RabbitMQ（实时通知）
- 定时任务：Node-cron 或 Celery（调度和提醒）

**前端：**
- 框架：React 或 Vue.js
- 状态管理：Redux/Zustand 或 Pinia
- UI组件库：Ant Design 或 Element Plus
- 可视化：D3.js（甘特图）、React-Beautiful-DnD（看板）、FullCalendar（日历）
- 实时通信：Socket.io 或 WebSocket

## 组件和接口

### 核心服务组件

#### 1. 任务服务 (TaskService)

负责任务的CRUD操作、层级管理和依赖关系。

**主要接口：**
```typescript
interface TaskService {
  createTask(task: TaskCreateDTO): Promise<Task>
  updateTask(taskId: string, updates: TaskUpdateDTO): Promise<Task>
  deleteTask(taskId: string): Promise<void>
  getTask(taskId: string): Promise<Task>
  getTasksByUser(userId: string, role: 'publisher' | 'assignee'): Promise<Task[]>
  addSubtask(parentId: string, subtask: TaskCreateDTO): Promise<Task>
  addDependency(taskId: string, dependsOnId: string): Promise<void>
  removeDependency(taskId: string, dependsOnId: string): Promise<void>
  validateTaskHierarchy(parentId: string, depth: number): boolean
  aggregateParentTaskStats(parentId: string): Promise<TaskStats>
}
```

#### 2. 用户服务 (UserService)

管理用户账户、岗位和个人信息。

**主要接口：**
```typescript
interface UserService {
  createUser(user: UserCreateDTO): Promise<User>
  updateUser(userId: string, updates: UserUpdateDTO): Promise<User>
  getUserById(userId: string): Promise<User>
  applyForPosition(userId: string, positionId: string, reason: string): Promise<PositionApplication>
  getUserPositions(userId: string): Promise<Position[]>
  updateAvatar(userId: string, avatarId: string): Promise<User>
  getAvailableAvatars(userId: string): Promise<Avatar[]>
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>
}
```

#### 3. 权限服务 (PermissionService)

处理基于角色的访问控制和岗位验证。

**主要接口：**
```typescript
interface PermissionService {
  checkTaskAccess(userId: string, taskId: string, action: Action): Promise<boolean>
  checkPositionMatch(userId: string, positionId: string): Promise<boolean>
  getUserRole(userId: string): Promise<UserRole>
  approvePositionApplication(applicationId: string, adminId: string, approved: boolean, reason?: string): Promise<void>
  canManagePosition(adminId: string, positionId: string): Promise<boolean>
}
```

#### 4. 赏金服务 (BountyService)

计算和分配任务赏金。

**主要接口：**
```typescript
interface BountyService {
  calculateBounty(task: Task): Promise<number>
  updateBountyAlgorithm(algorithm: BountyAlgorithm): Promise<void>
  getBountyAlgorithm(): Promise<BountyAlgorithm>
  distributeBounty(taskId: string): Promise<BountyDistribution>
  addAssistant(taskId: string, assistantId: string, allocation: BountyAllocation): Promise<void>
  grantExtraBounty(taskId: string, adminId: string, amount: number, comment: string): Promise<void>
  getAdminBudget(adminId: string): Promise<AdminBudget>
}
```

#### 5. 通知服务 (NotificationService)

管理系统通知和实时推送。

**主要接口：**
```typescript
interface NotificationService {
  sendNotification(notification: NotificationDTO): Promise<void>
  broadcastNotification(adminId: string, message: string): Promise<void>
  getUserNotifications(userId: string, unreadOnly: boolean): Promise<Notification[]>
  markAsRead(notificationId: string): Promise<void>
  scheduleDeadlineReminder(taskId: string): Promise<void>
}
```

#### 6. 调度服务 (SchedulerService)

自动任务调度和依赖管理。

**主要接口：**
```typescript
interface SchedulerService {
  checkDependenciesResolved(taskId: string): Promise<boolean>
  updateTaskAvailability(taskId: string): Promise<void>
  recommendTasks(userId: string): Promise<Task[]>
  evaluateWorkload(userId: string): Promise<WorkloadAnalysis>
  reprioritizeTasks(): Promise<void>
}
```

#### 7. 组群服务 (GroupService)

管理任务组群和团队协作。

**主要接口：**
```typescript
interface GroupService {
  createGroup(name: string, creatorId: string): Promise<TaskGroup>
  addMember(groupId: string, userId: string): Promise<void>
  removeMember(groupId: string, userId: string): Promise<void>
  assignTaskToGroup(taskId: string, groupId: string): Promise<void>
  getGroupTasks(groupId: string): Promise<Task[]>
  getGroupMembers(groupId: string): Promise<User[]>
}
```

## 数据模型

### 核心实体

#### User（用户）
```typescript
interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  avatarId: string
  role: UserRole  // 'user' | 'position_admin' | 'super_admin'
  positions: Position[]  // 最多3个
  createdAt: Date
  lastLogin: Date
}
```

#### Position（岗位）
```typescript
interface Position {
  id: string
  name: string
  description: string
  adminIds: string[]  // 职位管理员
  requiredSkills: string[]
}
```

#### Task（任务）
```typescript
interface Task {
  id: string
  name: string
  description: string
  parentId: string | null
  depth: number  // 0-2 (最多三层)
  isExecutable: boolean  // 最底层任务
  
  // 属性
  tags: string[]
  createdAt: Date
  plannedStartDate: Date
  plannedEndDate: Date
  actualStartDate: Date | null
  actualEndDate: Date | null
  estimatedHours: number
  complexity: number  // 1-5
  priority: number  // 1-5
  status: TaskStatus
  positionId: string | null
  visibility: Visibility
  
  // 赏金
  bountyAmount: number
  bountyAlgorithmVersion: string
  
  // 关系
  publisherId: string
  assigneeId: string | null
  groupId: string | null
  dependencies: string[]  // 前置任务ID列表
  
  // 统计（母任务）
  aggregatedStats: TaskStats | null
  
  // 进度
  progress: number  // 0-100
}
```

#### TaskStatus（任务状态）
```typescript
enum TaskStatus {
  NOT_STARTED = 'not_started',
  AVAILABLE = 'available',  // 依赖已解除，可承接
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}
```

#### Visibility（可见性）
```typescript
enum Visibility {
  PUBLIC = 'public',  // 所有人可见
  POSITION_ONLY = 'position_only',  // 仅特定岗位可见
  PRIVATE = 'private'  // 仅发布者和承接者可见
}
```

#### TaskDependency（任务依赖）
```typescript
interface TaskDependency {
  id: string
  taskId: string
  dependsOnTaskId: string
  createdAt: Date
}
```

#### TaskAssistant（辅助用户）
```typescript
interface TaskAssistant {
  id: string
  taskId: string
  userId: string
  allocationType: 'percentage' | 'fixed'
  allocationValue: number  // 百分比或固定金额
  addedAt: Date
}
```

#### TaskGroup（任务组群）
```typescript
interface TaskGroup {
  id: string
  name: string
  creatorId: string
  memberIds: string[]
  createdAt: Date
}
```

#### BountyAlgorithm（赏金算法）
```typescript
interface BountyAlgorithm {
  id: string
  version: string
  baseAmount: number
  urgencyWeight: number
  importanceWeight: number
  durationWeight: number
  formula: string  // 算法公式描述
  effectiveFrom: Date
  createdBy: string
}
```

#### Notification（通知）
```typescript
interface Notification {
  id: string
  userId: string  // null表示广播
  type: NotificationType
  title: string
  message: string
  relatedTaskId: string | null
  isRead: boolean
  createdAt: Date
  senderId: string | null  // 管理员广播时使用
}
```

#### NotificationType（通知类型）
```typescript
enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  DEADLINE_REMINDER = 'deadline_reminder',
  DEPENDENCY_RESOLVED = 'dependency_resolved',
  STATUS_CHANGED = 'status_changed',
  POSITION_APPROVED = 'position_approved',
  POSITION_REJECTED = 'position_rejected',
  BROADCAST = 'broadcast'
}
```

#### PositionApplication（岗位申请）
```typescript
interface PositionApplication {
  id: string
  userId: string
  positionId: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy: string | null
  reviewComment: string | null
  createdAt: Date
  reviewedAt: Date | null
}
```

#### Avatar（头像）
```typescript
interface Avatar {
  id: string
  imageUrl: string
  requiredRank: number  // 所需排名等级
  name: string
}
```

#### Ranking（排名）
```typescript
interface Ranking {
  userId: string
  period: 'monthly' | 'quarterly' | 'all_time'
  year: number
  month: number | null
  quarter: number | null
  totalBounty: number
  rank: number
  calculatedAt: Date
}
```

#### AdminBudget（管理员预算）
```typescript
interface AdminBudget {
  adminId: string
  year: number
  month: number
  totalBudget: number
  usedBudget: number
  remainingBudget: number
}
```

#### TaskReview（任务点评）
```typescript
interface TaskReview {
  id: string
  taskId: string
  reviewerId: string
  rating: number  // 1-5
  comment: string
  extraBounty: number
  createdAt: Date
}
```

### 数据库关系

```
User 1---* Task (publisher)
User 1---* Task (assignee)
User *---* Position (through UserPosition)
User 1---* PositionApplication
User 1---* TaskAssistant
User *---* TaskGroup (through GroupMember)
User 1---* Notification
User 1---* Ranking

Task 1---* Task (parent-child)
Task *---* Task (dependencies through TaskDependency)
Task 1---1 TaskGroup
Task 1---* TaskAssistant
Task 1---* TaskReview
Task 1---* Notification

Position 1---* Task
Position 1---* PositionApplication
Position *---* User (admins)

BountyAlgorithm 1---* Task (version)
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

