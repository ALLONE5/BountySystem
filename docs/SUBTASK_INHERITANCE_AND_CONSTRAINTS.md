# 子任务继承和约束逻辑实现

## 需求描述

修改任务逻辑，实现以下功能：
1. **子任务的负责人继承母任务**：子任务自动继承母任务的负责人（assignee）
2. **子任务创建逻辑和一级任务一致**：子任务的创建流程与顶级任务相同
3. **时间约束**：子任务的时间必须在母任务的时间范围内
4. **工时约束**：子任务的预估工时不能超过母任务的预估工时

## 实现方案

### 1. 后端逻辑修改

**文件**: `packages/backend/src/services/TaskService.ts`

#### 修改 `addSubtask` 方法

**修改前**:
```typescript
async addSubtask(parentId: string, subtaskData: TaskCreateDTO): Promise<Task> {
  const isValid = await this.validateTaskHierarchy(parentId);
  if (!isValid) {
    throw new ValidationError('Cannot add subtask: parent task not found or maximum depth exceeded');
  }

  return this.createTask({
    ...subtaskData,
    parentId,
  });
}
```

**修改后**:
```typescript
async addSubtask(parentId: string, subtaskData: TaskCreateDTO): Promise<Task> {
  // 1. 验证母任务存在和层级有效
  const isValid = await this.validateTaskHierarchy(parentId);
  if (!isValid) {
    throw new ValidationError('Cannot add subtask: parent task not found or maximum depth exceeded');
  }

  // 2. 获取母任务信息
  const parent = await this.getTask(parentId);
  if (!parent) {
    throw new NotFoundError('Parent task not found');
  }

  // 3. 继承母任务的负责人
  const inheritedAssigneeId = parent.assigneeId || subtaskData.assigneeId;
  
  // 4. 验证时间范围
  if (subtaskData.plannedStartDate && parent.plannedStartDate) {
    const subtaskStart = new Date(subtaskData.plannedStartDate);
    const parentStart = new Date(parent.plannedStartDate);
    
    if (subtaskStart < parentStart) {
      throw new ValidationError(
        `Subtask start date cannot be before parent start date`
      );
    }
  }
  
  if (subtaskData.plannedEndDate && parent.plannedEndDate) {
    const subtaskEnd = new Date(subtaskData.plannedEndDate);
    const parentEnd = new Date(parent.plannedEndDate);
    
    if (subtaskEnd > parentEnd) {
      throw new ValidationError(
        `Subtask end date cannot be after parent end date`
      );
    }
  }
  
  // 5. 验证预估工时
  if (subtaskData.estimatedHours && parent.estimatedHours) {
    if (subtaskData.estimatedHours > parent.estimatedHours) {
      throw new ValidationError(
        `Subtask estimated hours cannot exceed parent estimated hours`
      );
    }
  }

  // 6. 创建子任务，继承负责人
  return this.createTask({
    ...subtaskData,
    parentId,
    assigneeId: inheritedAssigneeId,
  });
}
```

**关键改进**:
- 自动继承母任务的`assigneeId`
- 验证子任务的开始时间不早于母任务
- 验证子任务的结束时间不晚于母任务
- 验证子任务的预估工时不超过母任务
- 所有验证失败都会抛出清晰的错误信息

### 2. 前端表单修改

**文件**: `packages/frontend/src/components/TaskDetailDrawer.tsx`

#### 创建子任务表单增强

**新增功能**:

1. **显示母任务约束信息**:
```typescript
<Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f2f5' }}>
  <Text type="secondary" style={{ fontSize: 12 }}>
    <strong>母任务约束：</strong>
  </Text>
  <div style={{ marginTop: 8 }}>
    {task.assignee && (
      <div>• 负责人：{task.assignee.username}（子任务将自动继承）</div>
    )}
    {task.plannedStartDate && task.plannedEndDate && (
      <div>• 时间范围：{...}</div>
    )}
    {task.estimatedHours && (
      <div>• 最大工时：{task.estimatedHours} 小时</div>
    )}
  </div>
</Card>
```

2. **添加时间选择器**:
```typescript
<Form.Item
  name="plannedStartDate"
  label="计划开始时间"
  rules={[
    {
      validator: (_, value) => {
        // 验证不早于母任务开始时间
      }
    }
  ]}
>
  <DatePicker 
    disabledDate={(current) => {
      // 禁用早于母任务开始时间的日期
    }}
  />
</Form.Item>
```

3. **工时输入验证**:
```typescript
<Form.Item
  name="estimatedHours"
  label="预计工时（小时）"
  rules={[
    {
      validator: (_, value) => {
        if (value > task.estimatedHours) {
          return Promise.reject(new Error(`工时不能超过母任务工时`));
        }
        return Promise.resolve();
      }
    }
  ]}
>
  <InputNumber 
    min={0} 
    max={task.estimatedHours || undefined}
  />
</Form.Item>
```

## 业务规则

### 1. 负责人继承规则

- **自动继承**: 子任务创建时自动继承母任务的`assigneeId`
- **优先级**: 如果母任务有负责人，使用母任务的负责人；否则使用子任务数据中提供的负责人
- **群组任务**: 如果母任务是群组任务，子任务也会继承群组ID，并验证负责人是否为群组成员

