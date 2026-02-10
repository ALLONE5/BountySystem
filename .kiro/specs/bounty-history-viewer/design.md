# Design Document: Bounty History Viewer

## Overview

The bounty history viewer feature enables users to view their complete bounty transaction history through an interactive UI component. When users click on their cumulative bounty amount displayed in ProfilePage or DashboardPage, a modal or drawer opens showing a paginated, filterable table of all their bounty transactions.

The implementation follows the existing architectural patterns established in the codebase:
- Backend: Express.js service layer pattern (similar to RankingService)
- Frontend: React with Ant Design components
- Data: Existing BountyTransaction model (no schema changes required)

Key design decisions:
- **Drawer over Modal**: Use Ant Design Drawer for better mobile experience and more screen space
- **Server-side pagination**: Handle pagination on backend to efficiently manage large transaction histories
- **Inclusive transaction query**: Show transactions where user is either sender OR receiver for complete transparency
- **Summary statistics**: Calculate totals on backend for accuracy and performance

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ProfilePage / DashboardPage                                 │
│    └─> Clickable Cumulative Bounty Display                  │
│         └─> Opens BountyHistoryDrawer                        │
│                                                              │
│  BountyHistoryDrawer Component                               │
│    ├─> Transaction Table (Ant Design Table)                 │
│    ├─> Type Filter (Ant Design Select)                      │
│    ├─> Pagination Controls (Ant Design Pagination)          │
│    └─> Summary Statistics Display                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
├─────────────────────────────────────────────────────────────┤
│  bountyHistory.routes.ts                                     │
│    └─> GET /api/bounty-history/:userId                      │
│         └─> BountyHistoryService                            │
│              ├─> Query BountyTransaction table              │
│              ├─> Join with Tasks table for task names       │
│              ├─> Apply pagination and filtering             │
│              └─> Calculate summary statistics               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database Layer                         │
├─────────────────────────────────────────────────────────────┤
│  bounty_transactions table                                   │
│  tasks table (for task names)                                │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. User clicks cumulative bounty amount in ProfilePage/DashboardPage
2. Frontend opens BountyHistoryDrawer and calls API: `GET /api/bounty-history/:userId?page=1&limit=20`
3. Backend BountyHistoryService:
   - Queries bounty_transactions where user is sender OR receiver
   - Joins with tasks table to get task names
   - Applies transaction type filter if provided
   - Applies pagination (offset/limit)
   - Calculates summary statistics (total earned, total spent)
4. Backend returns paginated response with transactions and metadata
5. Frontend renders table with transactions, pagination controls, and summary

## Components and Interfaces

### Backend Components

#### BountyHistoryService

Service class following the pattern established by RankingService. Handles all business logic for fetching and processing bounty transaction history.

**Methods:**

```typescript
class BountyHistoryService {
  constructor(private pool: Pool)
  
  // Get paginated transaction history for a user
  async getUserTransactionHistory(
    userId: string,
    options: TransactionHistoryQueryOptions
  ): Promise<TransactionHistoryResponse>
  
  // Get summary statistics for a user
  async getUserBountySummary(
    userId: string,
    transactionType?: TransactionType
  ): Promise<BountySummary>
  
  // Helper: Map database row to BountyTransactionWithDetails
  private mapRowToTransactionWithDetails(row: any): BountyTransactionWithDetails
}
```

**Query Strategy:**
- Use LEFT JOIN with tasks table to get task names
- Filter by `(from_user_id = userId OR to_user_id = userId)`
- Order by `created_at DESC` for newest-first display
- Apply OFFSET and LIMIT for pagination
- Use COUNT(*) OVER() window function for total count (efficient pagination)

#### Route Handler (bountyHistory.routes.ts)

Following the pattern of ranking.routes.ts:

```typescript
// GET /api/bounty-history/:userId
// Query params: page, limit, type (optional filter)
router.get('/:userId', authenticate, asyncHandler(async (req, res) => {
  // Validate user can access this data (self or admin)
  // Parse and validate query parameters
  // Call BountyHistoryService
  // Return formatted response
}))
```

**Authorization:**
- Users can only view their own transaction history
- Super admins can view any user's history
- Return 403 Forbidden if unauthorized

### Frontend Components

#### BountyHistoryDrawer Component

