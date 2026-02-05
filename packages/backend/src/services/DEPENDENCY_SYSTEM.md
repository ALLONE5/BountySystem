# Task Dependency System

## Overview

The Task Dependency System manages dependencies between tasks, ensuring that tasks can only be assigned when their prerequisites are completed. It includes circular dependency detection and automatic dependency resolution.

## Components

### 1. TaskDependency Model (`models/TaskDependency.ts`)

Represents a dependency relationship between two tasks.

```typescript
interface TaskDependency {
  id: string;
  taskId: string;              // The task that has the dependency
  dependsOnTaskId: string;     // The task that must be completed first
  createdAt: Date;
}
```

### 2. DependencyService (`services/DependencyService.ts`)

Core service for managing task dependencies.

#### Key Methods:

**addDependency(dependencyData)**
- Creates a new dependency relationship
- Validates both tasks exist
- Prevents self-dependencies
- Database trigger prevents circular dependencies
- Throws `ValidationError` for circular dependencies or duplicates

**removeDependency(taskId, dependsOnTaskId)**
- Removes an existing dependency
- Throws `NotFoundError` if dependency doesn't exist

**getTaskDependencies(taskId)**
- Returns all tasks that the given task depends on

**getDependentTasks(taskId)**
- Returns all tasks that depend on the given task

**areDependenciesResolved(taskId)**
- Checks if all dependencies for a task are completed
- Returns `true` if all dependencies are COMPLETED or if no dependencies exist

**getUnresolvedDependencies(taskId)**
- Returns list of task IDs that must be completed before this task can start

**wouldCreateCircularDependency(taskId, dependsOnTaskId)**
- Manual check for circular dependencies before adding
- Uses recursive CTE to detect cycles

**updateTaskAvailability(taskId)**
- Updates task status to AVAILABLE when all dependencies are resolved
- Only updates tasks in NOT_STARTED status

**resolveDownstreamDependencies(completedTaskId)**
- Called when a task is completed
- Checks all dependent tasks and updates their availability
- Returns list of task IDs that became available

### 3. TaskService Integration

The TaskService has been extended with dependency-aware methods:

**assignTask(taskId, assigneeId)**
- Validates task is executable (leaf node)
- Checks all dependencies are resolved before allowing assignment
- Throws `ValidationError` if dependencies are unresolved

**completeTask(taskId)**
- Marks task as COMPLETED
- Automatically resolves downstream dependencies
- Returns list of tasks that became available

**addDependency(taskId, dependsOnTaskId)**
- Convenience method that delegates to DependencyService

**removeDependency(taskId, dependsOnTaskId)**
- Convenience method that delegates to DependencyService

**getTaskDependencies(taskId)**
- Convenience method that delegates to DependencyService

**areDependenciesResolved(taskId)**
- Convenience method that delegates to DependencyService

### 4. API Routes (`routes/dependency.routes.ts`)

RESTful API endpoints for dependency management:

**POST /api/dependencies**
- Add a dependency
- Body: `{ taskId, dependsOnTaskId }`
- Returns: Created dependency object

**DELETE /api/dependencies**
- Remove a dependency
- Body: `{ taskId, dependsOnTaskId }`
- Returns: 204 No Content

**GET /api/dependencies/:taskId**
- Get all dependencies for a task
- Returns: Array of TaskDependency objects

**GET /api/dependencies/:taskId/dependents**
- Get all tasks that depend on this task
- Returns: Array of TaskDependency objects

**GET /api/dependencies/:taskId/resolved**
- Check if task dependencies are resolved
- Returns: `{ resolved: boolean }`

**GET /api/dependencies/:taskId/unresolved**
- Get unresolved dependencies
- Returns: `{ unresolvedDependencies: string[] }`

**POST /api/dependencies/check-circular**
- Check if adding a dependency would create a cycle
- Body: `{ taskId, dependsOnTaskId }`
- Returns: `{ wouldCreateCircularDependency: boolean }`

## Database Schema

