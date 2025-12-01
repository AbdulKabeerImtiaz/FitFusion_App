#!/bin/bash

echo "Testing admin login..."
echo ""

# Login with admin credentials
response=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitfusion.com","password":"admin123"}')

echo "Login Response:"
echo "$response" | jq '.'

echo ""
echo "User Role:"
echo "$response" | jq '.user.role'
