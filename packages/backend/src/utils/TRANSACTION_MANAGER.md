# Transaction Manager Best Practices

## Overview

The `TransactionManager` utility provides a clean, safe way to execute multiple database operations within a single transaction. It ensures data consistency by automatically committing on success and rolling back on failure.

**Location**: `src/utils/TransactionManager.ts`

## Core Concepts

### What is a Transaction?

A database transaction is a sequence of operations that are executed as a single unit of work. Either all operations succeed (commit) or all fail (rollback), ensuring data consistency.

**Example Scenario**: Creating a task with positions
- Create task record
- Create multiple position records
- If any step fails, rollback everything

### Why Use TransactionManager?

**Without TransactionManager**:
```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const task = await client.query('INSERT INTO tasks...');
  await client.query('INSERT INTO positions...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

**With TransactionManager**:
```typescript
await transactionManager.executeInTransaction(async (client) => {
  const task = await client.query('INSERT INTO tasks...');
  await client.query('INSERT INTO positions...');
});
```

## Basic Usage

### Simple Transaction

```typescript
import { resolve } from '../config/container.js';

const transactionManager = resolve('transactionManager');

// Execute operations in a transaction
const result = await transactionManager.executeInTransaction(async (client) => {
  // All operations use the same client
  const task = await client.query('INSERT INTO tasks...');
  const position = await client.query('INSERT INTO positions...');
  
  return { task, position };
});
```

### Transaction with Repository Methods

```typescript
class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private positionRepository: PositionRepository,
    private transactionManager: TransactionManager
  ) {}

  async createTaskWithPositions(data: CreateTaskInput) {
    return this.transactionManager.executeInTransaction(async (client) => {
      // Create task
      const task = await this.taskRepository.create(data.task, client);
      
      // Create positions
      const positions = await Promise.all(
        data.positions.map(pos => 
          this.positionRepository.create({ ...pos, task_id: task.id }, client)
        )
      );
      
      return { task, positions };
    });
  }
}
```

## Advanced Patterns

### Nested Transactions

While PostgreSQL doesn't support true nested transactions, you can use savepoints:

```typescript
await transactionManager.executeInTransaction(async (client) => {
  // Main transaction
  const task = await createTask(client);
  
  // Savepoint for partial rollback
  await client.query('SAVEPOINT sp1');
  try {
    await createPositions(client);
  } catch (error) {
    await client.query('ROLLBACK TO SAVEPOINT sp1');
    // Continue with main transaction
  }
  
  return task;
});
```

### Transaction with Retry Logic

For handling transient errors:

```typescript
await transactionManager.executeInTransactionWithRetry(
  async (client) => {
    // Operations that might fail transiently
    return await performOperation(client);
  },
  3  // Max retries
);
```

### Conditional Rollback

```typescript
await transactionManager.executeInTransaction(async (client) => {
  const task = await createTask(client);
  
  // Business logic check
  if (task.bounty > maxBounty) {
    throw new ValidationError('Bounty exceeds maximum allowed');
    // Automatic rollback
  }
  
  return task;
});
```

## Best Practices

### 1. Keep Transactions Short

Transactions lock database resources. Keep them as short as possible:

```typescript
// ✅ Good - Short transaction
await transactionManager.executeInTransaction(async (client) => {
  const task = await taskRepo.create(data, client);
  await positionRepo.create(posData, client);
  return task;
});

// ❌ Bad - Long transaction with external calls
await transactionManager.executeInTransaction(async (client) => {
  const task = await taskRepo.create(data, client);
  await sendEmail(task);  // External call - don't do this!
  await positionRepo.create(posData, client);
});
```

### 2. Use the Same Client

All operations in a transaction must use the same database client:

```typescript
// ✅ Good - Same client
await transactionManager.executeInTransaction(async (client) => {
  await client.query('INSERT INTO tasks...', [data]);
  await client.query('INSERT INTO positions...', [posData]);
});

// ❌ Bad - Different connections
await transactionManager.executeInTransaction(async (client) => {
  await client.query('INSERT INTO tasks...', [data]);
  await pool.query('INSERT INTO positions...', [posData]);  // Wrong!
});
```

### 3. Handle Errors Appropriately

Let errors propagate to trigger rollback:

```typescript
// ✅ Good - Error propagates, triggers rollback
await transactionManager.executeInTransaction(async (client) => {
  const task = await createTask(client);
  if (!task) {
    throw new Error('Task creation failed');  // Triggers rollback
  }
  return task;
});

