# 登录按钮无反应问题修复

## 问题分析

登录按钮点击没有反应的原因是前后端字段不匹配和 token 存储不同步：

1. **字段不匹配**：
   - 前端发送：`{ email, password }`
   - 后端期望：`{ username, password }`
   - 后端的 `username` 字段可以接受邮箱或用户名

2. **Token 存储不同步**：
   - `AuthContext` 使用 `localStorage` 存储 token
   - API 客户端拦截器从 `useAuthStore` (zustand) 获取 token
   - 两个存储不同步导致请求无法携带 token

## 修复方案

### 1. 修复 AuthContext (`packages/frontend/src/contexts/AuthContext.tsx`)

**变更内容：**
- 导入 `useAuthStore`
- 在 `login()` 和 `register()` 中同时更新 `localStorage` 和 `zustand store`
- 在 `logout()` 中同时清除两个存储
- 在初始化时同步 token 到 zustand store

**关键代码：**
```typescript
// 导入 zustand store
import { useAuthStore } from '../store/authStore';

// 在 login 中同步 token
const login = async (email: string, password: string) => {
  const response = await authApi.login({ username: email, password });
  localStorage.setItem('token', response.token);
  useAuthStore.getState().setAuth(response.token, response.user);
  setUser(response.user);
};

// 在初始化时同步 token
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

### 2. 修复 LoginPage (`packages/frontend/src/pages/auth/LoginPage.tsx`)

**变更内容：**
- 将表单字段从 `email` 改为 `username`
- 更新 `onFinish` 函数以使用 `values.username`
- 更新占位符文本为"邮箱或用户名"

**关键代码：**
```typescript
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

const onFinish = async (values: any) => {
  await login(values.username, values.password);
};
```

## 修复后的流程

1. 用户在登录页面输入邮箱/用户名和密码
2. 点击登录按钮，表单提交 `{ username, password }`
3. `AuthContext.login()` 调用 `authApi.login({ username, password })`
4. API 请求发送到后端 `/api/auth/login`
5. 后端验证成功，返回 `{ user, token }`
6. 前端同时更新 `localStorage` 和 `zustand store`
7. API 拦截器从 `zustand store` 获取 token，后续请求自动携带
8. 登录成功，跳转到 `/dashboard`

## 文件修改

- ✅ `packages/frontend/src/contexts/AuthContext.tsx` - 同步 token 存储
- ✅ `packages/frontend/src/pages/auth/LoginPage.tsx` - 修复字段名和表单配置

## 测试步骤

1. 打开登录页面 `http://localhost:5173/auth/login`
2. 输入测试账户邮箱/用户名：`dev_test_840023`
3. 输入密码
4. 点击登录按钮
5. 应该成功登录并跳转到仪表板

## 相关配置

- 后端登录路由：`packages/backend/src/routes/auth.routes.ts`
- API 客户端：`packages/frontend/src/api/client.ts`
- Auth API：`packages/frontend/src/api/auth.ts`
