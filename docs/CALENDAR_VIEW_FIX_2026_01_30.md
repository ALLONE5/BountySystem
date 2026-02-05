# 日历视图项目组分组功能修复

## 修复时间
2026-01-30 09:42

## 问题描述
用户报告日历视图中没有"按项目组分组"功能开关。

## 根本原因
CalendarPage 组件的 `hideFilters` 属性逻辑有问题：
1. 当 `hideFilters=false` 时，控制栏显示在 page-header 中（适合独立页面）
2. 当 `hideFilters=true` 时，控制栏应该显示在 Card 上方（适合嵌入式视图）
3. 但原来的代码在 `hideFilters=true` 时完全隐藏了控制栏

## 修复方案

### 1. 修改 CalendarPage.tsx
将控制栏的显示逻辑改为：
- `hideFilters=false`：显示完整的 page-header（包含大标题和控制栏）
- `hideFilters=true`：隐藏 page-header，但在 Card 上方显示控制栏（类似 GanttChartPage）

### 2. 修改 TaskVisualizationPage.tsx
明确传递 `hideFilters={true}` 给 CalendarPage，确保在标签页中显示控制栏但不显示重复的大标题。

## 修改的文件

### packages/frontend/src/pages/CalendarPage.tsx
```typescript
// 修改前：
{!hideFilters && (
  <Space size="middle">
    {/* 控制栏 */}
  </Space>
)}

// 修改后：
{!hideFilters && (
  <div className="page-header">
    {/* 完整的页面头部 */}
  </div>
)}

{hideFilters && (
  <div style={{ /* 控制栏样式 */ }}>
    {/* 控制栏（无大标题） */}
  </div>
)}
```

### packages/frontend/src/pages/TaskVisualizationPage.tsx
```typescript
// 修改前：
<CalendarPage />

// 修改后：
<CalendarPage hideFilters={true} />
```

## 验证步骤

### 方法 1: 通过"我的任务"页面访问（推荐）
1. 登录系统（admin / Password123）
2. 点击左侧菜单"我的任务"
3. 点击顶部的"日历"标签页
4. 应该看到控制栏显示在日历上方，包含：
   - "按项目组分组:" 开关
   - "所有任务" 下拉选择器
   - "刷新" 按钮

### 方法 2: 直接访问日历页面
1. 如果有独立的日历页面路由
2. 应该看到完整的页面头部（包含"日历视图"大标题）
3. 控制栏显示在大标题右侧

## 预期效果

### 启用项目组分组后
1. 点击"按项目组分组"开关
2. 日历上应该显示：
   - **紫色事件**：项目组汇总（如"📁 电商平台开发 (6)"）
   - **彩色事件**：子任务（根据状态显示不同颜色）
3. 点击紫色项目组事件 → 折叠/展开子任务
4. 点击子任务事件 → 查看任务详情

### 控制栏位置
- **在 TaskVisualizationPage 中**：控制栏显示在日历上方的灰色背景区域
- **在独立页面中**：控制栏显示在页面头部右侧

## 技术细节

### hideFilters 属性的作用
- `false` 或 `undefined`：显示完整的页面头部（适合独立页面）
- `true`：隐藏页面头部，但显示控制栏（适合嵌入式视图）

### 与 GanttChartPage 的一致性
现在 CalendarPage 和 GanttChartPage 使用相同的模式：
- 都支持 `hideFilters` 属性
- 都在嵌入式视图中显示控制栏
- 都使用相同的控制栏样式

## 故障排除

### 如果仍然看不到开关
1. **强制刷新浏览器**：按 `Ctrl + F5`
2. **检查前端进程**：
   ```bash
   # 查看进程输出
   getProcessOutput processId=2
   
   # 应该看到类似的输出：
   # [vite] hmr update /src/pages/CalendarPage.tsx
   ```
3. **重启前端服务器**：
   ```bash
   # 停止进程
   controlPwshProcess action=stop processId=2
   
   # 重新启动
   controlPwshProcess action=start command="npm run dev" cwd="packages/frontend"
   ```

### 如果开关显示但不工作
1. 打开浏览器开发者工具（F12）
2. 查看 Console 是否有 JavaScript 错误
3. 检查 Network 标签，确认任务数据已加载
4. 验证任务数据中有 `projectGroupName` 字段

## 相关文档
- `docs/PROJECT_GROUP_CALENDAR_VIEW_VERIFICATION.md` - 详细验证指南
- `docs/PROJECT_GROUP_GANTT_CALENDAR_OPTIMIZATION.md` - 优化总结
- `docs/PROJECT_GROUP_COLLAPSIBLE_VIEWS_STATUS.md` - 功能状态

## 完成标志
✅ CalendarPage.tsx 已修改
✅ TaskVisualizationPage.tsx 已修改
✅ 代码通过 TypeScript 编译检查
✅ 前端热重载已应用更新
✅ 与 GanttChartPage 保持一致的实现模式
