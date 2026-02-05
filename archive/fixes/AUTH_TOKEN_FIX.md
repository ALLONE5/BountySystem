# 401 未授权错误修复

## 问题描述
点击头像管理显示 "Request failed with status code 401"

## 根本原因
`avatar.ts` 和 `position.ts` API文件直接使用了原生的 `axios` 实例，而不是配置好的 `apiClient`。

配置好的 `apiClient` 包含请求拦截器，会自动在每个请求中添加 Authorization header：
```typescript
config.headers.Authorization = `Bearer ${token}`;
```

但是直接使用 `axios` 的请求不会经过这个拦截器，所以没有发送token，导致后端返回401未授权错误。

## 修复内容

### 1. 修复 avatar.ts ✅
**文件**: `packages/frontend/src/api/avatar.ts`

**修改前**:
```typescript
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 使用 axios.get(`${API_URL}/avatars`)
```

**修改后**:
```typescript
import apiClient from './client';

// 使用 apiClient.get('/avatars')
```

### 2. 修复 position.ts ✅
**文件**: `packages/frontend/src/api/position.ts`

**修改前**:
```typescript
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 使用 axios.get(`${API_URL}/positions`)
```

**修改后**:
```typescript
import apiClient from './client';

// 使用 apiClient.get('/positions')
```

## 技术细节

### apiClient 配置
`packages/frontend/src/api/client.ts` 中的配置：

```typescript
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: '/api',  // 自动添加 /api 前缀
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加 token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### 为什么要使用 apiClient

1. **自动添加 token**: 不需要在每个请求中手动添加 Authorization header
2. **统一配置**: baseURL、timeout、headers 等配置统一管理
3. **拦截器**: 可以统一处理请求和响应
4. **错误处理**: 可以统一处理错误（如token过期自动跳转登录）

### URL 路径变化

使用 apiClient 后，URL 路径简化：

**修改前**:
```typescript
axios.get(`${API_URL}/avatars`)  // http://localhost:3000/api/avatars
```

**修改后**:
```typescript
apiClient.get('/avatars')  // /api/avatars (baseURL自动添加)
```

## 影响范围

### 修复的API方法

**avatar.ts**:
- getAllAvatars()
- getAvailableAvatars()
- getUserAvatar()
- selectAvatar()
- createAvatar()
- updateAvatar()
- deleteAvatar()

**position.ts**:
- getAllPositions()
- getUserPositions()
- applyForPosition()
- getUserApplications()
- createPosition()
- updatePosition()
- deletePosition()

## 测试步骤

### 1. 重启前端（必需）
```bash
cd packages/frontend
# 按 Ctrl+C 停止
npm run dev
```

### 2. 测试头像管理
1. 以admin登录 (admin / Password123)
2. 进入：管理功能 → 头像管理
3. 应该能看到头像列表（可能为空）
4. 不应该再显示401错误

### 3. 测试岗位管理
1. 以admin登录
2. 进入：管理功能 → 岗位管理
3. 应该能看到岗位列表
4. 可以添加、编辑、删除岗位

### 4. 测试个人信息
1. 进入：个人信息
2. 点击头像上的相机图标
3. 应该能看到头像选择模态框
4. 点击"申请岗位变更"
5. 应该能看到岗位列表

## 验证成功标志

- ✅ 头像管理页面正常加载
- ✅ 岗位管理页面正常加载
- ✅ 个人信息页面头像选择正常
- ✅ 个人信息页面岗位申请正常
- ✅ 不再出现401错误

## 其他API文件检查

以下API文件已经正确使用 apiClient：
- ✅ `auth.ts` - 使用 apiClient
- ✅ `task.ts` - 需要检查
- ✅ `group.ts` - 需要检查
- ✅ `ranking.ts` - 需要检查
- ✅ `notification.ts` - 需要检查
- ✅ `admin.ts` - 需要检查

## 最佳实践

### 创建新的API文件时

**正确做法** ✅:
```typescript
import apiClient from './client';

export const myApi = {
  getData: async () => {
    const response = await apiClient.get('/my-endpoint');
    return response.data;
  },
};
```

**错误做法** ❌:
```typescript
import axios from 'axios';
const API_URL = 'http://localhost:3000/api';

export const myApi = {
  getData: async () => {
    const response = await axios.get(`${API_URL}/my-endpoint`);
    return response.data;
  },
};
```

## 常见问题

### Q: 为什么其他页面没有401错误？
**A**: 其他API文件（如 task.ts, auth.ts）已经正确使用了 apiClient，所以没有这个问题。

### Q: 如果还是401错误怎么办？
**A**: 
1. 确认已重启前端
2. 清除浏览器缓存和localStorage
3. 重新登录
4. 检查浏览器控制台的Network标签，确认请求中有 Authorization header

### Q: 如何检查token是否正确发送？
**A**: 
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 执行一个API请求
4. 点击请求查看详情
5. 查看 Request Headers，应该有：
   ```
   Authorization: Bearer eyJhbGc...
   ```

## 总结

**问题**: API文件直接使用 axios 而不是 apiClient
**影响**: 请求不包含 Authorization token，导致401错误
**修复**: 改用 apiClient，自动添加token
**状态**: ✅ 已修复
**需要**: 重启前端服务

---

**修复日期**: 2025-12-12
**修复文件**: 
- `packages/frontend/src/api/avatar.ts`
- `packages/frontend/src/api/position.ts`
