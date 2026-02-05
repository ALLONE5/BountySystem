# Implementation Plan: Backend Refactoring

## Overview

This implementation plan breaks down the backend refactoring into incremental steps, following a phased approach: infrastructure creation, proof-of-concept refactoring, full service refactoring, and testing. Each task builds on previous work to ensure continuous integration and validation.

## Tasks

- [x] 1. Set up testing infrastructure and base classes
  - Create test utilities and helpers for property-based testing
  - Set up fast-check library configuration
  - Create base test fixtures for models (User, Task, Group, Position)
  - _Requirements: 7.7_

- [x] 2. Implement BaseRepository class
  - [x] 2.1 Create BaseRepository with generic CRUD operations
    - Implement findById, findAll, create, update, delete methods
    - Integrate QueryBuilder for SQL construction
    - Integrate Validator for input validation
    - Handle database connection management
    - _Requirements: 1.1, 1.6, 1.7, 1.8, 9.1, 9.2, 9.3_
  
  - [x] 2.2 Write unit tests for BaseRepository
    - Test each CRUD operation with specific examples
    - Test error handling for invalid inputs
    - Test connection release on errors
    - _Requirements: 7.1, 9.5_

- [x] 3. Implement specific Repository classes
  - [x] 3.1 Create UserRepository with user-specific queries
    - Extend BaseRepository
    - Implement findByEmail, findByUsername, findWithStats, updateLastLogin
    - _Requirements: 1.2_
  
  - [x] 3.2 Create TaskRepository with task-specific queries
    - Extend BaseRepository
    - Implement findByCreator, findByGroup, findWithPositions, findPublicTasks, updateStatus
    - _Requirements: 1.3_
  
  - [x] 3.3 Create GroupRepository with group-specific queries
    - Extend BaseRepository
    - Implement findByOwner, findByMember, findWithMembers, addMember, removeMember
    - _Requirements: 1.4_
  
  - [x] 3.4 Create PositionRepository with position-specific queries
    - Extend BaseRepository
    - Implement findByTask, findByUser, findWithApplications, updateRanking
    - _Requirements: 1.5_
  
  - [x] 3.5 Write property test for repository query consistency
    - **Property 12: Connection Error Handling**
    - Test that repositories handle connection errors gracefully
    - **Validates: Requirements 9.7**

- [x] 4. Implement Mapper classes
  - [x] 4.1 Create TaskMapper for Task to DTO transformation
    - Implement toDTO and toDTOList methods
    - Handle nested object transformations (creator, group, positions)
    - Handle null/undefined values gracefully
    - _Requirements: 2.1, 2.4, 2.5, 2.6_
  
  - [x] 4.2 Create GroupMapper for ProjectGroup to DTO transformation
    - Implement toDTO and toDTOList methods
    - Handle nested object transformations (owner, members)
    - Handle null/undefined values gracefully
    - _Requirements: 2.2, 2.4, 2.5, 2.6_
  
  - [x] 4.3 Create PositionMapper for Position to DTO transformation
    - Implement toDTO and toDTOList methods
    - Handle nested object transformations (assignedUser)
    - Handle null/undefined values gracefully
    - _Requirements: 2.3, 2.4, 2.5, 2.6_
  
  - [x] 4.4 Write property test for mapper consistency
    - **Property 1: Mapper Consistency**
    - Test that all mappers correctly transform models to DTOs
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 5. Checkpoint - Ensure repository and mapper tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [x] 6. Implement Dependency Injection Container
  - [x] 6.1 Create DIContainer class with registration and resolution
    - Implement register method for service factories
    - Implement resolve method with singleton caching
    - Implement circular dependency detection
    - Implement dependency validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [x] 6.2 Write property test for DI Container singleton behavior
    - **Property 2: DI Container Singleton Behavior**
    - Test that resolving services multiple times returns same instance
    - **Validates: Requirements 3.2, 3.4**
  
  - [x] 6.3 Write property test for DI Container dependency resolution
    - **Property 3: DI Container Dependency Resolution**
    - Test that services with dependencies are resolved correctly
    - **Validates: Requirements 3.3**
  
  - [x] 6.4 Write unit tests for circular dependency detection
    - Test that circular dependencies throw descriptive errors
    - Test that missing dependencies are detected
    - _Requirements: 3.5, 3.6_

- [x] 7. Implement Permission Checker utility
  - [x] 7.1 Create PermissionChecker class with permission validation methods
    - Implement canAccessTask, canModifyTask methods
    - Implement canAccessGroup, canModifyGroup methods
    - Implement canAccessPosition methods
    - Inject UserRepository, TaskRepository, GroupRepository dependencies
    - Throw UnauthorizedError with descriptive messages on failure
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 7.2 Write property test for permission validation
    - **Property 4: Permission Validation**
    - Test that permissions are granted correctly for owners and admins
    - **Validates: Requirements 4.1, 4.2, 4.3**
  
  - [x] 7.3 Write property test for permission error handling
    - **Property 5: Permission Error Handling**
    - Test that unauthorized access throws UnauthorizedError with descriptive messages
    - **Validates: Requirements 4.4, 4.7**

