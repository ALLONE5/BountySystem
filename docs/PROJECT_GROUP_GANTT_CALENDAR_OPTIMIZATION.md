# 甘特图和日历视图项目组分组优化

## 优化时间
2026-01-30

## 优化内容

### 甘特图视图优化

**之前的问题：**
- 项目组显示为单独的标题栏，占用整行
- 项目组和任务分离显示，不在同一时间轴上
- 无法直观比较项目组和单个任务的时间跨度

**优化后：**
1. **项目组显示为汇总任务条**
   - 项目组不再是单独的标题栏，而是显示为紫色的任务条
   - 任务条显示在时间轴上，与其他任务在同一视图中

2. **自动计算时间跨度**
   - 项目组的开始时间 = 所有子任务的最早开始时间
   - 项目组的结束时间 = 所有子任务的最晚结束时间
   - 自动计算并显示平均进度

3. **折叠/展开功能**
   - 折叠时：只显示项目组汇总条
   - 展开时：显示项目组条 + 所有子任务（子任务有缩进）
   - 点击项目组条可以切换折叠/展开状态

4. **视觉设计**
   - 项目组条：紫色（#722ed1），与项目组标签颜色一致
   - 子任务：根据状态显示不同颜色，有缩进（4个空格）
   - 展开/折叠图标：▶（折叠）/ ▼（展开）

### 日历视图优化

**新增功能：**
1. **项目组分组开关**
   - 在页面头部添加"按项目组分组"开关
   - 与甘特图保持一致的交互方式

2. **项目组汇总事件**
   - 折叠时：只显示项目组汇总事件（紫色）
   - 汇总事件显示项目名称和任务数量
   - 时间跨度覆盖所有子任务

3. **展开/折叠交互**
   - 点击项目组事件：切换展开/折叠状态
   - 点击子任务事件：显示任务详情
   - 展开时：显示项目组事件 + 所有子任务事件

4. **视觉一致性**
   - 项目组事件：紫色背景
   - 子任务事件：根据状态显示颜色
   - 子任务标题有缩进（2个空格）

## 技术实现

### 状态管理
```typescript
const [groupByProject, setGroupByProject] = useState(false);
const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
```

### 项目组数据计算
```typescript
// 按项目组分组任务
const grouped: Record<string, Task[]> = {};
tasks.forEach(task => {
  const key = task.projectGroupName || '无项目组';
  if (!grouped[key]) {
    grouped[key] = [];
  }
  grouped[key].push(task);
});

// 计算项目组汇总数据
Object.entries(grouped).forEach(([projectName, projectTasks]) => {
  const projectStart = new Date(Math.min(...projectTasks.map(t => new Date(t.plannedStartDate).getTime())));
  const projectEnd = new Date(Math.max(...projectTasks.map(t => new Date(t.plannedEndDate).getTime())));
  const avgProgress = Math.round(projectTasks.reduce((sum, t) => sum + t.progress, 0) / projectTasks.length);
  
  // 创建项目组汇总数据...
});
```

### 展开/折叠切换
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

## 使用方法

### 甘特图视图
1. 打开甘特图视图
2. 点击顶部控制面板的"按项目组分组"开关
3. 启用后，项目组显示为紫色的汇总条
4. 点击项目组条可以展开/折叠子任务
5. 点击子任务名称查看详情

### 日历视图
1. 打开日历视图
2. 点击页面头部的"按项目组分组"开关
3. 启用后，项目组显示为紫色的事件
4. 点击项目组事件可以展开/折叠子任务
5. 点击子任务事件查看详情

## 优势

1. **更好的时间对比**
   - 项目组和任务在同一时间轴上，容易比较时间跨度
   - 可以直观看到项目组的整体进度

2. **灵活的视图控制**
   - 折叠时：简洁视图，只看项目组概览
   - 展开时：详细视图，查看所有子任务

3. **一致的用户体验**
   - 甘特图和日历视图使用相同的交互模式
   - 紫色主题贯穿整个项目组功能

4. **高效的信息展示**
   - 自动计算汇总数据，无需手动维护
   - 层级关系清晰，通过缩进和颜色区分

## 相关文件

- `packages/frontend/src/pages/GanttChartPage.tsx` - 甘特图实现
- `packages/frontend/src/pages/CalendarPage.tsx` - 日历视图实现
- `docs/PROJECT_GROUP_COLLAPSIBLE_VIEWS_STATUS.md` - 功能状态文档
- `docs/PROJECT_GROUP_COLLAPSIBLE_VIEWS_IMPLEMENTATION.md` - 实现方案文档

## 后续优化建议

1. **持久化展开状态**
   - 将展开状态保存到 localStorage
   - 下次访问时恢复用户的偏好设置

2. **项目组统计增强**
   - 显示项目组的总悬赏金额
   - 显示已完成/进行中/未开始的任务数量
   - 显示项目组的风险指标（延期任务数）

3. **快捷操作**
   - 添加"全部展开"/"全部折叠"按钮
   - 支持键盘快捷键（如 Ctrl+E 展开全部）

4. **视觉增强**
   - 项目组条显示进度条
   - 子任务显示依赖关系连线
   - 添加项目组颜色自定义功能
