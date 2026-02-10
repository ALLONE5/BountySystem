# 个人信息页面赏金显示增强

## 功能概述

在个人信息页面（DashboardPage）中增强赏金显示功能，将三个不同周期的赏金统计整合到一个卡片中：
- **当月赏金**: 当前月份完成任务获得的赏金总额（主显示）
- **当季赏金**: 当前季度完成任务获得的赏金总额（次要显示）
- **累积赏金**: 所有时间完成任务获得的赏金总额（次要显示）

## 实现状态

✅ **已完成** - 2026年2月10日

## 实现细节

### 1. 数据获取

#### 后端数据源
使用现有的 RankingService 提供的排名数据，通过以下 API 端点获取：

```typescript
// 获取当月赏金
GET /api/rankings/user/:userId?period=monthly&year=2026&month=2

// 获取当季赏金
GET /api/rankings/user/:userId?period=quarterly&year=2026&quarter=1

// 获取累积赏金
GET /api/rankings/user/:userId?period=all_time&year=2026
```

#### 前端实现
在 `DashboardPage.tsx` 的 `loadStats()` 方法中并行请求三个周期的排名数据：

```typescript
const [monthlyRanking, quarterlyRanking, allTimeRanking] = await Promise.all([
  user ? rankingApi.getMyRanking(user.id, { 
    period: 'monthly', 
    year: currentYear, 
    month: currentMonth 
  }).catch(() => null) : Promise.resolve(null),
  user ? rankingApi.getMyRanking(user.id, { 
    period: 'quarterly', 
    year: currentYear, 
    quarter: currentQuarter 
  }).catch(() => null) : Promise.resolve(null),
  user ? rankingApi.getMyRanking(user.id, { 
    period: 'all_time', 
    year: currentYear 
  }).catch(() => null) : Promise.resolve(null),
]);

// 设置赏金数据
setMonthlyBounty(monthlyRanking?.totalBounty || 0);
setQuarterlyBounty(quarterlyRanking?.totalBounty || 0);
setAllTimeBounty(allTimeRanking?.totalBounty || 0);
```

### 2. 状态管理

使用独立的状态变量管理三个赏金值：

```typescript
const [monthlyBounty, setMonthlyBounty] = useState(0);
const [quarterlyBounty, setQuarterlyBounty] = useState(0);
const [allTimeBounty, setAllTimeBounty] = useState(0);
```

### 3. UI 展示

#### 布局设计
将三个赏金周期整合到**一个卡片**中显示：
- 主标题: "当月赏金"
- 主数值: 当月赏金金额（橙色，大字体）
- 次要信息: 当季赏金和累积赏金（灰色小字，显示在下方）

#### 视觉设计

**赏金卡片**:
- 标题: "当月赏金"
- 主数值颜色: `colors.warning` (橙色)
- 次要信息颜色: `colors.text.secondary` (灰色)
- 可点击，显示赏金历史抽屉

**完成率卡片**:
- 移除了 `PercentageOutlined` 图标前缀
- 数值颜色: `#eb2f96` (粉红色)

#### 实现代码

```typescript
<Card
  hoverable
  onClick={() => {
    if (!historyDrawerVisible && user?.id) {
      setHistoryDrawerVisible(true);
    }
  }}
  style={{ 
    cursor: 'pointer',
    transition: 'all 0.3s',
  }}
>
  <Statistic
    title="当月赏金"
    value={monthlyBounty}
    prefix="$"
    precision={2}
    valueStyle={{ color: colors.warning }}
  />
  <div style={{ 
    marginTop: spacing.sm, 
    fontSize: 12, 
    color: colors.text.secondary,
    display: 'flex',
    justifyContent: 'space-between',
  }}>
    <span>当季赏金: ${quarterlyBounty.toFixed(2)}</span>
    <span>累积赏金: ${allTimeBounty.toFixed(2)}</span>
  </div>
</Card>
```

```typescript
<Card>
  <Statistic
    title="任务完成率"
    value={
      stats?.assignedTotal
        ? ((stats.assignedCompleted / stats.assignedTotal) * 100).toFixed(1)
        : 0
    }
    suffix="%"
    valueStyle={{ 
      color: '#eb2f96'
    }}
  />
</Card>
```


## 数据流程

### 完整流程图

```
用户打开个人信息页面
    ↓
useEffect 触发 loadStats()
    ↓
并行请求多个数据源:
  1. taskApi.getPublishedTasks()
  2. taskApi.getAssignedTasks()
  3. rankingApi.getMyRanking(monthly)
  4. rankingApi.getMyRanking(quarterly)
  5. rankingApi.getMyRanking(all_time)
    ↓
后端查询 rankings 表:
  - WHERE user_id = $1 AND period = 'monthly' AND year = $2 AND month = $3
  - WHERE user_id = $1 AND period = 'quarterly' AND year = $2 AND quarter = $3
  - WHERE user_id = $1 AND period = 'all_time' AND year = $2
    ↓
返回排名数据 (包含 totalBounty 字段)
    ↓
更新 stats 状态
    ↓
渲染三个赏金卡片
```

### 数据计算逻辑

#### 当月赏金
- 来源: `rankings` 表中 `period='monthly'` 的记录
- 计算: 当月所有已完成任务的 `bounty_amount` 总和
- 更新时机: 任务完成后 2 秒（通过 RankingUpdateQueue）