Main UI component for displaying transaction history.

**Props:**
```typescript
interface BountyHistoryDrawerProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
}
```

**State:**
```typescript
interface BountyHistoryDrawerState {
  transactions: BountyTransactionWithDetails[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  selectedType: TransactionType | 'all';
  summary: BountySummary | null;
}
```

**Features:**
- Ant Design Drawer component (placement="right", width responsive)
- Table with columns: Date, Task Name, Amount, Type, Description
- Select dropdown for transaction type filtering
- Pagination component at bottom
- Summary card at top showing total earned/spent
- Loading skeleton while fetching data
- Error alert with retry button
- Empty state when no transactions

#### Clickable Bounty Display

Modify existing cumulative bounty displays in ProfilePage and DashboardPage:

```typescript
// Before: <span>{cumulativeBounty}</span>
// After:
<span 
  onClick={() => setHistoryDrawerVisible(true)}
  style={{ cursor: 'pointer', color: '#1890ff' }}
  className="bounty-clickable"
>
  {cumulativeBounty}
</span>
```

Add hover effect via CSS:
```css
.bounty-clickable:hover {
  text-decoration: underline;
  opacity: 0.8;
}
```

### API Client

Add new API method following existing patterns:

```typescript
// In packages/frontend/src/api/bounty.ts (new file)
export const bountyApi = {
  getUserTransactionHistory: async (
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: TransactionType
  ): Promise<TransactionHistoryResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (type && type !== 'all') {
      params.append('type', type);
    }
    
    const response = await client.get(
      `/bounty-history/${userId}?${params.toString()}`
    );
    return response.data;
  }
};
```

## Data Models

### Request/Response Types

#### TransactionHistoryQueryOptions
```typescript
interface TransactionHistoryQueryOptions {
  page: number;           // Current page (1-indexed)
  limit: number;          // Items per page (default: 20)
  type?: TransactionType; // Optional filter by transaction type
}
```

#### TransactionHistoryResponse
```typescript
interface TransactionHistoryResponse {
  transactions: BountyTransactionWithDetails[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  summary: BountySummary;
}
```

#### BountySummary
```typescript
interface BountySummary {
  totalEarned: number;   // Sum of all incoming transactions
  totalSpent: number;    // Sum of all outgoing transactions
  netBalance: number;    // totalEarned - totalSpent
  transactionCount: number;
}
```

### Database Query Structure

**Main Query (with pagination):**
```sql
SELECT 
  bt.id,
  bt.task_id,
  bt.from_user_id,
  bt.to_user_id,
  bt.amount,
  bt.type,
  bt.description,
  bt.created_at,
  t.title as task_name,
  COUNT(*) OVER() as total_count
FROM bounty_transactions bt
LEFT JOIN tasks t ON bt.task_id = t.id
WHERE (bt.from_user_id = $1 OR bt.to_user_id = $1)
  AND ($2::text IS NULL OR bt.type = $2)
ORDER BY bt.created_at DESC
LIMIT $3 OFFSET $4
```

**Summary Query:**
```sql
SELECT 
  COALESCE(SUM(CASE WHEN to_user_id = $1 THEN amount ELSE 0 END), 0) as total_earned,
  COALESCE(SUM(CASE WHEN from_user_id = $1 THEN amount ELSE 0 END), 0) as total_spent,
  COUNT(*) as transaction_count
FROM bounty_transactions
WHERE (from_user_id = $1 OR to_user_id = $1)
  AND ($2::text IS NULL OR type = $2)
```

### Transaction Type Display Mapping

