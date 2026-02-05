# 甘特图渲染问题修复

## 问题描述

点击"按项目组分组"开关后，甘特图视图完全消失，不显示任何内容。

## 问题原因

### 1. 早期返回导致不渲染
```typescript
const renderGanttChart = () => {
  if (!svgRef.current || !containerRef.current) return;
  const displayItems = getDisplayItems();
  if (displayItems.length === 0) return;  // ❌ 直接返回，不渲染任何内容
  // ...
};
```

当 `displayItems` 为空时，函数直接返回，导致 SVG 元素为空。

### 2. D3 方法使用错误
```typescript
.text(d => {  // ❌ 不应该有参数 d
  const name = task.name;
  return name;
})
```

在非数据绑定的情况下使用了数据参数，可能导致渲染错误。

### 3. HTML 方法兼容性
```typescript
.html(`${isExpanded ? '▼' : '▶'} 📁 ${item.data.name}`)  // ❌ 可能有兼容性问题
```

使用 `.html()` 方法可能在某些 D3 版本中有问题。

## 修复方案

### 1. 改进空状态处理
```typescript
const renderGanttChart = () => {
  if (!svgRef.current || !containerRef.current) return;

  const displayItems = getDisplayItems();
  
  // 先清除之前的图表
  d3.select(svgRef.current).selectAll('*').remove();
  
  if (displayItems.length === 0) {
    // 渲染空状态提示
    const svg = d3.select(svgRef.current)
      .attr('width', containerRef.current.clientWidth)
      .attr('height', 100);
    
    svg.append('text')
      .attr('x', containerRef.current.clientWidth / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#999')
      .text('暂无任务数据');
    
    return;
  }
  
  // 继续渲染图表...
};
```

### 2. 修复 D3 文本渲染
```typescript
// 项目组标题
projectGroup.append('text')
  .text(`${isExpanded ? '▼' : '▶'} 📁 ${item.data.name} (${item.data.taskCount})`);

// 任务名称
taskGroup.append('text')
  .text(() => {  // ✅ 使用无参数箭头函数
    const prefix = groupByProject ? '  ' : '';
    const name = task.name;
    return prefix + (name.length > 18 ? name.substring(0, 18) + '...' : name);
  });
```

### 3. 确保展开状态初始化
```typescript
// 添加 useEffect 监听 groupByProject 变化
useEffect(() => {
  if (groupByProject && tasks.length > 0) {
    const projectNames = new Set(tasks.map(t => t.projectGroupName || '无项目组'));
    setExpandedProjects(projectNames);
  }
}, [groupByProject, tasks]);
```

## 修复后的完整流程

1. **用户点击"按项目组分组"开关**
   - `groupByProject` 变为 `true`
   - useEffect 触发，初始化 `expandedProjects`

2. **getDisplayItems() 构建显示项**
   - 如果 `groupByProject` 为 false：返回所有任务
   - 如果 `groupByProject` 为 true：
     - 按项目组分组任务
     - 为每个项目组创建标题项
     - 为展开的项目组添加任务项

3. **renderGanttChart() 渲染图表**
   - 清除之前的内容
   - 如果没有显示项：渲染空状态提示
   - 如果有显示项：
     - 计算总高度
     - 渲染时间轴
     - 遍历显示项：
       - 项目组：渲染标题条
       - 任务：渲染任务条

4. **用户交互**
   - 点击项目组标题：折叠/展开
   - 点击任务名称：查看详情

## 测试验证

### 测试步骤
1. 打开甘特图视图
2. 确认可以看到任务列表（不分组）
3. 点击"按项目组分组"开关
4. **预期**: 看到项目组标题和任务，所有项目组展开
5. 点击项目组标题折叠
6. **预期**: 任务隐藏，只显示项目组标题
7. 再次点击展开
8. **预期**: 任务显示
9. 关闭"按项目组分组"
10. **预期**: 恢复普通列表

### 边界情况测试
- [ ] 没有任务时的显示
- [ ] 所有任务都没有项目组
- [ ] 所有任务都属于同一项目组
- [ ] 项目组名称很长
- [ ] 任务名称很长

## 代码变更总结

### packages/frontend/src/pages/GanttChartPage.tsx

1. **添加展开状态初始化**
```diff
+ useEffect(() => {
+   if (groupByProject && tasks.length > 0) {
+     const projectNames = new Set(tasks.map(t => t.projectGroupName || '无项目组'));
+     setExpandedProjects(projectNames);
+   }
+ }, [groupByProject, tasks]);
```

2. **改进空状态处理**
```diff
  const renderGanttChart = () => {
    if (!svgRef.current || !containerRef.current) return;
    const displayItems = getDisplayItems();
+   
+   d3.select(svgRef.current).selectAll('*').remove();
+   
+   if (displayItems.length === 0) {
+     // 渲染空状态
+     return;
+   }
-   if (displayItems.length === 0) return;
```

3. **修复文本渲染**
```diff
- .html(`${isExpanded ? '▼' : '▶'} 📁 ${item.data.name}`)
+ .text(`${isExpanded ? '▼' : '▶'} 📁 ${item.data.name}`)

- .text(d => {
+ .text(() => {
    const name = task.name;
    return name;
  })
```

## 修复时间

2026-01-29

## 相关文档

- [项目组视图消失问题修复](./PROJECT_GROUP_VIEW_DISAPPEAR_FIX.md)
- [项目组折叠视图实现方案](./PROJECT_GROUP_COLLAPSIBLE_VIEWS_IMPLEMENTATION.md)
- [项目组折叠视图实现状态](./PROJECT_GROUP_COLLAPSIBLE_VIEWS_STATUS.md)
