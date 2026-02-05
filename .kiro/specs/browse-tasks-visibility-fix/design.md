# Design Document: Browse Tasks Visibility Fix

## Overview

This design addresses the overly restrictive filtering logic in the browse tasks page by implementing status-based filtering instead of relying on indirect indicators like `is_executable` and `assignee_id`. The solution modifies the `getAvailableTasks` method in TaskService to filter primarily by task status, adds optional completed task display, and updates the frontend to support filtering controls.

## Architecture

### System Components

```
┌─────────────────────┐
│  BrowseTasksPage    │
│  (Frontend)         │
└──────────┬──────────┘
           │ HTTP GET /api/tasks/available?includeCompleted=true/false
           ▼
┌─────────────────────┐
│  Task Routes        │
│  (API Layer)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  TaskService        │
│  getAvailableTasks()│
└──────────┬──────────┘
           │ SQL Query
           ▼
┌─────────────────────┐
│  PostgreSQL         │
│  tasks table        │
└─────────────────────┘
```

### Data Flow

1. User toggles "Show Completed Tasks" filter on BrowseTasksPage
2. Frontend calls `/api/tasks/available?includeCompleted={true|false}`
3. API route extracts query parameter and calls TaskService.getAvailableTasks()
4. TaskService builds SQL query with status-based filtering
5. Database returns filtered task records
6. TaskService maps records to Task DTOs
7. API returns JSON response to frontend
8. Frontend renders tasks with visual distinction for completed tasks

## Components and Interfaces

### Backend: TaskService

**Modified Method:**
```typescript
async getAvailableTasks(options: {
  includeCompleted?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Task[]>
```

**Query Logic:**
```sql
SELECT 
  t.id,
  t.title,
  t.description,
  t.status,
  t.bounty,
  t.assignee_id,
  t.is_executable,
  t.parent_task_id,
  t.created_at,
  t.updated_at
FROM tasks t
WHERE 
  t.assignee_id IS NULL
  AND (
    -- Available tasks (primary)
    t.status = 'available'
    OR
    -- Completed tasks (optional)
    (? = true AND t.status = 'completed')
  )
ORDER BY t.created_at DESC
LIMIT ? OFFSET ?
```

