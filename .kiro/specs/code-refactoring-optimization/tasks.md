# Implementation Plan: Code Refactoring and Optimization

## Overview

This implementation plan breaks down the code refactoring into incremental, testable steps. The approach follows three phases: Quick Wins (immediate value), Medium-term Refactoring (service consolidation), and gradual migration of existing code to use new utilities.

Each task is designed to be independently verifiable and maintains backward compatibility throughout the refactoring process.

## Tasks

- [x] 1. Create centralized status configuration utility
  - Create `packages/frontend/src/utils/statusConfig.ts` with mappings for all status types
  - Export functions: `getTaskStatusConfig()`, `getApplicationStatusConfig()`, `getInvitationStatusConfig()`
  - Include color, text, and optional icon for each status value
  - _Requirements: 4.5_

- [ ]* 1.1 Write property test for status config completeness
  - **Property 4: Status Config Completeness**
  - **Validates: Requirements 4.5**
  - Verify all valid status values return valid StatusConfig objects
  - Use fast-check to generate status values and verify mappings exist

- [ ]* 1.2 Write unit tests for status config
  - Test specific status values return correct colors and text
  - Test edge cases (undefined status, invalid status)
  - _Requirements: 4.5_

- [x] 2. Migrate frontend components to use status config
  - [x] 2.1 Update TaskListPage to use statusConfig
    - Replace getStatusColor() and getStatusText() with statusConfig functions
    - Verify task status display works correctly
    - _Requirements: 4.1, 4.2_
  
  - [x] 2.2 Update PublishedTasksPage to use statusConfig
    - Replace status mapping logic with statusConfig functions
    - Verify published task status display works correctly
    - _Requirements: 4.1, 4.2_
  
  - [x] 2.3 Update TaskInvitationsPage to use statusConfig
    - Replace invitation status mapping with statusConfig functions
    - Verify invitation status display works correctly
    - _Requirements: 4.1, 4.2_
  
  - [x] 2.4 Update TaskDetailDrawer to use statusConfig
    - Replace status display logic with statusConfig functions
    - Verify task detail status display works correctly
    - _Requirements: 4.1, 4.2_

- [x] 3. Checkpoint - Verify status config migration
  - Ensure all tests pass, manually verify status displays in UI, ask the user if questions arise.

- [x] 4. Enhance centralized Validator utility
  - Enhance existing `packages/backend/src/utils/Validator.ts`
  - Add methods: `required()`, `string()`, `number()`, `email()`, `uuid()`, `minLength()`, `maxLength()`, `min()`, `max()`, `enum()`, `date()`, `futureDate()`
  - All methods should throw ValidationError with descriptive messages
  - _Requirements: 1.4, 1.5_

- [ ]* 4.1 Write property test for validator input validation
  - **Property 1: Validator Input Validation**
  - **Validates: Requirements 1.4**
  - Verify valid inputs are accepted and invalid inputs throw ValidationError
  - Use fast-check to generate valid and invalid inputs for each validation method

- [ ]* 4.2 Write unit tests for validator
  - Test each validation method with specific examples
  - Test edge cases (empty strings, null, undefined, boundary values)
  - Test error messages are descriptive
  - _Requirements: 1.4, 1.5_

- [x] 5. Create OwnershipValidator utility
  - Create `packages/backend/src/utils/OwnershipValidator.ts`
  - Implement methods: `validateTaskOwnership()`, `validateGroupOwnership()`, `validatePositionOwnership()`, `validateResourceOwnership()`
  - All methods should throw OwnershipError when validation fails
  - _Requirements: 10.2, 10.5_

- [ ]* 5.1 Write property test for ownership validator correctness
  - **Property 9: Ownership Validator Correctness**
  - **Validates: Requirements 10.2**
  - Verify ownership checks return correct results for all resource types
  - Use test fixtures to generate users and resources with known ownership relationships

- [ ]* 5.2 Write unit tests for ownership validator
  - Test ownership validation for each resource type
  - Test error cases (non-existent resources, non-owners)
  - Test error messages are consistent
  - _Requirements: 10.2, 10.5_

- [x] 6. Migrate backend services to use Validator and OwnershipValidator
  - [x] 6.1 Update TaskService to use Validator
    - Replace inline validation with Validator methods
    - Verify all task operations still work correctly
    - _Requirements: 1.1, 1.4_
  
  - [x] 6.2 Update TaskService to use OwnershipValidator
    - Replace ownership checking code with OwnershipValidator
    - Verify ownership checks still work correctly
    - _Requirements: 10.1, 10.2_
  
  - [x] 6.3 Update UserService to use Validator
    - Replace inline validation with Validator methods
    - Verify all user operations still work correctly
    - _Requirements: 1.1, 1.4_
  
  - [x] 6.4 Update GroupService to use Validator
    - Replace inline validation with Validator methods
    - Verify all group operations still work correctly
    - _Requirements: 1.1, 1.4_
  
  - [x] 6.5 Update GroupService to use OwnershipValidator
    - Replace ownership checking code with OwnershipValidator
    - Verify ownership checks still work correctly
    - _Requirements: 10.1, 10.2_
  
  - [x] 6.6 Update PositionService to use Validator
    - Replace inline validation with Validator methods
    - Verify all position operations still work correctly
    - _Requirements: 1.1, 1.4_
  
  - [x] 6.7 Update PositionService to use OwnershipValidator
    - Replace ownership checking code with OwnershipValidator
    - Verify ownership checks still work correctly
    - _Requirements: 10.1, 10.2_

