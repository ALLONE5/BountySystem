# Implementation Plan: Browse Tasks Visibility Fix

## Overview

This implementation plan converts the design into discrete coding tasks that build incrementally. The focus is on modifying the TaskService query logic, updating the API endpoint, and enhancing the frontend UI with filter controls and visual distinction for completed tasks.

## Tasks

- [x] 1. Update TaskService.getAvailableTasks method with status-based filtering
  - Modify the method signature to accept `GetAvailableTasksOptions` interface
  - Replace the current query with status-based WHERE clause
  - Add support for `includeCompleted` parameter to conditionally include completed tasks
  - Remove the `is_executable = true` constraint from the query
  - Maintain `assignee_id IS NULL` for available tasks only
  - Add ORDER BY created_at DESC for consistent ordering
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4_

- [ ]* 1.1 Write property test for available task filtering
  - **Property 1: Available Task Filtering**
  - **Validates: Requirements 1.1, 1.2, 1.3, 3.1, 3.3**

- [ ]* 1.2 Write property test for completed task inclusion flag
  - **Property 2: Completed Task Inclusion Flag**
  - **Validates: Requirements 2.1, 2.2, 4.2, 4.3**

- [ ]* 1.3 Write property test for in-progress task exclusion
  - **Property 3: In-Progress Task Exclusion**
  - **Validates: Requirements 4.4**

- [ ]* 1.4 Write property test for completed tasks with assignees
  - **Property 4: Completed Tasks with Assignees**
  - **Validates: Requirements 3.4, 3.5**

- [ ]* 1.5 Write property test for query determinism
  - **Property 5: Query Determinism**
  - **Validates: Requirements 6.3**

- [ ]* 1.6 Write property test for NULL assignee handling
  - **Property 6: NULL Assignee Handling**
  - **Validates: Requirements 6.4**

- [ ]* 1.7 Write unit tests for TaskService edge cases
  - Test empty database returns empty array
  - Test invalid parameters throw appropriate errors
  - Test pagination with limit and offset
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2. Update task routes to support includeCompleted query parameter
  - Modify GET /api/tasks/available endpoint to extract `includeCompleted` query parameter
  - Parse and validate the `includeCompleted` parameter (default to false if omitted)
  - Extract and validate `limit` and `offset` parameters
  - Pass parameters to TaskService.getAvailableTasks
  - Add error handling for invalid parameters (400 Bad Request)
  - _Requirements: 5.1, 5.2, 5.3, 4.5_

- [ ]* 2.1 Write unit tests for task routes
  - Test endpoint with includeCompleted=true
  - Test endpoint with includeCompleted=false
  - Test endpoint without includeCompleted parameter (default behavior)
  - Test invalid query parameters return 400 error
  - _Requirements: 5.1, 5.3_

- [x] 3. Checkpoint - Ensure backend tests pass
  - Run all TaskService tests and verify they pass
  - Run all task route tests and verify they pass
  - Manually test the API endpoint with curl or Postman
  - Ask the user if questions arise

- [x] 4. Update frontend task API client
  - Modify `getAvailableTasks` function in `packages/frontend/src/api/task.ts`
  - Add `GetAvailableTasksOptions` interface with optional `includeCompleted`, `limit`, `offset` fields
  - Build URLSearchParams with query parameters
  - Update the API call to include query string
  - _Requirements: 5.1, 5.4_

- [ ]* 4.1 Write unit tests for task API client
  - Test API call with includeCompleted=true builds correct URL
  - Test API call with includeCompleted=false builds correct URL
  - Test API call without parameters uses defaults
  - _Requirements: 5.1_

- [x] 5. Update BrowseTasksPage component with filter toggle
  - Add state for `showCompleted` toggle (default: false)
  - Add state for `tasks` array
  - Implement `loadTasks` function that calls `getAvailableTasks` with `includeCompleted` parameter
  - Add useEffect hook that triggers `loadTasks` when `showCompleted` changes
  - Add FormControlLabel with Switch component for "Show Completed Tasks" toggle
  - Wire toggle onChange to update `showCompleted` state
  - _Requirements: 2.4, 5.4, 5.5_

- [ ]* 5.1 Write property test for UI filter interaction
  - **Property 9: UI Filter Interaction**
  - **Validates: Requirements 5.4, 5.5**

- [ ]* 5.2 Write unit tests for BrowseTasksPage filter toggle
  - Test toggle changes trigger API call with correct parameter
  - Test tasks state updates when API returns new data
  - Test loading state displays during API call
  - _Requirements: 5.4, 5.5_

- [x] 6. Add visual distinction for completed tasks in BrowseTasksPage
  - Update task card rendering to check task status
  - Add Chip component with "Completed" label for completed tasks
  - Style the chip with success color and CheckCircleIcon
  - Ensure completed tasks are visually distinct from available tasks
  - _Requirements: 2.3, 2.5_

- [ ]* 6.1 Write property test for UI visual distinction
  - **Property 8: UI Visual Distinction**
  - **Validates: Requirements 2.3, 2.5**

- [ ]* 6.2 Write unit tests for completed task visual indicators
  - Test completed tasks render with Chip component
  - Test available tasks do not render with Chip component
  - Test Chip has correct label and icon
  - _Requirements: 2.3, 2.5_

- [ ]* 6.3 Write property test for UI rendering completeness
  - **Property 7: UI Rendering Completeness**
  - **Validates: Requirements 1.4, 1.5**

- [x] 7. Add error handling to BrowseTasksPage
  - Add error state to component
  - Wrap API call in try-catch block
  - Display error message to user if API call fails
  - Add retry button for failed requests
  - Implement exponential backoff for retries (3 attempts)
  - _Requirements: Error Handling section_

- [ ]* 7.1 Write unit tests for error handling
  - Test error message displays when API fails
  - Test retry button triggers new API call
  - Test exponential backoff delays between retries
  - _Requirements: Error Handling section_

- [x] 8. Final checkpoint - Integration testing
  - Run all backend tests and verify they pass
  - Run all frontend tests and verify they pass
  - Manually test the browse tasks page in the browser
  - Verify toggle shows/hides completed tasks
  - Verify completed tasks have visual distinction
  - Verify parent tasks (is_executable=false) are visible when available
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The implementation maintains backward compatibility with existing API consumers
