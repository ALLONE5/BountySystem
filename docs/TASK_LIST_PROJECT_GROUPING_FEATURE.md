# 列表视图项目组分组功能

## 实现时间
2026-01-30

## 功能概述
在"列表"标签页中添加"按项目组分组"功能，使用折叠面板展示项目组和任务。

## 功能特性

### 1. 项目组分组开关
- **位置**: Card 标题栏右侧，搜索框左边
- **显示**: "按项目组分组:" 文字 + Switch 开关
- **默认状态**: 关闭（显示普通表格）

### 2. 分组视图
启用分组后，任务按项目组分组显示：

#### 项目组面板头部
- **图标**: 紫色文件夹图标 (FolderOutlined)
- **项目名称**: 粗体显示
- **任务数量**: 紫色徽章显示任务数
- **统计信息**:
  - X 进行中
  - X 已完成
  - ¥总赏金

#### 项目组面板内容
- 展开后显示该项目组的所有任务
- 使用完整的表格展示（与普通视图相同的列）
- 每个项目组的表格独立，不分页

### 3. 折叠/展开交互
- **默认状态**: 所有项目组自动展开
- **点击面板头部**: 折叠/展开该项目组
- **多个项目组**: 可以同时展开多个项目组
- **点击统计信息**: 不会触发折叠/展开（阻止事件冒泡）

### 4. 视觉设计
- **项目组颜色**: 紫色 (#722ed1)，与其他视图保持一致
- **面板样式**: 白色背景，灰色边框，圆角
- **面板间距**: 16px
- **统计信息**: 灰色文字，赏金为红色粗体

## 技术实现

### 状态管理
```typescript
const [groupByProject, setGroupByProject] = useState(false);
const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
```

### 分组逻辑
```typescript
const groupTasksByProject = (): Record<string, Task[]> => {
  const grouped: Record<string, Task[]> = {};
  filteredTasks.forEach(task => {
    const key = task.projectGroupName || '无项目组';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(task);
  });
  return grouped;
};
```

### 统计计算
```typescript
const getProjectStats = (tasks: Task[]) => {
  const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const totalBounty = tasks.reduce((sum, t) => sum + t.bountyAmount, 0);
  return { inProgress, completed, totalBounty };
};
```

### 自动展开初始化
```typescript
useEffect(() => {
  if (groupByProject && filteredTasks.length > 0) {
    const projectNames = Array.from(new Set(filteredTasks.map(t => t.projectGroupName || '无项目组')));
    setExpandedProjects(projectNames);
  }
}, [groupByProject, filteredTasks]);
```

## 使用方法

### 启用项目组分组
1. 打开"我的任务"页面
2. 点击"列表"标签页
3. 点击右上角的"按项目组分组"开关

### 查看项目组信息
- 面板头部显示项目名称、任务数量和统计信息
- 点击面板头部可以折叠/展开

### 查看任务详情
- 点击任务行可以打开任务详情抽屉
- 与普通视图的交互方式相同

### 关闭分组
- 再次点击"按项目组分组"开关
- 恢复到普通表格视图

## 与其他视图的对比

| 特性 | 列表视图 | 甘特图 | 日历视图 |
|------|---------|--------|----------|
| 分组方式 | 折叠面板 | 汇总任务条 | 汇总事件 |
| 统计信息 | 进行中/已完成/总赏金 | 平均进度 | 任务数量 |
| 展开/折叠 | 点击面板头部 | 点击任务条 | 点击事件 |
| 默认状态 | 全部展开 | 全部展开 | 全部展开 |
| 项目组颜色 | 紫色图标和徽章 | 紫色任务条 | 紫色事件 |

## 优势

### 1. 清晰的层级结构
- 项目组和任务分层显示
- 统计信息一目了然
- 易于管理大量任务

### 2. 灵活的视图控制
- 可以选择性展开/折叠项目组
- 快速定位特定项目的任务
- 减少视觉干扰

### 3. 丰富的统计信息
- 实时显示项目进度
- 快速了解项目状态
- 总赏金一目了然

### 4. 保持表格功能
- 排序功能正常工作
- 搜索和筛选功能正常
- 点击查看详情功能正常

## 示例效果

```
┌─────────────────────────────────────────────────────────────┐
│ 列表视图                                                     │
│                                    [按项目组分组: ✓] [搜索...] │
├─────────────────────────────────────────────────────────────┤
│ ▼ 📁 企业管理系统 (1)              1 进行中  0 已完成  ¥700.00 │
│   ┌───────────────────────────────────────────────────────┐ │
│   │ 任务名称    │ 状态   │ 赏金   │ 截止日期  │ ...       │ │
│   ├───────────────────────────────────────────────────────┤ │
│   │ 权限管理系统 │ 进行中 │ ¥700  │ 2026-02-15 │ ...       │ │
│   └───────────────────────────────────────────────────────┘ │
│                                                               │
│ ▼ 📁 电商平台开发 (1)              1 进行中  0 已完成  ¥770.00 │
│   ┌───────────────────────────────────────────────────────┐ │
│   │ 任务名称    │ 状态   │ 赏金   │ 截止日期  │ ...       │ │
│   ├───────────────────────────────────────────────────────┤ │
│   │ 用户认证系统 │ 进行中 │ ¥770  │ 2026-02-10 │ ...       │ │
│   └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 相关文件
- `packages/frontend/src/pages/TaskListPage.tsx` - 列表视图实现
- `packages/frontend/src/pages/GanttChartPage.tsx` - 甘特图实现（参考）
- `packages/frontend/src/pages/CalendarPage.tsx` - 日历视图实现（参考）

## 后续优化建议

### 1. 持久化展开状态
将展开状态保存到 localStorage：
```typescript
useEffect(() => {
  const saved = localStorage.getItem('list-expanded-projects');
  if (saved) {
    setExpandedProjects(JSON.parse(saved));
  }
}, []);

useEffect(() => {
  localStorage.setItem('list-expanded-projects', JSON.stringify(expandedProjects));
}, [expandedProjects]);
```

### 2. 全部展开/折叠按钮
添加快捷按钮：
```typescript
<Button onClick={() => setExpandedProjects(allProjectNames)}>
  全部展开
</Button>
<Button onClick={() => setExpandedProjects([])}>
  全部折叠
</Button>
```

### 3. 项目组排序
支持按不同维度排序项目组：
- 按任务数量
- 按总赏金
- 按完成度
- 按项目名称

### 4. 项目组筛选
添加项目组筛选器，只显示选中的项目组。

### 5. 导出功能
支持按项目组导出任务数据。

## 测试数据
使用以下测试账号查看效果：
- **admin** / Password123 - 发布了多个任务，涵盖所有项目组
- **developer1** / Password123 - 有4个任务，分布在3个项目组
- **developer2** / Password123 - 有5个任务，分布在4个项目组

## 完成标志
✅ 添加项目组分组开关
✅ 实现折叠面板展示
✅ 显示项目组统计信息
✅ 支持展开/折叠交互
✅ 保持表格所有功能
✅ 代码通过 TypeScript 编译检查
✅ 前端热重载已应用更新
✅ 与其他视图保持一致的紫色主题