### 2. 时间约束规则

- **开始时间**: 子任务的`plannedStartDate`必须 >= 母任务的`plannedStartDate`
- **结束时间**: 子任务的`plannedEndDate`必须 <= 母任务的`plannedEndDate`
- **可选字段**: 如果母任务或子任务没有设置时间，则不进行验证
- **前端禁用**: 前端DatePicker会禁用不符合约束的日期

### 3. 工时约束规则

- **最大工时**: 子任务的`estimatedHours`必须 <= 母任务的`estimatedHours`
- **可选字段**: 如果母任务或子任务没有设置工时，则不进行验证
- **前端限制**: 前端InputNumber的max属性设置为母任务的工时

### 4. 创建流程一致性

子任务的创建流程与顶级任务完全一致：
- 使用相同的`createTask`方法
- 经过相同的验证流程
- 自动计算赏金（从母任务平分）
- 自动设置深度（depth）
- 自动标记为可执行（isExecutable）

## 验证逻辑

### 后端验证

1. **母任务存在性验证**: 确保母任务存在
2. **层级深度验证**: 确保不超过最大深度（2层）
3. **时间范围验证**: 确保子任务时间在母任务范围内
4. **工时验证**: 确保子任务工时不超过母任务
5. **群组成员验证**: 如果是群组任务，验证负责人是群组成员

### 前端验证

1. **表单字段验证**: 使用Ant Design的Form.Item rules
2. **日期禁用**: 使用DatePicker的disabledDate属性
3. **数值限制**: 使用InputNumber的min/max属性
4. **实时反馈**: 验证失败时显示错误提示

## 错误处理

### 后端错误信息

```typescript
// 时间约束错误
throw new ValidationError(
  `Subtask start date (${subtaskStart.toISOString()}) cannot be before parent start date (${parentStart.toISOString()})`
);

// 工时约束错误
throw new ValidationError(
  `Subtask estimated hours (${subtaskData.estimatedHours}) cannot exceed parent estimated hours (${parent.estimatedHours})`
);
```

### 前端错误提示

```typescript
// 表单验证错误
return Promise.reject(new Error(`开始时间不能早于母任务开始时间 (${parentStart.format('YYYY-MM-DD')})`));

// API错误
message.error('创建子任务失败');
```

## 用户体验优化

### 1. 约束信息展示

在创建子任务表单顶部显示母任务的约束信息：
- 负责人（将自动继承）
- 时间范围
- 最大工时

### 2. 智能禁用

- DatePicker自动禁用不符合约束的日期
- InputNumber设置最大值为母任务工时
- 提供清晰的占位符提示

### 3. 实时验证

- 用户输入时立即验证
- 显示友好的错误提示
- 防止提交无效数据

## 测试场景

### 1. 正常创建子任务

```javascript
// 母任务
{
  assigneeId: 'user-1',
  plannedStartDate: '2026-02-01',
  plannedEndDate: '2026-02-28',
  estimatedHours: 40
}

// 子任务（有效）
{
  name: '子任务1',
  plannedStartDate: '2026-02-05',
  plannedEndDate: '2026-02-20',
  estimatedHours: 20
}
// ✓ 创建成功，继承 assigneeId: 'user-1'
```

### 2. 时间约束违反

```javascript
// 子任务（无效 - 开始时间过早）
{
  plannedStartDate: '2026-01-25', // 早于母任务
  plannedEndDate: '2026-02-20',
}
// ✗ 错误: Subtask start date cannot be before parent start date

// 子任务（无效 - 结束时间过晚）
{
  plannedStartDate: '2026-02-05',
  plannedEndDate: '2026-03-05', // 晚于母任务
}
// ✗ 错误: Subtask end date cannot be after parent end date
```

### 3. 工时约束违反

```javascript
// 子任务（无效 - 工时超出）
{
  estimatedHours: 50 // 超过母任务的40小时
}
// ✗ 错误: Subtask estimated hours cannot exceed parent estimated hours
```

## 相关文件

### 后端文件
- `packages/backend/src/services/TaskService.ts` - 主要修改文件
- `packages/backend/src/routes/task.routes.ts` - 路由定义

### 前端文件
- `packages/frontend/src/components/TaskDetailDrawer.tsx` - 主要修改文件
- `packages/frontend/src/api/task.ts` - API调用

## 数据库字段

子任务相关字段：
- `parent_id`: 母任务ID（UUID）
- `assignee_id`: 负责人ID（从母任务继承）
- `planned_start_date`: 计划开始时间（必须在母任务范围内）
- `planned_end_date`: 计划结束时间（必须在母任务范围内）
- `estimated_hours`: 预估工时（不能超过母任务）
- `depth`: 任务深度（0=顶级，1=子任务）

## 未来改进建议

1. **批量创建子任务**: 支持一次创建多个子任务
2. **智能时间分配**: 根据子任务数量自动分配时间段
3. **工时自动分配**: 根据子任务复杂度自动分配工时
4. **模板功能**: 保存常用的子任务模板
5. **依赖关系**: 支持子任务之间的依赖关系

## 日期

2026-02-02
