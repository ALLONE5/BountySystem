# Permission Checker Usage Guide

## Overview

The `PermissionChecker` utility provides centralized permission validation for all resources in the application. It ensures consistent authorization logic across all services and prevents unauthorized access.

**Location**: `src/utils/PermissionChecker.ts`

## Core Concepts

### Permission Model

The application uses a hybrid permission model:

1. **Role-Based Access Control (RBAC)**: Admins have full access
2. **Ownership-Based Access**: Users can access their own resources
3. **Membership-Based Access**: Users can access group resources they're members of

### Permission Hierarchy

```
Admin (role = 'admin')
    ↓ Full access to all resources
Owner (creator_id = userId)
    ↓ Full access to owned resources
Member (group membership)
    ↓ Access to group resources
Public
    ↓ Read-only access to public resources
```

## Basic Usage

### Resolving PermissionChecker

```typescript
import { resolve } from '../config/container.js';

const permissionChecker = resolve('permissionChecker');
```

### Checking Permissions

```typescript
// Check if user can access a task
const canAccess = await permissionChecker.canAccessTask(userId, taskId);

if (!canAccess) {
  throw new UnauthorizedError('You cannot access this task');
}
```

### Enforcing Permissions

```typescript
// Throw error if user cannot modify task
await permissionChecker.canModifyTask(userId, taskId);

// If we reach here, user has permission
await taskRepository.update(taskId, data);
```

## Available Methods

### Task Permissions

#### canAccessTask(userId, taskId)

Checks if user can view a task.

**Grants access if**:
- User is admin
- User created the task
- Task is public

```typescript
const canView = await permissionChecker.canAccessTask(userId, taskId);

if (canView) {
  const task = await taskRepository.findById(taskId);
  return TaskMapper.toDTO(task);
}
```

#### canModifyTask(userId, taskId)

Checks if user can modify a task. Throws `UnauthorizedError` if not permitted.

**Grants access if**:
- User is admin
- User created the task

```typescript
// Throws if not permitted
await permissionChecker.canModifyTask(userId, taskId);

// Safe to modify
await taskRepository.update(taskId, { title: 'New Title' });
```

### Group Permissions

#### canAccessGroup(userId, groupId)

Checks if user can view a group.

**Grants access if**:
- User is admin
- User owns the group
- User is a member of the group

```typescript
const canView = await permissionChecker.canAccessGroup(userId, groupId);

if (canView) {
  const group = await groupRepository.findById(groupId);
  return GroupMapper.toDTO(group);
}
```

#### canModifyGroup(userId, groupId)

Checks if user can modify a group. Throws `UnauthorizedError` if not permitted.

**Grants access if**:
- User is admin
- User owns the group

```typescript
// Throws if not permitted
await permissionChecker.canModifyGroup(userId, groupId);

// Safe to modify
await groupRepository.update(groupId, { name: 'New Name' });
```

### Position Permissions

#### canAccessPosition(userId, positionId)

Checks if user can view a position.

**Grants access if**:
- User is admin
- User owns the task containing the position
- Position's task is public

```typescript
const canView = await permissionChecker.canAccessPosition(userId, positionId);

if (canView) {
  const position = await positionRepository.findById(positionId);
  return PositionMapper.toDTO(position);
}
```

## Integration with Services

### Service Constructor

Inject PermissionChecker via constructor:

```typescript
class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private permissionChecker: PermissionChecker
  ) {}
  
  async getTask(userId: number, taskId: number) {
    // Check permission first
    await permissionChecker.canModifyTask(userId, taskId);
    
    // Proceed with operation
    return this.taskRepository.findById(taskId);
  }
}
```

### Using with DI Container

```typescript
// Container automatically injects dependencies
container.register('taskService', (c) => new TaskService(
  c.resolve('taskRepository'),
  c.resolve('permissionChecker')
));

const taskService = resolve('taskService');
```

## Common Patterns

### Pattern 1: Check Before Read

```typescript
async getTask(userId: number, taskId: number) {
  // Check permission
  const canAccess = await this.permissionChecker.canAccessTask(userId, taskId);
  
  if (!canAccess) {
    throw new UnauthorizedError('You cannot access this task');
  }
  
  // Fetch data
  const task = await this.taskRepository.findById(taskId);
  return TaskMapper.toDTO(task);
}
```

### Pattern 2: Enforce Before Write

```typescript
async updateTask(userId: number, taskId: number, data: Partial<Task>) {
  // Enforce permission (throws if not permitted)
  await this.permissionChecker.canModifyTask(userId, taskId);
  
  // Update data
  const updated = await this.taskRepository.update(taskId, data);
  return TaskMapper.toDTO(updated);
}
```

