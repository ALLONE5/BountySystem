# Bounty Distribution System

## Overview

The Bounty Distribution System manages the allocation and distribution of task bounties to main assignees and assistant users, as well as extra rewards from administrators.

## Components

### 1. Task Assistant Management

**Model**: `TaskAssistant`
- Tracks assistant users on tasks
- Supports two allocation types:
  - **Percentage**: Assistant receives a percentage of remaining bounty
  - **Fixed**: Assistant receives a fixed amount

**Service**: `BountyDistributionService`

**Key Features**:
- Add assistants with allocation validation
- Prevent main assignee from being added as assistant
- Validate fixed allocations don't exceed task bounty
- Validate percentage allocations don't exceed 100%
- Remove assistants from tasks

**Requirements Implemented**: 11.4, 11.5, 11.6, 11.7, 11.8

### 2. Bounty Distribution Logic

**Distribution Calculation**:
1. Calculate fixed allocations first
2. Calculate percentage allocations from remaining bounty after fixed
3. Main assignee receives remaining amount

**Formula**:
```
Total Bounty = Task Bounty Amount
Fixed Total = Sum of all fixed allocations
Remaining After Fixed = Total Bounty - Fixed Total
Percentage Amount = Remaining After Fixed × (Percentage / 100)
Main Assignee Amount = Total Bounty - Fixed Total - Sum(Percentage Amounts)
```

**Transaction Recording**:
- Creates `bounty_transactions` records for each recipient
- Transaction types:
  - `main_bounty`: Main assignee's share
  - `assistant_bounty`: Assistant user's share
  - `extra_bounty`: Additional reward from admin
- Marks task bounty as settled to prevent re-distribution

**Requirements Implemented**: 11.9

### 3. Task Review and Extra Rewards

**Model**: `TaskReview`
- Stores task reviews with ratings and comments
- Tracks extra bounty awarded by admins

**Service**: `TaskReviewService`

**Key Features**:
- Create reviews for completed tasks
- Only task publisher or admins can review
- Optional rating (1-5) and comment
- Optional extra bounty (deducted from admin budget)
- Prevent duplicate reviews

**Requirements Implemented**: 18.1, 18.2, 18.3, 18.4, 18.5

### 4. Admin Budget Management

**Model**: `AdminBudget`
- Tracks monthly budget for each admin
- Automatically calculates remaining budget
- Prevents over-spending

**Key Features**:
- Create/update monthly budgets
- Track used budget
- Validate sufficient budget before extra bounty
- Generate monthly expenditure reports
- Initialize budgets for all admins

**Database Trigger**:
- Automatically deducts extra bounty from admin budget when review is created
- Prevents review creation if budget insufficient

**Requirements Implemented**: 21.1, 21.2, 21.3, 21.4, 21.5

## Database Schema

### bounty_transactions
```sql
CREATE TABLE bounty_transactions (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10, 2),
  transaction_type transaction_type, -- 'main_bounty', 'assistant_bounty', 'extra_bounty'
  created_at TIMESTAMP
);
```

### task_assistants
```sql
CREATE TABLE task_assistants (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  user_id UUID REFERENCES users(id),
  allocation_type allocation_type, -- 'percentage', 'fixed'
  allocation_value DECIMAL(10, 2),
  added_at TIMESTAMP,
  UNIQUE(task_id, user_id)
);
```

### task_reviews
```sql
CREATE TABLE task_reviews (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  reviewer_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  extra_bounty DECIMAL(10, 2),
  created_at TIMESTAMP,
  UNIQUE(task_id, reviewer_id)
);
```

### admin_budgets
```sql
CREATE TABLE admin_budgets (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  year INTEGER,
  month INTEGER,
  total_budget DECIMAL(10, 2),
  used_budget DECIMAL(10, 2),
  remaining_budget DECIMAL(10, 2) GENERATED,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(admin_id, year, month)
);
```

## API Endpoints

### Assistant Management
- `POST /api/bounty/tasks/:taskId/assistants` - Add assistant
- `GET /api/bounty/tasks/:taskId/assistants` - Get task assistants
- `DELETE /api/bounty/tasks/:taskId/assistants/:userId` - Remove assistant

