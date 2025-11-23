#!/bin/bash

echo "=== Fixing .env file formatting ==="
echo ""

# Create a properly formatted .env file
cat > .env << 'EOF'
GOOGLE_API_KEY=AIzaSyAoo24RRVS4z9LXNqTn3Ih8Wdq7riEHuc8
JWT_SECRET=your-super-secret-jwt-key-that-is-at-least-256-bits-long-for-security-purposes-12345678
RAG_SERVICE_URL=http://fitfusion-rag:8000
INTERNAL_API_KEY=fitfusion-internal-key-2024
EOF

echo "✅ .env file has been reformatted"
echo ""
echo "Contents:"
cat .env
echo ""
echo "=== Done ==="
echo ""
echo "Now rebuild the Spring backend:"
echo "  docker-compose up --build -d spring-backend"