**Key Changes:**
- Remove `is_executable = true` constraint
- Add explicit status filtering
- Support optional completed task inclusion via parameter
- Maintain assignee_id IS NULL for available tasks
- Allow completed tasks regardless of assignee (they're already done)

### Backend: Task Routes

**Modified Endpoint:**
```typescript
router.get('/available', async (req, res) => {
  const includeCompleted = req.query.includeCompleted === 'true';
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  
  const tasks = await taskService.getAvailableTasks({
    includeCompleted,
    limit,
    offset
  });
  
  res.json(tasks);
});
```

### Frontend: Task API Client

**Modified Function:**
```typescript
export async function getAvailableTasks(options?: {
  includeCompleted?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Task[]> {
  const params = new URLSearchParams();
  
  if (options?.includeCompleted) {
    params.append('includeCompleted', 'true');
  }
  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }
  if (options?.offset) {
    params.append('offset', options.offset.toString());
  }
  
  const response = await client.get(`/tasks/available?${params.toString()}`);
  return response.data;
}
```

### Frontend: BrowseTasksPage

**State Management:**
```typescript
const [showCompleted, setShowCompleted] = useState(false);
const [tasks, setTasks] = useState<Task[]>([]);

useEffect(() => {
  loadTasks();
}, [showCompleted]);

async function loadTasks() {
  const data = await getAvailableTasks({ 
    includeCompleted: showCompleted 
  });
  setTasks(data);
}
```

**UI Components:**
```typescript
// Filter Toggle
<FormControlLabel
  control={
    <Switch
      checked={showCompleted}
      onChange={(e) => setShowCompleted(e.target.checked)}
    />
  }
  label="Show Completed Tasks"
/>

// Task Card with Status Badge
<TaskCard task={task}>
  {task.status === 'completed' && (
    <Chip 
      label="Completed" 
      color="success" 
      size="small"
      icon={<CheckCircleIcon />}
    />
  )}
</TaskCard>
```

## Data Models

### Task Model (Existing)

```typescript
interface Task {
  id: number;
  title: string;
  description: string;
  status: 'available' | 'in_progress' | 'completed' | 'cancelled';
  bounty: number;
  assignee_id: number | null;
  is_executable: boolean;
  parent_task_id: number | null;
  created_at: Date;
  updated_at: Date;
}
```

**No changes to the Task model are required.** The existing fields support the new filtering logic.

### Query Options Interface (New)

```typescript
interface GetAvailableTasksOptions {
  includeCompleted?: boolean;  // Default: false
  limit?: number;              // Default: 50
  offset?: number;             // Default: 0
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Available Task Filtering

*For any* set of tasks in the database, when querying with includeCompleted = false, all returned tasks should have status = 'available' AND assignee_id IS NULL, regardless of their is_executable value.

**Validates: Requirements 1.1, 1.2, 1.3, 3.1, 3.3**

### Property 2: Completed Task Inclusion Flag

*For any* set of tasks in the database, when querying with includeCompleted = true, all returned tasks should have (status = 'available' AND assignee_id IS NULL) OR (status = 'completed'), and when includeCompleted = false, all returned tasks should have status = 'available' AND assignee_id IS NULL.

**Validates: Requirements 2.1, 2.2, 4.2, 4.3**

### Property 3: In-Progress Task Exclusion

*For any* query parameters (includeCompleted = true or false), no returned tasks should have status = 'in_progress'.

**Validates: Requirements 4.4**

### Property 4: Completed Tasks with Assignees

*For any* task with status = 'completed' and assignee_id IS NOT NULL, when querying with includeCompleted = true, that task should be included in the results.

**Validates: Requirements 3.4, 3.5**

### Property 5: Query Determinism

*For any* query parameters (includeCompleted, limit, offset), calling getAvailableTasks twice with identical parameters should return identical results (assuming no database changes between calls).

**Validates: Requirements 6.3**

### Property 6: NULL Assignee Handling

*For any* task with assignee_id IS NULL and status = 'available', that task should always be included in results regardless of other query parameters.

**Validates: Requirements 6.4**

### Property 7: UI Rendering Completeness

*For any* set of tasks returned by the API, the Browse_Tasks_Page should render exactly that number of task cards, and each card should display the task's title, description, bounty, and status.

**Validates: Requirements 1.4, 1.5**

### Property 8: UI Visual Distinction

*For any* task with status = 'completed' displayed on the Browse_Tasks_Page, the rendered task card should contain a visual indicator (badge, chip, or icon) that distinguishes it from available tasks.

**Validates: Requirements 2.3, 2.5**

### Property 9: UI Filter Interaction

*For any* state of the completed tasks toggle, changing the toggle should trigger an API call with the corresponding includeCompleted parameter value, and the displayed task list should update to reflect the new results.

**Validates: Requirements 5.4, 5.5**

## Error Handling

### Backend Error Scenarios

1. **Invalid Query Parameters**
   - Validation: Ensure limit and offset are positive integers
   - Response: 400 Bad Request with error message
   - Example: `{ error: "Invalid limit parameter: must be a positive integer" }`

2. **Database Connection Failure**
   - Handling: Catch database errors and return 500 Internal Server Error
   - Logging: Log full error details for debugging
   - Response: `{ error: "Failed to retrieve tasks" }`

3. **Query Timeout**
   - Handling: Set query timeout to 5 seconds
   - Response: 504 Gateway Timeout
   - Logging: Log slow query for performance analysis

### Frontend Error Scenarios

1. **API Request Failure**
   - Handling: Display error message to user
   - Retry: Implement exponential backoff retry (3 attempts)
   - Fallback: Show cached tasks if available

2. **Empty Results**
   - Handling: Display "No tasks available" message
   - UI: Show helpful message suggesting to check back later or adjust filters

3. **Network Timeout**
   - Handling: Show timeout message with retry button
   - Timeout: Set to 10 seconds for API calls

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;           // Human-readable error message
  code?: string;           // Error code for programmatic handling
  details?: any;           // Additional error details (dev mode only)
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing

**Library Selection:**
- Backend (TypeScript): Use `fast-check` library for property-based testing
- Frontend (TypeScript/React): Use `fast-check` with React Testing Library

**Configuration:**
- Each property test must run minimum 100 iterations
- Each test must reference its design document property
- Tag format: `// Feature: browse-tasks-visibility-fix, Property {number}: {property_text}`

**Property Test Examples:**

```typescript
// Feature: browse-tasks-visibility-fix, Property 1: Available Task Filtering
it('should return only available unassigned tasks when includeCompleted is false', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(taskGenerator()), // Generate random tasks
      async (tasks) => {
        // Setup: Insert tasks into test database
        await insertTasks(tasks);
        
        // Execute: Query with includeCompleted = false
        const results = await taskService.getAvailableTasks({ 
          includeCompleted: false 
        });
        
        // Verify: All results have status='available' AND assignee_id IS NULL
        expect(results.every(t => 
          t.status === 'available' && t.assignee_id === null
        )).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Backend Unit Tests:**
- Test specific query parameter combinations
- Test edge cases (empty database, single task, large datasets)
- Test error handling (invalid parameters, database errors)
- Test backward compatibility with existing API consumers

**Frontend Unit Tests:**
- Test filter toggle interaction
- Test task card rendering with different task statuses
- Test visual distinction for completed tasks
- Test error message display
- Test loading states

**Integration Tests:**
- Test full flow from UI interaction to database query
- Test API endpoint with various query parameters
- Test pagination with includeCompleted flag

### Test Data Generators

```typescript
// Generate random tasks for property testing
function taskGenerator(): fc.Arbitrary<Task> {
  return fc.record({
    id: fc.integer({ min: 1 }),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ maxLength: 500 }),
    status: fc.constantFrom('available', 'in_progress', 'completed', 'cancelled'),
    bounty: fc.integer({ min: 0, max: 10000 }),
    assignee_id: fc.option(fc.integer({ min: 1 }), { nil: null }),
    is_executable: fc.boolean(),
    parent_task_id: fc.option(fc.integer({ min: 1 }), { nil: null }),
    created_at: fc.date(),
    updated_at: fc.date()
  });
}
```

### Test Coverage Goals

- Backend: 90% code coverage for TaskService.getAvailableTasks
- Frontend: 85% code coverage for BrowseTasksPage component
- Property tests: All 9 correctness properties implemented
- Unit tests: All error scenarios covered
- Integration tests: All API endpoints tested

## Implementation Notes

### Database Indexes

Ensure the following indexes exist for optimal query performance:

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status_assignee ON tasks(status, assignee_id);
```

### Migration Strategy

1. Deploy backend changes first (backward compatible)
2. Verify API endpoint works with both old and new parameters
3. Deploy frontend changes
4. Monitor query performance and adjust indexes if needed

### Backward Compatibility

The changes maintain backward compatibility:
- Existing API calls without `includeCompleted` parameter work as before (defaults to false)
- The query returns a superset of tasks compared to the old logic (more tasks visible)
- No breaking changes to Task model or API response format

### Performance Considerations

- Query uses indexed columns (status, assignee_id) for fast filtering
- Pagination (limit/offset) prevents large result sets
- Consider adding caching for frequently accessed task lists
- Monitor query execution time and add database query logging

### Future Enhancements

- Add filtering by bounty range
- Add sorting options (by bounty, date, title)
- Add search functionality for task title/description
- Add task category/tag filtering
- Implement real-time updates when new tasks become available