### Pattern 3: Filter Results

```typescript
async getTasks(userId: number) {
  // Get all tasks
  const allTasks = await this.taskRepository.findAll();
  
  // Filter by permission
  const accessibleTasks = await Promise.all(
    allTasks.map(async (task) => {
      const canAccess = await this.permissionChecker.canAccessTask(userId, task.id);
      return canAccess ? task : null;
    })
  );
  
  return accessibleTasks
    .filter(task => task !== null)
    .map(task => TaskMapper.toDTO(task));
}
```

### Pattern 4: Conditional Logic

```typescript
async getTaskDetails(userId: number, taskId: number) {
  const task = await this.taskRepository.findById(taskId);
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  // Check if user can see sensitive data
  const canModify = await this.permissionChecker.canAccessTask(userId, taskId);
  
  if (canModify) {
    // Return full details
    return TaskMapper.toDTO(task);
  } else {
    // Return public details only
    return {
      id: task.id,
      title: task.title,
      status: task.status
    };
  }
}
```

## Best Practices

### 1. Check Permissions Early

Check permissions before fetching data:

```typescript
// ✅ Good - Check first
async updateTask(userId: number, taskId: number, data: Partial<Task>) {
  await this.permissionChecker.canModifyTask(userId, taskId);
  return this.taskRepository.update(taskId, data);
}

// ❌ Bad - Fetch then check
async updateTask(userId: number, taskId: number, data: Partial<Task>) {
  const task = await this.taskRepository.findById(taskId);
  await this.permissionChecker.canModifyTask(userId, taskId);
  return this.taskRepository.update(taskId, data);
}
```

### 2. Use Appropriate Method

Use `canAccess*` for reads, `canModify*` for writes:

```typescript
// ✅ Good - Appropriate methods
async getTask(userId: number, taskId: number) {
  const canAccess = await this.permissionChecker.canAccessTask(userId, taskId);
  // ...
}

async updateTask(userId: number, taskId: number, data: Partial<Task>) {
  await this.permissionChecker.canModifyTask(userId, taskId);
  // ...
}

// ❌ Bad - Wrong method
async getTask(userId: number, taskId: number) {
  await this.permissionChecker.canModifyTask(userId, taskId);  // Too strict!
  // ...
}
```

### 3. Handle Errors Gracefully

Provide descriptive error messages:

```typescript
// ✅ Good - Descriptive error
try {
  await this.permissionChecker.canModifyTask(userId, taskId);
} catch (error) {
  if (error instanceof UnauthorizedError) {
    throw new UnauthorizedError('You do not have permission to modify this task');
  }
  throw error;
}

// ❌ Bad - Generic error
await this.permissionChecker.canModifyTask(userId, taskId);
```

### 4. Don't Bypass Permission Checks

Always use PermissionChecker, don't implement custom logic:

```typescript
// ✅ Good - Use PermissionChecker
await this.permissionChecker.canModifyTask(userId, taskId);

// ❌ Bad - Custom permission logic
const task = await this.taskRepository.findById(taskId);
if (task.creator_id !== userId) {
  throw new UnauthorizedError('Not authorized');
}
```

### 5. Cache Permission Results

For multiple checks on the same resource:

```typescript
// ✅ Good - Cache result
const canModify = await this.permissionChecker.canAccessTask(userId, taskId);

if (canModify) {
  // Use cached result
  await this.doOperation1();
  await this.doOperation2();
}

// ❌ Bad - Multiple checks
if (await this.permissionChecker.canAccessTask(userId, taskId)) {
  await this.doOperation1();
}
if (await this.permissionChecker.canAccessTask(userId, taskId)) {
  await this.doOperation2();
}
```

## Error Handling

### UnauthorizedError

Thrown when permission is denied:

```typescript
try {
  await permissionChecker.canModifyTask(userId, taskId);
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // Handle unauthorized access
    return res.status(403).json({ error: error.message });
  }
  throw error;
}
```

### NotFoundError

Thrown when resource doesn't exist:

```typescript
try {
  await permissionChecker.canModifyTask(userId, 999999);
} catch (error) {
  if (error instanceof NotFoundError) {
    // Handle missing resource
    return res.status(404).json({ error: 'Task not found' });
  }
  throw error;
}
```

## Testing Permissions

### Unit Tests

Test permission logic:

```typescript
describe('PermissionChecker', () => {
  let permissionChecker: PermissionChecker;
  
  beforeEach(() => {
    permissionChecker = resolve('permissionChecker');
  });
  
  it('should allow admin to access any task', async () => {
    const adminId = 1;  // Admin user
    const taskId = 100;
    
    const canAccess = await permissionChecker.canAccessTask(adminId, taskId);
    expect(canAccess).toBe(true);
  });
  
  it('should allow owner to access their task', async () => {
    const userId = 2;
    const task = await createTask({ creator_id: userId });
    
    const canAccess = await permissionChecker.canAccessTask(userId, task.id);
    expect(canAccess).toBe(true);
  });
  
  it('should deny non-owner access to private task', async () => {
    const ownerId = 2;
    const otherId = 3;
    const task = await createTask({ creator_id: ownerId, is_public: false });
    
    const canAccess = await permissionChecker.canAccessTask(otherId, task.id);
    expect(canAccess).toBe(false);
  });
});
```

### Property-Based Tests

Test universal properties:

```typescript
// Property: Permission Validation
it('should grant access to owners and admins', () => {
  fc.assert(
    fc.property(
      fc.record({
        userId: fc.integer({ min: 1 }),
        isAdmin: fc.boolean(),
        isOwner: fc.boolean()
      }),
      async ({ userId, isAdmin, isOwner }) => {
        const user = await createUser({ id: userId, role: isAdmin ? 'admin' : 'user' });
        const task = await createTask({ creator_id: isOwner ? userId : 999 });
        
        const canAccess = await permissionChecker.canAccessTask(userId, task.id);
        
        if (isAdmin || isOwner) {
          expect(canAccess).toBe(true);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

## Advanced Usage

### Custom Permission Logic

For complex scenarios, extend PermissionChecker:

```typescript
class ExtendedPermissionChecker extends PermissionChecker {
  async canAccessTaskWithRole(userId: number, taskId: number, requiredRole: string) {
    // Check base permission
    const canAccess = await this.canAccessTask(userId, taskId);
    if (!canAccess) return false;
    
    // Check role
    const user = await this.userRepository.findById(userId);
    return user?.role === requiredRole;
  }
}
```

### Batch Permission Checks

Check permissions for multiple resources:

```typescript
async canAccessTasks(userId: number, taskIds: number[]): Promise<Map<number, boolean>> {
  const results = new Map<number, boolean>();
  
  await Promise.all(
    taskIds.map(async (taskId) => {
      const canAccess = await this.permissionChecker.canAccessTask(userId, taskId);
      results.set(taskId, canAccess);
    })
  );
  
  return results;
}
```

### Permission Caching

Cache permission results for performance:

```typescript
class CachedPermissionChecker {
  private cache = new Map<string, boolean>();
  
  async canAccessTask(userId: number, taskId: number): Promise<boolean> {
    const key = `task:${userId}:${taskId}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    const canAccess = await this.permissionChecker.canAccessTask(userId, taskId);
    this.cache.set(key, canAccess);
    
    return canAccess;
  }
}
```

## Troubleshooting

### Common Issues

**Issue**: "User not found"
- **Cause**: Invalid userId passed to permission check
- **Solution**: Validate userId before calling PermissionChecker

**Issue**: "Resource not found"
- **Cause**: Invalid resourceId passed to permission check
- **Solution**: Check if resource exists before permission check

**Issue**: Permission check passes but operation fails
- **Cause**: Race condition - resource deleted between check and operation
- **Solution**: Use transactions or re-check in operation

**Issue**: Too many database queries
- **Cause**: Multiple permission checks for same resource
- **Solution**: Cache permission results

## Migration Guide

### Migrating from Inline Permission Checks

**Before**:
```typescript
async updateTask(userId: number, taskId: number, data: Partial<Task>) {
  const task = await this.taskRepository.findById(taskId);
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  const user = await this.userRepository.findById(userId);
  
  if (user.role !== 'admin' && task.creator_id !== userId) {
    throw new UnauthorizedError('Not authorized');
  }
  
  return this.taskRepository.update(taskId, data);
}
```

**After**:
```typescript
async updateTask(userId: number, taskId: number, data: Partial<Task>) {
  await this.permissionChecker.canModifyTask(userId, taskId);
  return this.taskRepository.update(taskId, data);
}
```

## Related Documentation

- [Repository Pattern](../repositories/REPOSITORY_PATTERN.md)
- [Transaction Manager](./TRANSACTION_MANAGER.md)
- [DI Container Usage](../config/CONTAINER_USAGE.md)
- [Error Handling](./errors.ts)
