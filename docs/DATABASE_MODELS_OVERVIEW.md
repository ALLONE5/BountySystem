# 数据库模型概览

本文档详细说明了赏金猎人平台的所有数据模型及其作用。

## 目录

1. [核心模型](#核心模型)
2. [任务相关模型](#任务相关模型)
3. [赏金系统模型](#赏金系统模型)
4. [用户管理模型](#用户管理模型)
5. [协作与组织模型](#协作与组织模型)
6. [通知与反馈模型](#通知与反馈模型)

---

## 核心模型

### 1. User (用户)
**文件**: `packages/backend/src/models/User.ts`

**作用**: 存储平台用户的基本信息和认证数据

**主要字段**:
- `id`: 用户唯一标识符 (UUID)
- `username`: 用户名
- `email`: 邮箱地址
- `passwordHash`: 加密后的密码
- `avatarId`: 关联的头像ID
- `role`: 用户角色 (user/position_admin/super_admin)
- `createdAt`: 创建时间
- `lastLogin`: 最后登录时间

**角色类型**:
- `USER`: 普通用户，可以接受和发布任务
- `POSITION_ADMIN`: 岗位管理员，可以管理特定岗位
- `SUPER_ADMIN`: 超级管理员，拥有完全访问权限

**关联关系**:
- 一对多: Task (作为发布者或执行者)
- 一对多: Notification
- 一对多: Ranking
- 一对一: Avatar

---

### 2. Task (任务)
**文件**: `packages/backend/src/models/Task.ts`

**作用**: 存储任务的详细信息，支持层级结构和赏金管理

**主要字段**:
- `id`: 任务唯一标识符
- `name`: 任务名称
- `description`: 任务描述
- `parentId`: 母任务ID (支持任务层级)
- `depth`: 任务深度 (在层级结构中的层级)
- `isExecutable`: 是否可执行 (叶子任务为true)
- `status`: 任务状态 (not_started/available/in_progress/completed/abandoned)
- `visibility`: 可见性 (public/position_only/private)
- `bountyAmount`: 赏金金额
- `publisherId`: 发布者ID
- `assigneeId`: 执行者ID
- `positionId`: 要求的岗位ID
- `groupId`: 任务组ID
- `projectGroupId`: 项目组ID
- `progress`: 进度 (0-100)
- `estimatedHours`: 预估工时
- `complexity`: 复杂度
- `priority`: 优先级

**任务状态**:
- `NOT_STARTED`: 未开始
- `AVAILABLE`: 可承接
- `IN_PROGRESS`: 进行中
- `COMPLETED`: 已完成
- `ABANDONED`: 已放弃

**可见性级别**:
- `PUBLIC`: 公开，所有人可见
- `POSITION_ONLY`: 仅特定岗位可见
- `PRIVATE`: 私有，仅相关人员可见

**关联关系**:
- 多对一: User (publisher, assignee)
- 多对一: Position
- 多对一: TaskGroup
- 多对一: ProjectGroup
- 一对多: TaskDependency
- 一对多: TaskAssistant
- 一对多: Comment
- 一对多: Attachment

---

### 3. Position (岗位)
**文件**: `packages/backend/src/models/Position.ts`

**作用**: 定义平台中的岗位类型和技能要求

**主要字段**:
- `id`: 岗位唯一标识符
- `name`: 岗位名称 (如: Frontend Developer, Backend Developer)
- `description`: 岗位描述
- `requiredSkills`: 所需技能列表

**关联表**:
- `UserPosition`: 用户-岗位关联表
- `PositionAdmin`: 岗位管理员关联表
- `PositionApplication`: 岗位申请表

**PositionApplication (岗位申请)**:
- `status`: 申请状态 (pending/approved/rejected)
- `reason`: 申请理由
- `reviewedBy`: 审核人ID
- `reviewComment`: 审核意见

---

## 任务相关模型

### 4. TaskDependency (任务依赖)
**文件**: `packages/backend/src/models/TaskDependency.ts`

**作用**: 定义任务之间的依赖关系

**主要字段**:
- `id`: 依赖关系唯一标识符
- `taskId`: 任务ID
- `dependsOnTaskId`: 依赖的任务ID

**用途**: 确保任务按正确顺序执行，被依赖的任务完成后，依赖任务才能开始

---

### 5. TaskAssistant (任务协助者)
**文件**: `packages/backend/src/models/TaskAssistant.ts`

**作用**: 管理任务的协助者及其赏金分配

**主要字段**:
- `id`: 协助关系唯一标识符
- `taskId`: 任务ID
- `userId`: 协助者用户ID
- `allocationType`: 分配类型 (percentage/fixed)
- `allocationValue`: 分配值 (百分比或固定金额)

**分配类型**:
- `PERCENTAGE`: 按百分比分配赏金
- `FIXED`: 固定金额分配

---

### 6. TaskReview (任务评审)
**文件**: `packages/backend/src/models/TaskReview.ts`

**作用**: 存储任务完成后的评审信息

**主要字段**:
- `id`: 评审唯一标识符
- `taskId`: 任务ID
- `reviewerId`: 评审人ID
- `rating`: 评分 (1-5)
- `comment`: 评审意见
- `extraBounty`: 额外奖励金额

---

### 7. Comment (评论)
**文件**: `packages/backend/src/models/Comment.ts`

**作用**: 存储任务的评论和讨论

**主要字段**:
- `id`: 评论唯一标识符
- `taskId`: 任务ID
- `userId`: 评论者ID
- `content`: 评论内容
- `createdAt`: 创建时间

---

### 8. Attachment (附件)
**文件**: `packages/backend/src/models/Attachment.ts`

**作用**: 存储任务相关的文件附件

**主要字段**:
- `id`: 附件唯一标识符
- `taskId`: 任务ID
- `uploaderId`: 上传者ID
- `fileName`: 文件名
- `fileUrl`: 文件URL
- `fileType`: 文件类型
- `fileSize`: 文件大小

---

## 赏金系统模型

### 9. BountyAlgorithm (赏金算法)
**文件**: `packages/backend/src/models/BountyAlgorithm.ts`

**作用**: 定义赏金计算的算法和参数

**主要字段**:
- `id`: 算法唯一标识符
- `version`: 算法版本
- `baseAmount`: 基础金额
- `urgencyWeight`: 紧急度权重
- `importanceWeight`: 重要性权重
- `durationWeight`: 持续时间权重
- `formula`: 计算公式
- `effectiveFrom`: 生效日期
- `createdBy`: 创建者ID

**用途**: 根据任务的复杂度、优先级、预估工时等因素自动计算赏金金额

---

### 10. BountyTransaction (赏金交易)
**文件**: `packages/backend/src/models/BountyTransaction.ts`

**作用**: 记录所有赏金交易历史

**主要字段**:
- `id`: 交易唯一标识符
- `taskId`: 关联任务ID
- `fromUserId`: 支付方用户ID
- `toUserId`: 接收方用户ID
- `amount`: 交易金额
- `type`: 交易类型
- `description`: 交易描述

**交易类型**:
- `TASK_COMPLETION`: 任务完成奖励
- `EXTRA_REWARD`: 额外奖励
- `ASSISTANT_SHARE`: 协助者分成
- `REFUND`: 退款

---

### 11. AdminBudget (管理员预算)
**文件**: `packages/backend/src/models/AdminBudget.ts`

**作用**: 管理管理员的月度预算

**主要字段**:
- `id`: 预算记录唯一标识符
- `adminId`: 管理员ID
- `year`: 年份
- `month`: 月份
- `totalBudget`: 总预算
- `usedBudget`: 已使用预算
- `remainingBudget`: 剩余预算

**用途**: 控制管理员发布任务的赏金总额，防止超支

---

## 用户管理模型

### 12. Avatar (头像)
**文件**: `packages/backend/src/models/Avatar.ts`

**作用**: 存储可用的头像资源

**主要字段**:
- `id`: 头像唯一标识符
- `name`: 头像名称
- `imageUrl`: 头像图片URL
- `requiredRank`: 所需排名 (解锁条件)

**用途**: 提供游戏化元素，用户达到特定排名后可解锁新头像

---

### 13. Ranking (排名)
**文件**: `packages/backend/src/models/Ranking.ts`

**作用**: 存储用户在不同时间段的排名信息

**主要字段**:
- `id`: 排名记录唯一标识符
- `userId`: 用户ID
- `period`: 排名周期 (monthly/quarterly/all_time)
- `year`: 年份
- `month`: 月份 (月度排名)
- `quarter`: 季度 (季度排名)
- `totalBounty`: 总赏金
- `completedTasksCount`: 完成任务数
- `rank`: 排名

**排名周期**:
- `MONTHLY`: 月度排名
- `QUARTERLY`: 季度排名
- `ALL_TIME`: 总排名

---

### 14. Notification (通知)
**文件**: `packages/backend/src/models/Notification.ts`

**作用**: 管理系统通知和消息

**主要字段**:
- `id`: 通知唯一标识符
- `userId`: 接收者ID (null表示广播)
- `type`: 通知类型
- `title`: 通知标题
- `message`: 通知内容
- `relatedTaskId`: 关联任务ID
- `isRead`: 是否已读
- `senderId`: 发送者ID (用于广播)

**通知类型**:
- `TASK_ASSIGNED`: 任务分配
- `DEADLINE_REMINDER`: 截止日期提醒
- `DEPENDENCY_RESOLVED`: 依赖任务完成
- `STATUS_CHANGED`: 状态变更
- `POSITION_APPROVED`: 岗位申请通过
- `POSITION_REJECTED`: 岗位申请拒绝
- `REVIEW_REQUIRED`: 需要评审
- `BROADCAST`: 广播消息
- `TASK_RECOMMENDATION`: 任务推荐
- `ACCOUNT_UPDATED`: 账户更新
- `GROUP_INVITATION`: 组邀请

---

## 协作与组织模型

### 15. TaskGroup (任务组)
**文件**: `packages/backend/src/models/TaskGroup.ts`

**作用**: 创建用户协作组，支持团队协作

**主要字段**:
- `id`: 任务组唯一标识符
- `name`: 组名
- `creatorId`: 创建者ID

**关联表**:
- `GroupMember`: 组成员关联表
  - `groupId`: 组ID
  - `userId`: 成员ID
  - `joinedAt`: 加入时间

**用途**: 允许多个用户组成团队，共同承接和完成任务

---

### 16. ProjectGroup (项目组)
**文件**: `packages/backend/src/models/ProjectGroup.ts`

**作用**: 将相关任务归类到同一个项目下

**主要字段**:
- `id`: 项目组唯一标识符
- `name`: 项目名称
- `description`: 项目描述

**用途**: 组织和管理大型项目，将多个相关任务分组管理

---

## 数据模型关系图

```
User
├── Task (as publisher)
├── Task (as assignee)
├── Notification
├── Ranking
├── Avatar
├── Position (through UserPosition)
├── TaskGroup (as creator/member)
└── BountyTransaction

Task
├── User (publisher)
├── User (assignee)
├── Position
├── TaskGroup
├── ProjectGroup
├── TaskDependency
├── TaskAssistant
├── TaskReview
├── Comment
├── Attachment
└── BountyTransaction

Position
├── User (through UserPosition)
├── User (through PositionAdmin)
├── Task
└── PositionApplication

TaskGroup
├── User (creator)
├── User (members through GroupMember)
└── Task

ProjectGroup
└── Task
```

---

## 数据模型统计

| 类别 | 模型数量 | 模型列表 |
|------|---------|---------|
| 核心模型 | 3 | User, Task, Position |
| 任务相关 | 5 | TaskDependency, TaskAssistant, TaskReview, Comment, Attachment |
| 赏金系统 | 3 | BountyAlgorithm, BountyTransaction, AdminBudget |
| 用户管理 | 3 | Avatar, Ranking, Notification |
| 协作组织 | 2 | TaskGroup, ProjectGroup |
| **总计** | **16** | |

---

## 设计原则

1. **关注点分离**: 每个模型专注于单一职责
2. **可扩展性**: 支持未来功能扩展
3. **数据完整性**: 通过外键和约束保证数据一致性
4. **审计追踪**: 关键操作记录时间戳
5. **灵活性**: 支持多种业务场景和工作流

---

## 更新日志

- 2026-01-29: 创建初始文档，包含所有16个数据模型的详细说明
