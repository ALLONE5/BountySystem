# 赏金猎人平台 - 前端

## 技术栈

- **框架**: React 18 + TypeScript
- **路由**: React Router v6
- **状态管理**: Zustand (with persist middleware)
- **UI组件库**: Ant Design
- **HTTP客户端**: Axios
- **构建工具**: Vite

## 项目结构

```
src/
├── api/              # API 客户端和接口
│   ├── client.ts     # Axios 实例配置
│   └── auth.ts       # 认证相关 API
├── components/       # 可复用组件
│   └── ProtectedRoute.tsx  # 路由守卫组件
├── layouts/          # 布局组件
│   ├── MainLayout.tsx      # 主应用布局
│   └── AuthLayout.tsx      # 认证页面布局
├── pages/            # 页面组件
│   ├── auth/         # 认证相关页面
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   └── DashboardPage.tsx   # 仪表板页面
├── router/           # 路由配置
│   └── index.tsx
├── store/            # 状态管理
│   └── authStore.ts  # 认证状态
├── types/            # TypeScript 类型定义
│   └── index.ts
├── App.tsx           # 根组件
└── main.tsx          # 应用入口
```

## 功能特性

### 已实现

1. **项目基础架构**
   - React + TypeScript 项目配置
   - Vite 构建工具配置
   - Ant Design UI 组件库集成

2. **路由系统**
   - React Router 配置
   - 路由守卫（ProtectedRoute）
   - 认证路由和主应用路由分离

3. **状态管理**
   - Zustand 状态管理
   - 认证状态持久化（localStorage）

4. **API 客户端**
   - Axios 实例配置
   - 请求拦截器（自动添加 JWT token）
   - 响应拦截器（处理 401 错误）

5. **布局系统**
   - 主应用布局（带侧边栏和顶部导航）
   - 认证页面布局
   - 响应式设计

6. **认证页面**
   - 登录页面
   - 注册页面
   - 表单验证

### 待实现

- 任务管理页面
- 赏金任务浏览
- 排名页面
- 管理员功能
- 通知系统
- 任务可视化（甘特图、看板等）

## 开发指南

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm test
```

## API 配置

前端通过 Vite 代理将 `/api` 请求转发到后端服务器（默认 http://localhost:3000）。

配置位于 `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## 认证流程

1. 用户在登录页面输入凭据
2. 前端调用 `/api/auth/login` 接口
3. 后端验证成功后返回 JWT token 和用户信息
4. 前端将 token 和用户信息存储到 Zustand store（持久化到 localStorage）
5. 后续请求自动在 header 中携带 token
6. 如果 token 过期（401 响应），自动清除认证状态并重定向到登录页

## 路由守卫

使用 `ProtectedRoute` 组件保护需要认证的路由：

```tsx
<ProtectedRoute>
  <MainLayout />
</ProtectedRoute>
```

支持基于角色的访问控制：

```tsx
<ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
  <AdminPage />
</ProtectedRoute>
```

## 下一步

1. 实现任务管理相关页面
2. 集成 WebSocket 实现实时通知
3. 添加任务可视化组件
4. 完善用户个人信息管理
5. 实现管理员功能界面
