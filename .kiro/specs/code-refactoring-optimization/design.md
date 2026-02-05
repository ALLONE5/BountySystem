# Design Document: Code Refactoring and Optimization

## Overview

This design addresses systematic code refactoring and optimization of the bounty hunter platform codebase. The refactoring follows an incremental, testable approach that maintains backward compatibility while eliminating code duplication and improving maintainability.

The refactoring is organized into three priority tiers:

1. **Quick Wins**: High-impact, low-risk utilities that can be implemented and adopted immediately
2. **Medium-term Refactoring**: Service-level consolidation requiring gradual migration
3. **Long-term Refactoring**: Architectural improvements for future scalability

This design focuses on the Quick Wins and Medium-term refactoring phases, which deliver immediate value while establishing patterns for future improvements.

## Architecture

### Layered Refactoring Approach

The refactoring follows a layered approach that respects the existing architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Pages      │  │  Components  │  │    Hooks     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                           │                             │
│                  ┌────────▼────────┐                    │
│                  │  New Utilities  │                    │
│                  │  - statusConfig │                    │
│                  │  - useApiCall   │                    │
│                  │  - useFilters   │                    │
│                  └─────────────────┘                    │
└─────────────────────────────────────────────────────────┘
                           │
                    API Boundary
                           │
┌─────────────────────────────────────────────────────────┐
│                    Backend Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Routes     │  │   Services   │  │ Repositories │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                           │                             │
│                  ┌────────▼────────┐                    │
│                  │  New Utilities  │                    │
│                  │  - Validator    │                    │
│                  │  - Ownership    │                    │
│                  │  - QueryBuilder │                    │
│                  └─────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Migration Strategy

The refactoring uses a **gradual migration** strategy:

1. **Create new utilities** alongside existing code
2. **Migrate one component/service at a time** to use new utilities
3. **Verify functionality** after each migration
4. **Remove old code** only after all references are migrated
5. **Maintain backward compatibility** throughout the process

This approach minimizes risk and allows for incremental validation.

## Components and Interfaces

### Frontend Utilities

#### 1. Status Configuration Utility

**Location**: `packages/frontend/src/utils/statusConfig.ts`

**Purpose**: Centralize all status-to-display mappings (colors, text, icons)

**Interface**:
```typescript
interface StatusConfig {
  color: string;
  text: string;
  icon?: string;
}

interface StatusConfigMap {
  task: Record<TaskStatus, StatusConfig>;
  application: Record<ApplicationStatus, StatusConfig>;
  invitation: Record<InvitationStatus, StatusConfig>;
}

export function getTaskStatusConfig(status: TaskStatus): StatusConfig
export function getApplicationStatusConfig(status: ApplicationStatus): StatusConfig
export function getInvitationStatusConfig(status: InvitationStatus): StatusConfig
```

**Rationale**: Eliminates 15+ instances of duplicated getStatusColor() and getStatusText() methods across components.

#### 2. API Call Hook

**Location**: `packages/frontend/src/hooks/useApiCall.ts`

**Purpose**: Standardize API calls with consistent error handling, loading states, and error recovery

**Interface**:
```typescript
interface UseApiCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showErrorNotification?: boolean;
}

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export function useApiCall<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options?: UseApiCallOptions<T>
): UseApiCallReturn<T>
```

**Rationale**: Eliminates 50+ duplicated try-catch blocks across all page components.

#### 3. Task Filters Hook

**Location**: `packages/frontend/src/hooks/useTaskFilters.ts`

**Purpose**: Extract common filtering, searching, and sorting logic for task lists

**Interface**:
```typescript
interface TaskFilters {
  search: string;
  status: TaskStatus[];
  groupId: string | null;
  sortBy: 'createdAt' | 'bounty' | 'deadline';
  sortOrder: 'asc' | 'desc';
}

interface UseTaskFiltersReturn {
  filters: TaskFilters;
  setSearch: (search: string) => void;
  setStatus: (status: TaskStatus[]) => void;
  setGroupId: (groupId: string | null) => void;
  setSortBy: (sortBy: TaskFilters['sortBy']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  resetFilters: () => void;
  filteredTasks: Task[];
}

export function useTaskFilters(tasks: Task[]): UseTaskFiltersReturn
```

