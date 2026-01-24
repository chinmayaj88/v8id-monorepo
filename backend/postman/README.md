# Postman Collections for v8id-cloud API

This directory contains Postman collections for testing the v8id-cloud backend API.

## Collections

### 1. **Authentication** (`auth.postman_collection.json`)

Authentication and security endpoints:

- Verify Credentials (Step 1 of login)
- Verify TOTP (Step 2 of login)
- Refresh Token
- Logout
- Forgot Password
- Reset Password
- Change Password
- Regenerate Backup Codes
- Resetup TOTP
- Get Backup Codes Status

### 2. **Users** (`users.postman_collection.json`)

User management endpoints:

- Create User (Admin Only)
- List Users (Admin Only)
- Get Current User
- Update Current User
- List Active Sessions
- Revoke Specific Session
- Revoke All Sessions
- Get Login History

### 3. **files and folder** (`files-and-folder.postman_collection.json`)

File and folder management endpoints:

- **File Operations:**
  - Standard Upload (small files)
  - Initiate Upload (large files, chunked)
  - Upload Chunk
  - Resume Upload
  - Complete Upload
  - Download File
  - Get File Metadata
  - Update File
  - Delete File (Trash)
  - Permanent Delete File
  - Archive File
  - Copy File
  - Preview File
  - Get Thumbnail
  - Regenerate Thumbnail
  - Toggle Favorite
  - List Favorites
  - Create File Comment
  - List File Comments
  - Set File Expiration
  - Generate File Link
  - List File Versions
  - Create File Version
  - Restore File Version
  - Get File Activity
  - List Files and Folders (Root)
  - List Trash
- **Folder Operations:**
  - Create Folder
  - Get Folder Details
  - Update Folder
  - Delete Folder (Trash)
  - Restore Folder
  - Permanent Delete Folder
  - List Folders
  - List Trash Folders
  - Copy Folder
  - Share Folder
  - Create Folder Template
  - List Folder Templates
  - Create Folder From Template
- **Bulk Operations:**
  - Bulk Delete
  - Bulk Move
  - Bulk Restore
- **Sharing:**
  - Share File
  - List Shared Files
  - Unshare File
- **Analytics & Search:**
  - Unified Search
  - Dashboard Data
  - Get Storage Analytics

## Environment

### **v8id-cloud Local** (`v8id-cloud-api.postman_environment.json`)

Environment variables for local development:

- `baseUrl`: `http://localhost:4000`
- `accessToken`: JWT access token (auto-populated after login)
- `refreshToken`: JWT refresh token (auto-populated after login)
- `tempToken`: Temporary token for TOTP verification (auto-populated)
- `userId`: Current user ID (auto-populated)
- `sessionId`: Current device session ID (auto-populated)
- `fileId`: File ID for testing (auto-populated)
- `uploadSessionId`: Upload session ID (auto-populated)
- `folderId`: Folder ID for testing (auto-populated)
- `shareId`: File share ID (auto-populated)
- `templateId`: Folder template ID (auto-populated)
- `versionId`: File version ID (auto-populated)

## Setup Instructions

1. **Import Collections:**
   - Open Postman
   - Click "Import"
   - Select all `.postman_collection.json` files
   - Click "Import"

2. **Import Environment:**
   - Click "Import" again
   - Select `v8id-cloud-api.postman_environment.json`
   - Click "Import"
   - Select the environment in the top-right dropdown

3. **Start Backend Server:**

   ```bash
   cd backend
   pnpm dev
   ```

4. **Test Authentication:**
   - Use "Authentication" collection
   - Run "Step 1: Verify Credentials" with valid credentials
   - Run "Step 2: Verify TOTP" with TOTP code from authenticator app
   - Tokens will be automatically saved to environment

5. **Test Other Endpoints:**
   - All authenticated endpoints will use the saved `accessToken`
   - Tokens are automatically refreshed when needed

## Important Notes

### Storage Tiers

The API supports two storage tiers:

- **STANDARD**: For frequently accessed files (default)
  - Fast retrieval, low latency
  - Thumbnails generated automatically
  - Higher storage cost
- **ARCHIVE**: For rarely accessed files
  - Lower storage cost
  - Acceptable latency for rare access
  - Thumbnails skipped during upload (lazy generation)

Specify `storageTier` in upload requests: `"STANDARD"` or `"ARCHIVE"`

### Rate Limiting

All endpoints include rate limiting. Check response headers:

- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests in window
- `RateLimit-Reset`: Unix timestamp when limit resets

### Authentication Flow

1. **Step 1**: Verify Credentials → Returns `tempToken` (expires in 5 minutes)
2. **Step 2**: Verify TOTP → Returns `accessToken` and `refreshToken`
3. Use `accessToken` in `Authorization: Bearer {token}` header
4. Refresh `accessToken` using `refreshToken` when it expires

### Password Requirements

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### File Upload

- **Small files (< 10MB)**: Use "Upload File" endpoint (multipart/form-data)
- **Large files (>= 10MB)**: Use chunked upload flow:
  1. Initiate Upload → Get `sessionId` and `parUrl`
  2. Upload Chunks → Upload file in chunks to `parUrl`
  3. Complete Upload → Finalize upload with `sessionId`

## API Base URL

- **Local Development**: `http://localhost:4000`
- **Production**: Update `baseUrl` in environment file

## Troubleshooting

### 401 Unauthorized

- Token may have expired → Use "Refresh Token" endpoint
- Token may have been invalidated (password changed) → Login again
- Check that `Authorization: Bearer {token}` header is present

### 429 Too Many Requests

- Rate limit exceeded → Wait for reset time (check `RateLimit-Reset` header)
- Reduce request frequency

### 400 Bad Request

- Check request body format
- Verify required fields are present
- Check validation error messages in response

### 500 Internal Server Error

- Check backend server logs
- Verify database connection
- Verify OCI Object Storage configuration

## Last Updated

- **Date**: 2024-01-11
- **Backend Version**: Latest
- **API Version**: v1
