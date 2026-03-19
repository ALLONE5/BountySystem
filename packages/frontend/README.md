# 赏金猎人平台 - 前端

React 18 + TypeScript + Vite 前端应用，提供完整的任务管理和赏金系统 UI。

---

## 技术栈

- 框架: React 18.2.0 + TypeScript
- 路由: React Router v6.21.1
- 状态管理: Zustand 4.x
- UI 组件库: Ant Design 6.x + @ant-design/icons
- HTTP 客户端: Axios 1.x
- 实时通信: Socket.IO Client 4.x
- 可视化: D3.js 7.x + FullCalendar 6.x + react-beautiful-dnd
- 构建工具: Vite 5.x
- 测试: Vitest 1.x

---

## 项目结构

```
src/
├── api/              # API 客户端 (16 个模块)
│   ├── client.ts     # Axios 实例 + 响应拦截器
│   └── *.ts          # 各业务模块 API
├── components/       # 可复用组件
│   ├── common/       # 通用基础组件 (20 个)
│   ├── Dashboard/    # 仪表盘组件
│   ├── TaskDetail/   # 任务详情组件
│   ├── TaskList/     # 任务列表组件
│   ├── Kanban/       # 看板组件
│   ├── Gantt/        # 甘特图组件
│   ├── Calendar/     # 日历组件
│   ├── Groups/       # 组群组件
│   ├── Ranking/      # 排行榜组件
│   ├── Notifications/ # 通知组件
│   ├── Profile/      # 个人资料组件
│   └── ...           # 其他业务组件
├── contexts/         # React Context
│   ├── AuthContext.tsx         # 认证状态
│   ├── NotificationContext.tsx # 通知状态
│   ├── SystemConfigContext.tsx # 系统配置
│   └── ThemeContext.tsx        # 主题状态
├── hooks/            # 自定义 Hooks (8 个)
├── layouts/          # 布局组件
│   ├── ModernLayout.tsx  # 主应用布局（侧边栏 + 顶部导航）
│   └── AuthLayout.tsx    # 认证页面布局
├── pages/            # 页面组件
│   ├── auth/         # 登录、注册
│   ├── admin/        # 管理员页面 (12 个)
│   ├── developer/    # 开发者页面 (3 个)
│   └── *.tsx         # 普通用户页面
├── router/           # 路由配置
├── store/            # Zustand Store
│   └── authStore.ts  # 认证状态持久化
├── styles/           # 全局样式
├── types/            # TypeScript 类型定义
└── utils/            # 工具函数
```

---

## 页面路由

### 公开路由
| 路径 | 页面 |
|------|------|
| `/auth/login` | 登录页 |
| `/auth/register` | 注册页 |

### 普通用户路由
| 路径 | 页面 |
|------|------|
| `/dashboard` | 仪表盘 |
| `/my` | 我的工作台 |
| `/my/bounties` | 我的悬赏（已发布任务） |
| `/my/tasks` | 我的任务（已承接任务） |
| `/my/groups` | 我的组群 |
| `/bounty-tasks` | 任务市场（浏览任务） |
| `/ranking` | 排行榜 |
| `/notifications` | 通知中心 |
| `/profile` | 个人资料 |
| `/settings` | 账户设置 |

### 管理员路由（需要 admin 角色）
| 路径 | 页面 |
|------|------|
| `/admin` | 管理中心入口 |
| `/admin/dashboard` | 管理仪表盘 |
| `/admin/users` | 用户管理 |
| `/admin/groups` | 组群管理 |
| `/admin/tasks` | 任务管理 |
| `/admin/approval` | 岗位申请审核 |
| `/admin/avatars` | 头像管理 |
| `/admin/positions` | 岗位管理 |
| `/admin/bounty-algorithm` | 赏金算法配置 |
| `/admin/notifications` | 广播通知 |
| `/admin/audit-logs` | 审计日志 |

### 开发者路由（需要 developer 角色）
| 路径 | 页面 |
|------|------|
| `/dev/audit-logs` | 审计日志（开发者视图） |
| `/dev/system-monitor` | 系统监控 |
| `/dev/system-config` | 系统配置 |

---

## API 客户端

`src/api/client.ts` 配置了 Axios 实例，包含：
- 自动在请求头附加 JWT Token
- 响应拦截器：自动解包 `{ success, data }` 结构，直接返回 `data`
- 401 响应自动清除认证状态并跳转登录页

```typescript
// 所有 API 方法直接返回业务数据，无需手动解包
const tasks = await taskApi.getMyTasks(); // 直接是 Task[]
```

---

## 状态管理

- `authStore` (Zustand + persist): 用户信息和 Token，持久化到 localStorage
- `AuthContext`: 提供登录/登出方法和用户状态
- `NotificationContext`: 未读通知数量，WebSocket 实时更新
- `SystemConfigContext`: 系统配置（站点名称、Logo、主题等）
- `ThemeContext`: 亮色/暗色主题切换

---

## 自定义 Hooks

| Hook | 说明 |
|------|------|
| `useDataFetch` | 通用数据加载，含 loading/error 状态 |
| `useErrorHandler` | 统一错误处理和提示 |
| `useLoadingState` | 多状态 loading 管理 |
| `useModalState` | Modal 开关状态管理 |
| `useCrudOperations` | 增删改查通用操作 |
| `usePermission` | 基于角色的权限判断 |
| `useResponsive` | 响应式断点检测 |
| `useWebSocket` | WebSocket 连接和事件监听 |

---

## 环境变量

```bash
# packages/frontend/.env
VITE_API_URL=http://localhost:3001/api
```

Vite 开发服务器已配置代理，`/api` 请求自动转发到 `http://localhost:3001`。

---

## 开发命令

```bash
# 开发模式
npm run dev        # http://localhost:5173

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 运行测试
npm test
```

---

## 测试

测试文件与源文件同目录（`*.test.tsx`），使用 Vitest + jsdom。

```bash
npm test
```

测试覆盖范围：
- ProtectedRoute 组件
- PublishedTasksPage
- TaskListPage
- TaskInvitationsPage
- BountyHistoryDrawer
- StatusTag 组件

---

## 主题系统

支持亮色/暗色主题，通过 `ThemeContext` 管理。主题配置来自后端 `SystemConfig`，支持：
- 默认主题设置
- 用户手动切换
- 多种动画风格（none/minimal/scanline/particles 等）
- 减少动效模式