#### 当季赏金
- 来源: `rankings` 表中 `period='quarterly'` 的记录
- 计算: 当季所有已完成任务的 `bounty_amount` 总和
- 更新时机: 任务完成后 2 秒（通过 RankingUpdateQueue）

#### 累积赏金
- 来源: `rankings` 表中 `period='all_time'` 的记录
- 计算: 所有时间已完成任务的 `bounty_amount` 总和
- 更新时机: 任务完成后 2 秒（通过 RankingUpdateQueue）

## 优势与特点

### 1. 性能优化
- **并行请求**: 使用 `Promise.all` 同时请求多个数据源，减少等待时间
- **缓存利用**: 利用 RankingService 已经计算好的排名数据，无需重复计算
- **错误容错**: 使用 `.catch(() => null)` 处理请求失败，不影响其他数据显示

### 2. 用户体验
- **多维度展示**: 用户可以清晰看到不同时间周期的赏金收入
- **视觉区分**: 使用不同颜色区分三个周期，易于识别
- **交互反馈**: 鼠标悬停和点击都有明确的视觉反馈
- **一致性**: 与赏金历史抽屉功能无缝集成

### 3. 数据准确性
- **实时更新**: 依赖 RankingUpdateQueue 的防抖机制，确保数据及时更新
- **数据一致**: 与排名页面使用相同的数据源，保证一致性
- **事务保证**: 后端使用数据库事务，确保数据完整性

## 响应式设计

### 桌面端 (≥992px)
```
Row 1: [发布任务] [承接任务] [当月赏金] [完成率]
```
每个卡片占 6 列（lg={6}），一行显示 4 个卡片

### 平板端 (≥576px, <992px)
```
Row 1: [发布任务] [承接任务]
Row 2: [当月赏金] [完成率]
```
每个卡片占 12 列（sm={12}），一行显示 2 个卡片

### 移动端 (<576px)
```
[发布任务]
[承接任务]
[当月赏金]
[完成率]
```
每个卡片占 24 列（xs={24}），一行显示 1 个卡片

使用 Ant Design 的 Grid 系统实现响应式布局：
```typescript
<Col xs={24} sm={12} lg={6}>
```

## 错误处理

### 1. API 请求失败
```typescript
rankingApi.getMyRanking(user.id, params).catch(() => null)
```
- 如果请求失败，返回 `null`
- 赏金显示为 `0`
- 不影响其他统计数据的显示

### 2. 用户无排名数据
```typescript
monthlyBounty: monthlyRanking?.totalBounty || 0
```
- 使用可选链操作符 `?.` 安全访问
- 如果没有排名数据，显示 `$0.00`

### 3. 数据加载中
- 初始状态所有赏金为 `0`
- 加载完成后更新为实际值
- 无需额外的 loading 状态

## 测试场景

### 1. 新用户（无任务完成）
- 预期: 所有赏金显示 `$0.00`
- 验证: 不应该出现错误或空白

### 2. 有任务完成的用户
- 预期: 显示实际赏金金额
- 验证: 金额与排名页面一致

### 3. 跨月/跨季场景
- 预期: 当月赏金重置为新月份的数据
- 验证: 累积赏金持续增长

### 4. 网络错误
- 预期: 显示 `$0.00`，不影响页面其他功能
- 验证: 控制台有错误日志但不抛出异常

## 未来扩展

### 1. 趋势图表
可以添加赏金趋势图，显示最近几个月的赏金变化：
```typescript
<Card title="赏金趋势">
  <LineChart data={bountyHistory} />
</Card>
```

### 2. 排名显示
在赏金卡片上显示当前排名：
```typescript
<Statistic
  title="当月赏金"
  value={stats.monthlyBounty}
  suffix={<Tag>排名 #{monthlyRanking?.rank}</Tag>}
/>
```

### 3. 目标设置
允许用户设置赏金目标，显示完成进度：
```typescript
<Progress 
  percent={(stats.monthlyBounty / monthlyGoal) * 100} 
  status="active"
/>
```

### 4. 对比分析
显示与上月/上季的对比：
```typescript
<Statistic
  title="当月赏金"
  value={stats.monthlyBounty}
  suffix={
    <Tag color={increase > 0 ? 'green' : 'red'}>
      {increase > 0 ? '+' : ''}{increase}%
    </Tag>
  }
/>
```

## 总结

此次增强为个人信息页面（DashboardPage）提供了更丰富的赏金统计信息，通过将三个周期的赏金整合到一个卡片中，既节省了空间又提供了完整的信息。主要改进包括：

1. **整合显示**: 将当月、当季、累积赏金整合到一个卡片中
2. **视觉层次**: 当月赏金作为主要信息突出显示，其他两个周期作为次要信息
3. **完成率优化**: 移除百分号图标，改用粉红色显示，更加简洁美观
4. **交互体验**: 点击赏金卡片可查看详细的赏金历史记录

通过利用现有的 RankingService 基础设施，实现了高效、准确的数据展示，同时保持了良好的用户体验和系统性能。

## 实现文件

- `packages/frontend/src/pages/DashboardPage.tsx` - 主要实现文件
- `packages/frontend/src/api/ranking.ts` - API 调用
- `packages/backend/src/services/RankingService.ts` - 后端服务
- `packages/backend/src/routes/ranking.routes.ts` - API 路由
