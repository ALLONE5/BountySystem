# Task Group Collaboration System

## Overview

The Task Group Collaboration System enables users to form teams and collaboratively work on tasks. Groups can accept tasks, and all members have visibility into group tasks. When a group task is completed, the bounty is distributed equally among all group members.

## Core Components

### Models

#### TaskGroup
- `id`: Unique identifier
- `name`: Group name
- `creatorId`: User who created the group
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

#### GroupMember
- `id`: Unique identifier
- `groupId`: Reference to task group
- `userId`: Reference to user
- `joinedAt`: When the user joined the group

### Services

#### GroupService

**Group Management:**
- `createGroup(groupData)`: Create a new task group (creator is automatically added as member)
- `getGroup(groupId)`: Retrieve group by ID
- `getGroupWithMembers(groupId)`: Get group with member list
- `updateGroup(groupId, name, userId)`: Update group name (creator only)
- `deleteGroup(groupId, userId)`: Delete group (creator only)

**Member Management:**
- `addMember(groupId, userId)`: Add a user to the group
- `removeMember(groupId, userId)`: Remove a user from the group
- `getGroupMembers(groupId)`: Get all members of a group
- `isMember(groupId, userId)`: Check if user is a member
- `getUserGroups(userId)`: Get all groups a user belongs to

**Task Assignment:**
- `assignTaskToGroup(taskId, groupId)`: Assign a task to a group
- `getGroupTasks(groupId)`: Get all tasks assigned to a group
- `canUserViewGroupTask(userId, taskId)`: Check if user can view task through group membership
- `getUserGroupTasks(userId)`: Get all tasks visible to user through their groups

**Bounty Distribution:**
- `calculateGroupBountyDistribution(taskId)`: Preview bounty distribution
- `distributeGroupBounty(taskId)`: Execute bounty distribution and create transactions

## Requirements Mapping

### Requirement 7.1: Group Creation and Member Management
- Users can create task groups
- Users can invite others to join groups
- Creator is automatically added as first member

### Requirement 7.2: Group Task Visibility
- When a group accepts a task, it becomes visible to all members
- All group members can view task details

### Requirement 7.3: Group Member Access
- Group members can view all tasks assigned to their groups
- Members can see other group members

### Requirement 7.4: Member Management
- Users can leave groups
- Creator can remove members
- Creator cannot leave if they are the only member (must delete group instead)

### Requirement 7.5: Bounty Distribution
- When a group task is completed, bounty is distributed among members
- Default distribution: Equal split among all members
- Distribution creates transaction records for each member
- Task is marked as settled after distribution

## API Endpoints

### Group Management
- `POST /api/groups` - Create a new group
- `GET /api/groups` - Get user's groups
- `GET /api/groups/:groupId` - Get group details with members
- `PUT /api/groups/:groupId` - Update group name
- `DELETE /api/groups/:groupId` - Delete group

### Member Management
- `POST /api/groups/:groupId/members` - Add member to group
- `DELETE /api/groups/:groupId/members/:userId` - Remove member from group
- `GET /api/groups/:groupId/members` - Get all group members

### Task Management
- `POST /api/groups/:groupId/tasks` - Assign task to group
- `GET /api/groups/:groupId/tasks` - Get all group tasks
- `GET /api/groups/tasks/my-groups` - Get all tasks from user's groups

### Bounty Distribution
- `GET /api/groups/:groupId/tasks/:taskId/bounty/calculate` - Preview distribution
- `POST /api/groups/:groupId/tasks/:taskId/bounty/distribute` - Execute distribution

## Business Rules

### Group Creation
1. Any user can create a group
2. Creator is automatically added as the first member
3. Group name is required

### Member Management
1. Only group creator can add/remove members
2. Members can leave groups voluntarily
3. Creator cannot leave if they are the only member
4. Duplicate members are not allowed

### Task Assignment
1. Only executable (leaf) tasks can be assigned to groups
2. Tasks cannot be assigned if already assigned to user or another group
3. Task status changes to "in_progress" when assigned to group
4. All group members can view assigned tasks

### Bounty Distribution
1. Can only distribute bounty for completed tasks
2. Bounty cannot be distributed twice (settled flag prevents this)
3. Default distribution is equal split among all members
4. Rounding errors are adjusted by giving remainder to first member
5. Transaction records are created for each member
6. Task is marked as settled after successful distribution

## Database Schema

### task_groups
```sql
CREATE TABLE task_groups (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### group_members
```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES task_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
```

### tasks (group_id column)
```sql
ALTER TABLE tasks 
  ADD COLUMN group_id UUID REFERENCES task_groups(id) ON DELETE SET NULL;
```

## Testing

### Unit Tests
- Group creation and member auto-add
- Member addition and removal
- Group deletion permissions
- Task assignment to groups
- Bounty distribution calculations
- Error handling for invalid operations

### Test Coverage
- All CRUD operations for groups
- Member management operations
- Task assignment and visibility
- Bounty calculation and distribution
- Permission checks
- Edge cases (empty groups, duplicate members, etc.)

## Future Enhancements

1. **Custom Distribution Rules**
   - Weighted distribution based on contribution
   - Role-based distribution (leader gets more)
   - Custom percentage allocation per member

2. **Group Roles**
   - Leader, member, viewer roles
   - Different permissions per role
   - Multiple leaders support

3. **Group Statistics**
   - Total tasks completed
   - Total bounty earned
   - Member contribution metrics

4. **Group Invitations**
   - Invitation system instead of direct add
   - Invitation acceptance/rejection
   - Invitation expiration

5. **Group Chat/Communication**
   - In-group messaging
   - Task-specific discussions
   - Notifications for group activities
