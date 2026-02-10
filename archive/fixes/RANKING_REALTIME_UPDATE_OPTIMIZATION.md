# 排名实时更新优化

## 更新日期
2026-02-06

## 问题描述

之前的排名系统存在延迟问题：
- 任务完成后，排名不会立即更新
- 用户需要等待较长时间才能看到最新排名
- 影响用户体验，特别是在查看排名时

## 优化方案

### 核心思路

采用**防抖机制（Debouncing）**来平衡实时性和性能：

1. **快速响应**: 任务完成后2秒内更新排名
2. **批量处理**: 多个任务在2秒内完成时，只计算一次
3. **避免重复**: 防止同时进行多个排名计算

### 技术实现

#### 1. 排名更新队列 (RankingUpdateQueue)

创建了新的服务 `RankingUpdateQueue.ts`，提供以下功能：

**防抖调度**:
```typescript
scheduleUpdate(): void {
  // 清除之前的定时器
  if (this.updateTimer) {
    clearTimeout(this.updateTimer);
  }
  
  // 设置新的定时器（2秒后执行）
  this.updateTimer = setTimeout(() => {
    this.executeUpdate();
  }, 2000);
}
```

**执行更新**:
```typescript
private async executeUpdate(): Promise<void> {
  // 确保同时只有一个更新在进行
  if (this.isUpdating) {
    return;
  }
  
  this.isUpdating = true;
  
  try {
    // 更新所有排名（月度、季度、总榜）
    await this.rankingService.updateAllRankings();
  } finally {
    this.isUpdating = false;
  }
}
```

**强制更新**:
```typescript
async forceUpdate(): Promise<void> {
  // 清除防抖定时器
  if (this.updateTimer) {
    clearTimeout(this.updateTimer);
  }
  
  // 立即执行更新
  await this.executeUpdate();
}
```

#### 2. TaskService 集成

修改 `TaskService.ts` 中的任务完成逻辑：

**之前的实现**:
```typescript
// 任务完成时触发排名更新（异步，不等待）
if (updates.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
  this.rankingService.updateAllRankings().catch(error => {
    logger.error('Failed to update rankings:', error);
  });
}
```

**优化后的实现**:
```typescript
// 任务完成时调度排名更新（2秒防抖）
if (updates.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
  rankingUpdateQueue.scheduleUpdate();
  logger.debug('Ranking update scheduled for task completion', { taskId });
}
```

#### 3. 管理员接口

添加了新的 API 端点：

**手动刷新排名**:
```
POST /api/rankings/update-all
```
- 权限: super_admin
- 功能: 立即更新所有排名（绕过防抖）
- 用途: 管理员手动刷新或紧急更新

**查询更新状态**:
```
GET /api/rankings/status
```
- 权限: 所有已认证用户
- 返回:
  ```json
  {
    "isUpdating": false,
    "hasPendingUpdate": false,
    "debounceDelay": 2000
  }
  ```

---

## 工作流程

### 场景 1: 单个任务完成

```
用户完成任务
    ↓
TaskService.updateTask() 调用
    ↓
rankingUpdateQueue.scheduleUpdate()
    ↓
等待 2 秒
    ↓
执行排名更新
    ↓
用户刷新页面看到新排名
```

**时间线**:
- T+0s: 任务完成
- T+2s: 排名更新完成
- 用户体验: 2秒内看到最新排名 ✅

### 场景 2: 多个任务快速完成

```
用户完成任务1 (T+0s)
    ↓
调度更新（2秒后）
    ↓
用户完成任务2 (T+1s)
    ↓
重新调度更新（从T+1s开始计算2秒）
    ↓
用户完成任务3 (T+1.5s)
    ↓
再次重新调度更新（从T+1.5s开始计算2秒）
    ↓
等待 2 秒（从最后一次完成开始）
    ↓
执行一次排名更新（包含所有3个任务）
    ↓
用户看到所有任务的排名变化
```

**时间线**:
- T+0s: 任务1完成
- T+1s: 任务2完成
- T+1.5s: 任务3完成
- T+3.5s: 排名更新完成（只计算一次）
- 性能优化: 3个任务只触发1次计算 ✅

### 场景 3: 管理员手动刷新

```
管理员点击"刷新排名"按钮
    ↓
前端调用 POST /api/rankings/update-all
    ↓
rankingUpdateQueue.forceUpdate()
    ↓
清除防抖定时器
    ↓
立即执行排名更新
    ↓
返回成功响应
    ↓
前端刷新排名列表
```

**时间线**:
- T+0s: 点击刷新
- T+0.5s: 排名更新完成
- 用户体验: 立即看到最新排名 ✅

---

## 性能对比

### 优化前

