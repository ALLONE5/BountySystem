# 登录功能修复验证清单

## 修复内容总结

### 1. 前后端字段匹配问题 ✅
- **问题**：前端发送 `email` 字段，后端期望 `username` 字段
- **修复**：
  - 更新 `LoginPage.tsx` 表单字段从 `email` 改为 `username`
  - 更新 `AuthContext.tsx` 中的 `login()` 函数调用 `authApi.login({ username: email, password })`
  - 更新占位符文本为"邮箱或用户名"

### 2. Token 存储不同步问题 ✅
- **问题**：
  - `AuthContext` 使用 `localStorage` 存储 token
  - API 拦截器从 `useAuthStore` (zustand) 获取 token
  - 两个存储不同步导致请求无法携带 token
- **修复**：
  - 导入 `useAuthStore` 到 `AuthContext`
  - 在 `login()` 中同时更新 `localStorage` 和 `useAuthStore`
  - 在 `register()` 中同时更新 `localStorage` 和 `useAuthStore`
  - 在 `logout()` 中同时清除 `localStorage` 和 `useAuthStore`
  - 在初始化时同步 token 到 `useAuthStore`

## 修改的文件

### 1. `packages/frontend/src/contexts/AuthContext.tsx`
```typescript
// 新增导入
import { useAuthStore } from '../store/authStore';

// 修改 login 函数
const login = async (email: string, password: string) => {
  const response = await authApi.login({ username: email, password });
  localStorage.setItem('token', response.token);
  useAuthStore.getState().setAuth(response.token, response.user);
  setUser(response.user);
};

// 修改 register 函数
const register = async (userData) => {
  const response = await authApi.register(userData);
  localStorage.setItem('token', response.token);
  useAuthStore.getState().setAuth(response.token, response.user);
  setUser(response.user);
};

// 修改 logout 函数
const logout = () => {
  localStorage.removeItem('token');
  useAuthStore.getState().clearAuth();
  setUser(null);
};

// 修改初始化逻辑
useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      useAuthStore.getState().setAuth(token, null as any);
      const userData = await authApi.getCurrentUser();
      useAuthStore.getState().setAuth(token, userData);
    }
  };
  checkAuth();
}, []);
```

### 2. `packages/frontend/src/pages/auth/LoginPage.tsx`
```typescript
// 修改表单字段
<Form.Item
  name="username"
  rules={[
    { required: true, message: '请输入邮箱或用户名！' },
  ]}
>
  <Input
    placeholder="邮箱或用户名"
  />
</Form.Item>

// 修改 onFinish 函数
const onFinish = async (values: any) => {
  await login(values.username, values.password);
};
```

## 验证步骤

### 步骤 1：检查前端代码
- [ ] `AuthContext.tsx` 导入了 `useAuthStore`
- [ ] `login()` 函数调用 `useAuthStore.getState().setAuth()`
- [ ] `register()` 函数调用 `useAuthStore.getState().setAuth()`
- [ ] `logout()` 函数调用 `useAuthStore.getState().clearAuth()`
- [ ] 初始化逻辑同步 token 到 `useAuthStore`
- [ ] `LoginPage.tsx` 表单字段名为 `username`
- [ ] `LoginPage.tsx` 占位符文本为"邮箱或用户名"

### 步骤 2：检查后端配置
- [ ] 后端登录路由期望 `username` 字段
- [ ] 后端支持邮箱或用户名登录
- [ ] 后端返回正确的 token 和 user 信息

### 步骤 3：浏览器测试
1. 打开浏览器开发者工具 (F12)
2. 打开 Console 标签
3. 打开登录页面 `http://localhost:5173/auth/login`
4. 输入测试账户：
   - 邮箱/用户名：`dev_test_840023`
   - 密码：`password123`
5. 点击登录按钮
6. 检查以下内容：
   - [ ] 按钮显示加载状态
   - [ ] 没有 JavaScript 错误
   - [ ] 成功消息显示"登录成功"
   - [ ] 页面跳转到 `/dashboard`
   - [ ] `localStorage` 中有 `token` 字段
   - [ ] `localStorage` 中有 `auth-storage` 字段（zustand store）

### 步骤 4：网络请求检查
1. 打开浏览器开发者工具 Network 标签
2. 点击登录按钮
3. 检查 POST 请求到 `/api/auth/login`：
   - [ ] 请求体包含 `{ username: "...", password: "..." }`
   - [ ] 响应状态为 200
   - [ ] 响应包含 `{ user: {...}, token: "..." }`

### 步骤 5：后续请求检查
1. 登录成功后，打开任何需要认证的页面
2. 打开 Network 标签
3. 检查任何 API 请求：
   - [ ] 请求头包含 `Authorization: Bearer <token>`
   - [ ] 请求成功返回 200

## 常见问题排查

### 问题 1：登录按钮点击无反应
**可能原因：**
- 表单验证失败（检查邮箱格式）
- API 请求超时
- 后端服务未启动

**排查步骤：**
1. 打开浏览器 Console，查看是否有错误
2. 检查 Network 标签，看是否有请求发出
3. 确保后端服务运行在 `http://localhost:3000`

### 问题 2：登录失败，显示"Invalid username or password"
**可能原因：**
- 用户名/邮箱不存在
- 密码错误
- 用户被禁用

**排查步骤：**
1. 确认测试账户存在
2. 确认密码正确
3. 检查后端日志

### 问题 3：登录成功但无法访问其他页面
**可能原因：**
- Token 未正确存储
- Token 未正确传递到 API 请求
- Token 已过期

**排查步骤：**
1. 检查 `localStorage` 中是否有 `token`
2. 检查 Network 标签中的请求头是否包含 `Authorization`
3. 检查 token 是否过期

## 相关文件

- 后端登录路由：`packages/backend/src/routes/auth.routes.ts`
- 前端 API 客户端：`packages/frontend/src/api/client.ts`
- 前端 Auth API：`packages/frontend/src/api/auth.ts`
- 前端 Auth Store：`packages/frontend/src/store/authStore.ts`
- 前端 Auth Context：`packages/frontend/src/contexts/AuthContext.tsx`
- 前端登录页面：`packages/frontend/src/pages/auth/LoginPage.tsx`

## 测试账户

- **用户名/邮箱**：`dev_test_840023`
- **密码**：`password123`（或根据实际设置）

## 完成标记

- [x] 修复前后端字段不匹配
- [x] 修复 Token 存储不同步
- [x] 更新 AuthContext
- [x] 更新 LoginPage
- [x] 验证代码无错误
- [ ] 测试登录功能
- [ ] 测试后续 API 请求
- [ ] 测试登出功能