// ❌ Bad - Swallowing errors
await transactionManager.executeInTransaction(async (client) => {
  try {
    const task = await createTask(client);
  } catch (error) {
    console.error(error);  // Error swallowed, transaction commits!
  }
});
```

### 4. Return Meaningful Results

Return data that the caller needs:

```typescript
// ✅ Good - Return complete result
const result = await transactionManager.executeInTransaction(async (client) => {
  const task = await taskRepo.create(data, client);
  const positions = await positionRepo.createMany(posData, client);
  return { task, positions };
});

// ❌ Bad - No return value
await transactionManager.executeInTransaction(async (client) => {
  await taskRepo.create(data, client);
  // Caller can't access created task
});
```

### 5. Avoid External Side Effects

Don't perform external operations inside transactions:

```typescript
// ✅ Good - External operations after transaction
const task = await transactionManager.executeInTransaction(async (client) => {
  return await taskRepo.create(data, client);
});

// Send notification after transaction commits
await notificationService.sendTaskCreated(task);

// ❌ Bad - External operations in transaction
await transactionManager.executeInTransaction(async (client) => {
  const task = await taskRepo.create(data, client);
  await sendEmail(task);  // If this fails, database rollback but email sent!
});
```

## Common Use Cases

### 1. Creating Related Records

```typescript
async createTaskWithPositions(data: CreateTaskInput) {
  return this.transactionManager.executeInTransaction(async (client) => {
    // Create parent record
    const task = await this.taskRepository.create({
      title: data.title,
      description: data.description,
      creator_id: data.creatorId
    }, client);
    
    // Create child records
    const positions = await Promise.all(
      data.positions.map(pos => 
        this.positionRepository.create({
          ...pos,
          task_id: task.id
        }, client)
      )
    );
    
    return { task, positions };
  });
}
```

### 2. Updating Multiple Records

```typescript
async completeTask(taskId: number, userId: number) {
  return this.transactionManager.executeInTransaction(async (client) => {
    // Update task status
    await this.taskRepository.update(taskId, {
      status: 'completed',
      completed_at: new Date()
    }, client);
    
    // Update all positions
    const positions = await this.positionRepository.findByTask(taskId);
    await Promise.all(
      positions.map(pos => 
        this.positionRepository.update(pos.id, {
          status: 'completed'
        }, client)
      )
    );
    
    // Update user stats
    await this.userRepository.incrementCompletedTasks(userId, client);
  });
}
```

### 3. Transferring Resources

```typescript
async transferBounty(fromUserId: number, toUserId: number, amount: number) {
  return this.transactionManager.executeInTransaction(async (client) => {
    // Deduct from sender
    await client.query(
      'UPDATE users SET bounty = bounty - $1 WHERE id = $2',
      [amount, fromUserId]
    );
    
    // Add to receiver
    await client.query(
      'UPDATE users SET bounty = bounty + $1 WHERE id = $2',
      [amount, toUserId]
    );
    
    // Record transaction
    await client.query(
      'INSERT INTO bounty_transactions (from_user_id, to_user_id, amount) VALUES ($1, $2, $3)',
      [fromUserId, toUserId, amount]
    );
  });
}
```

### 4. Deleting with Cascade

```typescript
async deleteTask(taskId: number) {
  return this.transactionManager.executeInTransaction(async (client) => {
    // Delete positions first (foreign key constraint)
    await client.query('DELETE FROM positions WHERE task_id = $1', [taskId]);
    
    // Delete task dependencies
    await client.query('DELETE FROM task_dependencies WHERE task_id = $1 OR depends_on_id = $1', [taskId]);
    
    // Delete task
    await client.query('DELETE FROM tasks WHERE id = $1', [taskId]);
  });
}
```

## Error Handling

### Automatic Rollback

TransactionManager automatically rolls back on any error:

```typescript
try {
  await transactionManager.executeInTransaction(async (client) => {
    await createTask(client);
    throw new Error('Something went wrong');
    // Automatic rollback happens here
  });
} catch (error) {
  // Transaction already rolled back
  console.error('Transaction failed:', error);
}
```

### Error Propagation

Original errors are preserved with stack traces:

```typescript
try {
  await transactionManager.executeInTransaction(async (client) => {
    throw new ValidationError('Invalid data');
  });
} catch (error) {
  // Error is ValidationError, not generic Error
  expect(error).toBeInstanceOf(ValidationError);
  expect(error.message).toBe('Invalid data');
  expect(error.stack).toBeDefined();
}
```

### Connection Release

Connections are always released, even on error:

```typescript
// Connection is released in finally block
await transactionManager.executeInTransaction(async (client) => {
  // Even if this throws, connection is released
  throw new Error('Fail');
});
```

## Testing Transactions

### Unit Tests

Test transaction behavior:

```typescript
describe('TransactionManager', () => {
  it('should commit on success', async () => {
    const result = await transactionManager.executeInTransaction(async (client) => {
      await client.query('INSERT INTO tasks...');
      return 'success';
    });
    
    expect(result).toBe('success');
    
    // Verify data was committed
    const tasks = await pool.query('SELECT * FROM tasks');
    expect(tasks.rows.length).toBeGreaterThan(0);
  });
  
  it('should rollback on failure', async () => {
    const initialCount = await getTaskCount();
    
    try {
      await transactionManager.executeInTransaction(async (client) => {
        await client.query('INSERT INTO tasks...');
        throw new Error('Fail');
      });
    } catch (error) {
      // Expected
    }
    
    // Verify data was rolled back
    const finalCount = await getTaskCount();
    expect(finalCount).toBe(initialCount);
  });
});
```

### Property-Based Tests

Test universal properties:

```typescript
// Property: Transaction Commit on Success
it('should commit successful operations', () => {
  fc.assert(
    fc.property(
      fc.record({ title: fc.string(), bounty: fc.integer({ min: 0 }) }),
      async (taskData) => {
        const result = await transactionManager.executeInTransaction(async (client) => {
          return await createTask(taskData, client);
        });
        
        // Verify task exists in database
        const task = await taskRepository.findById(result.id);
        expect(task).toBeDefined();
      }
    ),
    { numRuns: 100 }
  );
});

