# Database Migrations

This directory contains SQL migration scripts for the Bounty Hunter Platform database.

## Migration Naming Convention

Migrations should be named with the following pattern:
`YYYYMMDD_HHMMSS_description.sql`

Example: `20240101_120000_create_users_table.sql`

## Available Migrations

### 20241210_000001_create_core_tables.sql
Creates the core database tables:
- `users` - User accounts with roles and authentication
- `positions` - Job positions/roles in the system
- `user_positions` - Many-to-many relationship between users and positions (max 3 per user)
- `position_admins` - Administrators for specific positions
- `tasks` - Task management with hierarchy (max 3 levels), dependencies, and bounty tracking
- `task_dependencies` - Task dependency relationships with circular dependency prevention

Includes triggers for:
- Enforcing 3-position limit per user
- Automatic executable flag management for leaf tasks
- Circular dependency detection

### 20241210_000002_create_auxiliary_tables.sql
Creates auxiliary and relationship tables:
- `task_groups` - Team collaboration groups
- `group_members` - Group membership
- `task_assistants` - Assistant users for tasks with bounty allocation
- `position_applications` - Position application workflow
- `notifications` - System notification management
- `avatars` - User avatar system with rank requirements
- `rankings` - User ranking by period (monthly/quarterly/all-time)
- `bounty_algorithms` - Bounty calculation algorithm versioning
- `admin_budgets` - Administrator extra bounty budget tracking
- `task_reviews` - Task reviews with ratings and extra bounties

Includes triggers for:
- Validating assistant bounty allocations
- Validating admin budget usage
- Automatic budget deduction on extra bounty grants

## Running Migrations

### Using the provided script (recommended):

```bash
cd packages/database
chmod +x scripts/run_migrations.sh
./scripts/run_migrations.sh [database_name] [user] [host]
```

Example:
```bash
./scripts/run_migrations.sh bounty_hunter postgres localhost
```

### Manual execution:

```bash
# First run the initialization script
psql -h localhost -U postgres -d bounty_hunter -f scripts/init.sql

# Then run migrations in order
psql -h localhost -U postgres -d bounty_hunter -f migrations/20241210_000001_create_core_tables.sql
psql -h localhost -U postgres -d bounty_hunter -f migrations/20241210_000002_create_auxiliary_tables.sql
```

## Verifying Schema

To verify the database schema after migrations:

```bash
psql -h localhost -U postgres -d bounty_hunter -f scripts/verify_schema.sql
```

## Rolling Back Migrations

Rollback scripts are provided for each migration:

```bash
# Rollback auxiliary tables (must be done first due to dependencies)
psql -h localhost -U postgres -d bounty_hunter -f migrations/20241210_000002_rollback_auxiliary_tables.sql

# Rollback core tables
psql -h localhost -U postgres -d bounty_hunter -f migrations/20241210_000001_rollback_core_tables.sql
```

## Migration Guidelines

1. Each migration should be idempotent when possible
2. Use transactions for data migrations
3. Include rollback scripts when appropriate
4. Test migrations on a copy of production data before deploying
5. Always run migrations in order
6. Verify schema after running migrations

## Database Constraints and Business Rules

The migrations implement several important business rules:

1. **User Position Limit**: Users cannot have more than 3 positions (enforced by trigger)
2. **Task Hierarchy**: Tasks can only be nested 3 levels deep (depth 0-2)
3. **Circular Dependencies**: Task dependencies cannot form cycles (enforced by trigger)
4. **Executable Tasks**: Only leaf nodes (tasks without children) can be executed
5. **Bounty Allocation**: Total fixed allocations to assistants cannot exceed task bounty
6. **Admin Budget**: Extra bounty grants are limited by admin's monthly budget
7. **Ranking Periods**: Rankings are tracked separately for monthly, quarterly, and all-time periods
