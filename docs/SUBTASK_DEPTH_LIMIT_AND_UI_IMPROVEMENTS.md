# 子任务深度限制和界面改进

## 问题描述

用户在尝试为子任务创建子任务时遇到错误：
- **错误信息**: "Task hierarchy cannot exceed 2 levels (depth 0-1)"
- **中文错误**: "创建子任务失败"

同时，界面上缺少对子任务的明确标识，用户难以区分顶级任务和子任务。

## 根本原因

系统设计限制任务层级只能有两层：
- **Depth 0**: 顶级任务（母任务）✓ 可以创建子任务
- **Depth 1**: 子任务 ✗ 不能再创建子任务

但前端界面存在以下问题：
1. "创建子任务"按钮对所有任务都显示，包括子任务
2. 子任务详情中仍显示"子任务"标签页（但无法使用）
3. 没有明确的视觉标识区分顶级任务和子任务

## 修复方案

### 1. 隐藏子任务的"创建子任务"按钮

在 `TaskDetailDrawer.tsx` 的 `renderSubtasks()` 函数中添加深度检查：

```typescript
const renderSubtasks = () => (
  <Card 
    bordered={false} 
    bodyStyle={{ padding: 0 }}
    extra={
      // Only show "Create Subtask" button for top-level tasks (depth 0)
      task && task.depth === 0 ? (
        <Button 
          type="primary" 
          size="small" 
          icon={<PlusOutlined />}
          onClick={() => setCreateSubtaskVisible(true)}
        >
          创建子任务
        </Button>
      ) : null
    }
  >
```

### 2. 隐藏子任务的"子任务"标签页

修改 `items` 数组，只为顶级任务显示"子任务"标签页：

```typescript
const items = task ? [
  {
    key: 'details',
    label: '详情',
    children: renderDetails(),
  },
  // Only show "子任务" tab for top-level tasks (depth 0)
  ...(task.depth === 0 ? [{
    key: 'subtasks',
    label: '子任务',
    children: renderSubtasks(),
  }] : []),
  {
    key: 'comments',
    label: '评论',
    children: <TaskComments taskId={task.id} task={task} />,
  },
  {
    key: 'attachments',
    label: '附件',
    children: <TaskAttachments taskId={task.id} task={task} />,
  },
] : [];
```

### 3. 在标题中添加子任务标签

```typescript
<Modal
  title={
    <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
      {task?.name || '任务详情'}
      {task && task.depth === 1 && (
        <Tag color="blue" style={{ marginLeft: 8 }}>子任务</Tag>
      )}
    </Title>
  }
  open={visible}
  onCancel={handleClose}
  width={700}
  footer={renderFooter()}
>
```

### 4. 在详情中添加任务类型信息行

```typescript
<InfoRow label="任务类型">
  {task.depth === 0 ? (
    <Tag color="green">顶级任务</Tag>
  ) : (
    <Tag color="blue">子任务</Tag>
  )}
</InfoRow>
```

## 用户体验改进

### 修复前
- ❌ 用户可以在任何任务（包括子任务）上看到"创建子任务"按钮
- ❌ 子任务详情中显示"子任务"标签页（但内容为空或无法使用）
- ❌ 点击后填写表单，提交时才会收到错误提示
- ❌ 没有明确标识哪些是子任务
- ❌ 用户体验差，浪费时间填写表单

### 修复后
- ✅ 只有顶级任务（depth 0）才显示"创建子任务"按钮
- ✅ 子任务（depth 1）不显示"子任务"标签页
- ✅ 子任务在标题中显示蓝色"子任务"标签
- ✅ 详情中显示任务类型（顶级任务/子任务）
- ✅ 从界面层面防止用户尝试创建不允许的深度
- ✅ 清晰的视觉标识，用户一眼就能识别任务类型
- ✅ 更好的用户体验，避免无效操作

## 界面展示

### 顶级任务详情
- **标题**: 任务名称（无标签）
- **标签页**: 详情 | 子任务 | 评论 | 附件
- **任务类型**: 绿色"顶级任务"标签
- **子任务标签页**: 显示子任务列表和"创建子任务"按钮

### 子任务详情
- **标题**: 任务名称 + 蓝色"子任务"标签
- **标签页**: 详情 | 评论 | 附件（无"子任务"标签页）
- **任务类型**: 蓝色"子任务"标签
- **无创建子任务功能**: 完全隐藏相关入口

## 技术细节

### 后端验证逻辑

在 `TaskService.ts` 的 `createTask()` 方法中：

```typescript
// Validate hierarchy depth if this is a subtask
let depth = 0;
if (parentId) {
  const parent = await this.getTask(parentId);
  if (!parent) {
    throw new NotFoundError('Parent task not found');
  }

  depth = parent.depth + 1;

  // Task hierarchy can have at most two levels (depth 0-1)
  if (depth > 1) {
    throw new ValidationError('Task hierarchy cannot exceed 2 levels (depth 0-1)');
  }
}
```

### 任务层级结构

```
顶级任务 (depth 0) ✓ 可以创建子任务
  └── 子任务 (depth 1) ✗ 不能创建子任务
```

## 测试验证

### 测试场景 1: 顶级任务
1. 打开一个顶级任务（depth 0）的详情
2. ✓ 标题中不显示"子任务"标签
3. ✓ 可以看到"子任务"标签页
4. ✓ 切换到"子任务"标签页
5. ✓ 应该看到"创建子任务"按钮
6. ✓ 详情中显示绿色"顶级任务"标签
7. 点击按钮可以成功创建子任务

### 测试场景 2: 子任务
1. 打开一个子任务（depth 1）的详情
2. ✓ 标题中显示蓝色"子任务"标签
3. ✓ 不应该看到"子任务"标签页
4. ✓ 只显示：详情 | 评论 | 附件
5. ✓ 详情中显示蓝色"子任务"标签
6. ✓ 界面上没有创建更深层级任务的入口

## 相关文件

### 修改的文件
- `packages/frontend/src/components/TaskDetailDrawer.tsx` 
  - 添加深度检查隐藏"创建子任务"按钮
  - 条件渲染"子任务"标签页
  - 在标题中添加子任务标签
  - 在详情中添加任务类型信息行

### 相关文档
- `docs/SUBTASK_INHERITANCE_AND_CONSTRAINTS.md` - 子任务继承和约束文档
- `docs/SUBTASK_FORM_STANDARDIZATION.md` - 子任务表单标准化文档

## 系统设计说明

### 为什么限制为两层？

1. **简化复杂度**: 避免过深的任务嵌套导致管理困难
2. **清晰的层级**: 母任务 → 子任务的两层结构足够满足大多数场景
3. **性能考虑**: 减少递归查询和聚合计算的复杂度
4. **用户体验**: 过深的层级会让用户难以理解和管理

### 如果需要更多层级怎么办？

如果确实需要更复杂的任务分解：
1. 将当前的子任务提升为独立的顶级任务
2. 然后为这个新的顶级任务创建子任务
3. 使用标签或项目分组来关联相关任务

## 日期

2026-02-02
