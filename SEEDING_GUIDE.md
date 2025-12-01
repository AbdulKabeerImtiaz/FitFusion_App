# Data Seeding Guide

## Overview
After a fresh database setup, you need to seed exercises and food items for the RAG system to generate workout and diet plans.

## Prerequisites
- ✅ Docker containers running
- ✅ Admin user exists (created automatically by DataSeeder)
- ✅ `sample_exercises.json` file in project root
- ✅ `sample_food_items.json` file in project root

## Admin Credentials
- **Email**: `admin@fitfusion.com`
- **Password**: `admin123` (check DataSeeder.java if different)

## Method 1: Automated Scripts

### Using Bash (Linux/Mac/Git Bash)
```bash
chmod +x seed_data.sh
./seed_data.sh
```

### Using PowerShell (Windows)
```powershell
.\seed_data.ps1
```

## Method 2: Manual via Postman

### Step 1: Login as Admin
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "admin@fitfusion.com",
  "password": "admin123"
}
```

Copy the `token` from the response.

### Step 2: Upload Exercises
```
POST http://localhost:8080/api/admin/exercises/bulk
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

[paste entire content of sample_exercises.json]
```

### Step 3: Upload Food Items
```
POST http://localhost:8080/api/admin/food-items/bulk
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

[paste entire content of sample_food_items.json]
```

## Method 3: Using cURL

### Login
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitfusion.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### Upload Exercises
```bash
curl -X POST http://localhost:8080/api/admin/exercises/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @sample_exercises.json
```

### Upload Food Items
```bash
curl -X POST http://localhost:8080/api/admin/food-items/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @sample_food_items.json
```

## Verification

### Check Exercises
```bash
curl -X GET http://localhost:8080/api/admin/exercises \
  -H "Authorization: Bearer $TOKEN"
```

### Check Food Items
```bash
curl -X GET http://localhost:8080/api/admin/food-items \
  -H "Authorization: Bearer $TOKEN"
```

### Check Database Directly
```bash
# Count exercises
docker exec -i fitfusion-mysql mysql -u fitfusion_user -pfitfusion_pass_2024 fitfusion -e "SELECT COUNT(*) FROM exercise;"

# Count food items
docker exec -i fitfusion-mysql mysql -u fitfusion_user -pfitfusion_pass_2024 fitfusion -e "SELECT COUNT(*) FROM food_item;"
```

## Troubleshooting

### "Login failed"
- Check if containers are running: `docker ps`
- Verify admin password in `DataSeeder.java`
- Check backend logs: `docker logs fitfusion-spring`

### "File not found"
- Ensure you're in the project root directory
- Verify files exist: `ls sample_*.json`

### "Upload failed"
- Check if you're using the correct token
- Verify JSON files are valid
- Check backend logs for errors

## Sample Data Files

### sample_exercises.json
Contains exercises with:
- name
- muscle_group
- difficulty (beginner/intermediate/advanced)
- equipment_required
- video_url
- description

### sample_food_items.json
Contains food items with:
- food_name
- calories
- protein
- carbs
- fats
- serving_size
- meal_type

## After Seeding - IMPORTANT!

Once data is seeded, you MUST reindex the RAG service:

### Option 1: Restart RAG Container (Recommended)
```bash
docker restart fitfusion-rag
```

### Option 2: Use Reindex Script
```bash
# Bash
./reindex_rag.sh

# PowerShell
.\reindex_rag.ps1
```

### Option 3: Manual API Call
```bash
curl -X POST http://localhost:8000/reindex \
  -H "X-API-Key: fitfusion-internal-key-2024" \
  -H "Content-Type: application/json" \
  -d '{"mode": "full"}'
```

Once reindexed:
1. ✅ RAG service has indexed the data
2. ✅ Users can generate workout plans
3. ✅ Users can generate diet plans
4. ✅ Exercise details will be available

## Future Seeding

To avoid re-seeding after every restart:
- Use `docker-compose down` (without `-v`) to preserve data
- Only use `docker-compose down -v` when you want a fresh start
- Consider backing up the MySQL volume

## Backup Data (Optional)

### Export Current Data
```bash
# Export exercises
docker exec fitfusion-mysql mysqldump -u fitfusion_user -pfitfusion_pass_2024 fitfusion exercise > backup_exercises.sql

# Export food items
docker exec fitfusion-mysql mysqldump -u fitfusion_user -pfitfusion_pass_2024 fitfusion food_item > backup_food_items.sql
```

### Restore Data
```bash
# Restore exercises
docker exec -i fitfusion-mysql mysql -u fitfusion_user -pfitfusion_pass_2024 fitfusion < backup_exercises.sql

# Restore food items
docker exec -i fitfusion-mysql mysql -u fitfusion_user -pfitfusion_pass_2024 fitfusion < backup_food_items.sql
```
