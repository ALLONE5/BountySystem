# 任务状态筛选添加"待接受"选项

## 修改日期
2026年2月10日

## 问题描述
在任务列表页面的状态筛选下拉框中，缺少"待接受"（pending_acceptance）状态选项，导致用户无法筛选出处于待接受状态的任务。

## 问题截图分析
从用户提供的截图可以看到：
- 状态筛选下拉框显示的选项：所有状态、未开始、可接受、进行中、已完成
- 缺少"待接受"选项
- 但任务列表中确实存在"待接受"状态的任务（黄色高亮显示）

## 根本原因
TaskListPage组件中有两个状态筛选Select组件（用于不同的视图模式），其中第二个Select缺少"待接受"选项。

### 问题代码位置
**文件**: `packages/frontend/src/pages/TaskListPage.tsx`

**第一个Select** (第684-695行) - ✅ 正确包含所有状态:
```typescript
<Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
  <Option value="all">所有状态</Option>
  <Option value={TaskStatus.NOT_STARTED}>未开始</Option>
  <Option value={TaskStatus.AVAILABLE}>可承接</Option>
  <Option value={TaskStatus.PENDING_ACCEPTANCE}>待接受</Option>  // ✅ 有这个选项
  <Option value={TaskStatus.IN_PROGRESS}>进行中</Option>
  <Option value={TaskStatus.COMPLETED}>已完成</Option>
</Select>
```

**第二个Select** (第822-831行) - ❌ 缺少"待接受"选项:
```typescript
<Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
  <Option value="all">所有状态</Option>
  <Option value={TaskStatus.NOT_STARTED}>未开始</Option>
  <Option value={TaskStatus.AVAILABLE}>可承接</Option>
  // ❌ 缺少 PENDING_ACCEPTANCE 选项
  <Option value={TaskStatus.IN_PROGRESS}>进行中</Option>
  <Option value={TaskStatus.COMPLETED}>已完成</Option>
</Select>
```

## 解决方案
在第二个Select组件中添加"待接受"选项，使其与第一个Select保持一致。

### 修改内容
**文件**: `packages/frontend/src/pages/TaskListPage.tsx` (第822-832行)

**修改后**:
```typescript
<Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
  <Option value="all">所有状态</Option>
  <Option value={TaskStatus.NOT_STARTED}>未开始</Option>
  <Option value={TaskStatus.AVAILABLE}>可承接</Option>
  <Option value={TaskStatus.PENDING_ACCEPTANCE}>待接受</Option>  // ✅ 新增
  <Option value={TaskStatus.IN_PROGRESS}>进行中</Option>
  <Option value={TaskStatus.COMPLETED}>已完成</Option>
</Select>
```

## 任务状态说明

### 完整的任务状态列表
根据 `packages/frontend/src/types/index.ts` 和 `packages/frontend/src/utils/statusConfig.ts`:

| 状态值 | 显示文本 | 颜色 | 说明 |
|--------|---------|------|------|
| `NOT_STARTED` | 未开始 | default (灰色) | 任务已创建但未开始 |
| `AVAILABLE` | 可承接 | success (绿色) | 任务已发布，可供其他用户承接 |
| `PENDING_ACCEPTANCE` | 待接受 | orange (橙色) | 任务已被指派或邀请，等待接受者确认 |
| `IN_PROGRESS` | 进行中 | processing (蓝色) | 任务正在执行中 |
| `COMPLETED` | 已完成 | success (绿色) | 任务已完成 |

### "待接受"状态的使用场景
1. **任务指派**: 发布者直接指派任务给特定用户，任务进入"待接受"状态
2. **任务邀请**: 发布者邀请用户承接任务，被邀请用户看到的任务处于"待接受"状态
3. **组群任务**: 组群成员被分配任务后，任务处于"待接受"状态，等待成员确认

## 两个Select组件的用途

### 为什么有两个Select？
TaskListPage支持两种视图模式：
1. **普通列表视图**: 使用第一个Select（第684行）
2. **按项目组分组视图**: 使用第二个Select（第822行）

两个Select应该提供相同的筛选选项，以保持用户体验的一致性。

## 测试建议

### 功能测试
1. 创建一个任务并指派给特定用户
2. 以被指派用户身份登录
3. 进入任务列表页面
4. 验证状态筛选下拉框包含"待接受"选项
5. 选择"待接受"筛选，验证只显示待接受状态的任务
6. 切换到"按项目组分组"视图
7. 验证状态筛选下拉框仍然包含"待接受"选项
8. 选择"待接受"筛选，验证过滤功能正常

### 边界测试
1. 没有待接受任务时，选择"待接受"筛选应显示空列表
2. 有多个不同状态的任务时，筛选应正确工作
3. 在两种视图模式之间切换时，筛选状态应保持

### 视觉验证
- "待接受"选项应显示为橙色标签
- 下拉框中的选项顺序应与其他页面保持一致
- 选项文本应清晰易读

## 相关文件
- `packages/frontend/src/pages/TaskListPage.tsx` - 任务列表页面（主要修改）
- `packages/frontend/src/utils/statusConfig.ts` - 状态配置
- `packages/frontend/src/types/index.ts` - 类型定义

## 注意事项
1. 两个Select组件应始终保持选项一致
2. 如果将来添加新的任务状态，需要同时更新两个Select
3. 状态的显示文本和颜色应与statusConfig.ts保持一致

## 后续优化建议

### 1. 提取状态选项为常量
避免重复代码，将状态选项提取为可复用的常量：

```typescript
// 在文件顶部定义
const STATUS_OPTIONS = [
  { value: 'all', label: '所有状态' },
  { value: TaskStatus.NOT_STARTED, label: '未开始' },
  { value: TaskStatus.AVAILABLE, label: '可承接' },
  { value: TaskStatus.PENDING_ACCEPTANCE, label: '待接受' },
  { value: TaskStatus.IN_PROGRESS, label: '进行中' },
  { value: TaskStatus.COMPLETED, label: '已完成' },
];

// 在Select中使用
<Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
  {STATUS_OPTIONS.map(option => (
    <Option key={option.value} value={option.value}>
      {option.label}
    </Option>
  ))}
</Select>
```

### 2. 使用statusConfig动态生成选项
从statusConfig自动生成选项，确保一致性：

```typescript
import { getTaskStatusConfig } from '../utils/statusConfig';

const STATUS_OPTIONS = [
  { value: 'all', label: '所有状态' },
  ...Object.values(TaskStatus).map(status => ({
    value: status,
    label: getTaskStatusConfig(status).text,
  })),
];
```

### 3. 创建可复用的StatusFilter组件
将状态筛选逻辑封装为独立组件：

```typescript
// components/StatusFilter.tsx
export const StatusFilter: React.FC<{
  value: TaskStatus | 'all';
  onChange: (value: TaskStatus | 'all') => void;
}> = ({ value, onChange }) => {
  return (
    <Select value={value} onChange={onChange} style={{ width: 120 }}>
      {STATUS_OPTIONS.map(option => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
  );
};
```

这样可以确保所有使用状态筛选的地方都保持一致，并且更容易维护。
