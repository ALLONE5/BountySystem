# Design Document: Deep Code Cleanup

## Overview

This design outlines a systematic approach to cleaning up the codebase by removing deprecated code, replacing console logging with structured logging, resolving technical debt comments, eliminating unused code, consolidating duplicates, and cleaning up imports. The cleanup will be performed across both frontend and backend packages, excluding test files.

The cleanup is aggressive and does not consider backward compatibility, allowing us to remove old patterns without migration paths.

## Architecture

### Cleanup Strategy

The cleanup follows a phased approach to minimize risk:

1. **Analysis Phase**: Scan codebase to identify cleanup targets
2. **Validation Phase**: Verify that removals won't break functionality
3. **Execution Phase**: Perform cleanup operations
4. **Verification Phase**: Run tests and verify no regressions

### Scope Boundaries

**Included:**
- `packages/frontend/src/**/*.ts`
- `packages/frontend/src/**/*.tsx`
- `packages/backend/src/**/*.ts`

**Excluded:**
- `**/*.test.ts`
- `**/*.test.tsx`
- `packages/database/**`
- `node_modules/**`

### Tool Support

The cleanup will leverage:
- **Static Analysis**: TypeScript compiler API for finding unused exports
- **AST Parsing**: For identifying code patterns and duplicates
- **Grep/Search**: For finding console.log, TODO/FIXME comments
- **IDE Refactoring**: For safe renames and removals

## Components and Interfaces

### 1. Deprecated Function Removal

**Target File**: `packages/frontend/src/utils/statusConfig.ts`

**Functions to Remove:**
```typescript
// These functions are deprecated and replaced by StatusTag component
- getTaskStatusColor(status: string): string
- getTaskStatusText(status: string): string
- getInvitationStatusColor(status: string): string
- getInvitationStatusText(status: string): string
```

**Verification Strategy:**
1. Search entire codebase for references to these function names
2. Verify all references are in test files or already migrated to StatusTag
3. Remove function definitions
4. Remove any related type definitions if unused

### 2. Console Logging Replacement

**Target Files:**
- `packages/backend/src/services/QueueWorker.ts`
- `packages/backend/src/services/QueueService.ts`
- `packages/backend/src/services/WebSocketService.ts`
- `packages/backend/src/workers/startWorkers.ts`

**Logger Interface:**
```typescript
interface Logger {
  info(message: string, context?: object): void;
  warn(message: string, context?: object): void;
  error(message: string, error?: Error, context?: object): void;
  debug(message: string, context?: object): void;
}
```

**Replacement Patterns:**
```typescript
// Before
console.log('Processing task', taskId);
console.error('Failed to process', error);

// After
logger.info('Processing task', { taskId });
logger.error('Failed to process', error, { taskId });
```

**Log Level Mapping:**
- `console.log()` → `logger.info()`
- `console.error()` → `logger.error()`
- `console.warn()` → `logger.warn()`
- `console.debug()` → `logger.debug()`

### 3. Technical Debt Resolution

**Target Files:**
- `packages/frontend/src/pages/ProfilePage.tsx`
- `packages/frontend/src/pages/SettingsPage.tsx`
- `packages/backend/src/services/QueueWorker.ts`

**Resolution Strategy:**

For each TODO/FIXME:
1. **Assess Complexity**: Can it be fixed now or needs future work?
2. **Implement or Document**:
   - Simple fixes: Implement immediately
   - Complex work: Create issue and reference it
   - Obsolete: Remove entirely
3. **Format for Future Work**:
   ```typescript
   // TODO: [Issue #123] Implement caching for user profiles
   // Context: Current implementation queries DB on every request
   ```

### 4. Unused Code Detection

**Detection Strategy:**

**For Exported Functions/Classes:**
1. Use TypeScript compiler API to find all exports
2. Search codebase for import statements referencing each export
3. Mark exports with zero references as unused
4. Verify not part of public API contracts

**For Private Methods:**
1. Parse class definitions
2. Build call graph within each class
3. Identify methods never called
4. Remove if not overriding interface methods

**Exclusions:**
- Lifecycle methods (componentDidMount, etc.)
- Event handlers referenced in JSX
- Methods called via reflection
- Public API methods (even if unused internally)

### 5. Code Duplication Consolidation

**Target Patterns:**

