# 赏金猎人平台运维手册 / Bounty Hunter Platform Operations Manual

本文档提供赏金猎人平台的日常运维指南，包括监控、维护、故障处理和最佳实践。

This document provides daily operations guidance for the Bounty Hunter Platform, including monitoring, maintenance, troubleshooting, and best practices.

## 目录 / Table of Contents

1. [日常运维任务 / Daily Operations](#日常运维任务--daily-operations)
2. [监控指标 / Monitoring Metrics](#监控指标--monitoring-metrics)
3. [告警处理 / Alert Handling](#告警处理--alert-handling)
4. [维护窗口 / Maintenance Windows](#维护窗口--maintenance-windows)
5. [备份策略 / Backup Strategy](#备份策略--backup-strategy)
6. [性能调优 / Performance Tuning](#性能调优--performance-tuning)
7. [安全审计 / Security Audit](#安全审计--security-audit)
8. [应急响应 / Incident Response](#应急响应--incident-response)

---

## 日常运维任务 / Daily Operations

### 每日检查清单 / Daily Checklist

#### 1. 系统健康检查 / System Health Check

```bash
# 检查应用状态 / Check application status
pm2 status

# 检查API健康 / Check API health
curl http://localhost:3000/health

# 检查数据库连接 / Check database connection
psql -U bounty_hunter_user -d bounty_hunter_prod -c "SELECT 1;"

# 检查Redis连接 / Check Redis connection
redis-cli ping

# 检查磁盘空间 / Check disk space
df -h

# 检查内存使用 / Check memory usage
free -h

# 检查CPU使用 / Check CPU usage
top -bn1 | head -20
```

#### 2. 日志审查 / Log Review

```bash
# 检查错误日志 / Check error logs
tail -n 100 /var/www/bounty-hunter/packages/backend/logs/error-*.log

# 检查应用日志 / Check application logs
pm2 logs --lines 50

# 检查Nginx错误日志 / Check Nginx error logs
sudo tail -n 50 /var/log/nginx/error.log

# 检查数据库日志 / Check database logs
sudo tail -n 50 /var/log/postgresql/postgresql-*-main.log
```

#### 3. 性能指标 / Performance Metrics

```bash
# 查看PM2监控 / View PM2 monitoring
pm2 monit

# 查看数据库连接数 / View database connections
psql -U bounty_hunter_user -d bounty_hunter_prod -c "SELECT count(*) FROM pg_stat_activity;"

# 查看Redis内存使用 / View Redis memory usage
redis-cli INFO memory

# 查看慢查询 / View slow queries
psql -U bounty_hunter_user -d bounty_hunter_prod -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### 每周任务 / Weekly Tasks

1. **备份验证 / Backup Verification**
   ```bash
   # 验证最新备份 / Verify latest backup
   ls -lh /var/backups/bounty-hunter/ | head -10
   
   # 测试恢复 (在测试环境) / Test restore (in test environment)
   gunzip < latest_backup.sql.gz | psql -U test_user test_db
   ```

2. **安全更新 / Security Updates**
   ```bash
   # 检查系统更新 / Check system updates
   sudo apt update
   sudo apt list --upgradable
   
   # 检查npm包更新 / Check npm package updates
   cd /var/www/bounty-hunter/packages/backend
   npm outdated
   ```

3. **日志轮转 / Log Rotation**
   ```bash
   # 检查日志大小 / Check log sizes
   du -sh /var/www/bounty-hunter/packages/backend/logs/*
   
   # 清理旧日志 / Clean old logs
   find /var/www/bounty-hunter/packages/backend/logs -name "*.log" -mtime +30 -delete
   ```

### 每月任务 / Monthly Tasks

1. **性能审计 / Performance Audit**
   - 分析慢查询日志 / Analyze slow query logs
   - 检查数据库索引使用情况 / Check database index usage
   - 评估缓存命中率 / Evaluate cache hit rate

2. **容量规划 / Capacity Planning**
   - 评估磁盘使用趋势 / Assess disk usage trends
   - 分析流量增长 / Analyze traffic growth
   - 预测资源需求 / Forecast resource needs

3. **安全审计 / Security Audit**
   - 审查访问日志 / Review access logs
   - 检查失败的登录尝试 / Check failed login attempts
   - 更新SSL证书 (如需要) / Update SSL certificates (if needed)

---

## 监控指标 / Monitoring Metrics

### 关键性能指标 (KPI) / Key Performance Indicators

#### 1. 应用指标 / Application Metrics

| 指标 / Metric | 正常范围 / Normal Range | 告警阈值 / Alert Threshold |
|--------------|------------------------|---------------------------|
| API响应时间 / API Response Time | < 200ms | > 500ms |
| 错误率 / Error Rate | < 0.1% | > 1% |
| 请求量 / Request Rate | 变化 / Varies | 突增50% / Spike 50% |
| CPU使用率 / CPU Usage | < 70% | > 85% |
| 内存使用率 / Memory Usage | < 80% | > 90% |

#### 2. 数据库指标 / Database Metrics

| 指标 / Metric | 正常范围 / Normal Range | 告警阈值 / Alert Threshold |
|--------------|------------------------|---------------------------|
| 连接数 / Connections | < 50 | > 80 |
| 查询时间 / Query Time | < 100ms | > 500ms |
| 死锁 / Deadlocks | 0 | > 0 |
| 缓存命中率 / Cache Hit Rate | > 95% | < 90% |
| 磁盘使用 / Disk Usage | < 70% | > 85% |

#### 3. Redis指标 / Redis Metrics

| 指标 / Metric | 正常范围 / Normal Range | 告警阈值 / Alert Threshold |
|--------------|------------------------|---------------------------|
| 内存使用 / Memory Usage | < 80% | > 90% |
| 命中率 / Hit Rate | > 90% | < 80% |
| 连接数 / Connections | < 100 | > 200 |
| 键数量 / Key Count | 变化 / Varies | 突增100% / Spike 100% |

### 监控命令 / Monitoring Commands

#### 实时监控 / Real-time Monitoring

```bash
# 应用监控 / Application monitoring
pm2 monit

# 系统资源监控 / System resource monitoring
htop

# 网络监控 / Network monitoring
iftop

# 磁盘I/O监控 / Disk I/O monitoring
iotop
```

#### 数据库监控 / Database Monitoring

```bash
# 活动连接 / Active connections
psql -U bounty_hunter_user -d bounty_hunter_prod -c "
SELECT pid, usename, application_name, client_addr, state, query_start, query 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY query_start;
"

# 表大小 / Table sizes
psql -U bounty_hunter_user -d bounty_hunter_prod -c "
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
LIMIT 10;
"

# 索引使用情况 / Index usage
psql -U bounty_hunter_user -d bounty_hunter_prod -c "
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 10;
"
```

#### Redis监控 / Redis Monitoring

```bash
# Redis信息 / Redis info
redis-cli INFO

# 内存统计 / Memory stats
redis-cli INFO memory

# 客户端连接 / Client connections
redis-cli CLIENT LIST

# 慢查询日志 / Slow log
redis-cli SLOWLOG GET 10
```

---

## 告警处理 / Alert Handling

### 告警级别 / Alert Levels

1. **P1 - 紧急 / Critical**: 服务完全中断 / Service completely down
2. **P2 - 高 / High**: 严重性能下降 / Severe performance degradation
3. **P3 - 中 / Medium**: 部分功能受影响 / Partial functionality affected
4. **P4 - 低 / Low**: 潜在问题 / Potential issues

### 常见告警及处理 / Common Alerts and Responses

#### 1. 高CPU使用率 / High CPU Usage

**症状 / Symptoms**: CPU > 85%

**处理步骤 / Response Steps**:
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

# 4. 如果是查询问题，终止长时间运行的查询 / If query issue, kill long-running queries
psql -U bounty_hunter_user -d bounty_hunter_prod -c "SELECT pg_terminate_backend(pid);"

# 5. 如果是应用问题，重启应用 / If application issue, restart app
pm2 restart bounty-hunter-api
```

#### 2. 内存不足 / Out of Memory

**症状 / Symptoms**: Memory > 90%

**处理步骤 / Response Steps**:
```bash
# 1. 检查内存使用 / Check memory usage
free -h
ps aux --sort=-%mem | head -10

# 2. 检查应用内存 / Check application memory
pm2 list

# 3. 清理缓存 / Clear cache
redis-cli FLUSHDB

# 4. 重启应用 / Restart application
pm2 restart all

# 5. 如果问题持续，考虑扩容 / If issue persists, consider scaling
```

#### 3. 数据库连接池耗尽 / Database Connection Pool Exhausted

**症状 / Symptoms**: Connection errors in logs

**处理步骤 / Response Steps**:
```bash
# 1. 检查当前连接 / Check current connections
psql -U bounty_hunter_user -d bounty_hunter_prod -c "
SELECT count(*), state FROM pg_stat_activity GROUP BY state;
"

# 2. 终止空闲连接 / Kill idle connections
psql -U bounty_hunter_user -d bounty_hunter_prod -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < now() - interval '10 minutes';
"

# 3. 重启应用 / Restart application
pm2 restart bounty-hunter-api

# 4. 检查连接泄漏 / Check for connection leaks in code
```

#### 4. 磁盘空间不足 / Disk Space Low

**症状 / Symptoms**: Disk usage > 85%

**处理步骤 / Response Steps**:
```bash
# 1. 检查磁盘使用 / Check disk usage
df -h
du -sh /* | sort -h

# 2. 清理日志 / Clean logs
find /var/log -name "*.log" -mtime +7 -delete
find /var/www/bounty-hunter/packages/backend/logs -name "*.log" -mtime +7 -delete

# 3. 清理旧备份 / Clean old backups
find /var/backups/bounty-hunter -name "*.sql.gz" -mtime +30 -delete

# 4. 清理Docker (如果使用) / Clean Docker (if using)
docker system prune -a

# 5. 如果问题持续，扩展磁盘 / If issue persists, expand disk
```

#### 5. API响应时间慢 / Slow API Response

**症状 / Symptoms**: Response time > 500ms

**处理步骤 / Response Steps**:
```bash
# 1. 检查慢查询 / Check slow queries
psql -U bounty_hunter_user -d bounty_hunter_prod -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"

# 2. 检查缓存命中率 / Check cache hit rate
redis-cli INFO stats | grep hit

# 3. 检查网络延迟 / Check network latency
ping -c 10 database-host

# 4. 重启应用 / Restart application
pm2 restart bounty-hunter-api

# 5. 分析应用日志 / Analyze application logs
pm2 logs --lines 200 | grep "slow"
```

---

## 维护窗口 / Maintenance Windows

### 计划维护 / Planned Maintenance

**推荐时间 / Recommended Time**: 每周日凌晨2:00-4:00 / Sunday 2:00-4:00 AM

#### 维护前检查清单 / Pre-Maintenance Checklist

- [ ] 通知用户维护时间 / Notify users of maintenance window
- [ ] 创建完整备份 / Create full backup
- [ ] 准备回滚计划 / Prepare rollback plan
- [ ] 测试环境验证 / Test in staging environment
- [ ] 准备监控工具 / Prepare monitoring tools

#### 维护步骤 / Maintenance Steps

```bash
# 1. 创建备份 / Create backup
/usr/local/bin/backup-db.sh

# 2. 启用维护模式 / Enable maintenance mode
# (在Nginx配置中返回503) / (Return 503 in Nginx config)

# 3. 停止应用 / Stop application
pm2 stop all

# 4. 执行维护任务 / Perform maintenance tasks
# - 数据库迁移 / Database migrations
# - 更新应用 / Update application
# - 清理数据 / Clean data

# 5. 启动应用 / Start application
pm2 start all

# 6. 验证功能 / Verify functionality
curl http://localhost:3000/health

# 7. 禁用维护模式 / Disable maintenance mode

# 8. 监控应用 / Monitor application
pm2 monit
```

#### 维护后检查清单 / Post-Maintenance Checklist

- [ ] 验证所有服务正常运行 / Verify all services running
- [ ] 检查错误日志 / Check error logs
- [ ] 测试关键功能 / Test critical features
- [ ] 监控性能指标 / Monitor performance metrics
- [ ] 通知用户维护完成 / Notify users maintenance complete

---

## 备份策略 / Backup Strategy

### 备份类型 / Backup Types

1. **完整备份 / Full Backup**: 每日 / Daily
2. **增量备份 / Incremental Backup**: 每小时 / Hourly
3. **快照备份 / Snapshot Backup**: 每周 / Weekly

### 备份脚本 / Backup Scripts

#### 数据库完整备份 / Database Full Backup

```bash
#!/bin/bash
# /usr/local/bin/backup-db-full.sh

BACKUP_DIR="/var/backups/bounty-hunter/full"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# 备份数据库 / Backup database
pg_dump -U bounty_hunter_user -Fc bounty_hunter_prod > $BACKUP_DIR/db_full_$DATE.dump

# 压缩备份 / Compress backup
gzip $BACKUP_DIR/db_full_$DATE.dump

# 删除旧备份 / Delete old backups
find $BACKUP_DIR -name "db_full_*.dump.gz" -mtime +$RETENTION_DAYS -delete

# 上传到云存储 (可选) / Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/db_full_$DATE.dump.gz s3://your-bucket/backups/

echo "Backup completed: db_full_$DATE.dump.gz"
```

#### Redis备份 / Redis Backup

```bash
#!/bin/bash
# /usr/local/bin/backup-redis.sh

BACKUP_DIR="/var/backups/bounty-hunter/redis"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 触发Redis保存 / Trigger Redis save
redis-cli BGSAVE

# 等待保存完成 / Wait for save to complete
sleep 5

# 复制RDB文件 / Copy RDB file
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# 压缩 / Compress
gzip $BACKUP_DIR/redis_$DATE.rdb

echo "Redis backup completed: redis_$DATE.rdb.gz"
```

### 恢复测试 / Recovery Testing

每月进行一次恢复测试 / Perform recovery test monthly:

```bash
# 1. 创建测试数据库 / Create test database
createdb -U postgres test_recovery

# 2. 恢复备份 / Restore backup
pg_restore -U postgres -d test_recovery /var/backups/bounty-hunter/full/latest.dump

# 3. 验证数据 / Verify data
psql -U postgres -d test_recovery -c "SELECT count(*) FROM users;"

# 4. 清理测试数据库 / Clean up test database
dropdb -U postgres test_recovery
```

---

## 性能调优 / Performance Tuning

### 数据库优化 / Database Optimization

#### 1. 查询优化 / Query Optimization

```sql
-- 分析慢查询 / Analyze slow queries
SELECT query, calls, total_time, mean_time, stddev_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;

-- 检查未使用的索引 / Check unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- 检查表膨胀 / Check table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
       n_dead_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

#### 2. 索引维护 / Index Maintenance

```sql
-- 重建索引 / Rebuild indexes
REINDEX TABLE tasks;
REINDEX TABLE users;

-- 更新统计信息 / Update statistics
ANALYZE;

-- 清理死元组 / Clean dead tuples
VACUUM ANALYZE;
```

#### 3. 连接池调优 / Connection Pool Tuning

在 `packages/backend/src/config/database.ts` 中调整:

```typescript
// 根据负载调整 / Adjust based on load
min: 5,  // 最小连接数 / Minimum connections
max: 50, // 最大连接数 / Maximum connections
```

### Redis优化 / Redis Optimization

```bash
# 检查内存使用 / Check memory usage
redis-cli INFO memory

# 设置最大内存 / Set max memory
redis-cli CONFIG SET maxmemory 512mb

# 设置淘汰策略 / Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 清理过期键 / Clean expired keys
redis-cli --scan --pattern "*" | xargs redis-cli DEL
```

### 应用优化 / Application Optimization

1. **启用压缩 / Enable Compression**
   ```javascript
   // 在 index.ts 中添加 / Add in index.ts
   import compression from 'compression';
   app.use(compression());
   ```

2. **优化缓存策略 / Optimize Caching**
   - 增加缓存TTL / Increase cache TTL
   - 使用缓存预热 / Use cache warming
   - 实施缓存分层 / Implement cache layering

3. **代码优化 / Code Optimization**
   - 减少数据库查询 / Reduce database queries
   - 使用批量操作 / Use batch operations
   - 实施懒加载 / Implement lazy loading

---

## 安全审计 / Security Audit

### 每月安全检查 / Monthly Security Checks

```bash
# 1. 检查失败的登录尝试 / Check failed login attempts
grep "authentication failed" /var/www/bounty-hunter/packages/backend/logs/*.log | wc -l

# 2. 检查异常访问 / Check unusual access
sudo tail -n 1000 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# 3. 检查开放端口 / Check open ports
sudo netstat -tulpn | grep LISTEN

# 4. 检查用户权限 / Check user permissions
sudo find /var/www/bounty-hunter -type f -perm /o+w

# 5. 检查SSL证书有效期 / Check SSL certificate expiry
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 安全更新 / Security Updates

```bash
# 检查系统安全更新 / Check system security updates
sudo apt update
sudo apt list --upgradable | grep -i security

# 应用安全更新 / Apply security updates
sudo apt upgrade -y

# 检查npm安全漏洞 / Check npm vulnerabilities
cd /var/www/bounty-hunter/packages/backend
npm audit

# 修复npm漏洞 / Fix npm vulnerabilities
npm audit fix
```

---

## 应急响应 / Incident Response

### 应急响应流程 / Incident Response Process

1. **检测 / Detection**: 监控告警触发 / Monitoring alert triggered
2. **评估 / Assessment**: 确定影响范围 / Determine impact scope
3. **遏制 / Containment**: 限制问题扩散 / Limit problem spread
4. **根因分析 / Root Cause Analysis**: 找出问题原因 / Find root cause
5. **恢复 / Recovery**: 恢复正常服务 / Restore normal service
6. **事后分析 / Post-Mortem**: 总结经验教训 / Learn from incident

### 应急联系人 / Emergency Contacts

| 角色 / Role | 联系方式 / Contact | 职责 / Responsibility |
|------------|-------------------|---------------------|
| 技术负责人 / Tech Lead | +86-xxx-xxxx-xxxx | 技术决策 / Technical decisions |
| 运维工程师 / DevOps | +86-xxx-xxxx-xxxx | 系统维护 / System maintenance |
| 数据库管理员 / DBA | +86-xxx-xxxx-xxxx | 数据库问题 / Database issues |
| 安全工程师 / Security | +86-xxx-xxxx-xxxx | 安全事件 / Security incidents |

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

## 附录 / Appendix

### 有用的命令速查 / Useful Command Reference

```bash
# PM2命令 / PM2 Commands
pm2 list                    # 列出所有进程 / List all processes
pm2 logs                    # 查看日志 / View logs
pm2 monit                   # 监控面板 / Monitoring dashboard
pm2 restart <name>          # 重启进程 / Restart process
pm2 stop <name>             # 停止进程 / Stop process
pm2 delete <name>           # 删除进程 / Delete process
pm2 save                    # 保存配置 / Save configuration
pm2 resurrect               # 恢复配置 / Resurrect configuration

# PostgreSQL命令 / PostgreSQL Commands
psql -U user -d database    # 连接数据库 / Connect to database
\l                          # 列出数据库 / List databases
\dt                         # 列出表 / List tables
\d table_name               # 描述表 / Describe table
\q                          # 退出 / Quit

# Redis命令 / Redis Commands
redis-cli                   # 连接Redis / Connect to Redis
PING                        # 测试连接 / Test connection
INFO                        # 查看信息 / View info
KEYS *                      # 列出所有键 / List all keys
FLUSHDB                     # 清空当前数据库 / Flush current database
FLUSHALL                    # 清空所有数据库 / Flush all databases

# 系统命令 / System Commands
df -h                       # 磁盘使用 / Disk usage
free -h                     # 内存使用 / Memory usage
top                         # 进程监控 / Process monitoring
htop                        # 增强版top / Enhanced top
netstat -tulpn              # 网络连接 / Network connections
systemctl status <service>  # 服务状态 / Service status
```

---

**最后更新 / Last Updated**: 2024-12-11

**版本 / Version**: 1.0.0

**维护者 / Maintainer**: DevOps Team
