# 运维与部署指南

**最后更新**: 2026-03-19

本文档覆盖从开发环境到生产环境的完整部署流程。

---

## 目录

1. [系统要求](#系统要求)
2. [端口与服务说明](#端口与服务说明)
3. [方案一：本地开发部署](#方案一本地开发部署)
4. [方案二：Docker 全栈部署（推荐生产）](#方案二docker-全栈部署推荐生产)
5. [方案三：传统服务器部署（PM2 + Nginx）](#方案三传统服务器部署pm2--nginx)
6. [前端生产构建与部署](#前端生产构建与部署)
7. [环境变量完整参考](#环境变量完整参考)
8. [数据库初始化与迁移](#数据库初始化与迁移)
9. [SSL / HTTPS 配置](#ssl--https-配置)
10. [日常运维](#日常运维)
11. [监控与告警](#监控与告警)
12. [备份与恢复](#备份与恢复)
13. [故障排除](#故障排除)

---

## 系统要求

| 组件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Node.js | 18.0.0 | 20 LTS |
| PostgreSQL | 14.0 | 15+ |
| Redis | 6.0 | 7+ |
| Docker | 20.10 | 24+ |
| Docker Compose | 2.0 | 2.20+ |

**服务器配置**

| 环境 | CPU | RAM | 磁盘 |
|------|-----|-----|------|
| 开发 | 2核 | 4GB | 20GB |
| 生产（最低） | 2核 | 4GB | 40GB SSD |
| 生产（推荐） | 4核 | 8GB | 100GB SSD |

---

## 端口与服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端（开发） | 5173 | Vite 开发服务器 |
| 后端 API | 3001 | Express.js（开发） / 3000（Docker 内部） |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| Nginx | 80 / 443 | 反向代理（生产） |

> 注意：后端开发时监听 **3001** 端口（`.env` 中 `PORT=3001`）。Docker 生产镜像内部使用 3000，由 Nginx 对外暴露 80/443。

---

## 方案一：本地开发部署

### 1. 克隆并安装依赖

```bash
git clone <repository-url>
cd bounty-hunter-platform
npm install
```

### 2. 配置后端环境变量

```bash
cp packages/backend/.env.example packages/backend/.env
```

编辑 `packages/backend/.env`，关键字段：

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bounty_hunter_dev
DB_USER=bounty_hunter_user
DB_PASSWORD=bounty_hunter_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
CORS_ORIGIN=http://localhost:5173
```

### 3. 配置前端环境变量

```bash
echo "VITE_API_URL=http://localhost:3001" > packages/frontend/.env
```

### 4. 启动数据库和 Redis（Docker）

```bash
docker compose -f docker-compose.dev.yml up -d
```

验证：

```bash
docker compose -f docker-compose.dev.yml ps
# 两个服务都应显示 healthy
```

### 5. 初始化数据库

```bash
# 检查连接
node packages/backend/scripts/db-manager.js check

# 运行迁移 + 创建种子数据（含默认账户）
node packages/backend/scripts/db-manager.js seed
```

### 6. 启动应用

```bash
# 终端 1 - 后端
npm run dev:backend

# 终端 2 - 前端
npm run dev:frontend
```

### 访问地址

- 前端：http://localhost:5173
- 后端 API：http://localhost:3001/api
- 健康检查：http://localhost:3001/health

### 默认账户

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | `admin` | `admin123` |
| 开发者 | `developer` | `dev123` |
| 普通用户 | `user` | `user123` |

---

## 方案二：Docker 全栈部署（推荐生产）

此方案使用 `docker-compose.production.yml`，包含 PostgreSQL、Redis、后端 API、Nginx 四个服务。**前端需单独构建后由 Nginx 托管静态文件**（见下方[前端生产构建](#前端生产构建与部署)）。

### 1. 准备环境变量文件

在项目根目录创建 `.env` 文件（供 docker-compose 读取）：

```bash
cp packages/backend/.env.production.example .env
```

编辑 `.env`，**必须修改**以下字段：

```env
# 数据库
DB_NAME=bounty_hunter_prod
DB_USER=bounty_hunter_user
DB_PASSWORD=强密码_至少16位

# Redis
REDIS_PASSWORD=强密码_至少16位

# JWT（必须使用随机强密钥，至少32字符）
JWT_SECRET=随机字符串_至少32位
JWT_REFRESH_SECRET=另一个随机字符串_至少32位

# 前端域名（用于 CORS）
CORS_ORIGIN=https://your-domain.com
```

生成随机密钥的方法：

```bash
# Linux/macOS
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 构建前端静态文件

```bash
cd packages/frontend

# 创建生产环境变量
echo "VITE_API_URL=https://your-domain.com" > .env.production

# 构建
npm run build
# 产物在 packages/frontend/dist/
```

### 3. 更新 Nginx 配置以托管前端

编辑 `nginx.conf`，在 HTTP server 块中添加前端静态文件服务：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查
    location /health {
        proxy_pass http://api_backend/health;
        access_log off;
    }
}
```

在 `docker-compose.production.yml` 的 nginx 服务中挂载前端构建产物：

```yaml
nginx:
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./packages/frontend/dist:/usr/share/nginx/html:ro  # 添加此行
    - ./ssl:/etc/nginx/ssl:ro
    - nginx_logs:/var/log/nginx
```

### 4. 启动所有服务

```bash
docker compose -f docker-compose.production.yml up -d
```

### 5. 初始化数据库

```bash
# 进入 API 容器执行数据库初始化
docker compose -f docker-compose.production.yml exec api \
  node scripts/db-manager.js seed
```

### 6. 验证部署

```bash
# 查看服务状态
docker compose -f docker-compose.production.yml ps

# 查看日志
docker compose -f docker-compose.production.yml logs -f api

# 测试 API
curl http://your-domain.com/health
curl http://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 常用 Docker 命令

```bash
# 重启单个服务
docker compose -f docker-compose.production.yml restart api

# 查看某服务日志
docker compose -f docker-compose.production.yml logs -f api --tail=100

# 停止所有服务
docker compose -f docker-compose.production.yml down

# 停止并删除数据卷（危险！会清空数据库）
docker compose -f docker-compose.production.yml down -v

# 更新后重新构建并部署
docker compose -f docker-compose.production.yml build api
docker compose -f docker-compose.production.yml up -d api
```

---

## 方案三：传统服务器部署（PM2 + Nginx）

适用于不使用 Docker 的 Linux 服务器（Ubuntu 20.04+）。

### 1. 安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-contrib

# 安装 Redis 7
sudo apt install -y redis-server

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2
sudo npm install -g pm2
```

### 2. 配置 PostgreSQL

```bash
sudo -u postgres psql <<EOF
CREATE DATABASE bounty_hunter_prod;
CREATE USER bounty_hunter_user WITH PASSWORD '强密码';
GRANT ALL PRIVILEGES ON DATABASE bounty_hunter_prod TO bounty_hunter_user;
ALTER DATABASE bounty_hunter_prod OWNER TO bounty_hunter_user;
EOF
```

### 3. 配置 Redis

```bash
sudo nano /etc/redis/redis.conf
# 设置密码：requirepass 强密码
# 设置内存限制：maxmemory 512mb
# 设置淘汰策略：maxmemory-policy allkeys-lru

sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 4. 部署后端

```bash
# 克隆代码
sudo mkdir -p /var/www/bounty-hunter
sudo chown $USER:$USER /var/www/bounty-hunter
git clone <repository-url> /var/www/bounty-hunter
cd /var/www/bounty-hunter

# 安装依赖
npm install

# 配置生产环境变量
cp packages/backend/.env.production.example packages/backend/.env
nano packages/backend/.env
# 修改所有 CHANGE_THIS 字段，PORT 设为 3001

# 构建后端
cd packages/backend
npm run build
```

### 5. 使用 PM2 启动后端

```bash
cd /var/www/bounty-hunter/packages/backend

# 启动
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 save
pm2 startup
# 按照输出的命令执行（通常是 sudo env PATH=... pm2 startup ...）
```

### 6. 构建并部署前端

```bash
cd /var/www/bounty-hunter/packages/frontend

# 设置生产 API 地址
echo "VITE_API_URL=https://your-domain.com" > .env.production

# 构建
npm run build

# 将 dist 目录复制到 Nginx 静态目录
sudo cp -r dist /var/www/bounty-hunter-frontend
```

### 7. 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/bounty-hunter
```

写入以下配置（HTTP，SSL 见下节）：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /var/www/bounty-hunter-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bounty-hunter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 8. 初始化数据库

```bash
cd /var/www/bounty-hunter
node packages/backend/scripts/db-manager.js seed
```

---

## 前端生产构建与部署

前端是纯静态 SPA，构建后得到 `packages/frontend/dist/` 目录。

### 构建步骤

```bash
cd packages/frontend

# 1. 设置 API 地址（必须与实际后端地址一致）
echo "VITE_API_URL=https://your-domain.com" > .env.production

# 2. 构建
npm run build

# 3. 验证产物
ls dist/
# 应包含 index.html 和 assets/ 目录
```

### 部署方式

**方式 A：Nginx 直接托管**（推荐）

将 `dist/` 内容复制到 Nginx 的 `root` 目录，配置 `try_files $uri /index.html` 支持 SPA 路由。

**方式 B：CDN / 对象存储**

将 `dist/` 上传至 OSS/S3/CloudFront 等，配置自定义域名和 SPA 路由规则（404 → index.html）。

**方式 C：Docker Nginx 镜像**

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf
```

### 重要：VITE_API_URL

`VITE_API_URL` 在构建时被编译进代码，**必须在构建前设置正确**。

| 场景 | 值 |
|------|-----|
| 本地开发 | `http://localhost:3001` |
| 生产（同域） | `https://your-domain.com` |
| 生产（独立 API 域名） | `https://api.your-domain.com` |

---

## 环境变量完整参考

### 后端（`packages/backend/.env`）

```env
# ===== 服务器 =====
PORT=3001                          # 开发用 3001，Docker 内用 3000
NODE_ENV=production

# ===== 数据库 =====
DB_HOST=localhost                  # Docker 内用服务名 "postgres"
DB_PORT=5432
DB_NAME=bounty_hunter_prod
DB_USER=bounty_hunter_user
DB_PASSWORD=强密码
DB_SSL=false                       # 外部托管数据库设为 true
DB_POOL_MIN=5
DB_POOL_MAX=50

# ===== Redis =====
REDIS_HOST=localhost               # Docker 内用服务名 "redis"
REDIS_PORT=6379
REDIS_PASSWORD=强密码
REDIS_DB=0

# ===== JWT（生产必须使用强随机密钥）=====
JWT_SECRET=至少32位随机字符串
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=另一个至少32位随机字符串
JWT_REFRESH_EXPIRES_IN=7d

# ===== 安全 =====
BCRYPT_ROUNDS=12                   # 生产建议 12
CORS_ORIGIN=https://your-domain.com

# ===== 赏金 =====
ADMIN_MONTHLY_BUDGET=10000

# ===== 日志 =====
LOG_LEVEL=warn                     # 生产用 warn，开发用 info
LOG_FILE_PATH=./logs

# ===== 速率限制 =====
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
```

### 前端（`packages/frontend/.env.production`）

```env
VITE_API_URL=https://your-domain.com
```

---

## 数据库初始化与迁移

### 首次初始化

```bash
# 检查数据库连接
node packages/backend/scripts/db-manager.js check

# 运行迁移 + 种子数据（创建表结构和默认账户）
node packages/backend/scripts/db-manager.js seed
```

### 仅运行迁移（不含种子数据）

```bash
node packages/backend/scripts/db-manager.js migrate
```

### 其他数据库命令

```bash
node packages/backend/scripts/db-manager.js seed-test    # 创建测试数据
node packages/backend/scripts/db-manager.js seed-bounty  # 创建赏金测试数据
node packages/backend/scripts/db-manager.js reset-admin  # 重置管理员密码
node packages/backend/scripts/db-manager.js refresh-ranks # 刷新排名数据
```

### 迁移文件位置

```
packages/database/migrations/
```

迁移按文件名顺序执行，命名格式：`001_init.sql`、`002_add_xxx.sql`。

---

## SSL / HTTPS 配置

### 使用 Let's Encrypt（推荐）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run

# 自动续期（certbot 安装后通常已自动配置 cron）
sudo systemctl status certbot.timer
```

### 手动 SSL 证书

将证书文件放置后，在 `nginx.conf` 中取消 HTTPS server 块的注释并填写路径：

```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

Docker 部署时将证书目录挂载到容器：

```yaml
nginx:
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
```

---

## 日常运维

### 应用更新流程

**Docker 部署**：

```bash
git pull
cd packages/frontend && npm run build  # 如有前端变更
docker compose -f docker-compose.production.yml build api
docker compose -f docker-compose.production.yml up -d api
```

**PM2 部署**：

```bash
git pull
cd packages/backend && npm run build
pm2 restart bounty-hunter-api
# 前端变更时重新构建并复制 dist
```

### 每日检查

```bash
# PM2 状态
pm2 status

# API 健康
curl http://localhost:3001/health

# 数据库连接
node packages/backend/scripts/db-manager.js check

# 磁盘空间
df -h

# 内存
free -h

# 错误日志（最近50行）
tail -n 50 packages/backend/logs/error.log
```

### PM2 常用命令

```bash
pm2 list                          # 列出所有进程
pm2 status                        # 查看状态
pm2 logs bounty-hunter-api        # 查看日志
pm2 logs bounty-hunter-api --lines 100
pm2 monit                         # 实时监控面板
pm2 restart bounty-hunter-api     # 重启
pm2 reload bounty-hunter-api      # 零停机重载
pm2 stop bounty-hunter-api        # 停止
pm2 delete bounty-hunter-api      # 删除
pm2 save                          # 保存当前进程列表
pm2 resurrect                     # 恢复保存的进程列表
```

---

## 监控与告警

### 关键指标

| 指标 | 正常 | 告警 |
|------|------|------|
| API 响应时间 | < 200ms | > 500ms |
| 错误率 | < 0.1% | > 1% |
| CPU 使用率 | < 70% | > 85% |
| 内存使用率 | < 80% | > 90% |
| 数据库连接数 | < 50 | > 80 |
| 磁盘使用率 | < 70% | > 85% |

### 监控命令

```bash
# 数据库活跃连接
psql -U bounty_hunter_user -d bounty_hunter_prod -c "
SELECT pid, usename, state, query_start, left(query,80) as query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;"

# Redis 内存
redis-cli -a 密码 INFO memory

# 慢查询
psql -U bounty_hunter_user -d bounty_hunter_prod -c "
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;"
```

---

## 备份与恢复

### 数据库备份脚本

创建 `/usr/local/bin/backup-bounty-hunter.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/bounty-hunter"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U bounty_hunter_user bounty_hunter_prod \
  | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 保留最近 30 天
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup done: db_$DATE.sql.gz"
```

```bash
chmod +x /usr/local/bin/backup-bounty-hunter.sh

# 设置每日凌晨 2 点自动备份
crontab -e
# 添加：0 2 * * * /usr/local/bin/backup-bounty-hunter.sh
```

### 恢复数据库

```bash
# 解压并恢复
gunzip -c /var/backups/bounty-hunter/db_20260101_020000.sql.gz \
  | psql -U bounty_hunter_user bounty_hunter_prod
```

### Docker 数据卷备份

```bash
# 备份 postgres 数据卷
docker run --rm \
  -v bounty-hunter-platform_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_$(date +%Y%m%d).tar.gz -C /data .
```

---

## 故障排除

### 后端无法启动

```bash
# 查看 PM2 日志
pm2 logs bounty-hunter-api --lines 100

# 检查端口占用
sudo lsof -i :3001

# 验证环境变量
pm2 env 0

# 手动测试启动
cd packages/backend && node dist/index.js
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 测试连接
psql -U bounty_hunter_user -d bounty_hunter_prod -h localhost

# Docker 内检查
docker compose -f docker-compose.production.yml exec postgres \
  pg_isready -U bounty_hunter_user
```

### 前端 API 请求失败（CORS / 404）

1. 确认 `VITE_API_URL` 构建时设置正确
2. 确认后端 `CORS_ORIGIN` 包含前端域名
3. 检查 Nginx `location /api/` 代理配置
4. 浏览器 Network 面板查看实际请求地址

### Redis 连接失败

```bash
sudo systemctl status redis-server
redis-cli -a 密码 ping
# 应返回 PONG
```

### 磁盘空间不足

```bash
# 清理旧日志（保留7天）
find packages/backend/logs -name "*.log" -mtime +7 -delete

# 清理旧备份（保留30天）
find /var/backups/bounty-hunter -name "*.sql.gz" -mtime +30 -delete

# Docker 清理
docker system prune -f
```

### 重置管理员密码

```bash
node packages/backend/scripts/db-manager.js reset-admin
# 或使用专用脚本
npx tsx packages/backend/scripts/reset_admin_password.ts
```

---

## 安全加固清单

部署到生产前确认：

- [ ] `JWT_SECRET` 和 `JWT_REFRESH_SECRET` 使用随机强密钥（≥32位）
- [ ] 数据库密码强度足够（≥16位，含大小写+数字+符号）
- [ ] Redis 设置了密码
- [ ] `BCRYPT_ROUNDS=12`
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` 设置为实际前端域名（非 `*`）
- [ ] 启用 HTTPS / SSL
- [ ] 防火墙只开放 80、443、22 端口
- [ ] 数据库端口（5432）不对外暴露
- [ ] Redis 端口（6379）不对外暴露
- [ ] 定期备份已配置
- [ ] 日志级别设为 `warn`

---

**维护者**: 开发团队
