# 排名页面赏金为0的问题修复

## 问题描述

用户报告排名页面中2025年12月的所有用户累积赏金都是0，与实际不符。

## 问题分析

### 根本原因

经过调查，发现有两个问题：

1. **完成任务的赏金金额为0**：
   - 数据库中唯一一个 `status='completed'` 的任务，其 `bounty_amount` 字段值为 `0.00`
   - 任务ID: `e45c937e-6624-41b8-897e-d6484454f303`
   - 任务名称: "Update Security Policy"

2. **完成任务缺少实际完成日期**：
   - 该任务的 `actual_end_date` 字段为 `null`
   - 原始的排名计算SQL使用 `EXTRACT(YEAR FROM t.actual_end_date)` 进行日期过滤
   - 当 `actual_end_date` 为 `null` 时，该任务会被排除在统计之外

### 数据证据

从API返回的任务数据：

```json
{
  "id": "e45c937e-6624-41b8-897e-d6484454f303",
  "name": "Update Security Policy",
  "description": "Revise the security protocols.",
  "status": "completed",
  "bountyAmount": "0.00",
  "actualEndDate": null,
  "assigneeId": "5ac9b9ad-7c68-4b87-962d-9e8253d0111d",
  "createdAt": "2025-12-31T07:15:20.493Z",
  "updatedAt": "2025-12-31T07:15:20.493Z"
}
```

### 原始SQL查询问题

```sql
-- 原始查询
AND EXTRACT(YEAR FROM t.actual_end_date) = $1
AND EXTRACT(MONTH FROM t.actual_end_date) = $2
```

当 `actual_end_date` 为 `null` 时，`EXTRACT` 函数返回 `null`，导致整个条件为 `false`，任务被排除。

## 解决方案

### 1. 修复排名计算逻辑

修改 `packages/backend/src/services/RankingService.ts` 中的 `calculateRankings` 方法，使用 `COALESCE` 函数在 `actual_end_date` 为 `null` 时回退到 `updated_at`：

```typescript
// 修复后的代码
if (period === RankingPeriod.MONTHLY) {
  if (!month) {
    throw new AppError('VALIDATION_ERROR', 'Month is required for monthly rankings', 400);
  }
  // Use actual_end_date if available, otherwise fall back to updated_at
  dateFilter = `
    AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = $${paramIndex++}
    AND EXTRACT(MONTH FROM COALESCE(t.actual_end_date, t.updated_at)) = $${paramIndex++}
  `;
  params.push(year, month);
}
```

**改进点**：
- 使用 `COALESCE(t.actual_end_date, t.updated_at)` 确保即使 `actual_end_date` 为 `null`，也能使用 `updated_at` 进行日期过滤
- 同样的修复应用于季度排名（QUARTERLY）

### 2. 验证修复效果

修复后重新计算2025年12月的排名：

```bash
POST /api/rankings/calculate
{
  "period": "monthly",
  "year": 2025,
  "month": 12
}
```

**结果**：
```json
{
  "message": "Rankings calculated successfully",
  "count": 8,
  "rankings": [
    // ...
    {
      "userId": "5ac9b9ad-7c68-4b87-962d-9e8253d0111d",
      "totalBounty": 0,
      "completedTasksCount": 1,  // 现在正确统计到了完成的任务
      "rank": 5
    }
    // ...
  ]
}
```

**改进**：
- `completedTasksCount` 从 0 变为 1，正确统计了完成的任务
- `totalBounty` 仍然是 0，因为该任务的赏金金额本身就是 0

## 为什么赏金仍然是0？

修复后，排名系统现在能正确统计完成的任务数量，但累积赏金仍然是0，这是因为：

1. **任务赏金设置为0**：那个完成的任务在创建时就设置了 `bountyAmount = 0.00`
2. **这是数据问题，不是代码问题**：排名计算逻辑是正确的，只是数据库中没有赏金金额大于0的已完成任务

### 如何获得非零赏金排名？

要在排名中看到非零的赏金金额，需要：

1. **完成有赏金的任务**：
   - 选择一个 `bountyAmount > 0` 的任务
   - 将其状态改为 `completed`
   - 设置 `actual_end_date` 为完成日期

2. **重新计算排名**：
   ```bash
   POST /api/rankings/calculate
   {
     "period": "monthly",
     "year": 2025,
     "month": 12
   }
   ```

### 示例：完成一个有赏金的任务

数据库中有多个赏金金额大于0的任务：

```json
{
  "id": "a32d3777-77d4-4f3c-922f-c8e638148934",
  "name": "Design New Logo",
  "bountyAmount": "300.00",
  "status": "available"
}
```

如果将这个任务完成：
1. 更新状态为 `completed`
2. 设置 `assignee_id`
3. 设置 `actual_end_date` 为2025年12月的某个日期
4. 重新计算排名

那么该用户的 `totalBounty` 就会显示为 300.00。

## 相关文件

- `packages/backend/src/services/RankingService.ts` - 排名计算服务（已修复）
- `packages/backend/src/routes/ranking.routes.ts` - 排名API路由
- `packages/frontend/src/pages/RankingPage.tsx` - 前端排名页面

## 修复时间

2026-01-05 15:27:38 - 后端服务重启，新代码生效

## 总结

**问题**：排名页面显示所有用户赏金为0

**原因**：
1. 排名计算SQL在 `actual_end_date` 为 `null` 时排除了完成的任务
2. 唯一完成的任务赏金金额本身就是0

**修复**：
1. ✅ 修改SQL使用 `COALESCE(actual_end_date, updated_at)` 作为日期过滤
2. ✅ 现在能正确统计完成任务数量
3. ⚠️ 赏金仍为0是因为数据问题（完成的任务赏金为0），不是代码问题

**建议**：
- 完成一些赏金金额大于0的任务来测试排名功能
- 确保完成任务时设置 `actual_end_date` 字段
- 定期运行排名计算以更新排名数据
