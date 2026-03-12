# 开发指南

**最后更新**: 2026-03-11

本文档提供完整的开发指南，包括快速开始、项目结构、开发规范和代码质量标准。

---

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Redis >= 6.0

### 安装和启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp packages/backend/.env.example packages/backend/.env
# 编辑 .env 文件

# 3. 启动数据库（Docker）
docker-compose -f docker-compose.dev.yml up -d

# 4. 初始化数据库
node packages/backend/scripts/db-manager.js check
node packages/backend/scripts/db-manager.js seed

# 5. 启动应用
npm run dev:backend  # 终端1
npm run dev:frontend # 终端2
```

### 访问地址
- 前端: http://localhost:5173
- 后端: http://localhost:3001/api

### 默认账户
- 管理员: `admin` / `admin123`
- 开发者: `developer` / `dev123`
- 用户: `user` / `user123`

---

## 项目结构

```
BountyHunterPlatform/
├── packages/
│   ├── frontend/          # React 前端
│   │   ├── src/
│   │   │   ├── api/       # API 客户端
│   │   │   ├── components/# 组件
│   │   │   ├── pages/     # 页面
│   │   │   ├── hooks/     # 自定义 Hooks
│   │   │   ├── contexts/  # Context
│   │   │   ├── router/    # 路由
│   │   │   ├── types/     # 类型定义
│   │   │   └── utils/     # 工具函数
│   │   └── package.json
│   │
│   ├── backend/           # Node.js 后端
│   │   ├── src/
│   │   │   ├── config/    # 配置
│   │   │   ├── middleware/# 中间件
│   │   │   ├── models/    # 数据模型
│   │   │   ├── repositories/# 数据访问层
│   │   │   ├── routes/    # 路由
│   │   │   ├── services/  # 业务逻辑
│   │   │   ├── utils/     # 工具函数
│   │   │   └── test-utils/# 测试工具
│   │   ├── scripts/       # 维护脚本
│   │   └── package.json
│   │
│   └── database/          # 数据库
│       ├── migrations/    # 迁移文件
│       └── scripts/       # 数据库脚本
│
├── scripts/               # 项目维护脚本
├── docs/                  # 文档
└── .kiro/                 # Kiro AI 配置
```

---

## 技术栈

### 后端
- Node.js 18+ + TypeScript
- Express.js
- PostgreSQL 14+
- Redis 6+
- JWT 认证
- Vitest 测试

### 前端
- React 18 + TypeScript
- Vite
- Ant Design 6
- Zustand 状态管理
- React Router 6
- Axios

---

## 开发规范

### 代码规范

#### TypeScript
- 使用严格模式
- 避免 `any` 类型
- 为函数添加类型注解
- 使用接口定义数据结构

#### React
- 使用函数组件和 Hooks
- 组件文件使用 PascalCase
- 自定义 Hook 以 use 开头
- 使用 React.memo 优化性能

#### 命名规范
- 文件名: kebab-case (`user-service.ts`)
- 组件名: PascalCase (`UserProfile.tsx`)
- 函数名: camelCase (`getUserById`)
- 常量名: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)

### 日志规范

#### 后端日志
```typescript
import { logger } from '../config/logger';

// ✅ 正确
logger.error('Error finding user', {
  error: error instanceof Error ? error.message : String(error),
  userId,
  stack: error instanceof Error ? error.stack : undefined
});

// ❌ 错误
console.error('Error:', error);
```

#### 前端日志
```typescript
import { log } from '../utils/logger';

// ✅ 正确
log.error('API request failed', { error, endpoint });

// ❌ 错误
console.error('Error:', error);
```

### 错误处理

#### 后端
```typescript
import { AppError } from '../utils/errors';

// 抛出错误
if (!user) {
  throw new AppError('User not found', 404);
}

// 捕获错误
try {
  const result = await someOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw error; // 重新抛出
}
```

#### 前端
```typescript
try {
  const data = await api.getData();
  return data;
} catch (error) {
  log.error('Failed to fetch data', { error });
  message.error('获取数据失败');
  throw error;
}
```

### API 规范

#### 后端路由
```typescript
import { asyncHandler } from '../utils/asyncHandler';

router.get('/tasks', asyncHandler(async (req, res) => {
  const tasks = await taskService.getAllTasks();
  res.json({ success: true, data: tasks });
}));
```

#### 前端 API 调用
```typescript
import apiClient from './client';

