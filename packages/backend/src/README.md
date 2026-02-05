# Backend Implementation

## Architecture Overview

The backend has been refactored to use a clean, layered architecture with clear separation of concerns. For comprehensive architecture documentation, see:

- **[Architecture Documentation](../ARCHITECTURE.md)** - Complete architecture overview
- **[Refactoring Migration Guide](../REFACTORING_MIGRATION_GUIDE.md)** - Migration guide with before/after examples

### Pattern Documentation

- **[Repository Pattern](./repositories/REPOSITORY_PATTERN.md)** - Data access layer implementation
- **[DI Container Usage](./config/CONTAINER_USAGE.md)** - Dependency injection patterns
- **[Transaction Manager](./utils/TRANSACTION_MANAGER.md)** - Safe transaction handling
- **[Permission Checker](./utils/PERMISSION_CHECKER.md)** - Centralized authorization
- **[Mapper Pattern](./utils/mappers/MAPPER_PATTERN.md)** - Model to DTO transformation

---

## Authentication and Authorization System

This implementation covers Task 3 from the specification: User Authentication and Authorization System.

### Implemented Features

#### 3.1 User Registration and Login
- **User Model** (`models/User.ts`): Defines user data structures and DTOs
- **UserService** (`services/UserService.ts`): Handles user CRUD operations
  - Password hashing using bcrypt (10 salt rounds)
  - User creation, retrieval, and updates
  - Password verification
  - Secure user response (removes sensitive data)
- **JWT Service** (`utils/jwt.ts`): Token generation and verification
  - Configurable expiration time (default: 24h)
  - Secure token signing with JWT_SECRET
- **Auth Routes** (`routes/auth.routes.ts`):
  - `POST /api/auth/register` - Register new user
  - `POST /api/auth/login` - Login user
  - `GET /api/auth/me` - Get current user info (requires authentication)

#### 3.2 Role-Based Permission Control
- **Permission Service** (`services/PermissionService.ts`): Manages role-based access control
  - Page access control based on user roles
  - Position management permissions
  - User data access control
  - Task access control
- **Auth Middleware** (`middleware/auth.middleware.ts`):
  - JWT token verification
  - User authentication
  - Optional authentication support
- **Permission Middleware** (`middleware/permission.middleware.ts`):
  - Role-based access control
  - Page access verification
  - Resource-specific permissions (users, tasks)

### User Roles

1. **User** (`user`): Regular users
   - Access to: Personal, Published Tasks, Accepted Tasks, Bounty Tasks, Ranking pages
   
2. **Position Admin** (`position_admin`): Position administrators
   - All user permissions
   - Additional access to: User Management, Task Management, Audit Operations
   - Can only manage users/tasks related to their assigned positions
   
3. **Super Admin** (`super_admin`): System administrators
   - Full access to all pages and resources
   - Can manage all users, tasks, and positions

### API Endpoints

#### Authentication

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: 201 Created
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "avatarId": null,
    "createdAt": "2024-12-10T...",
    "lastLogin": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: 200 OK
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Get Current User**
```http
GET /api/auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  ...
}
```

### Middleware Usage

**Protect Routes with Authentication**
```typescript
import { authenticate } from './middleware/auth.middleware.js';

router.get('/protected', authenticate, (req, res) => {
  // req.user contains authenticated user info
  res.json({ message: 'Protected resource' });
});
```

**Require Specific Role**
```typescript
import { requireRole } from './middleware/permission.middleware.js';
import { UserRole } from './models/User.js';

router.post('/admin-only', 
  authenticate,
  requireRole([UserRole.SUPER_ADMIN]),
  (req, res) => {
    res.json({ message: 'Admin only resource' });
  }
);
```

**Require Page Access**
```typescript
import { requirePageAccess } from './middleware/permission.middleware.js';
import { PageAccess } from './services/PermissionService.js';

router.get('/user-management',
  authenticate,
  requirePageAccess(PageAccess.USER_MANAGEMENT),
  (req, res) => {
    res.json({ message: 'User management page' });
  }
);
```

### Error Handling

The system uses custom error classes for consistent error responses:

- `ValidationError` (400): Invalid input data
- `AuthenticationError` (401): Authentication failed
- `AuthorizationError` (403): Insufficient permissions
- `NotFoundError` (404): Resource not found
- `ConflictError` (409): Resource conflict (e.g., duplicate email)

Error Response Format:
```json
{
  "code": "AUTHENTICATION_ERROR",
  "message": "Invalid email or password",
  "timestamp": "2024-12-10T..."
}
```

### Security Features

1. **Password Security**
   - Passwords hashed with bcrypt (10 salt rounds)
   - Never stored or transmitted in plain text
   
2. **JWT Security**
   - Tokens signed with secret key
   - Configurable expiration time
   - Verified on every protected request
   
3. **Input Validation**
   - Zod schema validation for all inputs
   - Email format validation
   - Password minimum length (6 characters)
   - Username minimum length (3 characters)

4. **Database Security**
   - Parameterized queries (prevents SQL injection)
   - Unique constraints on email and username
   - Role-based data access control

### Testing

Run tests:
```bash
npm test
```

Test coverage includes:
- JWT token generation and verification
- Permission service role checks
- User service CRUD operations (requires database)

### Environment Variables

Required environment variables (see `.env.example`):
```
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

### Requirements Validation

This implementation satisfies the following requirements:

**Requirement 6.1**: User role-based page access
- ✅ Regular users can access personal, task, and ranking pages
- ✅ Position admins have additional management access
- ✅ Super admins have full system access

**Requirement 6.2**: Position admin permissions
- ✅ Position admins can access management interfaces
- ✅ Data scope limited to managed positions

**Requirement 6.3**: Super admin permissions
- ✅ Super admins have unrestricted access

**Requirement 6.4**: Position admin data scope
- ✅ Position admins can only view users with their managed positions

**Requirement 6.5**: Position admin task scope
- ✅ Position admins can only edit tasks related to their positions

**Requirement 6.6**: Super admin full access
- ✅ Super admins can view, edit, and delete any resource

### Next Steps

To use this authentication system in other routes:
1. Import the `authenticate` middleware
2. Import permission middleware as needed
3. Apply to route handlers
4. Access user info via `req.user`

Example:
```typescript
import { authenticate } from './middleware/auth.middleware.js';
import { requireAdmin } from './middleware/permission.middleware.js';

// Protected route
router.get('/tasks', authenticate, async (req, res) => {
  const userId = req.user!.userId;
  // Fetch user's tasks
});

// Admin-only route
router.delete('/tasks/:id', authenticate, requireAdmin, async (req, res) => {
  // Delete task
});
```
