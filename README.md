# FitFusion Backend

**Complete fitness application backend with AI-powered personalized workout and diet plan generation**

FitFusion uses a Retrieval-Augmented Generation (RAG) microservice powered by Google Gemini to create customized fitness plans based on user preferences, available equipment, dietary needs, and fitness goals.

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Client    │─────▶│  Spring Boot API │─────▶│  Python RAG     │
│  (Future)   │      │   (Port 8080)    │      │  (Port 8000)    │
└─────────────┘      └──────────────────┘      └─────────────────┘
                              │                          │
                              ▼                          ▼
                     ┌──────────────┐          ┌──────────────┐
                     │    MySQL     │          │  ChromaDB    │
                     │  (Port 3306) │          │  (Embedded)  │
                     └──────────────┘          └──────────────┘
```

### Components

- **Spring Boot Backend**: REST API, authentication, business logic, database management
- **Python RAG Service**: LlamaIndex + ChromaDB + Google Gemini for plan generation
- **MySQL Database**: Stores users, exercises, food items, plans, and logs
- **ChromaDB**: Vector database for semantic search over exercises and foods

---

## 🚀 Quick Start

### Prerequisites

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
2. **Google Gemini API Key** - Already configured in `.env`

### Start the Application

```bash
# Navigate to project directory
cd e:\SCD_Project_Backend

# Start all services
docker-compose up --build
```

This will start:
- MySQL on `localhost:3306`
- Spring Boot on `localhost:8080`
- Python RAG service on `localhost:8000`

**First startup takes 2-3 minutes** as it:
- Initializes MySQL database with schema and seed data
- Downloads Python dependencies
- Creates vector embeddings for exercises and food items

### Verify Services

```bash
# Check Spring Boot health
curl http://localhost:8080/actuator/health

# Check RAG service status
curl http://localhost:8000/status

