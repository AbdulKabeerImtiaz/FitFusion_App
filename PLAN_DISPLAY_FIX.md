# Plan Display Fix - Summary

## Problem Identified

The workout and diet plan details were not displaying on the frontend. The issue was:

1. **Backend Issue**: The `PlanBundle` entity only stored `workoutPlanId` and `dietPlanId` but didn't have JPA relationships to fetch the actual `WorkoutPlan` and `DietPlan` entities.

2. **Frontend Issue**: The frontend was expecting a flat structure with `day_1`, `day_2`, etc., but the actual data structure from the RAG service is nested with `weeks` containing `days`.

## Changes Made

### Backend Changes (Spring Boot)

**File**: `spring-backend/src/main/java/com/fitfusion/entity/PlanBundle.java`

Added JPA relationships to automatically fetch related plans:

```java
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "workout_plan_id", insertable = false, updatable = false)
private WorkoutPlan workoutPlan;

@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "diet_plan_id", insertable = false, updatable = false)
private DietPlan dietPlan;
```

This ensures that when you fetch a `PlanBundle`, it automatically includes the full `WorkoutPlan` and `DietPlan` objects with their JSON data.

### Frontend Changes (React)

**File**: `fitfusion-frontend/src/pages/user/PlanDetails.jsx`

#### 1. Updated Data Parsing

Changed from flat structure to nested structure:

**Before:**
```javascript
const currentWorkout = workoutPlan[`day_${selectedDay}`] || {};
```

**After:**
```javascript
// Extract all days from weeks structure
const allWorkoutDays = [];
if (workoutPlan.weeks && Array.isArray(workoutPlan.weeks)) {
  workoutPlan.weeks.forEach(week => {
    if (week.days && Array.isArray(week.days)) {
      allWorkoutDays.push(...week.days);
    }
  });
}

// Get current day's workout data
const currentWorkout = allWorkoutDays.find(day => day.day_number === selectedDay) || {};
```

#### 2. Updated Diet Plan Rendering

Changed from array of meals to object with meal types:

**Before:**
```javascript
{currentDiet.meals.map((meal, index) => ...)}
```

**After:**
```javascript
{Object.entries(currentDiet.meals).map(([mealType, mealItems]) => (
  mealItems && mealItems.length > 0 && (
    <div key={mealType}>
      <h4>{mealType.replace('_', ' ')}</h4>
      {mealItems.map((item, index) => ...)}
    </div>
  )
))}
```

#### 3. Added Debug Logging

Added console logs to help troubleshoot:
- Full API response
- Parsed workout and diet plans
- Current day's data

## Data Structure Reference

### Workout Plan Structure (from RAG service)

```json
{
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
```

### Diet Plan Structure (from RAG service)

```json
{
  "total_daily_calories": 2400,
  "total_daily_protein": 150,
  "summary": "High protein Pakistani diet",
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
    "lunch": [...],
    "dinner": [...],
    "snack_1": [...],
    "snack_2": [...]
  },
  "daily_totals": {
    "calories": 2400,
    "protein": 150,
    "carbs": 280,
    "fats": 65
  }
}
```

## How to Test

### 1. Access the Application

Open your browser and navigate to:
```
http://localhost
```

### 2. Login or Register

Use existing credentials or create a new account.

### 3. Generate a Plan

1. Go to Preferences page
2. Fill in your fitness preferences
3. Click "Generate Plan"
4. Wait for the plan to be generated (may take 30-60 seconds)

### 4. View Plan Details

1. Go to "My Plans" page
2. Click on a plan card
3. You should now see:
   - Day selector (Day 1, Day 2, etc.)
   - Workout tab with exercises for each day
   - Diet tab with meals organized by meal type

### 5. Check Browser Console

Open browser DevTools (F12) and check the Console tab for debug logs:
- `[PlanDetails] Full API response:` - Shows what the backend returned
- `[PlanDetails] Parsed workoutPlan:` - Shows the workout plan JSON
- `[PlanDetails] All workout days:` - Shows extracted days array
- `[PlanDetails] Current workout:` - Shows current day's workout

## Troubleshooting

### If plans still don't show:

1. **Check Backend Logs**:
   ```bash
   docker logs fitfusion-spring --tail 50
   ```

2. **Check if relationships are loaded**:
   Look for SQL queries in the logs that join `plan_bundle` with `workout_plan` and `diet_plan`.

3. **Verify Database**:
   ```bash
   docker exec -it fitfusion-mysql mysql -u fitfusion_user -pfitfusion_pass_2024 fitfusion
   ```
   
   Then run:
   ```sql
   SELECT pb.id, pb.workout_plan_id, pb.diet_plan_id, 
          wp.id as wp_id, dp.id as dp_id
   FROM plan_bundle pb
   LEFT JOIN workout_plan wp ON pb.workout_plan_id = wp.id
   LEFT JOIN diet_plan dp ON pb.diet_plan_id = dp.id;
   ```

4. **Check API Response**:
   Use curl or Postman to test the API directly:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/users/plans/1
   ```

### If you see "No workout data available for this day":

This means the day structure is not being parsed correctly. Check:
- The `workoutPlan.weeks` array exists
- Each week has a `days` array
- Each day has a `day_number` field

### If diet plan shows but no meals:

Check:
- The `dietPlan.meals` object exists
- It has keys like `breakfast`, `lunch`, `dinner`, etc.
- Each meal type has an array of meal items

## Next Steps

If you want to share the actual backend response, I can verify the structure matches what the frontend expects. You can get it by:

1. Opening browser DevTools (F12)
2. Going to the plan details page
3. Looking for the console log: `[PlanDetails] Full API response:`
4. Copy and share that JSON

This will help me verify everything is working correctly!
