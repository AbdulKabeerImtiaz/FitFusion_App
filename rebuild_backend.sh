#!/bin/bash

echo "=== Rebuilding Spring Backend (Force Clean) ==="
echo ""

echo "1. Stopping spring-backend container..."
docker-compose stop spring-backend

echo "2. Removing spring-backend container..."
docker-compose rm -f spring-backend

echo "3. Rebuilding and starting spring-backend..."
docker-compose up --build -d spring-backend

echo "4. Waiting for container to start..."
sleep 10

echo "5. Checking logs..."
docker logs fitfusion-spring --tail 30

echo ""
echo "=== Rebuild Complete ==="
echo "Look for 'Processing request:' in the logs above to confirm new code is running."
