# GroupRepository 类型错误修复

## 问题描述

页面出现"服务器错误，请稍后重试"和"加载任务列表失败"的错误。

经检查发现，`GroupService.ts` 中有 13 个 TypeScript 类型错误：
```
Error: Argument of type 'string' is not assignable to parameter of type 'number'.
```

## 根本原因

1. **ID 类型不匹配**: 
   - 系统使用 UUID 字符串作为 ID
   - `BaseRepository` 接口定义使用 `number` 类型的 ID
   - `GroupRepository` 继承自 `BaseRepository<TaskGroup>`
   - `TaskGroup.id` 是 `string` 类型

2. **类型冲突**:
   - `IGroupRepository` 接口继承自 `IRepository<TaskGroup>`
   - 基类方法签名要求 `number` 类型的 ID
   - 实际使用中传递的是 `string` 类型的 ID

## 解决方案

### 1. 修改 `IGroupRepository` 接口

不再继承 `IRepository<TaskGroup>`，而是独立定义所有方法，使用 `string` 类型的 ID：

```typescript
export interface IGroupRepository {
  findById(id: string): Promise<TaskGroup | null>;
  findAll(filters?: Record<string, any>): Promise<TaskGroup[]>;
  create(data: Partial<TaskGroup>, client?: PoolClient): Promise<TaskGroup>;
  update(id: string, data: Partial<TaskGroup>, client?: PoolClient): Promise<TaskGroup>;
  delete(id: string, client?: PoolClient): Promise<void>;
  // ... 其他方法
}
```

### 2. 修改 `GroupRepository` 类

不再继承 `BaseRepository<TaskGroup>`，直接实现 `IGroupRepository` 接口：

```typescript
export class GroupRepository implements IGroupRepository {
  private tableName = 'task_groups';
  
  // 实现所有接口方法，使用 string 类型的 ID
  async findById(id: string): Promise<TaskGroup | null> { ... }
  async findAll(filters?: Record<string, any>): Promise<TaskGroup[]> { ... }
  async create(data: Partial<TaskGroup>, client?: PoolClient): Promise<TaskGroup> { ... }
  async update(id: string, data: Partial<TaskGroup>, client?: PoolClient): Promise<TaskGroup> { ... }
  async delete(id: string, client?: PoolClient): Promise<void> { ... }
  // ... 其他方法
}
```

### 3. 实现的方法

完整实现了以下方法：
- `findById(id: string)` - 通过 ID 查找组群
- `findAll()` - 查找所有组群
- `create(data)` - 创建新组群
- `update(id, data)` - 更新组群
- `delete(id)` - 删除组群
- `findByCreator(creatorId)` - 查找用户创建的组群
- `findByMember(userId)` - 查找用户加入的组群
- `findWithMembers(groupId)` - 查找组群及其成员
- `addMember(groupId, userId)` - 添加成员
- `removeMember(groupId, userId)` - 移除成员
- `isMember(groupId, userId)` - 检查成员资格
- `getGroupMembers(groupId)` - 获取所有成员

## 验证结果

修复后，所有 TypeScript 类型错误已解决：
- ✅ `packages/backend/src/repositories/GroupRepository.ts`: No diagnostics found
- ✅ `packages/backend/src/services/GroupService.ts`: No diagnostics found

## 影响范围

### 修改的文件
- `packages/backend/src/repositories/GroupRepository.ts`

### 不受影响的文件
- `packages/backend/src/services/GroupService.ts` - 无需修改，类型错误自动解决
- `packages/backend/src/routes/group.routes.ts` - 无需修改
- 前端文件 - 无需修改

## 测试建议

1. **重启后端服务**:
   ```bash
   cd packages/backend
   npm run dev
   ```

2. **测试组群功能**:
   - 创建组群
   - 查看组群列表
   - 查看组群详情
   - 添加/移除成员
   - 创建组群任务
   - 承接组群任务

3. **检查浏览器控制台**:
   - 不应再有"服务器错误"提示
   - 任务列表应正常加载
   - 查看调试日志确认子任务数量

## 后续工作

1. 考虑为其他使用 UUID 的 Repository 做类似修改（如 `TaskRepository`, `UserRepository`）
2. 或者修改 `BaseRepository` 支持泛型 ID 类型
3. 统一整个项目的 ID 类型策略

## 相关文件

- `packages/backend/src/repositories/GroupRepository.ts` - 修复的主要文件
- `packages/backend/src/repositories/BaseRepository.ts` - 基类定义
- `packages/backend/src/services/GroupService.ts` - 使用 GroupRepository 的服务
- `packages/backend/src/models/TaskGroup.ts` - TaskGroup 模型定义
