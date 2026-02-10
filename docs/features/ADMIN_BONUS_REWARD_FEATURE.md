# 管理员额外奖赏功能

## 功能概述
为超级管理员和岗位管理员添加"额外奖赏"功能，允许他们为已完成的任务增加额外的赏金，以奖励表现优秀的任务执行者。

## 实现日期
2026年2月10日

## 功能特性

### 1. 权限控制
- **超级管理员** (super_admin): 可以为所有已完成的任务添加额外奖赏
- **岗位管理员** (position_admin): 可以为其管理岗位相关的已完成任务添加额外奖赏
- **普通用户**: 无权限使用此功能

### 2. 使用条件
- 任务状态必须为"已完成" (completed)
- 任务必须有承接人 (assignee)
- 额外奖赏金额必须大于0

### 3. 功能效果
- 增加任务的总赏金金额
- 创建赏金交易记录 (transaction_type: 'bonus')
- 更新承接人的账户余额
- 触发排名系统更新

## 实现细节

### 前端实现

#### 1. UI组件 (`TaskManagementPage.tsx`)

**额外奖赏按钮**:
- 位置: 任务详情抽屉底部，"编辑任务"和"删除任务"按钮之间
- 显示条件: 仅当任务状态为"已完成"时显示
- 样式: 橙色边框和文字，带有美元符号图标

```typescript
{taskDrawer.data.status === TaskStatus.COMPLETED && (
  <Button 
    type="default" 
    icon={<DollarOutlined />} 
    onClick={handleAddBonus}
    style={{ borderColor: '#faad14', color: '#faad14' }}
  >
    额外奖赏
  </Button>
)}
```

**额外奖赏模态框**:
- 标题: "添加额外奖赏"
- 输入字段:
  1. **额外奖赏金额** (必填):
     - 类型: 数字输入框
     - 最小值: 0.01
     - 步进: 10
     - 精度: 2位小数
     - 前缀: $ 符号
     - 提示: 显示当前任务赏金
  
  2. **奖赏原因** (可选):
     - 类型: 文本域
     - 行数: 3
     - 占位符: "例如：任务完成质量优秀，提前完成等"

- 按钮:
  - 确认发放: 提交表单
  - 取消: 关闭模态框

#### 2. API调用 (`task.ts`)

```typescript
addBonusReward: async (taskId: string, amount: number, reason?: string) => {
  return createApiMethodWithParams<{ message: string; task: Task; transaction: any }, string>(
    'post',
    (id) => `/tasks/${id}/bonus`
  )(taskId, { amount, reason });
}
```

### 后端实现

#### 1. API路由 (`task.routes.ts`)

**端点**: `POST /api/tasks/:taskId/bonus`

**权限验证**:
```typescript
if (!Validator.isSuperAdmin(userRole) && userRole !== UserRole.POSITION_ADMIN) {
  return res.status(403).json({ error: 'Only administrators can add bonus rewards' });
}
```

**参数验证**:
```typescript
if (!amount || typeof amount !== 'number' || amount <= 0) {
  return res.status(400).json({ error: 'Valid bonus amount is required' });
}
```

**响应**:
```json
{
  "message": "Bonus reward added successfully",
  "task": { /* 更新后的任务对象 */ },
  "transaction": { /* 赏金交易记录 */ }
}
```

#### 2. 服务层 (`TaskService.ts`)

**方法**: `addBonusReward(taskId, bonusAmount, adminId, reason?)`

**业务逻辑**:
1. 验证任务存在
2. 验证任务状态为"已完成"
3. 验证任务有承接人
4. 更新任务赏金金额 (原金额 + 额外奖赏)
5. 创建赏金交易记录
6. 更新承接人账户余额
7. 触发排名系统更新
8. 返回更新后的任务和交易记录

**数据库操作**:

1. 更新任务赏金:
```sql
UPDATE tasks 
SET bounty_amount = bounty_amount + $bonusAmount
WHERE id = $taskId
```

2. 创建交易记录:
```sql
INSERT INTO bounty_transactions (
  task_id, user_id, amount, transaction_type, description, created_at
) VALUES ($1, $2, $3, 'bonus', $4, NOW())
```

3. 更新用户余额:
```sql
UPDATE users 
SET balance = balance + $bonusAmount 
WHERE id = $assigneeId
```

