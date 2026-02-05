# 赏金猎人平台运维指南 / Bounty Hunter Platform Operations Guide

本文档提供赏金猎人平台的完整运维指南，包括配置、部署、日常运维、监控和故障排除。

This document provides a complete operations guide for the Bounty Hunter Platform, including configuration, deployment, daily operations, monitoring, and troubleshooting.

## 目录 / Table of Contents

1. [快速启动 / Quick Start](#快速启动--quick-start)
2. [环境配置 / Environment Configuration](#环境配置--environment-configuration)
3. [部署指南 / Deployment Guide](#部署指南--deployment-guide)
4. [日常运维 / Daily Operations](#日常运维--daily-operations)
5. [监控和告警 / Monitoring and Alerts](#监控和告警--monitoring-and-alerts)
6. [故障排除 / Troubleshooting](#故障排除--troubleshooting)
7. [性能优化 / Performance Optimization](#性能优化--performance-optimization)
8. [安全最佳实践 / Security Best Practices](#安全最佳实践--security-best-practices)

---

## 快速启动 / Quick Start

### 开发环境快速启动 / Development Quick Start

#### 选项 1: 使用 Docker (推荐) / Option 1: Using Docker (Recommended)

```bash
# 启动所有服务 / Start all services
docker compose -f docker-compose.dev.yml up -d

# 检查服务状态 / Check service status
docker compose -f docker-compose.dev.yml ps

# 查看日志 / View logs
docker compose -f docker-compose.dev.yml logs -f

# 停止服务 / Stop services
docker compose -f docker-compose.dev.yml down
```

#### 选项 2: 本地安装 / Option 2: Local Installation

```bash
# 1. 克隆仓库 / Clone repository
git clone <repository-url>
cd bounty-hunter-platform

# 2. 安装依赖 / Install dependencies
npm install
cd packages/backend && npm install
cd ../frontend && npm install

# 3. 配置环境变量 / Configure environment
cd packages/backend
cp .env.example .env
# 编辑 .env 文件 / Edit .env file

# 4. 初始化数据库 / Initialize database
cd packages/database
bash scripts/run_migrations.sh

# 5. 启动服务 / Start services
cd packages/backend && npm run dev
cd packages/frontend && npm run dev  # 新终端 / new terminal
```

访问应用 / Access application: http://localhost:5173

### 验证服务 / Verify Services

```bash
# 检查API / Check API
curl http://localhost:3000/api

# 检查健康状态 / Check health
curl http://localhost:3000/health

# 检查PostgreSQL / Check PostgreSQL
psql -U bounty_hunter_user -d bounty_hunter_dev -c "SELECT 1;"

# 检查Redis / Check Redis
redis-cli ping
```

---

## 环境配置 / Environment Configuration

### 核心配置变量 / Core Configuration Variables

#### 1. 服务器配置 / Server Configuration
```env
NODE_ENV=development              # 运行环境 / Environment
PORT=3000                         # 服务端口 / Server port
```

#### 2. 数据库配置 / Database Configuration
```env
DB_HOST=localhost                 # 数据库主机 / Database host
DB_PORT=5432                      # 数据库端口 / Database port
DB_NAME=bounty_hunter_dev         # 数据库名称 / Database name
DB_USER=bounty_hunter_user        # 数据库用户 / Database user
DB_PASSWORD=your_password         # 数据库密码 / Database password
DB_SSL=false                      # 是否启用SSL / Enable SSL
DB_POOL_MIN=2                     # 最小连接数 / Min connections
DB_POOL_MAX=10                    # 最大连接数 / Max connections
```

#### 3. Redis配置 / Redis Configuration
```env
REDIS_HOST=localhost              # Redis主机 / Redis host
REDIS_PORT=6379                   # Redis端口 / Redis port
REDIS_PASSWORD=                   # Redis密码 / Redis password
REDIS_DB=0                        # Redis数据库编号 / Redis DB number
REDIS_TLS=false                   # 是否启用TLS / Enable TLS
```

#### 4. JWT配置 / JWT Configuration
```env
JWT_SECRET=your_secret_key_here   # JWT签名密钥 / JWT secret
JWT_EXPIRES_IN=24h                # Token过期时间 / Token expiry
JWT_REFRESH_SECRET=refresh_secret # 刷新Token密钥 / Refresh secret
JWT_REFRESH_EXPIRES_IN=7d         # 刷新Token过期时间 / Refresh expiry
```

#### 5. 安全配置 / Security Configuration
```env
BCRYPT_ROUNDS=10                  # 密码加密轮数 / Password hash rounds
SESSION_SECRET=session_secret     # 会话密钥 / Session secret
CORS_ORIGIN=http://localhost:5173 # 允许的跨域来源 / CORS origin
CORS_CREDENTIALS=true             # 是否允许携带凭证 / Allow credentials
```

#### 6. 性能配置 / Performance Configuration
```env
ENABLE_COMPRESSION=true           # 是否启用压缩 / Enable compression
ENABLE_CACHE=true                 # 是否启用缓存 / Enable cache
CACHE_TTL=300                     # 缓存过期时间(秒) / Cache TTL (seconds)
RATE_LIMIT_WINDOW_MS=60000        # 速率限制时间窗口 / Rate limit window
RATE_LIMIT_MAX_REQUESTS=100       # 最大请求数 / Max requests
```

### PostgreSQL优化配置 / PostgreSQL Optimization

编辑 `/etc/postgresql/*/main/postgresql.conf`:

```conf
# 内存配置 / Memory Configuration
shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 1GB          # 50-75% of RAM
work_mem = 16MB                     # RAM / max_connections / 4
maintenance_work_mem = 128MB        # RAM / 16

# 连接配置 / Connection Configuration
max_connections = 100

# 查询优化 / Query Optimization
random_page_cost = 1.1              # For SSD
effective_io_concurrency = 200      # For SSD

# WAL配置 / WAL Configuration
wal_buffers = 16MB
checkpoint_completion_target = 0.9
```

---

## 部署指南 / Deployment Guide

### 系统要求 / System Requirements

**最低配置 / Minimum**:
- OS: Linux (Ubuntu 20.04+), macOS, Windows 10+
- Node.js: v18.0.0+
- PostgreSQL: v13.0+
- Redis: v6.0+
- RAM: 2GB (dev), 4GB+ (prod)
- Disk: 10GB+

**推荐配置 / Recommended (Production)**:
- CPU: 4 cores
- RAM: 8GB+
- Disk: 50GB+ SSD
- Network: 100Mbps+

### 生产环境部署 / Production Deployment

#### 方案一：传统部署 / Option 1: Traditional Deployment

**1. 服务器准备 / Server Preparation**

```bash
# 更新系统 / Update system
sudo apt update && sudo apt upgrade -y

# 安装Node.js / Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装PostgreSQL / Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安装Redis / Install Redis
sudo apt install -y redis-server

# 安装Nginx / Install Nginx
sudo apt install -y nginx

# 安装PM2 / Install PM2
sudo npm install -g pm2
```

**2. 应用部署 / Application Deployment**

```bash
# 克隆代码 / Clone code
cd /var/www
sudo git clone <repository-url> bounty-hunter
cd bounty-hunter

# 安装依赖 / Install dependencies
cd packages/backend
npm ci --only=production

# 构建应用 / Build application
npm run build

# 配置环境变量 / Configure environment
sudo cp .env.production.example .env.production
sudo nano .env.production
```

**3. 数据库初始化 / Database Initialization**

```bash
# 创建生产数据库 / Create production database
sudo -u postgres psql
CREATE DATABASE bounty_hunter_prod;
CREATE USER bounty_hunter_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE bounty_hunter_prod TO bounty_hunter_user;
\q

# 运行迁移 / Run migrations
cd packages/database
bash scripts/run_migrations.sh
```

**4. 使用PM2启动 / Start with PM2**

```bash
cd packages/backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

**5. 配置Nginx / Configure Nginx**

```bash
sudo cp nginx.conf /etc/nginx/sites-available/bounty-hunter
sudo ln -s /etc/nginx/sites-available/bounty-hunter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**6. 配置SSL / Configure SSL**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run
```

#### 方案二：Docker部署 / Option 2: Docker Deployment

```bash
# 安装Docker / Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 配置环境变量 / Configure environment
cp .env.example .env
nano .env

# 构建和启动 / Build and start
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# 查看状态 / Check status
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f
```

---

## 日常运维 / Daily Operations

### 每日检查清单 / Daily Checklist

```bash
# 1. 系统健康检查 / System health check
pm2 status
curl http://localhost:3000/health
psql -U bounty_hunter_user -d bounty_hunter_prod -c "SELECT 1;"
redis-cli ping
df -h
free -h

# 2. 日志审查 / Log review
tail -n 100 /var/www/bounty-hunter/packages/backend/logs/error-*.log
pm2 logs --lines 50

# 3. 性能指标 / Performance metrics
pm2 monit
psql -U bounty_hunter_user -d bounty_hunter_prod -c "SELECT count(*) FROM pg_stat_activity;"
redis-cli INFO memory
```

### 每周任务 / Weekly Tasks

```bash
# 1. 备份验证 / Backup verification
ls -lh /var/backups/bounty-hunter/ | head -10

# 2. 安全更新 / Security updates
sudo apt update
sudo apt list --upgradable
cd /var/www/bounty-hunter/packages/backend
npm outdated

# 3. 日志清理 / Log cleanup
find /var/www/bounty-hunter/packages/backend/logs -name "*.log" -mtime +30 -delete
```

### 备份策略 / Backup Strategy

**数据库备份脚本 / Database Backup Script**:

```bash
#!/bin/bash
# /usr/local/bin/backup-db.sh

BACKUP_DIR="/var/backups/bounty-hunter"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库 / Backup database
pg_dump -U bounty_hunter_user bounty_hunter_prod | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# 保留最近30天的备份 / Keep last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

**设置定时任务 / Setup cron job**:

```bash
crontab -e
# 每天凌晨2点备份 / Backup daily at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh
```

---

## 监控和告警 / Monitoring and Alerts

### 关键性能指标 / Key Performance Indicators

| 指标 / Metric | 正常范围 / Normal | 告警阈值 / Alert |
|--------------|------------------|-----------------|
| API响应时间 / API Response Time | < 200ms | > 500ms |
| 错误率 / Error Rate | < 0.1% | > 1% |
| CPU使用率 / CPU Usage | < 70% | > 85% |
| 内存使用率 / Memory Usage | < 80% | > 90% |
| 数据库连接数 / DB Connections | < 50 | > 80 |
| 磁盘使用 / Disk Usage | < 70% | > 85% |

### 监控命令 / Monitoring Commands

```bash
# 应用监控 / Application monitoring
pm2 monit
pm2 logs --lines 50

# 数据库监控 / Database monitoring
psql -U bounty_hunter_user -d bounty_hunter_prod -c "
SELECT pid, usename, state, query_start, query 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY query_start;
"

# Redis监控 / Redis monitoring
redis-cli INFO
redis-cli INFO memory
redis-cli CLIENT LIST
```

### 告警处理 / Alert Handling

#### 高CPU使用率 / High CPU Usage

```bash
# 1. 识别高CPU进程 / Identify high CPU processes
top -bn1 | head -20

# 2. 检查应用日志 / Check application logs
pm2 logs --lines 100

# 3. 检查慢查询 / Check slow queries
psql -U bounty_hunter_user -d bounty_hunter_prod -c "
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;
"

# 4. 重启应用 / Restart application
pm2 restart bounty-hunter-api
```

#### 内存不足 / Out of Memory

```bash
# 1. 检查内存使用 / Check memory usage
free -h
ps aux --sort=-%mem | head -10

# 2. 清理缓存 / Clear cache
redis-cli FLUSHDB

# 3. 重启应用 / Restart application
pm2 restart all
```

#### 磁盘空间不足 / Disk Space Low

```bash
# 1. 检查磁盘使用 / Check disk usage
df -h
du -sh /* | sort -h

# 2. 清理日志 / Clean logs
find /var/log -name "*.log" -mtime +7 -delete
find /var/www/bounty-hunter/packages/backend/logs -name "*.log" -mtime +7 -delete

# 3. 清理旧备份 / Clean old backups
find /var/backups/bounty-hunter -name "*.sql.gz" -mtime +30 -delete
```

---

## 故障排除 / Troubleshooting

### 常见"错误"（实际上是正常行为）

#### ✅ Authentication Error (正常)

**看到的错误**:
```
Error: AuthenticationError: No token provided
```

**实际情况**: 这是正常的！

**原因**:
- 前端应用在加载时会尝试获取用户数据
- 如果用户还没有登录，就没有认证token
- 后端正确地拒绝了未认证的请求

**解决方案**: 
- 这不需要"修复"
- 用户登录后，这些错误就会消失
- 这证明你的认证系统正常工作

#### ✅ Rate Limit Error (正常)

**看到的错误**:
```
Error: RATE_LIMIT_EXCEEDED: Too many requests
```

**实际情况**: 这是安全功能！

**当前限制**:
- IP限制: 60请求/分钟
- API限制: 100请求/分钟
- 登录限制: 5次尝试/15分钟

**解决方案**:
- 等待60秒后重试
- 运行 `cd packages/backend && npm run clear-rate-limits` 清除速率限制（仅开发环境）

### 真正的错误

#### ❌ 数据库连接失败 / Database Connection Failed

```bash
# 检查PostgreSQL状态 / Check PostgreSQL status
sudo systemctl status postgresql

# 测试连接 / Test connection
psql -U bounty_hunter_user -d bounty_hunter_prod -h localhost

# 检查防火墙 / Check firewall
sudo ufw status
```

#### ❌ Redis连接失败 / Redis Connection Failed

```bash
# 检查Redis状态 / Check Redis status
sudo systemctl status redis-server

# 测试连接 / Test connection
redis-cli ping

# 检查配置 / Check configuration
redis-cli CONFIG GET requirepass
```

#### ❌ 应用无法启动 / Application Won't Start

```bash
# 检查日志 / Check logs
pm2 logs bounty-hunter-api --lines 100

# 检查端口占用 / Check port usage
sudo lsof -i :3000

# 检查环境变量 / Check environment variables
pm2 env 0
```

### 快速恢复命令 / Quick Recovery Commands

```bash
# 快速重启所有服务 / Quick restart all services
pm2 restart all

# 清理并重启 / Clean and restart
pm2 delete all
pm2 start ecosystem.config.js --env production

# 数据库紧急恢复 / Database emergency recovery
pg_restore -U bounty_hunter_user -d bounty_hunter_prod /var/backups/bounty-hunter/full/latest.dump

# Redis紧急恢复 / Redis emergency recovery
redis-cli FLUSHALL
redis-cli SHUTDOWN
sudo systemctl start redis-server
```

---

## 性能优化 / Performance Optimization

### 数据库优化 / Database Optimization

```sql
-- 分析慢查询 / Analyze slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;

-- 检查未使用的索引 / Check unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- 重建索引 / Rebuild indexes
REINDEX TABLE tasks;
REINDEX TABLE users;

-- 更新统计信息 / Update statistics
ANALYZE;

-- 清理死元组 / Clean dead tuples
VACUUM ANALYZE;
```

### Redis优化 / Redis Optimization

```bash
# 检查内存使用 / Check memory usage
redis-cli INFO memory

# 设置最大内存 / Set max memory
redis-cli CONFIG SET maxmemory 512mb

# 设置淘汰策略 / Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 应用优化 / Application Optimization

1. **启用压缩 / Enable Compression**
2. **优化缓存策略 / Optimize Caching**
3. **减少数据库查询 / Reduce DB Queries**
4. **使用批量操作 / Use Batch Operations**

---

## 安全最佳实践 / Security Best Practices

### 服务器安全 / Server Security

```bash
# 配置防火墙 / Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 禁用root SSH登录 / Disable root SSH login
sudo nano /etc/ssh/sshd_config
# 设置: PermitRootLogin no
sudo systemctl restart sshd

# 配置fail2ban / Configure fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 应用安全 / Application Security

- ✅ 使用HTTPS
- ✅ 设置强密码策略
- ✅ 启用速率限制
- ✅ 定期更新依赖
- ✅ 使用环境变量存储敏感信息
- ✅ 启用CORS白名单
- ✅ 实施输入验证
- ✅ 使用安全头部

### 数据库安全 / Database Security

```bash
# 限制数据库访问 / Restrict database access
sudo nano /etc/postgresql/*/main/pg_hba.conf

# 启用SSL连接 / Enable SSL connections
sudo nano /etc/postgresql/*/main/postgresql.conf
# ssl = on

# 定期备份 / Regular backups
pg_dump -U bounty_hunter_user bounty_hunter_prod > backup_$(date +%Y%m%d).sql
```

---

## 有用的命令速查 / Useful Command Reference

### PM2命令 / PM2 Commands

```bash
pm2 list                    # 列出所有进程
pm2 logs                    # 查看日志
pm2 monit                   # 监控面板
pm2 restart <name>          # 重启进程
pm2 stop <name>             # 停止进程
pm2 delete <name>           # 删除进程
pm2 save                    # 保存配置
pm2 resurrect               # 恢复配置
```

### PostgreSQL命令 / PostgreSQL Commands

```bash
psql -U user -d database    # 连接数据库
\l                          # 列出数据库
\dt                         # 列出表
\d table_name               # 描述表
\q                          # 退出
```

### Redis命令 / Redis Commands

```bash
redis-cli                   # 连接Redis
PING                        # 测试连接
INFO                        # 查看信息
KEYS *                      # 列出所有键
FLUSHDB                     # 清空当前数据库
FLUSHALL                    # 清空所有数据库
```

### 系统命令 / System Commands

```bash
df -h                       # 磁盘使用
free -h                     # 内存使用
top                         # 进程监控
htop                        # 增强版top
netstat -tulpn              # 网络连接
systemctl status <service>  # 服务状态
```

---

**最后更新 / Last Updated**: 2024-12-11

**版本 / Version**: 2.0.0

**维护者 / Maintainer**: DevOps Team