- [x] 7. Checkpoint - Verify backend utility migration
  - Ensure all tests pass, verify API endpoints work correctly, ask the user if questions arise.

- [x] 8. Enhance QueryBuilder utility
  - Enhance existing `packages/backend/src/utils/QueryBuilder.ts`
  - Add methods: `buildPaginationQuery()`, `buildUserAssociationQuery()`, `buildCountQuery()`, `buildSumQuery()`
  - Methods should produce valid SQL queries
  - _Requirements: 3.4_

- [ ]* 8.1 Write property test for QueryBuilder SQL correctness
  - **Property 3: QueryBuilder SQL Correctness**
  - **Validates: Requirements 3.4**
  - Verify generated queries execute without errors and return expected results
  - Use fast-check to generate query parameters and verify SQL validity

- [ ]* 8.2 Write unit tests for QueryBuilder
  - Test each query building method with specific examples
  - Test edge cases (empty filters, null values, boundary pagination)
  - _Requirements: 3.4_

- [x] 9. Migrate services to use enhanced QueryBuilder
  - [x] 9.1 Update TaskService to use QueryBuilder pagination
    - Replace inline pagination logic with QueryBuilder.buildPaginationQuery()
    - Verify task listing pagination works correctly
    - _Requirements: 3.1_
  
  - [x] 9.2 Update UserService to use QueryBuilder associations
    - Replace inline user association queries with QueryBuilder.buildUserAssociationQuery()
    - Verify user data loading works correctly
    - _Requirements: 3.2_
  
  - [x] 9.3 Update GroupService to use QueryBuilder aggregations
    - Replace inline count/sum queries with QueryBuilder methods
    - Verify group statistics work correctly
    - _Requirements: 3.3_

- [x] 10. Create useApiCall hook for standardized error handling
  - Create `packages/frontend/src/hooks/useApiCall.ts`
  - Implement hook with: `data`, `loading`, `error`, `execute()`, `reset()` return values
  - Include centralized error handling with logging and notifications
  - Support onSuccess and onError callbacks
  - _Requirements: 5.2, 9.1, 9.5_

- [ ]* 10.1 Write property test for error handler capabilities
  - **Property 8: Error Handler Capabilities**
  - **Validates: Requirements 9.5**
  - Verify error handler performs logging, notifications, and recovery for all error types
  - Use fast-check to generate different error types and verify handling

- [ ]* 10.2 Write unit tests for useApiCall hook
  - Test loading states, success handling, error handling
  - Test error notifications for different error types
  - Test retry functionality
  - _Requirements: 5.2, 9.1, 9.5_

- [x] 11. Migrate frontend pages to use useApiCall hook
  - [x] 11.1 Update TaskListPage to use useApiCall
    - Replace try-catch blocks with useApiCall hook
    - Verify error handling and loading states work correctly
    - _Requirements: 5.2, 9.1_
  
  - [x] 11.2 Update PublishedTasksPage to use useApiCall
    - Replace try-catch blocks with useApiCall hook
    - Verify error handling and loading states work correctly
    - _Requirements: 5.2, 9.1_
  
  - [x] 11.3 Update TaskInvitationsPage to use useApiCall
    - Replace try-catch blocks with useApiCall hook
    - Verify error handling and loading states work correctly
    - _Requirements: 5.2, 9.1_
  
  - [x] 11.4 Update GroupsPage to use useApiCall
    - Replace try-catch blocks with useApiCall hook
    - Verify error handling and loading states work correctly
    - _Requirements: 5.2, 9.1_

- [x] 12. Checkpoint - Verify useApiCall migration
  - Ensure all tests pass, manually test error scenarios in UI, ask the user if questions arise.

- [x] 13. Create useTaskFilters hook for filtering logic
  - Create `packages/frontend/src/hooks/useTaskFilters.ts`
  - Implement hook with: `filters`, `setSearch()`, `setStatus()`, `setGroupId()`, `setSortBy()`, `setSortOrder()`, `resetFilters()`, `filteredTasks` return values
  - Include filtering, searching, and sorting logic
  - _Requirements: 5.1_

- [ ]* 13.1 Write unit tests for useTaskFilters hook
  - Test filtering by search, status, group
  - Test sorting by different fields and orders
  - Test reset functionality
  - _Requirements: 5.1_

