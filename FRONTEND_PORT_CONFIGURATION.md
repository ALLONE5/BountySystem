# 前端端口配置指南

## 核心答案

**前端端口由 `vite.config.ts` 中的 `server.port` 配置决定，当前设置为 5173**

---

## 1. 端口配置的位置

### 主要配置文件：vite.config.ts

```typescript
// packages/frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,  // ← 开发服务器端口
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,  // ← 预览服务器端口
  },
});
```

**关键配置**：
- `server.port: 5173` - 开发模式端口（npm run dev）
- `preview.port: 5173` - 预览模式端口（npm run preview）

---

## 2. 端口决定的优先级

### 优先级顺序（从高到低）

```
1. 命令行参数（最高优先级）
   npm run dev -- --port 5174
   
2. 环境变量
   PORT=5174 npm run dev
   
3. vite.config.ts 配置
   server: { port: 5173 }
   
4. Vite 默认值（最低优先级）
   默认端口：5173
```

---

## 3. 修改端口的方法

### 方法 1：修改 vite.config.ts（推荐）

```typescript
// packages/frontend/vite.config.ts
export default defineConfig({
  server: {
    port: 5174,  // 改为 5174
  },
  preview: {
    port: 5174,  // 预览模式也改为 5174
  },
});
```

**优点**：
- ✅ 永久生效
- ✅ 团队共享配置
- ✅ 开发和预览模式都生效

---

### 方法 2：使用命令行参数（临时）

```bash
# 临时使用 5174 端口
npm run dev -- --port 5174

# 或者
npx vite --port 5174
```

**优点**：
- ✅ 临时修改，不影响配置文件
- ✅ 适合测试不同端口

**缺点**：
- ❌ 每次都需要指定
- ❌ 团队成员需要记住

---

### 方法 3：使用环境变量

```bash
# Windows (CMD)
set PORT=5174 && npm run dev

# Windows (PowerShell)
$env:PORT=5174; npm run dev

# macOS/Linux
PORT=5174 npm run dev
```

**注意**：Vite 使用 `--port` 参数，不是 `PORT` 环境变量

---

### 方法 4：修改 package.json 脚本

```json
{
  "scripts": {
    "dev": "vite --port 5174",
    "dev:5173": "vite --port 5173",
    "dev:5174": "vite --port 5174",
    "preview": "vite preview --port 5174"
  }
}
```

**优点**：
- ✅ 可以定义多个端口选项
- ✅ 团队成员可以选择不同端口

---

## 4. 端口冲突处理

### Vite 的自动端口检测

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    strictPort: false,  // 如果端口被占用，自动尝试下一个端口
  },
});
```

**行为**：
- `strictPort: false`（默认）- 端口被占用时自动尝试 5174, 5175...
- `strictPort: true` - 端口被占用时启动失败

### 端口冲突的解决流程

```
1. 尝试启动 5173 端口
   ↓
2. 如果 5173 被占用
   ├─ strictPort: false → 尝试 5174
   └─ strictPort: true → 启动失败
   ↓
3. 如果 5174 也被占用
   ├─ strictPort: false → 尝试 5175
   └─ strictPort: true → 启动失败
   ↓
4. 继续尝试直到找到可用端口
```

---

## 5. 检查端口占用

### Windows

```cmd
# 检查端口占用
netstat -ano | findstr :5173
netstat -ano | findstr :5174

# 杀死占用端口的进程
taskkill /PID <进程ID> /F
```

### macOS/Linux

```bash
# 检查端口占用
lsof -i :5173
lsof -i :5174

# 杀死占用端口的进程
kill -9 <进程ID>
```

### 跨平台工具

```bash
# 使用 npx 工具检查端口
npx kill-port 5173
npx kill-port 5174
```

---

## 6. 多项目端口管理

### 推荐的端口分配

```
项目类型          端口范围
前端应用         5173-5179
后端 API        3000-3009
数据库          5432, 3306, 27017
Redis          6379
开发工具        8080-8089
```

### 本项目的端口分配

```
服务              端口    配置文件
前端 (Vite)      5173    packages/frontend/vite.config.ts
后端 (Express)   3000    packages/backend/src/config/env.ts
数据库 (MySQL)   3306    packages/backend/.env
Redis           6379    packages/backend/src/config/redis.ts
```

---

## 7. 开发环境配置

### 完整的 vite.config.ts 配置

```typescript
// packages/frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,           // 开发服务器端口
    host: '0.0.0.0',      // 允许外部访问
    open: true,           // 自动打开浏览器
    strictPort: false,    // 端口被占用时自动尝试下一个
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 5173,           // 预览服务器端口
    host: '0.0.0.0',
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

