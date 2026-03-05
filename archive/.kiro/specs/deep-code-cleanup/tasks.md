# Implementation Plan: Deep Code Cleanup

## Overview

This plan breaks down the deep code cleanup into discrete, manageable tasks. Each task focuses on a specific cleanup operation and includes verification steps. The cleanup is performed in phases to minimize risk and allow for incremental validation.

## Tasks

- [x] 1. Remove deprecated helper functions from statusConfig.ts
  - Remove getTaskStatusColor, getTaskStatusText, getInvitationStatusColor, and getInvitationStatusText functions
  - Verify no references exist in non-test files by searching the codebase
  - Remove any unused type definitions related to these functions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.1 Write property test for deprecated function removal
  - **Property 2: No references to removed deprecated functions**
  - **Validates: Requirements 1.5**

- [x] 2. Replace console.log statements in QueueWorker.ts
  - Import logger from the logging utility
  - Replace all console.log with logger.info
  - Replace all console.error with logger.error
  - Replace all console.warn with logger.warn
  - Ensure contextual information is preserved in structured format
  - _Requirements: 2.1, 2.5, 2.6_

- [x] 3. Replace console.log statements in QueueService.ts
  - Import logger from the logging utility
  - Replace all console statements with appropriate logger calls
  - Use appropriate log levels based on message severity
  - Add context objects for structured logging
  - _Requirements: 2.2, 2.5, 2.6_

- [x] 4. Replace console.log statements in WebSocketService.ts
  - Import logger from the logging utility
  - Replace all console statements with appropriate logger calls
  - Ensure connection/disconnection events are properly logged
  - Add context for debugging (connection IDs, user IDs, etc.)
  - _Requirements: 2.3, 2.5, 2.6_

- [x] 5. Replace console.log statements in startWorkers.ts
  - Import logger from the logging utility
  - Replace all console statements with appropriate logger calls
  - Ensure worker startup/shutdown events are properly logged
  - _Requirements: 2.4, 2.5, 2.6_

- [ ]* 5.1 Write property test for console.log elimination
  - **Property 3: Specific backend files have no console.log statements**
  - **Property 4: All backend service files use structured logging**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.7**

- [x] 6. Checkpoint - Verify logging changes
  - Run backend tests to ensure no regressions
  - Verify TypeScript compilation succeeds
  - Ask the user if questions arise

- [x] 7. Resolve TODO/FIXME comments in ProfilePage.tsx
  - Identify all TODO/FIXME comments in the file
  - For each comment, determine if it can be implemented immediately
  - Implement simple fixes
  - Convert complex TODOs to issue references with detailed context
  - Remove obsolete comments
  - _Requirements: 3.1, 3.5, 3.6, 3.7_

- [x] 8. Resolve TODO/FIXME comments in SettingsPage.tsx
  - Identify all TODO/FIXME comments in the file
  - Implement or document each comment following the same process as ProfilePage
  - Ensure remaining comments follow format: `// TODO: [Issue #N] Description` or include detailed context
  - _Requirements: 3.2, 3.5, 3.6, 3.7_

- [x] 9. Resolve TODO/FIXME comments in QueueWorker.ts
  - Identify all TODO/FIXME comments in the file
  - Implement or document each comment
  - Ensure remaining comments are properly formatted
  - _Requirements: 3.3, 3.5, 3.6, 3.7_

- [x] 10. Scan and resolve TODO/FIXME comments across remaining codebase
  - Search for all TODO/FIXME comments in packages/frontend/src and packages/backend/src
  - For each comment, implement, document with issue reference, or remove if obsolete
  - Ensure all remaining comments follow the required format
  - _Requirements: 3.4, 3.5, 3.6, 3.7_

- [ ]* 10.1 Write property test for TODO/FIXME format compliance
  - **Property 5: Remaining TODO/FIXME comments are properly formatted**
  - **Validates: Requirements 3.6**

