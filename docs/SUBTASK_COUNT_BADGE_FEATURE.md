# 任务子任务数量标记功能

## 概述
为任务列表中有子任务的任务添加数量徽章，显示具体的子任务数量，让用户一眼就能了解任务的复杂度和结构。

## 功能描述

### 标记显示
在任务列表的任务名称旁边，为有子任务的任务添加一个绿色数字徽章，显示子任务的具体数量。

### 计算逻辑
通过遍历任务列表，统计 `parentId` 等于当前任务 ID 的任务数量：

```typescript
const getSubtaskCount = (taskId: string): number => {
  return tasks.filter(t => t.parentId === taskId).length;
};
```

### 显示规则
- 如果任务有子任务（count > 0），显示绿色数字徽章
- 如果任务没有子任务（count = 0），不显示徽章
- 鼠标悬停在徽章上时，显示提示文字"X个子任务"

## 实现细节

### 1. TaskListPage 修改
在任务名称列的渲染函数中添加子任务数量计算和显示：

```typescript
// 添加子任务计数函数
const getSubtaskCount = (taskId: string): number => {
  return tasks.filter(t => t.parentId === taskId).length;
};

// 在渲染函数中使用
render: (text: string, record: Task) => {
  const isPendingAcceptance = record.status === TaskStatus.PENDING_ACCEPTANCE;
  const subtaskCount = getSubtaskCount(record.id);
  
  return (
    <div onClick={() => handleViewTask(record)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {isPendingAcceptance && <ClockCircleOutlined />}
        {text}
        {subtaskCount > 0 && (
          <Badge 
            count={subtaskCount} 
            style={{ backgroundColor: '#52c41a' }} 
            title={`${subtaskCount}个子任务`}
          />
        )}
      </div>
      {/* 任务描述 */}
    </div>
  );
},
```

### 2. AssignedTasksPage 修改
在任务名称列的渲染函数中添加相同的子任务数量显示逻辑：

```typescript
// 添加子任务计数函数
const getSubtaskCount = (taskId: string): number => {
  return tasks.filter(t => t.parentId === taskId).length;
};

// 在渲染函数中使用
render: (name: string, record: Task) => {
  const subtaskCount = getSubtaskCount(record.id);
  
  return (
    <Space>
      <Button type="link" onClick={() => handleViewTaskDetail(record)}>
        {name}
      </Button>
      {subtaskCount > 0 && (
        <Badge 
          count={subtaskCount} 
          style={{ backgroundColor: '#52c41a' }} 
          title={`${subtaskCount}个子任务`}
        />
      )}
      {record.groupName && (
        <Tag color="geekblue" icon={<TeamOutlined />}>
          {record.groupName}
        </Tag>
      )}
    </Space>
  );
},
```

### 3. 影响范围
- ✅ **TaskListPage** - 通用任务列表页面
- ✅ **AssignedTasksPage** - 我的任务页面
- ✅ **GroupsPage** - 组群页面（通过 TaskListPage 自动继承）
- ✅ **PublishedTasksPage** - 我的悬赏页面（通过 TaskListPage 自动继承）

## 视觉设计

### 徽章样式
- **背景色**: `#52c41a` (绿色)
- **显示内容**: 数字（子任务数量）
- **悬停提示**: "X个子任务"
- **样式**: Ant Design Badge 组件默认样式

### 位置
徽章显示在任务名称的右侧，与任务名称在同一行，使用 `flex` 布局对齐。

### 示例
```
┌─────────────────────────────────────────┐
│ 任务名称                                │
├─────────────────────────────────────────┤
│ 📋 开发用户认证模块 [3]                 │
│ 📋 修复登录bug                          │
│ 📋 实现数据导出功能 [5]                 │
└─────────────────────────────────────────┘
```

其中 `[3]` 和 `[5]` 表示该任务有 3 个和 5 个子任务。

## 用户体验提升

### 1. 精确信息
用户可以直接看到每个任务有多少个子任务，无需点击进入详情。

### 2. 任务复杂度评估
通过子任务数量，用户可以快速评估任务的复杂度和工作量。

### 3. 工作流程优化
- 项目经理可以快速识别需要关注的复杂任务
- 开发人员可以根据子任务数量规划工作时间
- 团队可以更好地分配资源和优先级