```typescript
const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  task_completion: 'Task Completion',
  extra_reward: 'Extra Reward',
  assistant_share: 'Assistant Share',
  refund: 'Refund'
};

const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  task_completion: 'green',
  extra_reward: 'blue',
  assistant_share: 'purple',
  refund: 'orange'
};
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Backend API Properties

**Property 1: Complete transaction inclusion**
*For any* user and their transaction history query, all returned transactions must have that user as either the sender (from_user_id) or receiver (to_user_id), and no transactions involving that user should be missing from the complete result set.
**Validates: Requirements 1.1**

**Property 2: Pagination correctness**
*For any* set of transactions and pagination parameters (page, limit), the returned transactions must be the correct subset based on offset calculation (offset = (page - 1) * limit), and the total count must accurately reflect the complete result set size.
**Validates: Requirements 1.2**

**Property 3: Type filter accuracy**
*For any* transaction type filter applied, all returned transactions must match the specified type, and no transactions of that type should be excluded from the result set.
**Validates: Requirements 1.3**

**Property 4: Chronological ordering**
*For any* transaction history query, the returned transactions must be ordered by created_at in descending order (newest first), meaning for all adjacent pairs (t1, t2) in the result, t1.created_at >= t2.created_at.
**Validates: Requirements 1.4**

**Property 5: Task information completeness**
*For any* transaction with a non-null task_id, the response must include the corresponding task_name field populated with the task's title from the tasks table.
**Validates: Requirements 1.5**

**Property 6: Summary calculation accuracy**
*For any* set of user transactions (optionally filtered), the summary statistics must satisfy: total_earned equals the sum of all amounts where user is receiver, total_spent equals the sum of all amounts where user is sender, and net_balance equals total_earned minus total_spent.
**Validates: Requirements 1.6**

### Frontend Display Properties

**Property 7: Amount sign correctness**
*For any* transaction displayed in the history viewer, if the current user is the receiver (to_user_id), the amount must be displayed as positive, and if the current user is the sender (from_user_id), the amount must be displayed as negative or with a negative indicator.
**Validates: Requirements 2.2**

**Property 8: Transaction type label mapping**
*For any* transaction type displayed, the label must match the predefined mapping (task_completion → "Task Completion", extra_reward → "Extra Reward", assistant_share → "Assistant Share", refund → "Refund"), and the visual indicator (color/tag) must match the predefined color scheme.
**Validates: Requirements 2.3**

**Property 9: Filter persistence across pagination**
*For any* selected transaction type filter, when the user navigates to a different page, the filter selection must remain unchanged and continue to be applied to the new page's data.
**Validates: Requirements 4.5, 5.5**

**Property 10: Filtered summary accuracy**
*For any* applied transaction type filter, the displayed summary statistics (total earned, total spent) must only include transactions matching the current filter, not all transactions.
**Validates: Requirements 5.4**

### Integration Properties

**Property 11: Clickable bounty triggers history fetch**
*For any* page displaying cumulative bounty (ProfilePage or DashboardPage), clicking the bounty amount must trigger an API request to fetch the user's transaction history and open the history viewer component.
**Validates: Requirements 3.1, 3.2, 3.3**

## Error Handling

### Backend Error Scenarios

1. **Invalid User ID**
   - Validation: Check if userId is a valid UUID format
   - Response: 400 Bad Request with error message "Invalid user ID format"

2. **Unauthorized Access**
   - Validation: Verify requesting user is either the target user or a super admin
   - Response: 403 Forbidden with error message "You do not have permission to view this user's transaction history"

3. **Invalid Pagination Parameters**
   - Validation: page >= 1, limit >= 1 and limit <= 100
   - Response: 400 Bad Request with error message "Invalid pagination parameters"

4. **Invalid Transaction Type Filter**
   - Validation: type must be one of the valid TransactionType enum values
   - Response: 400 Bad Request with error message "Invalid transaction type"

5. **Database Connection Errors**
   - Handling: Catch database errors, log details, return generic error
   - Response: 500 Internal Server Error with error message "Failed to fetch transaction history"

6. **User Not Found**
   - Validation: Check if user exists in database
   - Response: 404 Not Found with error message "User not found"

### Frontend Error Scenarios

1. **API Request Failure**
   - Display: Error Alert component with message and "Retry" button
   - Action: Allow user to retry the request
   - Logging: Log error details to console for debugging

2. **Network Timeout**
   - Display: Specific timeout error message "Request timed out. Please check your connection and try again."
   - Action: Provide retry button
   - Timeout: Set reasonable timeout (e.g., 30 seconds)

3. **Empty Transaction History**
   - Display: Empty state component with friendly message "No transactions yet"
   - Icon: Use Ant Design Empty component
   - Note: This is not an error, but a valid state

4. **Malformed API Response**
   - Handling: Validate response structure before rendering
   - Display: Generic error message "Unable to display transaction history"
   - Logging: Log response structure for debugging

5. **Component Mount/Unmount Errors**
   - Handling: Use cleanup functions in useEffect hooks
   - Action: Cancel pending API requests on unmount
   - Prevention: Check component mounted state before setting state

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and UI interactions
- **Property tests**: Verify universal properties across all inputs using randomized test data

### Backend Testing

**Property-Based Tests** (minimum 100 iterations each):

1. **Complete transaction inclusion property** (Property 1)
   - Generate: Random users and transaction sets
   - Test: Query for each user and verify all their transactions are included
   - Library: Use fast-check (TypeScript property testing library)

2. **Pagination correctness property** (Property 2)
   - Generate: Random transaction sets and pagination parameters
   - Test: Verify correct subset returned for each page
   - Edge cases: First page, last page, page beyond total

3. **Type filter accuracy property** (Property 3)
   - Generate: Mixed transaction types and filter selections
   - Test: Verify only matching types returned

4. **Chronological ordering property** (Property 4)
   - Generate: Transactions with random timestamps
   - Test: Verify descending order maintained

5. **Summary calculation accuracy property** (Property 6)
   - Generate: Random transaction sets
   - Test: Independently calculate totals and verify match

**Unit Tests**:

1. Error handling scenarios (Requirements 1.7)
   - Test invalid user ID format
   - Test unauthorized access attempts
   - Test invalid pagination parameters
   - Test database connection failures

2. Task information join (Property 5)
   - Test transactions with valid task_id include task_name
   - Test transactions with null task_id handle gracefully

3. Authorization checks
   - Test user can access own history
   - Test super admin can access any history
   - Test regular user cannot access other user's history

### Frontend Testing

**Property-Based Tests** (minimum 100 iterations each):

1. **Amount sign correctness property** (Property 7)
   - Generate: Random transactions with varying sender/receiver
   - Test: Verify correct sign display for current user

2. **Transaction type label mapping property** (Property 8)
   - Generate: All transaction types
   - Test: Verify correct label and color for each

3. **Filter persistence property** (Property 9)
   - Generate: Random filter selections and page changes
   - Test: Verify filter persists across pagination

4. **Filtered summary accuracy property** (Property 10)
   - Generate: Transaction sets with filters
   - Test: Verify summary only includes filtered transactions

**Unit Tests**:

1. Component rendering (Requirements 2.1, 2.4)
   - Test drawer renders with correct columns
   - Test summary section displays
   - Test empty state displays when no transactions

2. User interactions (Requirements 3.1, 3.2, 3.3, 3.5)
   - Test clicking bounty opens drawer
   - Test clicking bounty triggers API call
   - Test prevents duplicate drawer instances

3. Pagination UI (Requirements 4.1, 4.3, 4.4, 4.6)
   - Test pagination controls display when needed
   - Test page number and total pages display
   - Test loading indicator during page change
   - Test navigation buttons disabled appropriately

4. Filtering UI (Requirements 5.1, 5.2, 5.3, 5.6)
   - Test filter dropdown contains all options
   - Test selecting filter triggers API call
   - Test filter change resets to page 1
   - Test "All" filter shows all types

5. Error handling UI (Requirements 6.1, 6.2, 6.3)
   - Test loading spinner displays during fetch
   - Test error message displays on failure
   - Test retry button triggers new request

6. Component lifecycle (Requirements 2.7)
   - Test closing drawer resets state
   - Test cleanup cancels pending requests

### Integration Testing

1. **End-to-end flow**
   - Test complete flow: click bounty → API call → data display → pagination → filtering
   - Test error recovery flow: API failure → error display → retry → success

2. **Cross-component integration**
   - Test ProfilePage bounty click integration
   - Test DashboardPage bounty click integration

### Test Configuration

**Property-Based Testing Library**: fast-check for TypeScript
- Configuration: Minimum 100 iterations per property test
- Seed: Use deterministic seed for reproducibility
- Shrinking: Enable automatic shrinking to find minimal failing cases

**Test Tagging**: Each property test must include a comment tag:
```typescript
// Feature: bounty-history-viewer, Property 1: Complete transaction inclusion
test('property: all user transactions are included in history', async () => {
  // Property test implementation
});
```

**Unit Test Framework**: Jest with React Testing Library
- Mock API calls using MSW (Mock Service Worker)
- Mock Ant Design components where needed for performance
- Use data-testid attributes for reliable element selection
