# v8id-cloud Postman Collection

This folder contains Postman collections and environment files for testing the v8id-cloud API.

## Files

- **v8id-cloud-api.postman_collection.json** - Main Postman collection with all API endpoints
- **v8id-cloud-api.postman_environment.json** - Environment variables for local development

## Setup Instructions

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `v8id-cloud-api.postman_collection.json`
4. Click **Import**

### 2. Import Environment

1. In Postman, click **Environments** in the left sidebar
2. Click **Import**
3. Select `v8id-cloud-api.postman_environment.json`
4. Click **Import**
5. Select the **v8id-cloud Local** environment from the dropdown

### 3. Configure Base URL

If your server runs on a different port, update the `baseUrl` variable in the environment:
- Default: `http://localhost:4000`
- Change if needed: `http://localhost:YOUR_PORT`

## Available Endpoints

### Authentication

1. **POST /api/auth/login**
   - Login with email and password
   - Automatically saves `accessToken`, `refreshToken`, `userId`, and `sessionId` to environment
   - If TOTP is enabled, use "Login with TOTP" request instead

2. **POST /api/auth/refresh**
   - Refresh access token using refresh token
   - Automatically updates `accessToken` in environment

3. **POST /api/auth/logout**
   - Logout and revoke current session
   - Requires authentication

### Users

1. **POST /api/users** (Admin Only)
   - Create a new user account
   - Requires admin authentication
   - Password requirements:
     - Minimum 12 characters
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - At least one special character

2. **GET /api/users** (Admin Only)
   - List all users with pagination
   - Query parameters: `page`, `limit`, `search`

3. **GET /api/users/me**
   - Get current authenticated user's profile
   - Requires authentication

4. **PATCH /api/users/me**
   - Update current user's profile
   - Requires authentication
   - Can update: `firstName`, `lastName`, `avatarUrl`

### Health Check

1. **GET /health**
   - Check if server is running
   - No authentication required

## Testing Workflow

### First Time Setup

1. **Start the server**
   ```bash
   cd backend
   pnpm dev
   ```

2. **Create Admin User** (via database or seed script)
   - You'll need to create the first admin user manually in the database
   - Or use Prisma Studio: `pnpm prisma studio`

3. **Login as Admin**
   - Use the "Login" request
   - Update email/password in the request body
   - Check that tokens are saved in environment

4. **Create Regular Users**
   - Use "Create User (Admin Only)" request
   - Tokens from login are automatically used

### Regular Testing

1. **Login** → Tokens automatically saved
2. **Use authenticated endpoints** → Tokens automatically included
3. **Refresh token** when access token expires
4. **Logout** when done

## Environment Variables

The collection uses these environment variables (automatically set by test scripts):

- `baseUrl` - API base URL (default: http://localhost:4000)
- `accessToken` - JWT access token (auto-set after login)
- `refreshToken` - JWT refresh token (auto-set after login)
- `userId` - Current user ID (auto-set after login)
- `sessionId` - Current device session ID (auto-set after login)

## Notes

- **Password Requirements**: All passwords must meet the security requirements (12+ chars, mixed case, numbers, special chars)
- **Admin Access**: Some endpoints require admin role. Make sure you're logged in as an admin user.
- **TOTP**: If TOTP is enabled for a user, you must include `totpCode` in the login request.
- **Device Limits**: System enforces 2 mobile devices + 1 web session per user. Oldest sessions are revoked when limits are exceeded.

## Troubleshooting

### 401 Unauthorized
- Check if `accessToken` is set in environment
- Token might be expired (15 minutes) - use refresh token endpoint
- Make sure Authorization header is included

### 403 Forbidden
- Endpoint requires admin role
- Make sure you're logged in as an admin user

### 400 Bad Request
- Check request body format
- Verify all required fields are present
- Check password requirements for user creation

### Connection Error
- Make sure server is running (`pnpm dev`)
- Check `baseUrl` in environment matches server port
- Verify database is running and connected

