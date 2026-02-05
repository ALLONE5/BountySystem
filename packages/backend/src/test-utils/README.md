# Test Utilities

This directory contains testing infrastructure for property-based testing (PBT) and unit testing in the backend refactoring project.

## Overview

The test utilities provide:
- **Fixtures**: Pre-configured test data for models (User, Task, ProjectGroup, Position)
- **Generators**: fast-check arbitraries for property-based testing
- **Helpers**: Utility functions for assertions, mocking, and test configuration

## Installation

The testing infrastructure uses:
- **Vitest**: Test framework
- **fast-check**: Property-based testing library

Dependencies are already installed. Run tests with:
```bash
npm test
```

## Usage

### Fixtures

Fixtures provide valid default values for models that can be overridden:

```typescript
import { createUserFixture, createTaskFixture } from '../test-utils';

// Create a user with default values
const user = createUserFixture();

// Create a user with custom values
const admin = createUserFixture({
  role: UserRole.SUPER_ADMIN,
  username: 'admin',
});

// Create multiple users
const users = createUserFixtures(5); // Creates 5 users with sequential IDs
```

Available fixture functions:
- `createUserFixture(overrides?)`
- `createTaskFixture(overrides?)`
- `createProjectGroupFixture(overrides?)`
- `createPositionFixture(overrides?)`
- `createUserFixtures(count, baseOverrides?)`
- `createTaskFixtures(count, baseOverrides?)`
- `createProjectGroupFixtures(count, baseOverrides?)`
- `createPositionFixtures(count, baseOverrides?)`

### Generators

Generators create random test data for property-based testing:

```typescript
import fc from 'fast-check';
import { userArbitrary, taskArbitrary } from '../test-utils';

// Use in property tests
fc.assert(
  fc.property(userArbitrary, (user) => {
    // Test property with random user
    expect(user.id).toBeDefined();
  }),
  { numRuns: 100 }
);
```

Available generators:
- **Primitives**: `userIdArbitrary`, `emailArbitrary`, `usernameArbitrary`, `dateArbitrary`, etc.
- **Enums**: `userRoleArbitrary`, `taskStatusArbitrary`, `visibilityArbitrary`
- **Models**: `userArbitrary`, `taskArbitrary`, `projectGroupArbitrary`, `positionArbitrary`
- **Arrays**: `userArrayArbitrary`, `taskArrayArbitrary`, etc.

### Helpers

Helper functions simplify common testing patterns:

```typescript
import { testProperty, assertHasProperties, assertThrows } from '../test-utils';

// Run a property test with standard configuration
testProperty(
  'should have all required properties',
  userArbitrary,
  (user) => {
    assertHasProperties(user, ['id', 'username', 'email']);
  }
);

// Test error handling
await assertThrows(
  async () => {
    throw new ValidationError('Invalid input');
  },
  ValidationError
);
```

Available helpers:
- **Property testing**: `testProperty`, `testPropertyMulti`, `PBT_CONFIG`
- **Assertions**: `assertHasProperties`, `assertDeepEqual`, `assertInRange`, `assertValidDate`, etc.
- **Mocking**: `createMockPool`, `createMockTransactionClient`, `createSpy`
- **Error testing**: `assertErrorType`, `assertErrorMessage`, `assertThrows`, `assertDoesNotThrow`
- **Async**: `waitFor`

## Property-Based Testing Guidelines

### Test Structure

Each property test should:
1. Run minimum 100 iterations (configured in `PBT_CONFIG`)
2. Include a comment tag with feature name and property number
3. Reference the design document property
4. Use appropriate generators for input randomization

Example:

```typescript
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { userArbitrary, PBT_CONFIG } from '../test-utils';

describe('User Mapper', () => {
  // Feature: backend-refactoring, Property 1: Mapper Consistency
  it('should consistently map User models to DTOs', () => {
    fc.assert(
      fc.property(userArbitrary, (user) => {
        const dto = UserMapper.toDTO(user);
        expect(dto.id).toBe(user.id);
        expect(dto.username).toBe(user.username);
        expect(dto.email).toBe(user.email);
      }),
      PBT_CONFIG
    );
  });
});
```

### Property Test Configuration

Default configuration (`PBT_CONFIG`):
- `numRuns: 100` - Minimum iterations per test
- `verbose: false` - Quiet output
- `seed: undefined` - Random seed (can be set for reproducibility)

Override configuration per test:

```typescript
testProperty(
  'should handle edge cases',
  userArbitrary,
  (user) => {
    // Test logic
  },
  { numRuns: 200, verbose: true }
);
```

## Testing Best Practices

1. **Use fixtures for unit tests**: Fixtures provide predictable test data
2. **Use generators for property tests**: Generators explore the input space
3. **Test properties, not examples**: Property tests verify universal truths
4. **Keep tests focused**: One property per test
5. **Use descriptive test names**: Clearly state what property is being tested
6. **Tag tests with feature and property**: Makes it easy to trace back to design

## Examples

### Unit Test with Fixtures

```typescript
import { describe, it, expect } from 'vitest';
import { createUserFixture } from '../test-utils';

describe('UserRepository', () => {
  it('should find user by ID', async () => {
    const user = createUserFixture({ id: '123' });
    // Test logic
  });
});
```

### Property Test with Generators

```typescript
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { taskArbitrary, PBT_CONFIG } from '../test-utils';

describe('TaskMapper', () => {
  // Feature: backend-refactoring, Property 1: Mapper Consistency
  it('should map all task fields correctly', () => {
    fc.assert(
      fc.property(taskArbitrary, (task) => {
        const dto = TaskMapper.toDTO(task);
        expect(dto.id).toBe(task.id);
        expect(dto.name).toBe(task.name);
        // More assertions
      }),
      PBT_CONFIG
    );
  });
});
```

### Integration Test with Mocks

```typescript
import { describe, it, expect } from 'vitest';
import { createMockPool, createUserFixture } from '../test-utils';

describe('UserService', () => {
  it('should create user with transaction', async () => {
    const mockPool = createMockPool();
    const service = new UserService(mockPool);
    const userData = createUserFixture();
    
    // Test logic
  });
});
```

## File Structure

```
test-utils/
├── fixtures.ts       # Test fixtures for models
├── generators.ts     # fast-check generators
├── helpers.ts        # Helper functions and utilities
├── index.ts          # Central export point
└── README.md         # This file
```

## Related Documentation

- [Design Document](../../.kiro/specs/backend-refactoring/design.md) - Correctness properties
- [Requirements](../../.kiro/specs/backend-refactoring/requirements.md) - Testing requirements
- [Tasks](../../.kiro/specs/backend-refactoring/tasks.md) - Implementation plan
- [fast-check Documentation](https://github.com/dubzzz/fast-check) - Property-based testing library
- [Vitest Documentation](https://vitest.dev/) - Test framework
