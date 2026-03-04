# 菜单导航无反应问题修复

## 问题描述

左侧菜单中的以下项目点击无反应：
- 任务管理（有子菜单）
- 任务视图（有子菜单）
- 排行榜（有子菜单）

## 根本原因

Ant Design Menu 组件的行为：
- 当菜单项有 `children` 时，点击该项会展开/收起子菜单
- 不会触发 `onClick` 事件
- 菜单的展开状态需要通过 `openKeys` 和 `onOpenChange` 来管理

## 解决方案

### 修改 `packages/frontend/src/layouts/DiscordLayout.tsx`

**1. 添加 openKeys 状态管理：**
```typescript
const [collapsed, setCollapsed] = useState(false);
const [isMobile, setIsMobile] = useState(false);
const [openKeys, setOpenKeys] = useState<string[]>([]);
```

**2. 初始化展开的菜单项：**
```typescript
useEffect(() => {
  setOpenKeys(getOpenKeys());
}, [location.pathname]);
```

**3. 改进 getOpenKeys 函数：**
```typescript
const getOpenKeys = () => {
  const path = location.pathname;
  const openKeys = [];
  if (path.startsWith('/admin/')) openKeys.push('admin');
  if (path.startsWith('/tasks/')) {
    openKeys.push('tasks');
    if (path.includes('/calendar') || path.includes('/kanban') || path.includes('/gantt') || path.includes('/visualization')) {
      openKeys.push('task-views');
    }
  }
  if (path.includes('/ranking')) openKeys.push('ranking');
  return openKeys;
};
```

**4. 更新 Menu 组件配置：**
```typescript
<Menu
  mode="inline"
  selectedKeys={getSelectedKeys()}
  openKeys={openKeys}
  onOpenChange={setOpenKeys}
  items={[...mainMenuItems, ...adminMenuItems]}
  className="discord-menu"
/>
```

## 修改后的行为

### 菜单项点击行为

**有子菜单的项目（任务管理、任务视图、排行榜）：**
1. 用户点击菜单项
2. 菜单展开/收起子菜单
3. 用户点击子菜单项
4. 导航到对应页面

**无子菜单的项目（首页、我的工作台、项目组等）：**
1. 用户点击菜单项
2. 直接导航到对应页面

### 菜单展开状态

- 当用户访问 `/tasks/published` 时，"任务管理" 菜单自动展开
- 当用户访问 `/tasks/calendar` 时，"任务管理" 和 "任务视图" 菜单都自动展开
- 当用户访问 `/ranking` 时，"排行榜" 菜单自动展开
- 当用户访问 `/admin/users` 时，"管理中心" 菜单自动展开

## 菜单结构

```
首页 (直接导航)
我的工作台 (直接导航)
任务管理 (展开/收起)
  ├─ 已发布任务
  ├─ 指派任务
  ├─ 任务列表
  ├─ 浏览任务
  └─ 任务邀请
任务视图 (展开/收起)
  ├─ 日历视图
  ├─ 看板视图
  ├─ 甘特图
  └─ 可视化
项目组 (直接导航)
赏金任务 (直接导航)
排行榜 (展开/收起)
  ├─ Discord 风格
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

## 验证步骤

1. **打开应用**
   - 访问 `http://localhost:5173/dashboard`
   - 确保已登录

2. **测试菜单展开/收起**
   - 点击"任务管理"菜单项
   - 应该看到子菜单展开
   - 再次点击应该收起

3. **测试菜单导航**
   - 点击"任务管理"下的"已发布任务"
   - 应该导航到 `/tasks/published`
   - "任务管理"菜单应该保持展开状态

4. **测试自动展开**
   - 直接访问 `/tasks/calendar`
   - "任务管理"和"任务视图"菜单应该自动展开
   - "日历视图"应该被选中

5. **测试排行榜**
   - 点击"排行榜"菜单项
   - 应该看到子菜单展开
   - 点击"Discord 风格"应该导航到 `/ranking`

## 相关文件

- `packages/frontend/src/layouts/DiscordLayout.tsx` - 主要修改文件
- `packages/frontend/src/router/index.tsx` - 路由配置（无需修改）

## 完成状态

- [x] 添加 openKeys 状态管理
- [x] 初始化展开的菜单项
- [x] 改进 getOpenKeys 函数
- [x] 更新 Menu 组件配置
- [x] 验证代码无错误
- [ ] 测试菜单功能

## 技术细节

### Ant Design Menu 组件

- `mode="inline"` - 内联菜单模式
- `selectedKeys` - 当前选中的菜单项
- `openKeys` - 当前展开的菜单项（仅对有 children 的项有效）
- `onOpenChange` - 菜单展开/收起时的回调函数
- `items` - 菜单项配置数组

### 菜单项配置

```typescript
{
  key: 'unique-key',           // 唯一标识
  icon: <IconComponent />,     // 菜单图标
  label: '菜单标签',            // 菜单显示文本
  onClick: () => navigate(),   // 点击回调（仅对无 children 的项有效）
  children: [                  // 子菜单项
    {
      key: 'child-key',
      label: '子菜单标签',
      onClick: () => navigate(),
    }
  ]
}
```

## 常见问题

### Q: 为什么点击有子菜单的项目不会导航？
A: Ant Design Menu 的设计就是这样的。有 `children` 的菜单项点击时会展开/收起子菜单，不会触发 `onClick` 事件。用户需要点击子菜单项才能导航。

### Q: 如何让有子菜单的项目也能导航？
A: 可以在菜单项中添加一个特殊的子项（通常是第一个），用来导航到该菜单的默认页面。但这会增加菜单的复杂性。

### Q: 菜单展开状态会保存吗？
A: 当前实现中，菜单展开状态不会保存。刷新页面后，菜单会根据当前路由自动展开。如果需要保存用户的菜单偏好，可以使用 localStorage。

## 下一步

1. 测试所有菜单项的导航功能
2. 测试菜单的展开/收起功能
3. 测试自动展开功能
4. 测试移动端菜单（如果需要）
5. 考虑添加菜单展开状态的持久化存储
