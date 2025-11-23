from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class MealItem(BaseModel):
    """Individual food item in a meal"""
    food_name: str = Field(..., description="Name of the food item")
    serving_size: str = Field(..., description="Serving size (e.g., '100g', '1 cup')")
    calories: float = Field(..., ge=0, description="Calories in this serving")
    protein: float = Field(..., ge=0, description="Protein in grams")
    carbs: float = Field(..., ge=0, description="Carbohydrates in grams")
    fats: float = Field(..., ge=0, description="Fats in grams")

class DailyTotals(BaseModel):
    """Total daily macros"""
    calories: float = Field(..., ge=0, description="Total daily calories")
    protein: float = Field(..., ge=0, description="Total daily protein")
    carbs: float = Field(..., ge=0, description="Total daily carbs")
    fats: float = Field(..., ge=0, description="Total daily fats")

class DietPlan(BaseModel):
    """Complete diet plan structure"""
    total_daily_calories: float = Field(..., ge=1000, le=5000, description="Target daily calories")
    total_daily_protein: float = Field(..., ge=50, le=400, description="Target daily protein in grams")
    summary: str = Field(..., description="Overview of the diet plan")
    meals: Dict[str, List[MealItem]] = Field(
        ..., 
        description="Meals organized by meal type (breakfast, lunch, dinner, snack_1, snack_2)"
    )
    daily_totals: DailyTotals = Field(..., description="Calculated daily macro totals")

    class Config:
        json_schema_extra = {
            "example": {
                "total_daily_calories": 2400,
                "total_daily_protein": 150,
                "summary": "High protein Pakistani diet for muscle gain",
                "meals": {
                    "breakfast": [
                        {
                            "food_name": "Oats",
                            "serving_size": "50g",
                            "calories": 195,
                            "protein": 8.5,
                            "carbs": 33,
                            "fats": 3.5
                        }
                    ],
                    "lunch": [],
                    "dinner": [],
                    "snack_1": [],
                    "snack_2": []
                },
                "daily_totals": {
                    "calories": 2400,
                    "protein": 150,
                    "carbs": 280,
                    "fats": 65
                }
            }
        }
