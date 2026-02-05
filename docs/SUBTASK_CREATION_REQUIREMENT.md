# 子任务创建要求

## 更新日期
2026-02-03

## 需求变更

### 新要求
**只有在母任务有承接者后才能创建子任务**

### 原因
1. **工作流清晰**: 确保母任务被承接后才能分解为子任务
2. **责任明确**: 子任务的创建和管理由母任务承接者负责
3. **避免混乱**: 防止未承接的任务被过早分解

## 实现细节

### 后端验证

#### 1. TaskService.canCreateSubtask()
**文件**: `packages/backend/src/services/TaskService.ts`

```typescript
async canCreateSubtask(parentTaskId: string, userId: string): Promise<boolean> {
  const parentTask = await this.getTask(parentTaskId);
  if (!parentTask) return false;
  
  // NEW REQUIREMENT: Parent task must have an assignee
  if (!parentTask.assigneeId) return false;
  
  // Creator can create
  if (parentTask.publisherId === userId) return true;
  
  // Assignee can create
  if (parentTask.assigneeId === userId) return true;
  
  return false;
}
```

**验证逻辑**:
1. ✅ 母任务必须存在
2. ✅ 母任务必须有承接者 (`assigneeId` 不为空)
3. ✅ 当前用户必须是创建者或承接者

#### 2. API 路由验证
**文件**: `packages/backend/src/routes/task.routes.ts`

```typescript
router.post('/:taskId/subtasks', authenticate, asyncHandler(async (req, res) => {
  // ... 获取母任务
  
  // NEW REQUIREMENT: Parent task must have an assignee
  if (!parentTask.assigneeId) {
    return res.status(400).json({ 
      error: 'Cannot create subtask: parent task must be accepted first' 
    });
  }
  
  // ... 其他验证
}));
```

**错误响应**:
- **状态码**: 400 Bad Request
- **错误消息**: "Cannot create subtask: parent task must be accepted first"

### 前端UI

#### 按钮状态
**文件**: `packages/frontend/src/components/TaskDetailDrawer.tsx`

```tsx
<Button 
  type="primary" 
  size="small" 
  icon={<PlusOutlined />}
  onClick={() => setCreateSubtaskVisible(true)}
  disabled={!task.assigneeId}
  title={!task.assigneeId ? '母任务必须先被承接才能创建子任务' : ''}
>
  创建子任务
</Button>
```

**UI 行为**:
- **有承接者**: 按钮正常显示，可点击 ✅
- **无承接者**: 按钮显示为灰色禁用状态，鼠标悬停显示提示信息 ⚠️
- **提示信息**: "母任务必须先被承接才能创建子任务"

## 用户工作流

### 场景 1: 创建者想要添加子任务

```
1. 用户创建母任务 "开发用户管理模块"
   ↓
2. 母任务状态: AVAILABLE (未承接)
   ↓
3. 用户打开任务详情，看到"创建子任务"按钮为灰色禁用状态
   ↓
4. 鼠标悬停显示: "母任务必须先被承接才能创建子任务"
   ↓
5. 用户承接母任务 (或等待他人承接)
   ↓
6. 母任务状态: IN_PROGRESS (已承接)
   ↓
7. "创建子任务"按钮变为可用状态 ✅
   ↓
8. 用户可以创建子任务
```

### 场景 2: 承接者想要添加子任务

```
1. 用户A创建母任务 "开发用户管理模块"
   ↓
2. 用户B承接母任务
   ↓
3. 用户B打开任务详情，看到"创建子任务"按钮可用 ✅
   ↓
4. 用户B可以创建子任务
```

### 场景 3: 尝试通过API创建子任务（无承接者）

```
POST /api/tasks/:taskId/subtasks
{
  "name": "设计UI",
  ...
}

Response: 400 Bad Request
{
  "error": "Cannot create subtask: parent task must be accepted first"
}
```

## 验证检查清单

### 后端验证
- [x] `TaskService.canCreateSubtask()` 检查母任务是否有承接者
- [x] API 路由在创建子任务前验证母任务承接状态
- [x] 返回清晰的错误消息

### 前端UI
- [x] 按钮在无承接者时显示为禁用状态
- [x] 鼠标悬停显示提示信息
- [x] 有承接者时按钮正常工作

### 用户体验
- [x] 提示信息清晰易懂
- [x] 用户知道如何解决问题（先承接母任务）
- [x] 不会出现混淆的错误状态

## 相关文档

- **子任务继承约束**: `docs/SUBTASK_INHERITANCE_AND_CONSTRAINTS.md`
- **子任务发布工作流**: `docs/SUBTASK_PUBLISHING_WORKFLOW_REDESIGN.md`
- **子任务深度限制**: `docs/SUBTASK_DEPTH_LIMIT_AND_UI_IMPROVEMENTS.md`

## 测试建议

### 手动测试步骤

1. **测试禁用状态**:
   - 创建一个新的顶级任务
   - 打开任务详情
   - 验证"创建子任务"按钮为灰色禁用状态
   - 验证鼠标悬停显示提示信息

2. **测试启用状态**:
   - 承接上述任务
   - 刷新或重新打开任务详情
   - 验证"创建子任务"按钮变为可用状态
   - 点击按钮，验证可以正常创建子任务

3. **测试API验证**:
   - 使用API工具（如Postman）尝试为未承接的任务创建子任务
   - 验证返回400错误和正确的错误消息

### 自动化测试建议

```typescript
describe('Subtask Creation Requirement', () => {
  it('should disable create subtask button when task has no assignee', () => {
    // 测试按钮禁用状态
  });

  it('should enable create subtask button when task has assignee', () => {
    // 测试按钮启用状态
  });

  it('should return 400 when creating subtask for unassigned parent', async () => {
    // 测试API验证
  });

  it('should allow creating subtask when parent has assignee', async () => {
    // 测试正常创建流程
  });
});
```

## 总结

这个变更确保了子任务只能在母任务被承接后创建，使工作流更加清晰和有序。通过前端UI禁用和后端API验证的双重保护，确保了数据一致性和用户体验。
