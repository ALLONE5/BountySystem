# 子任务发布工作流实施状态

## 实施日期
2026-02-03

## 概述
实施了新的子任务发布工作流，允许母任务承接人控制子任务的发布和赏金分配。

## 已完成的工作

### 1. 数据库迁移 ✅
- **文件**: `packages/database/migrations/20260202_000001_add_subtask_publishing_fields.sql`
- **状态**: 已运行成功
- **新增字段**:
  - `bounty_payer_id`: 赏金支付者ID (对于子任务，是母任务承接人)
  - `is_published`: 任务是否已发布
  - `published_at`: 发布时间戳
  - `published_by`: 发布者ID
- **索引**: 为新字段创建了性能索引
- **数据迁移**: 现有任务标记为已发布以保持向后兼容性

### 2. 数据模型更新 ✅
- **文件**: `packages/backend/src/models/Task.ts`
- **更新内容**:
  - Task接口已包含新字段
  - TaskUpdateDTO已包含新字段
  - 添加了SubtaskPublishDTO接口用于发布操作

### 3. TaskRepository更新 ✅
- **文件**: `packages/backend/src/repositories/TaskRepository.ts`
- **更新内容**:
  - `getColumns()`: 添加了新字段到列列表
  - `mapRowToModel()`: 映射新字段到Task模型
  - `findByIdWithRelations()`: 查询包含新字段

### 4. TaskService业务逻辑 ✅
- **文件**: `packages/backend/src/services/TaskService.ts`
- **新增方法**:
  - `canCreateSubtask()`: 验证用户是否可以创建子任务 (创建者或母任务承接人)
  - `canPublishSubtask()`: 验证用户是否可以发布子任务 (仅母任务承接人)
  - `publishSubtask()`: 发布子任务，设置可见性和赏金
- **修改方法**:
  - `createTask()`: 子任务默认为私有、赏金为0、未发布状态
  - `acceptTask()`: 处理子任务承接时的赏金支付逻辑
  - `updateTask()`: 支持更新新字段
  - `addSubtask()`: 添加权限验证

### 5. API端点 ✅
- **文件**: `packages/backend/src/routes/task.routes.ts`
- **新增端点**:
  - `POST /api/tasks/:subtaskId/publish`: 发布子任务
    - 请求体: `{ visibility, bountyAmount, positionId? }`
    - 权限: 仅母任务承接人
    - 验证: 赏金金额、用户余额
- **修改端点**:
  - `POST /api/tasks/:taskId/subtasks`: 添加权限验证 (创建者或母任务承接人)

## 核心业务逻辑

### 子任务创建流程
1. 验证用户权限 (创建者或母任务承接人)
2. 创建子任务，默认值:
   - `visibility`: PRIVATE
   - `bountyAmount`: 0
   - `isPublished`: false
   - `assigneeId`: 母任务承接人 (可选)
   - `bountyPayerId`: 母任务承接人

### 子任务发布流程
1. 验证权限 (仅母任务承接人)
2. 验证母任务已被承接
3. 验证赏金金额 > 0
4. 验证用户余额充足
5. 更新子任务:
   - 设置可见性 (PUBLIC/POSITION_ONLY)
   - 设置赏金金额
   - 标记为已发布
   - 记录发布时间和发布者

### 子任务承接流程
1. 验证子任务已发布
2. 验证母任务承接人余额充足
3. 在事务中执行:
   - 从母任务承接人账户扣除赏金
   - 在bounty_transactions表中锁定赏金
   - 将子任务分配给承接者
   - 更新任务状态为IN_PROGRESS

## 待完成的工作

### 前端实现 🔄
- **文件**: `packages/frontend/src/components/TaskDetailDrawer.tsx`
- **需要的更改**:
  1. 简化子任务创建表单
     - 移除可见性选择 (自动设为PRIVATE)
     - 移除赏金金额输入 (自动设为0)
     - 添加提示信息
  
  2. 子任务列表显示
     - 显示发布状态图标:
       - 🔒 私有 (未发布)
       - 🌐 已发布 (可承接)
       - 👤 已承接
     - 为母任务承接人显示"发布子任务"按钮
  
  3. 发布子任务对话框
     - 可见性选择 (公开/仅特定岗位)
     - 岗位限制选择 (可选)
     - 赏金金额输入
     - 显示当前余额和发布后余额
     - 警告信息

