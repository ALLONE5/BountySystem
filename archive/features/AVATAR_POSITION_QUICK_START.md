# Avatar & Position Features - Quick Start Guide

## 🚀 Quick Start

### For Admin (First Time Setup)

1. **Populate Rankings** (Required for avatar unlocking):
   ```bash
   cd packages/backend
   
   # Get admin token by logging in as admin first
   # Then run:
   ADMIN_TOKEN=your_admin_token node scripts/populate-rankings.js
   ```

2. **Add Avatars**:
   - Login as admin (username: `admin`, password: `Password123`)
   - Navigate to: Admin → 头像管理
   - Click "添加头像"
   - Fill in:
     - 名称: e.g., "金色徽章"
     - 图片URL: e.g., "https://example.com/avatar.png"
     - 所需排名: e.g., 10 (means top 10 users can unlock)
   - Click "保存"

3. **Create Positions** (if not already in database):
   - Use backend API or database to create positions
   - Or positions may already exist from seed data

### For Regular Users

1. **Select Avatar**:
   - Go to: 个人信息 (Profile)
   - Click the camera icon on your avatar
   - Browse available avatars
   - Click on an unlocked avatar to select it
   - Locked avatars show required rank

2. **Request Position Change**:
   - Go to: 个人信息 (Profile)
   - View your current positions (green tags)
   - Click "申请岗位变更"
   - Select desired position from dropdown
   - Click "提交申请"
   - Wait for admin approval

## 📋 Feature Overview

### Avatar System
- **Unlocking**: Based on last month's ranking
- **Selection**: Click camera icon on profile
- **Locked Avatars**: Show required rank with lock icon
- **Current Avatar**: Displayed on profile and header

### Position System
- **Current Positions**: Displayed on profile page
- **Apply for Change**: Submit application for new position
- **Admin Review**: Position admins approve/reject applications
- **Status**: Check application status (pending/approved/rejected)

### Admin Avatar Management
- **CRUD Operations**: Create, Read, Update, Delete avatars
- **Image URLs**: Use external image URLs
- **Rank Requirements**: Set minimum rank to unlock
- **Preview**: See avatar preview in table

## 🔧 API Endpoints

### Avatar APIs (User)
- `GET /api/avatars/available/me` - Get my available avatars
- `GET /api/avatars/user/me` - Get my current avatar
- `POST /api/avatars/select/:avatarId` - Select an avatar

### Avatar APIs (Admin)
- `GET /api/avatars` - List all avatars
- `POST /api/avatars` - Create avatar
- `PUT /api/avatars/:id` - Update avatar
- `DELETE /api/avatars/:id` - Delete avatar

### Position APIs (User)
- `GET /api/positions` - List all positions
- `GET /api/positions/users/:userId/positions` - Get user positions
- `POST /api/positions/applications` - Apply for position
- `GET /api/positions/applications/my` - Get my applications

### Ranking APIs (Admin)
- `POST /api/rankings/update-all` - Calculate all rankings

## 🎯 Example Workflow

### User Workflow:
1. Complete tasks and earn bounty
2. Admin calculates rankings monthly
3. User's rank improves
4. New avatars unlock automatically
5. User selects new avatar from profile
6. User applies for position change
7. Admin reviews and approves
8. User's position updates

### Admin Workflow:
1. Create avatars with different rank requirements
2. Calculate rankings monthly (or use cron job)
3. Review position change applications
4. Approve/reject applications
5. Monitor avatar usage and rankings

## 📝 Notes

- **Ranking Calculation**: Must be done by admin, ideally monthly
- **Avatar Images**: Use external URLs (e.g., CDN, image hosting)
- **Position Applications**: Require admin approval
- **Last Month Ranking**: Avatar unlocking uses previous month's rank
- **Frontend Restart**: Required after code changes

## 🐛 Troubleshooting

### Avatars not unlocking:
- Check if rankings have been calculated
- Verify user's last month ranking
- Check avatar required rank setting

### Position application fails:
- Ensure position exists in database
- Check user authentication
- Verify backend is running

### Rankings not showing:
- Run populate-rankings script as admin
- Check backend logs for errors
- Verify database connection

## 📚 Related Documentation

- `PROFILE_AVATAR_POSITION_IMPLEMENTATION.md` - Full implementation details
- `PROFILE_AVATAR_ENHANCEMENT_PLAN.md` - Original planning document
- `packages/backend/src/services/RANKING_AVATAR_SYSTEM.md` - Backend system docs
- `packages/backend/src/services/AVATAR_IMPLEMENTATION_SUMMARY.md` - Avatar details

## ✅ Testing Checklist

- [ ] Admin: Populate rankings
- [ ] Admin: Create test avatars
- [ ] User: View profile page
- [ ] User: Open avatar selection modal
- [ ] User: Select unlocked avatar
- [ ] User: View current positions
- [ ] User: Submit position change request
- [ ] Admin: View avatar management page
- [ ] Admin: Create/edit/delete avatars
- [ ] Admin: Review position applications

---

**All features are now implemented and ready to use!** 🎉