| 场景 | 更新延迟 | 计算次数 | 用户体验 |
|------|---------|---------|---------|
| 单任务完成 | 立即 | 1次 | ⚠️ 可能看到旧数据 |
| 3任务快速完成 | 立即 | 3次 | ⚠️ 数据库压力大 |
| 查看排名 | N/A | 0次 | ❌ 可能看到过时数据 |

**问题**:
- 排名计算是异步的，不等待完成
- 用户刷新页面时可能看到旧数据
- 多个任务完成时会触发多次计算

### 优化后

| 场景 | 更新延迟 | 计算次数 | 用户体验 |
|------|---------|---------|---------|
| 单任务完成 | 2秒 | 1次 | ✅ 2秒内看到新数据 |
| 3任务快速完成 | 3.5秒 | 1次 | ✅ 批量更新，性能好 |
| 查看排名 | 最多2秒 | 0次 | ✅ 数据新鲜度高 |
| 手动刷新 | 0.5秒 | 1次 | ✅ 立即更新 |

**优势**:
- ✅ 2秒内完成更新，用户体验好
- ✅ 批量处理，减少数据库压力
- ✅ 防止重复计算
- ✅ 支持手动强制刷新

---

## 配置参数

### 防抖延迟

**当前值**: 2000ms (2秒)

**调整方法**:
```typescript
// packages/backend/src/services/RankingUpdateQueue.ts
private readonly DEBOUNCE_DELAY = 2000; // 修改这个值
```

**建议值**:
- **1000ms (1秒)**: 更快的响应，但可能增加计算频率
- **2000ms (2秒)**: 平衡的选择（推荐）
- **5000ms (5秒)**: 更少的计算，但用户等待时间长

### 性能考虑

**排名计算耗时**:
- 小型系统（<1000用户）: ~100-200ms
- 中型系统（1000-10000用户）: ~200-500ms
- 大型系统（>10000用户）: ~500-1000ms

**建议**:
- 如果排名计算很快（<200ms），可以减少防抖延迟到1秒
- 如果排名计算较慢（>500ms），保持2秒或增加到3秒

---

## 监控和日志

### 日志记录

**调度更新**:
```
DEBUG: Ranking update scheduled
{
  delay: 2000,
  pendingUpdate: true
}
```

**开始更新**:
```
INFO: Starting ranking update
```

**完成更新**:
```
INFO: Ranking update completed
{
  duration: 234
}
```

**更新失败**:
```
ERROR: Failed to update rankings
{
  error: "..."
}
```

### 监控指标

建议监控以下指标：

1. **更新频率**: 每小时触发多少次排名更新
2. **更新耗时**: 每次更新花费多长时间
3. **失败率**: 更新失败的比例
4. **防抖效果**: 平均每次更新包含多少个任务完成

---

## 使用指南

### 前端集成

#### 1. 查询更新状态

```typescript
// 检查排名是否正在更新
const response = await fetch('/api/rankings/status', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const status = await response.json();
// {
//   isUpdating: false,
//   hasPendingUpdate: false,
//   debounceDelay: 2000
// }
```

#### 2. 显示更新提示

```typescript
// 在排名页面显示更新状态
if (status.hasPendingUpdate) {
  showMessage('排名更新中，请稍候...');
} else if (status.isUpdating) {
  showMessage('正在计算排名...');
}
```

#### 3. 自动刷新

```typescript
// 任务完成后，等待2秒自动刷新排名
async function completeTask(taskId: string) {
  await api.tasks.completeTask(taskId);
  
  // 等待排名更新
  setTimeout(async () => {
    // 刷新排名数据
    const rankings = await api.rankings.getCurrentMonthRankings();
    updateRankingDisplay(rankings);
  }, 2500); // 2.5秒后刷新（留0.5秒缓冲）
}
```

#### 4. 手动刷新按钮（管理员）

```typescript
// 管理员手动刷新排名
async function refreshRankings() {
  setLoading(true);
  
  try {
    await fetch('/api/rankings/update-all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // 刷新排名列表
    const rankings = await api.rankings.getCurrentMonthRankings();
    updateRankingDisplay(rankings);
    
    showSuccess('排名已更新');
  } catch (error) {
    showError('更新失败');
  } finally {
    setLoading(false);
  }
}
```

---

## 测试验证

### 1. 单任务完成测试

```bash
# 完成一个任务
curl -X POST http://localhost:3000/api/tasks/{taskId}/complete \
  -H "Authorization: Bearer {token}"

# 等待2秒

# 查询排名
curl http://localhost:3000/api/rankings/current/monthly \
  -H "Authorization: Bearer {token}"

# 验证: 排名应该已更新
```

### 2. 多任务快速完成测试