### Bounty Distribution
- `GET /api/bounty/tasks/:taskId/distribution` - Calculate distribution preview
- `POST /api/bounty/tasks/:taskId/distribute` - Execute distribution
- `GET /api/bounty/tasks/:taskId/transactions` - Get task transactions
- `GET /api/bounty/transactions` - Get user's transactions

### Task Reviews
- `POST /api/bounty/tasks/:taskId/reviews` - Create review
- `GET /api/bounty/tasks/:taskId/reviews` - Get task reviews

### Admin Budget
- `GET /api/bounty/admin/budget` - Get current month budget
- `GET /api/bounty/admin/budgets` - Get all budgets
- `GET /api/bounty/admin/budget/report` - Get monthly report
- `POST /api/bounty/admin/budget` - Create/update budget

## Usage Examples

### Adding an Assistant with Percentage Allocation
```typescript
const assistant = await bountyService.addAssistant({
  taskId: 'task-123',
  userId: 'user-456',
  allocationType: AllocationType.PERCENTAGE,
  allocationValue: 20, // 20% of remaining bounty
});
```

### Adding an Assistant with Fixed Allocation
```typescript
const assistant = await bountyService.addAssistant({
  taskId: 'task-123',
  userId: 'user-789',
  allocationType: AllocationType.FIXED,
  allocationValue: 50, // Fixed $50
});
```

### Distributing Bounty
```typescript
const distribution = await bountyService.distributeBounty('task-123');
// Returns:
// {
//   taskId: 'task-123',
//   totalBounty: 200,
//   mainAssignee: { userId: 'user-1', amount: 130 },
//   assistants: [
//     { userId: 'user-2', amount: 50, allocationType: 'fixed', allocationValue: 50 },
//     { userId: 'user-3', amount: 20, allocationType: 'percentage', allocationValue: 20 }
//   ],
//   extraBounty: 0,
//   transactionIds: ['tx-1', 'tx-2', 'tx-3']
// }
```

### Creating a Review with Extra Bounty
```typescript
const review = await reviewService.createReview({
  taskId: 'task-123',
  reviewerId: 'admin-1',
  rating: 5,
  comment: 'Excellent work!',
  extraBounty: 100, // Additional $100 from admin budget
});
```

## Validation Rules

### Assistant Allocation
1. Allocation value must be positive
2. Percentage cannot exceed 100%
3. Fixed amount cannot exceed task bounty
4. Total fixed allocations cannot exceed task bounty
5. Main assignee cannot be added as assistant
6. User cannot be added as assistant twice

### Bounty Distribution
1. Task must be assigned
2. Task bounty must not be already settled
3. All allocations must be valid

### Task Review
1. Task must be completed
2. Rating must be 1-5 if provided
3. Extra bounty must be non-negative
4. Reviewer must be task publisher or admin
5. User cannot review same task twice
6. Admin must have sufficient budget for extra bounty

### Admin Budget
1. Month must be 1-12
2. Year must be >= 2000
3. Total budget must be non-negative
4. Used budget cannot exceed total budget
5. Only admins can have budgets

## Testing

Comprehensive test suites are provided:
- `BountyDistributionService.test.ts` - Tests assistant management and distribution
- `TaskReviewService.test.ts` - Tests reviews and admin budgets

Tests cover:
- Happy path scenarios
- Validation error cases
- Edge cases (empty lists, boundary values)
- Transaction integrity
- Budget management

## Migration

Run the bounty transactions migration:
```bash
node packages/database/scripts/run_bounty_transactions_migration.js
```

Or manually execute:
```bash
psql -U postgres -d bounty_hunter -f packages/database/migrations/20241211_000001_create_bounty_transactions.sql
```

## Notes

- Bounty distribution is atomic - all transactions succeed or all fail
- Once distributed, bounty cannot be re-distributed (task marked as settled)
- Admin budget is automatically deducted via database trigger
- Percentage allocations are calculated from remaining bounty after fixed allocations
- Extra bounty is recorded as separate transaction type