- [x] 14. Migrate pages to use useTaskFilters hook
  - [x] 14.1 Update TaskListPage to use useTaskFilters
    - Replace inline filtering logic with useTaskFilters hook
    - Verify filtering and sorting work correctly
    - _Requirements: 5.1_
  
  - [x] 14.2 Update PublishedTasksPage to use useTaskFilters
    - Replace inline filtering logic with useTaskFilters hook
    - Verify filtering and sorting work correctly
    - _Requirements: 5.1_
  
  - [x] 14.3 Update TaskInvitationsPage to use useTaskFilters
    - Replace inline filtering logic with useTaskFilters hook
    - Verify filtering and sorting work correctly
    - _Requirements: 5.1_

- [x] 15. Consolidate PermissionService
  - Merge logic from PermissionChecker, PermissionService, and permission.middleware into unified PermissionService
  - Implement methods: `checkTaskOwnership()`, `checkGroupOwnership()`, `checkPermission()`, `checkGroupPermission()`, `canAccessTask()`, `canModifyTask()`, `canDeleteTask()`
  - Implement middleware methods: `requirePermission()`, `requireTaskOwnership()`, `requireGroupMembership()`
  - _Requirements: 2.1, 2.4, 2.5_

- [ ]* 15.1 Write property test for permission service correctness
  - **Property 2: Permission Service Correctness**
  - **Validates: Requirements 2.4**
  - Verify permission checks return correct results for all permission types
  - Use test fixtures to generate users, resources, and permissions with known relationships

- [ ]* 15.2 Write unit tests for consolidated PermissionService
  - Test each permission check method with specific examples
  - Test ownership checks, role checks, resource-specific checks
  - Test middleware integration
  - Test error responses are consistent
  - _Requirements: 2.4, 2.5_

- [x] 16. Migrate routes and services to use consolidated PermissionService
  - [x] 16.1 Update permission.middleware to use consolidated PermissionService
    - Replace inline permission checks with PermissionService methods
    - Verify middleware still works correctly
    - _Requirements: 2.1_
  
  - [x] 16.2 Update task.routes to use consolidated PermissionService
    - Replace permission checks with PermissionService middleware
    - Verify route protection works correctly
    - _Requirements: 2.1_
  
  - [x] 16.3 Update TaskService to use consolidated PermissionService
    - Replace PermissionChecker calls with PermissionService methods
    - Verify permission checks still work correctly
    - _Requirements: 2.1_
  
  - [x] 16.4 Update GroupService to use consolidated PermissionService
    - Replace permission checking code with PermissionService methods
    - Verify permission checks still work correctly
    - _Requirements: 2.1_

- [x] 17. Create backward compatibility test suite
  - Create `packages/backend/src/routes/api.backward-compatibility.test.ts` (enhance existing if present)
  - Add tests for all existing API endpoints to verify response structure
  - Tests should verify: status codes, response fields, data types, error formats
  - _Requirements: 7.1, 7.2_

- [ ]* 17.1 Write property test for API contract stability
  - **Property 5: API Contract Stability**
  - **Validates: Requirements 7.1**
  - Verify all API endpoints maintain response structure after refactoring
  - Use fast-check to generate request parameters and verify response schemas

- [x] 18. Run backward compatibility tests
  - Execute backward compatibility test suite
  - Verify all tests pass
  - Document any issues found
  - _Requirements: 7.1, 7.2_

- [x] 19. Measure and verify test coverage
  - Run test coverage analysis before and after refactoring
  - Verify coverage is maintained or improved for all refactored modules
  - Document coverage metrics
  - _Requirements: 8.3, 8.5_

- [ ]* 19.1 Write property test for test coverage maintenance
  - **Property 6: Test Coverage Maintenance**
  - **Validates: Requirements 8.3**
  - Verify test coverage percentage is maintained or improved after refactoring
  - Compare coverage reports before and after each migration

- [x] 20. Create consistent error response format
  - Update error classes: ValidationError, PermissionError, OwnershipError
  - Ensure all errors include: name, message, details object
  - Update error middleware to format all errors consistently
  - _Requirements: 1.5, 2.5, 9.2, 10.5_

- [ ]* 20.1 Write property test for consistent error response format
  - **Property 7: Consistent Error Response Format**
  - **Validates: Requirements 1.5, 2.5, 9.2, 10.5**
  - Verify all error types return consistent response format
  - Use fast-check to generate different error conditions and verify response structure

- [ ]* 20.2 Write unit tests for error response formats
  - Test each error type returns correct format
  - Test error details are included
  - Test status codes are correct
  - _Requirements: 1.5, 2.5, 9.2, 10.5_

- [x] 21. Final checkpoint - Comprehensive testing
  - Run full test suite (unit tests + property tests)
  - Run backward compatibility tests
  - Verify test coverage meets requirements (>85%)
  - Manual testing of all refactored features
  - Check for any console errors or warnings
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Documentation and cleanup
  - Update README files with new utility usage examples
  - Document migration status for all components/services
  - Remove any commented-out old code
  - Update code comments to reflect new patterns
  - _Requirements: 8.1_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the refactoring
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- Migration is incremental - one component/service at a time
- Backward compatibility is maintained throughout the process
- Test coverage must be maintained or improved after each migration
