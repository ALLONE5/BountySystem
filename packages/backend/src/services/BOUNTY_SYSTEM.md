# Bounty Calculation System

## Overview

The bounty calculation system automatically calculates and manages task bounties based on configurable algorithms. It supports algorithm versioning, automatic recalculation, and ensures settled bounties remain immutable.

## Components

### BountyAlgorithm Model

Defines the structure of a bounty calculation algorithm:

```typescript
interface BountyAlgorithm {
  id: string;
  version: string;
  baseAmount: number;
  urgencyWeight: number;
  importanceWeight: number;
  durationWeight: number;
  formula: string;
  effectiveFrom: Date;
  createdBy: string;
  createdAt: Date;
}
```

### BountyService

Core service for bounty calculation and management.

#### Key Methods

**calculateBounty(input: BountyCalculationInput)**
- Calculates bounty based on current algorithm
- Formula: `baseAmount + (urgency * urgencyWeight) + (importance * importanceWeight) + (duration * durationWeight)`
- Urgency is calculated from deadline proximity (1-5 scale)
- Returns bounty amount and algorithm version

**getCurrentAlgorithm()**
- Returns the most recent active algorithm
- Based on `effective_from` date

**createAlgorithm(algorithmData: BountyAlgorithmCreateDTO)**
- Creates a new bounty algorithm version
- Validates weights and base amount are non-negative
- Prevents duplicate versions

**recalculateBounty(task: Task)**
- Recalculates bounty for unsettled tasks
- Throws error if task bounty is already settled
- Uses current algorithm

**settleBounty(taskId: string)**
- Marks task bounty as settled
- Prevents future recalculation

## Integration with TaskService

### Automatic Bounty Calculation

When a task is created, the bounty is automatically calculated:

```typescript
const bountyCalculation = await this.bountyService.calculateBounty({
  estimatedHours,
  complexity,
  priority,
  plannedStartDate,
  plannedEndDate,
});
```

The calculated bounty amount and algorithm version are stored with the task.

### Automatic Bounty Recalculation

When task attributes that affect bounty are updated, the bounty is automatically recalculated:

**Bounty-affecting attributes:**
- estimatedHours
- complexity
- priority
- plannedStartDate
- plannedEndDate

**Recalculation rules:**
- Only occurs if task bounty is not settled
- Uses the current active algorithm
- Updates both bounty amount and algorithm version

## Algorithm Version Management

### Version Isolation

**Requirement 19.4, 20.4:** Old tasks use old algorithm versions

- Each task stores its `bounty_algorithm_version`
- Algorithm changes don't affect existing tasks
- New tasks use the latest algorithm

### Settled Bounty Immutability

**Requirement 19.5:** Settled bounties cannot be changed

- Once a task bounty is settled, it cannot be recalculated
- The `is_bounty_settled` flag prevents modifications
- Ensures payment integrity

## Urgency Calculation

Urgency is calculated based on time until deadline:

| Days Until Deadline | Urgency Level |
|---------------------|---------------|
| ≤ 1 day             | 5 (Very Urgent) |
| ≤ 3 days            | 4 (Urgent) |
| ≤ 7 days            | 3 (Moderate) |
| ≤ 14 days           | 2 (Low) |
| > 14 days           | 1 (Minimal) |

## Example Usage

### Creating a New Algorithm

```typescript
const algorithm = await bountyService.createAlgorithm({
  version: 'v2.0',
  baseAmount: 100,
  urgencyWeight: 10,
  importanceWeight: 20,
  durationWeight: 5,
  formula: 'baseAmount + (urgency * urgencyWeight) + (importance * importanceWeight) + (duration * durationWeight)',
  effectiveFrom: new Date(),
  createdBy: adminUserId,
});
```

### Creating a Task (Automatic Bounty Calculation)

```typescript
const task = await taskService.createTask({
  name: 'Implement Feature X',
  publisherId: userId,
  estimatedHours: 10,
  complexity: 3,
  priority: 4,
  plannedStartDate: new Date(),
  plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});

// task.bountyAmount is automatically calculated
// task.bountyAlgorithmVersion is set to current algorithm
```

### Updating Task (Automatic Recalculation)

```typescript
const updatedTask = await taskService.updateTask(taskId, {
  estimatedHours: 20,  // Changed from 10
  priority: 5,         // Changed from 4
});

// Bounty is automatically recalculated if not settled
```

### Settling a Bounty

```typescript
// After task completion and bounty distribution
await bountyService.settleBounty(taskId);

// Future updates won't recalculate bounty
```

## Database Schema

### bounty_algorithms Table

```sql
CREATE TABLE bounty_algorithms (
  id UUID PRIMARY KEY,
  version VARCHAR(50) UNIQUE NOT NULL,
  base_amount DECIMAL(10, 2) NOT NULL,
  urgency_weight DECIMAL(5, 4) NOT NULL,
  importance_weight DECIMAL(5, 4) NOT NULL,
  duration_weight DECIMAL(5, 4) NOT NULL,
  formula TEXT NOT NULL,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### tasks Table (Bounty Fields)

```sql
-- Bounty-related columns in tasks table
bounty_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
bounty_algorithm_version VARCHAR(50),
is_bounty_settled BOOLEAN NOT NULL DEFAULT FALSE
```

## Requirements Validation

### Requirement 19.1: Automatic Bounty Calculation
✅ Implemented in `TaskService.createTask()` - bounty is calculated automatically when task is created

### Requirement 19.2: Algorithm Parameters
✅ Implemented in `BountyService.calculateBounty()` - uses baseAmount, urgencyWeight, importanceWeight, durationWeight

### Requirement 19.3: Recalculation on Attribute Change
✅ Implemented in `TaskService.updateTask()` - bounty is recalculated when bounty-affecting attributes change

### Requirement 19.4: Algorithm Version Isolation
✅ Implemented - tasks store algorithm version, new algorithm doesn't affect existing tasks

### Requirement 19.5: Settled Bounty Immutability
✅ Implemented - `is_bounty_settled` flag prevents recalculation

### Requirement 20.1-20.5: Algorithm Management
✅ Implemented in `BountyService` - create, retrieve, and version algorithms

## Testing

Comprehensive unit tests are provided in `BountyService.test.ts`:

- Bounty calculation with various parameters
- Urgency-based bounty adjustment
- Priority-based bounty adjustment
- Duration-based bounty adjustment
- Algorithm creation and validation
- Algorithm version isolation
- Bounty recalculation
- Settled bounty immutability
- Integration with TaskService

## Future Enhancements

Potential improvements for future iterations:

1. **Complex Urgency Formulas**: Support non-linear urgency calculations
2. **Custom Algorithms**: Allow per-position or per-project custom algorithms
3. **Bounty Caps**: Implement minimum and maximum bounty limits
4. **Historical Analysis**: Track bounty effectiveness and completion rates
5. **Dynamic Weights**: Adjust weights based on historical data
