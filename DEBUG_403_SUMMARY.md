# FitFusion Backend - 403 Error Debugging Summary

## Current Status

### ✅ FIXED: Authentication Endpoints
- `/api/auth/login` - **Working** (HTTP 200)
- `/api/auth/register` - **Working** (HTTP 200)
- JWT tokens are being generated successfully

### ❌ ISSUE: Protected Endpoints
- `/api/users/{id}/generate-plan` - **Failing** (HTTP 403)
- All other protected endpoints likely failing with 403

## Root Cause

The `JwtRequestFilter` is **not processing JWT tokens** from the `Authorization: Bearer <token>` header. Requests with valid tokens are being treated as anonymous, resulting in 403 Forbidden errors.

## Why Code Changes Aren't Being Applied

The `docker-compose.yml` uses:
1. Volume mounts: `./spring-backend:/app`
2. Hot reload: `mvn spring-boot:run`

This setup caches compiled `.class` files, and even after:
- Multiple restarts
- Deleting `target/` directory
- Nuclear rebuild with `--no-cache`
- Running `mvn clean compile` inside the container

The old compiled `JwtRequestFilter.class` is still being used.

## Attempted Fixes

1. ✅ Added `shouldNotFilter()` method to `JwtRequestFilter` - **Not compiled**
2. ✅ Added extensive logging to `JwtRequestFilter` - **Not compiled**
3. ✅ Added `WebSecurityCustomizer` to `SecurityConfig` - **Worked temporarily, then removed**
4. ✅ Modified `SecurityConfig` to use `permitAll()` - **Working for auth endpoints only**

## Recommended Solution

### Option 1: Production Build (Recommended)
Modify `docker-compose.yml` to use the production Dockerfile instead of hot-reload:

```yaml
spring-backend:
  build:
    context: ./spring-backend
    dockerfile: Dockerfile
    # Remove: target: build
  container_name: fitfusion-spring
  environment:
    # ... same as before
  ports:
    - "8080:8080"
  # Remove volumes section
  # Remove command section
  networks:
    - fitfusion-network
  depends_on:
    mysql:
      condition: service_healthy
```

Then rebuild:
```bash
docker-compose down
docker-compose up --build -d
```

### Option 2: Manual Testing with Postman/Insomnia

1. **Login**:
   ```
   POST http://localhost:8080/api/auth/login
   Content-Type: application/json
   
   {
     "email": "admin@fitfusion.com",
     "password": "Admin@123"
   }
   ```

2. **Copy the token** from the response

3. **Generate Plan**:
   ```
   POST http://localhost:8080/api/users/1/generate-plan
   Authorization: Bearer <paste-token-here>
   Content-Type: application/json
   
   {
     "goal": "WEIGHT_LOSS",
     "fitnessLevel": "INTERMEDIATE",
     "daysPerWeek": 5,
     "dietaryPreferences": ["VEGETARIAN"],
     "restrictions": ["No dairy"]
   }
   ```

### Option 3: Debug the Running Filter

Check if the filter is even being called:

```bash
docker exec -it fitfusion-spring bash
# Inside container:
find /app/target -name "JwtRequestFilter.class"
# Check the timestamp - if it's old, the new code wasn't compiled
```

## Files Modified

1. `spring-backend/src/main/java/com/fitfusion/security/JwtRequestFilter.java`
   - Added logging
   - Added `shouldNotFilter()` method

2. `spring-backend/src/main/java/com/fitfusion/config/SecurityConfig.java`
   - Configured `permitAll()` for `/api/auth/**`

3. `.env`
   - Added `JWT_SECRET` (required for token generation)

## Next Steps

1. Try Option 1 (production build) to ensure code changes are compiled
2. If still failing, check `JwtUtil.java` for token validation logic
3. Verify `JWT_SECRET` is set correctly in `.env`
4. Check if there are any CORS issues in browser console (if testing from frontend)

## Test Scripts Created

- `test_auth.sh` - Tests login flow
- `test_plan_generation.sh` - Tests plan generation with admin token
- `test_complete_flow.sh` - Complete flow: register user → generate plan
- `nuclear_rebuild.sh` - Force complete rebuild
- `debug_jwt.sh` - Debug JWT authentication

## Success Criteria

When working correctly, you should see these logs:
```
Processing request: POST /api/users/1/generate-plan
Authorization Header: Present
JWT token found for user: admin@fitfusion.com
Loaded user details for: admin@fitfusion.com, authorities: [ROLE_ADMIN]
Successfully authenticated user: admin@fitfusion.com with authorities: [ROLE_ADMIN]
```

Currently, we see **none** of these logs, confirming the filter code isn't running.
