# Workout Progress Tracking - Quick Setup Guide

## 🚀 Getting Started

### Step 1: Rebuild Backend
The new `WorkoutCompletion` entity needs to be added to your database.

```bash
# Stop containers
docker-compose down

# Rebuild and start (this will run the new SQL migration)
docker-compose up --build
```

The `03-workout-completion.sql` migration will automatically create the `workout_completion` table.

### Step 2: Verify Database
Check that the table was created:

```bash
# Connect to MySQL
docker exec -it fitfusion-mysql mysql -u root -prootpassword fitfusion

# Check table
SHOW TABLES;
DESCRIBE workout_completion;
```

You should see:
```
+-------------------+--------------+
| Field             | Type         |
+-------------------+--------------+
| id                | bigint       |
| user_id           | bigint       |
| plan_bundle_id    | bigint       |
| week_number       | int          |
| day_number        | int          |
| exercise_name     | varchar(150) |
| sets_completed    | int          |
| reps_completed    | int          |
| duration_minutes  | int          |
| calories_burned   | int          |
| notes             | text         |
| completed_at      | timestamp    |
+-------------------+--------------+
```

### Step 3: Test the Feature

#### A. Generate a Plan
1. Login to the app
2. Go to **Preferences**
3. Fill out your preferences
4. Click **Generate Plan**
5. Wait for plan generation

#### B. Mark Exercises Complete
1. Go to **Plans** page
2. Click **View Plan** on your active plan
3. Select **Week 1, Day 1**
4. You'll see exercises with checkmark buttons (○)
5. Click a checkmark to mark exercise complete
6. Checkmark fills in (✓) with green color
7. Click again to unmark

#### C. View Progress on Dashboard
1. Go to **Dashboard**
2. You should see updated stats:
   - **Workouts**: Number of exercises completed
   - **Kcal Burned**: Total calories (50 per exercise)
   - **Minutes**: Total time (5 min per exercise)

### Step 4: Test Different Scenarios

#### Scenario 1: Complete Multiple Exercises
```
Day 1:
✓ Squat
✓ Bench Press
✓ Deadlift

Dashboard should show:
- 3 Workouts
- 150 Kcal
- 15 Minutes
```

#### Scenario 2: Complete Across Multiple Days
```
Day 1: ✓ Squat, ✓ Bench Press
Day 2: ✓ Pull-ups, ✓ Rows

Dashboard should show:
- 4 Workouts
- 200 Kcal
- 20 Minutes
```

#### Scenario 3: Unmark Exercise
```
Before: 3 workouts, 150 kcal, 15 min
Unmark one exercise
After: 2 workouts, 100 kcal, 10 min
```

## 🔍 Troubleshooting

### Issue: Stats showing 0
**Solution**: Make sure you've marked at least one exercise complete

### Issue: Checkmarks not saving
**Check**:
1. Browser console for errors
2. Backend logs: `docker logs fitfusion-backend`
3. Database connection

### Issue: Table doesn't exist
**Solution**: 
```bash
# Manually run migration
docker exec -i fitfusion-mysql mysql -u root -prootpassword fitfusion < mysql-init/03-workout-completion.sql
```

### Issue: Stats not updating
**Solution**:
1. Refresh the page
2. Check API response: Open DevTools → Network → Look for `/stats` call
3. Verify completions exist in database:
```sql
SELECT * FROM workout_completion WHERE user_id = YOUR_USER_ID;
```

## 📊 API Testing with cURL

### Mark Exercise Complete
```bash
curl -X POST http://localhost:8080/api/users/1/workout-completions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planBundleId": 1,
    "weekNumber": 1,
    "dayNumber": 1,
    "exerciseName": "Barbell Squat",
    "setsCompleted": 4,
    "repsCompleted": 10,
    "durationMinutes": 5,
    "caloriesBurned": 50
  }'
```

### Get User Stats
```bash
curl -X GET "http://localhost:8080/api/users/1/stats?period=week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "workoutsCompleted": 5,
  "caloriesBurned": 250,
  "minutesExercised": 25,
  "period": "week"
}
```

### Get Plan Completions
```bash
curl -X GET "http://localhost:8080/api/users/1/workout-completions?planBundleId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 What's Working

✅ **Backend**:
- WorkoutCompletion entity created
- Repository with aggregation queries
- Service layer with business logic
- REST API endpoints
- Database migration script

✅ **Frontend**:
- PlanDetails shows checkmark buttons
- Clicking toggles completion
- Visual feedback (filled checkmark)
- Dashboard fetches real stats
- Stats display with formatting

✅ **Database**:
- workout_completion table
- Foreign keys to users and plan_bundle
- Unique constraint prevents duplicates
- Indexes for performance

## 🔮 Future Enhancements

### Phase 2: Better Metrics
- Calculate calories based on exercise type and user weight
- Track actual duration with timer
- Add weight/resistance tracking
- Progressive overload detection

### Phase 3: Visualizations
- Weekly progress charts
- Completion percentage per week
- Streak tracking
- Personal records

### Phase 4: Social Features
- Share achievements
- Workout buddies
- Leaderboards
- Challenge friends

### Phase 5: Integrations
- Sync with fitness trackers (Fitbit, Apple Watch)
- Export to CSV/PDF
- Integration with MyFitnessPal
- Strava integration

## 📝 Summary

You now have a complete workout progress tracking system that:

1. **Tracks** individual exercise completions
2. **Calculates** real-time statistics (workouts, calories, minutes)
3. **Displays** progress on the Dashboard
4. **Prevents** duplicate completions
5. **Supports** multiple time periods (week/month/year/all)
6. **Maintains** data integrity with foreign keys
7. **Provides** intuitive UI with visual feedback

The system is production-ready and can be extended with more advanced features as needed!
