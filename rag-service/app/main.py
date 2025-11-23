"""
FitFusion RAG Microservice - FastAPI Application
Handles workout and diet plan generation using RAG
"""
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import time
from datetime import datetime

from app.config import INTERNAL_API_KEY
from app.rag.engine import RAGEngine
from app.db import test_connection

# Initialize FastAPI app
app = FastAPI(
    title="FitFusion RAG Service",
    description="Retrieval-Augmented Generation microservice for personalized fitness plans",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG Engine (singleton)
rag_engine: Optional[RAGEngine] = None

# ============================================
# Request/Response Models
# ============================================

class UserPreferences(BaseModel):
    """User preferences for plan generation"""
    # Personal metrics
    age: int = Field(..., ge=10, le=100)
    weight: float = Field(..., ge=30, le=300)
    height: float = Field(..., ge=100, le=250)
    gender: str = Field(..., pattern="^(male|female|other)$")
    
    # Fitness goals
    goal: str = Field(..., pattern="^(weight_gain|weight_loss|maintain|strength|stamina)$")
    experience_level: str = Field(default="beginner", pattern="^(beginner|intermediate|advanced)$")
    workout_location: str = Field(..., pattern="^(home|gym)$")
    
    # Workout preferences
    equipment_list: List[str] = Field(default_factory=list)
    target_muscle_groups: List[str] = Field(default_factory=list)
    duration_weeks: int = Field(default=4, ge=4, le=52)
    frequency_per_week: int = Field(default=5, ge=1, le=7)
    
    # Diet preferences
    dietary_preference: str = Field(default="mixed", pattern="^(veg|non_veg|mixed)$")
    excluded_foods: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    medical_conditions: List[str] = Field(default_factory=list)

class GeneratePlanRequest(BaseModel):
    """Request to generate a complete plan"""
    user_id: int
    preferences: UserPreferences

class GeneratePlanResponse(BaseModel):
    """Response containing generated plans"""
    status: str
    workout_plan: Dict
    diet_plan: Dict
    metadata: Dict

class ReindexRequest(BaseModel):
    """Request to reindex data"""
    tables: Optional[List[str]] = None
    mode: str = Field(default="full", pattern="^(full|incremental)$")

# ============================================
# Authentication
# ============================================

def verify_api_key(x_api_key: str = Header(...)):
    """Verify internal API key for service-to-service communication"""
    if x_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True

# ============================================
# Startup/Shutdown Events
# ============================================

@app.on_event("startup")
async def startup_event():
    """Initialize RAG engine on startup"""
    global rag_engine
    print("=" * 60)
    print("🚀 Starting FitFusion RAG Service")
    print("=" * 60)
    
    # Test database connection
    db_status = test_connection()
    print(f"📊 Database: {db_status}")
    
    # Initialize RAG engine
    try:
        rag_engine = RAGEngine()
        print("✓ RAG Engine ready")
    except Exception as e:
        print(f"✗ Failed to initialize RAG Engine: {e}")
        raise
    
    print("=" * 60)
    print("✓ FitFusion RAG Service is ready!")
    print("=" * 60)

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 Shutting down FitFusion RAG Service")

# ============================================
# Health & Status Endpoints
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {
        "status": "healthy",
        "service": "fitfusion-rag",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/status")
async def get_status():
    """Get detailed status of RAG engine"""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG engine not initialized")
    
    status = rag_engine.get_status()
    db_status = test_connection()
    
    return {
        **status,
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    }

# ============================================
# Plan Generation Endpoints
# ============================================

@app.post("/generate", response_model=GeneratePlanResponse)
async def generate_plan(
    request: GeneratePlanRequest,
    authenticated: bool = Depends(verify_api_key)
):
    """
    Generate personalized workout and diet plans
    Requires internal API key authentication
    """
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG engine not initialized")
    
    start_time = time.time()
    
    try:
        print(f"\n{'='*60}")
        print(f"📝 Generating plan for user {request.user_id}")
        print(f"{'='*60}")
        
        # Convert preferences to dict
        preferences_dict = request.preferences.model_dump()
        
        # Generate workout plan
        workout_plan = rag_engine.generate_workout_plan(preferences_dict)
        
        # Generate diet plan
        diet_plan = rag_engine.generate_diet_plan(preferences_dict)
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        print(f"✓ Plan generation completed in {duration_ms}ms")
        print(f"{'='*60}\n")
        
        return GeneratePlanResponse(
            status="success",
            workout_plan=workout_plan,
            diet_plan=diet_plan,
            metadata={
                "duration_ms": duration_ms,
                "user_id": request.user_id,
                "generated_at": datetime.now().isoformat(),
                "llm_model": "gemini-1.5-flash",
                "embedding_model": "models/embedding-001"
            }
        )
        
    except ValueError as e:
        print(f"✗ Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        import traceback
        print(f"✗ Generation error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")

# ============================================
# Admin Endpoints
# ============================================

@app.post("/reindex")
async def reindex_data(
    request: ReindexRequest,
    authenticated: bool = Depends(verify_api_key)
):
    """
    Trigger reindexing of vector database
    Requires internal API key authentication
    """
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG engine not initialized")
    
    try:
        result = rag_engine.reindex(tables=request.tables)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reindexing failed: {str(e)}")

# ============================================
# Root Endpoint
# ============================================

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "FitFusion RAG Microservice",
        "version": "1.0.0",
        "description": "Personalized workout and diet plan generation using RAG",
        "endpoints": {
            "health": "/health",
            "status": "/status",
            "generate": "/generate (POST, requires API key)",
            "reindex": "/reindex (POST, requires API key)"
        },
        "documentation": "/docs"
    }

# ============================================
# Run with: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# ============================================
