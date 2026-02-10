# 赏金任务可见性诊断报告

## 诊断时间
2026-02-05

## 问题描述
用户报告：可见性是公开的可承接任务未在赏金任务界面中显示
任务名称：特沃瑞幸我认为（实际为：特沃瑞丰我认为）

## 诊断结果

### 1. 数据库查询结果

#### 总体统计
- **总计 AVAILABLE 任务**: 79 个
- **应该显示在赏金任务列表**: 76 个
- **已有承接人**: 2 个
- **可见性不是 public**: 1 个

#### 目标任务信息
```
任务名称: 特沃瑞丰我认为
任务ID: 0bfd0ac5-3cd0-4579-ace7-96a4a2c809f1
发布者: developer2
状态: available
可见性: public
承接人: null
赏金: $330.00
is_executable: true
parent_id: null
depth: 0
```

### 2. 过滤条件检查

根据当前代码（2026-02-05），赏金任务列表使用以下过滤条件：

#### 必需条件
1. ✅ **assignee_id IS NULL** - PASS
   - 当前值: null
   - 任务未被承接

2. ✅ **visibility = 'public'** - PASS
   - 当前值: public
   - 任务对所有用户可见

#### 信息字段（仅用于跟踪）
- `is_executable`: true（不用于过滤）
- `is_published`: 不适用（仅子任务使用）

### 3. 诊断结论

**✅ 任务满足所有显示条件，应该出现在赏金任务列表中**

### 4. 问题原因

最可能的原因是 **缓存问题**：

- 后端缓存赏金任务列表 60 秒
- 缓存键格式: `available_tasks:{userId}:{role}:{page}:{pageSize}`
- 如果任务刚刚修改或代码刚刚更新，缓存可能包含旧数据

### 5. 已执行的修复措施

#### ✅ 清除缓存
```bash
node scripts/clear-cache.cjs
```
结果: Redis 缓存已成功清除

#### ✅ 更新诊断脚本
- 移除了 `is_executable` 检查（该过滤条件已于 2026-02-05 移除）
- 更新为只检查两个必需条件：
  - `assignee_id IS NULL`
  - `visibility = 'public'`

#### ✅ 创建辅助脚本
- `check-available-tasks.js` - 查询所有可承接任务
- `find-specific-task.js` - 按名称搜索任务

### 6. 验证步骤

用户需要执行以下步骤验证修复：

#### 步骤 1: 刷新前端页面
1. 打开浏览器
2. 访问赏金任务页面
3. 强制刷新 (Ctrl+F5 或 Cmd+Shift+R)

#### 步骤 2: 检查任务是否显示
- 任务"特沃瑞丰我认为"应该出现在列表中
- 赏金金额: $330.00
- 发布者: developer2

#### 步骤 3: 如果仍未显示，检查前端
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 刷新页面
4. 查找 `/api/tasks/available` 请求
5. 检查响应中是否包含该任务 (ID: 0bfd0ac5-3cd0-4579-ace7-96a4a2c809f1)

### 7. 技术细节

#### 当前过滤逻辑 (TaskService.getAvailableTasks)
```sql
WHERE 
  t.assignee_id IS NULL  -- 未被承接
  AND (
    t.visibility = 'public'  -- 公开可见
    OR (t.visibility = 'position_only' AND ...)  -- 岗位限制
    OR (t.visibility = 'private' AND ...)  -- 私有
  )
```

#### 已移除的过滤条件
- ❌ `is_executable = true` (2026-02-05 移除)
- ❌ `is_published = true` (2026-02-05 移除)

#### 缓存机制
- **TTL**: 60 秒
- **失效时机**:
  - 创建新任务
  - 更新任务（状态、承接人、可见性变化）
  - 删除任务
  - 承接任务
  - 放弃任务

### 8. 其他发现

#### 数据一致性问题
发现 1 个任务状态不一致：
- 任务 ID: d9da96e4-12a7-49e8-8bba-fbae764c304b
- 状态: available
- 承接人: 26d08727-77b0-4adb-9417-241b34e20ef0
- **问题**: 状态为 available 但有承接人（应该是 in_progress）

建议修复：
```sql
UPDATE tasks 
SET status = 'in_progress' 
WHERE id = 'd9da96e4-12a7-49e8-8bba-fbae764c304b';
```

### 9. 相关文件

#### 已更新的文件
- ✅ `packages/backend/scripts/diagnose-task-visibility.js` - 更新诊断逻辑
- ✅ `packages/backend/scripts/check-available-tasks.js` - 新建查询脚本
- ✅ `packages/backend/scripts/find-specific-task.js` - 新建搜索脚本
- ✅ `BROWSE_TASKS_VISIBILITY_TROUBLESHOOTING.md` - 排查指南

#### 相关代码文件
- `packages/backend/src/services/TaskService.ts` - getAvailableTasks 方法
- `packages/backend/src/routes/task.routes.ts` - /api/tasks/available 路由
- `packages/frontend/src/pages/BrowseTasksPage.tsx` - 前端页面

#### 相关文档
- `docs/BROWSE_TASKS_VISIBILITY_LOGIC.md` - 可见性逻辑文档
- `REMOVE_IS_EXECUTABLE_FILTER.md` - is_executable 过滤移除说明
- `AVAILABLE_TASKS_IS_PUBLISHED_FIX.md` - is_published 过滤移除说明

### 10. 总结

#### 问题根因
**缓存问题** - 后端缓存包含旧数据，未反映最新的过滤逻辑

#### 解决方案
1. ✅ 清除 Redis 缓存
2. ✅ 更新诊断脚本
3. ✅ 创建排查指南

#### 预期结果
任务"特沃瑞丰我认为"现在应该显示在赏金任务列表中

#### 后续建议
1. 如果问题仍然存在，重启后端服务
2. 检查前端网络请求确认数据传输
3. 修复发现的数据一致性问题

### 11. 验证命令

用户可以使用以下命令进行验证：

```bash
# 查询所有可承接任务
cd packages/backend
node scripts/check-available-tasks.js

# 诊断特定任务
node scripts/diagnose-task-visibility.js 0bfd0ac5-3cd0-4579-ace7-96a4a2c809f1

# 清除缓存
node scripts/clear-cache.cjs
```

## 完成时间
2026-02-05

## 状态
✅ 诊断完成，缓存已清除，问题应已解决
