#!/bin/bash

echo "=== FitFusion Plan Generation Diagnostic ==="
echo ""

USER_ID=5

# Step 1: Login
echo "1. Logging in as user with ID $USER_ID..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user111@gmail.com", "password":"Password111"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    exit 1
fi

echo "✅ Token received"
echo ""

# Step 2: Check if user exists
echo "2. Checking if user exists..."
USER_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "http://localhost:8080/api/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$USER_RESPONSE" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ User not found or unauthorized"
    exit 1
fi
echo "✅ User exists"
echo ""

# Step 3: Check if preferences exist
echo "3. Checking user preferences..."
PREFS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "http://localhost:8080/api/users/$USER_ID/preferences" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$PREFS_RESPONSE" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
BODY=$(echo "$PREFS_RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" != "200" ]; then
    echo "⚠️  Preferences might not exist"
else
    echo "✅ Preferences exist"
fi
echo ""

# Step 4: Check RAG service health
echo "4. Checking RAG service health..."
RAG_HEALTH=$(curl -s http://localhost:8000/health)
echo "RAG Health: $RAG_HEALTH"
echo ""

# Step 5: Test plan generation with verbose output
echo "5. Attempting to generate plan..."
PLAN_RESPONSE=$(curl -v -X POST "http://localhost:8080/api/users/$USER_ID/generate-plan" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "WEIGHT_LOSS",
    "fitnessLevel": "INTERMEDIATE",
    "daysPerWeek": 5,
    "dietaryPreferences": ["VEGETARIAN"],
    "restrictions": ["No dairy"]
  }' 2>&1)

echo "$PLAN_RESPONSE"
echo ""

# Step 6: Check Spring logs for errors
echo "6. Checking Spring logs for errors..."
echo "Recent errors:"
docker logs fitfusion-spring 2>&1 | grep -i "error\|exception" | tail -10

echo ""
echo "Recent JWT filter logs:"
docker logs fitfusion-spring 2>&1 | grep "JWT FILTER" | tail -5

echo ""
echo "Recent plan generation logs:"
docker logs fitfusion-spring 2>&1 | grep -i "generating plan\|plan.*user" | tail -10

echo ""
echo "=== Diagnostic Complete ==="
