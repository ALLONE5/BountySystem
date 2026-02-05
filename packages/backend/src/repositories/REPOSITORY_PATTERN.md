# Repository Pattern Implementation

## Overview

The Repository pattern provides a clean abstraction layer between the business logic (Services) and data access (Database). This implementation eliminates code duplication, centralizes database queries, and improves testability.

## Architecture

```
Service Layer
    ↓
Repository Layer (Abstraction)
    ↓
QueryBuilder + Validator (Utilities)
    ↓
Database (PostgreSQL)
```

## Core Components

### BaseRepository

The `BaseRepository` class provides common CRUD operations that all specific repositories inherit.

**Location**: `src/repositories/BaseRepository.ts`

**Key Features**:
- Generic type support for type safety
- Common CRUD operations (findById, findAll, create, update, delete)
- Integrated QueryBuilder for SQL construction
- Integrated Validator for input validation
- Automatic connection management
- Error handling with descriptive messages

**Interface**:

```typescript
interface IRepository<T> {
  findById(id: number): Promise<T | null>;
  findAll(filters?: Record<string, any>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}
```

**Example Usage**:

```typescript
// BaseRepository handles common operations
const user = await userRepository.findById(1);
const allUsers = await userRepository.findAll();
const newUser = await userRepository.create({ username: 'john', email: 'john@example.com' });
```

### Specific Repositories

Each entity has a dedicated repository that extends `BaseRepository` and adds entity-specific queries.

#### UserRepository

**Location**: `src/repositories/UserRepository.ts`

**Extends**: `BaseRepository<User>`

**Additional Methods**:
- `findByEmail(email: string)` - Find user by email address
- `findByUsername(username: string)` - Find user by username
- `findWithStats(userId: number)` - Get user with statistics
- `updateLastLogin(userId: number)` - Update last login timestamp

**Example**:

```typescript
const userRepo = resolve('userRepository');

// Use base methods
const user = await userRepo.findById(1);

// Use specific methods
const userByEmail = await userRepo.findByEmail('john@example.com');
const userWithStats = await userRepo.findWithStats(1);
```

#### TaskRepository

**Location**: `src/repositories/TaskRepository.ts`

**Extends**: `BaseRepository<Task>`

**Additional Methods**:
- `findByCreator(creatorId: number)` - Get tasks created by a user
- `findByGroup(groupId: number)` - Get tasks in a group
- `findWithPositions(taskId: number)` - Get task with all positions
- `findPublicTasks(filters?)` - Get public/available tasks
- `updateStatus(taskId, status)` - Update task status

**Example**:

```typescript
const taskRepo = resolve('taskRepository');

// Get tasks by creator
const myTasks = await taskRepo.findByCreator(userId);

// Get task with positions
const taskWithPositions = await taskRepo.findWithPositions(taskId);

// Update status
await taskRepo.updateStatus(taskId, 'completed');
```

#### GroupRepository

**Location**: `src/repositories/GroupRepository.ts`

**Extends**: `BaseRepository<ProjectGroup>`

**Additional Methods**:
- `findByOwner(ownerId: number)` - Get groups owned by a user
- `findByMember(userId: number)` - Get groups where user is a member
- `findWithMembers(groupId: number)` - Get group with all members
- `addMember(groupId, userId, role)` - Add member to group
- `removeMember(groupId, userId)` - Remove member from group

**Example**:

```typescript
const groupRepo = resolve('groupRepository');

// Get user's groups
const myGroups = await groupRepo.findByOwner(userId);
const memberGroups = await groupRepo.findByMember(userId);

// Manage members
await groupRepo.addMember(groupId, userId, 'member');
await groupRepo.removeMember(groupId, userId);
```

#### PositionRepository

**Location**: `src/repositories/PositionRepository.ts`

**Extends**: `BaseRepository<Position>`

**Additional Methods**:
- `findByTask(taskId: number)` - Get all positions for a task
- `findByUser(userId: number)` - Get positions assigned to a user
- `findWithApplications(positionId: number)` - Get position with applications
- `updateRanking(positionId, ranking)` - Update position ranking

