# 赏金猎人平台部署指南 / Bounty Hunter Platform Deployment Guide

本文档提供赏金猎人平台的完整部署指南，包括开发环境、生产环境的安装配置和运维说明。

This document provides a complete deployment guide for the Bounty Hunter Platform, including installation, configuration, and operations for development and production environments.

## 目录 / Table of Contents

1. [系统要求 / System Requirements](#系统要求--system-requirements)
2. [快速开始 / Quick Start](#快速开始--quick-start)
3. [开发环境部署 / Development Deployment](#开发环境部署--development-deployment)
4. [生产环境部署 / Production Deployment](#生产环境部署--production-deployment)
5. [Docker部署 / Docker Deployment](#docker部署--docker-deployment)
6. [环境变量配置 / Environment Configuration](#环境变量配置--environment-configuration)
7. [数据库迁移 / Database Migration](#数据库迁移--database-migration)
8. [监控和日志 / Monitoring and Logging](#监控和日志--monitoring-and-logging)
9. [故障排除 / Troubleshooting](#故障排除--troubleshooting)
10. [安全最佳实践 / Security Best Practices](#安全最佳实践--security-best-practices)

---

## 系统要求 / System Requirements

### 最低配置 / Minimum Requirements

- **操作系统 / OS**: Linux (Ubuntu 20.04+), macOS, Windows 10+
- **Node.js**: v18.0.0 或更高 / or higher
- **PostgreSQL**: v13.0 或更高 / or higher
- **Redis**: v6.0 或更高 / or higher
- **内存 / RAM**: 2GB (开发 / dev), 4GB+ (生产 / prod)
- **磁盘空间 / Disk**: 10GB+

### 推荐配置 / Recommended Requirements (Production)

- **CPU**: 4核心 / 4 cores
- **内存 / RAM**: 8GB+
- **磁盘空间 / Disk**: 50GB+ SSD
- **网络 / Network**: 100Mbps+

---

## 快速开始 / Quick Start

### 1. 克隆仓库 / Clone Repository

```bash
git clone <repository-url>
cd bounty-hunter-platform
```

### 2. 安装依赖 / Install Dependencies

```bash
# 安装根目录依赖 / Install root dependencies
npm install

# 安装后端依赖 / Install backend dependencies
cd packages/backend
npm install

# 安装前端依赖 / Install frontend dependencies
cd ../frontend
npm install
```

### 3. 配置环境变量 / Configure Environment

```bash
# 后端 / Backend
cd packages/backend
cp .env.example .env
# 编辑 .env 文件，设置数据库和Redis连接信息
# Edit .env file and set database and Redis connection info

# 前端 / Frontend
cd ../frontend
cp .env.example .env
# 编辑 .env 文件，设置API地址
# Edit .env file and set API URL
```

### 4. 初始化数据库 / Initialize Database

```bash
cd packages/database
# 创建数据库 / Create database
psql -U postgres -c "CREATE DATABASE bounty_hunter;"

# 运行迁移脚本 / Run migrations
bash scripts/run_migrations.sh
```

### 5. 启动服务 / Start Services

```bash
# 启动后端 / Start backend
cd packages/backend
npm run dev

# 启动前端 (新终端) / Start frontend (new terminal)
cd packages/frontend
npm run dev
```

访问 / Visit: http://localhost:5173

---

## 开发环境部署 / Development Deployment

### 1. 数据库设置 / Database Setup

#### 使用本地PostgreSQL / Using Local PostgreSQL

```bash
# 安装PostgreSQL (Ubuntu) / Install PostgreSQL (Ubuntu)
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务 / Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户 / Create database and user
sudo -u postgres psql
CREATE DATABASE bounty_hunter;
CREATE USER bounty_hunter_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE bounty_hunter TO bounty_hunter_user;
\q
```

#### 使用Docker PostgreSQL / Using Docker PostgreSQL

```bash
docker run -d \
  --name bounty-hunter-postgres \
  -e POSTGRES_DB=bounty_hunter \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine
```

### 2. Redis设置 / Redis Setup

#### 使用本地Redis / Using Local Redis

```bash
# 安装Redis (Ubuntu) / Install Redis (Ubuntu)
sudo apt install redis-server

# 启动服务 / Start service
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### 使用Docker Redis / Using Docker Redis

```bash
docker run -d \
  --name bounty-hunter-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 3. 运行开发服务器 / Run Development Server

```bash
# 后端 / Backend
cd packages/backend
npm run dev

# Worker进程 (可选) / Worker process (optional)
npm run workers:watch

# 前端 / Frontend
cd packages/frontend
npm run dev
```

---

## 生产环境部署 / Production Deployment

### 方案一：传统部署 / Option 1: Traditional Deployment

#### 1. 服务器准备 / Server Preparation

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

# 安装PM2 (进程管理器) / Install PM2 (process manager)
sudo npm install -g pm2
```

#### 2. 应用部署 / Application Deployment

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
# 设置所有必需的环境变量 / Set all required environment variables
```

#### 3. 数据库初始化 / Database Initialization

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

#### 4. 使用PM2启动应用 / Start Application with PM2

```bash
cd packages/backend

# 启动应用 / Start application
pm2 start ecosystem.config.js --env production

# 保存PM2配置 / Save PM2 configuration
pm2 save

# 设置开机自启 / Setup startup script
pm2 startup
# 按照提示执行命令 / Follow the instructions
```

#### 5. 配置Nginx / Configure Nginx

```bash
# 复制Nginx配置 / Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/bounty-hunter
sudo ln -s /etc/nginx/sites-available/bounty-hunter /etc/nginx/sites-enabled/

# 测试配置 / Test configuration
sudo nginx -t

# 重启Nginx / Restart Nginx
sudo systemctl restart nginx
```

#### 6. 配置SSL (使用Let's Encrypt) / Configure SSL (using Let's Encrypt)

```bash
# 安装Certbot / Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书 / Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期 / Auto-renewal
sudo certbot renew --dry-run
```

### 方案二：Docker部署 / Option 2: Docker Deployment

详见下一节 / See next section

---

## Docker部署 / Docker Deployment

### 1. 安装Docker和Docker Compose / Install Docker and Docker Compose

```bash
# 安装Docker / Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose / Install Docker Compose
sudo apt install -y docker-compose

# 添加用户到docker组 / Add user to docker group
sudo usermod -aG docker $USER
```

### 2. 配置环境变量 / Configure Environment

```bash
# 创建.env文件 / Create .env file
cp .env.example .env
nano .env

# 设置以下变量 / Set the following variables:
# DB_PASSWORD=<strong_password>
# REDIS_PASSWORD=<strong_password>
# JWT_SECRET=<strong_random_secret>
# JWT_REFRESH_SECRET=<strong_random_secret>
```

### 3. 构建和启动 / Build and Start

```bash
# 构建镜像 / Build images
docker-compose -f docker-compose.production.yml build

# 启动服务 / Start services
docker-compose -f docker-compose.production.yml up -d

# 查看日志 / View logs
docker-compose -f docker-compose.production.yml logs -f

# 查看状态 / Check status
docker-compose -f docker-compose.production.yml ps
```

### 4. 数据库迁移 / Database Migration

```bash
# 进入API容器 / Enter API container
docker exec -it bounty-hunter-api sh

# 运行迁移 (如果需要) / Run migrations (if needed)
# 迁移脚本应该在容器启动时自动运行
# Migration scripts should run automatically on container startup
```

### 5. 管理Docker服务 / Manage Docker Services

```bash
# 停止服务 / Stop services
docker-compose -f docker-compose.production.yml stop

# 重启服务 / Restart services
docker-compose -f docker-compose.production.yml restart

# 停止并删除容器 / Stop and remove containers
docker-compose -f docker-compose.production.yml down

# 停止并删除容器和数据卷 / Stop and remove containers and volumes
docker-compose -f docker-compose.production.yml down -v
```

---

## 环境变量配置 / Environment Configuration

### 必需变量 / Required Variables

| 变量名 / Variable | 说明 / Description | 示例 / Example |
|------------------|-------------------|----------------|
| `NODE_ENV` | 运行环境 / Environment | `production` |
| `PORT` | 服务端口 / Server port | `3000` |
| `DB_HOST` | 数据库主机 / Database host | `localhost` |
| `DB_PORT` | 数据库端口 / Database port | `5432` |
| `DB_NAME` | 数据库名称 / Database name | `bounty_hunter_prod` |
| `DB_USER` | 数据库用户 / Database user | `bounty_hunter_user` |
| `DB_PASSWORD` | 数据库密码 / Database password | `strong_password` |
| `REDIS_HOST` | Redis主机 / Redis host | `localhost` |
| `REDIS_PORT` | Redis端口 / Redis port | `6379` |
| `JWT_SECRET` | JWT密钥 / JWT secret | `random_32_char_string` |

### 可选变量 / Optional Variables

详见 `.env.production.example` 文件 / See `.env.production.example` file for complete list

### 安全建议 / Security Recommendations

1. **永远不要提交 .env 文件到版本控制 / Never commit .env files to version control**
2. **使用强密码 / Use strong passwords** (至少32字符 / at least 32 characters)
3. **定期轮换密钥 / Rotate secrets regularly**
4. **使用环境变量管理工具 / Use secret management tools** (如 / such as AWS Secrets Manager, HashiCorp Vault)

---

## 数据库迁移 / Database Migration

### 运行迁移 / Run Migrations

```bash
cd packages/database

# 运行所有迁移 / Run all migrations
bash scripts/run_migrations.sh

# 或手动运行 / Or run manually
psql -U bounty_hunter_user -d bounty_hunter_prod -f migrations/20241210_000001_create_core_tables.sql
psql -U bounty_hunter_user -d bounty_hunter_prod -f migrations/20241210_000002_create_auxiliary_tables.sql
psql -U bounty_hunter_user -d bounty_hunter_prod -f migrations/20241211_000001_create_bounty_transactions.sql
psql -U bounty_hunter_user -d bounty_hunter_prod -f migrations/20241211_000002_add_performance_indexes.sql
```

### 回滚迁移 / Rollback Migrations

```bash
# 回滚最后一个迁移 / Rollback last migration
psql -U bounty_hunter_user -d bounty_hunter_prod -f migrations/20241211_000002_rollback_performance_indexes.sql
```

### 验证数据库 / Verify Database

```bash
# 验证表结构 / Verify schema
psql -U bounty_hunter_user -d bounty_hunter_prod -f scripts/verify_schema.sql
```

---

## 监控和日志 / Monitoring and Logging

### 日志位置 / Log Locations

#### 传统部署 / Traditional Deployment

- **应用日志 / Application logs**: `/var/www/bounty-hunter/packages/backend/logs/`
- **Nginx日志 / Nginx logs**: `/var/log/nginx/`
- **PostgreSQL日志 / PostgreSQL logs**: `/var/log/postgresql/`
- **Redis日志 / Redis logs**: `/var/log/redis/`

#### Docker部署 / Docker Deployment

```bash
# 查看应用日志 / View application logs
docker-compose logs -f api

# 查看数据库日志 / View database logs
docker-compose logs -f postgres

# 查看Redis日志 / View Redis logs
docker-compose logs -f redis
```

### PM2监控 / PM2 Monitoring

```bash
# 查看进程状态 / View process status
pm2 status

# 查看实时日志 / View real-time logs
pm2 logs

# 查看监控面板 / View monitoring dashboard
pm2 monit

# 查看详细信息 / View detailed info
pm2 show bounty-hunter-api
```

### 健康检查 / Health Checks

```bash
# 检查API健康状态 / Check API health
curl http://localhost:3000/health

# 预期响应 / Expected response:
# {"status":"ok","timestamp":"2024-12-11T...","environment":"production"}
```

### 性能监控 / Performance Monitoring

建议使用以下工具 / Recommended tools:

- **PM2 Plus**: 进程监控和管理 / Process monitoring and management
- **Prometheus + Grafana**: 指标收集和可视化 / Metrics collection and visualization
- **ELK Stack**: 日志聚合和分析 / Log aggregation and analysis
- **New Relic / DataDog**: APM监控 / APM monitoring

---

## 故障排除 / Troubleshooting

### 常见问题 / Common Issues

#### 1. 数据库连接失败 / Database Connection Failed

```bash
# 检查PostgreSQL状态 / Check PostgreSQL status
sudo systemctl status postgresql

# 检查连接 / Test connection
psql -U bounty_hunter_user -d bounty_hunter_prod -h localhost

# 检查防火墙 / Check firewall
sudo ufw status
```

#### 2. Redis连接失败 / Redis Connection Failed

```bash
# 检查Redis状态 / Check Redis status
sudo systemctl status redis-server

# 测试连接 / Test connection
redis-cli ping

# 检查配置 / Check configuration
redis-cli CONFIG GET requirepass
```

#### 3. 应用无法启动 / Application Won't Start

```bash
# 检查日志 / Check logs
pm2 logs bounty-hunter-api --lines 100

# 检查端口占用 / Check port usage
sudo lsof -i :3000

# 检查环境变量 / Check environment variables
pm2 env 0
```

#### 4. 内存不足 / Out of Memory

```bash
# 检查内存使用 / Check memory usage
free -h

# 检查进程内存 / Check process memory
pm2 monit

# 调整PM2配置 / Adjust PM2 configuration
# 在 ecosystem.config.js 中设置 max_memory_restart
# Set max_memory_restart in ecosystem.config.js
```

#### 5. 数据库性能问题 / Database Performance Issues

```bash
# 检查慢查询 / Check slow queries
psql -U bounty_hunter_user -d bounty_hunter_prod
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

# 分析查询计划 / Analyze query plan
EXPLAIN ANALYZE SELECT ...;

# 重建索引 / Rebuild indexes
REINDEX DATABASE bounty_hunter_prod;
```

---

## 安全最佳实践 / Security Best Practices

### 1. 服务器安全 / Server Security

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
# Set: PermitRootLogin no
sudo systemctl restart sshd

# 配置fail2ban / Configure fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 2. 应用安全 / Application Security

- ✅ 使用HTTPS / Use HTTPS
- ✅ 设置强密码策略 / Set strong password policy
- ✅ 启用速率限制 / Enable rate limiting
- ✅ 定期更新依赖 / Regularly update dependencies
- ✅ 使用环境变量存储敏感信息 / Use environment variables for secrets
- ✅ 启用CORS白名单 / Enable CORS whitelist
- ✅ 实施输入验证 / Implement input validation
- ✅ 使用安全头部 / Use security headers

### 3. 数据库安全 / Database Security

```bash
# 限制数据库访问 / Restrict database access
sudo nano /etc/postgresql/*/main/pg_hba.conf
# 只允许本地连接 / Only allow local connections

# 启用SSL连接 / Enable SSL connections
sudo nano /etc/postgresql/*/main/postgresql.conf
# ssl = on

# 定期备份 / Regular backups
pg_dump -U bounty_hunter_user bounty_hunter_prod > backup_$(date +%Y%m%d).sql
```

### 4. 监控和审计 / Monitoring and Auditing

- 启用访问日志 / Enable access logs
- 监控异常活动 / Monitor unusual activity
- 设置告警 / Set up alerts
- 定期审查日志 / Regularly review logs
- 实施审计跟踪 / Implement audit trails

---

## 备份和恢复 / Backup and Recovery

### 数据库备份 / Database Backup

```bash
# 创建备份脚本 / Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/bounty-hunter"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U bounty_hunter_user bounty_hunter_prod | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz
# 保留最近30天的备份 / Keep last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# 设置定时任务 / Setup cron job
crontab -e
# 每天凌晨2点备份 / Backup daily at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh
```

### 数据恢复 / Data Recovery

```bash
# 恢复数据库 / Restore database
gunzip < db_backup_20241211_020000.sql.gz | psql -U bounty_hunter_user bounty_hunter_prod
```

---

## 扩展和优化 / Scaling and Optimization

### 水平扩展 / Horizontal Scaling

1. **负载均衡 / Load Balancing**: 使用Nginx或HAProxy / Use Nginx or HAProxy
2. **数据库读写分离 / Database Read Replicas**: PostgreSQL主从复制 / PostgreSQL replication
3. **Redis集群 / Redis Cluster**: 分布式缓存 / Distributed caching
4. **CDN**: 静态资源加速 / Static asset acceleration

### 性能优化 / Performance Optimization

1. **启用压缩 / Enable Compression**: Gzip, Brotli
2. **数据库连接池 / Database Connection Pooling**: 已配置 / Already configured
3. **缓存策略 / Caching Strategy**: Redis缓存 / Redis caching
4. **查询优化 / Query Optimization**: 索引优化 / Index optimization

---

## 支持和联系 / Support and Contact

如有问题，请联系 / For issues, please contact:

- **技术支持 / Technical Support**: support@example.com
- **文档 / Documentation**: https://docs.example.com
- **问题追踪 / Issue Tracker**: https://github.com/your-repo/issues

---

## 更新日志 / Changelog

- **2024-12-11**: 初始版本 / Initial version
- 包含完整的部署指南和运维手册 / Includes complete deployment guide and operations manual

---

**注意 / Note**: 本文档会持续更新。请定期检查最新版本。/ This document is continuously updated. Please check for the latest version regularly.
