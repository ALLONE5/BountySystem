# 认证和路由守卫实现文档

## 概述

本文档描述了赏金猎人平台前端的认证系统和基于角色的路由守卫实现。

## 实现的功能

### 1. 登录/注册页面

#### 登录页面 (`pages/auth/LoginPage.tsx`)
- 用户名和密码输入
- 表单验证
- 错误处理和用户反馈
- 登录成功后自动跳转到仪表板
- 已登录用户自动重定向

#### 注册页面 (`pages/auth/RegisterPage.tsx`)
- 用户名、邮箱、密码输入
- 密码确认验证
- 表单验证（最小长度、邮箱格式等）
- 注册成功后自动登录并跳转
- 已登录用户自动重定向

### 2. JWT 存储和刷新

#### 状态管理 (`store/authStore.ts`)
- 使用 Zustand 管理认证状态
- 使用 persist 中间件持久化到 localStorage
- 存储内容：
  - `token`: JWT 令牌
  - `user`: 用户信息
  - `isAuthenticated`: 认证状态标志

#### API 客户端 (`api/client.ts`)
- Axios 实例配置
- 请求拦截器：自动添加 Authorization header
- 基础 URL 配置：`/api`
- 超时设置：10秒

#### Token 刷新机制 (`utils/tokenRefresh.ts`)
- 自动检测 401 错误
- 智能刷新队列：避免并发刷新
- 刷新失败时清除认证状态
- 自动重试失败的请求
- 排除登录/注册请求的刷新逻辑

**工作流程：**
1. 请求返回 401 错误
2. 检查是否正在刷新（避免重复刷新）
3. 调用 `/api/auth/refresh` 端点
4. 更新存储的 token
5. 重试原始请求
6. 如果刷新失败，清除认证状态并重定向到登录页

### 3. 基于角色的路由守卫

#### ProtectedRoute 组件 (`components/ProtectedRoute.tsx`)

**功能：**
- 验证用户是否已登录
- 验证用户角色是否满足要求
- 支持单个角色或多个角色验证
- 未登录用户重定向到登录页
- 角色不匹配用户重定向到仪表板

**使用示例：**

```tsx
// 需要登录
<ProtectedRoute>
  <MainLayout />
</ProtectedRoute>

// 需要特定角色
<ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
  <AdminPage />
</ProtectedRoute>

// 需要多个角色之一
<ProtectedRoute requiredRole={[UserRole.POSITION_ADMIN, UserRole.SUPER_ADMIN]}>
  <AdminPanel />
</ProtectedRoute>
```

#### 权限 Hook (`hooks/usePermission.ts`)

提供便捷的权限检查方法：

```tsx
const {
  user,              // 当前用户
  hasRole,           // 检查是否有指定角色
  isAdmin,           // 是否是管理员（职位或超级）
  isSuperAdmin,      // 是否是超级管理员
  isPositionAdmin,   // 是否是职位管理员
  canAccessAdminPanel,    // 是否可以访问管理面板
  canManageAllUsers,      // 是否可以管理所有用户
  canManageAllTasks,      // 是否可以管理所有任务
} = usePermission();
```

**使用示例：**

```tsx
const MyComponent = () => {
  const { canAccessAdminPanel } = usePermission();

  return (
    <div>
      {canAccessAdminPanel() && (
        <Button onClick={() => navigate('/admin')}>
          管理面板
        </Button>
      )}
    </div>
  );
};
```

## 用户角色

系统支持三种用户角色：

1. **USER** (`user`): 普通用户
   - 可以访问个人界面
   - 可以发布和承接任务
   - 可以查看排名

2. **POSITION_ADMIN** (`position_admin`): 职位管理员
   - 拥有普通用户的所有权限
   - 可以管理特定岗位的用户
   - 可以管理特定岗位的任务
   - 可以审核岗位申请

3. **SUPER_ADMIN** (`super_admin`): 超级管理员
   - 拥有系统最高权限
   - 可以管理所有用户
   - 可以管理所有任务
   - 可以修改系统配置

## 路由配置

### 公开路由
- `/auth/login` - 登录页面
- `/auth/register` - 注册页面

### 受保护路由（需要登录）
- `/dashboard` - 个人仪表板
- `/published-tasks` - 发布任务管理
- `/assigned-tasks` - 承接任务管理
- `/bounty-tasks` - 赏金任务浏览
- `/ranking` - 排名页面
- `/notifications` - 通知中心
- `/profile` - 个人信息
- `/settings` - 设置

### 管理员路由（需要管理员角色）
- `/admin/users` - 用户管理
- `/admin/tasks` - 任务管理
- `/admin/approval` - 审核操作

## 安全特性

1. **Token 安全**
   - JWT 存储在 localStorage（持久化）
   - 每个请求自动携带 token
   - Token 过期自动刷新
   - 刷新失败自动登出

2. **路由保护**
   - 未登录用户无法访问受保护路由
   - 角色不匹配自动重定向
   - 已登录用户无法访问登录/注册页

3. **错误处理**
   - 401 错误自动处理
   - 网络错误友好提示
   - 表单验证和错误反馈

## 测试

### 单元测试 (`components/ProtectedRoute.test.tsx`)

测试覆盖：
- ✅ Token 存储和检索
- ✅ 登出时清除认证状态
- ✅ 认证状态持久化
- ✅ 不同用户角色处理

运行测试：
```bash
npm test
```

## API 端点要求

前端期望后端提供以下认证端点：

### POST `/api/auth/login`
**请求：**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应：**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user|position_admin|super_admin",
    "positions": [],
    ...
  }
}
```

### POST `/api/auth/register`
**请求：**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**响应：**
```json
{
  "token": "jwt-token",
  "user": { ... }
}
```

### POST `/api/auth/refresh`
**请求头：**
```
Authorization: Bearer <old-token>
```

**响应：**
```json
{
  "token": "new-jwt-token",
  "user": { ... }
}
```

### GET `/api/auth/me`
**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "user|position_admin|super_admin",
  ...
}
```

### POST `/api/auth/logout`
**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "message": "Logged out successfully"
}
```

## 下一步

1. 实现任务管理页面
2. 添加实时通知功能
3. 实现管理员功能界面
4. 添加用户个人信息编辑
5. 实现任务可视化组件

## 验证需求

本实现满足以下需求：

- ✅ **需求 6.1**: 普通用户可以访问个人界面、发布任务管理、承接任务管理、赏金任务界面和排名界面
- ✅ **需求 6.2**: 职位管理员可以额外访问用户管理界面、任务管理界面和审核操作界面
- ✅ **需求 6.3**: 超级管理员可以访问所有界面并拥有所有用户和任务的管理权限
