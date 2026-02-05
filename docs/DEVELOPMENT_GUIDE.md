# 赏金猎人平台 - 开发指南

本文档提供项目开发的完整指南，包括快速开始、项目结构、开发工具、编码规范和测试指南。

---

## 📋 目录

1. [项目简介](#项目简介)
2. [快速开始](#快速开始)
3. [项目结构](#项目结构)
4. [技术栈](#技术栈)
5. [开发工具](#开发工具)
6. [编码规范](#编码规范)
7. [测试指南](#测试指南)
8. [测试账号](#测试账号)
9. [调试指南](#调试指南)
10. [构建与部署](#构建与部署)

---

## 项目简介

赏金猎人平台是一个企业级任务管理和协作系统，支持多层级任务拆解、智能赏金计算、团队协作、实时通知和多维度数据可视化。

### 核心功能
- **用户与权限管理**: JWT认证、角色系统、岗位系统
- **任务管理系统**: 多层级任务、任务依赖、任务承接
- **赏金系统**: 自动计算、算法管理、赏金分配
- **协作功能**: 任务组群、辅助用户、任务评审
- **通知系统**: 实时推送、异步处理
- **排名与头像**: 排名计算、头像解锁
- **任务可视化**: 列表、看板、日历、甘特图
- **管理功能**: 用户管理、任务管理、申请审核
- **调度系统**: 定时任务、Cron表达式
- **性能优化**: 缓存、异步处理、速率限制

---

## 快速开始

### 环境要求
- **Node.js**: >= 18.0.0
- **PostgreSQL**: >= 14.0
- **Redis**: >= 6.0
- **Docker**: (可选，推荐用于开发环境)

### 方式一：使用 Docker (推荐)

```bash
# 1. 克隆项目
git clone <repository-url>
cd bounty-hunter-platform

# 2. 启动服务
docker compose -f docker-compose.dev.yml up -d

# 3. 检查服务状态
docker compose -f docker-compose.dev.yml ps

# 4. 安装依赖
npm install

# 5. 启动后端（新终端）
npm run dev:backend

# 6. 启动前端（新终端）
npm run dev:frontend
```

### 方式二：本地安装

```bash
# 1. 克隆项目
git clone <repository-url>
cd bounty-hunter-platform

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp packages/backend/.env.example packages/backend/.env
# 编辑 .env 文件，配置数据库和Redis连接

# 4. 初始化数据库
cd packages/database
# 创建数据库
psql -U postgres -c "CREATE DATABASE bounty_hunter_dev;"
# 运行迁移
psql -U postgres -d bounty_hunter_dev -f migrations/20241210_000001_create_core_tables.sql
psql -U postgres -d bounty_hunter_dev -f migrations/20241210_000002_create_auxiliary_tables.sql
psql -U postgres -d bounty_hunter_dev -f migrations/20241211_000001_create_bounty_transactions.sql
psql -U postgres -d bounty_hunter_dev -f migrations/20241211_000002_add_performance_indexes.sql

# 5. 填充测试数据（可选）
node scripts/seed_data.js

# 6. 启动后端（新终端）
cd ../..
npm run dev:backend

# 7. 启动前端（新终端）
npm run dev:frontend
```

### 访问应用
- **前端**: http://localhost:5173
- **后端API**: http://localhost:3000/api
- **健康检查**: http://localhost:3000/health

### 验证服务

```bash
# 检查API
curl http://localhost:3000/api

# 检查健康状态
curl http://localhost:3000/health

# 检查PostgreSQL
psql -U postgres -d bounty_hunter_dev -c "SELECT 1;"

# 检查Redis
redis-cli ping
```

---

## 项目结构

### 目录结构概览

```
bounty-hunter-platform/
├── 📄 package.json                  # 根项目配置 (Workspaces, Scripts)
├── 📄 docker-compose.dev.yml        # 开发环境编排
├── 📄 docker-compose.production.yml # 生产环境编排
├── 📄 nginx.conf                    # Nginx配置
├── 📂 .kiro/                        # 项目规范与文档
│   └── specs/                       # 功能规格
│       └── bounty-hunter-platform/
│           ├── requirements.md      # 需求文档
│           ├── design.md            # 设计文档
│           └── tasks.md             # 任务列表
├── 📂 docs/                         # 项目文档
│   ├── README.md                    # 文档索引
│   ├── DEVELOPMENT_GUIDE.md         # 开发指南（本文档）
│   ├── FEATURES_SUMMARY.md          # 功能总结
│   ├── operations/
│   │   └── OPERATIONS_GUIDE.md      # 运维指南
│   ├── backend/                     # 后端文档
│   └── frontend/                    # 前端文档
├── 📂 packages/                     # Monorepo工作区
│   ├── 📂 backend/                  # 后端服务 (Node.js + Express)
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📂 src/
│   │   │   ├── 📄 index.ts          # 应用入口
│   │   │   ├── 📂 config/           # 配置文件
│   │   │   │   ├── database.ts      # 数据库配置
│   │   │   │   ├── redis.ts         # Redis配置
│   │   │   │   ├── env.ts           # 环境变量
│   │   │   │   └── logger.ts        # 日志配置
│   │   │   ├── 📂 middleware/       # 中间件
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── errorHandler.middleware.ts
│   │   │   │   ├── rateLimit.middleware.ts
│   │   │   │   └── validation.middleware.ts
│   │   │   ├── 📂 models/           # 数据模型
│   │   │   │   ├── User.ts
│   │   │   │   ├── Task.ts
│   │   │   │   ├── Position.ts
│   │   │   │   └── ...
│   │   │   ├── 📂 routes/           # API路由
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── task.routes.ts
│   │   │   │   ├── user.routes.ts
│   │   │   │   └── ...
│   │   │   ├── 📂 services/         # 业务逻辑层
│   │   │   │   ├── UserService.ts
│   │   │   │   ├── TaskService.ts
│   │   │   │   ├── BountyService.ts
│   │   │   │   ├── CacheService.ts
│   │   │   │   └── ...
│   │   │   ├── 📂 utils/            # 工具函数
│   │   │   │   ├── asyncHandler.ts
│   │   │   │   ├── errors.ts
│   │   │   │   └── jwt.ts
│   │   │   └── 📂 workers/          # 后台任务
│   │   │       ├── QueueWorker.ts
│   │   │       └── startWorkers.ts
│   │   └── 📂 scripts/              # 运维脚本
│   │
│   ├── 📂 frontend/                 # 前端应用 (React + Vite)
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 vite.config.ts
│   │   ├── 📂 src/
│   │   │   ├── 📄 main.tsx          # 应用入口
│   │   │   ├── 📄 App.tsx           # 根组件
│   │   │   ├── 📂 api/              # API接口封装
│   │   │   │   ├── createApiClient.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── task.ts
│   │   │   │   └── ...
│   │   │   ├── 📂 components/       # 通用UI组件
│   │   │   │   ├── common/          # 基础组件
│   │   │   │   └── ...
│   │   │   ├── 📂 pages/            # 页面组件
│   │   │   │   ├── auth/            # 认证页面
│   │   │   │   ├── admin/           # 管理页面
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   └── ...
│   │   │   ├── 📂 hooks/            # 自定义Hooks
│   │   │   │   ├── useCrudOperations.ts
│   │   │   │   ├── useModalState.ts
│   │   │   │   └── ...
│   │   │   ├── 📂 store/            # 状态管理 (Zustand)
│   │   │   │   └── authStore.ts
│   │   │   ├── 📂 router/           # 路由配置
│   │   │   │   └── index.tsx
│   │   │   ├── 📂 types/            # TypeScript类型
│   │   │   │   └── index.ts
│   │   │   └── 📂 utils/            # 工具函数
│   │   │       ├── formRules.ts
│   │   │       └── formatters.ts
│   │   └── 📂 public/               # 静态资源
│   │
│   └── 📂 database/                 # 数据库管理
│       ├── 📄 SCHEMA.md             # 数据库设计文档
│       ├── 📂 migrations/           # 数据库迁移文件
│       │   ├── 20241210_000001_create_core_tables.sql
│       │   ├── 20241210_000002_create_auxiliary_tables.sql
│       │   └── ...
│       └── 📂 scripts/              # 数据库脚本
│           ├── run_migrations.sh
│           ├── seed_data.js
│           └── ...
└── 📂 archive/                      # 历史文档归档
```

### 模块职责

#### 后端 (Backend)
- **config/**: 管理环境变量、数据库连接池、Redis客户端等配置
- **middleware/**: 请求拦截，包含身份验证、日志、错误处理等
- **routes/**: 定义API URL，接收HTTP请求，参数校验，调用Service层
- **services/**: 封装业务逻辑，与数据库交互
- **models/**: 定义数据库表的TypeScript接口和类型
- **workers/**: 处理耗时操作或定时任务
- **utils/**: 通用工具函数

#### 前端 (Frontend)
- **pages/**: 对应路由的完整页面组件
- **components/**: 可复用的UI组件
- **api/**: 封装Axios请求，将后端API映射为前端函数
- **hooks/**: 自定义React Hooks
- **store/**: 使用Zustand管理全局状态
- **router/**: 配置URL与页面的映射关系
- **types/**: TypeScript类型定义
- **utils/**: 前端工具函数

#### 数据库 (Database)
- **migrations/**: 记录数据库Schema的变更历史
- **scripts/**: 数据库维护和初始化脚本
- **SCHEMA.md**: 详细的数据库设计文档

---

## 技术栈

### 后端技术栈
- **运行时**: Node.js 18+
- **语言**: TypeScript 5.3+
- **框架**: Express.js
- **数据库**: PostgreSQL 14+
- **缓存**: Redis 6+
- **实时通信**: Socket.io
- **认证**: JWT (JSON Web Tokens)
- **测试**: Vitest
- **队列**: Bull (Redis-based)
- **日志**: Winston
- **ORM**: 原生SQL + Knex.js

### 前端技术栈
- **框架**: React 18
- **语言**: TypeScript 5.3+
- **构建工具**: Vite
- **UI库**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router 6
- **HTTP客户端**: Axios
- **实时通信**: Socket.io-client
- **表单**: Ant Design Form
- **图表**: Recharts, D3.js

### 开发工具
- **代码检查**: ESLint
- **代码格式化**: Prettier
- **Git Hooks**: Husky
- **提交规范**: Conventional Commits
- **容器化**: Docker, Docker Compose

---

## 开发工具

### 前端通用工具

#### 1. useCrudOperations Hook

封装了完整的CRUD操作逻辑，减少重复代码。

**基本用法**:
```typescript
import { useCrudOperations } from '../hooks/useCrudOperations';
import { positionApi } from '../api/position';

function PositionManagementPage() {
  const {
    data: positions,
    loading,
    create,
    update,
    deleteItem,
    refresh,
  } = useCrudOperations({
    fetchAll: positionApi.getAllPositions,
    create: positionApi.createPosition,
    update: positionApi.updatePosition,
    delete: positionApi.deletePosition,
  });

  const handleCreate = async (data) => {
    const result = await create(data);
    if (result) {
      // 创建成功
    }
  };

  return <Table dataSource={positions} loading={loading} />;
}
```

**自定义消息**:
```typescript
const { data, loading, create } = useCrudOperations({
  fetchAll: positionApi.getAllPositions,
  create: positionApi.createPosition,
  successMessages: {
    create: '岗位创建成功',
    update: '岗位更新成功',
    delete: '岗位删除成功',
  },
  errorMessages: {
    fetch: '加载岗位列表失败',
    create: '创建岗位失败',
  },
});
```

#### 2. useModalState Hook

简化Modal状态管理。

**基本用法**:
```typescript
import { useModalState } from '../hooks/useModalState';

function MyComponent() {
  const modal = useModalState();

  return (
    <div>
      <Button onClick={() => modal.open()}>打开</Button>
      <Modal visible={modal.visible} onCancel={modal.close}>
        <p>Modal内容</p>
      </Modal>
    </div>
  );
}
```

**传递数据**:
```typescript
interface User {
  id: string;
  name: string;
}

function UserList() {
  const editModal = useModalState<User>();

  const handleEdit = (user: User) => {
    editModal.open(user);
  };

  return (
    <Modal visible={editModal.visible} onCancel={editModal.close}>
      {editModal.data && (
        <Form initialValues={editModal.data}>
          <Form.Item name="name">
            <Input />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
```

#### 3. formRules 工具

提供常用的表单验证规则。

**基本验证规则**:
```typescript
import { formRules } from '../utils/formRules';

<Form>
  {/* 必填 */}
  <Form.Item name="name" rules={[formRules.required()]}>
    <Input />
  </Form.Item>

  {/* 邮箱验证 */}
  <Form.Item name="email" rules={[formRules.email()]}>
    <Input />
  </Form.Item>

  {/* 长度验证 */}
  <Form.Item name="username" rules={[formRules.lengthRange(3, 20)]}>
    <Input />
  </Form.Item>

  {/* 密码强度验证 */}
  <Form.Item name="password" rules={[formRules.password()]}>
    <Input.Password />
  </Form.Item>
</Form>
```

**预定义规则组合**:
```typescript
import { commonRuleSets } from '../utils/formRules';

<Form>
  {/* 必填的邮箱 */}
  <Form.Item name="email" rules={commonRuleSets.requiredEmail()}>
    <Input />
  </Form.Item>

  {/* 必填的用户名 */}
  <Form.Item name="username" rules={commonRuleSets.requiredUsername()}>
    <Input />
  </Form.Item>

  {/* 必填的密码 */}
  <Form.Item name="password" rules={commonRuleSets.requiredPassword()}>
    <Input.Password />
  </Form.Item>
</Form>
```

#### 4. createApiClient 工具

创建统一的API客户端。

**基本用法**:
```typescript
import { createApiClient } from './createApiClient';

export const positionApi = createApiClient<Position>('/positions');

// 自动获得以下方法：
// - getAll()
// - getById(id)
// - create(data)
// - update(id, data)
// - delete(id)
```

### 后端通用工具

#### 1. asyncHandler

异步错误处理包装器。

**用法**:
```typescript
import { asyncHandler } from '../utils/asyncHandler';

router.get('/tasks', asyncHandler(async (req, res) => {
  const tasks = await taskService.getAllTasks();
  res.json(tasks);
}));
```

#### 2. AppError

统一的错误类。

**用法**:
```typescript
import { AppError } from '../utils/errors';

if (!user) {
  throw new AppError('用户不存在', 404);
}

if (!hasPermission) {
  throw new AppError('权限不足', 403);
}
```

#### 3. CacheService

Redis缓存服务。

**用法**:
```typescript
import { CacheService } from '../services/CacheService';

// 获取缓存
const cached = await CacheService.get('key');

// 设置缓存
await CacheService.set('key', data, 3600); // TTL: 3600秒

// 删除缓存
await CacheService.del('key');

// 清空缓存
await CacheService.flush();
```

#### 4. QueueService

消息队列服务。

**用法**:
```typescript
import { QueueService } from '../services/QueueService';

// 添加任务到队列
await QueueService.addJob('email', {
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Hello!',
});

// 处理队列任务
QueueService.process('email', async (job) => {
  await sendEmail(job.data);
});
```

---

## 📝 编码规范

### TypeScript
- 使用严格模式
- 避免使用 `any` 类型
- 为所有函数添加类型注解
- 使用接口定义数据结构

### React
- 使用函数组件和Hooks
- 组件文件使用PascalCase命名
- 自定义Hook以use开头
- 使用React.memo优化性能

### 后端
- 所有路由使用asyncHandler包装
- 使用Service层处理业务逻辑
- 错误使用AppError类抛出
- 添加适当的日志记录

### 命名规范
- 文件名: kebab-case (user-service.ts)
- 组件名: PascalCase (UserProfile.tsx)
- 函数名: camelCase (getUserById)
- 常量名: UPPER_SNAKE_CASE (MAX_RETRY_COUNT)

---

## 测试账号

### 默认测试账号

所有测试账号的密码都是：**`Password123`**

#### 超级管理员
- **用户名**: `admin`
- **邮箱**: `admin@example.com`
- **密码**: `Password123`
- **角色**: super_admin
- **权限**: 完全访问权限

#### 岗位管理员
- **用户名**: `manager1`
- **邮箱**: `manager1@example.com`
- **密码**: `Password123`
- **角色**: position_admin
- **管理岗位**: Frontend Developer, Backend Developer, UI/UX Designer

#### 开发人员
- **用户名**: `developer1`
- **邮箱**: `dev1@example.com`
- **密码**: `Password123`
- **角色**: user
- **岗位**: Frontend Developer

- **用户名**: `developer2`
- **邮箱**: `dev2@example.com`
- **密码**: `Password123`
- **角色**: user
- **岗位**: Backend Developer

#### 设计师
- **用户名**: `designer1`
- **邮箱**: `designer1@example.com`
- **密码**: `Password123`
- **角色**: user
- **岗位**: UI/UX Designer

#### 普通用户
- **用户名**: `user1`, `user2`, `user3`
- **邮箱**: `user1@example.com`, `user2@example.com`, `user3@example.com`
- **密码**: `Password123`
- **角色**: user
- **岗位**: 无

### 登录方式

你可以使用用户名或邮箱登录：

```bash
# 使用用户名登录
用户名: admin
密码: Password123

# 使用邮箱登录
邮箱: admin@example.com
密码: Password123
```

### 通过API注册新账号

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "NewPassword123"
  }'
```

### 重置测试数据

如果需要重置测试数据，运行：

```bash
cd packages/database
node scripts/seed_data.js
```

这将重新创建所有测试账号和示例数据。

---

## 调试指南

### 后端调试

#### 启动调试模式
```bash
# 使用Node.js调试器
npm run dev:debug

# 或使用VS Code调试
# 在VS Code中按F5启动调试
```

#### 查看日志
```bash
# 实时查看日志
tail -f packages/backend/logs/app.log

# 查看错误日志
tail -f packages/backend/logs/error.log

# 使用PM2查看日志（生产环境）
pm2 logs bounty-hunter-api
```

#### 数据库调试
```bash
# 连接到数据库
psql -U postgres -d bounty_hunter_dev

# 查看所有表
\dt

# 查看表结构
\d users

# 查看慢查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### Redis调试
```bash
# 连接到Redis
redis-cli

# 查看所有键
KEYS *

# 查看键值
GET key_name

# 监控Redis命令
MONITOR
```

### 前端调试

#### 使用React DevTools
1. 安装React DevTools浏览器扩展
2. 打开浏览器开发者工具
3. 切换到React标签页
4. 查看组件树和Props/State

#### 使用浏览器开发者工具
- **Console**: 查看日志和错误
- **Network**: 查看API请求和响应
- **Application**: 查看LocalStorage和SessionStorage
- **Performance**: 分析性能问题

#### API请求调试
```typescript
// 在API客户端中添加日志
import axios from 'axios';

axios.interceptors.request.use(request => {
  console.log('Starting Request', request);
  return request;
});

axios.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
});
```

---

## 构建与部署

### 构建

#### 构建后端
```bash
cd packages/backend
npm run build

# 输出目录: dist/
```

#### 构建前端
```bash
cd packages/frontend
npm run build

# 输出目录: dist/
```

### 部署

详细的部署说明请参考: [运维指南](operations/OPERATIONS_GUIDE.md)

#### Docker部署
```bash
# 构建镜像
docker-compose -f docker-compose.production.yml build

# 启动服务
docker-compose -f docker-compose.production.yml up -d

# 查看状态
docker-compose -f docker-compose.production.yml ps
```

#### 传统部署
```bash
# 使用PM2管理进程
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

---

## 常见问题

### 开发环境问题

#### Q: 为什么看到 Authentication Error？
A: 这是正常的！未登录时访问受保护的资源会返回认证错误。登录后这些错误会消失。

#### Q: 为什么看到 Rate Limit Error？
A: 这是安全功能！系统检测到短时间内有太多请求。等待60秒后重试，或运行 `npm run clear-rate-limits` 清除限制（仅开发环境）。

#### Q: 数据库连接失败怎么办？
A: 检查以下几点：
1. PostgreSQL是否正在运行
2. 密码是否正确
3. 数据库名称是否正确
4. 端口5432是否可用

#### Q: Redis连接失败怎么办？
A: 检查以下几点：
1. Redis是否正在运行
2. 端口6379是否可用
3. 如果使用密码，确保.env中配置正确

### 测试问题

#### Q: 测试失败怎么办？
A: 
1. 确保PostgreSQL和Redis正在运行
2. 运行 `npm run clear-rate-limits` 清除速率限制
3. 检查测试日志查看具体错误
4. 确保测试数据库已初始化

---

## 相关文档

### 核心文档
- [运维指南](operations/OPERATIONS_GUIDE.md) - 配置、部署、运维
- [功能总结](FEATURES_SUMMARY.md) - 功能模块说明
- [优化总结](OPTIMIZATION_SUMMARY.md) - 项目优化历史
- [文档结构](DOCUMENTATION_STRUCTURE.md) - 文档组织说明

### 规格文档
- [需求文档](../.kiro/specs/bounty-hunter-platform/requirements.md) - 完整需求规格
- [设计文档](../.kiro/specs/bounty-hunter-platform/design.md) - 系统设计文档
- [任务列表](../.kiro/specs/bounty-hunter-platform/tasks.md) - 实施任务列表

### 数据库文档
- [数据库设计](../packages/database/SCHEMA.md) - 数据库表结构

---

**最后更新**: 2025-01-04
**版本**: 2.0.0

