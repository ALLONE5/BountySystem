# 排名系统详细讲解

## 目录
1. [系统概述](#系统概述)
2. [数据库设计](#数据库设计)
3. [后端架构](#后端架构)
4. [前端实现](#前端实现)
5. [数据流程](#数据流程)
6. [性能优化](#性能优化)

## 系统概述

排名系统是一个基于用户完成任务赚取赏金的排行榜功能，支持三种统计周期：
- **月度排名** (monthly): 统计当月完成任务的赏金总额
- **季度排名** (quarterly): 统计当季度完成任务的赏金总额
- **总累积排名** (all_time): 统计所有时间完成任务的赏金总额

### 核心特性
- 实时更新：任务完成后 2 秒内更新排名
- 防抖机制：多个任务快速完成时批量更新，避免重复计算
- 相同赏金相同排名：赏金相同的用户获得相同排名
- 多周期支持：可查看历史月份、季度的排名数据


## 数据库设计

### Rankings 表结构

```sql
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period ranking_period NOT NULL,  -- 'monthly', 'quarterly', 'all_time'
  year INTEGER NOT NULL CHECK (year > 2000),
  month INTEGER CHECK (month >= 1 AND month <= 12),
  quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
  total_bounty DECIMAL(10, 2) NOT NULL DEFAULT 0,
  completed_tasks_count INTEGER DEFAULT 0,  -- 完成任务数量
  rank INTEGER NOT NULL CHECK (rank > 0),
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period, year, month, quarter)
);
```

### 索引设计

```sql
-- 用户查询自己的排名
CREATE INDEX idx_rankings_user_period_year_month 
  ON rankings(user_id, period, year, month);

-- 获取排行榜列表（按排名排序）
CREATE INDEX idx_rankings_period_year_month_rank 
  ON rankings(period, year, month, rank);

-- 用户相关查询
CREATE INDEX idx_rankings_user_id ON rankings(user_id);
```

### 数据约束

1. **唯一性约束**: 每个用户在特定周期只有一条排名记录
2. **检查约束**: 
   - year > 2000
   - month 在 1-12 之间
   - quarter 在 1-4 之间
   - rank > 0
3. **外键约束**: user_id 关联到 users 表，级联删除


## 后端架构

### 1. RankingService (核心服务)

位置: `packages/backend/src/services/RankingService.ts`

#### 主要方法

##### calculateRankings() - 计算排名

这是排名系统的核心方法，负责计算指定周期的排名。

**执行流程**:

```typescript
async calculateRankings(
  period: RankingPeriod,
  year: number,
  month?: number,
  quarter?: number
): Promise<Ranking[]>
```

**步骤详解**:

1. **开启事务**
```typescript
await client.query('BEGIN');
```

2. **构建日期过滤条件**
```sql
-- 月度排名
WHERE EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = $1
  AND EXTRACT(MONTH FROM COALESCE(t.actual_end_date, t.updated_at)) = $2

-- 季度排名
WHERE EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = $1
  AND EXTRACT(QUARTER FROM COALESCE(t.actual_end_date, t.updated_at)) = $2

-- 总累积排名（无日期过滤）
```

3. **计算每个用户的赏金总额和完成任务数**
```sql
SELECT
  u.id AS user_id,
  COALESCE(SUM(CASE
    WHEN t.status = 'completed'
      AND t.assignee_id IS NOT NULL
      [日期过滤条件]
    THEN t.bounty_amount ELSE 0 END), 0) AS total_bounty,
  COALESCE(SUM(CASE
    WHEN t.status = 'completed'
      AND t.assignee_id IS NOT NULL
      [日期过滤条件]
    THEN 1 ELSE 0 END), 0) AS completed_tasks_count
FROM users u
LEFT JOIN tasks t ON t.assignee_id = u.id
GROUP BY u.id
ORDER BY total_bounty DESC, u.id ASC
```

**关键点**:
- 使用 `LEFT JOIN` 确保所有用户都被包含（即使没有完成任务）
- 使用 `COALESCE` 处理 NULL 值，确保返回 0 而不是 NULL
- 优先使用 `actual_end_date`（实际完成时间），如果为空则使用 `updated_at`
- 按赏金总额降序排序，赏金相同时按用户 ID 排序（保证稳定性）


4. **删除旧排名数据**
```sql
DELETE FROM rankings
WHERE period = $1
  AND year = $2
  AND month = $3  -- 如果是月度排名
  AND quarter = $3  -- 如果是季度排名
```

5. **计算排名并插入新数据**
```typescript
let currentRank = 1;
let previousBounty: number | null = null;

for (let i = 0; i < bountyResult.rows.length; i++) {
  const row = bountyResult.rows[i];
  const currentBounty = parseFloat(row.total_bounty);
  
  // 如果赏金与上一个不同，更新排名为当前位置
  if (previousBounty !== null && currentBounty !== previousBounty) {
    currentRank = i + 1;
  }
  
  // 插入排名记录
  INSERT INTO rankings (user_id, period, year, month, quarter, 
                        total_bounty, completed_tasks_count, rank)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  
  previousBounty = currentBounty;
}
```

**排名算法说明**:
- 第一个用户排名为 1
- 如果当前用户赏金与前一个用户相同，保持相同排名
- 如果当前用户赏金不同，排名跳到当前位置（i + 1）

**示例**:
```
用户A: $100 -> 排名 1
用户B: $100 -> 排名 1 (相同赏金)
用户C: $80  -> 排名 3 (不是2，因为前面有2个人)
用户D: $80  -> 排名 3 (相同赏金)
用户E: $50  -> 排名 5
```

6. **提交事务**
```typescript
await client.query('COMMIT');
```


##### getRankings() - 获取排名列表

```typescript
async getRankings(query: RankingQueryDTO): Promise<UserRankingInfo[]>
```

**SQL 查询**:
```sql
SELECT 
  r.user_id,
  r.total_bounty,
  r.completed_tasks_count,
  r.rank,
  r.period,
  r.year,
  r.month,
  r.quarter,
  u.id as "user.id",
  u.username as "user.username",
  u.email as "user.email",
  u.avatar_id as "user.avatarId",
  u.role as "user.role",
  u.created_at as "user.createdAt",
  u.last_login as "user.lastLogin",
  a.image_url as "user.avatarUrl"
FROM rankings r
JOIN users u ON r.user_id = u.id
LEFT JOIN avatars a ON u.avatar_id = a.id
WHERE r.period = $1
  AND r.year = $2
  AND r.month = $3  -- 可选
  AND r.quarter = $4  -- 可选
ORDER BY r.rank ASC
LIMIT $5  -- 可选
```

**特点**:
- 使用 JOIN 关联用户信息和头像信息
- 按排名升序排序
- 支持分页（通过 limit 参数）
- 返回完整的用户信息（用于前端显示）

##### getUserRanking() - 获取单个用户排名

```typescript
async getUserRanking(
  userId: string,
  period: RankingPeriod,
  year?: number,
  month?: number,
  quarter?: number
): Promise<UserRankingInfo | null>
```

内部调用 `getRankings()` 方法，添加 `userId` 过滤条件和 `limit: 1`。


### 2. RankingUpdateQueue (更新队列)

位置: `packages/backend/src/services/RankingUpdateQueue.ts`

#### 防抖机制

排名更新使用防抖（Debounce）机制，避免频繁计算：

```typescript
class RankingUpdateQueue {
  private readonly DEBOUNCE_DELAY = 2000; // 2秒延迟
  private updateTimer: NodeJS.Timeout | null = null;
  private pendingUpdate: boolean = false;
  private isUpdating: boolean = false;
}
```

#### 工作流程

1. **任务完成触发更新**
```typescript
// 在 TaskService 中，任务完成时调用
rankingUpdateQueue.scheduleUpdate();
```

2. **scheduleUpdate() - 调度更新**
```typescript
scheduleUpdate(): void {
  this.pendingUpdate = true;
  
  // 清除现有定时器
  if (this.updateTimer) {
    clearTimeout(this.updateTimer);
  }
  
  // 设置新的定时器（2秒后执行）
  this.updateTimer = setTimeout(() => {
    this.executeUpdate();
  }, this.DEBOUNCE_DELAY);
}
```

**防抖效果**:
- 如果 2 秒内有多个任务完成，定时器会被重置
- 只有在最后一个任务完成后 2 秒，才会真正执行更新
- 这样可以将多个任务的完成批量处理

3. **executeUpdate() - 执行更新**
```typescript
private async executeUpdate(): Promise<void> {
  // 防止并发更新
  if (this.isUpdating) {
    return;
  }
  
  this.isUpdating = true;
  this.pendingUpdate = false;
  
  try {
    // 更新所有周期的排名
    await this.rankingService.updateAllRankings();
  } finally {
    this.isUpdating = false;
  }
}
```

4. **forceUpdate() - 强制立即更新**
```typescript
async forceUpdate(): Promise<void> {
  // 清除定时器
  if (this.updateTimer) {
    clearTimeout(this.updateTimer);
  }
  
  // 立即执行更新
  await this.executeUpdate();
}
```

用于管理员手动刷新排名或关键更新场景。


### 3. Ranking Routes (API 路由)

位置: `packages/backend/src/routes/ranking.routes.ts`

#### API 端点

##### GET /api/rankings
获取排名列表（支持多种查询参数）

**请求参数**:
```typescript
{
  period?: 'monthly' | 'quarterly' | 'all_time',
  year?: number,
  month?: number,  // period=monthly 时需要
  quarter?: number,  // period=quarterly 时需要
  limit?: number
}
```

**响应**:
```typescript
[
  {
    userId: string,
    username: string,
    avatarUrl: string,
    totalBounty: number,
    completedTasksCount: number,
    rank: number,
    period: string,
    year: number,
    month: number | null,
    quarter: number | null,
    user: {
      id: string,
      username: string,
      email: string,
      // ...
    }
  }
]
```

##### GET /api/rankings/current/monthly
获取当前月度排名（快捷方式）

##### GET /api/rankings/current/quarterly
获取当前季度排名（快捷方式）

##### GET /api/rankings/all-time
获取总累积排名（快捷方式）

##### GET /api/rankings/user/:userId
获取指定用户的排名

**请求参数**:
```typescript
{
  period: 'monthly' | 'quarterly' | 'all_time',
  year?: number,
  month?: number,
  quarter?: number
}
```

##### POST /api/rankings/calculate (仅管理员)
手动触发排名计算

**请求体**:
```typescript
{
  period: 'monthly' | 'quarterly' | 'all_time',
  year: number,
  month?: number,
  quarter?: number
}
```

##### POST /api/rankings/update-all (仅管理员)
强制更新所有周期的排名（绕过防抖机制）

##### GET /api/rankings/status
获取排名更新队列状态

**响应**:
```typescript
{
  isUpdating: boolean,  // 是否正在更新
  hasPendingUpdate: boolean,  // 是否有待处理的更新
  debounceDelay: number  // 防抖延迟时间（毫秒）
}
```


## 前端实现

### 1. RankingPage 组件

位置: `packages/frontend/src/pages/RankingPage.tsx`

#### 状态管理

```typescript
const [rankings, setRankings] = useState<Ranking[]>([]);  // 排名列表
const [myRanking, setMyRanking] = useState<Ranking | null>(null);  // 我的排名
const [loading, setLoading] = useState(false);  // 加载状态
const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'all_time'>('monthly');
const [year, setYear] = useState(new Date().getFullYear());
const [month, setMonth] = useState(new Date().getMonth() + 1);
const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
```

#### 数据加载流程

```typescript
const loadRankings = async () => {
  setLoading(true);
  
  // 构建查询参数
  const params: any = { period, year };
  if (period === 'monthly') {
    params.month = month;
  } else if (period === 'quarterly') {
    params.quarter = quarter;
  }
  
  // 并行请求排名列表和我的排名
  const [rankingsData, myRankingData] = await Promise.all([
    rankingApi.getRankings(params),
    user ? rankingApi.getMyRanking(user.id, params) : null,
  ]);
  
  setRankings(rankingsData || []);
  setMyRanking(myRankingData);
  setLoading(false);
};
```

**优化点**:
- 使用 `Promise.all` 并行请求，减少等待时间
- 错误处理：即使请求失败也不显示错误消息，只是显示空列表
- 自动重新加载：当 period、year、month、quarter 变化时触发

#### UI 组件

##### 1. 我的排名卡片

```typescript
const renderMyRankingCard = () => {
  if (!myRanking) {
    return <Card>您还没有排名数据</Card>;
  }
  
  return (
    <Card style={{ background: `linear-gradient(...)` }}>
      <Row>
        <Col>排名图标</Col>
        <Col>累计赏金</Col>
        <Col>统计周期</Col>
      </Row>
    </Card>
  );
};
```

**特点**:
- 前三名显示特殊图标（金、银、铜牌）
- 使用渐变背景色区分排名等级
- 显示累计赏金和统计周期


##### 2. 排名表格

```typescript
const columns: ColumnsType<Ranking> = [
  {
    title: '排名',
    dataIndex: 'rank',
    render: (rank: number) => getRankIcon(rank),  // 前三名显示奖杯图标
  },
  {
    title: '用户',
    render: (_, record) => (
      <Space>
        <Avatar src={record.user?.avatarUrl} />
        <div>
          <div>{record.user?.username}</div>
          <Text type="secondary">{record.user?.email}</Text>
        </div>
      </Space>
    ),
  },
  {
    title: '累计赏金',
    dataIndex: 'totalBounty',
    render: (amount: number) => `$${amount.toFixed(2)}`,
  },
  {
    title: '任务完成数',
    dataIndex: 'completedTasksCount',
    render: (count: number) => <Tag>{count || 0} 个任务</Tag>,
  },
  {
    title: '更新时间',
    dataIndex: 'calculatedAt',
    render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
  },
];
```

**特点**:
- 当前用户所在行高亮显示（通过 `rowClassName`）
- 支持分页和每页显示数量调整
- 显示总用户数

##### 3. 周期选择器

```typescript
<Tabs activeKey={period} onChange={setPeriod}>
  <TabPane tab="本月排名" key="monthly" />
  <TabPane tab="本季度排名" key="quarterly" />
  <TabPane tab="总累积排名" key="all_time" />
</Tabs>

{/* 额外控件 */}
<Space>
  <Select value={year} onChange={setYear}>
    {/* 最近5年 */}
  </Select>
  
  {period === 'monthly' && (
    <Select value={month} onChange={setMonth}>
      {/* 1-12月 */}
    </Select>
  )}
  
  {period === 'quarterly' && (
    <Select value={quarter} onChange={setQuarter}>
      {/* 1-4季度 */}
    </Select>
  )}
</Space>
```

### 2. Ranking API

位置: `packages/frontend/src/api/ranking.ts`

```typescript
export const rankingApi = {
  // 获取排名列表
  getRankings: async (params?: RankingQueryParams): Promise<Ranking[]> => {
    return createApiMethod<Ranking[]>('get', '/rankings')(params);
  },
  
  // 获取用户排名
  getMyRanking: async (userId: string, params: RankingQueryParams) => {
    return createApiMethodWithParams<Ranking | null, string>(
      'get', 
      (id) => `/rankings/user/${id}`
    )(userId, params);
  },
};
```


## 数据流程

### 完整的数据流程图

```
任务完成
    ↓
TaskService.completeTask()
    ↓
更新任务状态为 'completed'
    ↓
rankingUpdateQueue.scheduleUpdate()
    ↓
等待 2 秒（防抖）
    ↓
RankingUpdateQueue.executeUpdate()
    ↓
RankingService.updateAllRankings()
    ↓
并行计算三种排名:
  - calculateCurrentMonthRankings()
  - calculateCurrentQuarterRankings()
  - calculateAllTimeRankings()
    ↓
每个计算方法执行:
  1. 开启数据库事务
  2. 查询用户赏金总额
  3. 删除旧排名数据
  4. 计算新排名
  5. 插入新排名数据
  6. 提交事务
    ↓
排名更新完成
    ↓
前端查询最新排名
    ↓
显示在排名页面
```

### 详细步骤说明

#### 1. 任务完成触发

```typescript
// packages/backend/src/services/TaskService.ts
async completeTask(taskId: string, userId: string): Promise<Task> {
  // ... 更新任务状态
  
  // 触发排名更新
  rankingUpdateQueue.scheduleUpdate();
  
  return task;
}
```

#### 2. 防抖等待

```typescript
// 第一个任务完成: t=0s, 设置定时器 2s
// 第二个任务完成: t=1s, 重置定时器 2s (总共 t=3s)
// 第三个任务完成: t=2s, 重置定时器 2s (总共 t=4s)
// 没有新任务: t=4s, 执行更新
```

#### 3. 数据库查询

```sql
-- 步骤1: 计算每个用户的赏金总额
SELECT 
  u.id,
  COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.bounty_amount ELSE 0 END), 0) AS total_bounty
FROM users u
LEFT JOIN tasks t ON t.assignee_id = u.id
WHERE [日期过滤条件]
GROUP BY u.id
ORDER BY total_bounty DESC;

-- 步骤2: 删除旧排名
DELETE FROM rankings WHERE period = 'monthly' AND year = 2026 AND month = 2;

-- 步骤3: 插入新排名
INSERT INTO rankings (user_id, period, year, month, total_bounty, rank)
VALUES ($1, $2, $3, $4, $5, $6);
```


#### 4. 前端查询流程

```typescript
// 1. 用户打开排名页面
useEffect(() => {
  loadRankings();
}, [period, year, month, quarter]);

// 2. 发起 API 请求
const [rankingsData, myRankingData] = await Promise.all([
  fetch('/api/rankings?period=monthly&year=2026&month=2'),
  fetch('/api/rankings/user/user-id?period=monthly&year=2026&month=2'),
]);

// 3. 后端查询数据库
SELECT r.*, u.*, a.image_url
FROM rankings r
JOIN users u ON r.user_id = u.id
LEFT JOIN avatars a ON u.avatar_id = a.id
WHERE r.period = 'monthly' AND r.year = 2026 AND r.month = 2
ORDER BY r.rank ASC;

// 4. 返回数据并渲染
setRankings(rankingsData);
setMyRanking(myRankingData);
```

## 性能优化

### 1. 数据库层面

#### 索引优化

```sql
-- 查询排名列表时使用
CREATE INDEX idx_rankings_period_year_month_rank 
  ON rankings(period, year, month, rank);

-- 查询用户排名时使用
CREATE INDEX idx_rankings_user_period_year_month 
  ON rankings(user_id, period, year, month);
```

**效果**: 
- 排名列表查询从全表扫描变为索引扫描
- 查询时间从 O(n) 降低到 O(log n)

#### 物化视图（可选）

```sql
-- 创建当前月度排名的物化视图
CREATE MATERIALIZED VIEW current_month_rankings AS
SELECT r.*, u.username, u.email, a.image_url
FROM rankings r
JOIN users u ON r.user_id = u.id
LEFT JOIN avatars a ON u.avatar_id = a.id
WHERE r.period = 'monthly'
  AND r.year = EXTRACT(YEAR FROM NOW())
  AND r.month = EXTRACT(MONTH FROM NOW())
ORDER BY r.rank ASC;

-- 创建索引
CREATE INDEX idx_current_month_rankings_rank 
  ON current_month_rankings(rank);
```

**刷新策略**:
```typescript
// 在 calculateCurrentMonthRankings() 后刷新
await DatabaseOptimizationService.refreshCurrentMonthRankings();
```

### 2. 应用层面

#### 防抖机制

**问题**: 如果每次任务完成都立即计算排名，会导致：
- 数据库负载过高
- 重复计算浪费资源
- 可能产生锁竞争

**解决方案**: 使用 2 秒防抖
```typescript
// 多个任务在 2 秒内完成，只触发一次计算
scheduleUpdate() {
  clearTimeout(this.updateTimer);
  this.updateTimer = setTimeout(() => {
    this.executeUpdate();
  }, 2000);
}
```

**效果**:
- 10 个任务在 1 秒内完成 → 只计算 1 次
- 节省 90% 的计算资源


#### 并发控制

```typescript
private isUpdating: boolean = false;

private async executeUpdate(): Promise<void> {
  // 防止并发更新
  if (this.isUpdating) {
    return;
  }
  
  this.isUpdating = true;
  try {
    await this.rankingService.updateAllRankings();
  } finally {
    this.isUpdating = false;
  }
}
```

**效果**: 确保同一时间只有一个排名更新任务在执行

#### 事务保证

```typescript
const client = await this.pool.connect();
try {
  await client.query('BEGIN');
  
  // 1. 查询赏金总额
  // 2. 删除旧排名
  // 3. 插入新排名
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

**效果**: 
- 保证数据一致性
- 失败时自动回滚
- 避免部分更新导致的数据错误

### 3. 前端层面

#### 并行请求

```typescript
// 同时请求排名列表和我的排名
const [rankingsData, myRankingData] = await Promise.all([
  rankingApi.getRankings(params),
  rankingApi.getMyRanking(user.id, params),
]);
```

**效果**: 减少 50% 的等待时间

#### 错误处理

```typescript
try {
  const rankings = await rankingApi.getRankings(params);
  setRankings(rankings);
} catch (error) {
  // 不显示错误消息，只显示空列表
  setRankings([]);
}
```

**效果**: 提升用户体验，避免因网络问题导致的错误提示

#### 自动刷新

```typescript
useEffect(() => {
  loadRankings();
}, [period, year, month, quarter]);
```

**效果**: 切换周期时自动加载新数据，无需手动刷新


## 关键技术点

### 1. 相同赏金相同排名算法

```typescript
let currentRank = 1;
let previousBounty: number | null = null;

for (let i = 0; i < users.length; i++) {
  const currentBounty = users[i].totalBounty;
  
  // 只有当赏金不同时才更新排名
  if (previousBounty !== null && currentBounty !== previousBounty) {
    currentRank = i + 1;
  }
  
  users[i].rank = currentRank;
  previousBounty = currentBounty;
}
```

**示例**:
```
位置  赏金   排名
0     $100   1
1     $100   1  (相同赏金，保持排名1)
2     $80    3  (不同赏金，跳到位置3)
3     $80    3  (相同赏金，保持排名3)
4     $50    5  (不同赏金，跳到位置5)
```

### 2. 日期过滤逻辑

```sql
-- 优先使用实际完成时间，如果为空则使用更新时间
COALESCE(t.actual_end_date, t.updated_at)
```

**原因**:
- `actual_end_date`: 任务实际完成的时间（更准确）
- `updated_at`: 任务最后更新时间（备用）
- 使用 `COALESCE` 确保总是有值可用

### 3. LEFT JOIN 确保所有用户

```sql
FROM users u
LEFT JOIN tasks t ON t.assignee_id = u.id
```

**效果**:
- 即使用户没有完成任何任务，也会出现在结果中
- 赏金总额为 0，排名靠后
- 避免遗漏用户

### 4. COALESCE 处理 NULL

```sql
COALESCE(SUM(t.bounty_amount), 0) AS total_bounty
```

**效果**:
- 如果用户没有完成任务，SUM 返回 NULL
- COALESCE 将 NULL 转换为 0
- 避免前端处理 NULL 值

### 5. 唯一性约束

```sql
UNIQUE(user_id, period, year, month, quarter)
```

**效果**:
- 每个用户在特定周期只有一条记录
- 防止重复插入
- 更新时先删除旧记录，再插入新记录


## 常见问题

### Q1: 为什么排名更新有 2 秒延迟？

**A**: 这是防抖机制的设计。如果多个任务在短时间内完成，系统会等待 2 秒后批量更新，避免频繁计算。这样可以：
- 减少数据库负载
- 避免重复计算
- 提高系统性能

如果需要立即更新，管理员可以调用 `/api/rankings/update-all` 强制刷新。

### Q2: 为什么两个用户赏金相同但排名不同？

**A**: 这可能是因为：
1. 查看的是不同周期的排名（月度 vs 季度 vs 总累积）
2. 排名还未更新（等待防抖延迟）
3. 数据库中的赏金值有微小差异（浮点数精度问题）

正常情况下，相同赏金应该有相同排名。

### Q3: 如何查看历史排名？

**A**: 在排名页面：
1. 选择周期（月度/季度/总累积）
2. 选择年份
3. 选择月份或季度

系统会保留所有历史排名数据。

### Q4: 排名计算包括哪些任务？

**A**: 只计算满足以下条件的任务：
- 状态为 `completed`（已完成）
- 有 `assignee_id`（已分配给用户）
- 在指定时间范围内完成（根据 `actual_end_date` 或 `updated_at`）

### Q5: 管理员如何手动刷新排名？

**A**: 管理员可以：
1. 调用 `POST /api/rankings/update-all` 强制更新所有排名
2. 调用 `POST /api/rankings/calculate` 计算特定周期的排名

### Q6: 排名更新失败怎么办？

**A**: 系统有完善的错误处理：
1. 使用事务保证数据一致性
2. 失败时自动回滚
3. 记录错误日志
4. 不影响任务完成流程

管理员可以查看日志并手动触发更新。


## 扩展功能

### 1. 实时排名更新（WebSocket）

可以通过 WebSocket 实现实时排名推送：

```typescript
// 后端
rankingUpdateQueue.on('updated', (rankings) => {
  webSocketService.broadcast('ranking:updated', rankings);
});

// 前端
useEffect(() => {
  const socket = io();
  socket.on('ranking:updated', (rankings) => {
    setRankings(rankings);
  });
  return () => socket.disconnect();
}, []);
```

### 2. 排名变化通知

当用户排名发生变化时发送通知：

```typescript
async calculateRankings() {
  const oldRankings = await this.getRankings(...);
  const newRankings = await this.calculateNewRankings(...);
  
  // 比较排名变化
  for (const newRank of newRankings) {
    const oldRank = oldRankings.find(r => r.userId === newRank.userId);
    if (oldRank && oldRank.rank !== newRank.rank) {
      // 发送排名变化通知
      await notificationService.create({
        userId: newRank.userId,
        type: 'ranking_changed',
        message: `您的排名从第 ${oldRank.rank} 名变为第 ${newRank.rank} 名`,
      });
    }
  }
}
```

### 3. 排名趋势图

显示用户排名的历史变化：

```typescript
// 查询用户最近 12 个月的排名
const rankingHistory = await rankingService.getRankings({
  period: 'monthly',
  userId: userId,
  // 查询最近 12 个月
});

// 使用图表库（如 Chart.js）绘制趋势图
<LineChart data={rankingHistory} />
```

### 4. 分组排名

按岗位或项目组统计排名：

```sql
SELECT 
  p.name AS position_name,
  u.username,
  SUM(t.bounty_amount) AS total_bounty
FROM tasks t
JOIN users u ON t.assignee_id = u.id
JOIN positions p ON u.position_id = p.id
WHERE t.status = 'completed'
GROUP BY p.id, u.id
ORDER BY p.id, total_bounty DESC;
```

### 5. 排名奖励

根据排名自动发放奖励：

```typescript
async distributeRankingRewards() {
  const rankings = await this.getCurrentMonthRankings(10);
  
  const rewards = {
    1: 1000,  // 第一名奖励 $1000
    2: 500,   // 第二名奖励 $500
    3: 300,   // 第三名奖励 $300
  };
  
  for (const ranking of rankings) {
    if (rewards[ranking.rank]) {
      await userService.addBalance(
        ranking.userId, 
        rewards[ranking.rank]
      );
    }
  }
}
```

## 总结

排名系统是一个完整的数据统计和展示功能，涉及：

1. **数据库设计**: 合理的表结构和索引设计
2. **后端服务**: 排名计算、更新队列、API 接口
3. **前端展示**: 排名列表、我的排名、周期选择
4. **性能优化**: 防抖机制、并发控制、事务保证
5. **用户体验**: 实时更新、错误处理、自动刷新

通过这些设计，系统能够高效、准确地统计和展示用户排名，为用户提供良好的竞争激励机制。
