# 排名相同赏金相同名次修复

## 问题描述

用户要求：如果赏金相同，则应该为同一名次。

## 原始逻辑

之前的排名计算逻辑简单地按照顺序分配排名：

```typescript
for (let i = 0; i < bountyResult.rows.length; i++) {
  const row = bountyResult.rows[i];
  const rank = i + 1;  // 简单递增，不考虑赏金相同的情况
  // ...
}
```

**问题**：即使两个用户赏金相同，也会得到不同的排名（如第1名和第2名）。

## 修复后的逻辑

修改后的逻辑会检查赏金是否相同，相同赏金的用户获得相同排名：

```typescript
let currentRank = 1;
let previousBounty: number | null = null;

for (let i = 0; i < bountyResult.rows.length; i++) {
  const row = bountyResult.rows[i];
  const currentBounty = parseFloat(row.total_bounty);
  
  // 如果赏金与前一个不同，更新排名为当前位置
  if (previousBounty !== null && currentBounty !== previousBounty) {
    currentRank = i + 1;
  }
  
  // 使用 currentRank 而不是 i + 1
  // ...
  
  previousBounty = currentBounty;
}
```

## 示例

### 修复前
| 用户 | 赏金 | 排名 |
|------|------|------|
| user1 | ¥1000 | 1 |
| user2 | ¥1000 | 2 | ❌ 应该是1
| user3 | ¥800 | 3 |
| user4 | ¥800 | 4 | ❌ 应该是3
| user5 | ¥500 | 5 |

### 修复后
| 用户 | 赏金 | 排名 |
|------|------|------|
| user1 | ¥1000 | 1 |
| user2 | ¥1000 | 1 | ✅ 相同赏金，相同排名
| user3 | ¥800 | 3 | ✅ 跳过第2名
| user4 | ¥800 | 3 | ✅ 相同赏金，相同排名
| user5 | ¥500 | 5 | ✅ 跳过第4名

## 排名规则

1. **相同赏金 = 相同排名**：赏金金额完全相同的用户获得相同的排名
2. **跳过排名**：如果有多个用户并列某个排名，下一个不同赏金的用户排名会跳过中间的名次
   - 例如：两个用户并列第1名，下一个用户是第3名（跳过第2名）
3. **排序依据**：
   - 主要：按赏金金额降序
   - 次要：按用户ID升序（确保相同赏金时的稳定排序）

## 技术细节

### SQL查询
```sql
ORDER BY total_bounty DESC, u.id ASC
```
- `total_bounty DESC`：赏金从高到低
- `u.id ASC`：相同赏金时按用户ID排序（保证稳定性）

### 排名计算
- 使用 `currentRank` 变量跟踪当前排名
- 使用 `previousBounty` 变量记录上一个用户的赏金
- 只有当赏金变化时才更新排名

## 相关文件

- `packages/backend/src/services/RankingService.ts` - 排名计算服务（已修复）

## 修复时间

2026-01-05

## 验证步骤

1. 重新计算排名：
   ```bash
   POST /api/rankings/calculate
   {
     "period": "monthly",
     "year": 2025,
     "month": 12
   }
   ```

2. 查看排名结果，验证相同赏金的用户是否有相同排名

3. 在前端排名页面查看显示效果

## 注意事项

1. **并列排名显示**：前端UI可能需要特殊处理并列排名的显示
2. **排名图标**：前端的奖杯图标（金银铜）可能需要调整以支持并列排名
3. **数据一致性**：重新计算排名后，所有相同赏金的用户都会获得相同排名