**Example**:

```typescript
const positionRepo = resolve('positionRepository');

// Get positions for a task
const positions = await positionRepo.findByTask(taskId);

// Get user's positions
const myPositions = await positionRepo.findByUser(userId);

// Update ranking
await positionRepo.updateRanking(positionId, 5);
```

## Benefits

### 1. Code Reusability

**Before** (Direct database queries in services):
```typescript
// UserService.ts
const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

// TaskService.ts
const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

// GroupService.ts
const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
```

**After** (Repository pattern):
```typescript
// All services use the same repository
const user = await userRepository.findById(id);
```

**Result**: User query logic appears once instead of 15+ times across the codebase.

### 2. Separation of Concerns

Services focus on business logic, repositories handle data access:

```typescript
// Service focuses on business rules
class TaskService {
  async createTask(userId: number, data: CreateTaskInput) {
    // Business logic: validate permissions
    await this.permissionChecker.canCreateTask(userId);
    
    // Data access: delegated to repository
    const task = await this.taskRepository.create({
      ...data,
      creator_id: userId,
      status: 'open'
    });
    
    return TaskMapper.toDTO(task);
  }
}
```

### 3. Testability

Repositories can be easily mocked for testing:

```typescript
// Test with mock repository
const mockUserRepo = {
  findById: vi.fn().mockResolvedValue({ id: 1, username: 'test' })
};

const service = new UserService(mockUserRepo, mockPermChecker);
const user = await service.getUserById(1);

expect(mockUserRepo.findById).toHaveBeenCalledWith(1);
```

### 4. Type Safety

TypeScript generics ensure type safety throughout:

```typescript
// Type-safe repository
class UserRepository extends BaseRepository<User> {
  // TypeScript knows the return type is User | null
  async findById(id: number): Promise<User | null> {
    return super.findById(id);
  }
}

// Type-safe usage
const user: User | null = await userRepository.findById(1);
```

### 5. Consistent Error Handling

All repositories use consistent error handling:

```typescript
// Repository automatically handles errors
try {
  const user = await userRepository.findById(id);
} catch (error) {
  // DatabaseError with descriptive message
  // Connection automatically released
}
```

## Integration with Other Components

### QueryBuilder

Repositories use QueryBuilder for SQL construction:

```typescript
// Inside repository
const query = this.queryBuilder
  .select('*')
  .from(this.tableName)
  .where('id = $1')
  .build();

const result = await pool.query(query, [id]);
```

### Validator

Repositories use Validator for input validation:

```typescript
// Inside repository
async create(data: Partial<User>): Promise<User> {
  // Validate input
  this.validator.validateRequired(data, ['username', 'email']);
  this.validator.validateEmail(data.email);
  
  // Proceed with creation
  // ...
}
```

### DI Container

Repositories are managed by the DI Container:

```typescript
// Container registration
container.register('userRepository', () => new UserRepository());
container.register('taskRepository', () => new TaskRepository());

// Resolution
const userRepo = resolve('userRepository');
```

## Best Practices

### 1. Keep Repositories Focused

Repositories should only handle data access, not business logic:

```typescript
// ✅ Good - Data access only
async findByEmail(email: string): Promise<User | null> {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

// ❌ Bad - Business logic in repository
async findByEmailAndValidatePassword(email: string, password: string): Promise<User | null> {
  const user = await this.findByEmail(email);
  if (user && await bcrypt.compare(password, user.password_hash)) {
    return user;
  }
  return null;
}
```

### 2. Use Specific Methods Over Generic Filters

Create dedicated methods for common queries:

```typescript
// ✅ Good - Specific method
async findByEmail(email: string): Promise<User | null> {
  // Optimized query
}

// ❌ Avoid - Generic filter
await userRepository.findAll({ email: 'john@example.com' });
```

### 3. Handle Relationships Explicitly

Use dedicated methods for queries with joins:

