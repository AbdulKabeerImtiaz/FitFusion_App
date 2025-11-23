#!/bin/bash

echo "=== Testing JWT Authentication ==="
echo ""

# Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitfusion.com", "password":"Admin@123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    exit 1
fi

echo "✅ Got token: ${TOKEN:0:50}..."
echo ""

# Test with verbose curl to see full response
echo "2. Testing /api/users/2/generate-plan with verbose output..."
curl -v -X POST http://localhost:8080/api/users/2/generate-plan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"goal":"WEIGHT_LOSS","fitnessLevel":"INTERMEDIATE"}'

echo ""
echo ""
echo "3. Checking Spring logs for JWT processing..."
docker logs fitfusion-spring --tail 20

echo ""
echo "=== Test Complete ==="
