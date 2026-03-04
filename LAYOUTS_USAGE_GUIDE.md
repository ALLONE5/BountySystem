# Layouts 文件使用指南

## 概述

`packages/frontend/src/layouts/` 目录包含应用的所有布局组件。布局是 React Router 中的包装组件，用于为不同的页面提供统一的结构和导航。

---

## 1. Layouts 目录结构

```
layouts/
├── AuthLayout.tsx              # 认证页面布局
├── SimpleAuthLayout.tsx        # 简化认证布局
├── ModernLayout.tsx            # 现代布局（当前使用）
├── ModernLayout.css            # 现代布局样式
├── BottomNavLayout.tsx         # 底部导航布局
├── BottomNavLayout.css         # 底部导航样式
├── DiscordLayout.tsx           # Discord 风格布局（备用）
├── DiscordLayout.css           # Discord 布局样式
├── SimpleBottomNavLayout.tsx   # 简化底部导航
└── NewAdaptiveLayout.tsx       # 自适应布局（包装器）
```

---

## 2. 当前使用的布局

### 🎯 主要布局：ModernLayout

**文件**：`packages/frontend/src/layouts/ModernLayout.tsx`

**用途**：
- 应用的主要布局
- 为所有认证后的页面提供统一的导航和结构
- 包含顶部导航栏、侧边栏、内容区域

**调用位置**：`packages/frontend/src/router/index.tsx`

```typescript
// router/index.tsx
import { ModernLayout } from '../layouts/ModernLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <ModernLayout showInfoPanel={true} />
      </ProtectedRoute>
    ),
    children: [
      // 所有主要页面都在这里
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'my', element: <MyPage /> },
      { path: 'bounty-tasks', element: <BountyTasksPage /> },
      // ... 更多页面
    ],
  },
]);
```

**结构**：
```
ModernLayout
├── Header（顶部导航栏）
│   ├── Logo
│   ├── Search Bar
│   ├── Notification Badge
│   └── User Avatar Dropdown
├── Layout Body
│   ├── Sidebar（左侧导航）
│   │   └── Menu Items
│   ├── Content（主内容区）
│   │   └── <Outlet /> （子页面渲染位置）
│   └── Info Panel（可选右侧面板）
└── Mobile Bottom Navigation（移动端）
```

**特点**：
- ✅ 三列布局（侧边栏、内容、信息面板）
- ✅ 响应式设计
- ✅ 玻璃态效果
- ✅ 简化菜单（4 个主菜单项）
- ✅ 主题支持（Light, Dark, Cyberpunk）

---

### 🔐 认证布局：AuthLayout

**文件**：`packages/frontend/src/layouts/AuthLayout.tsx`

**用途**：
- 为登录和注册页面提供布局
- 包含认证检查（已登录用户重定向到仪表板）
- 加载状态处理

**调用位置**：`packages/frontend/src/router/index.tsx`

```typescript
// router/index.tsx
import { AuthLayout } from '../layouts/AuthLayout';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
]);
```

**结构**：
```
AuthLayout
└── Content（居中）
    └── Card（400px 宽）
        └── <Outlet /> （登录/注册表单）
```

**特点**：
- ✅ 居中卡片设计
- ✅ 认证检查（已登录重定向）
- ✅ 加载状态处理
- ✅ 最小化设计

---

## 3. 备用布局（未使用）

### BottomNavLayout

**文件**：`packages/frontend/src/layouts/BottomNavLayout.tsx`

**用途**：
- 生产级底部导航布局
- 支持主题切换
- 支持角色基础导航

**为什么未使用**：
- 应用选择了 ModernLayout（三列布局）而不是底部导航

**可以用于**：
- 移动优先应用
- 需要主题切换的应用

---

### DiscordLayout

**文件**：`packages/frontend/src/layouts/DiscordLayout.tsx`

**用途**：
- Discord 风格的三列布局
- 复杂的菜单系统（7 个主菜单项）
- 可选的右侧信息面板

**为什么未使用**：
- 菜单过于复杂
- 应用选择了简化的 ModernLayout

**可以用于**：
- 需要复杂菜单的应用
- Discord 风格的社区应用

---

### SimpleAuthLayout

**文件**：`packages/frontend/src/layouts/SimpleAuthLayout.tsx`

**用途**：
- 简化的认证布局
- 没有认证检查

**为什么未使用**：
- AuthLayout 提供了更多功能（认证检查、加载状态）

---

### SimpleBottomNavLayout

