# 前端路由刷新404问题修复

## 修复时间
2026-01-05

## 问题描述
所有界面在点击刷新后都会提示"请求的资源不存在"（404错误）。

## 根本原因

### 单页应用（SPA）路由问题

这是一个典型的单页应用部署和开发环境配置问题：

1. **前端使用客户端路由**：React Router 使用 `createBrowserRouter` 创建浏览器路由
   - 路由如：`/dashboard`, `/ranking`, `/admin/users` 等
   - 这些路由只存在于前端，由 React Router 处理

2. **刷新页面的行为**：
   - 用户在 `/dashboard` 页面点击刷新
   - 浏览器向服务器发送 `GET /dashboard` 请求
   - 如果访问的是后端服务器（端口3000），后端没有 `/dashboard` 路由
   - 后端返回404错误

3. **开发环境架构**：
   ```
   前端开发服务器 (Vite)     后端API服务器 (Express)
   http://localhost:5173  →   http://localhost:3000
   
   - 前端处理所有页面路由
   - 前端代理 /api/* 请求到后端
   - 后端只处理 /api/* 路由
   ```

### 问题发生的原因

用户直接访问了 **后端端口（3000）** 而不是 **前端端口（5173/5174）**：

❌ **错误访问方式**：`http://localhost:3000/dashboard`
- 后端没有 `/dashboard` 路由
- 后端返回404

✅ **正确访问方式**：`http://localhost:5173/dashboard` 或 `http://localhost:5174/dashboard`
- 前端开发服务器处理路由
- 前端代理 API 请求到后端

## 解决方案

### 开发环境解决方案

#### 1. 启动前端开发服务器

```bash
# 在项目根目录运行
npm run dev:frontend
```

前端服务器会启动在：
- 默认端口：`http://localhost:5173`
- 如果5173被占用：`http://localhost:5174`（或其他可用端口）

#### 2. 访问正确的端口

✅ **访问前端开发服务器**：
```
http://localhost:5173  （或 5174）
```

❌ **不要直接访问后端**：
```
http://localhost:3000  （这是API服务器，不提供前端页面）
```

#### 3. 同时运行前后端

推荐使用两个终端窗口：

**终端1 - 后端**：
```bash
npm run dev:backend
# 运行在 http://localhost:3000
```

**终端2 - 前端**：
```bash
npm run dev:frontend
# 运行在 http://localhost:5173 或 5174
```

### 生产环境解决方案

在生产环境中，需要配置后端服务器处理前端路由：

#### 方案1：后端服务静态文件（推荐）

修改 `packages/backend/src/index.ts`：

```typescript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... 其他中间件 ...

// 在生产环境中服务前端静态文件
if (config.server.nodeEnv === 'production') {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  
  // 服务静态文件
  app.use(express.static(frontendDistPath));
  
  // 所有非API路由都返回index.html（让前端路由处理）
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// API routes
app.use('/api/auth', authRoutes);
// ... 其他API路由 ...
```

#### 方案2：使用Nginx反向代理

```nginx
server {
    listen 80;
    server_name example.com;

    # 前端静态文件
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理到后端
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 当前状态

✅ **前端开发服务器已启动**：
- 端口：5174（5173被占用）
- URL：`http://localhost:5174`

✅ **后端API服务器运行中**：
- 端口：3000
- URL：`http://localhost:3000/api`

## 验证步骤

### 1. 确认服务运行状态

```bash
# 检查前端服务器
curl http://localhost:5174

# 检查后端API
curl http://localhost:3000/api
```

### 2. 测试前端路由

1. 打开浏览器访问：`http://localhost:5174`
2. 登录系统（admin / Password123）
3. 导航到任意页面（如：排名、个人界面）
4. 点击浏览器刷新按钮（F5 或 Ctrl+R）
5. ✅ 页面应该正常加载，不再显示404错误

### 3. 测试API请求

在浏览器开发者工具的Network标签中：
- API请求应该发送到 `http://localhost:5174/api/*`
- Vite开发服务器会代理到 `http://localhost:3000/api/*`

## 最佳实践

### 开发环境

1. **始终通过前端开发服务器访问应用**
   - 使用 `http://localhost:5173` 或 `http://localhost:5174`
   - 不要直接访问 `http://localhost:3000`

2. **同时运行前后端服务**
   ```bash
   # 终端1
   npm run dev:backend
   
   # 终端2
   npm run dev:frontend
   ```

3. **使用正确的端口**
   - 前端：5173/5174（Vite开发服务器）
   - 后端：3000（Express API服务器）

### 生产环境

1. **构建前端**
   ```bash
   npm run build --workspace=frontend
   ```

2. **配置后端服务静态文件**
   - 添加 `express.static` 中间件
   - 配置 fallback 到 `index.html`

3. **或使用Nginx反向代理**
   - 前端静态文件由Nginx服务
   - API请求代理到后端

## 相关文件

- `packages/frontend/vite.config.ts` - Vite配置，包含代理设置
- `packages/frontend/src/router/index.tsx` - React Router配置
- `packages/backend/src/index.ts` - Express服务器配置
- `package.json` - 项目脚本配置

## 技术说明

### 为什么会出现这个问题？

1. **客户端路由 vs 服务器路由**
   - 客户端路由：由前端JavaScript处理，不向服务器发送请求
   - 服务器路由：每次导航都向服务器请求新页面

2. **刷新页面的特殊性**
   - 正常导航（点击链接）：前端路由处理，不刷新页面
   - 刷新页面（F5）：浏览器向服务器请求当前URL

3. **开发环境的分离架构**
   - 前端和后端是两个独立的服务器
   - 前端通过代理访问后端API
   - 直接访问后端会绕过前端路由

### React Router 的 BrowserRouter

使用 `createBrowserRouter` 创建的路由：
- 使用HTML5 History API
- URL看起来像传统的服务器路由：`/dashboard`, `/admin/users`
- 但实际上是客户端路由，由JavaScript处理
- 需要服务器配置支持（返回index.html给所有路由）

## 总结

✅ **问题原因**：用户直接访问后端端口（3000），后端没有前端路由

✅ **解决方案**：访问前端开发服务器端口（5174）

✅ **当前状态**：
- 前端服务器：`http://localhost:5174` ✅ 运行中
- 后端服务器：`http://localhost:3000/api` ✅ 运行中

✅ **下一步**：
1. 在浏览器中访问 `http://localhost:5174`
2. 登录系统
3. 测试刷新功能 - 应该正常工作

**重要提示**：在开发环境中，始终通过前端开发服务器（端口5174）访问应用，而不是直接访问后端（端口3000）。