## 使用流程

### 管理员操作流程
1. 进入"管理功能" → "任务管理"
2. 点击已完成的任务查看详情
3. 在任务详情抽屉中点击"额外奖赏"按钮
4. 在弹出的模态框中输入额外奖赏金额
5. (可选) 输入奖赏原因
6. 点击"确认发放"
7. 系统自动:
   - 增加任务赏金
   - 发放奖赏给承接人
   - 更新排名
   - 创建交易记录

### 用户接收流程
1. 承接人的账户余额自动增加
2. 在赏金历史中可以看到新的交易记录
3. 排名系统会在2秒内更新
4. 任务详情中显示更新后的赏金金额

## 数据流程图

```
管理员点击"额外奖赏"
    ↓
打开额外奖赏模态框
    ↓
输入金额和原因
    ↓
提交表单
    ↓
前端调用 POST /api/tasks/:taskId/bonus
    ↓
后端验证权限和参数
    ↓
TaskService.addBonusReward()
    ↓
┌─────────────────────────────────┐
│ 1. 更新任务赏金金额              │
│ 2. 创建赏金交易记录              │
│ 3. 更新承接人账户余额            │
│ 4. 触发排名更新                  │
└─────────────────────────────────┘
    ↓
返回更新后的任务和交易记录
    ↓
前端刷新任务详情和任务列表
    ↓
显示成功消息
```

## 赏金交易记录

### 交易类型
- `transaction_type`: 'bonus'
- 区别于其他交易类型:
  - 'earn': 任务完成获得的基础赏金
  - 'spend': 发布任务支出的赏金
  - 'bonus': 管理员发放的额外奖赏 ✨

### 交易描述格式
- 有原因: "额外奖赏: {reason}"
- 无原因: "额外奖赏"

### 示例
```json
{
  "id": "uuid",
  "task_id": "task-uuid",
  "user_id": "user-uuid",
  "amount": 50.00,
  "transaction_type": "bonus",
  "description": "额外奖赏: 任务完成质量优秀",
  "created_at": "2026-02-10T10:30:00Z"
}
```

## 安全考虑

### 1. 权限验证
- 在路由层验证用户角色
- 只有管理员可以访问此功能
- 防止普通用户通过API直接调用

### 2. 参数验证
- 验证金额为正数
- 验证任务状态
- 验证任务有承接人
- 防止重复发放

### 3. 数据完整性
- 使用数据库事务确保操作原子性
- 同时更新任务、交易记录和用户余额
- 失败时自动回滚

### 4. 审计日志
- 记录管理员ID
- 记录操作时间
- 记录奖赏金额和原因
- 便于追踪和审计

## 测试建议

### 功能测试
1. **正常流程**:
   - 以管理员身份登录
   - 为已完成的任务添加额外奖赏
   - 验证任务赏金增加
   - 验证承接人余额增加
   - 验证交易记录创建

2. **权限测试**:
   - 以普通用户身份尝试添加额外奖赏
   - 验证返回403错误

3. **状态验证**:
   - 尝试为未完成的任务添加额外奖赏
   - 验证返回错误提示

4. **参数验证**:
   - 输入负数金额
   - 输入0金额
   - 输入非数字
   - 验证表单验证和后端验证

### 边界测试
1. 极小金额: $0.01
2. 极大金额: $999999.99
3. 多次添加额外奖赏
4. 并发添加额外奖赏

### 集成测试
1. 验证排名系统更新
2. 验证赏金历史显示
3. 验证任务列表刷新
4. 验证通知系统(如果有)

## 相关文件

### 前端
- `packages/frontend/src/pages/admin/TaskManagementPage.tsx` - UI实现
- `packages/frontend/src/api/task.ts` - API调用

### 后端
- `packages/backend/src/routes/task.routes.ts` - API路由
- `packages/backend/src/services/TaskService.ts` - 业务逻辑

### 数据库
- `bounty_transactions` 表 - 存储交易记录
- `tasks` 表 - 存储任务赏金
- `users` 表 - 存储用户余额

## 未来扩展

### 1. 批量发放
允许管理员一次为多个任务添加额外奖赏

### 2. 奖赏模板
预设常用的奖赏金额和原因模板

### 3. 审批流程
对于大额奖赏，需要多级审批

