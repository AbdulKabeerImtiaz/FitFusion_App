#!/bin/bash

echo "=== Checking .env Configuration ==="
echo ""

ENV_FILE=".env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found! Creating it..."
    touch "$ENV_FILE"
fi

echo "Current .env contents:"
cat "$ENV_FILE"
echo ""

# Check for RAG_SERVICE_URL
if grep -q "RAG_SERVICE_URL" "$ENV_FILE"; then
    echo "✅ RAG_SERVICE_URL is set"
    CURRENT_VALUE=$(grep "RAG_SERVICE_URL" "$ENV_FILE")
    echo "Current value: $CURRENT_VALUE"
    
    # Check if it's an absolute URL
    if echo "$CURRENT_VALUE" | grep -q "http://"; then
        echo "✅ URL is absolute"
    else
        echo "❌ URL is NOT absolute! It should start with http://"
        echo "Recommended value: RAG_SERVICE_URL=http://fitfusion-rag:8000"
    fi
else
    echo "❌ RAG_SERVICE_URL is NOT set!"
    echo "Adding RAG_SERVICE_URL=http://fitfusion-rag:8000"
    echo "RAG_SERVICE_URL=http://fitfusion-rag:8000" >> "$ENV_FILE"
fi

echo ""

# Check for INTERNAL_API_KEY
if grep -q "INTERNAL_API_KEY" "$ENV_FILE"; then
    echo "✅ INTERNAL_API_KEY is set"
else
    echo "⚠️  INTERNAL_API_KEY is NOT set!"
    echo "Adding INTERNAL_API_KEY=fitfusion-internal-key-2024"
    echo "INTERNAL_API_KEY=fitfusion-internal-key-2024" >> "$ENV_FILE"
fi

echo ""
echo "=== Final .env contents ==="
cat "$ENV_FILE"
echo ""
echo "=== Done ==="
echo ""
echo "If changes were made, restart the Spring backend:"
echo "  docker-compose restart spring-backend"
