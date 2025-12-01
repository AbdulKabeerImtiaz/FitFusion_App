# Quick Test Guide - Plan Display & Exercise Details

## ✅ What Was Fixed

1. **Rest Days**: Days 6-7 now show "Rest Day" instead of empty workout
2. **Exercise Details**: Click any exercise to see full details with YouTube video
3. **Plan Structure**: Properly parses nested weeks → days structure

---

## 🧪 Testing Steps

### Test 1: View Plan with Rest Days

1. Open browser: `http://localhost`
2. Login with your credentials
3. Go to "My Plans"
4. Click on plan ID 17 (or any plan)
5. **Test Days 1-5**: Should show workout exercises
6. **Test Days 6-7**: Should show blue "Rest Day" card

**Expected Result**:
- Days 1-5: List of exercises with sets, reps, rest time
- Days 6-7: Blue card with calendar icon and "Rest Day" message

---

### Test 2: Click Exercise for Details

1. On any workout day (1-5), click an exercise card
2. Should navigate to `/exercise/{exerciseName}`
3. Should see:
   - Exercise name in header
   - Difficulty badge (beginner/intermediate/advanced)
   - Muscle group badge
   - YouTube video (if available in database)
   - Exercise description
   - Equipment required list
   - Quick info sidebar

**Expected Result**:
- Page loads without errors
- Video plays (if URL exists)
- All exercise information displays
- Back button returns to plan

---

### Test 3: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Navigate to plan details
4. Look for these logs:

```
[PlanDetails] Full API response: {...}
[PlanDetails] Parsed workoutPlan: {...}
[PlanDetails] All workout days: [...]
[PlanDetails] Current workout (day X): {...}
```

5. Click an exercise
6. Look for:

```
[ExerciseDetail] Fetched exercise: {...}
```

**Expected Result**:
- No errors in console
- Logs show proper data structure
- API responses include `workoutPlan` and `dietPlan` objects

---

## 🔍 Verify Data Structure

### Check Plan Bundle Response

The API should return this structure:

```json
{
  "id": 17,
  "userId": 5,
  "workoutPlanId": 18,
  "dietPlanId": 17,
  "workoutPlan": {
    "id": 18,
    "planJson": {
      "total_weeks": 4,
      "frequency_per_week": 5,
      "summary": "...",
      "weeks": [
        {
          "week_number": 1,
          "days": [
            {
              "day_number": 1,
              "focus": "Chest and Triceps",
              "exercises": [...]
            }
          ]
        }
      ]
    },
    "totalWeeks": 4,
    "frequencyPerWeek": 5
  },
  "dietPlan": {
    "id": 17,
    "planJson": {
      "total_daily_calories": 2874,
      "total_daily_protein": 150,
      "meals": {
        "breakfast": [...],
        "lunch": [...],
        "dinner": [...],
        "snack_1": [...],
        "snack_2": [...]
      }
    }
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "Exercise Not Found"

**Cause**: Exercise name in plan doesn't match database

**Solution**: Check database for exact name
```sql
SELECT name FROM exercise WHERE name LIKE '%keyword%';
```

---

### Issue: No Video Showing

**Cause**: Exercise doesn't have `video_url` in database

**Check**:
```sql
SELECT name, video_url FROM exercise WHERE name = 'Exercise Name';
```

**Fix**: Add video URL
```sql
UPDATE exercise 
SET video_url = 'https://www.youtube.com/watch?v=VIDEO_ID'
WHERE name = 'Exercise Name';
```

---

### Issue: Days 6-7 Show Empty Instead of Rest Day

**Cause**: Frontend not detecting missing workout data

**Check Console**: Look for `currentWorkout` log - should be empty object `{}`

**Expected Behavior**: Empty object triggers "Rest Day" display

---

## 📊 Database Queries for Testing

### Check Plan 17 Details
```sql
SELECT 
  pb.id,
  pb.user_id,
  wp.total_weeks,
  wp.frequency_per_week,
  dp.total_daily_calories
FROM plan_bundle pb
LEFT JOIN workout_plan wp ON pb.workout_plan_id = wp.id
LEFT JOIN diet_plan dp ON pb.diet_plan_id = dp.id
WHERE pb.id = 17;
```

### Check Exercise Videos
```sql
SELECT 
  id,
  name,
  muscle_group,
  difficulty,
  CASE 
    WHEN video_url IS NOT NULL THEN 'Has Video'
    ELSE 'No Video'
  END as video_status
FROM exercise
ORDER BY name;
```

### Check Workout Days for Plan 17
```sql
SELECT 
  JSON_LENGTH(
    JSON_EXTRACT(wp.plan_json, '$.weeks[0].days')
  ) as days_in_week_1
FROM workout_plan wp
WHERE id = (SELECT workout_plan_id FROM plan_bundle WHERE id = 17);
```

---

## 🎯 Success Criteria

✅ **Plan Display**:
- Days 1-5 show exercises
- Days 6-7 show "Rest Day"
- No console errors

✅ **Exercise Details**:
- Clicking exercise navigates to detail page
- Video displays (if available)
- All exercise info shows
- Back button works

✅ **Diet Plan**:
- Meals organized by type (breakfast, lunch, etc.)
- Macros display correctly
- Food items show with serving sizes

---

## 📱 Test on Different Screens

1. **Desktop** (1920x1080): Full layout with sidebar
2. **Tablet** (768x1024): Responsive grid
3. **Mobile** (375x667): Stacked layout

---

## 🚀 Quick Commands

```bash
# Check all services
docker ps

# View backend logs
docker logs fitfusion-spring --tail 50

# View frontend logs
docker logs fitfusion-frontend --tail 50

# Restart services
docker-compose restart spring-backend frontend

# Check database
docker exec -it fitfusion-mysql mysql -u fitfusion_user -pfitfusion_pass_2024 fitfusion
```

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check backend logs: `docker logs fitfusion-spring`
3. Verify database has exercise data
4. Share console logs or screenshots

---

**All systems are ready for testing! 🎉**

Access the app at: **http://localhost**
