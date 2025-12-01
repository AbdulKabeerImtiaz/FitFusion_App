#!/bin/bash

# FitFusion Data Seeding Script
# This script seeds exercises and food items into the database

echo "🌱 FitFusion Data Seeding Script"
echo "=================================="
echo ""

# Configuration
BASE_URL="http://localhost:8080/api"
ADMIN_EMAIL="admin@fitfusion.com"
ADMIN_PASSWORD="admin123"  # Change this if your admin password is different

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Login as admin
echo "📝 Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed. Please check admin credentials.${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Upload exercises
echo "🏋️  Step 2: Uploading exercises from sample_exercises.json..."
if [ ! -f "sample_exercises.json" ]; then
  echo -e "${RED}❌ sample_exercises.json not found!${NC}"
  exit 1
fi

EXERCISES_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/exercises/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @sample_exercises.json)

if echo "$EXERCISES_RESPONSE" | grep -q "error\|Error"; then
  echo -e "${RED}❌ Failed to upload exercises${NC}"
  echo "Response: $EXERCISES_RESPONSE"
else
  echo -e "${GREEN}✅ Exercises uploaded successfully${NC}"
  # Count exercises
  EXERCISE_COUNT=$(cat sample_exercises.json | grep -o '"name"' | wc -l)
  echo "   Uploaded approximately $EXERCISE_COUNT exercises"
fi
echo ""

# Step 3: Upload food items
echo "🍎 Step 3: Uploading food items from sample_food_items.json..."
if [ ! -f "sample_food_items.json" ]; then
  echo -e "${RED}❌ sample_food_items.json not found!${NC}"
  exit 1
fi

FOOD_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/food-items/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @sample_food_items.json)

if echo "$FOOD_RESPONSE" | grep -q "error\|Error"; then
  echo -e "${RED}❌ Failed to upload food items${NC}"
  echo "Response: $FOOD_RESPONSE"
else
  echo -e "${GREEN}✅ Food items uploaded successfully${NC}"
  # Count food items
  FOOD_COUNT=$(cat sample_food_items.json | grep -o '"food_name"' | wc -l)
  echo "   Uploaded approximately $FOOD_COUNT food items"
fi
echo ""

# Step 4: Verify data
echo "🔍 Step 4: Verifying data..."
EXERCISE_CHECK=$(curl -s -X GET "$BASE_URL/admin/exercises" \
  -H "Authorization: Bearer $TOKEN")

FOOD_CHECK=$(curl -s -X GET "$BASE_URL/admin/food-items" \
  -H "Authorization: Bearer $TOKEN")

if echo "$EXERCISE_CHECK" | grep -q '"id"'; then
  echo -e "${GREEN}✅ Exercises verified in database${NC}"
else
  echo -e "${YELLOW}⚠️  Could not verify exercises${NC}"
fi

if echo "$FOOD_CHECK" | grep -q '"id"'; then
  echo -e "${GREEN}✅ Food items verified in database${NC}"
else
  echo -e "${YELLOW}⚠️  Could not verify food items${NC}"
fi
echo ""

echo "🎉 Data seeding complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Register a user account at http://localhost"
echo "2. Set your preferences"
echo "3. Generate your first workout plan!"
