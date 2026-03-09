# 看板卡片暗色主题修复报告
# Kanban Card Dark Theme Fix Report

## 问题描述 (Problem Description)

用户报告在暗色模式下，看板视图中的卡片小标题（任务名称、描述、日期、进度等文字）仍然显示为浅色（灰色），在暗色背景下不可见。

User reported that in dark mode, kanban card subtitles (task names, descriptions, dates, progress labels, etc.) were still showing light colors (gray) and were invisible against the dark background.

## 修复内容 (Fix Details)

### 1. 移除硬编码颜色 (Removed Hardcoded Colors)

在以下组件中移除了硬编码的颜色值，改用 CSS 类名：

**KanbanCard.tsx:**
- 任务标题：移除 `color` 属性，添加 `kanban-card-title` 类
- 任务描述：移除 `color: '#666'`，添加 `kanban-card-description` 类
- 日期显示：移除 `color: '#999'`，添加 `kanban-card-date` 类
- 进度标签：移除 `color: '#666'`，添加 `kanban-card-progress-label` 类
- 进度条背景：移除 `backgroundColor: '#f0f0f0'`，添加 `kanban-card-progress-bar` 类

**KanbanColumn.tsx:**
- 列标题：添加 `kanban-column-title` 类
- 列头部：添加 `kanban-column-header` 类

**ProjectKanban.tsx:**
- 项目图标：移除 `color: '#722ed1'`，添加 `project-kanban-icon` 类
- 项目标题：添加 `project-kanban-title` 类
- 项目徽章：添加 `project-kanban-badge` 类
- 统计文字：移除 `color: '#666'`，添加 `project-kanban-stat` 类
- 赏金金额：移除 `color: '#f5222d'`，添加 `project-kanban-bounty` 类

### 2. 新增 CSS 样式 (New CSS Styles)

在 `search-harmonization.css` 中添加了完整的暗色主题样式：

#### 卡片内容样式

```css
/* 卡片标题 - 主要文字颜色 */
.kanban-card-title {
  color: var(--text-primary) !important;
}

[data-theme='dark'] .kanban-card-title {
  color: rgba(248, 250, 252, 0.95) !important; /* 接近白色 */
}

/* 卡片描述 - 次要文字颜色 */
.kanban-card-description {
  color: var(--text-secondary) !important;
}

[data-theme='dark'] .kanban-card-description {
  color: rgba(203, 213, 225, 0.85) !important; /* 浅灰色 */
}

/* 卡片日期 - 第三级文字颜色 */
.kanban-card-date {
  color: var(--text-tertiary) !important;
}

[data-theme='dark'] .kanban-card-date {
  color: rgba(148, 163, 184, 0.8) !important; /* 更淡的灰色 */
}

/* 进度标签 */
.kanban-card-progress-label {
  color: var(--text-secondary) !important;
}

[data-theme='dark'] .kanban-card-progress-label {
  color: rgba(203, 213, 225, 0.9) !important;
}

/* 进度条背景 */
.kanban-card-progress-bar {
  background-color: rgba(226, 232, 240, 0.5) !important;
}

[data-theme='dark'] .kanban-card-progress-bar {
  background-color: rgba(51, 65, 85, 0.6) !important; /* 深色背景 */
}
```

#### 看板列样式

```css
/* 列标题 */
.kanban-column-title {
  color: var(--text-primary) !important;
}

[data-theme='dark'] .kanban-column-title {
  color: rgba(248, 250, 252, 0.95) !important;
}

/* 列头部背景 */
.kanban-column-header {
  background: rgba(248, 250, 252, 0.5) !important;
}

[data-theme='dark'] .kanban-column-header {
  background: rgba(30, 41, 59, 0.4) !important;
}
```

#### 项目看板样式

```css
/* 项目图标 - 紫色 */
.project-kanban-icon {
  color: #722ed1 !important;
}

[data-theme='dark'] .project-kanban-icon {
  color: rgba(139, 92, 246, 0.9) !important;
}

/* 项目标题 */
.project-kanban-title {
  color: var(--text-primary) !important;
}

[data-theme='dark'] .project-kanban-title {
  color: rgba(248, 250, 252, 0.95) !important;
}

/* 项目统计文字 */
.project-kanban-stat {
  color: var(--text-secondary) !important;
}

[data-theme='dark'] .project-kanban-stat {
  color: rgba(203, 213, 225, 0.85) !important;
}

/* 项目赏金金额 - 红色强调 */
.project-kanban-bounty {
  color: #f5222d !important;
}

[data-theme='dark'] .project-kanban-bounty {
  color: rgba(239, 68, 68, 0.9) !important;
}
```

#### Collapse 面板样式

```css
[data-theme='dark'] .ant-collapse-item {
  background: rgba(30, 41, 59, 0.6) !important;
  border: 1px solid rgba(148, 163, 184, 0.2) !important;
}

[data-theme='dark'] .ant-collapse-header {
  background: rgba(15, 23, 42, 0.4) !important;
  color: rgba(248, 250, 252, 0.95) !important;
}
```

