# Workout Progress Tracking - Visual Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │   Dashboard      │              │   PlanDetails    │     │
│  │                  │              │                  │     │
│  │  📊 Stats:       │              │  Week 1, Day 1   │     │
│  │  • 5 Workouts    │◄─────────────│                  │     │
│  │  • 1.2K Calories │              │  ✓ Squat         │     │
│  │  • 150 Minutes   │              │  ✓ Bench Press   │     │
│  │                  │              │  ○ Deadlift      │     │
│  └──────────────────┘              └──────────────────┘     │
│         ▲                                   │                │
│         │                                   │                │
│         │ GET /stats                        │ POST /complete │
│         │                                   ▼                │
└─────────┼───────────────────────────────────┼────────────────┘
          │                                   │
┌─────────┼───────────────────────────────────┼────────────────┐
│         │          BACKEND API              │                │
├─────────┴───────────────────────────────────┴────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         WorkoutCompletionController                   │   │
│  │                                                        │   │
│  │  POST   /users/{id}/workout-completions              │   │
│  │  DELETE /users/{id}/workout-completions              │   │
│  │  GET    /users/{id}/workout-completions              │   │
│  │  GET    /users/{id}/stats?period=week                │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         WorkoutCompletionService                      │   │
│  │                                                        │   │
│  │  • markWorkoutComplete()                             │   │
│  │  • unmarkWorkoutComplete()                           │   │
│  │  • getUserStats(period)                              │   │
│  │  • getUserPlanCompletions()                          │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      WorkoutCompletionRepository                      │   │
│  │                                                        │   │
│  │  • save()                                             │   │
│  │  • delete()                                           │   │
│  │  • countWorkoutsByUserSince()                        │   │
│  │  • sumCaloriesByUserSince()                          │   │
│  │  • sumMinutesByUserSince()                           │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────┐
│                       ▼         DATABASE                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           workout_completion TABLE                    │   │
│  │                                                        │   │
│  │  id                 BIGINT (PK)                       │   │
│  │  user_id            BIGINT (FK → users)               │   │
│  │  plan_bundle_id     BIGINT (FK → plan_bundle)         │   │
│  │  week_number        INT                               │   │
│  │  day_number         INT                               │   │
│  │  exercise_name      VARCHAR(150)                      │   │
│  │  sets_completed     INT                               │   │
│  │  reps_completed     INT                               │   │
│  │  duration_minutes   INT                               │   │
│  │  calories_burned    INT                               │   │
│  │  notes              TEXT                              │   │
│  │  completed_at       TIMESTAMP                         │   │
│  │                                                        │   │
│  │  UNIQUE(user_id, plan_bundle_id, week, day, exercise)│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## User Journey Flow

```
1. USER OPENS PLAN
   │
   ├─► PlanDetails.jsx loads
   │   ├─► Fetches plan data
   │   └─► Fetches completions
   │
   ▼
2. USER SEES EXERCISES
   │
   ├─► Week 1, Day 1
   │   ├─► ✓ Barbell Squat (completed)
   │   ├─► ○ Bench Press (not completed)
   │   └─► ○ Deadlift (not completed)
   │
   ▼
3. USER CLICKS CHECKMARK
   │
   ├─► toggleExerciseCompletion()
   │   ├─► POST /users/1/workout-completions
   │   │   {
   │   │     planBundleId: 5,
   │   │     weekNumber: 1,
   │   │     dayNumber: 1,
   │   │     exerciseName: "Bench Press",
   │   │     setsCompleted: 4,
   │   │     repsCompleted: 10,
   │   │     durationMinutes: 5,
   │   │     caloriesBurned: 50
   │   │   }
   │   │
   │   ├─► Backend saves to database
   │   └─► Refreshes completions
   │
   ▼
4. CHECKMARK FILLS IN
   │
   ├─► Visual feedback
   │   ├─► ✓ Barbell Squat (completed)
   │   ├─► ✓ Bench Press (completed) ← NEW!
   │   └─► ○ Deadlift (not completed)
   │
   ▼
5. USER GOES TO DASHBOARD
   │
   ├─► Dashboard.jsx loads
   │   ├─► GET /users/1/stats?period=week
   │   │   Response: {
   │   │     workoutsCompleted: 2,
   │   │     caloriesBurned: 100,
   │   │     minutesExercised: 10
   │   │   }
   │   │
   │   └─► Displays real stats
   │
   ▼
6. STATS DISPLAYED
   │
   └─► 📊 Dashboard shows:
       ├─► 2 Workouts (this week)
       ├─► 100 Kcal Burned
       └─► 10 Minutes
```

## Data Calculation Example

```
User completes exercises over a week:

Monday (Week 1, Day 1):
  ✓ Squat          → 5 min, 50 cal
  ✓ Bench Press    → 5 min, 50 cal
  ✓ Deadlift       → 5 min, 50 cal
  Total: 3 exercises, 15 min, 150 cal

Wednesday (Week 1, Day 2):
  ✓ Pull-ups       → 5 min, 50 cal
  ✓ Rows           → 5 min, 50 cal
  Total: 2 exercises, 10 min, 100 cal

Friday (Week 1, Day 3):
  ✓ Overhead Press → 5 min, 50 cal
  Total: 1 exercise, 5 min, 50 cal

────────────────────────────────────────────
DASHBOARD STATS (This Week):
  Workouts Completed: 6
  Calories Burned: 300
  Minutes Exercised: 30
```

## Database Query Example

```sql
-- Get user stats for the past week
SELECT 
  COUNT(*) as workouts_completed,
  SUM(calories_burned) as total_calories,
  SUM(duration_minutes) as total_minutes
FROM workout_completion
WHERE user_id = 1
  AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

Result:
┌────────────────────┬────────────────┬───────────────┐
│ workouts_completed │ total_calories │ total_minutes │
├────────────────────┼────────────────┼───────────────┤
│                  6 │            300 │            30 │
└────────────────────┴────────────────┴───────────────┘
```

## State Management

```javascript
// PlanDetails.jsx
const [completions, setCompletions] = useState([
  {
    id: 1,
    weekNumber: 1,
    dayNumber: 1,
    exerciseName: "Barbell Squat",
    setsCompleted: 4,
    repsCompleted: 10,
    completedAt: "2025-11-30T10:00:00"
  }
]);

// Check if exercise is completed
const isExerciseCompleted = (exerciseName) => {
  return completions.some(c => 
    c.weekNumber === selectedWeek && 
    c.dayNumber === selectedDay && 
    c.exerciseName === exerciseName
  );
};

// Dashboard.jsx
const [stats, setStats] = useState({
  workoutsCompleted: 6,
  caloriesBurned: 300,
  minutesExercised: 30,
  period: "week"
});
```

## Key Features

✅ **Real-time Updates**: Stats update immediately after marking complete
✅ **Visual Feedback**: Checkmarks fill in when completed
✅ **No Duplicates**: Unique constraint prevents double-counting
✅ **Flexible Periods**: View stats by week/month/year/all-time
✅ **Cascade Delete**: Deleting plan removes all completions
✅ **User Isolation**: Users only see their own data
✅ **Optimized Queries**: Indexed for fast aggregation

## Next Steps

1. **Deploy**: Rebuild backend with new entity
2. **Test**: Mark exercises complete and verify stats
3. **Enhance**: Add progress charts and visualizations
4. **Integrate**: Connect with wearables for accurate data
