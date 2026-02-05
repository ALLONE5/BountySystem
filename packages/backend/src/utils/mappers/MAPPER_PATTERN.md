# Mapper Pattern Documentation

## Overview

Mappers transform database models to Data Transfer Objects (DTOs) for API responses. They centralize data transformation logic, ensure consistent API responses, and handle field name conversions (snake_case to camelCase).

**Location**: `src/utils/mappers/`

## Why Use Mappers?

### Problem: Inconsistent Data Transformation

**Before** (Manual transformation in each service):

```typescript
// UserService.ts
return {
  id: user.id,
  username: user.username,
  createdAt: user.created_at  // Manual conversion
};

// TaskService.ts
return {
  id: task.id,
  title: task.title,
  createdAt: task.created_at,  // Duplicated logic
  creator: {
    id: task.creator.id,
    username: task.creator.username,
    createdAt: task.creator.created_at  // Nested duplication
  }
};
```

**After** (Centralized mappers):

```typescript
// All services use the same mapper
return UserMapper.toDTO(user);
return TaskMapper.toDTO(task);
```

## Available Mappers

### UserMapper

**Location**: `src/utils/mappers/UserMapper.ts`

**Methods**:
- `toDTO(user: User): UserDTO` - Transform single user
- `toDTOList(users: User[]): UserDTO[]` - Transform user array

**Example**:

```typescript
import { UserMapper } from '../utils/mappers/UserMapper.js';

// Single user
const user = await userRepository.findById(1);
const userDTO = UserMapper.toDTO(user);

// Multiple users
const users = await userRepository.findAll();
const userDTOs = UserMapper.toDTOList(users);
```

**Transformation**:

```typescript
// Input (Database model)
{
  id: 1,
  username: 'john',
  email: 'john@example.com',
  password_hash: 'hashed...',
  created_at: Date,
  updated_at: Date,
  last_login: Date
}

// Output (DTO)
{
  id: 1,
  username: 'john',
  email: 'john@example.com',
  // password_hash removed (security)
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  lastLogin: '2024-01-01T00:00:00.000Z'
}
```

### TaskMapper

**Location**: `src/utils/mappers/TaskMapper.ts`

**Methods**:
- `toDTO(task: Task): TaskDTO` - Transform single task
- `toDTOList(tasks: Task[]): TaskDTO[]` - Transform task array

**Example**:

```typescript
import { TaskMapper } from '../utils/mappers/TaskMapper.js';

// Task with nested objects
const task = await taskRepository.findWithPositions(taskId);
const taskDTO = TaskMapper.toDTO(task);
```

**Transformation**:

```typescript
// Input (Database model)
{
  id: 1,
  title: 'Build feature',
  description: 'Description',
  status: 'open',
  bounty: 100,
  creator_id: 1,
  group_id: 2,
  created_at: Date,
  updated_at: Date,
  creator: { id: 1, username: 'john', ... },
  group: { id: 2, name: 'Team A', ... },
  positions: [{ id: 1, title: 'Developer', ... }]
}

// Output (DTO)
{
  id: 1,
  title: 'Build feature',
  description: 'Description',
  status: 'open',
  bounty: 100,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  creator: { id: 1, username: 'john', ... },  // Nested DTO
  group: { id: 2, name: 'Team A', ... },      // Nested DTO
  positions: [{ id: 1, title: 'Developer', ... }]  // Array of DTOs
}
```

### GroupMapper

**Location**: `src/utils/mappers/GroupMapper.ts`

**Methods**:
- `toDTO(group: ProjectGroup): GroupDTO` - Transform single group
- `toDTOList(groups: ProjectGroup[]): GroupDTO[]` - Transform group array

**Example**:

```typescript
import { GroupMapper } from '../utils/mappers/GroupMapper.js';

const group = await groupRepository.findWithMembers(groupId);
const groupDTO = GroupMapper.toDTO(group);
```

### PositionMapper

**Location**: `src/utils/mappers/PositionMapper.ts`

**Methods**:
- `toDTO(position: Position): PositionDTO` - Transform single position
- `toDTOList(positions: Position[]): PositionDTO[]` - Transform position array

**Example**:

```typescript
import { PositionMapper } from '../utils/mappers/PositionMapper.js';

const positions = await positionRepository.findByTask(taskId);
const positionDTOs = PositionMapper.toDTOList(positions);
```

## Usage in Services

### Basic Usage

```typescript
class UserService {
  async getUserById(userId: number): Promise<UserDTO> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Transform to DTO
    return UserMapper.toDTO(user);
  }
}
```

### With Collections

