# 项目组折叠视图实现方案

## 概述

为甘特图、看板和日历视图添加项目组折叠功能，允许用户按项目组查看任务，并可以折叠/展开项目组以简化视图。

## 实现时间

2026-01-29

## 功能需求

### 核心功能
1. **项目组分组**: 将任务按项目组进行分组显示
2. **折叠/展开**: 点击项目组标题可以折叠或展开该项目组下的任务
3. **分组开关**: 提供开关控制是否启用项目组分组
4. **默认展开**: 初始状态下所有项目组默认展开

### 视觉设计
- **项目组标题**: 紫色背景，文件夹图标，显示任务数量
- **折叠状态**: 使用 ▶ 图标表示折叠，▼ 图标表示展开
- **任务缩进**: 在项目组下的任务适当缩进，表示层级关系

## 实现方案

### 1. 甘特图视图 (GanttChartPage)

#### 状态管理
```typescript
const [groupByProject, setGroupByProject] = useState(false);
const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
```

#### 显示项构建
```typescript
const getDisplayItems = (): Array<{ type: 'project' | 'task'; data: any; projectName?: string }> => {
  if (!groupByProject) {
    return tasks.map(task => ({ type: 'task', data: task }));
  }

  // Group tasks by project
  const grouped: Record<string, Task[]> = {};
  tasks.forEach(task => {
    const key = task.projectGroupName || '无项目组';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(task);
  });

  // Build display items with project headers
  const items = [];
  Object.entries(grouped).forEach(([projectName, projectTasks]) => {
    items.push({ type: 'project', data: { name: projectName, taskCount: projectTasks.length } });
    if (expandedProjects.has(projectName)) {
      projectTasks.forEach(task => {
        items.push({ type: 'task', data: task, projectName });
      });
    }
  });

  return items;
};
```

#### 渲染逻辑
- 项目组标题: 灰色背景条，可点击折叠/展开
- 任务条: 在项目组下缩进显示
- 时间轴: 保持统一的时间刻度

#### UI控制
- 添加 Switch 开关控制是否按项目组分组
- 位置: Card 的 extra 区域

### 2. 看板视图 (KanbanPage)

#### 实现方案
看板视图的实现更复杂，因为它是按状态列分组的。有两种实现方案：

**方案A: 在每个状态列内按项目组分组**
- 每个状态列内部显示项目组折叠面板
- 优点: 保持看板的状态列结构
- 缺点: 可能导致视觉混乱

**方案B: 项目组作为顶层分组，状态作为次级分组**
- 先按项目组分组，每个项目组内显示状态列
- 优点: 项目组结构清晰
- 缺点: 改变了看板的传统布局

**推荐方案: 方案A**

#### 状态管理
```typescript
const [groupByProject, setGroupByProject] = useState(false);
const [expandedProjects, setExpandedProjects] = useState<Record<TaskStatus, Set<string>>>({
  [TaskStatus.NOT_STARTED]: new Set(),
  [TaskStatus.AVAILABLE]: new Set(),
  [TaskStatus.IN_PROGRESS]: new Set(),
  [TaskStatus.COMPLETED]: new Set(),
  [TaskStatus.ABANDONED]: new Set(),
});
```

#### 渲染逻辑
```typescript
// 在每个状态列内
{groupByProject ? (
  // 按项目组分组显示
  Object.entries(groupTasksByProject(columnTasks)).map(([projectName, tasks]) => (
    <Collapse key={projectName}>
      <Panel header={`📁 ${projectName} (${tasks.length})`}>
        {tasks.map(task => renderTaskCard(task))}
      </Panel>
    </Collapse>
  ))
) : (
  // 直接显示任务
  columnTasks.map(task => renderTaskCard(task))
)}
```

### 3. 日历视图 (CalendarPage)

#### 实现方案
日历视图的项目组折叠可以通过以下方式实现：

**方案A: 筛选器方式**
- 添加项目组选择器
- 只显示选中项目组的任务
- 优点: 简单直观
- 缺点: 不是真正的折叠功能

**方案B: 事件颜色编码**
- 不同项目组使用不同颜色
- 添加图例和筛选器
- 优点: 视觉区分明显
- 缺点: 颜色数量有限

**方案C: 侧边栏项目组列表**
- 左侧显示项目组列表，带复选框
- 可以选择显示/隐藏特定项目组
- 优点: 灵活性高
- 缺点: 需要额外的UI空间

**推荐方案: 方案C (侧边栏 + 颜色编码)**

#### 状态管理
```typescript
const [visibleProjects, setVisibleProjects] = useState<Set<string>>(new Set());
const [projectColors, setProjectColors] = useState<Record<string, string>>({});
```

