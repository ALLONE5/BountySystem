# 菜单导航无反应 - 快速参考

## 问题
左侧菜单中的"任务管理"、"任务视图"、"排行榜"等有子菜单的项目点击无反应

## 根本原因
Ant Design Menu 组件需要通过 `openKeys` 和 `onOpenChange` 来管理菜单展开状态

## 解决方案

### 文件: `packages/frontend/src/layouts/DiscordLayout.tsx`

**1. 添加状态**
```typescript
const [collapsed, setCollapsed] = useState(false);
const [isMobile, setIsMobile] = useState(false);
const [openKeys, setOpenKeys] = useState<string[]>([]);
```

**2. 初始化展开状态**
```typescript
useEffect(() => {
  setOpenKeys(getOpenKeys());
}, [location.pathname]);
```

**3. 改进 getOpenKeys 函数**
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

**4. 更新 Menu 组件**
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

## 验证
```bash
# 检查是否有 TypeScript 错误
npm run type-check

# 或在浏览器中测试
# 1. 打开 http://localhost:5173/dashboard
# 2. 点击"任务管理"菜单项
# 3. 应该看到子菜单展开
# 4. 点击"已发布任务"应该导航到 /tasks/published
```

## 关键点
- ✅ 有子菜单的项目点击时展开/收起，不导航
- ✅ 子菜单项点击时导航到对应页面
- ✅ 访问相关页面时菜单自动展开
- ✅ 菜单展开状态由 `openKeys` 和 `onOpenChange` 管理

## 修改状态
- [x] DiscordLayout 已修改
- [x] 所有文件无错误
- [ ] 需要测试