**Validation Logic:**
```typescript
// Pattern: Duplicate email validation
// Found in: UserService.ts, AuthService.ts, ProfileService.ts
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) { ... }

// Consolidate to: Validator.ts
export class Validator {
  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

**Error Handling:**
```typescript
// Pattern: Duplicate error response formatting
// Found in: Multiple route handlers
catch (error) {
  res.status(500).json({ 
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

// Consolidate to: Error middleware or utility
```

**Data Transformation:**
```typescript
// Pattern: Duplicate DTO mapping
// Found in: Multiple services
const taskDTO = {
  id: task.id,
  title: task.title,
  status: task.status,
  // ... repeated fields
};

// Consolidate to: TaskMapper.ts (already exists, extend it)
```

### 6. Commented Code Removal

**Detection Pattern:**
```typescript
// Match multi-line commented code blocks
/\/\*[\s\S]*?\*\/|\/\/.+/g
```

**Removal Rules:**
1. **Remove**: Commented code with no explanation
2. **Remove**: Commented code marked as "temporary" or "old implementation"
3. **Keep**: Commented code serving as examples in documentation
4. **Keep**: Commented code with "DO NOT REMOVE" or similar warnings

**Example:**
```typescript
// REMOVE THIS:
// function oldImplementation() {
//   return legacyLogic();
// }

// KEEP THIS:
// Example usage:
// const result = myFunction({ param: 'value' });
```

### 7. Import Cleanup

**Cleanup Operations:**

1. **Remove Unused Imports:**
   ```typescript
   // Before
   import { usedFunc, unusedFunc } from './utils';
   
   // After
   import { usedFunc } from './utils';
   ```

2. **Convert to Type-Only Imports:**
   ```typescript
   // Before
   import { User } from './types';
   const user: User = ...;
   
   // After
   import type { User } from './types';
   const user: User = ...;
   ```

3. **Organize Import Order:**
   ```typescript
   // 1. External dependencies
   import React from 'react';
   import { useQuery } from '@tanstack/react-query';
   
   // 2. Internal absolute imports
   import { api } from '@/api';
   
   // 3. Relative imports
   import { helper } from './utils';
   import type { Props } from './types';
   ```

### 8. Validation Consolidation

**Current State Analysis:**

Validation logic is scattered across:
- Route handlers (input validation)
- Service methods (business logic validation)
- Model methods (data integrity validation)

**Target State:**

Centralized validation in existing `Validator.ts` utility:

```typescript
export class Validator {
  // Existing methods...
  
  // Add consolidated validations
  static isValidTaskTitle(title: string): boolean {
    return title.length >= 3 && title.length <= 200;
  }
  
  static isValidBountyAmount(amount: number): boolean {
    return amount >= 0 && Number.isInteger(amount);
  }
  
  static isValidTaskStatus(status: string): boolean {
    return ['open', 'in_progress', 'completed', 'cancelled'].includes(status);
  }
}
```

**Migration Strategy:**
1. Identify all validation patterns
2. Add methods to Validator class
3. Replace inline validation with Validator calls
4. Remove duplicate validation code

## Data Models

No new data models are introduced. This cleanup operates on existing code structures.

**Affected Models:**
- All models remain unchanged
- Only the code that uses models is cleaned up

## Correctness Properties


A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Deprecated functions are removed from statusConfig.ts

*For any* of the deprecated functions (getTaskStatusColor, getTaskStatusText, getInvitationStatusColor, getInvitationStatusText), the function definition should not exist in statusConfig.ts

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: No references to removed deprecated functions

*For any* deprecated function that has been removed, there should be zero references to that function name in the codebase (excluding test files and this documentation)

**Validates: Requirements 1.5**

### Property 3: Specific backend files have no console.log statements

*For any* of the target backend files (QueueWorker.ts, QueueService.ts, WebSocketService.ts, startWorkers.ts), the file should contain zero console.log, console.error, console.warn, or console.debug statements

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 4: All backend service files use structured logging

*For any* TypeScript file in packages/backend/src/services/, the file should contain zero console.log, console.error, console.warn, or console.debug statements

**Validates: Requirements 2.7**

### Property 5: Remaining TODO/FIXME comments are properly formatted

*For any* TODO or FIXME comment remaining in the codebase after cleanup, the comment should either reference a tracked issue (e.g., "[Issue #123]") or contain detailed context explaining why it remains

**Validates: Requirements 3.6**

### Property 6: No unused imports in source files

*For any* TypeScript/TSX file in packages/frontend/src or packages/backend/src (excluding test files), all imported symbols should be referenced in the file

**Validates: Requirements 7.3**

### Property 7: Type-only imports are properly marked

*For any* import statement where all imported symbols are only used in type positions, the import should use the `import type` syntax

**Validates: Requirements 7.4**

## Error Handling

### Cleanup Failures

**File Access Errors:**
- If a file cannot be read or written, log the error and skip that file
- Continue with remaining cleanup operations
- Report all skipped files at the end

**Parse Errors:**
- If a file cannot be parsed (invalid syntax), skip that file
- Log the file path and error
- Do not attempt to modify files with parse errors

**Reference Detection Errors:**
- If reference detection fails for a symbol, err on the side of caution
- Do not remove the symbol if references cannot be verified
- Log the symbol and reason for skipping

### Validation Failures

**Test Failures After Cleanup:**
- If tests fail after cleanup, the cleanup should be considered incomplete
- Revert the specific change that caused the failure
- Document the failure for manual investigation

**Build Errors:**
- If TypeScript compilation fails after cleanup, revert the changes
- Identify the specific cleanup operation that caused the error
- Document for manual resolution

### Rollback Strategy

Each cleanup operation should be atomic and reversible:
1. Create a git commit before each major cleanup phase
2. If errors occur, revert to the previous commit
3. Document what was attempted and why it failed

## Testing Strategy

This cleanup work requires a dual testing approach:

### Unit Tests

Unit tests will verify specific cleanup operations:

1. **Deprecated Function Removal Tests:**
   - Test that statusConfig.ts does not export the deprecated functions
   - Test that StatusTag component is used in place of deprecated functions
   - Test specific files that previously used deprecated functions

2. **Console Logging Replacement Tests:**
   - Test that specific backend service files contain no console statements
   - Test that logger is properly imported and used
   - Test that log messages contain appropriate context

3. **TODO/FIXME Resolution Tests:**
   - Test that remaining TODO/FIXME comments follow the required format
   - Test that specific files have resolved their technical debt comments

4. **Import Cleanup Tests:**
   - Test that specific files have no unused imports
   - Test that type-only imports use correct syntax
   - Test that import order follows the defined pattern

### Property-Based Tests

Property-based tests will verify universal properties across the codebase. Each test should run a minimum of 100 iterations.

1. **Property Test: No References to Removed Functions**
   - Generate list of all removed function names
   - For each function name, search entire codebase
   - Verify zero matches (excluding documentation and tests)
   - **Tag: Feature: deep-code-cleanup, Property 2: No references to removed deprecated functions**

2. **Property Test: Backend Services Use Structured Logging**
   - Generate list of all files in packages/backend/src/services/
   - For each file, parse and search for console.* calls
   - Verify zero console statements found
   - **Tag: Feature: deep-code-cleanup, Property 4: All backend service files use structured logging**

3. **Property Test: TODO/FIXME Format Compliance**
   - Generate list of all TODO/FIXME comments in source files
   - For each comment, verify it contains issue reference OR detailed context
   - Verify format matches: `// TODO: [Issue #N]` or `// TODO: <detailed explanation>`
   - **Tag: Feature: deep-code-cleanup, Property 5: Remaining TODO/FIXME comments are properly formatted**

4. **Property Test: No Unused Imports**
   - Generate list of all TypeScript files in src directories (excluding tests)
   - For each file, parse imports and code
   - For each imported symbol, verify it's referenced in the file
   - **Tag: Feature: deep-code-cleanup, Property 6: No unused imports in source files**

5. **Property Test: Type-Only Imports**
   - Generate list of all import statements in TypeScript files
   - For each import, analyze usage of imported symbols
   - If all usages are in type positions, verify `import type` syntax is used
   - **Tag: Feature: deep-code-cleanup, Property 7: Type-only imports are properly marked**

### Integration Testing

After cleanup, run the full test suite:
1. All existing unit tests must pass
2. All existing integration tests must pass
3. TypeScript compilation must succeed with no errors
4. ESLint checks must pass (or improve)

### Manual Verification

Some aspects require manual verification:
1. Application still runs and functions correctly
2. Log messages are readable and contain appropriate context
3. Consolidated validation logic maintains original behavior
4. No critical functionality was accidentally removed

### Test Configuration

**Property-Based Testing Library:**
- **Frontend**: Use `fast-check` for TypeScript property-based testing
- **Backend**: Use `fast-check` for TypeScript property-based testing

**Configuration:**
```typescript
import fc from 'fast-check';

// Minimum 100 iterations per property test
fc.assert(
  fc.property(/* generators */, (/* params */) => {
    // property assertion
  }),
  { numRuns: 100 }
);
```

**Test Organization:**
- Create `cleanup-verification.test.ts` in both frontend and backend
- Group related properties in describe blocks
- Tag each test with feature name and property number in comments

### Success Criteria

Cleanup is considered successful when:
1. All property-based tests pass (100 iterations each)
2. All existing unit tests pass
3. TypeScript compilation succeeds
4. No console.log statements in backend services
5. No unused imports in source files
6. All TODO/FIXME comments are properly formatted or resolved
7. Application runs without errors
