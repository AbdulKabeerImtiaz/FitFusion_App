#!/bin/bash

echo "=== Force Maven Clean Inside Container ==="
echo ""

echo "1. Stopping spring-backend..."
docker-compose stop spring-backend

echo "2. Removing target directory on host..."
rm -rf ./spring-backend/target

echo "3. Starting spring-backend (will trigger Maven compile)..."
docker-compose up -d spring-backend

echo "4. Forcing Maven clean compile inside container..."
docker exec fitfusion-spring mvn clean compile -f /app/pom.xml

echo "5. Restarting spring-backend to pick up new classes..."
docker-compose restart spring-backend

echo "6. Waiting for startup..."
sleep 15

echo "7. Checking logs..."
docker logs fitfusion-spring --tail 30

echo ""
echo "=== Done ==="
echo "Now try: bash test_auth.sh"
