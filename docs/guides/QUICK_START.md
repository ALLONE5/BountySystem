# 快速开始指南

## 项目设置

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量

#### 后端 (.env)
```bash
cd packages/backend
cp .env.example .env
# 编辑 .env 文件，设置数据库和 Redis 连接信息
```

#### 前端 (.env)
```bash
cd packages/frontend
# 创建 .env 文件
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

### 3. 启动数据库
```bash
# 使用 Docker Compose
docker-compose -f docker-compose.dev.yml up -d
```

### 4. 初始化数据库
```bash
# 检查数据库连接
node packages/backend/scripts/db-manager.js check

# 运行迁移
cd packages/backend
npm run migrate

# 创建种子数据
node scripts/db-manager.js seed
```

### 5. 启动应用

#### 启动后端
```bash
cd packages/backend
npm run dev
```

#### 启动前端
```bash
cd packages/frontend
npm run dev
```

## 常用命令

### 项目维护
```bash
# 检查 TypeScript 类型
node scripts/maintenance.js check-types

# 运行项目审计
node scripts/maintenance.js audit

# 清理临时文件
node scripts/maintenance.js clean-temp

# 列出所有脚本
node scripts/maintenance.js list-scripts
```

### 数据库管理
```bash
# 检查数据库连接
node packages/backend/scripts/db-manager.js check

# 创建测试数据
node packages/backend/scripts/db-manager.js seed-test

# 创建赏金测试数据
node packages/backend/scripts/db-manager.js seed-bounty

# 重置管理员密码
node packages/backend/scripts/db-manager.js reset-admin

# 刷新排名数据
node packages/backend/scripts/db-manager.js refresh-ranks
```

### 开发
```bash
# 前端开发服务器
cd packages/frontend
npm run dev

# 后端开发服务器
cd packages/backend
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

## 默认账户

### 管理员账户
- 用户名: `admin`
- 密码: `admin123`

### 开发者账户
- 用户名: `developer`
- 密码: `dev123`

### 普通用户
- 用户名: `user`
- 密码: `user123`

## 访问地址

- 前端: http://localhost:5173
- 后端 API: http://localhost:3001/api
- 数据库: localhost:5432
- Redis: localhost:6379

## 项目结构

```
BountyHunterPlatform/
├── packages/
│   ├── frontend/          # React 前端
│   ├── backend/           # Node.js 后端
│   └── database/          # 数据库迁移
├── scripts/               # 维护脚本
├── docs/                  # 文档
└── docker-compose.*.yml   # Docker 配置
```

## 常见问题

### 数据库连接失败
1. 检查 PostgreSQL 是否运行
2. 检查 .env 中的数据库配置
3. 运行 `node packages/backend/scripts/db-manager.js check`

### 前端无法连接后端
1. 检查后端是否运行在 3001 端口
2. 检查前端 .env 中的 VITE_API_URL
3. 检查 CORS 配置

### 迁移失败
1. 检查数据库是否存在
2. 检查数据库用户权限
3. 查看迁移日志

## 更多信息

- [项目状态](../PROJECT_STATUS.md) - 项目概览和当前状态
- [系统架构](../ARCHITECTURE.md) - 系统架构和技术设计
- [开发指南](../DEVELOPMENT.md) - 开发规范和工具
- [数据库设置](../setup/DATABASE_SETUP.md) - 数据库配置详细说明
- [功能指南](../FEATURES_GUIDE.md) - 功能模块详细说明

## 获取帮助

```bash
# 查看维护工具帮助
node scripts/maintenance.js help

# 查看数据库管理帮助
node packages/backend/scripts/db-manager.js help
```

---

**快速开始指南** | 最后更新: 2026-03-11