- [x] 8. Implement Transaction Manager utility
  - [x] 8.1 Create TransactionManager class with transaction management
    - Implement executeInTransaction method with callback API
    - Implement commit on success logic
    - Implement rollback on failure logic
    - Implement connection release in finally block
    - Implement error propagation with stack trace preservation
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 5.7_
  
  - [x] 8.2 Write property test for transaction commit on success
    - **Property 6: Transaction Commit on Success**
    - Test that successful operations are committed
    - **Validates: Requirements 5.2**
  
  - [x] 8.3 Write property test for transaction rollback on failure
    - **Property 7: Transaction Rollback on Failure**
    - Test that failed operations are rolled back
    - **Validates: Requirements 5.3**
  
  - [x] 8.4 Write property test for transaction connection release
    - **Property 8: Transaction Connection Release**
    - Test that connections are released after transactions
    - **Validates: Requirements 5.6, 9.3, 9.5**
  
  - [x] 8.5 Write property test for transaction error propagation
    - **Property 9: Transaction Error Propagation**
    - Test that errors are propagated with stack traces
    - **Validates: Requirements 5.7, 8.8**

- [x] 9. Checkpoint - Ensure utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Configure DI Container with all services and repositories
  - Register all repository instances (UserRepository, TaskRepository, GroupRepository, PositionRepository)
  - Register PermissionChecker with repository dependencies
  - Register TransactionManager with database pool
  - Create container initialization function
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 11. Refactor UserService (proof of concept)
  - [x] 11.1 Update UserService to use UserRepository
    - Replace direct database queries with repository calls
    - Update getUserById, getUserWithStats, updateUser methods
    - Inject UserRepository and PermissionChecker via constructor
    - _Requirements: 6.1, 6.4, 6.5, 6.8_
  
  - [x] 11.2 Update UserService to use UserMapper
    - Replace manual DTO mapping with UserMapper.toDTO
    - Ensure all service methods return DTOs
    - _Requirements: 6.4_
  
  - [x] 11.3 Write integration tests for refactored UserService
    - Test service methods with real repositories
    - Test permission checks integration
    - Test error handling
    - _Requirements: 7.6_

- [x] 12. Refactor TaskService
  - [x] 12.1 Update TaskService to use TaskRepository and PositionRepository
    - Replace direct database queries with repository calls
    - Update getTaskById, createTask, updateTask, deleteTask methods
    - Inject TaskRepository, PositionRepository, PermissionChecker, TransactionManager
    - _Requirements: 6.2, 6.5, 6.6, 6.8_
  
  - [x] 12.2 Update TaskService to use TaskMapper
    - Replace manual DTO mapping with TaskMapper.toDTO
    - Ensure all service methods return DTOs
    - _Requirements: 6.4_
  
  - [x] 12.3 Update TaskService to use TransactionManager for multi-step operations
    - Wrap createTask (task + positions) in transaction
    - Ensure rollback on failure
    - _Requirements: 6.6_
  
  - [x] 12.4 Write integration tests for refactored TaskService
    - Test service methods with real repositories
    - Test transaction commit and rollback
    - Test permission checks integration
    - _Requirements: 7.6_

- [x] 13. Refactor GroupService
  - [x] 13.1 Update GroupService to use GroupRepository
    - Replace direct database queries with repository calls
    - Update getGroupById, createGroup, updateGroup, deleteGroup, addMember, removeMember methods
    - Inject GroupRepository and PermissionChecker
    - _Requirements: 6.3, 6.5, 6.8_
  
  - [x] 13.2 Update GroupService to use GroupMapper
    - Replace manual DTO mapping with GroupMapper.toDTO
    - Ensure all service methods return DTOs
    - _Requirements: 6.4_
  
  - [x] 13.3 Write integration tests for refactored GroupService
    - Test service methods with real repositories
    - Test permission checks integration
    - _Requirements: 7.6_

- [x] 14. Refactor PositionService
  - [x] 14.1 Update PositionService to use PositionRepository
    - Replace direct database queries with repository calls
    - Update getPositionById, updatePosition, updateRanking methods
    - Inject PositionRepository and PermissionChecker
    - _Requirements: 6.5, 6.8_
  
  - [x] 14.2 Update PositionService to use PositionMapper
    - Replace manual DTO mapping with PositionMapper.toDTO
    - Ensure all service methods return DTOs
    - _Requirements: 6.4_
  
  - [x] 14.3 Write integration tests for refactored PositionService
    - Test service methods with real repositories
    - Test permission checks integration
    - _Requirements: 7.6_

- [x] 15. Checkpoint - Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Verify API backward compatibility
  - [x] 16.1 Create backward compatibility test suite
    - Test all existing API endpoints
    - Compare response structures before and after refactoring
    - Verify status codes remain unchanged
    - _Requirements: 6.7_
  
  - [x] 16.2 Write property test for API backward compatibility
    - **Property 10: API Backward Compatibility**
    - Test that API responses match pre-refactoring format
    - **Validates: Requirements 6.7**

- [x] 17. Implement comprehensive error handling tests
  - [x] 17.1 Write property test for error type consistency
    - **Property 11: Error Type Consistency**
    - Test that appropriate error types are thrown for different conditions
    - **Validates: Requirements 8.4, 8.5, 8.6**
  
  - [x] 17.2 Write unit tests for edge cases
    - Test null/undefined handling in mappers
    - Test empty collections in repositories
    - Test connection errors in repositories
    - _Requirements: 2.6, 9.7_

- [x] 18. Update architecture documentation
  - Document Repository pattern implementation
  - Document DI Container usage patterns
  - Document Transaction Manager best practices
  - Document Permission Checker usage
  - Create migration guide with before/after examples
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 19. Final checkpoint - Run full test suite
  - Run all unit tests and property tests
  - Verify test coverage meets targets (80%+ for services, 90%+ for infrastructure)
  - Ensure all API endpoints work correctly
  - Verify no connection leaks or performance regressions
  - _Requirements: 7.8_

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify components work together correctly
- The refactoring maintains backward compatibility throughout