```typescript
// ✅ Good - Explicit relationship loading
async findWithPositions(taskId: number): Promise<Task & { positions: Position[] }> {
  const query = `
    SELECT t.*, 
           json_agg(p.*) as positions
    FROM tasks t
    LEFT JOIN positions p ON p.task_id = t.id
    WHERE t.id = $1
    GROUP BY t.id
  `;
  // ...
}

// ❌ Avoid - N+1 queries
const task = await taskRepository.findById(taskId);
const positions = await positionRepository.findByTask(taskId);
```

### 4. Always Release Connections

Use try-finally to ensure connections are released:

```typescript
async findById(id: number): Promise<T | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(query, [id]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}
```

### 5. Use Transactions for Multi-Step Operations

For operations that modify multiple tables, use TransactionManager:

```typescript
// In service, not repository
await transactionManager.executeInTransaction(async (client) => {
  const task = await taskRepository.create(taskData, client);
  await positionRepository.create(positionData, client);
});
```

## Migration Guide

### Migrating a Service to Use Repositories

**Before** (Direct database access):

```typescript
class UserService {
  async getUserById(userId: number) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    const user = result.rows[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.created_at
    };
  }
}
```

**After** (Repository pattern):

```typescript
class UserService {
  constructor(
    private userRepository: UserRepository,
    private permissionChecker: PermissionChecker
  ) {}

  async getUserById(userId: number) {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return UserMapper.toDTO(user);
  }
}
```

**Steps**:
1. Add repository dependency to constructor
2. Replace `pool.query()` with repository method
3. Use mapper for DTO transformation
4. Remove manual SQL query construction

## Testing Repositories

### Unit Tests

Test repository methods with real database:

```typescript
describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
  });

  it('should find user by id', async () => {
    const user = await userRepository.findById(1);
    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
  });

  it('should return null for non-existent user', async () => {
    const user = await userRepository.findById(999999);
    expect(user).toBeNull();
  });
});
```

### Property-Based Tests

Test universal properties:

```typescript
// Property: Connection Error Handling
it('should handle connection errors gracefully', () => {
  fc.assert(
    fc.property(fc.integer({ min: 1 }), async (id) => {
      // Test that errors don't leak connections
      try {
        await userRepository.findById(id);
      } catch (error) {
        // Should throw DatabaseError, not crash
        expect(error).toBeInstanceOf(DatabaseError);
      }
    }),
    { numRuns: 100 }
  );
});
```

## Performance Considerations

### Connection Pooling

Repositories use the shared connection pool:

```typescript
// Pool configured in database.ts
const pool = new Pool({
  max: 20,  // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Query Optimization

Use indexes and optimized queries:

```typescript
// Optimized query with index
async findByEmail(email: string): Promise<User | null> {
  // Assumes index on email column
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}
```

### Batch Operations

For bulk operations, use batch queries:

```typescript
async createMany(users: Partial<User>[]): Promise<User[]> {
  const values = users.map((u, i) => 
    `($${i*3+1}, $${i*3+2}, $${i*3+3})`
  ).join(',');
  
  const query = `
    INSERT INTO users (username, email, password_hash)
    VALUES ${values}
    RETURNING *
  `;
  
  const params = users.flatMap(u => [u.username, u.email, u.password_hash]);
  const result = await pool.query(query, params);
  return result.rows;
}
```

## Troubleshooting

### Common Issues

**Issue**: "Service X is not registered"
- **Solution**: Ensure repository is registered in `container.ts`

**Issue**: Connection pool exhausted
- **Solution**: Check for connection leaks, ensure all queries use try-finally

**Issue**: Type errors with repository methods
- **Solution**: Ensure model interfaces are up to date

**Issue**: Slow queries
- **Solution**: Add database indexes, optimize queries, use EXPLAIN ANALYZE

## Related Documentation

- [DI Container Usage](../config/CONTAINER_USAGE.md)
- [Transaction Manager](../utils/TRANSACTION_MANAGER.md)
- [Permission Checker](../utils/PERMISSION_CHECKER.md)
- [Mapper Pattern](../utils/mappers/MAPPER_PATTERN.md)
