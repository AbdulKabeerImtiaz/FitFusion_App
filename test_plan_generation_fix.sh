#!/bin/bash

echo "Testing Plan Generation with Token Limit Fix..."
echo "=============================================="

# Login first
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kabeer123@gmail.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✓ Logged in successfully (User ID: $USER_ID)"
echo ""

# Generate plan
echo "2. Generating workout and diet plan..."
PLAN_RESPONSE=$(curl -s -X POST "http://localhost/api/users/$USER_ID/generate-plan" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$PLAN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PLAN_RESPONSE"

if echo "$PLAN_RESPONSE" | grep -q "plan_bundle_id"; then
  echo ""
  echo "✓ Plan generated successfully!"
  BUNDLE_ID=$(echo $PLAN_RESPONSE | grep -o '"plan_bundle_id":[0-9]*' | grep -o '[0-9]*')
  echo "Bundle ID: $BUNDLE_ID"
else
  echo ""
  echo "❌ Plan generation failed"
fi