**Rationale**: Eliminates duplicated filtering logic in TaskListPage, PublishedTasksPage, and TaskInvitationsPage.

### Backend Utilities

#### 4. Centralized Validator

**Location**: `packages/backend/src/utils/Validator.ts`

**Purpose**: Consolidate all validation logic with consistent error handling

**Interface**:
```typescript
class Validator {
  // Field validation
  static required(value: any, fieldName: string): void
  static string(value: any, fieldName: string): void
  static number(value: any, fieldName: string): void
  static email(value: any, fieldName: string): void
  static uuid(value: any, fieldName: string): void
  
  // Range validation
  static minLength(value: string, min: number, fieldName: string): void
  static maxLength(value: string, max: number, fieldName: string): void
  static min(value: number, min: number, fieldName: string): void
  static max(value: number, max: number, fieldName: string): void
  
  // Business rule validation
  static enum<T>(value: any, allowedValues: T[], fieldName: string): void
  static date(value: any, fieldName: string): void
  static futureDate(value: Date, fieldName: string): void
  
  // Composite validation
  static validateObject(obj: any, rules: ValidationRules): void
}
```

**Rationale**: Eliminates duplicated validation patterns across TaskService, UserService, GroupService, and PositionService.

#### 5. Ownership Validator

**Location**: `packages/backend/src/utils/OwnershipValidator.ts`

**Purpose**: Centralize resource ownership checking logic

**Interface**:
```typescript
class OwnershipValidator {
  static async validateTaskOwnership(
    taskId: string,
    userId: string,
    transaction?: Transaction
  ): Promise<void>
  
  static async validateGroupOwnership(
    groupId: string,
    userId: string,
    transaction?: Transaction
  ): Promise<void>
  
  static async validatePositionOwnership(
    positionId: string,
    userId: string,
    transaction?: Transaction
  ): Promise<void>
  
  static async validateResourceOwnership(
    resourceType: 'task' | 'group' | 'position',
    resourceId: string,
    userId: string,
    transaction?: Transaction
  ): Promise<void>
}
```

**Rationale**: Eliminates duplicated ownership checking code scattered across services.

#### 6. Enhanced QueryBuilder

**Location**: `packages/backend/src/utils/QueryBuilder.ts` (enhancement of existing)

**Purpose**: Extend existing QueryBuilder with common query patterns

**Interface**:
```typescript
class QueryBuilder {
  // Existing methods...
  
  // New pagination methods
  static buildPaginationQuery(
    baseQuery: any,
    page: number,
    limit: number
  ): any
  
  // New association methods
  static buildUserAssociationQuery(
    baseQuery: any,
    includeProfile?: boolean
  ): any
  
  // New aggregation methods
  static buildCountQuery(
    model: any,
    conditions: any
  ): any
  
  static buildSumQuery(
    model: any,
    field: string,
    conditions: any
  ): any
}
```

**Rationale**: Reduces repetitive SQL patterns for pagination, associations, and aggregations.

### Service Layer Consolidation

#### 7. Unified Permission Service

**Location**: `packages/backend/src/services/PermissionService.ts` (consolidation)

**Purpose**: Merge PermissionChecker, PermissionService, and permission middleware into a single service

