#!/bin/bash

echo "=== Force Clean Rebuild of Spring Backend ==="
echo ""

echo "1. Stopping all containers..."
docker-compose down

echo "2. Removing target directory (Maven cache)..."
rm -rf ./spring-backend/target

echo "3. Rebuilding with --no-cache..."
docker-compose build --no-cache spring-backend

echo "4. Starting all containers..."
docker-compose up -d

echo "5. Waiting for backend to start..."
sleep 15

echo "6. Checking logs..."
docker logs fitfusion-spring --tail 30

echo ""
echo "=== Rebuild Complete ==="
echo "Look for 'Processing request:' in the logs above."
echo "If you still don't see it, the shouldNotFilter method isn't being called."
