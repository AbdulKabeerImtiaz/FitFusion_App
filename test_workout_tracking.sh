#!/bin/bash

echo "🧪 Testing Workout Progress Tracking Feature"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080/api"

echo "📝 Step 1: Login as test user"
echo "------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed. Creating test user...${NC}"
  
  # Register test user
  REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test User",
      "email": "test@example.com",
      "password": "password123"
    }')
  
  TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Registration failed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ User registered successfully${NC}"
else
  echo -e "${GREEN}✅ Login successful${NC}"
fi

echo "Token: ${TOKEN:0:20}..."
echo ""

# Get user ID from token (simplified - in real scenario decode JWT)
USER_ID=2  # Assuming test user has ID 2

echo "📊 Step 2: Get initial stats"
echo "------------------------------"
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/users/$USER_ID/stats?period=week" \
  -H "Authorization: Bearer $TOKEN")

echo "Initial stats: $STATS_RESPONSE"
echo ""

echo "✅ Step 3: Mark an exercise as complete"
echo "------------------------------"
COMPLETION_RESPONSE=$(curl -s -X POST "$BASE_URL/users/$USER_ID/workout-completions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planBundleId": 1,
    "weekNumber": 1,
    "dayNumber": 1,
    "exerciseName": "Test Squat",
    "setsCompleted": 4,
    "repsCompleted": 10,
    "durationMinutes": 5,
    "caloriesBurned": 50,
    "notes": "Felt strong!"
  }')

if echo "$COMPLETION_RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}✅ Exercise marked as complete${NC}"
  echo "Response: $COMPLETION_RESPONSE"
else
  echo -e "${RED}❌ Failed to mark exercise complete${NC}"
  echo "Response: $COMPLETION_RESPONSE"
fi
echo ""

echo "📊 Step 4: Get updated stats"
echo "------------------------------"
UPDATED_STATS=$(curl -s -X GET "$BASE_URL/users/$USER_ID/stats?period=week" \
  -H "Authorization: Bearer $TOKEN")

echo "Updated stats: $UPDATED_STATS"
echo ""

echo "📋 Step 5: Get all completions"
echo "------------------------------"
COMPLETIONS=$(curl -s -X GET "$BASE_URL/users/$USER_ID/workout-completions?planBundleId=1" \
  -H "Authorization: Bearer $TOKEN")

echo "Completions: $COMPLETIONS"
echo ""

echo "🎉 Testing complete!"
echo "===================="
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open http://localhost in your browser"
echo "2. Login with test@example.com / password123"
echo "3. Generate a workout plan"
echo "4. Mark exercises as complete"
echo "5. Check Dashboard for updated stats"