**Interface**:
```typescript
class PermissionService {
  // Ownership checks (from PermissionChecker)
  async checkTaskOwnership(taskId: string, userId: string): Promise<boolean>
  async checkGroupOwnership(groupId: string, userId: string): Promise<boolean>
  
  // Role-based checks (from existing PermissionService)
  async checkPermission(userId: string, permission: string): Promise<boolean>
  async checkGroupPermission(userId: string, groupId: string, permission: string): Promise<boolean>
  
  // Resource-specific checks (from middleware)
  async canAccessTask(userId: string, taskId: string): Promise<boolean>
  async canModifyTask(userId: string, taskId: string): Promise<boolean>
  async canDeleteTask(userId: string, taskId: string): Promise<boolean>
  
  // Middleware integration
  requirePermission(permission: string): RequestHandler
  requireTaskOwnership(): RequestHandler
  requireGroupMembership(): RequestHandler
}
```

**Rationale**: Eliminates confusion and duplication between three overlapping permission systems.

## Data Models

No changes to existing data models are required. This refactoring focuses on extracting and consolidating logic without modifying database schemas or model definitions.

The refactoring maintains compatibility with existing models:
- Task
- User
- ProjectGroup
- Position
- BountyTransaction
- Application
- Invitation

All model interfaces and relationships remain unchanged.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Validator Input Validation

*For any* validation method in the Validator class and any input value, valid inputs should be accepted without throwing errors, and invalid inputs should throw ValidationError with descriptive messages.

**Validates: Requirements 1.4**

### Property 2: Permission Service Correctness

*For any* user, resource, and permission type combination, the PermissionService should return the correct permission result based on ownership, role, and resource-specific rules.

**Validates: Requirements 2.4**

### Property 3: QueryBuilder SQL Correctness

*For any* set of query parameters (pagination, filters, associations), the QueryBuilder should produce valid SQL that executes without errors and returns the expected result set.

**Validates: Requirements 3.4**

### Property 4: Status Config Completeness

*For any* valid status value (task status, application status, invitation status), the status configuration should return a valid StatusConfig object with color, text, and optional icon properties.

**Validates: Requirements 4.5**

### Property 5: API Contract Stability

*For any* existing API endpoint, the response structure and status codes should remain unchanged after refactoring, ensuring backward compatibility.

**Validates: Requirements 7.1**

### Property 6: Test Coverage Maintenance

*For any* refactored module or service, the test coverage percentage should be equal to or greater than the coverage before refactoring.

**Validates: Requirements 8.3**

### Property 7: Consistent Error Response Format

*For any* error condition (validation failure, permission denial, ownership failure, backend error), the error response should follow a consistent format with status code, message, and optional details.

**Validates: Requirements 1.5, 2.5, 9.2, 10.5**

### Property 8: Error Handler Capabilities

*For any* error passed to the error handler, it should perform logging, user notification, and provide recovery options (retry, fallback, or graceful degradation).

**Validates: Requirements 9.5**

### Property 9: Ownership Validator Correctness

*For any* user and resource combination (task, group, position), the OwnershipValidator should correctly determine ownership based on database relationships.

**Validates: Requirements 10.2**

## Error Handling

### Validation Errors

All validation errors should use a consistent `ValidationError` class:

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**Error Response Format**:
```json
{
  "error": "ValidationError",
  "message": "Validation failed",
  "details": {
    "field": "email",
    "value": "invalid-email",
    "reason": "Invalid email format"
  }
}
```

### Permission Errors

All permission errors should use a consistent `PermissionError` class:

```typescript
class PermissionError extends Error {
  constructor(
    message: string,
    public userId: string,
    public resource?: string,
    public action?: string
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}
```

**Error Response Format**:
```json
{
  "error": "PermissionError",
  "message": "Permission denied",
  "details": {
    "userId": "user-123",
    "resource": "task-456",
    "action": "delete"
  }
}
```

### Ownership Errors

All ownership errors should use a consistent `OwnershipError` class:

```typescript
class OwnershipError extends Error {
  constructor(
    message: string,
    public userId: string,
    public resourceType: string,
    public resourceId: string
  ) {
    super(message);
    this.name = 'OwnershipError';
  }
}
```

