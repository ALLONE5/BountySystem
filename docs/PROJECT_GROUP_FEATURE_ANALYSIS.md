# 项目分组功能分析报告

## 检查日期
2026-01-29

## 功能需求
检查系统是否满足以下功能：
1. 如果 task 属于某 project，则在赏金任务和各视图界面中进行显示
2. 属于同一个 project 的 task 可以进行折叠，按 project 进行显示

---

## 检查结果总结

### ✅ 已实现的功能

1. **数据模型支持** ✅
   - Task 模型包含 `projectGroupId` 和 `projectGroupName` 字段
   - ProjectGroup 模型完整定义
   - 数据库表结构支持项目分组

2. **后端 API 支持** ✅
   - ProjectGroupService 提供完整的 CRUD 操作
   - 支持获取项目组的任务列表
   - 支持项目组统计信息
   - TaskMapper 正确映射项目组信息

3. **前端部分支持** ⚠️
   - **浏览任务页面 (BrowseTasksPage)**: ✅ 完全支持
     - 支持按项目分组显示
     - 显示项目标签
     - 支持折叠/展开分组
   - **我的任务页面 (AssignedTasksPage)**: ❌ 不支持
   - **我的悬赏页面 (PublishedTasksPage)**: ❌ 不支持

---

## 详细分析

### 1. 数据模型层 ✅

#### Task 模型
```typescript
// packages/backend/src/models/Task.ts
export interface Task {
  // ... 其他字段
  projectGroupId?: string | null;
  projectGroupName?: string;
  // ...
}
```

#### ProjectGroup 模型
```typescript
// packages/backend/src/models/ProjectGroup.ts
export interface ProjectGroup {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectGroupWithTasks extends ProjectGroup {
  taskCount: number;
  completedTaskCount: number;
  totalBounty: number;
  tasks?: Task[];
}
```

**评估**: ✅ 数据模型完整，支持项目分组功能

---

### 2. 后端服务层 ✅

#### ProjectGroupService 功能
- `getAllProjectGroups()`: 获取所有项目组
- `getProjectGroupById(id)`: 获取单个项目组
- `getProjectGroupWithTasks(id)`: 获取项目组及其任务
- `getProjectGroupStats(id)`: 获取项目组统计信息
- `createProjectGroup(data)`: 创建项目组
- `updateProjectGroup(id, data)`: 更新项目组
- `deleteProjectGroup(id)`: 删除项目组
- `getTasksByProjectGroup(projectGroupId)`: 获取项目组的所有任务

#### TaskMapper 支持
```typescript
// packages/backend/src/utils/mappers/TaskMapper.ts
static toDTO(task: any): any {
  return {
    // ...
    projectGroupId: task.projectGroupId ?? task.project_group_id ?? null,
    projectGroupName: task.projectGroupName ?? task.project_group_name ?? undefined,
    // ...
  };
}
```

**评估**: ✅ 后端服务完整，API 支持项目分组

---

### 3. 前端展示层 ⚠️

#### 3.1 浏览任务页面 (BrowseTasksPage) ✅

**支持的功能**:
1. ✅ 按项目分组显示任务
   ```typescript
   const [groupBy, setGroupBy] = useState<'none' | 'position' | 'tag' | 'complexity' | 'group' | 'projectGroup'>('none');
   ```

2. ✅ 显示项目标签
   ```typescript
   const isProjectTask = !!task.projectGroupName;
   {isProjectTask && (
     <Tag color="purple">{task.projectGroupName}</Tag>
   )}
   ```

3. ✅ 分组折叠功能
   ```typescript
   case 'projectGroup':
     key = task.projectGroupName || '无项目组';
     break;
   ```

**界面效果**:
- 任务卡片左侧有紫色边框标识项目任务
- 显示紫色的项目组标签
- 支持按项目组分组和折叠显示

---

#### 3.2 我的任务页面 (AssignedTasksPage) ❌

**当前状态**: 不支持项目分组显示

**缺失功能**:
- ❌ 没有项目组信息显示
- ❌ 没有按项目分组选项
- ❌ 没有项目标签显示

**表格列定义**:
```typescript
const columns: ColumnsType<Task> = [
  { title: '任务名称', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '悬赏', dataIndex: 'bountyAmount', key: 'bountyAmount' },
  { title: '进度', dataIndex: 'progress', key: 'progress' },
  // 缺少项目组列
];
```

---

#### 3.3 我的悬赏页面 (PublishedTasksPage) ❌