### task_dependencies Table

```sql
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);
```

### Database Trigger: Circular Dependency Prevention

A PostgreSQL trigger automatically prevents circular dependencies:

```sql
CREATE TRIGGER prevent_circular_dependency
  BEFORE INSERT ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION check_circular_dependency();
```

The trigger uses a recursive CTE to detect cycles in the dependency graph.

## Usage Examples

### Adding a Dependency

```typescript
const dependencyService = new DependencyService();

// Task B depends on Task A
await dependencyService.addDependency({
  taskId: taskB.id,
  dependsOnTaskId: taskA.id,
});
```

### Checking Dependencies Before Assignment

```typescript
const taskService = new TaskService();

try {
  // This will fail if dependencies are not resolved
  await taskService.assignTask(taskId, userId);
} catch (error) {
  if (error.message.includes('unresolved dependencies')) {
    // Get list of unresolved dependencies
    const unresolved = await taskService.getTaskDependencies(taskId);
    console.log('Complete these tasks first:', unresolved);
  }
}
```

### Completing a Task and Resolving Dependencies

```typescript
// Complete a task
const resolvedTaskIds = await taskService.completeTask(taskId);

// resolvedTaskIds contains IDs of tasks that became available
console.log('These tasks are now available:', resolvedTaskIds);
```

### Checking for Circular Dependencies

```typescript
// Before adding a dependency, check if it would create a cycle
const wouldCreate = await dependencyService.wouldCreateCircularDependency(
  taskA.id,
  taskB.id
);

if (wouldCreate) {
  console.log('Cannot add dependency: would create circular dependency');
}
```

## Workflow

### 1. Task Creation with Dependencies

```
1. Create Task A
2. Create Task B
3. Add dependency: B depends on A
4. Task B status: NOT_STARTED (cannot be assigned)
```

### 2. Dependency Resolution

```
1. Complete Task A
2. System automatically checks dependent tasks
3. Task B has no more unresolved dependencies
4. Task B status: AVAILABLE (can now be assigned)
5. Notification sent to relevant users
```

### 3. Dependency Chain

```
Task A -> Task B -> Task C

1. Complete Task A
   - Task B becomes AVAILABLE
   - Task C remains NOT_STARTED (still depends on B)

2. Complete Task B
   - Task C becomes AVAILABLE
```

### 4. Multiple Dependencies

```
Task A ─┐
        ├─> Task C
Task B ─┘

1. Complete Task A
   - Task C remains NOT_STARTED (still depends on B)

2. Complete Task B
   - Task C becomes AVAILABLE (all dependencies resolved)
```

## Error Handling

### ValidationError
- Task cannot depend on itself
- Circular dependency detected
- Duplicate dependency
- Unresolved dependencies when assigning task

### NotFoundError
- Task not found
- Dependency task not found
- Dependency relationship not found

## Testing

Comprehensive test suites are provided:

1. **DependencyService.test.ts** - Tests all DependencyService methods
2. **DependencyBlocking.test.ts** - Tests blocking and resolution logic

Run tests:
```bash
npm test -- DependencyService.test.ts --run
npm test -- DependencyBlocking.test.ts --run
```

## Requirements Validation

This implementation satisfies the following requirements:

**Requirement 3.1**: Users can add dependencies between tasks
**Requirement 3.2**: Tasks with unresolved dependencies cannot be assigned
**Requirement 3.3**: Dependencies are automatically resolved when prerequisite tasks complete
**Requirement 3.4**: Circular dependencies are prevented
**Requirement 3.5**: System triggers automatic scheduling when dependencies change

## Future Enhancements

1. **Dependency Visualization**: Graph view of task dependencies
2. **Bulk Dependency Operations**: Add/remove multiple dependencies at once
3. **Dependency Templates**: Predefined dependency patterns for common workflows
4. **Dependency Notifications**: Enhanced notifications when dependencies are resolved
5. **Dependency Analytics**: Track dependency chains and bottlenecks