**Error Response Format**:
```json
{
  "error": "OwnershipError",
  "message": "Resource ownership verification failed",
  "details": {
    "userId": "user-123",
    "resourceType": "task",
    "resourceId": "task-456"
  }
}
```

### Frontend Error Handling

The `useApiCall` hook should handle all error types consistently:

```typescript
function useApiCall<T>(apiFunction: (...args: any[]) => Promise<T>) {
  const handleError = (error: Error) => {
    // Log error
    console.error('API Error:', error);
    
    // Show user notification
    if (error instanceof ValidationError) {
      showNotification('Validation failed: ' + error.message, 'error');
    } else if (error instanceof PermissionError) {
      showNotification('Permission denied', 'error');
    } else if (error instanceof OwnershipError) {
      showNotification('Access denied', 'error');
    } else {
      showNotification('An error occurred', 'error');
    }
    
    // Provide recovery options
    return {
      retry: () => execute(...lastArgs),
      fallback: null
    };
  };
  
  // ... rest of implementation
}
```

## Testing Strategy

### Dual Testing Approach

This refactoring requires both unit tests and property-based tests to ensure correctness:

- **Unit tests**: Verify specific examples, edge cases, and error conditions for each utility
- **Property tests**: Verify universal properties across all inputs to catch edge cases

Both testing approaches are complementary and necessary for comprehensive coverage.

### Unit Testing Focus

Unit tests should focus on:

1. **Specific examples**: Demonstrate correct behavior with concrete inputs
2. **Edge cases**: Empty strings, null values, boundary conditions
3. **Error conditions**: Invalid inputs, permission denials, ownership failures
4. **Integration points**: Verify utilities work correctly with existing services

**Example unit tests**:
- Validator rejects empty required fields
- Status config returns correct color for 'completed' status
- OwnershipValidator throws error for non-existent resources
- useApiCall hook shows notification on error

### Property-Based Testing Configuration

Property tests should use **fast-check** (TypeScript/JavaScript property-based testing library) with the following configuration:

- **Minimum 100 iterations** per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: code-refactoring-optimization, Property {number}: {property_text}`

**Example property test structure**:
```typescript
import fc from 'fast-check';