```typescript
class TaskService {
  async getAllTasks(): Promise<TaskDTO[]> {
    const tasks = await this.taskRepository.findAll();
    
    // Transform array to DTOs
    return TaskMapper.toDTOList(tasks);
  }
}
```

### With Nested Objects

```typescript
class TaskService {
  async getTaskWithDetails(taskId: number): Promise<TaskDTO> {
    // Fetch task with creator, group, and positions
    const task = await this.taskRepository.findWithPositions(taskId);
    
    // Mapper handles nested transformations automatically
    return TaskMapper.toDTO(task);
  }
}
```

### Conditional Mapping

```typescript
class TaskService {
  async getTask(userId: number, taskId: number): Promise<TaskDTO> {
    const task = await this.taskRepository.findById(taskId);
    
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    
    // Check permission
    const canViewDetails = await this.permissionChecker.canAccessTask(userId, taskId);
    
    if (canViewDetails) {
      // Full DTO with all fields
      return TaskMapper.toDTO(task);
    } else {
      // Partial DTO with public fields only
      return {
        id: task.id,
        title: task.title,
        status: task.status
      };
    }
  }
}
```

## Mapper Features

### 1. Null/Undefined Handling

Mappers gracefully handle null and undefined values:

```typescript
// Input with null values
const task = {
  id: 1,
  title: 'Task',
  creator: null,      // No creator
  group: undefined,   // No group
  positions: []       // Empty array
};

// Output
const dto = TaskMapper.toDTO(task);
// {
//   id: 1,
//   title: 'Task',
//   creator: undefined,
//   group: undefined,
//   positions: []
// }
```

### 2. Nested Object Transformation

Mappers automatically transform nested objects:

```typescript
// Task with nested creator
const task = {
  id: 1,
  title: 'Task',
  creator: {
    id: 1,
    username: 'john',
    created_at: Date  // snake_case
  }
};

// Nested object is also transformed
const dto = TaskMapper.toDTO(task);
// {
//   id: 1,
//   title: 'Task',
//   creator: {
//     id: 1,
//     username: 'john',
//     createdAt: '2024-01-01T00:00:00.000Z'  // camelCase
//   }
// }
```

### 3. Array Transformation

Mappers handle arrays of nested objects:

```typescript
// Task with positions array
const task = {
  id: 1,
  title: 'Task',
  positions: [
    { id: 1, title: 'Dev', created_at: Date },
    { id: 2, title: 'Designer', created_at: Date }
  ]
};

// Each position is transformed
const dto = TaskMapper.toDTO(task);
// {
//   id: 1,
//   title: 'Task',
//   positions: [
//     { id: 1, title: 'Dev', createdAt: '...' },
//     { id: 2, title: 'Designer', createdAt: '...' }
//   ]
// }
```

### 4. Date Formatting

Dates are converted to ISO strings:

```typescript
// Input
const user = {
  id: 1,
  username: 'john',
  created_at: new Date('2024-01-01')
};

// Output
const dto = UserMapper.toDTO(user);
// {
//   id: 1,
//   username: 'john',
//   createdAt: '2024-01-01T00:00:00.000Z'
// }
```

### 5. Field Filtering

Sensitive fields are excluded:

```typescript
// Input (includes password)
const user = {
  id: 1,
  username: 'john',
  password_hash: 'hashed...'
};

// Output (password excluded)
const dto = UserMapper.toDTO(user);
// {
//   id: 1,
//   username: 'john'
//   // password_hash not included
// }
```

## Best Practices

### 1. Always Use Mappers in Services

```typescript
// ✅ Good - Use mapper
async getUserById(userId: number): Promise<UserDTO> {
  const user = await this.userRepository.findById(userId);
  return UserMapper.toDTO(user);
}

// ❌ Bad - Manual transformation
async getUserById(userId: number) {
  const user = await this.userRepository.findById(userId);
  return {
    id: user.id,
    username: user.username,
    createdAt: user.created_at
  };
}
```

### 2. Use toDTOList for Arrays

```typescript
// ✅ Good - Use toDTOList
async getAllUsers(): Promise<UserDTO[]> {
  const users = await this.userRepository.findAll();
  return UserMapper.toDTOList(users);
}

// ❌ Bad - Manual map
async getAllUsers(): Promise<UserDTO[]> {
  const users = await this.userRepository.findAll();
  return users.map(u => UserMapper.toDTO(u));
}
```

### 3. Let Mappers Handle Nested Objects

```typescript
// ✅ Good - Mapper handles nesting
const taskDTO = TaskMapper.toDTO(task);

// ❌ Bad - Manual nested transformation
const taskDTO = {
  ...TaskMapper.toDTO(task),
  creator: UserMapper.toDTO(task.creator),
  positions: task.positions.map(p => PositionMapper.toDTO(p))
};
```

