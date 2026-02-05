# 组群详情只显示顶层任务功能实现

## 问题描述
组群详情页面显示了所有任务，包括子任务，导致界面混乱。需要修改为只显示属于该组群的顶层任务（parent_id IS NULL）。

## 实现方案

### 1. 修改 GroupService.getGroupTasks() 方法
在 SQL 查询的 WHERE 子句中添加了 `AND t.parent_id IS NULL` 条件，确保只返回顶层任务。

**修改位置**: `packages/backend/src/services/GroupService.ts`

**SQL 查询修改**:
```sql
WHERE t.group_id = $1 AND t.parent_id IS NULL
```

### 2. 清理重复代码
在修改过程中发现 `GroupService.ts` 文件中存在多个重复的方法定义，已全部清理：

**清理的重复方法**:
- `assignTaskToGroup()` - 删除了第一个定义
- `getGroupTasks()` - 删除了第一个定义
- `canUserViewGroupTask()` - 删除了第一个定义
- `getUserGroupTasks()` - 删除了第一个定义
- `distributeGroupBounty()` - 删除了第一个定义
- `calculateGroupBountyDistribution()` - 删除了第一个定义
- `inviteMember()` - 删除了第一个定义
- `acceptInvitation()` - 删除了第一个定义

这些重复方法可能是在之前的开发过程中意外产生的。TypeScript 不会报错，因为后面的定义会覆盖前面的定义，但这会导致代码混乱和维护困难。

## 功能特性

### 顶层任务过滤
- 组群详情页面只显示 `parent_id IS NULL` 的任务
- 子任务不会在组群任务列表中显示
- 用户可以通过点击任务进入详情查看子任务

### 任务信息完整性
查询返回的任务信息包括：
- 基本信息：名称、描述、标签
- 时间信息：计划开始/结束时间、实际开始/结束时间
- 任务属性：预估工时、复杂度、优先级、状态
- 赏金信息：赏金金额、算法版本、结算状态
- 关联信息：发布者、承接者、组群、进度
- 发布者详情：用户名、邮箱、头像等

## 影响范围

### 后端
- `packages/backend/src/services/GroupService.ts` - 修改了 `getGroupTasks()` 方法

### 前端
- `packages/frontend/src/pages/GroupsPage.tsx` - 无需修改，自动适配后端返回的数据

### API 端点
- `GET /api/groups/:groupId/tasks` - 返回结果只包含顶层任务

## 测试建议

1. **基本功能测试**
   - 访问组群详情页面
   - 验证只显示顶层任务
   - 验证子任务不在列表中显示

2. **任务层级测试**
   - 创建包含子任务的任务
   - 将任务分配给组群
   - 验证组群详情只显示父任务

3. **子任务访问测试**
   - 点击顶层任务进入详情
   - 验证可以查看和操作子任务

## 相关文档
- [组群任务赏金修复](../GROUP_TASK_BOUNTY_FIX.md)
- [任务删除功能](../TASK_DELETE_FEATURE.md)
- [代码清理总结](../CODE_CLEANUP_SUMMARY.md)

## 实现日期
2026-02-04
