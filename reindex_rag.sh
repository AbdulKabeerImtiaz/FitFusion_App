#!/bin/bash

# RAG Service Reindex Script
# Triggers reindexing of exercises and food items after bulk upload

echo "🔄 RAG Service Reindex Script"
echo "=============================="
echo ""

# Configuration
RAG_URL="http://localhost:8000"
INTERNAL_API_KEY="fitfusion-internal-key-2024"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📊 Checking RAG service status..."
STATUS_RESPONSE=$(curl -s "$RAG_URL/status")

if echo "$STATUS_RESPONSE" | grep -q "status"; then
  echo -e "${GREEN}✅ RAG service is running${NC}"
else
  echo -e "${RED}❌ RAG service is not responding${NC}"
  echo "Please ensure containers are running: docker ps"
  exit 1
fi
echo ""

echo "🔄 Triggering full reindex..."
REINDEX_RESPONSE=$(curl -s -X POST "$RAG_URL/reindex" \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "full"}')

if echo "$REINDEX_RESPONSE" | grep -q "success\|completed"; then
  echo -e "${GREEN}✅ Reindex completed successfully${NC}"
  echo ""
  echo "Response: $REINDEX_RESPONSE"
else
  echo -e "${RED}❌ Reindex failed${NC}"
  echo "Response: $REINDEX_RESPONSE"
  echo ""
  echo "Alternative: Restart RAG container"
  echo "  docker restart fitfusion-rag"
  exit 1
fi
echo ""

echo "🔍 Verifying updated status..."
sleep 2
UPDATED_STATUS=$(curl -s "$RAG_URL/status")
echo "$UPDATED_STATUS"
echo ""

echo -e "${GREEN}🎉 RAG service reindexed successfully!${NC}"
echo "=============================="
echo ""
echo "The RAG service now has the latest exercises and food items."
echo "You can now generate workout and diet plans!"
