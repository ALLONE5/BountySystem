# 配置说明 / Configuration Guide

## 环境变量配置 / Environment Variables

### 核心配置 / Core Configuration

详细的环境变量说明请参考以下文件:
For detailed environment variable descriptions, refer to:

- 开发环境 / Development: `packages/backend/.env.example`
- 生产环境 / Production: `packages/backend/.env.production.example`

### 配置分类 / Configuration Categories

#### 1. 服务器配置 / Server Configuration
- `NODE_ENV`: 运行环境 (development/production/test)
- `PORT`: 服务端口 (默认3000)

#### 2. 数据库配置 / Database Configuration
- `DB_HOST`: 数据库主机地址
- `DB_PORT`: 数据库端口 (默认5432)
- `DB_NAME`: 数据库名称
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `DB_SSL`: 是否启用SSL (true/false)
- `DB_POOL_MIN`: 最小连接数
- `DB_POOL_MAX`: 最大连接数

#### 3. Redis配置 / Redis Configuration
- `REDIS_HOST`: Redis主机地址
- `REDIS_PORT`: Redis端口 (默认6379)
- `REDIS_PASSWORD`: Redis密码
- `REDIS_DB`: Redis数据库编号
- `REDIS_TLS`: 是否启用TLS

#### 4. JWT配置 / JWT Configuration
- `JWT_SECRET`: JWT签名密钥 (生产环境必须修改)
- `JWT_EXPIRES_IN`: Token过期时间
- `JWT_REFRESH_SECRET`: 刷新Token密钥
- `JWT_REFRESH_EXPIRES_IN`: 刷新Token过期时间

#### 5. 日志配置 / Logging Configuration
- `LOG_LEVEL`: 日志级别 (error/warn/info/debug)
- `LOG_FILE_PATH`: 日志文件路径
- `LOG_MAX_FILES`: 保留日志文件天数
- `LOG_MAX_SIZE`: 单个日志文件最大大小
- `LOG_TO_CONSOLE`: 是否输出到控制台

#### 6. 安全配置 / Security Configuration
- `BCRYPT_ROUNDS`: 密码加密轮数 (生产环境建议12)
- `SESSION_SECRET`: 会话密钥
- `CORS_ORIGIN`: 允许的跨域来源
- `CORS_CREDENTIALS`: 是否允许携带凭证

#### 7. 性能配置 / Performance Configuration
- `ENABLE_COMPRESSION`: 是否启用压缩
- `ENABLE_CACHE`: 是否启用缓存
- `CACHE_TTL`: 缓存过期时间(秒)
- `RATE_LIMIT_WINDOW_MS`: 速率限制时间窗口
- `RATE_LIMIT_MAX_REQUESTS`: 最大请求数

## 数据库配置 / Database Configuration

### PostgreSQL优化 / PostgreSQL Optimization

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
