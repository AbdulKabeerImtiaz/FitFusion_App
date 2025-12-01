"""
Prompt templates for workout and diet plan generation
"""

WORKOUT_PROMPT_TEMPLATE = """Create {duration_weeks}-week workout for {fitness_goal}, {experience_level}, {workout_location}.

EXERCISES:
{exercise_context}

CRITICAL RULES:
1. VARIETY: NEVER repeat same exercise on same weekday across weeks. Week1 Day1 ≠ Week2 Day1.
2. MUSCLE MATCHING: Only use exercises that match the day's focus:
   - Day1 Chest+Triceps: chest/triceps exercises only
   - Day2 Back+Biceps: back/biceps exercises only  
   - Day3 Legs+Core: legs/core/abs exercises only
   - Day4 Shoulders+Abs: shoulders/abs exercises only
   - Day5 Full Body: mix of all muscle groups
3. PROGRESSION: W1-2(3×10-12,60s) W3-4(4×6-8,90s) W5-6(3×15-20,45s) W7-8(2×8-10,90s)
4. VOLUME: 4-5 exercises per day
5. Equipment: {equipment_available}, Location: {workout_location}

JSON (no markdown):
{{
  "total_weeks": {duration_weeks},
  "frequency_per_week": {frequency_per_week},
  "summary": "Brief overview",
  "weeks": [
    {{
      "week_number": 1,
      "days": [
        {{
          "day_number": 1,
          "focus": "Chest and Triceps",
          "exercises": [
            {{"exercise_name": "Push Ups", "sets": 3, "reps": 12, "rest_seconds": 90, "notes": "Control"}}
          ]
        }}
      ]
    }}
  ]
}}

Generate ALL {duration_weeks} weeks, {frequency_per_week} days. Return ONLY JSON."""

DIET_PROMPT_TEMPLATE = """Create UNIQUE Pakistani diet for this specific user.

USER: Age {age}, Weight {weight}kg, Height {height}cm, Gender {gender}
GOAL: {fitness_goal}
PREFERENCE: {dietary_preference}
AVOID: {excluded_foods}, ALLERGIES: {allergies}
TARGETS: {daily_calories}kcal, {daily_protein}g protein, {daily_carbs}g carbs, {daily_fats}g fats

FOODS:
{food_context}

CRITICAL - PERSONALIZATION RULES:
1. CREATE VARIETY: Select DIFFERENT food combinations for each user based on their goal
2. GOAL-BASED SELECTION:
   - weight_loss: High protein (eggs, chicken, fish), low carb (avoid rice/biryani), vegetables
   - weight_gain: High carb (rice, roti, biryani), moderate protein, healthy fats
   - muscle_gain: Very high protein (chicken, beef, eggs, lentils), moderate carb
3. PREFERENCE MATCHING:
   - veg: Only vegetarian items (no chicken/beef/fish)
   - non_veg: Include meat proteins
   - mixed: Balance of both
4. AVOID REPETITION: Don't use same meal template for all users
5. Match macros ±5%

JSON format:
{{
  "total_daily_calories": {daily_calories},
  "total_daily_protein": {daily_protein},
  "summary": "Personalized for {fitness_goal}",
  "meals": {{
    "breakfast": [{{"food_name": "Food", "serving_size": "Xg", "calories": 0, "protein": 0, "carbs": 0, "fats": 0}}],
    "lunch": [],
    "dinner": [],
    "snack_1": [],
    "snack_2": []
  }},
  "daily_totals": {{"calories": {daily_calories}, "protein": {daily_protein}, "carbs": {daily_carbs}, "fats": {daily_fats}}}
}}

Return ONLY JSON."""

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
        age=user_preferences.get('age', 25),
        weight=user_preferences.get('weight', 70),
        height=user_preferences.get('height', 170),
        gender=user_preferences.get('gender', 'male'),
        food_context=food_context,
        daily_calories=macros['calories'],
        daily_protein=macros['protein'],
        daily_carbs=macros['carbs'],
        daily_fats=macros['fats'],
        fitness_goal=user_preferences.get('goal', 'general fitness'),
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
