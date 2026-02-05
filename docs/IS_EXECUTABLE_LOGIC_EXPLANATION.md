# is_executable 字段逻辑说明

## 概述

`is_executable` 字段是一个**自动维护**的布尔字段，用于标识任务是否可以被直接执行（承接）。这个字段通过**数据库触发器**自动设置，不需要应用代码手动管理。

## 核心规则

```
is_executable = true  ⟺  任务没有子任务（叶子节点）
is_executable = false ⟺  任务有子任务（父节点）
```

## 数据库触发器实现

### 位置
`packages/database/migrations/20241210_000001_create_core_tables.sql`

### 触发器 1: `check_task_executable()`

**作用**: 在插入或更新任务时，检查该任务是否有子任务

```sql
CREATE OR REPLACE FUNCTION check_task_executable()
RETURNS TRIGGER AS $$
DECLARE
  child_count INTEGER;
BEGIN
  -- 检查任务是否有子任务
  SELECT COUNT(*) INTO child_count FROM tasks WHERE parent_id = NEW.id;
  
  IF child_count > 0 THEN
    NEW.is_executable := FALSE;  -- 有子任务 = 不可执行
  ELSE
    NEW.is_executable := TRUE;   -- 无子任务 = 可执行
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_task_executable
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_task_executable();
```

**触发时机**: 
- BEFORE INSERT - 插入任务之前
- BEFORE UPDATE - 更新任务之前

### 触发器 2: `update_parent_executable()`

**作用**: 当创建子任务时，自动将父任务标记为不可执行

```sql
CREATE OR REPLACE FUNCTION update_parent_executable()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- 当创建子任务时，将父任务设置为不可执行
    UPDATE tasks SET is_executable = FALSE WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_on_child_insert
  AFTER INSERT ON tasks
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_executable();
```

**触发时机**: 
- AFTER INSERT - 插入子任务之后
- 条件: 只有当新任务有 parent_id 时才触发

## 工作流程示例

### 场景 1: 创建顶级任务

```sql
INSERT INTO tasks (name, publisher_id, depth) 
VALUES ('开发新功能', 'user123', 0);
```

**执行过程**:
1. `check_task_executable()` 触发器执行
2. 查询子任务数量: `SELECT COUNT(*) FROM tasks WHERE parent_id = NEW.id` → 0
3. 设置 `is_executable = TRUE`
4. 任务创建完成，可以被承接 ✅

### 场景 2: 为任务添加子任务

```sql
INSERT INTO tasks (name, publisher_id, parent_id, depth) 
VALUES ('设计UI', 'user123', 'parent-task-id', 1);
```

**执行过程**:
1. `check_task_executable()` 触发器执行（针对新子任务）
2. 新子任务没有子任务，设置 `is_executable = TRUE`
3. 子任务插入完成
4. `update_parent_executable()` 触发器执行（针对父任务）
5. 更新父任务: `UPDATE tasks SET is_executable = FALSE WHERE id = parent_id`
6. **父任务现在不可执行** ❌
7. **子任务可以执行** ✅

### 场景 3: 删除所有子任务

当删除一个任务的所有子任务后，父任务会在下次更新时自动变回可执行状态（通过 `check_task_executable()` 触发器）。

## 设计理由

### 为什么需要这个逻辑？

1. **任务层级管理**
   - 父任务是组织性的容器，用于分组和管理
   - 只有叶子节点（实际工作单元）才能被承接和执行

2. **防止逻辑冲突**
   - 如果父任务可以被承接，那么它的子任务应该如何处理？
   - 如果父任务和子任务都被不同的人承接，会造成责任不清

3. **工作流清晰**
   - 用户在"赏金任务"中只看到可以直接工作的任务
   - 避免承接了一个任务后发现它还需要分解成子任务

4. **进度追踪**
   - 父任务的进度通过子任务的进度自动聚合
   - 父任务不应该有独立的执行进度

### 实际应用场景

**场景**: 开发一个用户管理模块

```
母任务: 开发用户管理模块 (depth=0, is_executable=false)
├─ 子任务1: 设计用户界面 (depth=1, is_executable=true) ✅ 可承接
├─ 子任务2: 实现后端API (depth=1, is_executable=true) ✅ 可承接
└─ 子任务3: 编写测试用例 (depth=1, is_executable=true) ✅ 可承接
```

**用户视角**:
- 在"赏金任务"中看到 3 个可承接的子任务
- 不会看到母任务（因为它不可执行）
- 可以选择承接其中一个或多个子任务
- 母任务的进度会根据子任务自动更新

## 相关代码位置

### 数据库层
- **触发器定义**: `packages/database/migrations/20241210_000001_create_core_tables.sql`
- **字段定义**: `is_executable BOOLEAN NOT NULL DEFAULT TRUE`

### 应用层
- **TaskService**: `packages/backend/src/services/TaskService.ts`
  - `getAvailableTasks()` - 使用 `is_executable = true` 过滤
  - `acceptTask()` - 检查 `is_executable` 是否为 true
  - `assignTask()` - 检查 `is_executable` 是否为 true

### 前端
- **BrowseTasksPage**: `packages/frontend/src/pages/BrowseTasksPage.tsx`
  - 调用 `/api/tasks/available` 获取可执行任务

## 常见问题

### Q1: 为什么我的任务创建后 is_executable 是 false？

**A**: 检查是否在创建任务后又为它添加了子任务。一旦添加子任务，触发器会自动将父任务设置为不可执行。

### Q2: 可以手动设置 is_executable 吗？

**A**: 不建议。这个字段由数据库触发器自动维护。手动设置可能会导致数据不一致。如果需要修改，应该通过添加/删除子任务来间接影响。

### Q3: 如何让一个不可执行的任务变为可执行？

**A**: 删除该任务的所有子任务。触发器会在下次更新时自动将其设置为可执行。

### Q4: 为什么不在应用代码中管理这个字段？

**A**: 使用数据库触发器的优势：
- **数据一致性**: 无论通过哪个接口修改数据，规则都会被强制执行
- **性能**: 在数据库层面处理，避免额外的应用层查询
- **简化代码**: 应用代码不需要关心这个字段的维护逻辑
- **防止错误**: 避免应用代码忘记更新导致的数据不一致

## 总结

`is_executable` 字段是一个**自动维护的派生字段**，它的值完全由任务的层级结构决定：

- ✅ **叶子节点** (无子任务) → `is_executable = true` → 可以在赏金任务中显示和承接
- ❌ **父节点** (有子任务) → `is_executable = false` → 不会在赏金任务中显示

这个设计确保了任务系统的层级结构清晰，用户只能承接实际的工作单元（叶子任务），而不会承接组织性的容器任务（父任务）。
