# 快速开始指南

## 项目设置

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量

#### 后端 (.env)
```bash
cp packages/backend/.env.example packages/backend/.env
# 编辑 .env，确保 PORT=3001
```

#### 前端 (.env)
```bash
echo "VITE_API_URL=http://localhost:3001" > packages/frontend/.env
```

### 3. 启动数据库
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 4. 初始化数据库
```bash
# 检查数据库连接
node packages/backend/scripts/db-manager.js check

# 运行迁移并创建种子数据
node packages/backend/scripts/db-manager.js seed
```

### 5. 启动应用

```bash
# 终端1 - 后端
cd packages/backend
npm run dev

# 终端2 - 前端
cd packages/frontend
npm run dev
```

---

## 访问地址

- 前端：http://localhost:5173
- 后端 API：http://localhost:3001/api
- 健康检查：http://localhost:3001/health
- 数据库：localhost:5432
- Redis：localhost:6379

---

## 默认账户

| 账户 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |
| 开发者 | `developer` | `dev123` |
| 普通用户 | `user` | `user123` |

---

## 常用命令

### 数据库管理
```bash
node packages/backend/scripts/db-manager.js check        # 检查连接
node packages/backend/scripts/db-manager.js seed         # 初始化数据
node packages/backend/scripts/db-manager.js seed-test    # 创建测试数据
node packages/backend/scripts/db-manager.js seed-bounty  # 创建赏金测试数据
node packages/backend/scripts/db-manager.js reset-admin  # 重置管理员密码
node packages/backend/scripts/db-manager.js refresh-ranks # 刷新排名数据
```

### 开发
```bash
npm run dev:backend   # 启动后端
npm run dev:frontend  # 启动前端
npm run build         # 构建生产版本
npm test              # 运行测试
```

---

## 生产部署

详细的生产部署说明（Docker / PM2+Nginx / SSL 配置）请参考：

→ [运维与部署指南](OPERATIONS.md)

---

### 数据库连接失败
1. 检查 PostgreSQL 是否运行: `docker-compose -f docker-compose.dev.yml ps`
2. 检查 `packages/backend/.env` 中的数据库配置
3. 运行 `node packages/backend/scripts/db-manager.js check`

### 前端无法连接后端
1. 确认后端运行在 3001 端口
2. 检查 `packages/frontend/.env` 中的 `VITE_API_URL`
3. 检查后端 CORS 配置

### 迁移失败
1. 确认数据库已创建
2. 检查数据库用户权限
3. 查看 `packages/backend/logs/error.log`

---

## 更多信息

- [项目概览](../PROJECT_OVERVIEW.md) - 项目介绍和统计
- [系统架构](../reference/ARCHITECTURE.md) - 架构设计
- [开发指南](DEVELOPMENT.md) - 开发规范
- [数据库设置](../database/SETUP.md) - 数据库配置详细说明
- [功能说明](../reference/FEATURES.md) - 功能模块详细说明

---

**最后更新**: 2026-03-19
