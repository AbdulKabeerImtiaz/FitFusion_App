#!/bin/bash

echo "=== Checking Spring Startup Logs ==="
echo ""

echo "Looking for JwtRequestFilter registration..."
docker logs fitfusion-spring 2>&1 | grep -i "jwtrequest"

echo ""
echo "Looking for filter registration..."
docker logs fitfusion-spring 2>&1 | grep -i "filter.*configured"

echo ""
echo "Looking for security configuration..."
docker logs fitfusion-spring 2>&1 | grep -i "will secure"

echo ""
echo "Looking for any errors..."
docker logs fitfusion-spring 2>&1 | grep -i "error\|exception\|failed" | head -20

echo ""
echo "=== Done ==="
