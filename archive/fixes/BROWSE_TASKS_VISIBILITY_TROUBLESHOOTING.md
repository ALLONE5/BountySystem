# 赏金任务可见性问题排查指南

## 实施日期
2026-02-05

## 问题描述
用户报告：可见性是公开的可承接任务仍未在赏金任务界面中显示

## 当前过滤逻辑

根据最新的代码（2026-02-05），赏金任务列表使用以下过滤条件：

### 必需条件（所有条件必须满足）

1. **未被承接** (`assignee_id IS NULL`)
   - 任务必须没有承接人
   - 一旦任务被承接，就会从赏金任务列表中消失

2. **可见性检查**（以下之一）：
   - **PUBLIC**: 所有用户可见
   - **POSITION_ONLY**: 仅特定岗位的用户可见
   - **PRIVATE**: 仅发布者可见

**重要说明**：
- ✅ `is_executable` 过滤条件已于 2026-02-05 移除
- ✅ `is_published` 过滤条件已于 2026-02-05 移除
- ✅ 母任务和子任务都可以显示在赏金任务列表中
- ✅ 系统使用 `visibility` 字段控制任务可见性

## 可能的原因

### 1. 缓存问题 ⏱️
**症状**: 任务满足所有条件但不显示

**原因**: 后端缓存赏金任务列表 60 秒

**解决方案**:
```bash
# 方案 A: 等待 60 秒后刷新页面

# 方案 B: 手动清除缓存
cd packages/backend
node scripts/clear-cache.cjs
```

### 2. 后端服务未重启 🔄
**症状**: 代码已修改但未生效

**原因**: Node.js 需要重启才能加载新代码

**解决方案**:
```bash
# 重启后端服务
cd packages/backend
npm run dev
```

### 3. 任务实际不满足条件 ❌
**症状**: 任务有 assignee_id 或 visibility 不是 public

**诊断方法**:
```bash
cd packages/backend
node scripts/diagnose-task-visibility.js <任务ID>
```

**示例输出**:
```
=== TASK INFORMATION ===
ID: abc-123
Name: 特沃瑞幸我认为
Status: available
Visibility: public
Bounty: 330.00

=== FILTER CONDITIONS ===
1. assignee_id IS NULL: ✅ PASS
2. visibility = 'public': ✅ PASS

=== OVERALL RESULT ===
✅ Task SHOULD appear in browse tasks list
```

### 4. 前端过滤 🖥️
**症状**: 后端返回任务但前端不显示

**检查方法**:
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 刷新赏金任务页面
4. 查找 `/api/tasks/available` 请求
5. 检查响应中是否包含该任务

**前端过滤逻辑**:
- 关键字搜索（客户端过滤）
- 分组显示（客户端组织）
- 排序（传递给后端）

## 排查步骤

### 步骤 1: 运行诊断脚本
```bash
cd packages/backend
node scripts/diagnose-task-visibility.js <任务ID>
```

### 步骤 2: 检查诊断结果

#### 如果显示 "✅ Task SHOULD appear"
任务满足所有条件，问题可能是：
- **缓存**: 等待 60 秒或清除缓存
- **后端未重启**: 重启后端服务
- **前端过滤**: 检查浏览器网络请求

#### 如果显示 "❌ Task WILL NOT appear"
任务不满足条件，根据原因修复：
- **已被承接**: 等待承接人放弃任务
- **可见性不是 public**: 修改任务可见性

### 步骤 3: 清除缓存（如果需要）
```bash
cd packages/backend
node scripts/clear-cache.cjs
```

### 步骤 4: 重启后端服务（如果需要）
```bash
cd packages/backend
# 停止当前服务 (Ctrl+C)
npm run dev
```

### 步骤 5: 验证前端
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 刷新赏金任务页面
4. 查找 `/api/tasks/available` 请求
5. 检查响应数据

## 常见场景

### 场景 1: 母任务有子任务
**现在的行为** (2026-02-05 之后):
- ✅ 母任务可以显示在赏金任务列表中
- ✅ 子任务也可以显示在赏金任务列表中
- ✅ 用户可以选择承接母任务或单个子任务

**示例**:
```
母任务 (depth 0)
├─ assignee_id: null
├─ visibility: public
├─ ✅ 会显示在赏金任务列表中
└─ 子任务 (depth 1)
   ├─ assignee_id: null
   ├─ visibility: public
   └─ ✅ 也会显示在赏金任务列表中
```

### 场景 2: 子任务未发布
**症状**: 子任务不显示

**原因**: 子任务 `visibility = PRIVATE`

**解决方案**: 母任务承接人发布子任务（将 visibility 改为 PUBLIC）

### 场景 3: 任务已被承接
**症状**: 任务不显示

**原因**: 任务有 `assignee_id`

**解决方案**: 等待承接人放弃任务

## 技术细节

### 后端查询 (TaskService.getAvailableTasks)
```sql
WHERE 
  t.assignee_id IS NULL  -- 未被承接
  AND (
    t.visibility = 'public'  -- 公开可见
    OR (t.visibility = 'position_only' AND ...)  -- 岗位限制
    OR (t.visibility = 'private' AND ...)  -- 私有
  )
```

### 缓存机制
- **缓存键**: `available_tasks:{userId}:{role}:{page}:{pageSize}`
- **TTL**: 60 秒
- **失效时机**:
  - 创建新任务
  - 更新任务（状态、承接人、可见性变化）
  - 删除任务
  - 承接任务
  - 放弃任务

## 相关文件

### 后端
- `packages/backend/src/services/TaskService.ts` - getAvailableTasks 方法
- `packages/backend/src/routes/task.routes.ts` - /api/tasks/available 路由
- `packages/backend/scripts/diagnose-task-visibility.js` - 诊断脚本（已更新）
- `packages/backend/scripts/clear-cache.cjs` - 清除缓存脚本

### 前端
- `packages/frontend/src/pages/BrowseTasksPage.tsx` - 赏金任务页面
- `packages/frontend/src/api/task.ts` - API 客户端

### 文档
- `docs/BROWSE_TASKS_VISIBILITY_LOGIC.md` - 可见性逻辑文档
- `REMOVE_IS_EXECUTABLE_FILTER.md` - is_executable 过滤移除说明
- `AVAILABLE_TASKS_IS_PUBLISHED_FIX.md` - is_published 过滤移除说明

## 更新日志

### 2026-02-05
- ✅ 更新诊断脚本，移除 is_executable 检查
- ✅ 创建排查指南文档
- ✅ 明确当前过滤逻辑（只检查 assignee_id 和 visibility）

## 下一步行动

### 对于用户
1. 运行诊断脚本检查具体任务状态
2. 根据诊断结果采取相应措施：
   - 如果任务满足条件：清除缓存或重启后端
   - 如果任务不满足条件：修复任务属性

### 对于开发者
1. 确认后端代码已更新（移除 is_executable 和 is_published 过滤）
2. 确认后端服务已重启
3. 使用诊断脚本验证任务状态
4. 检查前端网络请求确认数据传输

## 总结

**任务要显示在赏金任务列表中，必须满足**:
1. ✅ 未被承接 (assignee_id IS NULL)
2. ✅ 可见性为 PUBLIC（或符合用户权限的其他可见性）

**母任务和子任务都可以显示在赏金任务列表中**，只要满足上述条件。

**如果任务满足条件但不显示**，最可能的原因是缓存（等待 60 秒或清除缓存）。