describe('Validator', () => {
  // Feature: code-refactoring-optimization, Property 1: Validator Input Validation
  it('should accept valid inputs and reject invalid inputs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (validString) => {
          expect(() => Validator.required(validString, 'field')).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
    
    fc.assert(
      fc.property(
        fc.constantFrom('', null, undefined),
        (invalidValue) => {
          expect(() => Validator.required(invalidValue, 'field')).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Requirements

- All new utilities must have **>90% code coverage**
- Existing test coverage must be maintained or improved
- Each correctness property must be implemented by a property-based test
- Critical paths (validation, permissions, ownership) must have both unit and property tests

### Backward Compatibility Testing

A dedicated test suite should verify API contract stability:

```typescript
describe('API Backward Compatibility', () => {
  it('should maintain response structure for GET /api/tasks', async () => {
    const response = await request(app).get('/api/tasks');
    
    expect(response.body).toHaveProperty('tasks');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body.tasks[0]).toHaveProperty('id');
    expect(response.body.tasks[0]).toHaveProperty('title');
    // ... verify all expected fields
  });
  
  // Similar tests for all existing endpoints
});
```

This test suite should run before and after refactoring to ensure no breaking changes.

### Migration Testing Strategy

For each migrated component/service:

1. **Before migration**: Run existing tests and record coverage
2. **After migration**: Run tests again and verify:
   - All tests still pass
   - Coverage is maintained or improved
   - No new errors in logs
3. **Integration testing**: Verify migrated code works with non-migrated code
4. **Rollback plan**: Keep old code until all tests pass

## Implementation Phases

### Phase 1: Quick Wins (High Priority)

These utilities can be implemented and adopted immediately with minimal risk:

1. **statusConfig.ts**: Centralize status mappings
   - Impact: Eliminates 15+ duplicated methods
   - Risk: Low (pure utility, no side effects)
   - Migration: Update components one at a time

2. **Validator.ts enhancement**: Add missing validation methods
   - Impact: Provides consistent validation API
   - Risk: Low (additive changes only)
   - Migration: Services can adopt gradually

3. **OwnershipValidator.ts**: Extract ownership checking
   - Impact: Eliminates scattered ownership checks
   - Risk: Low (wraps existing logic)
   - Migration: Services can adopt gradually

4. **useApiCall.ts**: Standardize error handling
   - Impact: Eliminates 50+ try-catch blocks
   - Risk: Medium (changes error handling flow)
   - Migration: Update pages one at a time

5. **useTaskFilters.ts**: Extract filtering logic
   - Impact: Eliminates duplicated filtering code
   - Risk: Low (pure logic extraction)
   - Migration: Update pages one at a time

### Phase 2: Medium-term Refactoring

These require more careful migration and testing:

1. **PermissionService consolidation**: Merge three permission systems
   - Impact: Eliminates confusion and duplication
   - Risk: Medium (affects authorization flow)
   - Migration: Update middleware first, then services

2. **QueryBuilder enhancement**: Add common query patterns
   - Impact: Reduces repetitive SQL code
   - Risk: Low (additive changes)
   - Migration: Services can adopt gradually

3. **Reusable form/modal components**: Extract common UI patterns
   - Impact: Reduces frontend duplication
   - Risk: Medium (changes component structure)
   - Migration: Update components one at a time

### Phase 3: Long-term Improvements (Future)

These are architectural improvements for future consideration:

1. **StatusTransitionService**: Centralize status transitions
2. **StatsCalculator**: Centralize aggregation queries
3. **API client factory**: Standardize API clients

These are out of scope for the current refactoring but should be considered for future iterations.

## Migration Guidelines

### General Principles

1. **One component/service at a time**: Never migrate multiple components simultaneously
2. **Test after each migration**: Run full test suite after each change
3. **Keep old code temporarily**: Don't delete old code until migration is complete
4. **Document migration status**: Track which components have been migrated
5. **Rollback capability**: Be prepared to revert if issues arise

### Migration Checklist

For each component/service migration:

- [ ] Create new utility (if not already created)
- [ ] Write tests for new utility
- [ ] Update one component/service to use new utility
- [ ] Run existing tests - verify they pass
- [ ] Run new property tests - verify they pass
- [ ] Check test coverage - verify it's maintained
- [ ] Manual testing - verify functionality works
- [ ] Code review - verify code quality
- [ ] Deploy to staging - verify in realistic environment
- [ ] Monitor for errors - check logs for issues
- [ ] Document migration - update migration tracker
- [ ] Move to next component/service

### Rollback Procedure

If issues are discovered after migration:

1. **Immediate**: Revert the specific component/service to old code
2. **Investigate**: Determine root cause of the issue
3. **Fix**: Update utility or migration approach
4. **Re-test**: Verify fix works correctly
5. **Re-migrate**: Apply migration again with fix

## Success Metrics

### Code Quality Metrics

- **Duplication reduction**: Reduce code duplication by >60%
- **Test coverage**: Maintain or improve coverage (target >85%)
- **Lines of code**: Reduce total LOC by 15-20%
- **Cyclomatic complexity**: Reduce average complexity by 20%

### Development Velocity Metrics

- **Time to add validation**: Reduce from 30 min to 5 min
- **Time to add permission check**: Reduce from 20 min to 5 min
- **Time to add status display**: Reduce from 15 min to 2 min
- **Time to add error handling**: Reduce from 25 min to 5 min

### Maintainability Metrics

- **Single point of change**: 90% of changes require updates in only one file
- **Bug fix time**: Reduce average bug fix time by 30%
- **Onboarding time**: Reduce new developer onboarding time by 40%

These metrics should be measured before and after refactoring to quantify the improvement.
