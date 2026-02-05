# Backend Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture Layers](#architecture-layers)
3. [Design Principles](#design-principles)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Patterns and Practices](#patterns-and-practices)
7. [Technology Stack](#technology-stack)
8. [Performance Considerations](#performance-considerations)
9. [Security](#security)
10. [Testing Strategy](#testing-strategy)

## Overview

The Bounty Hunter Platform backend is built using a layered architecture that emphasizes separation of concerns, testability, and maintainability. The refactored architecture introduces clear boundaries between layers and uses established patterns to reduce code duplication and improve code quality.

### Key Architectural Goals

- **Separation of Concerns**: Each layer has a single, well-defined responsibility
- **Code Reusability**: Common operations are centralized and reused
- **Type Safety**: Full TypeScript typing throughout the application
- **Testability**: All components designed for easy unit testing
- **Maintainability**: Clear structure and consistent patterns
- **Performance**: Efficient database access and caching strategies

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        HTTP Layer                           │
│                    (Express Routes)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Middleware Layer                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │   Auth   │ │Permission│ │   Rate   │ │Validation│        │
│  │          │ │          │ │  Limit   │ │          │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     Service Layer                           │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Business Logic & Orchestration                  │       │
│  │  - UserService                                   │       │
│  │  - TaskService                                   │       │
│  │  - GroupService                                  │       │
│  │  - PositionService                               │       │
│  └──────────────────────────────────────────────────┘       │
└────────┬───────────────────┬──────────────────┬─────────────┘
         │                   │                  │
         │                   │                  │
┌────────▼────────┐ ┌──────-─▼────────┐ ┌──────▼──────────┐
│   Repository    │ │    Utilities    │ │   Mappers       │
│     Layer       │ │                 │ │                 │
│                 │ │ - Permission    │ │ - UserMapper    │
│ - UserRepo      │ │   Checker       │ │ - TaskMapper    │
│ - TaskRepo      │ │ - Transaction   │ │ - GroupMapper   │
│ - GroupRepo     │ │   Manager       │ │ - PositionMapper│
│ - PositionRepo  │ │ - QueryBuilder  │ │                 │
└────────┬────────┘ └─────────────────┘ └─────────────────┘
         │
┌────────▼────────────────────────────────────────────────────┐
│                    Database Layer                           │
│  ┌──────────────┐              ┌──────────────┐             │
│  │  PostgreSQL  │              │    Redis     │             │
│  │  (Primary)   │              │   (Cache)    │             │
│  └──────────────┘              └──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Layers

### 1. HTTP Layer (Routes)

**Responsibility**: Handle HTTP requests and responses

**Location**: `src/routes/`

**Key Files**:
- `auth.routes.ts` - Authentication endpoints
- `user.routes.ts` - User management
- `task.routes.ts` - Task operations
- `group.routes.ts` - Group management
- `position.routes.ts` - Position management

**Characteristics**:
- Thin layer - minimal logic
- Route parameter validation
- Middleware application
- Response formatting

**Example**:
```typescript
router.get('/tasks/:id', authenticate, async (req, res) => {
  const taskService = resolve('taskService');
  const task = await taskService.getTaskById(
    req.user!.userId,
    parseInt(req.params.id)
  );
  res.json(task);
});
```

### 2. Middleware Layer

**Responsibility**: Cross-cutting concerns (auth, validation, rate limiting)

**Location**: `src/middleware/`

**Key Components**:
- **Authentication** (`auth.middleware.ts`): JWT verification
- **Authorization** (`permission.middleware.ts`): Role-based access control
- **Rate Limiting** (`rateLimit.middleware.ts`): API abuse prevention
- **Validation** (`validation.middleware.ts`): Request validation
- **Caching** (`cache.middleware.ts`): Response caching
- **Error Handling** (`errorHandler.middleware.ts`): Global error handling

**Characteristics**:
- Reusable across routes
- Composable
- Order-dependent execution

### 3. Service Layer

**Responsibility**: Business logic and orchestration

**Location**: `src/services/`

**Key Services**:
- `UserService.ts` - User management logic
- `TaskService.ts` - Task operations
- `GroupService.ts` - Group management
- `PositionService.ts` - Position handling
- `BountyService.ts` - Bounty calculations
- `NotificationService.ts` - Notification management

**Characteristics**:
- Contains business rules
- Orchestrates repository calls
- Uses utilities (PermissionChecker, TransactionManager)
- Returns DTOs via mappers
- Dependency injection via constructor

**Example**:
```typescript
class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private permissionChecker: PermissionChecker,
    private transactionManager: TransactionManager
  ) {}

  async createTask(userId: number, data: CreateTaskInput): Promise<TaskDTO> {
    return this.transactionManager.executeInTransaction(async (client) => {
      const task = await this.taskRepository.create({
        ...data,
        creator_id: userId
      }, client);
      
      return TaskMapper.toDTO(task);
    });
  }
}
```

### 4. Repository Layer

**Responsibility**: Data access abstraction

**Location**: `src/repositories/`

**Key Components**:
- `BaseRepository.ts` - Common CRUD operations
- `UserRepository.ts` - User-specific queries
- `TaskRepository.ts` - Task-specific queries
- `GroupRepository.ts` - Group-specific queries
- `PositionRepository.ts` - Position-specific queries

**Characteristics**:
- Encapsulates SQL queries
- Uses QueryBuilder for SQL construction
- Returns typed model objects
- Handles database connections
- No business logic

**Documentation**: [Repository Pattern](src/repositories/REPOSITORY_PATTERN.md)

### 5. Utility Layer

**Responsibility**: Reusable helper functions and classes

**Location**: `src/utils/`

**Key Utilities**:
- **PermissionChecker**: Centralized authorization logic
- **TransactionManager**: Safe transaction handling
- **QueryBuilder**: SQL query construction
- **Validator**: Input validation
- **Mappers**: Model to DTO transformation
- **Error Classes**: Consistent error handling

**Documentation**:
- [Permission Checker](src/utils/PERMISSION_CHECKER.md)
- [Transaction Manager](src/utils/TRANSACTION_MANAGER.md)
- [Mapper Pattern](src/utils/mappers/MAPPER_PATTERN.md)

### 6. Database Layer

**Responsibility**: Data persistence

**Technologies**:
- **PostgreSQL**: Primary database
- **Redis**: Caching and sessions

**Connection Management**:
- Connection pooling (pg Pool)
- Automatic connection release
- Transaction support

## Design Principles

### 1. Separation of Concerns

Each layer has a single, well-defined responsibility:

```
Routes      → Handle HTTP
Middleware  → Cross-cutting concerns
Services    → Business logic
Repositories → Data access
Database    → Persistence
```

### 2. Dependency Inversion

Services depend on abstractions (interfaces), not concrete implementations:

```typescript
// Service depends on interface
class TaskService {
  constructor(private taskRepository: ITaskRepository) {}
}

// Concrete implementation injected at runtime
const taskService = new TaskService(new TaskRepository());
```

### 3. Single Responsibility

Each class has one reason to change:

```typescript
// ✅ Good - Single responsibility
class TaskRepository {
  // Only handles data access
  async findById(id: number): Promise<Task | null> { }
}

class TaskService {
  // Only handles business logic
  async getTask(userId: number, taskId: number): Promise<TaskDTO> { }
}

// ❌ Bad - Multiple responsibilities
class TaskManager {
  async findById(id: number) { }  // Data access
  async validateTask(task: Task) { }  // Business logic
  async sendNotification(task: Task) { }  // External service
}
```

### 4. Don't Repeat Yourself (DRY)

Common operations are centralized:

```typescript
// Before: User query repeated 15+ times
const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

// After: Centralized in repository
const user = await userRepository.findById(id);
```

### 5. Open/Closed Principle

Open for extension, closed for modification:

```typescript
// Base repository provides common operations
class BaseRepository<T> {
  async findById(id: number): Promise<T | null> { }
}

// Extend with specific operations
class UserRepository extends BaseRepository<User> {
  async findByEmail(email: string): Promise<User | null> { }
}
```

## Core Components

### Dependency Injection Container

**Purpose**: Manage service dependencies and lifecycle

**Location**: `src/config/container.ts`

**Features**:
- Singleton pattern
- Automatic dependency resolution
- Circular dependency detection
- Type-safe resolution

**Documentation**: [DI Container Usage](src/config/CONTAINER_USAGE.md)

**Example**:
```typescript
// Registration
container.register('userService', (c) => new UserService(
  c.resolve('userRepository'),
  c.resolve('permissionChecker')
));

// Resolution
const userService = resolve('userService');
```

### Permission Checker

**Purpose**: Centralized authorization logic

**Location**: `src/utils/PermissionChecker.ts`

**Features**:
- Role-based access control
- Ownership-based access
- Membership-based access
- Descriptive error messages

**Example**:
```typescript
// Check permission
await permissionChecker.canModifyTask(userId, taskId);

// If we reach here, user has permission
await taskRepository.update(taskId, data);
```

### Transaction Manager

**Purpose**: Safe multi-step database operations

**Location**: `src/utils/TransactionManager.ts`

**Features**:
- Automatic commit on success
- Automatic rollback on failure
- Connection management
- Error propagation

**Example**:
```typescript
await transactionManager.executeInTransaction(async (client) => {
  const task = await taskRepository.create(data, client);
  await positionRepository.create(posData, client);
  return task;
});
```

### Mappers

**Purpose**: Transform models to DTOs

**Location**: `src/utils/mappers/`

**Features**:
- Consistent field naming (snake_case → camelCase)
- Nested object transformation
- Null/undefined handling
- Date formatting

**Example**:
```typescript
// Transform single object
const userDTO = UserMapper.toDTO(user);

// Transform array
const userDTOs = UserMapper.toDTOList(users);
```

## Data Flow

### Read Operation Flow

```
1. HTTP Request
   ↓
2. Authentication Middleware (verify JWT)
   ↓
3. Route Handler
   ↓
4. Service Layer
   ↓
5. Permission Check (PermissionChecker)
   ↓
6. Repository Layer (fetch data)
   ↓
7. Database Query
   ↓
8. Mapper (transform to DTO)
   ↓
9. HTTP Response
```

### Write Operation Flow

```
1. HTTP Request
   ↓
2. Authentication Middleware
   ↓
3. Validation Middleware
   ↓
4. Route Handler
   ↓
5. Service Layer
   ↓
6. Permission Check
   ↓
7. Transaction Manager (begin)
   ↓
8. Repository Layer (write data)
   ↓
9. Database Operations
   ↓
10. Transaction Manager (commit)
    ↓
11. Mapper (transform to DTO)
    ↓
12. HTTP Response
```

### Error Flow

```
1. Error Occurs (any layer)
   ↓
2. Error Propagates Up
   ↓
3. Transaction Rollback (if in transaction)
   ↓
4. Connection Release
   ↓
5. Error Handler Middleware
   ↓
6. HTTP Error Response
```

## Patterns and Practices

### Repository Pattern

**Purpose**: Separate data access from business logic

**Benefits**:
- Code reusability
- Testability
- Consistent data access
- Type safety

**Documentation**: [Repository Pattern](src/repositories/REPOSITORY_PATTERN.md)

### Dependency Injection

**Purpose**: Decouple components and improve testability

**Benefits**:
- Loose coupling
- Easy testing with mocks
- Flexible configuration
- Clear dependencies

**Documentation**: [DI Container Usage](src/config/CONTAINER_USAGE.md)

### Data Transfer Objects (DTOs)

**Purpose**: Define API response structure

**Benefits**:
- Consistent API responses
- Security (exclude sensitive fields)
- Versioning support
- Documentation

### Transaction Pattern

**Purpose**: Ensure data consistency across multiple operations

**Benefits**:
- Atomic operations
- Automatic rollback
- Safe error handling
- Connection management

**Documentation**: [Transaction Manager](src/utils/TRANSACTION_MANAGER.md)

### Error Handling Pattern

**Purpose**: Consistent error responses

**Error Types**:
- `ValidationError` (400) - Invalid input
- `UnauthorizedError` (403) - Permission denied
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Resource conflict
- `DatabaseError` (500) - Database error

## Technology Stack

### Core Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 18+ |
| TypeScript | Language | 5.0+ |
| Express | Web framework | 4.18+ |
| PostgreSQL | Database | 14+ |
| Redis | Cache | 7+ |

### Key Libraries

| Library | Purpose |
|---------|---------|
| pg | PostgreSQL driver |
| ioredis | Redis client |
| bcrypt | Password hashing |
| jsonwebtoken | JWT authentication |
| zod | Schema validation |
| vitest | Testing framework |
| fast-check | Property-based testing |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Vitest | Testing |
| PM2 | Process management |

## Performance Considerations

### Database Optimization

1. **Connection Pooling**
   ```typescript
   const pool = new Pool({
     max: 20,  // Maximum connections
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000
   });
   ```

2. **Indexes**
   - Primary keys on all tables
   - Foreign key indexes
   - Frequently queried columns

3. **Query Optimization**
   - Use prepared statements
   - Avoid N+1 queries
   - Use joins for related data

### Caching Strategy

1. **Redis Caching**
   - User sessions
   - Frequently accessed data
   - Rate limit counters

2. **Cache Invalidation**
   - Time-based expiration
   - Event-based invalidation
   - Manual cache clearing

### Async Processing

1. **Message Queues** (BullMQ)
   - Notification sending
   - Report generation
   - Background tasks

2. **WebSocket** (Socket.io)
   - Real-time notifications
   - Live updates

## Security

### Authentication

- JWT-based authentication
- Secure password hashing (bcrypt)
- Token expiration
- Refresh token support

### Authorization

- Role-based access control (RBAC)
- Resource ownership checks
- Permission validation

### Input Validation

- Zod schema validation
- SQL injection prevention (parameterized queries)
- XSS prevention

### Rate Limiting

- IP-based limits
- User-based limits
- Endpoint-specific limits

### Security Headers

- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy

## Testing Strategy

### Unit Tests

**Purpose**: Test individual components in isolation

**Tools**: Vitest

**Coverage**: 80%+ for services, 90%+ for infrastructure

**Example**:
```typescript
describe('UserService', () => {
  it('should get user by id', async () => {
    const mockRepo = { findById: vi.fn().mockResolvedValue(user) };
    const service = new UserService(mockRepo, mockPermChecker);
    
    const result = await service.getUserById(1);
    
    expect(mockRepo.findById).toHaveBeenCalledWith(1);
    expect(result).toBeDefined();
  });
});
```

### Property-Based Tests

**Purpose**: Test universal properties with randomized inputs

**Tools**: fast-check

**Coverage**: Critical business logic

**Example**:
```typescript
it('should consistently map models to DTOs', () => {
  fc.assert(
    fc.property(
      fc.record({ id: fc.integer(), username: fc.string() }),
      (user) => {
        const dto = UserMapper.toDTO(user);
        expect(dto.id).toBe(user.id);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests

**Purpose**: Test component interactions

**Coverage**: API endpoints, service integration

**Example**:
```typescript
describe('Task API', () => {
  it('should create task with positions', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send(taskData)
      .expect(201);
    
    expect(response.body.id).toBeDefined();
  });
});
```

## Documentation Index

### Pattern Documentation
- [Repository Pattern](src/repositories/REPOSITORY_PATTERN.md)
- [DI Container Usage](src/config/CONTAINER_USAGE.md)
- [Transaction Manager](src/utils/TRANSACTION_MANAGER.md)
- [Permission Checker](src/utils/PERMISSION_CHECKER.md)
- [Mapper Pattern](src/utils/mappers/MAPPER_PATTERN.md)

### Migration Guide
- [Refactoring Migration Guide](REFACTORING_MIGRATION_GUIDE.md)

### File Structure
- [Backend File Structure](docs/BACKEND_FILE_STRUCTURE.md)

### System Documentation
- [Bounty System](src/services/BOUNTY_SYSTEM.md)
- [Notification System](src/services/NOTIFICATION_SYSTEM.md)
- [Ranking System](src/services/RANKING_AVATAR_SYSTEM.md)
- [Security Implementation](src/middleware/SECURITY.md)

## Getting Started

### For New Developers

1. Read this architecture document
2. Review [Repository Pattern](src/repositories/REPOSITORY_PATTERN.md)
3. Study [DI Container Usage](src/config/CONTAINER_USAGE.md)
4. Examine existing services for examples
5. Follow [Migration Guide](REFACTORING_MIGRATION_GUIDE.md) for new features

### For Existing Developers

1. Review [Migration Guide](REFACTORING_MIGRATION_GUIDE.md)
2. Understand new patterns
3. Migrate services incrementally
4. Update tests
5. Share knowledge with team

## Maintenance

### Code Quality

- Follow TypeScript strict mode
- Use ESLint and Prettier
- Write tests for new code
- Document complex logic

### Performance Monitoring

- Monitor database query performance
- Track API response times
- Monitor cache hit rates
- Review error logs

### Security Updates

- Keep dependencies updated
- Review security advisories
- Conduct security audits
- Update authentication tokens

## Support and Resources

### Internal Resources
- Architecture documentation (this file)
- Pattern documentation (linked above)
- Code examples in refactored services
- Team knowledge base

### External Resources
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-19  
**Maintained By**: Backend Team
