# 路由顺序和排名修复

## 修复时间
2026-01-05

## 问题1：个人界面显示"请求的资源不存在"

### 问题描述
刷新个人界面时，显示"请求的资源不存在"错误。

### 根本原因

**Express路由匹配顺序问题**：

原始路由定义顺序：
```typescript
router.get('/visible', ...)           // ✅ 正确
router.get('/available', ...)         // ✅ 正确
router.post('/:taskId/accept', ...)   // ❌ 参数化路由太早
router.get('/user/published', ...)    // ❌ 被上面的路由遮蔽
router.get('/user/assigned', ...)     // ❌ 被上面的路由遮蔽
router.get('/:taskId', ...)           // 参数化路由
```

**问题**：虽然 `/user/published` 在 `/:taskId` 之前定义，但Express在匹配路由时，`/:taskId/accept` 这样的参数化路由可能会干扰后续的路径匹配。

**错误日志**：
```
Error: 无效的类型 uuid 输入语法: "published"
```

这说明 `/tasks/user/published` 被错误地匹配到了某个 `/:taskId` 路由，将 `user` 当作了taskId。

### 解决方案

**重新排列路由顺序**，将所有非参数化路由放在参数化路由之前：

```typescript
// 1. 所有非参数化的GET路由
router.get('/visible', ...)           // ✅ 
router.get('/available', ...)         // ✅
router.get('/user/published', ...)    // ✅ 移到前面
router.get('/user/assigned', ...)     // ✅ 移到前面

// 2. 参数化路由
router.post('/:taskId/accept', ...)   // ✅ 现在不会干扰
router.get('/:taskId', ...)           // ✅
router.put('/:taskId', ...)           // ✅
// ... 其他参数化路由
```

### Express路由匹配规则

1. **按定义顺序匹配**：Express按照路由定义的顺序进行匹配
2. **第一个匹配的路由获胜**：一旦找到匹配的路由，就不再继续查找
3. **参数化路由更宽松**：`/:id` 会匹配任何路径段，包括 `user`、`published` 等
4. **具体路径优先**：应该将具体路径（如 `/user/published`）放在参数化路径（如 `/:id`）之前

### 修复后的效果

✅ `/api/tasks/user/published` - 正常工作，返回20个任务
✅ `/api/tasks/user/assigned` - 正常工作
✅ `/api/tasks/:taskId` - 正常工作，不会误匹配

## 问题2：排名界面中相同赏金的用户排名不一致

### 问题描述
用户报告排名界面中相同赏金的用户有不同的排名。

### 实际情况

✅ **已经修复且工作正常！**

重新计算排名后的结果：

#### 2025年12月排名
```json
{
  "rank": 1, "userId": "admin", "totalBounty": 4000, "completedTasksCount": 5
},
{
  "rank": 2, "userId": "user1", "totalBounty": 2800, "completedTasksCount": 3
},
{
  "rank": 3, "userId": "designer1", "totalBounty": 1850, "completedTasksCount": 4
},
{
  "rank": 4, "userId": "user2", "totalBounty": 200, "completedTasksCount": 1
},
{
  "rank": 5, "userId": "manager1", "totalBounty": 0, "completedTasksCount": 0
},
{
  "rank": 5, "userId": "user3", "totalBounty": 0, "completedTasksCount": 0
},
{
  "rank": 5, "userId": "developer2", "totalBounty": 0, "completedTasksCount": 0
},
{
  "rank": 5, "userId": "developer1", "totalBounty": 0, "completedTasksCount": 0
}
```

✅ 所有¥0的用户都是第5名（并列）

#### 2026年1月排名
```json
所有8个用户都是 "rank": 1, "totalBounty": 0
```

✅ 所有¥0的用户都是第1名（并列）

### 排名计算逻辑

```typescript
let currentRank = 1;
let previousBounty: number | null = null;

for (let i = 0; i < bountyResult.rows.length; i++) {
  const row = bountyResult.rows[i];
  const currentBounty = parseFloat(row.total_bounty);
  
  // 只有当赏金变化时才更新排名
  if (previousBounty !== null && currentBounty !== previousBounty) {
    currentRank = i + 1;
  }
  
  // 使用 currentRank 作为排名
  previousBounty = currentBounty;
}
```

### 排名规则

1. **相同赏金 = 相同排名** ✅
2. **跳过中间排名**：如果有N个用户并列某排名，下一个排名跳过N-1个名次 ✅
3. **排序依据**：
   - 主要：赏金金额（降序）
   - 次要：用户ID（升序，保证稳定性）

## 验证步骤

### 1. 测试个人界面API

```bash
# 登录
POST http://localhost:3000/api/auth/login
{
  "username": "admin",
  "password": "Password123"
}

# 测试发布任务API
GET http://localhost:3000/api/tasks/user/published
Authorization: Bearer <token>

# 应该返回任务列表，不再报错
```

### 2. 测试排名计算

```bash
# 重新计算2025年12月排名
POST http://localhost:3000/api/rankings/calculate
Authorization: Bearer <token>
{
  "period": "monthly",
  "year": 2025,
  "month": 12
}

# 验证相同赏金的用户有相同排名
```

### 3. 前端验证

1. 刷新浏览器（Ctrl+Shift+R）
2. 访问个人界面 - 应该正常加载
3. 访问排名页面 - 相同赏金的用户应该有相同排名

## 相关文件

### 修复的文件
- `packages/backend/src/routes/task.routes.ts` - 路由顺序调整
- `packages/backend/src/services/RankingService.ts` - 排名计算逻辑（之前已修复）

### 测试的API
- `GET /api/tasks/user/published` - 获取发布的任务 ✅
- `GET /api/tasks/user/assigned` - 获取承接的任务 ✅
- `POST /api/rankings/calculate` - 计算排名 ✅

## 最佳实践

### Express路由定义顺序

```typescript
// ✅ 正确的顺序
router.get('/specific/path', ...)      // 1. 最具体的路径
router.get('/user/published', ...)     // 2. 多段具体路径
router.get('/available', ...)          // 3. 单段具体路径
router.post('/:id/action', ...)        // 4. 参数化路径 + 具体动作
router.get('/:id', ...)                // 5. 纯参数化路径（最后）

// ❌ 错误的顺序
router.get('/:id', ...)                // 会匹配所有路径！
router.get('/user/published', ...)     // 永远不会被匹配到
```

### 路由定义原则

1. **具体优先**：具体路径在前，参数化路径在后
2. **长度优先**：路径段多的在前，路径段少的在后
3. **动作分离**：`/:id/action` 在 `/:id` 之前
4. **测试验证**：定义路由后立即测试，确保匹配正确

## 总结

✅ **问题1（个人界面）**：通过调整路由顺序修复，将 `/user/published` 和 `/user/assigned` 移到参数化路由之前

✅ **问题2（排名）**：排名计算逻辑正确，相同赏金的用户获得相同排名

**关键修复**：
- 路由顺序调整：非参数化路由 → 参数化路由
- 排名计算：使用 `currentRank` 变量跟踪，只在赏金变化时更新

**验证结果**：
- 个人界面API正常工作（20个任务）
- 2025年12月排名：4个¥0用户都是第5名
- 2026年1月排名：8个¥0用户都是第1名
