# Ranking and Avatar System

## Overview

The Ranking and Avatar System manages user rankings based on completed task bounties and provides avatar unlocking based on ranking achievements.

## Components

### 1. Ranking System

#### RankingService

Manages ranking calculations and queries for different time periods.

**Key Features:**
- Calculate rankings for monthly, quarterly, and all-time periods
- Query rankings with filtering options
- Get user-specific rankings
- Automatic ranking updates

**Ranking Periods:**
- **Monthly**: Rankings based on current month's completed tasks
- **Quarterly**: Rankings based on current quarter's completed tasks
- **All-Time**: Rankings based on all completed tasks

**Ranking Calculation:**
Rankings are calculated based on total bounty earned from completed tasks. The system:
1. Queries all completed tasks for the specified period
2. Sums the bounty amounts for each user
3. Orders users by total bounty (descending)
4. Assigns ranks (1, 2, 3, ...)
5. Stores rankings in the database

**API Endpoints:**

```
GET /api/rankings
  - Get rankings for a specific period
  - Query params: period, year, month, quarter, limit

GET /api/rankings/current/monthly
  - Get current month rankings
  - Query params: limit

GET /api/rankings/current/quarterly
  - Get current quarter rankings
  - Query params: limit

GET /api/rankings/all-time
  - Get all-time rankings
  - Query params: limit

GET /api/rankings/user/:userId
  - Get user's ranking for a specific period
  - Query params: period, year, month, quarter

POST /api/rankings/calculate (Admin only)
  - Calculate rankings for a specific period
  - Body: { period, year, month?, quarter? }

POST /api/rankings/update-all (Admin only)
  - Update all rankings (monthly, quarterly, all-time)
```

### 2. Avatar System

#### AvatarService

Manages avatar creation, unlocking, and selection based on user rankings.

**Key Features:**
- Create and manage avatars with rank requirements
- Determine available avatars based on user's last month ranking
- Validate avatar selection permissions
- Select avatar for user

**Avatar Unlocking Logic:**
- Avatars have a `requiredRank` field (e.g., 1, 10, 50, 100)
- Users can select avatars where their rank is <= requiredRank
- Ranking from **last month** determines unlocked avatars
- New users (no ranking) can access all avatars by default

**Property 14: Avatar Unlock Based on Ranking**
*For any* user, their selectable avatar set should only include avatars unlocked by their last month's ranking level.
**Validates: Requirements 8.1, 8.3**

**API Endpoints:**

```
GET /api/avatars
  - Get all avatars

GET /api/avatars/:id
  - Get avatar by ID

GET /api/avatars/available/me
  - Get available avatars for current user

GET /api/avatars/available/:userId
  - Get available avatars for a specific user

GET /api/avatars/user/me
  - Get current user's avatar

POST /api/avatars (Admin only)
  - Create a new avatar
  - Body: { name, imageUrl, requiredRank }

PUT /api/avatars/:id (Admin only)
  - Update an avatar
  - Body: { name?, imageUrl?, requiredRank? }

DELETE /api/avatars/:id (Admin only)
  - Delete an avatar

POST /api/avatars/select/:avatarId
  - Select an avatar for current user

POST /api/avatars/update-unlock-permissions (Admin only)
  - Update avatar unlock permissions based on last month's rankings
```

## Database Schema

### Rankings Table

```sql
CREATE TABLE rankings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  period ranking_period NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER,
  quarter INTEGER,
  total_bounty DECIMAL(10, 2) NOT NULL,
  rank INTEGER NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(user_id, period, year, month, quarter)
);
```

### Avatars Table

```sql
CREATE TABLE avatars (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  required_rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## Scheduled Tasks

The ranking system should be updated periodically:

### Daily Tasks
- Calculate current month rankings
- Update avatar unlock permissions

### Monthly Tasks (1st of each month)
- Calculate previous month rankings
- Calculate current quarter rankings (if new quarter)
- Calculate all-time rankings
- Update avatar unlock permissions for all users

### Implementation Example

```typescript
// Using node-cron or similar
import cron from 'node-cron';

// Daily at midnight
cron.schedule('0 0 * * *', async () => {
  await rankingService.calculateCurrentMonthRankings();
  await avatarService.updateAvatarUnlockPermissions();
});

// Monthly on 1st at 1 AM
cron.schedule('0 1 1 * *', async () => {
  await rankingService.updateAllRankings();
  await avatarService.updateAvatarUnlockPermissions();
});
```

## Usage Examples

### Calculate Rankings

```typescript
// Calculate current month rankings
const rankings = await rankingService.calculateCurrentMonthRankings();

// Calculate specific period
const monthlyRankings = await rankingService.calculateRankings(
  RankingPeriod.MONTHLY,
  2024,
  12
);
```

### Query Rankings

```typescript
// Get current month top 10
const topUsers = await rankingService.getCurrentMonthRankings(10);

// Get user's ranking
const userRanking = await rankingService.getUserRanking(
  userId,
  RankingPeriod.MONTHLY,
  2024,
  12
);
```

### Avatar Management

```typescript
// Get available avatars for user
const avatars = await avatarService.getAvailableAvatarsForUser(userId);

// Select avatar
await avatarService.selectAvatarForUser(userId, avatarId);

// Check if user can select avatar
const canSelect = await avatarService.canUserSelectAvatar(userId, avatarId);
```

## Error Handling

### Common Errors

**AVATAR_LOCKED (403)**
- User tries to select an avatar they haven't unlocked
- Solution: Improve ranking to unlock the avatar

**Avatar not found (404)**
- Avatar ID doesn't exist
- Solution: Use valid avatar ID

**Insufficient permissions (403)**
- Non-admin tries to create/update/delete avatars
- Non-admin tries to calculate rankings
- Solution: Use admin account

## Testing

### Unit Tests

Tests cover:
- Ranking calculation for different periods
- Ranking queries and filtering
- Avatar CRUD operations
- Avatar availability based on ranking
- Avatar selection validation

### Running Tests

```bash
npm test -- RankingService.test.ts --run
npm test -- AvatarService.test.ts --run
```

## Requirements Validation

### Requirement 14: Ranking Interface
- ✅ 14.1: Display monthly rankings
- ✅ 14.2: Display quarterly rankings
- ✅ 14.3: Display all-time rankings
- ✅ 14.4: Show user info (name, avatar, bounty, rank)
- ✅ 14.5: Highlight current user's rank
- ✅ 14.6: Update avatar unlock permissions based on last month ranking

### Requirement 8: User Personal Information Management
- ✅ 8.1: Show unlocked avatars based on ranking
- ✅ 8.2: Unlock avatars based on last month ranking
- ✅ 8.3: Validate avatar selection permissions
- ✅ 8.4: Reject locked avatar selection

## Future Enhancements

1. **Caching**: Cache ranking data in Redis for better performance
2. **Leaderboard**: Real-time leaderboard updates via WebSocket
3. **Achievements**: Badge system based on ranking milestones
4. **Historical Rankings**: Track ranking changes over time
5. **Avatar Customization**: Allow users to customize unlocked avatars
6. **Ranking Notifications**: Notify users of ranking changes
