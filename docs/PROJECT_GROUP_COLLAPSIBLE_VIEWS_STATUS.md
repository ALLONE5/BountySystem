# 项目组折叠视图实现状态

## 实现时间
2026-01-29

## 当前状态

### ✅ 已完成: 甘特图视图 (GanttChartPage)

**实现功能:**
1. ✅ 添加"按项目组分组"开关
2. ✅ 项目组标题显示（紫色，文件夹图标，任务数量）
3. ✅ 点击项目组标题折叠/展开
4. ✅ 折叠状态图标（▶ 折叠 / ▼ 展开）
5. ✅ 任务在项目组下缩进显示
6. ✅ 默认所有项目组展开
7. ✅ 无项目组的任务正常显示
8. ✅ 控制按钮在Card标题栏显示（修复了在TaskVisualizationPage中不可见的问题）

**技术实现:**
- 使用 D3.js 重新渲染甘特图
- 动态计算显示项（项目组标题 + 任务）
- 使用 Set 管理展开状态
- 响应式高度计算
- 控制按钮放在Card的extra属性中，确保在任何布局下都可见

**使用方法:**
1. 打开甘特图视图页面（可通过"我的任务"页面的甘特图标签访问）
2. 在Card标题栏右侧找到"按项目组分组"开关
3. 点击开关启用项目组分组
4. 点击项目组标题（如"📁 电商平台开发 (6)"）折叠或展开
5. 点击任务名称查看详情

**最近修复 (2026-01-30):**
- 将控制按钮从Card外部移到Card的extra属性中
- 解决了在TaskVisualizationPage包装时控制按钮不可见的问题
- 控制按钮现在始终显示在Card标题栏的右侧

### 🔄 待实现: 看板视图 (KanbanPage)

**推荐实现方案:**
在每个状态列内添加项目组折叠面板（Ant Design Collapse组件）

**实现步骤:**
1. 添加 `groupByProject` 状态
2. 在每个状态列内按项目组分组任务
3. 使用 Collapse 组件显示项目组
4. 保持拖拽功能正常工作

**预期效果:**
```
┌─────────────────────────────┐
│ 进行中 (9)                   │
├─────────────────────────────┤
│ ▼ 📁 电商平台开发 (2)        │
│   ├─ 用户认证系统开发        │
│   └─ 商品管理模块            │
│ ▼ 📁 企业管理系统 (1)        │
│   └─ 员工信息管理            │
│ ▼ 📁 无项目组 (1)            │
│   └─ 网站性能优化            │
└─────────────────────────────┘
```

**代码示例:**
```typescript
// 在每个状态列的 Droppable 内
{groupByProject ? (
  Object.entries(groupTasksByProject(columnTasks)).map(([projectName, tasks]) => (
    <Collapse
      key={projectName}
      defaultActiveKey={[projectName]}
      style={{ marginBottom: 12 }}
    >
      <Panel
        header={
          <Space>
            <FolderOutlined style={{ color: '#722ed1' }} />
            <span style={{ fontWeight: 600 }}>{projectName}</span>
            <Badge count={tasks.length} style={{ backgroundColor: '#722ed1' }} />
          </Space>
        }
        key={projectName}
      >
        {tasks.map((task, index) => (
          <Draggable key={task.id} draggableId={task.id} index={index}>
            {/* 任务卡片 */}
          </Draggable>
        ))}
      </Panel>
    </Collapse>
  ))
) : (
  columnTasks.map((task, index) => (
    <Draggable key={task.id} draggableId={task.id} index={index}>
      {/* 任务卡片 */}
    </Draggable>
  ))
)}
```

### ✅ 已完成: 日历视图 (CalendarPage)

**实现功能:**
1. ✅ 添加"按项目组分组"开关
2. ✅ 项目组汇总事件显示（紫色，文件夹图标，任务数量）
3. ✅ 点击项目组事件折叠/展开
4. ✅ 子任务事件缩进显示
5. ✅ 默认所有项目组展开
6. ✅ 无项目组的任务正常显示
7. ✅ 代码通过 TypeScript 编译检查
8. ✅ 前端热重载已应用更新

**技术实现:**
- 使用 FullCalendar 渲染日历视图
- 项目组显示为紫色汇总事件
- 时间跨度自动计算（最早开始到最晚结束）
- 使用 Set 管理展开状态
- 点击项目组事件切换展开/折叠
- 点击子任务事件显示详情

**使用方法:**
1. 打开日历视图页面（可通过"我的任务"页面的日历标签访问）
2. 在页面头部找到"按项目组分组"开关
3. 点击开关启用项目组分组
4. 点击紫色的项目组事件折叠或展开
5. 点击子任务事件查看详情

**实现时间:** 2026-01-30

