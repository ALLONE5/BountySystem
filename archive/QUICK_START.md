# 快速启动指南

## 前置条件

确保以下服务正在运行：
- PostgreSQL (端口 5432，密码: 123456)
- Redis (端口 6379)

## 启动步骤

### 1. 安装依赖（如果还没有安装）

在项目根目录运行：

```bash
npm install
```

### 2. 初始化数据库

确保PostgreSQL正在运行，然后运行数据库迁移：

```bash
# 方法1: 使用psql命令行
psql -U postgres -d postgres -c "CREATE DATABASE IF NOT EXISTS bounty_hunter_dev;"

# 运行迁移脚本
psql -U postgres -d postgres -f packages/database/migrations/20241210_000001_create_core_tables.sql
psql -U postgres -d postgres -f packages/database/migrations/20241210_000002_create_auxiliary_tables.sql
psql -U postgres -d postgres -f packages/database/migrations/20241211_000001_create_bounty_transactions.sql
psql -U postgres -d postgres -f packages/database/migrations/20241211_000002_add_performance_indexes.sql
```

或者使用Docker（推荐）：

```bash
# 启动PostgreSQL和Redis
docker compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker compose -f docker-compose.dev.yml ps
```

### 3. 启动后端服务

**在项目根目录运行：**

```bash
npm run dev:backend
```

后端服务将在 http://localhost:3000 启动

### 4. 启动前端服务

**在新的终端窗口，在项目根目录运行：**

```bash
npm run dev:frontend
```

前端应用将在 http://localhost:5173 启动

## 常见问题

### 错误: Missing script: "dev:backend"

**原因**: 你在 `packages/backend` 目录下运行了命令

**解决**: 回到项目根目录运行：
```bash
cd ../..  # 回到根目录
npm run dev:backend
```

### 错误: Database connection failed

**检查**:
1. PostgreSQL是否正在运行
2. 密码是否正确（应该是 123456）
3. 数据库名称是否正确（postgres）

**验证连接**:
```bash
psql -U postgres -d postgres -c "SELECT 1;"
```

### 错误: Redis connection failed

**检查**:
1. Redis是否正在运行
2. 端口6379是否可用

**验证连接**:
```bash
redis-cli ping
# 应该返回: PONG
```

## 直接在子目录运行

如果你想在子目录直接运行，使用以下命令：

### 后端
```bash
cd packages/backend
npm run dev
```

### 前端
```bash
cd packages/frontend
npm run dev
```

## 测试

运行所有测试：
```bash
npm test
```

运行后端测试：
```bash
cd packages/backend
npm test
```

## API端点

后端启动后，你可以访问：

- API根路径: http://localhost:3000/api
- 健康检查: http://localhost:3000/health
- 认证: http://localhost:3000/api/auth
- 任务: http://localhost:3000/api/tasks
- 用户: http://localhost:3000/api/users

## 下一步

1. 访问 http://localhost:5173 查看前端应用
2. 注册一个新用户账号
3. 开始使用赏金猎人平台！

## 停止服务

- 按 `Ctrl+C` 停止后端/前端服务
- 如果使用Docker: `docker compose -f docker-compose.dev.yml down`
