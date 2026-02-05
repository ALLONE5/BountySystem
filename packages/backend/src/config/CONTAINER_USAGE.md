# DI Container Usage Guide

## Overview

The Dependency Injection (DI) Container is configured in `container.ts` and provides centralized management of all services and repositories in the application. This guide explains how to use the container effectively.

## Registered Services

The container includes the following registered services:

### Repositories
- `userRepository` - UserRepository instance
- `taskRepository` - TaskRepository instance
- `groupRepository` - GroupRepository instance
- `positionRepository` - PositionRepository instance

### Utilities
- `transactionManager` - TransactionManager instance (configured with database pool)
- `permissionChecker` - PermissionChecker instance (with repository dependencies)

## Usage Patterns

### 1. Using the Global Container

The simplest way to use the container is through the global instance:

```typescript
import { container } from '../config/container.js';

// Resolve a repository
const userRepository = container.resolve('userRepository');

// Resolve a utility
const permissionChecker = container.resolve('permissionChecker');
```

### 2. Using the Helper Function

For cleaner code, use the `resolve` helper function:

```typescript
import { resolve } from '../config/container.js';

const userRepository = resolve('userRepository');
const transactionManager = resolve('transactionManager');
```

### 3. In Service Classes

Services should receive dependencies through their constructor:

```typescript
import { resolve } from '../config/container.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { PermissionChecker } from '../utils/PermissionChecker.js';

class UserService {
  private userRepository: UserRepository;
  private permissionChecker: PermissionChecker;

  constructor() {
    this.userRepository = resolve('userRepository');
    this.permissionChecker = resolve('permissionChecker');
  }

  async getUserById(userId: number) {
    return this.userRepository.findById(userId);
  }
}
```

### 4. In Route Handlers

Route handlers can resolve dependencies as needed:

```typescript
import { Router } from 'express';
import { resolve } from '../config/container.js';

const router = Router();

router.get('/users/:id', async (req, res) => {
  const userRepository = resolve('userRepository');
  const user = await userRepository.findById(parseInt(req.params.id));
  res.json(user);
});
```

### 5. Creating Test Containers

For testing, create isolated containers:

```typescript
import { createContainer } from '../config/container.js';

describe('My Test Suite', () => {
  let testContainer;

  beforeEach(() => {
    testContainer = createContainer();
  });

  it('should work with isolated container', () => {
    const userRepo = testContainer.resolve('userRepository');
    // Test with isolated instance
  });
});
```

## Benefits

### Singleton Pattern
All services are singletons - resolving the same service multiple times returns the same instance:

```typescript
const repo1 = resolve('userRepository');
const repo2 = resolve('userRepository');
console.log(repo1 === repo2); // true
```

### Automatic Dependency Resolution
Dependencies are resolved automatically. For example, `PermissionChecker` requires four repositories, and they're all injected automatically:

```typescript
// PermissionChecker automatically gets all its dependencies
const permChecker = resolve('permissionChecker');
```

### Circular Dependency Detection
The container detects circular dependencies and throws descriptive errors:

```typescript
// If Service A depends on Service B, and Service B depends on Service A
// The container will throw: "Circular dependency detected: serviceA -> serviceB -> serviceA"
```

## Best Practices

1. **Resolve at the Entry Point**: Resolve dependencies at the entry point of your code (route handlers, service constructors) rather than deep in the call stack.

2. **Type Safety**: Use TypeScript generics for type-safe resolution:
   ```typescript
   const userRepo = resolve<UserRepository>('userRepository');
   ```

3. **Avoid Direct Instantiation**: Don't create repository or utility instances directly. Always use the container:
   ```typescript
   // ❌ Bad
   const userRepo = new UserRepository();
   
   // ✅ Good
   const userRepo = resolve('userRepository');
   ```

4. **Test Isolation**: Create new containers for each test suite to ensure isolation:
   ```typescript
   beforeEach(() => {
     testContainer = createContainer();
   });
   ```

5. **Service Registration**: If you need to add new services, register them in `container.ts`:
   ```typescript
   container.register('myService', (c) => new MyService(
     c.resolve('dependency1'),
     c.resolve('dependency2')
   ));
   ```

## Troubleshooting

### "Service X is not registered"
Make sure the service is registered in `container.ts`. Check the `createContainer()` function.

### "Circular dependency detected"
Review your service dependencies. Services should not depend on each other in a circular manner. Consider refactoring to break the cycle.

### Different Instances in Tests
If you're getting different instances than expected in tests, make sure you're using the same container instance throughout your test.

## Migration from Direct Instantiation

If you're migrating from direct instantiation to the container:

**Before:**
```typescript
const userRepo = new UserRepository();
const permChecker = new PermissionChecker(userRepo, taskRepo, groupRepo, posRepo);
```

**After:**
```typescript
const userRepo = resolve('userRepository');
const permChecker = resolve('permissionChecker');
```

The container handles all dependency wiring automatically.