#### 渲染逻辑
```typescript
const convertTasksToEvents = (): CalendarEvent[] => {
  return tasks
    .filter(task => {
      if (visibleProjects.size === 0) return true;
      const projectName = task.projectGroupName || '无项目组';
      return visibleProjects.has(projectName);
    })
    .map(task => ({
      id: task.id,
      title: task.name,
      start: new Date(task.plannedStartDate),
      end: new Date(task.plannedEndDate),
      backgroundColor: projectColors[task.projectGroupName || '无项目组'] || getStatusColor(task.status),
      borderColor: projectColors[task.projectGroupName || '无项目组'] || getStatusColor(task.status),
      extendedProps: { task },
    }));
};
```

## 技术实现细节

### 项目组分组逻辑
```typescript
const groupTasksByProject = (tasks: Task[]): Record<string, Task[]> => {
  const grouped: Record<string, Task[]> = {};
  tasks.forEach(task => {
    const key = task.projectGroupName || '无项目组';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(task);
  });
  return grouped;
};
```

### 折叠状态管理
```typescript
const toggleProject = (projectName: string) => {
  const newExpanded = new Set(expandedProjects);
  if (newExpanded.has(projectName)) {
    newExpanded.delete(projectName);
  } else {
    newExpanded.add(projectName);
  }
  setExpandedProjects(newExpanded);
};
```

### 初始化展开状态
```typescript
useEffect(() => {
  if (groupByProject && tasks.length > 0) {
    const projectNames = new Set(tasks.map(t => t.projectGroupName || '无项目组'));
    setExpandedProjects(projectNames);
  }
}, [groupByProject, tasks]);
```

## UI/UX 设计

### 项目组标题样式
```css
.project-header {
  background-color: #fafafa;
  border: 1px solid #d9d9d9;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-header:hover {
  background-color: #f0f0f0;
}

.project-icon {
  color: #722ed1;
  font-size: 14px;
}

.project-name {
  font-weight: bold;
  color: #722ed1;
  font-size: 14px;
}

.project-count {
  color: #999;
  font-size: 12px;
}
```

### 任务缩进
- 甘特图: 任务名称左侧增加 2 个空格
- 看板: 使用 Collapse 组件自动处理
- 日历: 不需要缩进（使用筛选方式）

## 性能优化

### 1. 避免不必要的重渲染
```typescript
const displayItems = useMemo(() => getDisplayItems(), [tasks, groupByProject, expandedProjects]);
```

### 2. 虚拟滚动（可选）
对于大量任务的情况，可以考虑使用虚拟滚动：
- 甘特图: 只渲染可见区域的任务条
- 看板: 使用 react-window 或 react-virtualized
- 日历: FullCalendar 已内置优化

### 3. 防抖处理
```typescript
const debouncedToggle = useMemo(
  () => debounce(toggleProject, 100),
  [toggleProject]
);
```

## 测试要点

### 功能测试
- [ ] 项目组分组开关正常工作
- [ ] 点击项目组标题可以折叠/展开
- [ ] 折叠状态图标正确显示（▶/▼）
- [ ] 任务数量统计正确
- [ ] 无项目组的任务正常显示
- [ ] 切换分组模式时状态正确重置

### 交互测试
- [ ] 折叠/展开动画流畅
- [ ] 鼠标悬停效果正常
- [ ] 点击任务可以查看详情
- [ ] 拖拽功能不受影响（看板）

### 边界情况
- [ ] 所有任务都属于同一项目组
- [ ] 所有任务都没有项目组
- [ ] 项目组名称很长的情况
- [ ] 任务数量很多的情况（性能）

## 已完成的实现

### ✅ 甘特图视图 (GanttChartPage)
- 添加了项目组分组开关
- 实现了项目组折叠/展开功能
- 项目组标题显示任务数量
- 任务在项目组下缩进显示
- 默认所有项目组展开

## 待实现

### 🔄 看板视图 (KanbanPage)
- 需要在每个状态列内添加项目组折叠面板
- 实现方案A: 状态列内按项目组分组

### 🔄 日历视图 (CalendarPage)
- 需要添加项目组筛选器
- 实现方案C: 侧边栏 + 颜色编码

## 相关文档

- [项目组功能分析](./PROJECT_GROUP_FEATURE_ANALYSIS.md)
- [项目组功能实现](./PROJECT_GROUP_FEATURE_IMPLEMENTATION.md)
- [项目组显示修复](./PROJECT_GROUP_DISPLAY_FIX.md)
- [项目组功能测试指南](./TESTING_PROJECT_GROUP_FEATURES.md)