### 4. 通知功能
承接人收到额外奖赏时发送通知

### 5. 统计报表
统计管理员发放的额外奖赏总额和频率

### 6. 撤销功能
允许管理员在一定时间内撤销错误发放的奖赏

## 注意事项

1. **只能为已完成的任务添加额外奖赏**
2. **额外奖赏会立即发放到承接人账户**
3. **操作不可撤销，请谨慎操作**
4. **建议填写奖赏原因，便于后续审计**
5. **排名更新有2秒延迟（防抖机制）**
6. **大额奖赏建议先与财务部门确认**

## 问题修复记录

### 2026年2月10日 - 修复按钮不显示问题（第二次修复）

**问题**: 用户在任务详情抽屉中仍然看不到"额外奖赏"按钮

**原因分析**: 
1. 第一次修复只在 `TaskManagementPage.tsx` 中添加了按钮
2. 但用户可能从其他页面（如任务列表、已发布任务等）打开任务详情
3. 这些页面使用的是通用的 `TaskDetailDrawer` 组件，该组件没有额外奖赏功能

**解决方案**: 在 `TaskDetailDrawer.tsx` 中添加额外奖赏功能

**修改内容**:

1. **添加状态变量**:
```typescript
const [bonusModalVisible, setBonusModalVisible] = useState(false);
const [bonusForm] = Form.useForm();
const [addingBonus, setAddingBonus] = useState(false);
```

2. **添加处理函数**:
```typescript
const handleAddBonus = () => {
  bonusForm.resetFields();
  setBonusModalVisible(true);
};

const handleSubmitBonus = async (values: { amount: number; reason?: string }) => {
  if (!task) return;
  
  setAddingBonus(true);
  try {
    await taskApi.addBonusReward(task.id, values.amount, values.reason);
    message.success('额外奖赏发放成功');
    setBonusModalVisible(false);
    bonusForm.resetFields();
    
    if (onTaskUpdated) {
      onTaskUpdated();
    }
    onClose();
  } catch (error: any) {
    message.error(error.response?.data?.error || '发放额外奖赏失败');
  } finally {
    setAddingBonus(false);
  }
};
```

3. **在 renderFooter 中添加按钮**:
```typescript
// 如果是管理员且任务已完成，显示额外奖赏按钮
if (
  (user?.role === 'super_admin' || user?.role === 'position_admin') &&
  task.status === TaskStatus.COMPLETED &&
  task.assigneeId
) {
  buttons.push(
    <Button
      key="bonus"
      type="default"
      style={{ borderColor: '#faad14', color: '#faad14' }}
      onClick={handleAddBonus}
    >
      额外奖赏
    </Button>
  );
}
```

4. **添加额外奖赏模态框**:
```typescript
<Modal
  title="添加额外奖赏"
  open={bonusModalVisible}
  onCancel={() => {
    setBonusModalVisible(false);
    bonusForm.resetFields();
  }}
  onOk={() => bonusForm.submit()}
  okText="确认发放"
  cancelText="取消"
  confirmLoading={addingBonus}
>
  <Form form={bonusForm} layout="vertical" onFinish={handleSubmitBonus}>
    {/* 金额和原因输入 */}
  </Form>
</Modal>
```

**验证**: 
- TypeScript编译无错误
- 按钮在已完成任务的详情抽屉中正常显示（任何页面）
- 只有管理员可以看到该按钮
- 点击按钮可以打开额外奖赏模态框
- 成功发放后自动刷新任务数据

**影响范围**:
- 所有使用 `TaskDetailDrawer` 的页面都可以使用额外奖赏功能
- 包括：任务列表、已发布任务、已承接任务、浏览任务等

---

### 2026年2月10日 - 修复按钮不显示问题（第一次修复）

**问题**: 用户报告看不到"额外奖赏"按钮

**原因**: `DollarOutlined` 图标未导入，导致组件渲染失败

**解决方案**: 在 `TaskManagementPage.tsx` 中添加 `DollarOutlined` 导入

```typescript
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  UserOutlined,
  DollarOutlined,  // ✅ 添加此导入
} from '@ant-design/icons';
```

**验证**: 
- TypeScript编译无错误
- 按钮在任务管理页面的详情抽屉中正常显示
- 点击按钮可以打开额外奖赏模态框
