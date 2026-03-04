# 登录按钮无反应 - 快速参考

## 问题
点击登录按钮没有反应

## 根本原因
1. 前端发送 `email` 字段，后端期望 `username` 字段
2. Token 存储在 `localStorage` 但 API 拦截器从 `zustand store` 读取
3. 初始化时 token 未同步到 `zustand store`

## 解决方案

### 文件 1: `packages/frontend/src/contexts/AuthContext.tsx`
```typescript
// 1. 添加导入
import { useAuthStore } from '../store/authStore';

// 2. 修改 login 函数
const login = async (email: string, password: string) => {
  const response = await authApi.login({ username: email, password });
  localStorage.setItem('token', response.token);
  useAuthStore.getState().setAuth(response.token, response.user);
  setUser(response.user);
};

// 3. 修改 register 函数
const register = async (userData) => {
  const response = await authApi.register(userData);
  localStorage.setItem('token', response.token);
  useAuthStore.getState().setAuth(response.token, response.user);
  setUser(response.user);
};

// 4. 修改 logout 函数
const logout = () => {
  localStorage.removeItem('token');
  useAuthStore.getState().clearAuth();
  setUser(null);
};

// 5. 修改初始化
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

### 文件 2: `packages/frontend/src/pages/auth/LoginPage.tsx`
```typescript
// 1. 修改表单字段
<Form.Item name="username">
  <Input placeholder="邮箱或用户名" />
</Form.Item>

// 2. 修改 onFinish
const onFinish = async (values: any) => {
  await login(values.username, values.password);
};
```

### 文件 3: `packages/frontend/src/pages/auth/SimpleLoginPage.tsx`
```typescript
// 1. 添加导入
import { useAuthStore } from '../../store/authStore';

// 2. 登录成功时同步 token
if (response.ok) {
  localStorage.setItem('token', data.token);
  useAuthStore.getState().setAuth(data.token, data.user);
}
```

## 验证
```bash
# 检查是否有 TypeScript 错误
npm run type-check

# 或在浏览器中测试
# 1. 打开 http://localhost:5173/auth/login
# 2. 输入用户名: dev_test_840023
# 3. 输入密码: password123
# 4. 点击登录
# 5. 应该跳转到 /dashboard
```

## 关键点
- ✅ 表单字段必须是 `username`（不是 `email`）
- ✅ 后端期望 `{ username, password }`
- ✅ Token 必须同时存储到 `localStorage` 和 `zustand store`
- ✅ 初始化时必须同步 token
- ✅ API 拦截器从 `zustand store` 读取 token

## 修改状态
- [x] AuthContext 已修改
- [x] LoginPage 已修改
- [x] SimpleLoginPage 已修改
- [x] 所有文件无错误
- [ ] 需要测试