**文件**：`packages/frontend/src/layouts/SimpleBottomNavLayout.tsx`

**用途**：
- 简化的底部导航
- 5 个固定菜单项

**为什么未使用**：
- 应用选择了 ModernLayout

---

### NewAdaptiveLayout

**文件**：`packages/frontend/src/layouts/NewAdaptiveLayout.tsx`

**用途**：
- 包装器组件
- 确保所有页面使用 BottomNavLayout

**为什么未使用**：
- 应用选择了 ModernLayout

---

## 4. 布局的调用流程

### 应用启动流程

```
1. 用户访问应用
   ↓
2. main.tsx 加载 App 组件
   ↓
3. App.tsx 初始化
   ├─ 加载 CSS 文件
   ├─ 初始化 ThemeProvider
   ├─ 初始化 AuthProvider
   └─ 初始化 RouterProvider
   ↓
4. RouterProvider 加载 router 配置
   ↓
5. 根据 URL 匹配路由
   ├─ 如果 URL 是 /auth/login
   │  └─ 渲染 AuthLayout
   │     └─ 渲染 LoginPage
   │
   └─ 如果 URL 是 /dashboard
      └─ 检查认证（ProtectedRoute）
         └─ 渲染 ModernLayout
            └─ 渲染 DashboardPage
   ↓
6. 布局渲染
   ├─ 渲染导航栏
   ├─ 渲染侧边栏
   ├─ 渲染 <Outlet /> （子页面）
   └─ 应用样式
```

---

## 5. 路由配置详解

### 认证路由

```typescript
{
  path: '/auth',
  element: <AuthLayout />,
  children: [
    {
      path: 'login',
      element: <LoginPage />,
    },
    {
      path: 'register',
      element: <RegisterPage />,
    },
  ],
}
```

**URL 映射**：
- `/auth/login` → AuthLayout + LoginPage
- `/auth/register` → AuthLayout + RegisterPage

**流程**：
1. 用户访问 `/auth/login`
2. AuthLayout 检查用户是否已登录
3. 如果已登录，重定向到 `/dashboard`
4. 如果未登录，渲染 LoginPage

---

### 主应用路由

```typescript
{
  path: '/',
  element: (
    <ProtectedRoute>
      <ModernLayout showInfoPanel={true} />
    </ProtectedRoute>
  ),
  children: [
    { path: 'dashboard', element: <DashboardPage /> },
    { path: 'my', element: <MyPage /> },
    { path: 'bounty-tasks', element: <BountyTasksPage /> },
    // ... 更多页面
  ],
}
```

**URL 映射**：
- `/dashboard` → ModernLayout + DashboardPage
- `/my` → ModernLayout + MyPage
- `/bounty-tasks` → ModernLayout + BountyTasksPage
- `/admin/users` → ModernLayout + UserManagementPage
- 等等...

**流程**：
1. 用户访问 `/dashboard`
2. ProtectedRoute 检查用户是否已认证
3. 如果未认证，重定向到 `/auth/login`
4. 如果已认证，渲染 ModernLayout
5. ModernLayout 渲染 DashboardPage 到 `<Outlet />`

---

## 6. 布局中的关键组件

### ModernLayout 的关键部分

```typescript
// packages/frontend/src/layouts/ModernLayout.tsx

export const ModernLayout: React.FC<ModernLayoutProps> = ({ 
  showInfoPanel = false 
}) => {
  // 1. 获取主题和认证信息
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  
  // 2. 管理菜单状态
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  
  // 3. 响应式检测
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
  }, []);
  
  // 4. 返回布局结构
  return (
    <Layout className={`modern-layout theme-${theme.mode}`}>
      {/* 顶部导航栏 */}
      <Header className="modern-header">
        {/* Logo, Search, Notifications, User Menu */}
      </Header>
      
      <Layout className="modern-layout-body">
        {/* 左侧导航栏 */}
        <Sider className="modern-sidebar">
          <Menu items={menuItems} />
        </Sider>
        
        {/* 主内容区 */}
        <Content className="modern-content">
          <div className="content-wrapper glass-card">
            <Outlet />  {/* 子页面在这里渲染 */}
          </div>
        </Content>
        
        {/* 右侧信息面板（可选） */}
        {showInfoPanel && !isMobile && (
          <Sider className="modern-info-panel">
            {/* 在线用户、活动等 */}
          </Sider>
        )}
      </Layout>
      
      {/* 移动端底部导航 */}
      {isMobile && (
        <div className="modern-mobile-nav">
          {/* 移动端菜单 */}
        </div>
      )}
    </Layout>
  );
};
```

