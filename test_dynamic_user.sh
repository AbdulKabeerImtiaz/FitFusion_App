#!/bin/bash

# Base URL
BASE_URL="http://localhost:8080/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "=== FitFusion Dynamic User Test ==="

# 1. Register a new random user
EMAIL="user$(date +%s)@gmail.com"
PASSWORD="password123"
NAME="Test$(date +%s) User"

echo -e "\n1. Registering new user: $EMAIL..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$NAME\", \"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

if echo "$REGISTER_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✅ User registered successfully${NC}"
    # Extract User ID (using grep/sed since jq might not be available)
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "   User ID: $USER_ID"
else
    echo -e "${RED}❌ Registration failed${NC}"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

# 2. Login to get token
echo -e "\n2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Token received${NC}"
else
    echo -e "${RED}❌ Login failed${NC}"
    exit 1
fi

# 3. Set Preferences
echo -e "\n3. Setting preferences for User $USER_ID..."
PREFERENCES='{
  "age": 20,
  "weight": 78.0,
  "height": 177.0,
  "gender": "male",
  "goal": "weight_gain",
  "experienceLevel": "advanced",
  "workoutLocation": "gym",
  "equipmentList": [],
  "targetMuscleGroups": ["arms", "chest", "back", "shoulders","legs"],
  "durationWeeks": 9,
  "dietaryPreference": "non_veg",
  "excludedFoods": [],
  "allergies": [],
  "medicalConditions": []
}'

PREF_RESPONSE=$(curl -s -X POST "$BASE_URL/users/$USER_ID/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PREFERENCES")

echo "Preferences Response: $PREF_RESPONSE"

if echo "$PREF_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✅ Preferences saved${NC}"
else
    echo -e "${RED}❌ Failed to save preferences${NC}"
    echo "Response: $PREF_RESPONSE"
    exit 1
fi

# 4. Generate Plan
echo -e "\n4. Generating plan for User $USER_ID..."
PLAN_RESPONSE=$(curl -s -X POST "$BASE_URL/users/$USER_ID/generate-plan" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$PLAN_RESPONSE" | grep -q "workout_plan"; then
    echo -e "${GREEN}✅ Plan generated successfully${NC}"
    
    # Print the plan (Raw)
    echo -e "\n--- Generated Plan (Raw) ---"
    echo "$PLAN_RESPONSE"
    echo -e "----------------------\n"

    # Verify User ID
    if echo "$PLAN_RESPONSE" | grep -q "\"user_id\": $USER_ID"; then
        echo -e "${GREEN}✅ Verified User ID matches: $USER_ID${NC}"
    else
        echo -e "${RED}❌ User ID mismatch!${NC}"
    fi

    # Verify Preferences in Plan
    echo -e "\nVerifying Preferences:"
    
    # 1. Duration (4 weeks)
    if echo "$PLAN_RESPONSE" | grep -q "\"total_weeks\": 7"; then
        echo -e "${GREEN}✅ Duration matches: 7 weeks${NC}"
    else
        echo -e "${RED}❌ Duration mismatch! Expected 7 weeks.${NC}"
    fi

    # 2. Goal (Weight Gain) - Check in summary
    if echo "$PLAN_RESPONSE" | grep -i -q "weight_gain"; then
        echo -e "${GREEN}✅ Goal matches: 'Weight Gain' found in summary${NC}"
    else
        echo -e "${RED}❌ Goal mismatch! 'Weight Gain' not found in summary.${NC}"
    fi

    # 3. Location (Home) - Check in summary
    if echo "$PLAN_RESPONSE" | grep -i -q "gym"; then
        echo -e "${GREEN}✅ Location matches: 'Gym' found in summary${NC}"
    else
        echo -e "${RED}❌ Location mismatch! 'Gym' not found in summary.${NC}"
    fi

    # 4. Dietary Preference (Veg) - Check in diet summary or food items
    if echo "$PLAN_RESPONSE" | grep -i -q "non_veg"; then
        echo -e "${GREEN}✅ Diet matches: 'Non-Veg' found in plan${NC}"
    else
        echo -e "${RED}❌ Diet mismatch! 'Non-Veg' not found in plan.${NC}"
    fi

else
    echo -e "${RED}❌ Plan generation failed${NC}"
    echo "Response: $PLAN_RESPONSE"
    exit 1
fi

echo -e "\n=== Test Complete ==="