# Check MySQL
docker exec -it fitfusion-mysql mysql -u fitfusion_user -pfitfusion_pass_2024 -e "USE fitfusion; SHOW TABLES;"
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:8080/api
```

### Authentication

All endpoints except `/api/auth/*` require JWT authentication.

**Header:**
```
Authorization: Bearer <your_jwt_token>
```

---

### 🔐 Auth Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Ali Ahmed",
  "email": "ali@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Ali Ahmed",
    "email": "ali@example.com"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ali@example.com",
  "password": "securePassword123"
}
```

---

### 👤 User Endpoints

#### Get User Profile
```http
GET /api/users/{id}
Authorization: Bearer <token>
```

#### Save/Update Preferences
```http
POST /api/users/{id}/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "age": 25,
  "weight": 70,
  "height": 175,
  "gender": "male",
  "goal": "weight_gain",
  "experienceLevel": "beginner",
  "workoutLocation": "home",
  "equipmentList": ["dumbbells", "yoga mat"],
  "targetMuscleGroups": ["chest", "arms", "legs"],
  "durationWeeks": 8,
  "dietaryPreference": "non_veg",
  "excludedFoods": [],
  "allergies": [],
  "medicalConditions": []
}
```

---

### 💪 Plan Generation Endpoints

#### Generate Personalized Plan
```http
POST /api/users/{id}/generate-plan
Authorization: Bearer <token>
```

**Response:**
```json
{
  "plan_bundle_id": 1,
  "workout_plan": {
    "total_weeks": 8,
    "frequency_per_week": 5,
    "summary": "Progressive strength building plan...",
    "weeks": [
      {
        "week_number": 1,
        "days": [
          {
            "day_number": 1,
            "focus": "Chest and Triceps",
            "exercises": [
              {
                "exercise_name": "Push Ups",
                "sets": 3,
                "reps": 12,
                "rest_seconds": 90,
                "notes": "Keep core tight"
              }
            ]
          }
        ]
      }
    ]
  },
  "diet_plan": {
    "total_daily_calories": 2800,
    "total_daily_protein": 150,
    "summary": "High protein Pakistani diet...",
    "meals": {
      "breakfast": [...],
      "lunch": [...],
      "dinner": [...],
      "snack_1": [...],
      "snack_2": [...]
    }
  },
  "metadata": {
    "duration_ms": 3456,
    "llm_model": "gemini-1.5-flash"
  }
}
```

#### Get User's Plans
```http
GET /api/users/{id}/plans
Authorization: Bearer <token>
```

#### Get Specific Plan Bundle
```http
GET /api/users/plans/{bundleId}
Authorization: Bearer <token>
```

---

### 🔧 Admin Endpoints

#### Manage Exercises
```http
GET    /api/admin/exercises
POST   /api/admin/exercises
PUT    /api/admin/exercises/{id}
DELETE /api/admin/exercises/{id}
```

#### Manage Food Items
```http
GET    /api/admin/food-items
POST   /api/admin/food-items
PUT    /api/admin/food-items/{id}
DELETE /api/admin/food-items/{id}
```

#### RAG Service Management
```http
# Get RAG status
GET /api/admin/rag/status

# Trigger reindexing
POST /api/admin/rag/reindex
Content-Type: application/json

{
  "mode": "full"
}
```

---

## 🗄️ Database Schema

### Key Tables

- **users** - User authentication
- **user_preferences_template** - Current user preferences
- **plan_bundle** - Links workout + diet plans with lifecycle
- **workout_plan** - Generated workout plans (JSON)
- **diet_plan** - Generated diet plans (JSON)
- **exercise** - Exercise database (RAG source)
- **food_item** - Pakistani food database (RAG source)
- **rag_logs** - Audit trail for LLM requests

**Seed Data Included:**
- 10 sample exercises (push-ups, squats, etc.)
- 15 Pakistani food items (biryani, daal, roti, etc.)

---

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Access MySQL
docker exec -it fitfusion-mysql mysql -u fitfusion_user -pfitfusion_pass_2024 fitfusion

# Access RAG service logs
docker logs fitfusion-rag

# Access Spring Boot logs
docker logs fitfusion-spring
```

---

## 🔑 Environment Variables

All configuration is in `.env` file (already created with your Gemini API key).

**Key Variables:**
- `GOOGLE_API_KEY` - Your Gemini API key ✅ Configured
- `JWT_SECRET` - JWT signing secret
- `MYSQL_PASSWORD` - Database password
- `INTERNAL_API_KEY` - Spring ↔ RAG authentication

---

## 🧪 Testing the System

### 1. Register a User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the returned `token`.

### 2. Set Preferences
```bash
curl -X POST http://localhost:8080/api/users/1/preferences \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 25,
    "weight": 70,
    "height": 175,
    "gender": "male",
    "goal": "weight_gain",
    "experienceLevel": "beginner",
    "workoutLocation": "home",
    "equipmentList": ["dumbbells"],
    "targetMuscleGroups": ["chest", "arms"],
    "durationWeeks": 4,
    "dietaryPreference": "non_veg"
  }'
```

### 3. Generate Plan
```bash
curl -X POST http://localhost:8080/api/users/1/generate-plan \
  -H "Authorization: Bearer <your_token>"
```

This will:
1. Call RAG service with user preferences
2. Retrieve relevant exercises and foods from vector DB
3. Generate personalized plans using Gemini
4. Save plans to database
5. Return complete workout + diet plan

---

## 📊 System Features

### ✅ Implemented

- User registration and JWT authentication
- User preference management
- RAG-powered plan generation
- Vector search over exercises and food items
- Persistent ChromaDB embeddings
- Plan lifecycle management
- Audit logging for LLM requests
- Admin CRUD for exercises and foods
- Docker deployment
- Health checks and monitoring

### 🔄 Future Enhancements

- Frontend React application
- Progress tracking
- Plan feedback system
- Email notifications
- PDF export
- Social features
- Mobile app

---

## 🛠️ Technology Stack

**Backend:**
- Spring Boot 3.2.1
- Spring Security + JWT
- Spring Data JPA
- MySQL 8.0

**RAG Service:**
- FastAPI
- LlamaIndex 0.10.11
- ChromaDB 0.4.22
- Google Gemini (gemini-1.5-flash)

**Deployment:**
- Docker & Docker Compose
- Multi-stage builds
- Health checks

---

## 📝 Project Structure

```
SCD_Project_Backend/
├── spring-backend/
│   ├── src/main/java/com/fitfusion/
│   │   ├── entity/          # JPA entities
│   │   ├── repository/      # Data access
│   │   ├── service/         # Business logic
│   │   ├── controller/      # REST APIs
│   │   ├── security/        # JWT & auth
│   │   └── config/          # Configuration
│   ├── pom.xml
│   └── Dockerfile
├── rag-service/
│   ├── app/
│   │   ├── loaders/         # DB data loaders
│   │   ├── rag/             # RAG engine & prompts
│   │   ├── models/          # Pydantic schemas
│   │   └── main.py          # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
├── mysql-init/
│   └── init.sql             # Schema + seed data
├── docker-compose.yml
├── .env
└── README.md
```

---

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker --version

# Check ports are free
netstat -ano | findstr "3306 8080 8000"

# View detailed logs
docker-compose logs
```

### RAG service fails to initialize
- **Cause**: Gemini API key invalid or MySQL not ready
- **Fix**: Check `.env` file, wait for MySQL health check

### Plan generation times out
- **Cause**: First-time embedding creation
- **Fix**: Normal on first run. Subsequent calls are fast (embeddings cached)

### Database connection errors
```bash
# Restart MySQL
docker-compose restart mysql

# Check MySQL logs
docker logs fitfusion-mysql
```

---

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure Docker Desktop is running
4. Check Gemini API quota

---

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ for FitFusion**