**当前状态**: 不支持项目分组显示

**缺失功能**:
- ❌ 没有项目组信息显示
- ❌ 没有按项目分组选项
- ❌ 没有项目标签显示

---

## 功能完整度评分

| 功能模块 | 完整度 | 说明 |
|---------|--------|------|
| 数据模型 | 100% | ✅ 完全支持 |
| 后端 API | 100% | ✅ 完全支持 |
| 浏览任务页面 | 100% | ✅ 完全支持项目分组和折叠 |
| 我的任务页面 | 0% | ❌ 不支持项目分组显示 |
| 我的悬赏页面 | 0% | ❌ 不支持项目分组显示 |
| **总体完整度** | **60%** | ⚠️ 部分支持 |

---

## 需要改进的地方

### 1. 我的任务页面 (AssignedTasksPage)

#### 需要添加的功能:

1. **显示项目组信息**
   - 在表格中添加"项目组"列
   - 在任务卡片中显示项目标签

2. **支持按项目分组**
   - 添加分组选择器
   - 实现分组折叠功能

3. **视觉标识**
   - 为项目任务添加特殊标识（如边框颜色）
   - 使用图标区分项目任务

#### 建议实现代码:

```typescript
// 添加分组状态
const [groupBy, setGroupBy] = useState<'none' | 'projectGroup'>('none');

// 添加项目组列
const columns: ColumnsType<Task> = [
  // ... 现有列
  {
    title: '项目组',
    dataIndex: 'projectGroupName',
    key: 'projectGroupName',
    render: (name: string) => name ? (
      <Tag color="purple" icon={<GroupOutlined />}>{name}</Tag>
    ) : <Text type="secondary">无</Text>,
  },
  // ...
];

// 添加分组选择器
<Select
  value={groupBy}
  onChange={setGroupBy}
  style={{ width: 150 }}
>
  <Option value="none">不分组</Option>
  <Option value="projectGroup">按项目分组</Option>
</Select>
```

---

### 2. 我的悬赏页面 (PublishedTasksPage)

#### 需要添加的功能:

与"我的任务页面"相同，需要：
1. 显示项目组信息
2. 支持按项目分组
3. 添加视觉标识

---

## 实现优先级

### 高优先级 🔴
1. **我的任务页面添加项目组显示**
   - 影响用户体验
   - 数据已经存在，只需前端展示

2. **我的悬赏页面添加项目组显示**
   - 帮助发布者管理项目任务
   - 提高任务组织效率

### 中优先级 🟡
3. **添加项目组管理页面**
   - 创建、编辑、删除项目组
   - 查看项目组统计信息

4. **任务创建时选择项目组**
   - 在创建任务时可以选择所属项目组
   - 批量分配任务到项目组

### 低优先级 🟢
5. **项目组仪表板**
   - 项目进度可视化
   - 项目成员协作视图

---

## 技术债务

1. **API 一致性**: 确保所有任务查询 API 都返回项目组信息
2. **类型定义**: 前端 Task 类型需要包含 `projectGroupName` 字段
3. **测试覆盖**: 需要添加项目分组功能的单元测试和集成测试

---

## 建议的实现步骤

### 第一阶段：完善现有页面
1. 修改 AssignedTasksPage，添加项目组显示和分组功能
2. 修改 PublishedTasksPage，添加项目组显示和分组功能
3. 确保所有 API 调用返回项目组信息

### 第二阶段：增强功能
1. 添加项目组管理页面
2. 在任务创建/编辑表单中添加项目组选择
3. 添加项目组筛选功能

### 第三阶段：优化体验
1. 添加项目组仪表板
2. 实现项目进度追踪
3. 添加项目成员协作功能

---

## 结论

**当前状态**: 系统已经具备项目分组的基础架构（数据模型、后端 API），并且在"浏览任务"页面已经完整实现了项目分组显示和折叠功能。

**主要问题**: "我的任务"和"我的悬赏"页面尚未实现项目分组显示功能。

**建议**: 优先完善"我的任务"和"我的悬赏"页面的项目分组显示功能，以保持用户体验的一致性。实现难度较低，因为后端支持已经完备，只需要前端展示层的改进。

**预估工作量**: 
- 我的任务页面改进: 2-3 小时
- 我的悬赏页面改进: 2-3 小时
- 测试和优化: 1-2 小时
- **总计**: 5-8 小时

---

## 更新日志

- 2026-01-29: 创建初始分析报告
