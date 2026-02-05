# Profile, Avatar & Ranking Enhancement Plan

## Overview
This document outlines the plan to enhance the Profile, Avatar, and Ranking features based on user requirements.

## Requirements

### 1. Profile Page Enhancements
- ✅ Display user avatar
- ⏳ Add avatar selection functionality
- ⏳ Display user's position information
- ⏳ Add "Apply for Position Change" functionality
- ⏳ Integrate with backend avatar API

### 2. Admin Panel Enhancements
- ⏳ Add avatar upload functionality
- ⏳ Set avatar details (name, required rank)
- ⏳ Manage avatars (CRUD operations)

### 3. Ranking Page Fixes
- ⏳ Fix quarterly rankings (currently showing no data)
- ⏳ Fix all-time rankings (currently showing no data)
- ⏳ Ensure proper data loading for all tabs

## Implementation Steps

### Phase 1: Profile Page Avatar Selection
**Files to modify:**
- `packages/frontend/src/pages/ProfilePage.tsx`
- `packages/frontend/src/api/avatar.ts` (create new)

**Tasks:**
1. Create avatar API client
2. Add avatar selection modal to ProfilePage
3. Display available avatars based on user ranking
4. Show locked avatars with rank requirements
5. Allow user to select unlocked avatars

### Phase 2: Profile Page Position Management
**Files to modify:**
- `packages/frontend/src/pages/ProfilePage.tsx`
- `packages/frontend/src/api/position.ts` (may need to create)

**Tasks:**
1. Display user's current positions
2. Add "Apply for Position Change" button
3. Create position change request modal
4. Submit position change requests to backend

### Phase 3: Admin Avatar Management
**Files to modify:**
- `packages/frontend/src/pages/admin/AvatarManagementPage.tsx` (create new)
- `packages/frontend/src/router/index.tsx`
- `packages/frontend/src/layouts/MainLayout.tsx`

**Tasks:**
1. Create AvatarManagementPage component
2. Add avatar upload functionality
3. Display avatar list with CRUD operations
4. Set avatar details (name, required rank)
5. Add route and menu item for admin

### Phase 4: Fix Ranking Page
**Files to modify:**
- `packages/frontend/src/pages/RankingPage.tsx`
- `packages/frontend/src/api/ranking.ts`

**Tasks:**
1. Debug why quarterly and all-time rankings show no data
2. Check API calls and parameters
3. Verify backend is returning data correctly
4. Fix any frontend data handling issues

## Backend API Endpoints (Already Implemented)

### Avatar APIs
- `GET /api/avatars` - Get all avatars
- `GET /api/avatars/available/me` - Get available avatars for current user
- `POST /api/avatars/select/:avatarId` - Select avatar
- `POST /api/avatars` (Admin) - Create avatar
- `PUT /api/avatars/:id` (Admin) - Update avatar
- `DELETE /api/avatars/:id` (Admin) - Delete avatar

### Ranking APIs
- `GET /api/rankings` - Get rankings with period filter
- `GET /api/rankings/user/:userId` - Get user ranking

### Position APIs
- Need to verify if position change request API exists

## Priority Order
1. **HIGH**: Fix Ranking Page (Phase 4) - User reported issue
2. **HIGH**: Profile Avatar Selection (Phase 1) - Core user feature
3. **MEDIUM**: Profile Position Management (Phase 2) - User requested
4. **MEDIUM**: Admin Avatar Management (Phase 3) - Admin feature

## Notes
- Backend avatar system is fully implemented
- Backend ranking system is implemented
- Need to check if position change request system exists in backend
- Avatar images will need to be stored (consider using file upload or external URLs)