// Property: Transaction Rollback on Failure
it('should rollback failed operations', () => {
  fc.assert(
    fc.property(fc.integer({ min: 1 }), async (taskId) => {
      const initialCount = await getTaskCount();
      
      try {
        await transactionManager.executeInTransaction(async (client) => {
          await createTask({}, client);
          throw new Error('Intentional failure');
        });
      } catch (error) {
        // Expected
      }
      
      const finalCount = await getTaskCount();
      expect(finalCount).toBe(initialCount);
    }),
    { numRuns: 100 }
  );
});
```

## Performance Considerations

### Transaction Isolation Levels

PostgreSQL default is READ COMMITTED. For stricter isolation:

```typescript
await transactionManager.executeInTransaction(async (client) => {
  await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
  // Operations with serializable isolation
});
```

### Lock Contention

Minimize lock contention by:
- Keeping transactions short
- Accessing tables in consistent order
- Using appropriate lock modes

```typescript
// ✅ Good - Consistent order
await transactionManager.executeInTransaction(async (client) => {
  await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [userId]);
  await client.query('SELECT * FROM tasks WHERE id = $1 FOR UPDATE', [taskId]);
});

// ❌ Bad - Inconsistent order (can cause deadlocks)
// Transaction 1: locks users then tasks
// Transaction 2: locks tasks then users
```

### Batch Operations

For bulk operations, use batch queries:

```typescript
await transactionManager.executeInTransaction(async (client) => {
  // Single query instead of multiple
  await client.query(`
    INSERT INTO positions (task_id, title, bounty)
    SELECT $1, unnest($2::text[]), unnest($3::int[])
  `, [taskId, titles, bounties]);
});
```

## Troubleshooting

### Common Issues

**Issue**: "Connection pool exhausted"
- **Cause**: Transactions not completing, holding connections
- **Solution**: Ensure all transactions complete (commit or rollback)

**Issue**: "Deadlock detected"
- **Cause**: Multiple transactions waiting for each other's locks
- **Solution**: Access tables in consistent order, keep transactions short

**Issue**: "Transaction already committed"
- **Cause**: Attempting to use client after transaction completes
- **Solution**: Don't store client reference, use it only within callback

**Issue**: "Serialization failure"
- **Cause**: Concurrent transactions modifying same data
- **Solution**: Use retry logic with `executeInTransactionWithRetry`

## Migration Guide

### Migrating from Manual Transactions

**Before**:
```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  const task = await client.query('INSERT INTO tasks...');
  await client.query('INSERT INTO positions...');
  
  await client.query('COMMIT');
  return task;
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

**After**:
```typescript
return this.transactionManager.executeInTransaction(async (client) => {
  const task = await client.query('INSERT INTO tasks...');
  await client.query('INSERT INTO positions...');
  return task;
});
```

## Related Documentation

- [Repository Pattern](../repositories/REPOSITORY_PATTERN.md)
- [DI Container Usage](../config/CONTAINER_USAGE.md)
- [Permission Checker](./PERMISSION_CHECKER.md)
- [Error Handling](./errors.ts)