---

## 7. 布局中的 Outlet

### 什么是 Outlet？

`<Outlet />` 是 React Router 的特殊组件，用于渲染子路由的内容。

```typescript
// 在 ModernLayout 中
<Content className="modern-content">
  <div className="content-wrapper glass-card">
    <Outlet />  {/* 子页面在这里渲染 */}
  </div>
</Content>
```

### Outlet 的工作原理

```
路由配置：
{
  path: '/',
  element: <ModernLayout />,
  children: [
    { path: 'dashboard', element: <DashboardPage /> },
  ],
}

当用户访问 /dashboard 时：
1. ModernLayout 被渲染
2. <Outlet /> 被替换为 <DashboardPage />
3. 最终结果：
   <ModernLayout>
     <Header />
     <Sider />
     <Content>
       <DashboardPage />  {/* Outlet 被替换 */}
     </Content>
   </ModernLayout>
```

---

## 8. 布局的样式文件

### ModernLayout.css

**文件**：`packages/frontend/src/layouts/ModernLayout.css`

**包含**：
- `.modern-layout` - 主容器样式
- `.modern-header` - 顶部导航栏样式
- `.modern-sidebar` - 侧边栏样式
- `.modern-content` - 内容区样式
- `.modern-info-panel` - 信息面板样式
- `.modern-mobile-nav` - 移动端导航样式

**使用**：
```typescript
<Layout className={`modern-layout theme-${theme.mode}`}>
  <Header className="modern-header">
    {/* ... */}
  </Header>
  {/* ... */}
</Layout>
```

---

## 9. 布局的菜单配置

### ModernLayout 的菜单项

```typescript
const mainMenuItems = [
  {
    key: '/dashboard',
    icon: <HomeOutlined />,
    label: '首页',
    onClick: () => navigate('/dashboard'),
  },
  {
    key: '/my',
    icon: <UserOutlined />,
    label: '我的工作台',
    onClick: () => navigate('/my'),
  },
  {
    key: '/bounty-tasks',
    icon: <GiftOutlined />,
    label: '赏金任务',
    onClick: () => navigate('/bounty-tasks'),
  },
  {
    key: 'ranking',
    icon: <TrophyOutlined />,
    label: '排行榜',
    children: [
      {
        key: '/ranking',
        label: '排行榜',
        onClick: () => navigate('/ranking'),
      },
      {
        key: '/ranking/original',
        label: '原版风格',
        onClick: () => navigate('/ranking/original'),
      },
    ],
  },
];

// 管理员菜单（仅 super_admin 可见）
const adminMenuItems = user?.role === 'super_admin' ? [
  {
    key: 'admin',
    icon: <ControlOutlined />,
    label: '管理中心',
    children: [
      { key: '/admin/users', label: '用户管理', onClick: () => navigate('/admin/users') },
      { key: '/admin/groups', label: '组群管理', onClick: () => navigate('/admin/groups') },
      // ... 更多管理菜单
    ],
  },
] : [];
```

---

## 10. 布局的响应式设计

### 响应式检测

```typescript
useEffect(() => {
  const checkMobile = () => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile) {
      setCollapsed(true);  // 移动端自动折叠侧边栏
    }
  };

  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

### 响应式行为

| 屏幕宽度 | 行为 |
|---------|------|
| < 768px | 移动端模式 |
| | - 侧边栏隐藏 |
| | - 显示底部导航 |
| | - 隐藏用户名 |
| | - 隐藏信息面板 |
| ≥ 768px | 桌面端模式 |
| | - 侧边栏显示 |
| | - 隐藏底部导航 |
| | - 显示用户名 |
| | - 显示信息面板（如果启用） |

---

## 11. 布局的主题支持

### 主题类名

```typescript
<Layout className={`modern-layout theme-${theme.mode}`}>
```

**可能的类名**：
- `modern-layout theme-light` - 亮色主题
- `modern-layout theme-dark` - 暗色主题
- `modern-layout theme-cyberpunk` - 赛博朋克主题

### 主题切换

```typescript
// 在 BottomNavLayout 中
<Dropdown
  menu={{
    items: [
      { key: 'light', label: '亮色', onClick: () => setThemeMode('light') },
      { key: 'dark', label: '暗色', onClick: () => setThemeMode('dark') },
      { key: 'cyberpunk', label: '赛博', onClick: () => setThemeMode('cyberpunk') },
    ],
  }}
>
  <Button type="text" icon={<SunOutlined />} />