### 4. Check for Null Before Mapping

```typescript
// ✅ Good - Check first
const user = await this.userRepository.findById(userId);
if (!user) {
  throw new NotFoundError('User not found');
}
return UserMapper.toDTO(user);

// ❌ Bad - Map without checking
const user = await this.userRepository.findById(userId);
return UserMapper.toDTO(user);  // Might throw if user is null
```

### 5. Don't Modify DTOs After Mapping

```typescript
// ✅ Good - Map once
const userDTO = UserMapper.toDTO(user);
return userDTO;

// ❌ Bad - Modify after mapping
const userDTO = UserMapper.toDTO(user);
userDTO.customField = 'value';  // Don't do this
return userDTO;
```

## Testing Mappers

### Unit Tests

Test transformation logic:

```typescript
describe('UserMapper', () => {
  it('should transform user to DTO', () => {
    const user = {
      id: 1,
      username: 'john',
      email: 'john@example.com',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-02')
    };
    
    const dto = UserMapper.toDTO(user);
    
    expect(dto.id).toBe(1);
    expect(dto.username).toBe('john');
    expect(dto.email).toBe('john@example.com');
    expect(dto.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2024-01-02T00:00:00.000Z');
  });
  
  it('should handle null values', () => {
    const task = {
      id: 1,
      title: 'Task',
      creator: null
    };
    
    const dto = TaskMapper.toDTO(task);
    
    expect(dto.creator).toBeUndefined();
  });
});
```

### Property-Based Tests

Test universal properties:

```typescript
import fc from 'fast-check';

// Property: Mapper Consistency
it('should consistently map models to DTOs', () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.integer({ min: 1 }),
        username: fc.string(),
        email: fc.emailAddress(),
        created_at: fc.date()
      }),
      (user) => {
        const dto = UserMapper.toDTO(user);
        
        // Check field mapping
        expect(dto.id).toBe(user.id);
        expect(dto.username).toBe(user.username);
        expect(dto.email).toBe(user.email);
        expect(dto.createdAt).toBe(user.created_at.toISOString());
      }
    ),
    { numRuns: 100 }
  );
});
```

## Advanced Usage

### Custom Mappers

Create custom mappers for specific use cases:

```typescript
class CustomTaskMapper {
  static toPublicDTO(task: Task): PublicTaskDTO {
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      bounty: task.bounty
      // Exclude sensitive fields
    };
  }
  
  static toAdminDTO(task: Task): AdminTaskDTO {
    return {
      ...TaskMapper.toDTO(task),
      internalNotes: task.internal_notes,
      creatorEmail: task.creator?.email
      // Include admin-only fields
    };
  }
}
```

### Conditional Field Inclusion

```typescript
class UserMapper {
  static toDTO(user: User, includeEmail: boolean = true): UserDTO {
    const dto: UserDTO = {
      id: user.id,
      username: user.username,
      createdAt: user.created_at.toISOString()
    };
    
    if (includeEmail) {
      dto.email = user.email;
    }
    
    return dto;
  }
}
```

### Computed Fields

```typescript
class TaskMapper {
  static toDTO(task: Task): TaskDTO {
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      bounty: task.bounty,
      createdAt: task.created_at.toISOString(),
      
      // Computed field
      isCompleted: task.status === 'completed',
      daysOpen: Math.floor((Date.now() - task.created_at.getTime()) / (1000 * 60 * 60 * 24))
    };
  }
}
```

## Troubleshooting

### Common Issues

**Issue**: "Cannot read property 'toISOString' of undefined"
- **Cause**: Date field is null/undefined
- **Solution**: Add null check in mapper

**Issue**: Nested objects not transformed
- **Cause**: Forgot to call nested mapper
- **Solution**: Use nested mapper for related objects

**Issue**: DTO has extra fields
- **Cause**: Mapper includes fields that shouldn't be exposed
- **Solution**: Explicitly list fields in mapper

**Issue**: Performance issues with large arrays
- **Cause**: Inefficient nested mapping
- **Solution**: Optimize mapper or use database-level transformation

## Migration Guide

### Migrating from Manual Transformation

**Before**:
```typescript
async getUserById(userId: number) {
  const user = await this.userRepository.findById(userId);
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString()
  };
}
```

**After**:
```typescript
async getUserById(userId: number): Promise<UserDTO> {
  const user = await this.userRepository.findById(userId);
  return UserMapper.toDTO(user);
}
```

## Related Documentation

- [Repository Pattern](../../repositories/REPOSITORY_PATTERN.md)
- [DI Container Usage](../../config/CONTAINER_USAGE.md)
- [Type Definitions](../../models/)
