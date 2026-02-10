# Implementation Plan: Bounty History Viewer

## Overview

This implementation plan breaks down the bounty history viewer feature into discrete, incremental coding tasks. The approach follows a backend-first strategy, implementing the API layer before the frontend components, with testing integrated throughout.

## Tasks

- [x] 1. Set up backend service and routes structure
  - Create `packages/backend/src/services/BountyHistoryService.ts` following RankingService pattern
  - Create `packages/backend/src/routes/bountyHistory.routes.ts` following ranking.routes.ts pattern
  - Define TypeScript interfaces for query options and responses
  - Register routes in main Express app
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 2. Implement backend transaction history query
  - [x] 2.1 Implement getUserTransactionHistory method in BountyHistoryService
    - Write SQL query with LEFT JOIN to tasks table
    - Implement WHERE clause for user filtering (from_user_id OR to_user_id)
    - Implement ORDER BY created_at DESC
    - Implement pagination with OFFSET and LIMIT
    - Implement optional transaction type filtering
    - Use COUNT(*) OVER() window function for total count
    - Map database rows to BountyTransactionWithDetails
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Write property test for complete transaction inclusion
    - **Property 1: Complete transaction inclusion**
    - **Validates: Requirements 1.1**

  - [ ]* 2.3 Write property test for pagination correctness
    - **Property 2: Pagination correctness**
    - **Validates: Requirements 1.2**

  - [ ]* 2.4 Write property test for type filter accuracy
    - **Property 3: Type filter accuracy**
    - **Validates: Requirements 1.3**

  - [ ]* 2.5 Write property test for chronological ordering
    - **Property 4: Chronological ordering**
    - **Validates: Requirements 1.4**

- [ ] 3. Implement backend summary statistics calculation
  - [x] 3.1 Implement getUserBountySummary method in BountyHistoryService
    - Write SQL query to calculate total earned (SUM where to_user_id = userId)
    - Calculate total spent (SUM where from_user_id = userId)
    - Calculate net balance (earned - spent)
    - Count total transactions
    - Support optional transaction type filtering
    - _Requirements: 1.6_

  - [ ]* 3.2 Write property test for summary calculation accuracy
    - **Property 6: Summary calculation accuracy**
    - **Validates: Requirements 1.6**

  - [x]* 3.3 Write unit tests for task information completeness
    - Test transactions with valid task_id include task_name
    - Test transactions with null task_id handle gracefully
    - _Requirements: 1.5_

- [ ] 4. Implement backend route handler and error handling
  - [x] 4.1 Implement GET /api/bounty-history/:userId route handler
    - Parse and validate userId parameter
    - Parse and validate query parameters (page, limit, type)
    - Implement authorization check (self or super admin)
    - Call BountyHistoryService methods
    - Format and return response with transactions, pagination, and summary
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 4.2 Implement comprehensive error handling
    - Handle invalid user ID format (400)
    - Handle unauthorized access (403)
    - Handle invalid pagination parameters (400)
    - Handle invalid transaction type (400)
    - Handle user not found (404)
    - Handle database errors (500)
    - _Requirements: 1.7_

  - [ ]* 4.3 Write unit tests for error handling scenarios
    - Test invalid user ID format returns 400
    - Test unauthorized access returns 403
    - Test invalid pagination parameters return 400
    - Test database connection failures return 500
    - _Requirements: 1.7_

  - [ ]* 4.4 Write unit tests for authorization checks
    - Test user can access own history
    - Test super admin can access any history
    - Test regular user cannot access other user's history
    - _Requirements: 1.7_

- [x] 5. Checkpoint - Backend API complete
  - Ensure all backend tests pass
  - Manually test API endpoints using Postman or curl
  - Verify response format matches design specifications
  - Ask the user if questions arise

- [ ] 6. Create frontend API client
  - [x] 6.1 Create packages/frontend/src/api/bounty.ts
    - Implement getUserTransactionHistory function
    - Use existing API client patterns from packages/frontend/src/api/client.ts
    - Handle query parameter construction (page, limit, type)
    - Define TypeScript interfaces for request/response types
    - _Requirements: 7.5, 7.7_

  - [ ]* 6.2 Write unit tests for API client
    - Test correct URL construction with parameters
    - Test error handling for failed requests
    - Mock API responses using MSW
    - _Requirements: 7.5_

- [ ] 7. Implement BountyHistoryDrawer component structure
  - [x] 7.1 Create packages/frontend/src/components/BountyHistoryDrawer.tsx
    - Set up component with props interface (visible, userId, onClose)
    - Set up state management (transactions, loading, error, pagination, filter, summary)
    - Implement Ant Design Drawer component with responsive width
    - Add basic layout structure (header, summary section, table, pagination)
    - _Requirements: 2.1, 2.4, 7.6, 7.7_

  - [ ]* 7.2 Write unit test for component rendering
    - Test drawer renders with correct structure
    - Test drawer opens when visible prop is true
    - Test drawer closes when onClose is called
    - _Requirements: 2.1, 2.7_

- [ ] 8. Implement transaction table display
  - [x] 8.1 Implement transaction table with Ant Design Table component
    - Define columns: Date, Task Name, Amount, Type, Description
    - Format date column using date formatting utility
    - Implement amount column with sign based on user role (sender/receiver)
    - Implement type column with colored tags using TRANSACTION_TYPE_LABELS and TRANSACTION_TYPE_COLORS
    - Handle empty state with Ant Design Empty component
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 8.2 Write property test for amount sign correctness
    - **Property 7: Amount sign correctness**
    - **Validates: Requirements 2.2**

  - [ ]* 8.3 Write property test for transaction type label mapping
    - **Property 8: Transaction type label mapping**
    - **Validates: Requirements 2.3**

  - [x]* 8.4 Write unit test for empty state display
    - Test empty state shows when transactions array is empty
    - Test empty state message is user-friendly
    - _Requirements: 2.5_

