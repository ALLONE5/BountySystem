# Database Schema Reference

## Overview

This document provides a quick reference for the Bounty Hunter Platform database schema.

## Enum Types

### user_role
- `user` - Regular user
- `position_admin` - Position administrator
- `super_admin` - Super administrator

### task_status
- `not_started` - Task not yet started
- `available` - Task available for assignment (dependencies resolved)
- `in_progress` - Task currently being worked on
- `completed` - Task completed
- `abandoned` - Task abandoned

### visibility
- `public` - Visible to all users
- `position_only` - Visible only to users with specific position
- `private` - Visible only to publisher and assignee

### notification_type
- `task_assigned` - Task assigned notification
- `deadline_reminder` - Deadline reminder
- `dependency_resolved` - Task dependency resolved
- `status_changed` - Task status changed
- `position_approved` - Position application approved
- `position_rejected` - Position application rejected
- `broadcast` - Broadcast notification from admin
- `review_required` - Review required notification

### application_status
- `pending` - Application pending review
- `approved` - Application approved
- `rejected` - Application rejected

### allocation_type
- `percentage` - Percentage-based bounty allocation
- `fixed` - Fixed amount bounty allocation

### ranking_period
- `monthly` - Monthly ranking
- `quarterly` - Quarterly ranking
- `all_time` - All-time cumulative ranking

## Core Tables

### users
User accounts and authentication.

**Key Columns:**
- `id` (UUID, PK)
- `username` (VARCHAR, UNIQUE)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `avatar_id` (UUID, FK → avatars)
- `role` (user_role)

**Constraints:**
- Maximum 3 positions per user (enforced by trigger)

### positions
Job positions/roles in the system.

**Key Columns:**
- `id` (UUID, PK)
- `name` (VARCHAR, UNIQUE)
- `description` (TEXT)
- `required_skills` (TEXT[])

### tasks
Task management with hierarchy and bounty tracking.

**Key Columns:**
- `id` (UUID, PK)
- `name` (VARCHAR)
- `parent_id` (UUID, FK → tasks)
- `depth` (INTEGER, 0-2)
- `is_executable` (BOOLEAN)
- `status` (task_status)
- `bounty_amount` (DECIMAL)
- `publisher_id` (UUID, FK → users)
- `assignee_id` (UUID, FK → users)
- `progress` (INTEGER, 0-100)

**Constraints:**
- Maximum depth of 2 (3 levels: 0, 1, 2)
- Only leaf nodes can be executable (enforced by trigger)
- Progress locked when task completed

### task_dependencies
Task dependency relationships.

**Key Columns:**
- `id` (UUID, PK)
- `task_id` (UUID, FK → tasks)
- `depends_on_task_id` (UUID, FK → tasks)

**Constraints:**
- No circular dependencies (enforced by trigger)
- Task cannot depend on itself

## Relationship Tables

### user_positions
Many-to-many relationship between users and positions.

**Constraints:**
- User can have maximum 3 positions
- Unique (user_id, position_id)

### position_admins
Administrators for specific positions.

**Constraints:**
- Unique (position_id, admin_id)

### group_members
Task group membership.

**Constraints:**
- Unique (group_id, user_id)

## Auxiliary Tables

### task_groups
Team collaboration groups.

**Key Columns:**
- `id` (UUID, PK)
- `name` (VARCHAR)
- `creator_id` (UUID, FK → users)

### task_assistants
Assistant users for tasks with bounty allocation.

**Key Columns:**
- `id` (UUID, PK)
- `task_id` (UUID, FK → tasks)
- `user_id` (UUID, FK → users)
- `allocation_type` (allocation_type)
- `allocation_value` (DECIMAL)

**Constraints:**
- Total fixed allocations cannot exceed task bounty
- Percentage allocations cannot exceed 100%

### position_applications
Position application workflow.

**Key Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `position_id` (UUID, FK → positions)
- `status` (application_status)
- `reviewed_by` (UUID, FK → users)

### notifications
System notification management.

**Key Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users) - NULL for broadcast
- `type` (notification_type)
- `related_task_id` (UUID, FK → tasks)
- `is_read` (BOOLEAN)
- `sender_id` (UUID, FK → users)

### avatars
User avatar system with rank requirements.

**Key Columns:**
- `id` (UUID, PK)
- `name` (VARCHAR)
- `image_url` (VARCHAR)
- `required_rank` (INTEGER)

### rankings
User ranking by period.

**Key Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `period` (ranking_period)
- `year` (INTEGER)
- `month` (INTEGER, nullable)
- `quarter` (INTEGER, nullable)
- `total_bounty` (DECIMAL)
- `rank` (INTEGER)

**Constraints:**
- Unique (user_id, period, year, month, quarter)

### bounty_algorithms
Bounty calculation algorithm versioning.

**Key Columns:**
- `id` (UUID, PK)
- `version` (VARCHAR, UNIQUE)
- `base_amount` (DECIMAL)
- `urgency_weight` (DECIMAL)
- `importance_weight` (DECIMAL)
- `duration_weight` (DECIMAL)
- `formula` (TEXT)
- `effective_from` (TIMESTAMP)
- `created_by` (UUID, FK → users)

### admin_budgets
Administrator extra bounty budget tracking.