</Dropdown>
```

---

## 12. 完整的页面加载流程

### 用户访问 /dashboard 的完整流程

```
1. 用户在浏览器中输入 http://localhost:5173/dashboard
   ↓
2. React Router 匹配路由
   ├─ 匹配到 path: '/'
   ├─ 检查 ProtectedRoute（认证检查）
   └─ 如果已认证，继续
   ↓
3. 渲染 ModernLayout
   ├─ 初始化状态（collapsed, openKeys, isMobile）
   ├─ 检测响应式（768px 断点）
   ├─ 获取主题信息
   ├─ 获取用户信息
   └─ 返回 JSX
   ↓
4. ModernLayout 的 JSX 被渲染
   ├─ 渲染 Header
   │  ├─ Logo
   │  ├─ Search Bar
   │  ├─ Notification Badge
   │  └─ User Avatar Dropdown
   ├─ 渲染 Sider（侧边栏）
   │  └─ Menu（菜单项）
   ├─ 渲染 Content（内容区）
   │  └─ <Outlet />
   │     └─ 被替换为 <DashboardPage />
   └─ 如果是移动端，渲染底部导航
   ↓
5. DashboardPage 被渲染
   ├─ 执行 useEffect 钩子
   ├─ 加载数据
   └─ 显示内容
   ↓
6. 应用完全加载
   ├─ 所有样式应用
   ├─ 所有交互可用
   └─ 用户可以与应用交互
```

---

## 13. 总结

### 当前使用的布局

| 布局 | 用途 | 调用位置 | 状态 |
|------|------|--------|------|
| **ModernLayout** | 主应用布局 | router/index.tsx | ✅ 使用中 |
| **AuthLayout** | 认证页面 | router/index.tsx | ✅ 使用中 |
| BottomNavLayout | 底部导航 | 未使用 | ❌ 备用 |
| DiscordLayout | Discord 风格 | 未使用 | ❌ 备用 |
| SimpleAuthLayout | 简化认证 | 未使用 | ❌ 备用 |
| SimpleBottomNavLayout | 简化底部导航 | 未使用 | ❌ 备用 |
| NewAdaptiveLayout | 包装器 | 未使用 | ❌ 备用 |

### 关键要点

1. **布局是路由的包装器** - 为页面提供统一的结构
2. **Outlet 是子页面的渲染位置** - 不同的页面在同一位置渲染
3. **ModernLayout 是主要布局** - 为大多数页面提供导航和结构
4. **AuthLayout 是认证布局** - 为登录/注册页面提供布局
5. **响应式设计** - 自动适应不同屏幕尺寸
6. **主题支持** - 支持 Light、Dark、Cyberpunk 三种主题

---

## 14. 如何添加新页面

### 步骤 1：创建页面组件

```typescript
// pages/NewPage.tsx
export const NewPage: React.FC = () => {
  return <div>New Page Content</div>;
};
```

### 步骤 2：在路由中添加

```typescript
// router/index.tsx
import { NewPage } from '../pages/NewPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <ModernLayout showInfoPanel={true} />
      </ProtectedRoute>
    ),
    children: [
      // ... 其他路由
      {
        path: 'new-page',
        element: <NewPage />,
      },
    ],
  },
]);
```

### 步骤 3：在菜单中添加（可选）

```typescript
// layouts/ModernLayout.tsx
const mainMenuItems = [
  // ... 其他菜单项
  {
    key: '/new-page',
    icon: <FileOutlined />,
    label: '新页面',
    onClick: () => navigate('/new-page'),
  },
];
```

### 步骤 4：访问页面

- URL: `http://localhost:5173/new-page`
- 页面会自动使用 ModernLayout 的导航和结构

---

## 15. 常见问题

### Q: 为什么我的页面没有导航栏？
**A**: 检查路由配置。页面必须在 ModernLayout 的 children 中才能显示导航栏。

### Q: 如何隐藏侧边栏？
**A**: 在 ModernLayout 中修改 `collapsed` 状态或使用 CSS 隐藏。

### Q: 如何添加新的菜单项？
**A**: 在 ModernLayout 的 `mainMenuItems` 或 `adminMenuItems` 中添加新项。

### Q: 如何改变布局？
**A**: 在 router/index.tsx 中将 `<ModernLayout />` 替换为其他布局（如 `<BottomNavLayout />`）。

### Q: 如何自定义布局样式？
**A**: 修改 `ModernLayout.css` 或在 ModernLayout.tsx 中添加内联样式。
