# Modern UI 菜单简化

## 变更说明

已简化 Modern Layout 的菜单结构，移除了"任务管理"、"任务视图"、"项目组"这些菜单项，因为它们的内容已经在"我的工作台"中体现。

## 修改内容

### 1. 菜单项简化 (`packages/frontend/src/layouts/ModernLayout.tsx`)

**移除的菜单项：**
- ❌ 任务管理（包含已发布任务、指派任务、任务列表、浏览任务、任务邀请）
- ❌ 任务视图（包含日历视图、看板视图、甘特图、可视化）
- ❌ 项目组

**保留的菜单项：**
- ✅ 首页
- ✅ 我的工作台（包含所有任务管理、任务视图、项目组功能）
- ✅ 赏金任务
- ✅ 排行榜（包含排行榜、原版风格）
- ✅ 管理中心（仅超级管理员）

### 2. 新菜单结构

```
首页 (直接导航)
我的工作台 (直接导航)
  - 包含所有任务管理功能
  - 包含所有任务视图功能
  - 包含所有项目组功能
赏金任务 (直接导航)
排行榜 (展开/收起)
  ├─ 排行榜
  └─ 原版风格
管理中心 (展开/收起，仅超级管理员)
  ├─ 用户管理
  ├─ 组群管理
  ├─ 任务管理
  ├─ 申请审核
  ├─ 头像管理
  ├─ 职位管理
  ├─ 赏金算法
  ├─ 通知广播
  ├─ 系统配置
  └─ 审计日志
```

### 3. 移动端导航更新

**移动端底部导航：**
- 首页
- 我的
- 赏金
- 排名

## 优势

1. **菜单更简洁** - 减少菜单项数量，提高用户体验
2. **功能集中** - 所有任务相关功能都在"我的工作台"中
3. **易于导航** - 用户只需记住几个主要菜单项
4. **响应式优化** - 移动端导航更加清晰

## 页面映射

虽然菜单项减少了，但所有页面仍然可以通过路由访问：

| 路由 | 页面 | 访问方式 |
|------|------|--------|
| `/dashboard` | DashboardPage | 首页菜单 |
| `/my` | MyPage | 我的工作台菜单 |
| `/tasks/published` | PublishedTasksPage | 我的工作台内 |
| `/tasks/assigned` | AssignedTasksPage | 我的工作台内 |
| `/tasks/list` | TaskListPage | 我的工作台内 |
| `/tasks/browse` | BrowseTasksPage | 我的工作台内 |
| `/tasks/invitations` | TaskInvitationsPage | 我的工作台内 |
| `/tasks/calendar` | CalendarPage | 我的工作台内 |
| `/tasks/kanban` | KanbanPage | 我的工作台内 |
| `/tasks/gantt` | GanttChartPage | 我的工作台内 |
| `/tasks/visualization` | TaskVisualizationPage | 我的工作台内 |
| `/groups` | GroupsPage | 我的工作台内 |
| `/bounty-tasks` | BountyTasksPage | 赏金任务菜单 |
| `/ranking` | RankingPage | 排行榜菜单 |
| `/ranking/original` | RankingPage | 排行榜菜单 |
| `/notifications` | NotificationPage | 通知徽章 |
| `/profile` | ProfilePage | 用户菜单 |
| `/settings` | SettingsPage | 用户菜单 |
| `/admin/*` | 各管理页面 | 管理中心菜单 |

## 代码变更

### 移除的导入
```typescript
// 不再使用
FileTextOutlined,
DashboardOutlined,
TeamOutlined,
```

### 简化的菜单项
```typescript
const mainMenuItems = [
  { key: '/dashboard', icon: <HomeOutlined />, label: '首页', ... },
  { key: '/my', icon: <UserOutlined />, label: '我的工作台', ... },
  { key: '/bounty-tasks', icon: <GiftOutlined />, label: '赏金任务', ... },
  { key: 'ranking', icon: <TrophyOutlined />, label: '排行榜', children: [...] },
];
```

### 简化的菜单展开逻辑
```typescript
const getOpenKeys = () => {
  const path = location.pathname;
  const openKeys = [];
  if (path.startsWith('/admin/')) openKeys.push('admin');
  if (path.includes('/ranking')) openKeys.push('ranking');
  return openKeys;
};
```

## 验证步骤

1. **打开应用**
   ```
   http://localhost:5173/dashboard
   ```

2. **检查菜单**
   - 应该只看到 4 个主菜单项
   - 排行榜应该可以展开/收起
   - 管理中心应该只对管理员显示

3. **检查功能**
   - 点击"我的工作台"应该显示所有任务相关功能
   - 点击"赏金任务"应该导航到赏金任务页面
   - 点击"排行榜"应该展开子菜单

4. **检查移动端**
   - 缩小浏览器窗口
   - 应该显示 4 个底部导航项
   - 功能应该正常

## 完成状态

- [x] 菜单项已简化
- [x] 导入已清理
- [x] 菜单逻辑已更新
- [x] 移动端导航已更新
- [x] 代码无错误
- [ ] 需要测试

## 下一步

1. 测试菜单导航
2. 测试我的工作台功能
3. 测试移动端导航
4. 验证所有页面仍可访问

## 相关文件

- `packages/frontend/src/layouts/ModernLayout.tsx` - 主要修改文件
- `packages/frontend/src/router/index.tsx` - 路由配置（无需修改）

## 注意事项

1. 所有页面仍然存在，只是菜单项减少了
2. 用户仍然可以通过直接访问 URL 来访问任何页面
3. "我的工作台"应该包含所有任务相关功能的入口
4. 菜单更简洁，用户体验更好