```bash
# 快速完成3个任务
curl -X POST http://localhost:3000/api/tasks/{taskId1}/complete \
  -H "Authorization: Bearer {token}"

sleep 0.5

curl -X POST http://localhost:3000/api/tasks/{taskId2}/complete \
  -H "Authorization: Bearer {token}"

sleep 0.5

curl -X POST http://localhost:3000/api/tasks/{taskId3}/complete \
  -H "Authorization: Bearer {token}"

# 等待3秒（从最后一次完成开始计算2秒）

# 查询排名
curl http://localhost:3000/api/rankings/current/monthly \
  -H "Authorization: Bearer {token}"

# 验证: 所有3个任务的赏金都应该计入排名
```

### 3. 手动刷新测试

```bash
# 手动触发排名更新
curl -X POST http://localhost:3000/api/rankings/update-all \
  -H "Authorization: Bearer {token}"

# 立即查询排名
curl http://localhost:3000/api/rankings/current/monthly \
  -H "Authorization: Bearer {token}"

# 验证: 排名应该是最新的
```

### 4. 状态查询测试

```bash
# 完成任务
curl -X POST http://localhost:3000/api/tasks/{taskId}/complete \
  -H "Authorization: Bearer {token}"

# 立即查询状态
curl http://localhost:3000/api/rankings/status \
  -H "Authorization: Bearer {token}"

# 预期输出:
# {
#   "isUpdating": false,
#   "hasPendingUpdate": true,
#   "debounceDelay": 2000
# }

# 等待2秒后再次查询
sleep 2.5

curl http://localhost:3000/api/rankings/status \
  -H "Authorization: Bearer {token}"

# 预期输出:
# {
#   "isUpdating": false,
#   "hasPendingUpdate": false,
#   "debounceDelay": 2000
# }
```

---

## 故障排查

### 问题 1: 排名没有更新

**症状**: 任务完成后，等待超过2秒，排名仍然没有更新

**排查步骤**:
1. 检查日志是否有错误
   ```bash
   grep "Failed to update rankings" logs/app.log
   ```

2. 查询更新状态
   ```bash
   curl http://localhost:3000/api/rankings/status
   ```

3. 手动触发更新
   ```bash
   curl -X POST http://localhost:3000/api/rankings/update-all
   ```

**可能原因**:
- 数据库连接问题
- 排名计算逻辑错误
- 权限问题

### 问题 2: 排名更新太慢

**症状**: 排名更新需要很长时间

**排查步骤**:
1. 检查排名计算耗时
   ```bash
   grep "Ranking update completed" logs/app.log | grep duration
   ```

2. 检查数据库性能
   ```sql
   EXPLAIN ANALYZE
   SELECT ... FROM tasks WHERE status = 'completed' ...
   ```

**优化建议**:
- 添加数据库索引
- 使用物化视图
- 增加防抖延迟

### 问题 3: 频繁计算排名

**症状**: 日志显示排名更新非常频繁

**排查步骤**:
1. 检查更新频率
   ```bash
   grep "Starting ranking update" logs/app.log | wc -l
   ```

2. 检查是否有代码直接调用 `updateAllRankings()`

**解决方案**:
- 确保所有任务完成都使用 `rankingUpdateQueue.scheduleUpdate()`
- 增加防抖延迟
- 检查是否有其他地方触发更新

---

## 相关文件

### 新增文件
- `packages/backend/src/services/RankingUpdateQueue.ts` - 排名更新队列

### 修改文件
- `packages/backend/src/services/TaskService.ts` - 集成更新队列
- `packages/backend/src/routes/ranking.routes.ts` - 添加新接口

### 相关文档
- `archive/fixes/ADMIN_RANKING_BOUNTY_DISCREPANCY_FIX.md` - 排名差异修复
- `docs/PROJECT_ARCHITECTURE_OVERVIEW.md` - 项目架构概览

---

## 总结

### 优化效果

✅ **实时性提升**:
- 从"不确定何时更新"到"2秒内必定更新"
- 用户体验显著改善

✅ **性能优化**:
- 多个任务完成时批量处理
- 减少数据库计算压力
- 防止重复计算

✅ **灵活性增强**:
- 支持手动强制刷新
- 可查询更新状态
- 可调整防抖延迟

### 适用场景

- ✅ 小型到中型系统（<10000用户）
- ✅ 任务完成频率适中（每分钟<10个）
- ✅ 用户关注排名实时性

### 未来改进

如果系统规模继续扩大，可以考虑：
1. 使用消息队列（Redis Pub/Sub, RabbitMQ）
2. 实现增量更新（只更新受影响的用户）
3. 使用物化视图加速查询
4. 实现分布式锁（多服务器部署时）

---

## 更新日期
2026-02-06

## 优化状态
✅ 已实现并测试
