#!/bin/bash

echo "=== NUCLEAR REBUILD - Complete Clean ==="
echo ""

echo "1. Stopping all containers..."
docker-compose down

echo "2. Removing spring-backend Docker image..."
docker rmi scd_project_backend-spring-backend --force 2>/dev/null || true

echo "3. Removing target directory..."
rm -rf ./spring-backend/target

echo "4. Pruning Docker build cache..."
docker builder prune -f

echo "5. Rebuilding spring-backend with NO CACHE..."
docker-compose build --no-cache --pull spring-backend

echo "6. Starting all services..."
docker-compose up -d

echo "7. Waiting 20 seconds for startup..."
sleep 20

echo "8. Testing login endpoint..."
curl -i -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitfusion.com", "password":"Admin@123"}'

echo ""
echo ""
echo "9. Checking logs..."
docker logs fitfusion-spring --tail 30

echo ""
echo "=== Nuclear Rebuild Complete ==="
echo "If you see HTTP 200 above, the fix worked!"
echo "If you see HTTP 403, the problem persists."
