"""
Prompt templates for workout and diet plan generation
"""

WORKOUT_PROMPT_TEMPLATE = """You are an expert fitness coach creating a personalized workout plan.

USER PROFILE:
{user_profile}

AVAILABLE EXERCISES (from database):
{exercise_context}

INSTRUCTIONS:
1. Create a {duration_weeks}-week workout plan with {frequency_per_week} sessions per week
2. ONLY use exercises from the provided database that match:
   - User's workout location ({workout_location})
   - Available equipment: {equipment_available}
   - Target muscle groups: {target_muscle_groups}
   - Difficulty level: {experience_level}

3. Structure the plan progressively (start easier, increase intensity)
4. Include proper rest periods between sets (60-120 seconds)
5. Vary exercises across days to prevent overtraining
6. Consider the user's goal: {fitness_goal}

OUTPUT FORMAT (STRICT JSON):
{{
  "total_weeks": {duration_weeks},
  "frequency_per_week": {frequency_per_week},
  "summary": "Brief overview of the plan approach",
  "weeks": [
    {{
      "week_number": 1,
      "days": [
        {{
          "day_number": 1,
          "focus": "Chest and Triceps",
          "exercises": [
            {{
              "exercise_name": "Push Ups",
              "sets": 3,
              "reps": 12,
              "rest_seconds": 90,
              "notes": "Keep core tight"
            }}
          ]
        }}
      ]
    }}
  ]
}}

CRITICAL: Return ONLY valid JSON. No additional text or explanations.
"""

DIET_PROMPT_TEMPLATE = """You are an expert nutritionist creating a personalized diet plan for a Pakistani user.

USER PROFILE:
{user_profile}

CALCULATED TARGETS:
- Daily Calories: {daily_calories} kcal
- Daily Protein: {daily_protein} g
- Daily Carbs: {daily_carbs} g
- Daily Fats: {daily_fats} g

AVAILABLE FOOD ITEMS (Pakistani cuisine from database):
{food_context}

INSTRUCTIONS:
1. Create a daily meal plan using ONLY foods from the provided database
2. Respect dietary preferences: {dietary_preference}
3. Avoid these foods: {excluded_foods}
4. Consider allergies: {allergies}
5. Distribute meals across: Breakfast, Lunch, Dinner, and 2 Snacks
6. Match the calculated macro targets (±5% tolerance)
7. Use realistic Pakistani portion sizes
8. Ensure variety and palatability

OUTPUT FORMAT (STRICT JSON):
{{
  "total_daily_calories": {daily_calories},
  "total_daily_protein": {daily_protein},
  "summary": "Brief overview of the diet approach",
  "meals": {{
    "breakfast": [
      {{
        "food_name": "Oats",
        "serving_size": "50g",
        "calories": 195,
        "protein": 8.5,
        "carbs": 33,
        "fats": 3.5
      }}
    ],
    "lunch": [],
    "dinner": [],
    "snack_1": [],
    "snack_2": []
  }},
  "daily_totals": {{
    "calories": 2400,
    "protein": 150,
    "carbs": 280,
    "fats": 65
  }}
}}

CRITICAL: Return ONLY valid JSON. No additional text or explanations.
"""

def build_workout_prompt(user_preferences: dict, exercise_context: str) -> str:
    """Build the complete workout generation prompt"""
    return WORKOUT_PROMPT_TEMPLATE.format(
        user_profile=format_user_profile(user_preferences),
        exercise_context=exercise_context,
        duration_weeks=user_preferences.get('duration_weeks', 4),
        frequency_per_week=user_preferences.get('frequency_per_week', 5),
        workout_location=user_preferences.get('workout_location', 'home'),
        equipment_available=', '.join(user_preferences.get('equipment_list', [])) or 'None',
        target_muscle_groups=', '.join(user_preferences.get('target_muscle_groups', [])) or 'Full body',
        experience_level=user_preferences.get('experience_level', 'beginner'),
        fitness_goal=user_preferences.get('goal', 'general fitness')
    )

def build_diet_prompt(user_preferences: dict, food_context: str, macros: dict) -> str:
    """Build the complete diet generation prompt"""
    return DIET_PROMPT_TEMPLATE.format(
        user_profile=format_user_profile(user_preferences),
        food_context=food_context,
        daily_calories=macros['calories'],
        daily_protein=macros['protein'],
        daily_carbs=macros['carbs'],
        daily_fats=macros['fats'],
        dietary_preference=user_preferences.get('dietary_preference', 'mixed'),
        excluded_foods=', '.join(user_preferences.get('excluded_foods', [])) or 'None',
        allergies=', '.join(user_preferences.get('allergies', [])) or 'None'
    )

def format_user_profile(preferences: dict) -> str:
    """Format user preferences into readable text"""
    return f"""
- Age: {preferences.get('age', 'N/A')}
- Weight: {preferences.get('weight', 'N/A')} kg
- Height: {preferences.get('height', 'N/A')} cm
- Gender: {preferences.get('gender', 'N/A')}
- Goal: {preferences.get('goal', 'N/A')}
- Experience Level: {preferences.get('experience_level', 'beginner')}
- Workout Location: {preferences.get('workout_location', 'home')}
- Medical Conditions: {', '.join(preferences.get('medical_conditions', [])) or 'None'}
    """.strip()

def calculate_macros(user_preferences: dict) -> dict:
    """
    Calculate daily macro targets based on user profile
    Uses Mifflin-St Jeor equation for TDEE
    """
    weight = user_preferences.get('weight', 70)  # kg
    height = user_preferences.get('height', 170)  # cm
    age = user_preferences.get('age', 25)
    gender = user_preferences.get('gender', 'male')
    goal = user_preferences.get('goal', 'maintain')
    
    # Calculate BMR (Basal Metabolic Rate)
    if gender == 'male':
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161
    
    # Activity multiplier (moderate activity assumed)
    activity_factor = 1.55
    tdee = bmr * activity_factor
    
    # Adjust based on goal
    if goal == 'weight_loss':
        calories = int(tdee - 500)  # 500 cal deficit
        protein_per_kg = 2.0  # Higher protein for muscle preservation
    elif goal == 'weight_gain':
        calories = int(tdee + 300)  # 300 cal surplus
        protein_per_kg = 1.8
    else:  # maintain, strength, stamina
        calories = int(tdee)
        protein_per_kg = 1.6
    
    # Calculate macros
    protein = int(weight * protein_per_kg)
    fats = int((calories * 0.25) / 9)  # 25% of calories from fats
    carbs = int((calories - (protein * 4) - (fats * 9)) / 4)
    
    return {
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fats': fats
    }