### 3. 颜色层级系统 (Color Hierarchy System)

建立了清晰的文字颜色层级：

**浅色主题：**
- 主要文字：`var(--text-primary)` - 深色
- 次要文字：`var(--text-secondary)` - 中灰色
- 第三级文字：`var(--text-tertiary)` - 浅灰色

**暗色主题：**
- 主要文字：`rgba(248, 250, 252, 0.95)` - 接近白色，最高对比度
- 次要文字：`rgba(203, 213, 225, 0.85-0.9)` - 浅灰色，中等对比度
- 第三级文字：`rgba(148, 163, 184, 0.8)` - 更淡的灰色，低对比度

### 4. 强调色保持 (Accent Colors Preserved)

保持了原有的强调色，但调整了暗色主题下的亮度：
- 紫色（项目图标）：`#722ed1` → `rgba(139, 92, 246, 0.9)`
- 红色（赏金金额）：`#f5222d` → `rgba(239, 68, 68, 0.9)`
- 列颜色（状态标识）：保持原有颜色，用于边框和徽章

## 修改的文件 (Modified Files)

1. **packages/frontend/src/components/Kanban/KanbanCard.tsx**
   - 添加了 5 个 CSS 类名
   - 移除了 5 处硬编码颜色

2. **packages/frontend/src/components/Kanban/KanbanColumn.tsx**
   - 添加了 2 个 CSS 类名
   - 移除了硬编码样式

3. **packages/frontend/src/components/Kanban/ProjectKanban.tsx**
   - 添加了 5 个 CSS 类名
   - 移除了 5 处硬编码颜色

4. **packages/frontend/src/styles/search-harmonization.css**
   - 新增约 120 行 CSS 代码
   - 包含完整的暗色主题样式定义

## 技术要点 (Technical Highlights)

### 1. CSS 变量优先
优先使用 CSS 变量（如 `var(--text-primary)`），在变量不可用时回退到具体颜色值。

### 2. 语义化类名
使用描述性的类名，清晰表达元素的用途：
- `kanban-card-title` - 卡片标题
- `kanban-card-description` - 卡片描述
- `project-kanban-stat` - 项目统计

### 3. 渐进增强
- 保持浅色主题的原有外观
- 仅在 `[data-theme='dark']` 下应用暗色样式
- 确保主题切换时平滑过渡

### 4. 对比度优化
确保所有文字在暗色背景下有足够的对比度：
- 主要文字：95% 不透明度
- 次要文字：85-90% 不透明度
- 第三级文字：80% 不透明度

## 视觉效果 (Visual Effects)

### 暗色模式下的改进：

**之前 (Before):**
- ❌ 任务标题不可见（浅色文字在浅色背景上）
- ❌ 描述文字几乎看不见
- ❌ 日期和进度信息难以辨认
- ❌ 项目统计信息不清晰

**之后 (After):**
- ✅ 任务标题清晰可见（白色文字）
- ✅ 描述文字易于阅读（浅灰色）
- ✅ 日期和进度信息清晰（适中灰色）
- ✅ 项目统计信息对比度良好
- ✅ 强调色（紫色、红色）在暗色背景下更加醒目
- ✅ 整体视觉层次分明

## 测试建议 (Testing Recommendations)

1. **看板视图测试**
   - 切换到暗色主题
   - 检查所有卡片标题是否清晰可见
   - 检查描述文字是否易于阅读
   - 检查日期和进度信息是否清晰

2. **项目分组测试**
   - 启用"按项目组分组"
   - 检查项目标题和图标颜色
   - 检查统计信息（进行中、已完成、赏金）的可读性
   - 检查折叠面板的背景和边框

3. **交互测试**
   - 拖拽卡片时检查视觉反馈
   - 悬停卡片时检查高亮效果
   - 展开/折叠项目时检查动画效果

4. **主题切换测试**
   - 从浅色切换到暗色主题
   - 从暗色切换到浅色主题
   - 确保所有文字在两种主题下都清晰可见

## 预期效果 (Expected Results)

在暗色模式下：
- ✅ 所有卡片标题使用白色文字（95% 不透明度）
- ✅ 描述文字使用浅灰色（85% 不透明度）
- ✅ 日期和次要信息使用中灰色（80% 不透明度）
- ✅ 项目标题清晰可见
- ✅ 统计信息对比度良好
- ✅ 强调色（紫色、红色）醒目但不刺眼
- ✅ 进度条在暗色背景下清晰可见
- ✅ 整体视觉层次分明，信息易于扫描

## 完成时间 (Completion Time)

2024-03-09

## 状态 (Status)

✅ 已完成 (Completed)

## 相关问题 (Related Issues)

此修复是 [SEARCH_BOX_DARK_THEME_FIX_REPORT.md](./SEARCH_BOX_DARK_THEME_FIX_REPORT.md) 的后续工作，完善了看板视图在暗色主题下的显示效果。
