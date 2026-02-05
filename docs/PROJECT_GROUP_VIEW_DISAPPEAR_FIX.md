# 甘特图项目组分组开关不可见问题修复

## 问题描述
用户报告在甘特图视图中无法看到"按项目组分组"开关，导致无法使用项目组折叠功能。

## 问题分析

### 尝试的修复方案
1. **方案1**: 将控制按钮从Card外部移到Card的`extra`属性中
   - 结果：仍然不可见
   
2. **方案2**: 调整TaskVisualizationPage的负边距
   - 将 `marginTop: '-24px'` 改为 `marginTop: '16px'`
   - 结果：仍然不可见

### 根本原因
可能的原因：
1. Ant Design Card的`extra`属性在嵌套Card结构中可能不显示
2. CSS样式冲突导致控制按钮被隐藏
3. 响应式布局问题导致控制按钮溢出视口

## 最终解决方案

将控制按钮移到Card内部的顶部，作为Card body的第一个元素，而不是使用`extra`属性。

### 实施步骤

1. 修改 `GanttChartPage.tsx`
2. 将控制按钮从`extra`移到Card body内部
3. 添加明显的视觉分隔

## 修复时间
2026-01-30

## 相关文档
- [甘特图渲染问题修复](./GANTT_CHART_RENDERING_FIX.md)
- [项目组折叠视图实现状态](./PROJECT_GROUP_COLLAPSIBLE_VIEWS_STATUS.md)
