# HRMS Backend API

A complete Human Resource Management System backend built with Node.js, Express.js, MongoDB, and TypeScript. Features JWT-based authentication and role-based access control.

## Features

- 🔐 JWT-based authentication
- 👥 Role-based access control (Admin, HR, Project Manager, Employee)
- 🔒 Password hashing with bcrypt
- 📊 User management with CRUD operations
- 🛡️ Middleware for authentication and authorization
- 📝 Profile management
- 🔍 Search and pagination
- 🚀 TypeScript support

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Language**: TypeScript
- **Validation**: Built-in validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd HRMS-Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment files:
```bash
# Create .env.dev file
cp .env.example .env.dev
```

4. Configure environment variables in `.env.dev`:
```env
PORT=3000
DB_URL=mongodb://localhost:27017/hrms
JWT_TOKEN_SECRET=your_jwt_secret_key_here
REFRESH_JWT_TOKEN_SECREAT=your_refresh_jwt_secret_key_here
ENVIRONMENT=dev
```

5. Build the project:
```bash
npm run build
```

6. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Login user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "employee",
      "status": "active",
      "department": "IT",
      "designation": "Developer",
      "contactNumber": "+1234567890",
      "isEmailVerified": true
    },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/register`
Register new user (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "employee",
  "department": "HR",
  "designation": "HR Manager",
  "contactNumber": "+1234567890"
}
```

#### GET `/api/auth/profile`
Get current user profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### User Management

#### GET `/api/users`
Get all users (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Users per page (default: 10)
- `role` (optional): Filter by role
- `status` (optional): Filter by status
- `search` (optional): Search in name, email, department, designation

#### GET `/api/users/:id`
Get user by ID (role-based access).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### PUT `/api/users/:id`
Update user (role-based access).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "department": "Updated Department",
  "designation": "Updated Designation",
  "contactNumber": "+1234567890"
}
```

#### DELETE `/api/users/:id`
Delete user (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### PATCH `/api/users/:id/role`
Update user role (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "role": "hr"
}
```

#### PATCH `/api/users/:id/status`
Update user status (Admin/HR only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "status": "active"
}
```

## Role-Based Access Control

### Roles

1. **Admin**
   - Can access all routes
   - Can create, read, update, delete all users
   - Can update user roles and status
   - Can manage the entire system

2. **HR**
   - Can manage employees
   - Can update user status
   - Can view and update employee profiles
   - Cannot manage admin users

3. **Project Manager**
   - Can view and update employee profiles
   - Can manage project-related data
   - Cannot manage admin or HR users

4. **Employee**
   - Can view and update their own profile
   - Cannot access other users' data
   - Limited system access

### Permission Matrix

| Action | Admin | HR | Project Manager | Employee |
|--------|-------|----|----------------|----------|
| View all users | ✅ | ✅ | ✅ | ❌ |
| Create users | ✅ | ✅ | ❌ | ❌ |
| Update any user | ✅ | ✅ | ✅ | ❌ |
| Update own profile | ✅ | ✅ | ✅ | ✅ |
| Delete users | ✅ | ❌ | ❌ | ❌ |
| Update roles | ✅ | ❌ | ❌ | ❌ |
| Update status | ✅ | ✅ | ❌ | ❌ |

## Database Schema

### User Model

```typescript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'project_manager', 'hr', 'employee']),
  status: String (enum: ['active', 'inactive', 'suspended']),
  department: String,
  designation: String,
  contactNumber: String,
  profilePhoto: String,
  isEmailVerified: Boolean,
  isDeleted: Boolean,
  isBlocked: Boolean,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `DB_URL` | MongoDB connection string | Yes |
| `JWT_TOKEN_SECRET` | JWT secret key | Yes |
| `REFRESH_JWT_TOKEN_SECREAT` | Refresh token secret | Yes |
| `ENVIRONMENT` | Environment name | No |

## Default Admin User

On first startup, the system creates a default admin user:

- **Email**: admin@hrms.com
- **Password**: admin123
- **Role**: admin

**⚠️ Important**: Change the default password after first login in production.

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

## Development

### Scripts

```bash
# Build TypeScript
npm run build

# Start development server with watch
npm run server

# Start production server
npm start

# Clean build directory
npm run clean
```

### Project Structure

```
src/
├── controllers/
│   ├── auth/
│   │   └── authController.ts
│   └── user/
│       └── userController.ts
├── database/
│   └── models/
│       └── user.ts
├── middleware/
│   ├── authMiddleware.ts
│   └── roleMiddleware.ts
├── routes/
│   ├── authRoutes.ts
│   └── userRoutes.ts
├── utils/
│   ├── generateToken.ts
│   └── seedAdmin.ts
└── Routes/
    └── index.ts
```

## Testing with Postman

1. **Login to get token:**
   ```
   POST /api/auth/login
   Body: {
     "email": "admin@hrms.com",
     "password": "admin123"
   }
   ```

2. **Use token in subsequent requests:**
   ```
   Headers: Authorization: Bearer <token_from_login>
   ```

3. **Test different roles:**
   - Create users with different roles
   - Test role-based access control
   - Verify permissions for each role

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation
- Soft delete for users
- Account status management

## Future Enhancements

- [ ] Email verification
- [ ] Password reset functionality
- [ ] File upload for profile photos
- [ ] Attendance management
- [ ] Leave request system
- [ ] Payroll management
- [ ] Project assignments
- [ ] Audit logging
- [ ] Rate limiting
- [ ] API documentation with Swagger

## License

This project is licensed under the ISC License. 