---

## 8. 环境变量配置

### .env 文件（不影响端口）

```bash
# packages/frontend/.env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=赏金猎人平台
```

**注意**：
- ❌ `PORT=5174` 在 Vite 中不生效
- ✅ 使用 `vite.config.ts` 或命令行参数

---

## 9. 生产环境配置

### 构建和预览

```bash
# 构建生产版本
npm run build

# 预览生产版本（使用 preview.port）
npm run preview
```

### Nginx 配置示例

```nginx
# /etc/nginx/sites-available/frontend
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 10. 常见问题和解决方案

### Q1: 为什么我的端口是 5174 而不是 5173？

**可能原因**：
1. 5173 端口被其他应用占用
2. Vite 自动选择了下一个可用端口
3. 之前修改过配置

**解决方案**：
```typescript
// 强制使用 5173
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,  // 端口被占用时报错而不是自动切换
  },
});
```

---

### Q2: 如何让团队使用统一的端口？

**解决方案**：
```typescript
// vite.config.ts - 统一配置
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,  // 强制使用指定端口
  },
});
```

```json
// package.json - 提供多个选项
{
  "scripts": {
    "dev": "vite --port 5173",
    "dev:alt": "vite --port 5174"
  }
}
```

---

### Q3: 端口冲突怎么办？

**解决步骤**：
1. 检查端口占用：`netstat -ano | findstr :5173`
2. 杀死占用进程：`taskkill /PID <PID> /F`
3. 或者使用其他端口：`npm run dev -- --port 5174`

---

### Q4: 如何在不同环境使用不同端口？

**解决方案**：
```typescript
// vite.config.ts
export default defineConfig(({ mode }) => ({
  server: {
    port: mode === 'development' ? 5173 : 5174,
  },
}));
```

---

## 11. 最佳实践

### ✅ 推荐做法

```typescript
// 1. 在 vite.config.ts 中明确指定端口
export default defineConfig({
  server: {
    port: 5173,
    strictPort: false,  // 允许自动切换端口
  },
});

// 2. 提供备用端口选项
// package.json
{
  "scripts": {
    "dev": "vite",
    "dev:5174": "vite --port 5174"
  }
}

// 3. 文档化端口分配
// README.md
// 前端：5173
// 后端：3000
```

### ❌ 避免的做法

```typescript
// ❌ 不要硬编码在多个地方
// ❌ 不要使用随机端口
// ❌ 不要忽略端口冲突
```

---

## 12. 调试端口问题

### 检查当前配置

```bash
# 查看 Vite 配置
npx vite --help

# 启动时显示详细信息
npm run dev -- --debug
```

### 查看启动日志

```
  VITE v5.0.11  ready in 328 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
  ➜  press h to show help
```

---

## 13. 总结

### 端口配置的关键点

| 配置方式 | 优先级 | 适用场景 | 持久性 |
|---------|--------|--------|--------|
| 命令行参数 | 最高 | 临时测试 | 临时 |
| vite.config.ts | 高 | 项目配置 | 永久 |
| package.json | 中 | 脚本配置 | 永久 |
| Vite 默认 | 最低 | 无配置时 | 默认 |

### 当前项目配置

```
前端端口：5173
配置文件：packages/frontend/vite.config.ts
启动命令：npm run dev
访问地址：http://localhost:5173
```

### 修改端口的步骤

1. **临时修改**：`npm run dev -- --port 5174`
2. **永久修改**：编辑 `vite.config.ts` 中的 `server.port`
3. **验证修改**：重启开发服务器
4. **更新文档**：更新 README 和相关文档

---

## 14. 相关文件

```
packages/frontend/
├── vite.config.ts          # 主要端口配置
├── package.json            # 启动脚本
├── .env                    # 环境变量（不含端口）
└── .env.example           # 环境变量示例
```

**记住**：端口配置主要在 `vite.config.ts`，环境变量文件 `.env` 不影响端口设置。