### API客户端更新 🔄
- **文件**: `packages/frontend/src/api/task.ts`
- **需要添加**:
  ```typescript
  export const publishSubtask = async (
    subtaskId: string,
    data: { visibility: string; bountyAmount: number; positionId?: string }
  ) => {
    return apiClient.post(`/tasks/${subtaskId}/publish`, data);
  };
  ```

### 测试 ⏳
- 单元测试
- 集成测试
- 端到端测试

## 技术细节

### 权限矩阵
| 操作 | 任务创建者 | 母任务承接者 | 其他用户 |
|------|-----------|-------------|---------|
| 创建子任务 | ✅ | ✅ | ❌ |
| 发布子任务 | ❌ | ✅ | ❌ |
| 编辑未发布子任务 | ✅ | ✅ | ❌ |
| 承接已发布子任务 | ❌ | ❌ | ✅ |

### 数据流
```
创建子任务
  ↓
默认私有、赏金0、未发布
  ↓
母任务承接人决定发布
  ↓
设置可见性和赏金
  ↓
其他用户可见并承接
  ↓
赏金从母任务承接人账户扣除并锁定
  ↓
任务完成后赏金支付给承接者
```

### 向后兼容性
- 现有顶级任务不受影响
- 现有子任务标记为已发布
- 新的子任务遵循新工作流

## 下一步行动

1. **前端实现** (优先级: 高)
   - 更新TaskDetailDrawer组件
   - 添加发布子任务对话框
   - 更新子任务列表显示

2. **API客户端** (优先级: 高)
   - 添加publishSubtask方法

3. **测试** (优先级: 中)
   - 编写单元测试
   - 编写集成测试

4. **文档** (优先级: 低)
   - 更新API文档
   - 更新用户手册

## 注意事项

1. **余额验证**: 发布子任务前必须验证用户余额
2. **事务处理**: 承接子任务时的赏金扣除必须在事务中完成
3. **缓存失效**: 任务状态变更后需要清除相关缓存
4. **通知机制**: 子任务发布、承接时需要发送通知 (待实现)

## 相关文件

### 后端
- `packages/database/migrations/20260202_000001_add_subtask_publishing_fields.sql`
- `packages/backend/src/models/Task.ts`
- `packages/backend/src/services/TaskService.ts`
- `packages/backend/src/repositories/TaskRepository.ts`
- `packages/backend/src/routes/task.routes.ts`

### 前端 (待更新)
- `packages/frontend/src/components/TaskDetailDrawer.tsx`
- `packages/frontend/src/api/task.ts`

### 文档
- `docs/SUBTASK_PUBLISHING_WORKFLOW_REDESIGN.md` (设计文档)
- `docs/SUBTASK_PUBLISHING_WORKFLOW_IMPLEMENTATION_STATUS.md` (本文档)

## 测试建议

### 场景1: 创建私有子任务
1. 用户A创建一级任务
2. 用户B承接一级任务
3. 用户B创建子任务
4. 验证: 子任务默认私有、赏金为0、未发布

### 场景2: 发布子任务
1. 用户B (母任务承接人) 发布子任务
2. 设置可见性为公开、赏金为500元
3. 验证: 子任务状态变为已发布、在赏金任务列表中可见

### 场景3: 承接子任务并支付赏金
1. 用户C承接已发布的子任务
2. 验证: 从用户B账户扣除500元、赏金被锁定、子任务分配给用户C

### 场景4: 权限验证
1. 用户D尝试发布用户B的子任务
2. 验证: 返回403错误，提示权限不足

## 版本信息
- 实施版本: v1.0.0
- 数据库迁移版本: 20260202_000001
- 最后更新: 2026-02-03