- [ ] 9. Implement summary statistics display
  - [x] 9.1 Create summary card component at top of drawer
    - Display total earned with positive styling (green)
    - Display total spent with negative styling (red)
    - Display net balance with conditional styling (green if positive, red if negative)
    - Use Ant Design Statistic or Card components
    - _Requirements: 2.4_

  - [x]* 9.2 Write unit test for summary display
    - Test summary section renders with correct values
    - Test styling changes based on positive/negative values
    - _Requirements: 2.4_

- [ ] 10. Implement pagination controls
  - [x] 10.1 Add Ant Design Pagination component
    - Configure with current page, page size, and total count
    - Implement onChange handler to fetch new page
    - Show pagination only when totalCount > pageSize
    - Display current page and total pages
    - Disable prev button on first page, next button on last page
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [x]* 10.2 Write unit tests for pagination UI
    - Test pagination displays when needed
    - Test page change triggers API call with correct parameters
    - Test navigation buttons disabled appropriately
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

- [ ] 11. Implement transaction type filtering
  - [x] 11.1 Add Ant Design Select component for type filter
    - Create options for all transaction types plus "All"
    - Implement onChange handler to update filter and fetch data
    - Reset pagination to page 1 when filter changes
    - Persist filter selection when changing pages
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 11.2 Write property test for filter persistence
    - **Property 9: Filter persistence across pagination**
    - **Validates: Requirements 4.5, 5.5**

  - [ ]* 11.3 Write property test for filtered summary accuracy
    - **Property 10: Filtered summary accuracy**
    - **Validates: Requirements 5.4**

  - [x]* 11.4 Write unit tests for filtering UI
    - Test filter dropdown contains all options
    - Test selecting filter triggers API call with type parameter
    - Test filter change resets to page 1
    - Test "All" filter removes type parameter
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

- [ ] 12. Implement loading and error states
  - [x] 12.1 Add loading state handling
    - Display Ant Design Spin component or Skeleton during data fetch
    - Show loading indicator when changing pages
    - Disable interactions during loading
    - _Requirements: 4.4, 6.1_

  - [x] 12.2 Add error state handling
    - Display Ant Design Alert component for errors
    - Show specific error messages based on error type
    - Add "Retry" button that re-fetches data
    - Handle network timeout errors with appropriate message
    - _Requirements: 6.2, 6.3, 6.4_

  - [x]* 12.3 Write unit tests for loading and error states
    - Test loading spinner displays during fetch
    - Test error message displays on API failure
    - Test retry button triggers new API request
    - Test timeout error shows specific message
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 13. Implement component lifecycle and cleanup
  - [x] 13.1 Add useEffect cleanup functions
    - Cancel pending API requests on component unmount
    - Reset state when drawer closes
    - Clean up event listeners if any
    - _Requirements: 2.7_

  - [x]* 13.2 Write unit test for component cleanup
    - Test closing drawer resets state
    - Test unmounting cancels pending requests
    - _Requirements: 2.7_

- [ ] 14. Integrate clickable bounty in ProfilePage
  - [x] 14.1 Modify ProfilePage to make cumulative bounty clickable
    - Add onClick handler to bounty display element
    - Add hover effect CSS (cursor: pointer, color change)
    - Add state for drawer visibility
    - Render BountyHistoryDrawer component
    - Prevent duplicate drawer instances
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

  - [ ]* 14.2 Write property test for clickable bounty integration
    - **Property 11: Clickable bounty triggers history fetch**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x]* 14.3 Write unit tests for ProfilePage integration
    - Test clicking bounty opens drawer
    - Test clicking bounty triggers API call
    - Test prevents duplicate drawer instances
    - _Requirements: 3.1, 3.3, 3.5_

- [ ] 15. Integrate clickable bounty in DashboardPage
  - [x] 15.1 Modify DashboardPage to make cumulative bounty clickable
    - Add onClick handler to bounty display element
    - Add hover effect CSS (cursor: pointer, color change)
    - Add state for drawer visibility
    - Render BountyHistoryDrawer component
    - Prevent duplicate drawer instances
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x]* 15.2 Write unit tests for DashboardPage integration
    - Test clicking bounty opens drawer
    - Test clicking bounty triggers API call
    - Test prevents duplicate drawer instances
    - _Requirements: 3.2, 3.3, 3.5_

- [ ] 16. Final checkpoint - End-to-end testing
  - [x] 16.1 Manual testing of complete flow
    - Test ProfilePage: click bounty → drawer opens → data displays
    - Test DashboardPage: click bounty → drawer opens → data displays
    - Test pagination: navigate through pages
    - Test filtering: select different transaction types
    - Test error handling: simulate API failures
    - Test empty state: test with user who has no transactions
    - Test responsive design: verify on mobile and desktop viewports

  - [ ]* 16.2 Write integration tests
    - Test complete flow from click to data display
    - Test error recovery flow (failure → retry → success)
    - _Requirements: All_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Run all backend tests (unit and property tests)
  - Run all frontend tests (unit and property tests)
  - Verify test coverage meets requirements
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Backend implementation comes before frontend to ensure API is ready
- Checkpoints ensure incremental validation and allow for user feedback
