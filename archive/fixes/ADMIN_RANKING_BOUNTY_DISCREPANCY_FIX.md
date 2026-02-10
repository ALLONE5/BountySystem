# Admin 排名赏金差异修复

## 问题日期
2026-02-06

## 问题描述

Admin 账户在2026年2月实际赚取赏金为 **$2660**，但在排名页面中显示的赏金为 **$660**，差了 **$2000**。

### 问题表现

**仪表板显示**:
- 累计赏金: $2,660.00

**排名页面显示**:
- 累计赏金: $660.00
- 排名: 第3名
- 统计周期: 2026年2月

## 根本原因分析

### 1. 诊断过程

通过诊断脚本 `diagnose-admin-bounty.cjs` 发现：

```
Admin 完成的任务 (2026年2月):
1. test1 - $660 (完成时间: 10:44:32)
2. API 性能优化 - $2000 (完成时间: 10:44:36)

总计: $2660

Rankings 表中的记录:
- Total Bounty: $660
- Completed Tasks: 1
- Calculated At: 10:44:32
```

### 2. 问题根源

**排名计算时机问题**：

1. 第一个任务 "test1" 在 **10:44:32** 完成
2. 系统立即触发排名计算，此时只有1个任务完成，赏金 $660
3. 第二个任务 "API 性能优化" 在 **10:44:36** 完成（4秒后）
4. **排名没有重新计算**，导致排名表中的数据过时

### 3. 技术细节

**RankingService.calculateRankings()** 的计算逻辑：

```typescript
const bountyQuery = `
  SELECT
    u.id AS user_id,
    COALESCE(SUM(CASE
      WHEN t.status = 'completed'
        AND t.assignee_id IS NOT NULL
        AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = $1
        AND EXTRACT(MONTH FROM COALESCE(t.actual_end_date, t.updated_at)) = $2
      THEN t.bounty_amount ELSE 0 END), 0) AS total_bounty,
    COALESCE(SUM(CASE
      WHEN t.status = 'completed'
        AND t.assignee_id IS NOT NULL
        AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = $1
        AND EXTRACT(MONTH FROM COALESCE(t.actual_end_date, t.updated_at)) = $2
      THEN 1 ELSE 0 END), 0) AS completed_tasks_count
  FROM users u
  LEFT JOIN tasks t ON t.assignee_id = u.id
  GROUP BY u.id
  ORDER BY total_bounty DESC, u.id ASC
`;
```

这个查询本身是正确的，问题在于：
- 排名在第一个任务完成时就计算了
- 第二个任务完成时没有触发重新计算

---

## 解决方案

### 立即修复

创建并运行修复脚本 `fix-admin-ranking.cjs`：

```bash
node packages/backend/scripts/fix-admin-ranking.cjs
```

**修复结果**:
```
✓ Admin's updated ranking:
  Tasks: 2
  Bounty: $2660.00
  Rank: 1 (从第3名升至第1名)
```

### 修复脚本逻辑

1. **查询正确的赏金数据**
   - 统计 admin 在2026年2月完成的所有任务
   - 计算总赏金和任务数

2. **删除旧的排名记录**
   - 删除2026年2月的所有月度排名记录

3. **重新计算所有用户的排名**
   - 使用与 RankingService 相同的逻辑
   - 确保排名正确（相同赏金相同排名）

4. **验证修复结果**
   - 确认 admin 的新排名数据正确

---

## 长期解决方案

### 问题：排名计算时机

当前系统在任务完成时会触发排名计算，但如果短时间内有多个任务完成，可能导致排名数据不一致。

### 建议的改进方案

#### 方案 1: 延迟批量计算（推荐）

在任务完成时不立即计算排名，而是：

1. **标记需要更新**
   ```typescript
   // 在 TaskService.completeTask() 中
   await this.markRankingForUpdate(task.assigneeId, period);
   ```

2. **定时批量计算**
   ```typescript
   // 每5分钟运行一次
   cron.schedule('*/5 * * * *', async () => {
     await rankingService.updatePendingRankings();
   });
   ```

**优点**:
- 避免频繁计算
- 减少数据库负载
- 确保数据一致性

**缺点**:
- 排名更新有延迟（最多5分钟）

#### 方案 2: 使用数据库触发器

创建数据库触发器，在任务状态变为 `completed` 时自动更新排名：

```sql
CREATE OR REPLACE FUNCTION update_rankings_on_task_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- 触发排名重新计算
    PERFORM pg_notify('ranking_update', NEW.assignee_id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_complete_ranking_update
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_rankings_on_task_complete();
```

