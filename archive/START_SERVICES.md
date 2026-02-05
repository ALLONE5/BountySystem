# 启动开发服务指南 / Start Development Services Guide

## 问题 / Issue

测试需要 PostgreSQL 和 Redis 服务运行，但当前系统上这些服务未启动。

Tests require PostgreSQL and Redis services to be running, but these services are not currently started on your system.

## 解决方案 / Solutions

### 选项 1: 使用 Docker (推荐) / Option 1: Using Docker (Recommended)

如果你已安装 Docker Desktop，使用以下命令启动服务：

If you have Docker Desktop installed, use the following commands to start services:

```bash
# 启动 PostgreSQL 和 Redis / Start PostgreSQL and Redis
docker compose -f docker-compose.dev.yml up -d

# 检查服务状态 / Check service status
docker compose -f docker-compose.dev.yml ps

# 查看日志 / View logs
docker compose -f docker-compose.dev.yml logs

# 停止服务 / Stop services
docker compose -f docker-compose.dev.yml down
```

**如果 Docker 未安装：**

1. 下载并安装 Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/
2. 安装后重启计算机
3. 运行上述命令

### 选项 2: 手动安装 PostgreSQL 和 Redis / Option 2: Manual Installation

#### 安装 PostgreSQL

1. **下载 PostgreSQL 15**
   - 访问: https://www.postgresql.org/download/windows/
   - 下载并运行安装程序

2. **安装配置**
   - 端口: 5432 (默认)
   - 用户名: postgres
   - 密码: 设置一个密码（记住它）

3. **创建开发数据库**
   ```bash
   # 打开 psql 命令行工具
   psql -U postgres
   
   # 创建用户和数据库
   CREATE USER bounty_hunter_user WITH PASSWORD 'bounty_hunter_password';
   CREATE DATABASE bounty_hunter_dev OWNER bounty_hunter_user;
   GRANT ALL PRIVILEGES ON DATABASE bounty_hunter_dev TO bounty_hunter_user;
   \q
   ```

4. **运行数据库迁移**
   ```bash
   cd packages/database/scripts
   # 在 Windows 上，你可能需要手动运行 SQL 文件
   psql -U bounty_hunter_user -d bounty_hunter_dev -f ../migrations/20241210_000001_create_core_tables.sql
   psql -U bounty_hunter_user -d bounty_hunter_dev -f ../migrations/20241210_000002_create_auxiliary_tables.sql
   psql -U bounty_hunter_user -d bounty_hunter_dev -f ../migrations/20241211_000001_create_bounty_transactions.sql
   psql -U bounty_hunter_user -d bounty_hunter_dev -f ../migrations/20241211_000002_add_performance_indexes.sql
   ```

#### 安装 Redis

1. **使用 Memurai (Windows 版 Redis)**
   - 访问: https://www.memurai.com/get-memurai
   - 下载并安装 Memurai Developer Edition (免费)
   - 默认端口: 6379

2. **或使用 WSL2 安装 Redis**
   ```bash
   # 在 WSL2 Ubuntu 中
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

### 选项 3: 使用云数据库服务 / Option 3: Using Cloud Database Services

如果不想本地安装，可以使用免费的云服务：

1. **PostgreSQL**: 
   - ElephantSQL (免费层): https://www.elephantsql.com/
   - Supabase (免费层): https://supabase.com/

2. **Redis**:
   - Redis Cloud (免费层): https://redis.com/try-free/
   - Upstash (免费层): https://upstash.com/

然后更新 `packages/backend/.env` 文件中的连接信息。

## 验证服务 / Verify Services

### 检查 PostgreSQL

```bash
# 使用 psql
psql -U bounty_hunter_user -d bounty_hunter_dev -c "SELECT 1;"

# 或使用 PowerShell
Test-NetConnection -ComputerName localhost -Port 5432
```

### 检查 Redis

```bash
# 使用 redis-cli
redis-cli ping
# 应该返回: PONG

# 或使用 PowerShell
Test-NetConnection -ComputerName localhost -Port 6379
```

## 运行测试 / Run Tests

服务启动后，运行测试：

```bash
cd packages/backend
npm test
```

## 常见问题 / Troubleshooting

### PostgreSQL 连接被拒绝

1. 检查服务是否运行
2. 检查端口 5432 是否被占用
3. 检查防火墙设置
4. 验证 .env 文件中的连接信息

### Redis 连接被拒绝

1. 检查服务是否运行
2. 检查端口 6379 是否被占用
3. 如果使用密码，确保 .env 中配置正确

### Docker 相关问题

1. 确保 Docker Desktop 正在运行
2. 检查 WSL2 是否正确配置（Windows）
3. 尝试重启 Docker Desktop

## 当前配置 / Current Configuration

根据 `packages/backend/.env` 文件：

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bounty_hunter_dev
DB_USER=bounty_hunter_user
DB_PASSWORD=bounty_hunter_password

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

确保你的服务配置与这些设置匹配。

## 下一步 / Next Steps

1. 选择一个安装选项并完成设置
2. 验证服务正在运行
3. 运行数据库迁移（如果需要）
4. 运行测试: `cd packages/backend && npm test`

---

**需要帮助？** 如果遇到问题，请提供错误信息以获得进一步的帮助。
