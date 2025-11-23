#!/bin/bash

echo "=== FitFusion Plan Generation Test ==="
echo ""

# Step 1: Login as admin
echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitfusion.com", "password":"Admin@123"}')

echo "Login Response:"
echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed! No token received."
    exit 1
fi

echo "✅ Token received: ${TOKEN:0:50}..."
echo ""

# Step 2: Generate plan for user ID 2
echo "2. Generating fitness plan for user ID 2..."
PLAN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:8080/api/users/2/generate-plan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "WEIGHT_LOSS",
    "fitnessLevel": "INTERMEDIATE",
    "daysPerWeek": 5,
    "dietaryPreferences": ["VEGETARIAN"],
    "restrictions": ["No dairy"]
  }')

HTTP_CODE=$(echo "$PLAN_RESPONSE" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
BODY=$(echo "$PLAN_RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY"
echo ""

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Plan generated successfully!"
elif [ "$HTTP_CODE" == "403" ]; then
    echo "❌ Access denied (403). Possible issues:"
    echo "   - Token might be invalid or expired"
    echo "   - User ID 2 might not exist"
    echo "   - JWT_SECRET might not be set correctly"
elif [ "$HTTP_CODE" == "404" ]; then
    echo "❌ User ID 2 not found (404)"
    echo "   Please create a user with ID 2 first"
else
    echo "❌ Unexpected error: HTTP $HTTP_CODE"
fi

echo ""
echo "=== Test Complete ==="