**优点**:
- 实时更新
- 不依赖应用层逻辑

**缺点**:
- 增加数据库复杂度
- 可能影响性能

#### 方案 3: 使用物化视图（最优）

创建物化视图来存储排名数据，定期刷新：

```sql
CREATE MATERIALIZED VIEW current_month_rankings AS
SELECT
  u.id AS user_id,
  COALESCE(SUM(t.bounty_amount), 0) AS total_bounty,
  COUNT(t.id) AS completed_tasks_count,
  RANK() OVER (ORDER BY COALESCE(SUM(t.bounty_amount), 0) DESC) AS rank
FROM users u
LEFT JOIN tasks t ON t.assignee_id = u.id
  AND t.status = 'completed'
  AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM COALESCE(t.actual_end_date, t.updated_at)) = EXTRACT(MONTH FROM CURRENT_DATE)
GROUP BY u.id;

-- 创建索引
CREATE UNIQUE INDEX ON current_month_rankings (user_id);
CREATE INDEX ON current_month_rankings (rank);

-- 定期刷新（每5分钟）
REFRESH MATERIALIZED VIEW CONCURRENTLY current_month_rankings;
```

**优点**:
- 查询性能极高
- 数据一致性好
- 支持并发刷新

**缺点**:
- 需要定期刷新
- 占用额外存储空间

---

## 预防措施

### 1. 添加排名一致性检查

创建定期检查脚本，验证排名数据与实际任务数据是否一致：

```javascript
// packages/backend/scripts/verify-rankings.cjs
async function verifyRankings() {
  // 1. 从 tasks 表计算实际赏金
  // 2. 从 rankings 表读取记录的赏金
  // 3. 比较差异
  // 4. 报告不一致的用户
}
```

### 2. 添加监控告警

在排名计算时添加日志和监控：

```typescript
logger.info('Ranking calculation started', {
  period,
  year,
  month,
  userCount: bountyResult.rows.length,
});

logger.info('Ranking calculation completed', {
  period,
  year,
  month,
  duration: Date.now() - startTime,
});
```

### 3. 添加手动刷新接口

为管理员提供手动刷新排名的接口：

```typescript
// POST /api/admin/rankings/refresh
router.post('/rankings/refresh', 
  authenticate,
  requireRole('super_admin'),
  async (req, res) => {
    await rankingService.updateAllRankings();
    res.json({ message: 'Rankings refreshed successfully' });
  }
);
```

---

## 相关文件

### 诊断脚本
- `packages/backend/scripts/diagnose-admin-bounty.cjs` - 诊断赏金差异

### 修复脚本
- `packages/backend/scripts/fix-admin-ranking.cjs` - 修复排名数据

### 相关服务
- `packages/backend/src/services/RankingService.ts` - 排名计算服务
- `packages/backend/src/services/TaskService.ts` - 任务服务

### 相关文档
- `docs/PROJECT_ARCHITECTURE_OVERVIEW.md` - 项目架构概览
- `archive/fixes/RANKING_SAME_BOUNTY_SAME_RANK_FIX.md` - 相同赏金相同排名修复

---

## 测试验证

### 1. 验证修复结果

```bash
# 运行诊断脚本
node packages/backend/scripts/diagnose-admin-bounty.cjs
```

**预期输出**:
```
Total Feb 2026 Bounty: $2660.00 (2 tasks)

Rankings Table:
Period: monthly
Year: 2026, Month: 2
Total Bounty: $2660.00  ✓
Completed Tasks: 2      ✓
Rank: 1                 ✓
```

### 2. 前端验证

1. 登录 admin 账户
2. 访问排名页面
3. 确认显示：
   - 累计赏金: $2660.00
   - 排名: 第1名
   - 完成任务数: 2个任务

---

## 总结

### 问题
- Admin 排名显示赏金 $660，实际应为 $2660
- 差异原因：排名在第一个任务完成时计算，第二个任务完成时未重新计算

### 修复
- 运行 `fix-admin-ranking.cjs` 重新计算2026年2月的所有排名
- Admin 排名从第3名升至第1名，赏金正确显示为 $2660

### 改进建议
1. 实施延迟批量计算或物化视图方案
2. 添加排名一致性检查
3. 添加监控和告警
4. 提供管理员手动刷新接口

### 影响范围
- 仅影响排名显示，不影响用户实际余额
- 修复后所有用户的排名数据都已更新

---

## 更新日期
2026-02-06

## 修复状态
✅ 已修复并验证
