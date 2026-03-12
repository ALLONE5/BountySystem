# 数据库设置指南

**最后更新**: 2026-03-11

本文档提供 PostgreSQL 和 Redis 的安装配置指南。

---

## 📋 前置要求

### 系统要求
- Windows 10/11 或 Linux/macOS
- 管理员权限
- 至少 2GB 可用磁盘空间

### 软件依赖
- PostgreSQL 14+
- Redis 6+ (可选，用于缓存)
- Node.js 18+

---

## 🚀 快速开始（推荐）

### 使用 Docker Compose（最简单）

```bash
# 启动所有服务（PostgreSQL + Redis）
docker-compose -f docker-compose.dev.yml up -d

# 验证服务运行
docker-compose -f docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f postgres redis
```

这将自动启动：
- PostgreSQL (端口 5432)
- Redis (端口 6379)
- 自动创建数据库和用户

---

## 🔧 手动安装

### PostgreSQL 安装

#### Windows

**方法 1: 官方安装包**
```bash
# 下载并安装
https://www.postgresql.org/download/windows/

# 或使用 winget
winget install PostgreSQL.PostgreSQL
```

**方法 2: Docker**
```bash
docker run --name postgres-bounty \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bounty_hunter \
  -p 5432:5432 \
  -d postgres:14
```

#### Linux (Ubuntu/Debian)

```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS

```bash
# 使用 Homebrew
brew install postgresql@14
brew services start postgresql@14
```

### Redis 安装

#### Windows

```bash
# 使用 Docker（推荐）
docker run --name redis-bounty \
  -p 6379:6379 \
  -d redis:7-alpine

# 或使用 Chocolatey
choco install redis-64
```

#### Linux

```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### macOS

```bash
brew install redis
brew services start redis
```

---

## 🗄️ 数据库初始化

### 1. 创建数据库

```bash
# 连接到 PostgreSQL
psql -U postgres -h localhost

# 创建数据库
CREATE DATABASE bounty_hunter;

# 创建用户（如果需要）
CREATE USER bounty_hunter_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE bounty_hunter TO bounty_hunter_user;

# 退出
\q
```

### 2. 配置后端环境变量

编辑 `packages/backend/.env`:

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bounty_hunter
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 3. 运行数据库迁移

```bash
# 使用数据库管理工具
node packages/backend/scripts/db-manager.js check

# 如果连接成功，运行种子数据
node packages/backend/scripts/db-manager.js seed
```

---

## ✅ 验证安装

### 测试 PostgreSQL

```bash
# 测试连接
psql -U postgres -h localhost -d bounty_hunter -c "SELECT version();"

# 检查表
psql -U postgres -h localhost -d bounty_hunter -c "\dt"
```

### 测试 Redis

```bash
# 测试连接
redis-cli ping
# 应该返回: PONG

# 检查信息
redis-cli INFO server
```

### 测试后端连接

```bash
# 启动后端
cd packages/backend
npm run dev

# 检查日志，应该看到:
# ✅ Database connection successful
# ✅ Redis connection successful
```

---

## 🔧 故障排除

### PostgreSQL 常见问题

**问题: 连接被拒绝**
```bash
# 检查服务状态
# Windows
sc query postgresql-x64-14

# Linux/macOS
sudo systemctl status postgresql

# 启动服务
# Windows: 在服务管理器中启动
# Linux/macOS
sudo systemctl start postgresql
```

**问题: 认证失败**
```bash
# 编辑 pg_hba.conf
# Linux: /etc/postgresql/14/main/pg_hba.conf
# 添加或修改:
local   all   all   trust
host    all   all   127.0.0.1/32   trust
```

### Redis 常见问题

**问题: 连接超时**
```bash
# 检查 Redis 是否运行
redis-cli ping

# 如果没有响应，启动 Redis
# Windows (Docker)
docker start redis-bounty

# Linux/macOS
sudo systemctl start redis-server
```

---

## 📊 性能优化（可选）

### PostgreSQL 配置优化

编辑 `postgresql.conf`:

```conf
# 基本优化（适用于 8GB RAM）
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB
max_connections = 100

# SSD 优化
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Redis 配置优化

```bash
# 设置最大内存
redis-cli CONFIG SET maxmemory 512mb

# 设置淘汰策略
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 🎯 下一步

配置完成后：

1. ✅ 启动后端服务: `cd packages/backend && npm run dev`
2. ✅ 启动前端服务: `cd packages/frontend && npm run dev`
3. ✅ 访问应用: http://localhost:5173
4. ✅ 使用默认账户登录: `admin` / `admin123`

---

## 📚 相关文档

- [快速开始](../guides/QUICK_START.md) - 5分钟快速上手
- [开发指南](../DEVELOPMENT.md) - 开发规范和工具
- [数据库架构](../database/SCHEMA.md) - 数据库设计
- [数据库迁移](../database/MIGRATIONS.md) - 迁移文件管理

---

**维护者**: 开发团队  
**版本**: 2.0.0