export const taskApi = {
  getAll: () => apiClient.get<Task[]>('/tasks'),
  getById: (id: string) => apiClient.get<Task>(`/tasks/${id}`),
  create: (data: CreateTaskDto) => apiClient.post<Task>('/tasks', data),
  update: (id: string, data: UpdateTaskDto) => 
    apiClient.put<Task>(`/tasks/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
};
```

---

## 常用工具

### 前端 Hooks

#### useCrudOperations
```typescript
import { useCrudOperations } from '../hooks/useCrudOperations';

const {
  data,
  loading,
  create,
  update,
  deleteItem,
  refresh,
} = useCrudOperations({
  fetchAll: api.getAll,
  create: api.create,
  update: api.update,
  delete: api.delete,
});
```

#### useModalState
```typescript
import { useModalState } from '../hooks/useModalState';

const modal = useModalState<User>();

// 打开 Modal
modal.open(userData);

// 关闭 Modal
modal.close();

// 使用
<Modal visible={modal.visible} onCancel={modal.close}>
  {modal.data && <UserForm data={modal.data} />}
</Modal>
```

### 后端工具

#### CacheService
```typescript
import { CacheService } from '../services/CacheService';

// 获取缓存
const cached = await CacheService.get('key');

// 设置缓存
await CacheService.set('key', data, 3600);

// 删除缓存
await CacheService.del('key');
```

---

## 测试

### 运行测试
```bash
# 后端测试
cd packages/backend
npm test

# 前端测试
cd packages/frontend
npm test

# 类型检查
node scripts/maintenance.js check-types
```

### 测试规范
- 单元测试覆盖率 > 70%
- 测试文件命名: `*.test.ts`
- 使用 AAA 模式 (Arrange-Act-Assert)
- 使用 test-utils 中的 fixtures

---

## 维护脚本

### 项目维护
```bash
# 类型检查
node scripts/maintenance.js check-types

# 项目审计
node scripts/maintenance.js audit

# 清理临时文件
node scripts/maintenance.js clean-temp

# 列出所有脚本
node scripts/maintenance.js list-scripts
```

### 数据库管理
```bash
# 检查连接
node packages/backend/scripts/db-manager.js check

# 运行种子脚本
node packages/backend/scripts/db-manager.js seed

# 创建测试数据
node packages/backend/scripts/db-manager.js seed-test

# 重置管理员密码
node packages/backend/scripts/db-manager.js reset-admin

# 刷新排名
node packages/backend/scripts/db-manager.js refresh-ranks
```

---

## 性能优化

### 数据库
- ✅ 添加必要的索引
- ✅ 使用连接池
- ✅ 优化复杂查询

### 缓存
- ✅ 用户信息缓存 (TTL: 1小时)
- ✅ 任务列表缓存 (TTL: 30分钟)
- ✅ 排名数据缓存 (TTL: 5分钟)

### 前端
- ✅ 代码分割和懒加载
- ✅ 防抖节流
- ✅ React.memo 优化

---

## 调试

### 后端调试
```bash
# 查看日志
tail -f packages/backend/logs/app.log

# 数据库调试
psql -U postgres -d bounty_hunter

# Redis 调试
redis-cli
```

### 前端调试
- 使用 React DevTools
- 使用浏览器开发者工具
- 查看 Network 标签页

---

## 部署

### Docker 部署
```bash
# 构建镜像
docker-compose -f docker-compose.production.yml build

# 启动服务
docker-compose -f docker-compose.production.yml up -d
```

详细部署说明请参考: [运维指南](operations/OPERATIONS_GUIDE.md)

---

## 代码检查清单

提交代码前确保：

- [ ] 没有使用 `console.log/error/warn`
- [ ] 所有日志使用 `logger` 对象
- [ ] 错误日志包含业务上下文
- [ ] 所有异步操作有错误处理
- [ ] 代码通过 ESLint 检查
- [ ] 单元测试通过
- [ ] 类型检查通过
- [ ] 没有敏感信息在日志中

---

## 相关文档

- [项目状态](PROJECT_STATUS.md) - 项目概览
- [架构文档](ARCHITECTURE.md) - 系统架构
- [功能指南](FEATURES_GUIDE.md) - 功能说明
- [运维指南](operations/OPERATIONS_GUIDE.md) - 部署运维
- [数据库模型](DATABASE_MODELS_OVERVIEW.md) - 数据库设计

---

**维护者**: 开发团队  
**版本**: 3.0.0
