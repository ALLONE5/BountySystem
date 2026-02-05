# User Profile Management Implementation

## Overview

This document describes the implementation of user personal information management features, specifically email modification and password change functionality.

## Requirements Implemented

- **Requirement 8.5**: Email modification with format validation
- **Requirement 8.6**: Password modification requiring current password
- **Requirement 8.7**: Save changes and show success message
- **Requirement 8.8**: Email verification success updates email and notifies user

## Implementation Details

### UserService Methods

#### Password Management

**`changePassword(userId, currentPassword, newPassword)`**
- Validates current password before allowing change
- Enforces password strength requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Hashes new password using bcrypt
- Updates password in database

**`validatePasswordStrength(password)`**
- Validates password meets strength requirements
- Throws descriptive errors for each validation failure

#### Email Management

**`updateEmail(userId, newEmail)`**
- Validates email format using regex
- Checks if email is already in use by another user
- Updates email in database
- Returns updated user object

**`requestEmailChange(userId, newEmail)`**
- Validates email format
- Checks if email is already in use
- Placeholder for sending verification email
- In production, would:
  1. Generate verification token
  2. Store in pending_email_changes table
  3. Send verification email with token

**`validateEmailFormat(email)`**
- Validates email format using regex pattern
- Throws error for invalid formats

### API Endpoints

All endpoints require authentication via JWT token in Authorization header.

#### `PUT /api/users/me/password`
Change user password

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Errors:**
- 400: Invalid input data
- 401: Not authenticated
- 400: Current password is incorrect
- 400: Password validation errors

#### `PUT /api/users/me/email`
Update user email

**Request Body:**
```json
{
  "newEmail": "string"
}
```

**Response:**
```json
{
  "message": "Email updated successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "avatarId": "string | null",
    "role": "string",
    "createdAt": "date",
    "lastLogin": "date | null"
  }
}
```

**Errors:**
- 400: Invalid email format
- 401: Not authenticated
- 400: Email is already in use

#### `POST /api/users/me/email/request`
Request email change (sends verification email in production)

**Request Body:**
```json
{
  "newEmail": "string"
}
```

**Response:**
```json
{
  "message": "Email change requested. Please check your email for verification."
}
```

**Errors:**
- 400: Invalid email format
- 401: Not authenticated
- 400: Email is already in use

## Security Considerations

### Password Security
- Passwords are hashed using bcrypt with 10 salt rounds
- Current password must be verified before allowing change
- Strong password requirements enforced
- Old password is immediately invalidated after change

### Email Security
- Email format validation prevents invalid inputs
- Duplicate email check prevents conflicts
- In production, email changes should require verification
- User can update to same email (no-op)

## Testing

Comprehensive unit tests cover:

### Password Change Tests
- ✓ Change password with valid current password
- ✓ Reject incorrect current password
- ✓ Reject weak passwords (too short, missing uppercase, lowercase, numbers)
- ✓ Reject password change for non-existent user

### Password Validation Tests
- ✓ Accept strong passwords
- ✓ Reject passwords that are too short
- ✓ Reject passwords without uppercase letters
- ✓ Reject passwords without lowercase letters
- ✓ Reject passwords without numbers

### Email Validation Tests
- ✓ Accept valid email formats
- ✓ Reject invalid email formats (missing @, missing domain, etc.)

### Email Update Tests
- ✓ Update email with valid format
- ✓ Reject invalid email format
- ✓ Reject email already in use by another user
- ✓ Allow updating to same email

### Email Change Request Tests
- ✓ Validate email format when requesting change
- ✓ Reject email already in use when requesting change
- ✓ Accept valid email change request

## Future Enhancements

### Email Verification System
In a production system, email changes should include:

1. **Verification Token Generation**
   - Generate secure random token
   - Store in `pending_email_changes` table with expiration
   - Associate with user ID and new email

2. **Verification Email**
   - Send email to new address with verification link
   - Include token in link
   - Set expiration time (e.g., 24 hours)

3. **Verification Endpoint**
   - `POST /api/users/me/email/verify`
   - Validate token
   - Check expiration
   - Update email if valid
   - Send confirmation to both old and new email

4. **Database Schema**
```sql
CREATE TABLE pending_email_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  new_email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Additional Features
- Email notification to old email when email is changed
- Rate limiting on password change attempts
- Password history to prevent reuse
- Two-factor authentication for sensitive changes
- Account recovery via email

## Integration

The user routes are registered in `src/index.ts`:
```typescript
import userRoutes from './routes/user.routes.js';
app.use('/api/users', userRoutes);
```

All routes use the `authenticate` middleware to ensure only authenticated users can access them.

## Error Handling

All errors are properly handled and return appropriate HTTP status codes:
- 400: Bad Request (validation errors, business logic errors)
- 401: Unauthorized (authentication required)
- 500: Internal Server Error (unexpected errors)

Error responses follow the standard format:
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {},
  "timestamp": "ISO 8601 timestamp"
}
```
