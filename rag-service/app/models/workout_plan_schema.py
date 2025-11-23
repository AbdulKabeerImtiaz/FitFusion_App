from pydantic import BaseModel, Field
from typing import List, Optional

class ExerciseDetail(BaseModel):
    """Individual exercise in a workout"""
    exercise_name: str = Field(..., description="Name of the exercise")
    sets: int = Field(..., ge=1, le=10, description="Number of sets")
    reps: int | str = Field(..., description="Number of repetitions or duration")
    rest_seconds: int = Field(..., ge=30, le=300, description="Rest time in seconds")
    notes: Optional[str] = Field(None, description="Additional instructions")

class WorkoutDay(BaseModel):
    """Single day's workout"""
    day_number: int = Field(..., ge=1, description="Day number in the week")
    focus: str = Field(..., description="Muscle group focus for the day")
    exercises: List[ExerciseDetail] = Field(..., description="List of exercises")

class WorkoutWeek(BaseModel):
    """Single week's workout plan"""
    week_number: int = Field(..., ge=1, description="Week number in the plan")
    days: List[WorkoutDay] = Field(..., min_items=1, description="Workout days in the week")

class WorkoutPlan(BaseModel):
    """Complete workout plan structure"""
    total_weeks: int = Field(..., ge=1, le=52, description="Total duration in weeks")
    frequency_per_week: int = Field(..., ge=1, le=7, description="Workouts per week")
    summary: str = Field(..., description="Overview of the workout plan")
    weeks: List[WorkoutWeek] = Field(..., min_items=1, description="Weekly breakdown")

    class Config:
        json_schema_extra = {
            "example": {
                "total_weeks": 4,
                "frequency_per_week": 5,
                "summary": "Progressive strength building plan",
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
                                        "notes": "Keep core engaged"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        }
