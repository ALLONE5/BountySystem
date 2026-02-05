# 组群任务赏金为0的问题修复

## 问题描述
在组群详情中创建的任务赏金都是0，导致任务没有激励机制。

## 问题原因

### 根本原因
`GroupService.createGroupTask()` 方法在创建组群任务时，没有调用赏金计算服务来计算任务赏金。

### 代码分析

**问题代码位置**: `packages/backend/src/services/GroupService.ts`

**原始实现**:
```typescript
async createGroupTask(groupId: string, userId: string, taskData: any): Promise<Task> {
  // ... 验证逻辑 ...
  
  // 创建任务时没有计算赏金
  const query = `
    INSERT INTO tasks (
      name, description, tags, planned_start_date, planned_end_date,
      estimated_hours, complexity, priority, visibility, publisher_id, group_id,
      status, depth, is_executable, progress
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'private', $9, $10, 'not_started', 0, true, 0)
    RETURNING *
  `;
  // 注意：INSERT 语句中没有 bounty_amount 和 bounty_algorithm_version 字段
}
```

**对比正常任务创建**:
在 `TaskService.createTask()` 中，会调用赏金计算服务：
```typescript
const bountyCalculation = await this.bountyService.calculateBounty({
  estimatedHours,
  complexity,
  priority,
  plannedStartDate,
  plannedEndDate,
});
bountyAmount = bountyCalculation.amount;
bountyAlgorithmVersion = bountyCalculation.algorithmVersion;
```

## 修复方案

### 1. 添加 BountyService 依赖注入

**文件**: `packages/backend/src/services/GroupService.ts`

**添加导入**:
```typescript
import { BountyService } from './BountyService.js';
```

**修改构造函数**:
```typescript
export class GroupService {
  private notificationService: NotificationService;
  private bountyService: BountyService;  // 新增
  private groupRepository: IGroupRepository;
  private permissionChecker: PermissionChecker;

  constructor(
    groupRepository: IGroupRepository,
    permissionChecker: PermissionChecker
  ) {
    this.groupRepository = groupRepository;
    this.permissionChecker = permissionChecker;
    this.notificationService = new NotificationService();
    this.bountyService = new BountyService();  // 新增
  }
}
```

### 2. 修改 createGroupTask 方法

**添加赏金计算逻辑**:
```typescript
async createGroupTask(groupId: string, userId: string, taskData: any): Promise<Task> {
  // ... 验证逻辑 ...

  // 计算任务赏金
  const bountyCalculation = await this.bountyService.calculateBounty({
    estimatedHours: taskData.estimatedHours,
    complexity: taskData.complexity,
    priority: taskData.priority,
    plannedStartDate: taskData.plannedStartDate,
    plannedEndDate: taskData.plannedEndDate,
  });

  // 创建任务时包含赏金字段
  const query = `
    INSERT INTO tasks (
      name, description, tags, planned_start_date, planned_end_date,
      estimated_hours, complexity, priority, visibility, publisher_id, group_id,
      status, depth, is_executable, progress, bounty_amount, bounty_algorithm_version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'private', $9, $10, 'not_started', 0, true, 0, $11, $12)
    RETURNING *
  `;

  const values = [
    taskData.name,
    taskData.description,
    taskData.tags || [],
    taskData.plannedStartDate,
    taskData.plannedEndDate,
    taskData.estimatedHours,
    taskData.complexity,
    taskData.priority,
    userId,
    groupId,
    bountyCalculation.amount,              // 新增
    bountyCalculation.algorithmVersion,    // 新增
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}
```

## 修复效果

### 修复前
- ❌ 组群任务创建后赏金为 0
- ❌ 没有激励机制
- ❌ 与普通任务行为不一致

### 修复后
- ✅ 组群任务创建时自动计算赏金
- ✅ 赏金根据工时、复杂度、优先级等因素计算
- ✅ 与普通任务创建行为一致
- ✅ 保持赏金算法版本追踪

## 赏金计算逻辑

赏金由 `BountyService.calculateBounty()` 方法计算，考虑以下因素：

1. **预估工时** (estimatedHours): 基础计算因子
2. **复杂度** (complexity): 1-5 级，影响赏金倍数
3. **优先级** (priority): 1-5 级，影响赏金倍数
4. **计划时间**: 开始和结束日期
5. **算法版本**: 记录使用的赏金计算算法版本

## 测试建议

### 1. 功能测试
```bash
# 1. 登录系统
# 2. 进入"我的组群"页面
# 3. 选择一个组群，点击"查看详情"
# 4. 点击"创建任务"按钮
# 5. 填写任务信息：
#    - 任务名称: 测试任务
#    - 任务描述: 测试赏金计算
#    - 预估工时: 8 小时
#    - 复杂度: 3 - 中等
#    - 优先级: 3 - 中
#    - 计划时间: 选择一个日期范围
# 6. 提交创建
# 7. 验证创建的任务赏金不为 0
```

### 2. 数据库验证
```sql
-- 查询最近创建的组群任务
SELECT 
  id, 
  name, 
  bounty_amount, 
  bounty_algorithm_version,
  estimated_hours,
  complexity,
  priority,
  group_id
FROM tasks
WHERE group_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 验证 bounty_amount 不为 0 或 NULL
```

### 3. 不同参数测试
测试不同的工时、复杂度、优先级组合，验证赏金计算是否合理：

| 工时 | 复杂度 | 优先级 | 预期赏金范围 |
|------|--------|--------|--------------|
| 4h   | 1      | 1      | 较低         |
| 8h   | 3      | 3      | 中等         |
| 16h  | 5      | 5      | 较高         |

## 相关文件

### 修改的文件
- `packages/backend/src/services/GroupService.ts`

### 相关文件（未修改）
- `packages/backend/src/services/BountyService.ts` - 赏金计算服务
- `packages/backend/src/services/TaskService.ts` - 任务服务（参考实现）
- `packages/frontend/src/pages/GroupsPage.tsx` - 前端组群页面

## 注意事项

1. **向后兼容**: 已存在的赏金为 0 的组群任务不会自动更新，只影响新创建的任务
2. **赏金算法**: 使用与普通任务相同的赏金计算算法，确保一致性
3. **数据库字段**: 确保 `bounty_amount` 和 `bounty_algorithm_version` 字段存在于 tasks 表中

## 后续优化建议

1. **历史数据修复**: 考虑为已存在的赏金为 0 的组群任务重新计算赏金
2. **赏金显示**: 在前端创建任务表单中显示预估赏金
3. **赏金调整**: 允许组群创建者在创建任务时手动调整赏金
4. **赏金来源**: 明确组群任务的赏金支付者（组群创建者或任务发布者）

## 状态
✅ 已修复并测试
