# Audit Log Username Fix

## Issue
Audit logs were showing "unknown" instead of the actual username when admin operations were performed. This made it difficult to track which specific user performed actions in the system.

## Root Cause
The JWT payload only contained `userId`, `email`, and `role`, but not the `username`. The audit middleware was trying to access `user.username` from the JWT payload and falling back to `'unknown'` when it wasn't available.

## Solution
Added `username` to the JWT payload structure to ensure it's available for audit logging.

### Changes Made

#### 1. Updated JWT Payload Interface
**File:** `packages/backend/src/utils/jwt.ts`
```typescript
export interface JWTPayload {
  userId: string;
  username: string;  // Added username
  email: string;
  role: UserRole;
}
```

#### 2. Updated Token Generation in Auth Routes
**File:** `packages/backend/src/routes/auth.routes.ts`

Updated both registration and login endpoints to include username in JWT:
```typescript
const token = JWTService.generateToken({
  userId: user.id,
  username: user.username,  // Added username
  email: user.email,
  role: user.role,
});
```

#### 3. Updated JWT Tests
**File:** `packages/backend/src/utils/jwt.test.ts`

Updated test payload and assertions to include username:
```typescript
const testPayload = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  username: 'testuser',  // Added username
  email: 'test@example.com',
  role: UserRole.USER,
};
```

#### 4. Cleaned Up Audit Middleware
**File:** `packages/backend/src/middleware/audit.middleware.ts`

Removed the fallback to `'unknown'` since username is now guaranteed to be available:
```typescript
await auditLogService.logUserAction(
  user.userId,
  user.username,  // No longer needs fallback
  options.action,
  options.resource,
  resourceId,
  details,
  req.ip || req.connection.remoteAddress || '',
  req.get('User-Agent') || '',
  success
);
```

## Testing
- ✅ Admin operations now correctly show "admin" as username in audit logs
- ✅ Regular user operations show correct usernames (e.g., "developer1")
- ✅ All JWT tests pass
- ✅ Login audit logs work correctly
- ✅ No breaking changes to existing functionality

## Impact
- **Positive:** Audit logs now provide accurate user identification for all operations
- **Positive:** Better security monitoring and compliance tracking
- **Neutral:** Slightly larger JWT tokens (minimal impact)
- **None:** No breaking changes to existing API contracts

## Files Modified
1. `packages/backend/src/utils/jwt.ts` - Updated JWT payload interface
2. `packages/backend/src/routes/auth.routes.ts` - Updated token generation
3. `packages/backend/src/utils/jwt.test.ts` - Updated tests
4. `packages/backend/src/middleware/audit.middleware.ts` - Cleaned up fallback logic

## Verification
The fix was verified by:
1. Testing admin login and operations - username correctly shows as "admin"
2. Testing regular user login and operations - username correctly shows user's actual username
3. Running JWT unit tests - all tests pass
4. Checking audit log entries - no more "unknown" usernames

## Date
February 10, 2026