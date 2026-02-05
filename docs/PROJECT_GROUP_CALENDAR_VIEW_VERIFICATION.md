# 日历视图项目组分组功能验证指南

## 验证时间
2026-01-30

## 功能状态
✅ **已完成** - 日历视图项目组分组功能已实现并通过编译检查

## 实现的功能

### 1. 项目组分组开关
- **位置**: 页面头部右侧，"所有任务"筛选器左边
- **显示**: "按项目组分组:" 文字 + Switch 开关
- **默认状态**: 关闭（不分组）

### 2. 项目组汇总事件
当开关打开时：
- 项目组显示为**紫色事件**（#722ed1）
- 标题格式：`📁 项目名称 (任务数量)`
- 时间跨度：从最早子任务开始到最晚子任务结束
- 默认行为：所有项目组自动展开

### 3. 展开/折叠交互
- **点击项目组事件**：切换该项目组的展开/折叠状态
- **折叠状态**：只显示项目组汇总事件
- **展开状态**：显示项目组事件 + 所有子任务事件（带缩进）
- **点击子任务事件**：打开任务详情抽屉

### 4. 视觉设计
- **项目组事件**：紫色背景（#722ed1）
- **子任务事件**：根据任务状态显示颜色
  - 未开始：灰色 (#d9d9d9)
  - 可承接：绿色 (#52c41a)
  - 进行中：蓝色 (#1890ff)
  - 已完成：绿色 (#52c41a)
  - 已放弃：红色 (#ff4d4f)
- **子任务标题**：有缩进（2个空格）

## 验证步骤

### 步骤 1: 访问日历视图
1. 登录系统（使用测试账号：admin / Password123）
2. 导航到"我的任务"页面
3. 点击顶部的"日历"标签页

### 步骤 2: 启用项目组分组
1. 在页面头部找到"按项目组分组:"开关
2. 点击开关，将其切换到"开启"状态
3. 观察日历视图的变化

### 步骤 3: 验证项目组显示
应该看到：
- ✅ 紫色的项目组事件出现在日历上
- ✅ 事件标题显示为：📁 项目名称 (任务数量)
- ✅ 项目组事件的时间跨度覆盖所有子任务
- ✅ 子任务事件也同时显示（默认展开）

### 步骤 4: 测试折叠/展开
1. 点击任意紫色的项目组事件
2. 验证该项目组的子任务消失（折叠）
3. 再次点击同一项目组事件
4. 验证子任务重新出现（展开）

### 步骤 5: 测试任务详情
1. 点击任意子任务事件（非紫色的项目组事件）
2. 验证任务详情抽屉从右侧滑出
3. 验证任务详情正确显示

### 步骤 6: 测试关闭分组
1. 点击"按项目组分组:"开关，将其关闭
2. 验证所有任务恢复为普通显示（无项目组汇总）
3. 验证所有任务事件都可以点击查看详情

## 预期结果

### 正常情况
- ✅ 开关可见且可点击
- ✅ 开关状态切换流畅
- ✅ 项目组事件正确显示为紫色
- ✅ 子任务事件正确显示对应状态颜色
- ✅ 点击项目组事件可以切换展开/折叠
- ✅ 点击子任务事件可以查看详情
- ✅ 关闭分组后恢复正常视图

### 如果开关不可见
可能的原因和解决方案：

1. **浏览器缓存问题**
   - 按 `Ctrl + F5` 强制刷新页面
   - 或清除浏览器缓存后重新加载

2. **热重载未生效**
   - 检查前端进程是否正常运行
   - 查看控制台是否有错误信息
   - 重启前端开发服务器

3. **路由问题**
   - 确认访问的是正确的日历视图路由
   - 检查是否通过"我的任务"页面的标签页访问

## 技术实现细节

### 状态管理
```typescript
const [groupByProject, setGroupByProject] = useState(false);
const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
```

### 自动展开初始化
```typescript
useEffect(() => {
  if (groupByProject && tasks.length > 0) {
    const projectNames = new Set(tasks.map(t => t.projectGroupName || '无项目组'));
    setExpandedProjects(projectNames);
  }
}, [groupByProject, tasks]);
```

### 事件转换逻辑
```typescript
const convertTasksToEvents = (): CalendarEvent[] => {
  if (!groupByProject) {
    // 普通模式：显示所有任务
    return tasks.map(task => ({ ... }));
  }

  // 分组模式：显示项目汇总和展开的任务
  const grouped: Record<string, Task[]> = {};
  // ... 分组逻辑
  
  // 添加项目汇总事件
  events.push({
    id: `project-${projectName}`,
    title: `📁 ${projectName} (${projectTasks.length})`,
    backgroundColor: '#722ed1',
    // ...
  });
  
  // 如果展开，添加子任务
  if (expandedProjects.has(projectName)) {
    projectTasks.forEach(task => {
      events.push({ ... });
    });
  }
};
```

### 点击事件处理
```typescript
const handleEventClick = (info: any) => {
  const task = info.event.extendedProps.task;
  
  // 如果是项目汇总，切换展开/折叠
  if (task.isProjectSummary) {
    toggleProject(task.projectName);
    return;
  }
  
  // 否则显示任务详情
  setSelectedTask(task);
  setDrawerVisible(true);
};
```

## 与甘特图的一致性

日历视图的实现与甘特图视图保持一致：

| 特性 | 甘特图 | 日历视图 |
|------|--------|----------|
| 分组开关 | ✅ | ✅ |
| 项目组颜色 | 紫色 (#722ed1) | 紫色 (#722ed1) |
| 默认展开 | ✅ | ✅ |
| 点击切换 | ✅ | ✅ |
| 子任务缩进 | 4个空格 | 2个空格 |
| 时间跨度计算 | 自动 | 自动 |

## 相关文件

- `packages/frontend/src/pages/CalendarPage.tsx` - 日历视图实现
- `packages/frontend/src/pages/GanttChartPage.tsx` - 甘特图实现（参考）
- `docs/PROJECT_GROUP_GANTT_CALENDAR_OPTIMIZATION.md` - 优化总结文档

## 故障排除

### 问题：开关不可见
**解决方案**：
1. 检查前端进程输出：`getProcessOutput processId=2`
2. 查看是否有编译错误
3. 强制刷新浏览器（Ctrl+F5）
4. 重启前端服务器

### 问题：点击项目组事件无反应
**解决方案**：
1. 打开浏览器开发者工具（F12）
2. 查看 Console 是否有 JavaScript 错误
3. 验证 `handleEventClick` 函数是否正确绑定
4. 检查 `task.isProjectSummary` 属性是否正确设置

### 问题：子任务不显示
**解决方案**：
1. 验证 `expandedProjects` 状态是否包含项目名称
2. 检查 `convertTasksToEvents` 函数的条件判断
3. 确认任务数据中有 `projectGroupName` 字段

## 测试数据

系统中已注入测试数据，包含以下项目组：
1. **电商平台开发** - 6个任务
2. **企业管理系统** - 5个任务
3. **AI 智能助手** - 5个任务
4. **数据分析平台** - 5个任务
5. **无项目组** - 5个任务

测试账号：
- 用户名：admin / developer1 / developer2 / designer1 / manager1
- 密码：Password123

## 完成标志

✅ 所有功能已实现
✅ 代码已通过 TypeScript 编译检查
✅ 前端热重载已应用更新
✅ 与甘特图保持一致的用户体验
✅ 文档已更新

## 下一步

用户可以：
1. 按照验证步骤测试功能
2. 如有问题，参考故障排除部分
3. 提供反馈以进行进一步优化
