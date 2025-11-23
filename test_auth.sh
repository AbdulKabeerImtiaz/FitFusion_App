#!/bin/bash

echo "=== Testing FitFusion Authentication Flow ==="
echo ""

# Step 1: Login as admin
echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitfusion.com", "password":"Admin@123"}')

echo "Login Response:"
echo "$LOGIN_RESPONSE"
echo ""

# Extract token using grep and sed (no jq needed)
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed! No token received."
    echo "Check if the backend is running and the admin user exists."
    exit 1
fi

echo "✅ Token received: ${TOKEN:0:50}..."
echo ""

# Step 2: Access protected admin endpoint
echo "2. Accessing /api/admin/exercises with token..."
EXERCISES_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET http://localhost:8080/api/admin/exercises \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$EXERCISES_RESPONSE" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
BODY=$(echo "$EXERCISES_RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY"
echo ""

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Admin endpoint accessible!"
else
    echo "❌ Admin endpoint returned $HTTP_CODE (expected 200)"
fi
echo ""

# Step 3: Access user endpoint
echo "3. Accessing /api/users/1 with token..."
USER_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET http://localhost:8080/api/users/1 \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$USER_RESPONSE" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
BODY=$(echo "$USER_RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY"
echo ""

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ User endpoint accessible!"
else
    echo "❌ User endpoint returned $HTTP_CODE (expected 200)"
fi

echo ""
echo "=== Test Complete ==="