**Key Columns:**
- `id` (UUID, PK)
- `admin_id` (UUID, FK → users)
- `year` (INTEGER)
- `month` (INTEGER)
- `total_budget` (DECIMAL)
- `used_budget` (DECIMAL)
- `remaining_budget` (DECIMAL, computed)

**Constraints:**
- Used budget cannot exceed total budget
- Unique (admin_id, year, month)

### bounty_transactions
Bounty payment history between users.

**Key Columns:**
- `id` (UUID, PK)
- `task_id` (UUID, FK → tasks)
- `from_user_id` (UUID, FK → users)
- `to_user_id` (UUID, FK → users)
- `amount` (DECIMAL)
- `type` (VARCHAR) - `task_completion`, `extra_reward`, `assistant_share`, `refund`
- `description` (TEXT)
- `created_at` (TIMESTAMP)

### audit_logs
Audit trail for all critical platform operations.

**Key Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `username` (VARCHAR)
- `action` (VARCHAR) - AuditAction enum value
- `resource` (VARCHAR) - AuditResource enum value
- `resource_id` (UUID, nullable)
- `details` (JSONB)
- `ip_address` (VARCHAR)
- `user_agent` (TEXT)
- `timestamp` (TIMESTAMP)
- `success` (BOOLEAN)

**Indexes:**
- `(user_id, timestamp)`
- `(action, timestamp)`
- `(resource, resource_id)`

### system_configs
Global platform configuration settings.

**Key Columns:**
- `id` (UUID, PK)
- `site_name` (VARCHAR)
- `site_description` (TEXT)
- `logo_url` (VARCHAR)
- `allow_registration` (BOOLEAN)
- `maintenance_mode` (BOOLEAN)
- `debug_mode` (BOOLEAN)
- `max_file_size` (INTEGER) - in MB
- `default_user_role` (VARCHAR)
- `email_enabled` (BOOLEAN)
- `smtp_host` / `smtp_port` / `smtp_user` / `smtp_password` / `smtp_secure` - SMTP settings
- `default_theme` (VARCHAR) - `light` or `dark`
- `allow_theme_switch` (BOOLEAN)
- `animation_style` (VARCHAR)
- `enable_animations` (BOOLEAN)
- `reduced_motion` (BOOLEAN)
- `created_at` / `updated_at` (TIMESTAMP)

**Key Columns:**
- `id` (UUID, PK)
- `task_id` (UUID, FK → tasks)
- `reviewer_id` (UUID, FK → users)
- `rating` (INTEGER, 1-5)
- `comment` (TEXT)
- `extra_bounty` (DECIMAL)

**Constraints:**
- Extra bounty deducted from admin budget (enforced by trigger)
- Unique (task_id, reviewer_id)

## Key Indexes

### Performance Indexes
- `users`: email, username, role
- `tasks`: publisher_id, assignee_id, status, position_id, parent_id, group_id
- `task_dependencies`: task_id, depends_on_task_id
- `notifications`: (user_id, is_read, created_at)
- `rankings`: (user_id, period, year, month), (period, year, month, rank)

## Triggers and Functions

### User Position Limit
- **Trigger**: `enforce_user_position_limit`
- **Function**: `check_user_position_limit()`
- **Purpose**: Prevents users from having more than 3 positions

### Task Executable Management
- **Trigger**: `enforce_task_executable`, `update_parent_on_child_insert`
- **Functions**: `check_task_executable()`, `update_parent_executable()`
- **Purpose**: Automatically manages is_executable flag for leaf nodes

### Circular Dependency Prevention
- **Trigger**: `prevent_circular_dependency`
- **Function**: `check_circular_dependency()`
- **Purpose**: Prevents circular task dependencies using recursive CTE

### Assistant Allocation Validation
- **Trigger**: `validate_task_assistant_allocation`
- **Function**: `validate_assistant_allocation()`
- **Purpose**: Validates bounty allocations don't exceed task bounty

### Admin Budget Management
- **Trigger**: `validate_budget_usage`, `deduct_budget_on_review`
- **Functions**: `validate_admin_budget()`, `deduct_extra_bounty_from_budget()`
- **Purpose**: Manages admin budget and deducts extra bounties

## Entity Relationships

```
users ──┬─── tasks (publisher)
        ├─── tasks (assignee)
        ├─── user_positions ─── positions
        ├─── position_applications
        ├─── task_assistants
        ├─── group_members ─── task_groups
        ├─── notifications
        └─── rankings

tasks ──┬─── tasks (parent-child)
        ├─── task_dependencies (self-referential)
        ├─── task_groups
        ├─── task_assistants
        ├─── task_reviews
        └─── notifications

positions ──┬─── tasks
            ├─── position_applications
            ├─── user_positions
            └─── position_admins

avatars ─── users

bounty_algorithms ─── tasks (version)
```

## Migration Order

1. Run `init.sql` to create enum types
2. Run `20241210_000001_create_core_tables.sql` for core tables
3. Run `20241210_000002_create_auxiliary_tables.sql` for auxiliary tables

## Rollback Order

1. Run `20241210_000002_rollback_auxiliary_tables.sql`
2. Run `20241210_000001_rollback_core_tables.sql`
