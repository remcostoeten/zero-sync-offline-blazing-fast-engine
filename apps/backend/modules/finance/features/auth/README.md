# Authentication System

A simple JWT-based authentication system for the local finance application.

## Features

- User registration with name, email, password, profile, and avatar
- Secure password hashing using bcrypt
- JWT token generation and validation
- Protected routes using middleware
- User profile management

## Environment Variables

Create a `.env` file in the backend root with:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Configuration (optional - for Turso sync)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:4000
```

## API Endpoints

### Public Routes

#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "your-password",
  "profile": "Optional profile description",
  "avatar": "Optional avatar URL"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "profile": "Optional profile description",
      "avatar": "Optional avatar URL"
    },
    "token": "jwt-token-here"
  }
}
```

#### POST `/api/auth/login`
Authenticate existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "profile": "Optional profile description",
      "avatar": "Optional avatar URL"
    },
    "token": "jwt-token-here"
  }
}
```

### Protected Routes (Require Authorization Header)

#### GET `/api/auth/profile`
Get current user's profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

#### PUT `/api/auth/profile`
Update current user's profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "profile": "Updated profile",
  "avatar": "Updated avatar URL"
}
```

## Usage

### 1. Run Migration
```bash
bun run migrate:users
```

### 2. Start the Server
```bash
bun run dev
```

### 3. Test Authentication

#### Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Get Profile (Protected)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Security Features

- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens expire after 7 days
- Email addresses must be unique
- Input validation using Zod schemas
- Protected routes require valid JWT tokens

## Database Schema

The `users` table includes:
- `id`: Primary key (auto-increment)
- `name`: User's display name
- `email`: Unique email address
- `password`: Hashed password
- `profile`: Optional profile description
- `avatar`: Optional avatar URL/path
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

## Middleware

Use `authMiddleware` to protect routes that require authentication:

```typescript
import { authMiddleware } from '../../shared/middleware/auth.middleware';

// Protected route
app.get('/protected', authMiddleware, (c) => {
  // Access user info via c.user
  return c.json({ message: `Hello ${c.user.name}!` });
});
```
