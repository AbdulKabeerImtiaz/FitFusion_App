# Plan Generation 403 Error Fix

## Issue
Getting 403 Forbidden error when trying to generate a plan at `/api/users/2/generate-plan`

## Root Causes

### 1. JWT Token Issues
- Token might be expired
- Token might not be included in the request
- Token might be for a different user

### 2. User ID Mismatch
- The frontend might be calling the endpoint with the wrong user ID
- The JWT token user ID doesn't match the path parameter user ID

## Solution

The application needs to verify that:
1. The JWT token is valid and not expired
2. The user ID in the JWT matches the user ID in the URL path
3. The token is being sent in the Authorization header

## Quick Fix

### Option 1: Logout and Login Again
1. Logout from the application
2. Login again to get a fresh JWT token
3. Try generating the plan again

### Option 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to generate a plan
4. Check the request headers for `Authorization: Bearer <token>`
5. If missing, there's an issue with the auth store

### Option 3: Clear Browser Storage
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Local Storage
4. Logout and login again

## Technical Details

The endpoint `/api/users/{id}/generate-plan` requires:
- Valid JWT token in Authorization header
- The user ID in the token must match the {id} in the URL
- User must have saved preferences before generating a plan

## Prevention

To prevent this issue:
1. Always check if user is authenticated before calling protected endpoints
2. Use the authenticated user's ID from the auth store
3. Handle token expiration gracefully with automatic logout
4. Show clear error messages to users

## Testing

To test if authentication is working:
```bash
# Get your token from localStorage in browser console
token="your_jwt_token_here"

# Test the endpoint
curl -X POST http://localhost:8080/api/users/2/generate-plan \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json"
```

If you get a 403, the token is invalid or expired.
If you get a 200, authentication is working.