**验证文档:** `docs/PROJECT_GROUP_CALENDAR_VIEW_VERIFICATION.md`

## 用户使用指南

### 甘特图视图使用

1. **启用项目组分组:**
   - 打开甘特图视图
   - 点击右上角的"按项目组分组"开关

2. **折叠/展开项目组:**
   - 点击项目组标题行（如"▼ 📁 电商平台开发 (6)"）
   - ▼ 表示展开状态，点击后折叠
   - ▶ 表示折叠状态，点击后展开

3. **查看任务详情:**
   - 点击任务名称（蓝色文字）
   - 或点击任务条形图

4. **关闭项目组分组:**
   - 再次点击"按项目组分组"开关
   - 恢复到普通的任务列表视图

### 测试数据

使用以下测试账号查看效果：
- **developer1** / Password123 - 有4个任务，分布在3个项目组
- **developer2** / Password123 - 有5个任务，分布在4个项目组
- **admin** / Password123 - 发布了多个任务，涵盖所有项目组

## 技术细节

### 状态管理
```typescript
// 是否按项目组分组
const [groupByProject, setGroupByProject] = useState(false);

// 展开的项目组集合
const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
```

### 显示项构建
```typescript
interface DisplayItem {
  type: 'project' | 'task';
  data: any;
  projectName?: string;
}

const getDisplayItems = (): DisplayItem[] => {
  if (!groupByProject) {
    // 不分组：直接返回所有任务
    return tasks.map(task => ({ type: 'task', data: task }));
  }

  // 分组：构建项目组 + 任务的层级结构
  const grouped = groupTasksByProject(tasks);
  const items: DisplayItem[] = [];
  
  Object.entries(grouped).forEach(([projectName, projectTasks]) => {
    // 添加项目组标题
    items.push({
      type: 'project',
      data: { name: projectName, taskCount: projectTasks.length }
    });
    
    // 如果展开，添加任务
    if (expandedProjects.has(projectName)) {
      projectTasks.forEach(task => {
        items.push({ type: 'task', data: task, projectName });
      });
    }
  });
  
  return items;
};
```

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

### 折叠切换
```typescript
const toggleProject = (projectName: string) => {
  const newExpanded = new Set(expandedProjects);
  if (newExpanded.has(projectName)) {
    newExpanded.delete(projectName);  // 折叠
  } else {
    newExpanded.add(projectName);     // 展开
  }
  setExpandedProjects(newExpanded);
};
```

## 性能考虑

### 甘特图
- ✅ 使用 D3.js 高效渲染
- ✅ 只渲染可见的项目组和任务
- ✅ 折叠时不渲染隐藏的任务
- ⚠️ 大量任务时可能需要虚拟滚动

### 看板
- 需要考虑拖拽性能
- Collapse 组件可能影响拖拽体验
- 建议限制每个状态列的任务数量

### 日历
- FullCalendar 已内置性能优化
- 筛选器可以减少渲染的事件数量
- 颜色编码不影响性能

## 后续优化建议

### 1. 持久化展开状态
将展开状态保存到 localStorage，下次访问时恢复：
```typescript
useEffect(() => {
  const saved = localStorage.getItem('gantt-expanded-projects');
  if (saved) {
    setExpandedProjects(new Set(JSON.parse(saved)));
  }
}, []);

useEffect(() => {
  localStorage.setItem('gantt-expanded-projects', JSON.stringify(Array.from(expandedProjects)));
}, [expandedProjects]);
```

### 2. 全部展开/折叠按钮
添加快捷按钮一键展开或折叠所有项目组：
```typescript
<Button onClick={() => setExpandedProjects(new Set(allProjectNames))}>
  全部展开
</Button>
<Button onClick={() => setExpandedProjects(new Set())}>
  全部折叠
</Button>
```

### 3. 项目组统计信息
在项目组标题显示更多统计信息：
- 进行中任务数
- 已完成任务数
- 总悬赏金额
- 完成百分比

### 4. 搜索和筛选
添加搜索框，支持按项目组名称或任务名称搜索：
```typescript
const filteredItems = displayItems.filter(item => {
  if (item.type === 'project') {
    return item.data.name.includes(searchKeyword);
  } else {
    return item.data.name.includes(searchKeyword);
  }
});
```

## 相关文档

- [项目组折叠视图实现方案](./PROJECT_GROUP_COLLAPSIBLE_VIEWS_IMPLEMENTATION.md)
- [项目组功能实现](./PROJECT_GROUP_FEATURE_IMPLEMENTATION.md)
- [项目组显示修复](./PROJECT_GROUP_DISPLAY_FIX.md)
- [项目组功能测试指南](./TESTING_PROJECT_GROUP_FEATURES.md)