- [x] 11. Identify and remove unused exports in frontend utilities
  - Use TypeScript compiler API or IDE tools to find unused exports
  - Search codebase for references to each export
  - Remove exports with zero references (excluding public API methods)
  - Focus on packages/frontend/src/utils directory
  - _Requirements: 4.1, 4.3, 4.5_

- [x] 12. Identify and remove unused exports in backend utilities
  - Use TypeScript compiler API or IDE tools to find unused exports
  - Search codebase for references to each export
  - Remove exports with zero references (excluding public API methods)
  - Focus on packages/backend/src/utils directory
  - _Requirements: 4.1, 4.3, 4.5_

- [x] 13. Remove unused private methods in services
  - Analyze service classes for private methods that are never called
  - Verify methods are not lifecycle methods or interface implementations
  - Remove unused private methods
  - Focus on packages/backend/src/services
  - _Requirements: 4.2, 4.3_

- [x] 14. Checkpoint - Verify unused code removal
  - Run full test suite to ensure no regressions
  - Verify TypeScript compilation succeeds
  - Ask the user if questions arise

- [x] 15. Consolidate duplicate validation logic
  - Identify duplicate email validation patterns across services
  - Identify duplicate task validation patterns
  - Identify duplicate permission validation patterns
  - Add consolidated validation methods to existing Validator.ts utility
  - _Requirements: 5.1, 5.2, 8.1, 8.2, 8.3, 8.4_

- [x] 16. Replace inline validation with Validator utility calls
  - Update all services using duplicate validation to call Validator methods
  - Remove inline validation code after migration
  - Ensure all validation rules are preserved
  - _Requirements: 5.5, 8.5, 8.6_

- [ ]* 16.1 Write unit tests for consolidated validators
  - Test each new Validator method with valid and invalid inputs
  - Test edge cases for validation rules
  - _Requirements: 5.6, 8.6_

- [x] 17. Identify and remove commented-out code in frontend
  - Search for commented-out code blocks in packages/frontend/src
  - Remove commented code with no explanation
  - Remove commented code marked as "temporary" or "old"
  - Preserve commented code serving as documentation examples
  - Exclude test files from this cleanup
  - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6_

- [x] 18. Identify and remove commented-out code in backend
  - Search for commented-out code blocks in packages/backend/src
  - Apply same removal rules as frontend
  - Preserve documentation comments
  - Exclude test files from this cleanup
  - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 19. Clean up unused imports in frontend files
  - Use TypeScript language service or ESLint to identify unused imports
  - Remove unused import statements
  - Convert type-only imports to use `import type` syntax
  - Organize imports in consistent order (external, internal, relative)
  - Focus on packages/frontend/src
  - _Requirements: 7.1, 7.3, 7.4, 7.5_

- [x] 20. Clean up unused imports in backend files
  - Use TypeScript language service or ESLint to identify unused imports
  - Remove unused import statements
  - Convert type-only imports to use `import type` syntax
  - Organize imports in consistent order
  - Focus on packages/backend/src
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ]* 20.1 Write property tests for import cleanup
  - **Property 6: No unused imports in source files**
  - **Property 7: Type-only imports are properly marked**
  - **Validates: Requirements 7.3, 7.4**

- [x] 21. Checkpoint - Verify all cleanup operations
  - Run full test suite (unit and integration tests)
  - Verify TypeScript compilation succeeds with no errors
  - Verify ESLint checks pass or improve
  - Run property-based tests to verify cleanup properties
  - Ask the user if questions arise

- [x] 22. Generate cleanup metrics report
  - Count deprecated functions removed
  - Count console.log statements replaced
  - Count TODO/FIXME comments resolved
  - Count unused code blocks removed
  - Count duplicate patterns consolidated
  - Calculate total lines of code removed
  - Create summary report document
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster completion
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user feedback
- Property tests validate universal correctness properties across the codebase
- Unit tests validate specific cleanup operations and edge cases
- The cleanup is aggressive and does not consider backward compatibility
- All changes should be committed incrementally to allow for easy rollback if needed