### 4. 数据可视化
数字徽章提供了直观的视觉反馈，比文字描述更简洁明了。

## 技术实现

### 判断逻辑说明
```typescript
const getSubtaskCount = (taskId: string): number => {
  return tasks.filter(t => t.parentId === taskId).length;
};
```

**为什么使用这个逻辑？**

1. **精确计数**: 直接统计 `parentId` 等于当前任务 ID 的任务数量
   - 准确反映实际的子任务数量
   - 不依赖于 `isExecutable` 等间接标志

2. **实时更新**: 基于当前任务列表计算
   - 子任务增加或删除时，数量自动更新
   - 无需额外的数据同步

3. **简单高效**: 使用数组 filter 方法
   - 代码简洁易懂
   - 性能开销小（任务列表通常不会太大）

### 数据来源
- `parentId` 字段：来自数据库 `tasks` 表的 `parent_id` 列
- 通过 API 获取任务列表时，每个任务都包含 `parentId` 字段
- **重要**：API 返回所有任务（包括子任务），前端在显示时过滤只显示顶层任务
- 前端在渲染时实时计算子任务数量

### 前端过滤逻辑
为了正确显示子任务数量，前端需要：
1. 从 API 获取所有任务（包括子任务）
2. 在显示列表时，只显示顶层任务（`parentId === null`）
3. 使用完整的任务列表来计算每个顶层任务的子任务数量

```typescript
const applyFilters = () => {
  let filtered = [...tasks];

  // 只显示顶层任务（parentId 为 null 的任务）
  filtered = filtered.filter(task => task.parentId === null);

  // ... 其他过滤逻辑
};
```

### 后端 API 修改
修改了以下 API 端点，使其返回所有任务（包括子任务）：
- `GET /api/tasks/user/published` - 将 `onlyTopLevel` 参数从 `true` 改为 `false`
- `GET /api/tasks/user/assigned` - 将 `onlyTopLevel` 参数从 `true` 改为 `false`

这样前端可以获取完整的任务数据，用于计算子任务数量。

## 后续优化建议

### 1. 显示子任务数量
当前只显示"有子任务"，可以改为显示具体数量，如"3个子任务"。

**实现方案**:
- 后端在查询任务时，添加子任务数量的计算
- 修改 SQL 查询，添加子查询统计子任务数量
- 前端显示具体数量

**SQL 示例**:
```sql
SELECT 
  t.*,
  (SELECT COUNT(*) FROM tasks WHERE parent_id = t.id) as subtask_count
FROM tasks t
WHERE ...
```

### 2. 子任务进度汇总
显示子任务的整体完成进度，如"3/5 已完成"。

**实现方案**:
- 后端计算子任务的完成数量和总数量
- 前端显示进度条或分数形式

### 3. 交互优化
- 点击徽章直接展开子任务列表
- 悬停显示子任务的简要信息
- 支持在列表中直接展开/折叠子任务

### 4. 颜色编码
根据子任务的状态使用不同颜色：
- 绿色：所有子任务已完成
- 黄色：部分子任务进行中
- 灰色：所有子任务未开始

## 测试建议

### 1. 基本功能测试
- 创建一个顶层任务，不添加子任务，验证不显示徽章
- 为顶层任务添加子任务，验证显示"有子任务"徽章
- 查看子任务列表，验证子任务不显示徽章

### 2. 边界情况测试
- 任务有子任务但子任务被删除，验证徽章消失
- 任务从有子任务变为无子任务，验证徽章更新
- 多层级任务（虽然系统限制为2层），验证只有顶层显示

### 3. 视觉测试
- 验证徽章样式在不同浏览器中的显示
- 验证徽章与其他标签（群组、待接受等）的布局
- 验证长任务名称时徽章的位置

### 4. 性能测试
- 大量任务列表时的渲染性能
- 徽章显示不应影响列表滚动流畅度

## 相关文档
- [子任务功能文档](./SUBTASK_DEPTH_LIMIT_AND_UI_IMPROVEMENTS.md)
- [子任务多视图功能](./SUBTASK_VIEWS_IMPLEMENTATION.md)
- [任务详情抽屉](./SUBTASK_DETAIL_VIEW_FULL_DRAWER.md)

## 实现日期
2026-02-04

## 状态
✅ 已完成并测试
