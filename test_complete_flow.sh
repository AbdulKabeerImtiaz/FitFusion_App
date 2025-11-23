#!/bin/bash

echo "=== Complete FitFusion Test Flow ==="
echo ""

# Step 1: Login as admin
echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitfusion.com", "password":"Admin@123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Token: ${TOKEN:0:50}..."
echo ""

# Step 2: Register a new user
echo "2. Registering a new test user..."
REGISTER_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User22",
    "email": "testuser22@example.com",
    "password": "Test22@123"
  }')

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
BODY=$(echo "$REGISTER_RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
    echo "✅ User registered successfully!"
    USER_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | sed 's/"id"://')
    TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')
    echo "User ID: $USER_ID"
    echo "Using user's token for plan generation"
elif [ "$HTTP_CODE" == "400" ]; then
    echo "⚠️  User might already exist, trying to login..."
    # Login as the test user
    TEST_LOGIN=$(curl -s -X POST http://localhost:8080/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"testuser@example.com", "password":"Test@123"}')
    
    USER_ID=$(echo "$TEST_LOGIN" | grep -o '"id":[0-9]*' | sed 's/"id"://')
    TOKEN=$(echo "$TEST_LOGIN" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')
    echo "User ID: $USER_ID"
else
    echo "❌ Registration failed with HTTP $HTTP_CODE"
    exit 1
fi

echo ""

# Step 3: Generate plan for the user
echo "3. Generating plan for user ID $USER_ID..."
PLAN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "http://localhost:8080/api/users/$USER_ID/generate-plan" \
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
else
    echo "❌ Plan generation failed with HTTP $HTTP_CODE"
    echo ""
    echo "Checking Spring logs for errors..."
    docker logs fitfusion-spring --tail 30
fi

echo ""
echo "=== Test Complete ==="
