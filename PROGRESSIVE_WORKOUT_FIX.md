# Progressive Workout Plan Fix

## Problem

The AI was generating **identical exercises for all 4 weeks**. For example:
- Week 1, Day 1: Plank, Push Ups, Squats
- Week 2, Day 1: Plank, Push Ups, Squats (same!)
- Week 3, Day 1: Plank, Push Ups, Squats (same!)
- Week 4, Day 1: Plank, Push Ups, Squats (same!)

This defeats the purpose of a progressive training program where you should be increasing intensity and varying exercises over time.

## Root Cause

The RAG service prompt was too vague about progression. It said:
> "Structure the plan progressively (start easier, increase intensity)"

But didn't give specific instructions on:
- How to make each week different
- What progressive overload means
- How to vary exercises across weeks

The AI interpreted this as "keep the same exercises, maybe increase reps slightly" which resulted in nearly identical weeks.

---

## Solution

Updated the RAG prompt with **explicit progressive overload instructions**:

### New Prompt Instructions

```
3. PROGRESSIVE OVERLOAD - Each week MUST be different:
   - Week 1: Foundation (lower sets/reps, focus on form)
   - Week 2: Increase volume (add 1-2 reps OR 1 set)
   - Week 3: Increase intensity (add weight/difficulty OR more reps)
   - Week 4: Peak performance (highest volume/intensity)
   
4. EXERCISE VARIATION:
   - Use different exercises for the same muscle group across weeks
   - Example: Week 1 uses Push Ups, Week 2 uses Diamond Push Ups, Week 3 uses Decline Push Ups
   - Vary rep ranges: Week 1 (12-15 reps), Week 2 (10-12 reps), Week 3 (8-10 reps), Week 4 (6-8 reps with higher sets)
```

---

## What Changed

### File: `rag-service/app/rag/prompts.py`

**Before:**
```python
INSTRUCTIONS:
1. Create a {duration_weeks}-week workout plan...
2. ONLY use exercises from the provided database...
3. Structure the plan progressively (start easier, increase intensity)
4. Include proper rest periods...
```

**After:**
```python
INSTRUCTIONS:
1. Create a {duration_weeks}-week workout plan...
2. ONLY use exercises from the provided database...
3. PROGRESSIVE OVERLOAD - Each week MUST be different:
   - Week 1: Foundation (lower sets/reps, focus on form)
   - Week 2: Increase volume (add 1-2 reps OR 1 set)
   - Week 3: Increase intensity (add weight/difficulty OR more reps)
   - Week 4: Peak performance (highest volume/intensity)
4. EXERCISE VARIATION:
   - Use different exercises for the same muscle group across weeks
   - Example: Week 1 uses Push Ups, Week 2 uses Diamond Push Ups...
   - Vary rep ranges: Week 1 (12-15 reps), Week 2 (10-12 reps)...
```

---

## Expected Results (After Regenerating Plans)

### Week 1 - Foundation Phase
```
Day 1 - Chest Focus:
- Push Ups: 3 sets × 12 reps
- Dumbbell Chest Press: 3 sets × 12 reps
- Tricep Dips: 3 sets × 10 reps
```

### Week 2 - Volume Phase
```
Day 1 - Chest Focus:
- Diamond Push Ups: 4 sets × 10 reps (increased difficulty)
- Incline Push Ups: 3 sets × 12 reps (variation)
- Close Grip Push Ups: 3 sets × 10 reps (variation)
```

### Week 3 - Intensity Phase
```
Day 1 - Chest Focus:
- Decline Push Ups: 4 sets × 8 reps (higher difficulty)
- Explosive Push Ups: 3 sets × 8 reps (power variation)
- Weighted Dips: 4 sets × 8 reps (added resistance)
```

### Week 4 - Peak Phase
```
Day 1 - Chest Focus:
- Archer Push Ups: 5 sets × 6 reps (maximum difficulty)
- Plyometric Push Ups: 4 sets × 6 reps (explosive power)
- One-Arm Push Ups: 3 sets × 5 reps (advanced variation)
```

---

## How to Test

### 1. Generate a New Plan

Since existing plans already have the old format, you need to generate a **new plan** to see the improvements:

1. Login to the app
2. Go to Preferences
3. Update any preference (to trigger regeneration)
4. Click "Generate Plan"
5. Wait for generation (30-60 seconds)
6. View the new plan

### 2. Verify Week Differences

Navigate through all 4 weeks and check:

**Week 1:**
- Should have foundational exercises
- Higher rep ranges (12-15)
- Lower sets (3-4)
- Focus on form

**Week 2:**
- Different exercise variations
- Slightly lower reps (10-12)
- Added volume (more sets)

**Week 3:**
- More challenging variations
- Lower reps (8-10)
- Higher intensity

**Week 4:**
- Most challenging exercises
- Lowest reps (6-8)
- Highest sets (4-5)
- Peak performance

### 3. Check Database

Verify the new plan has different exercises:

```sql
-- Check Week 1 vs Week 2 exercises
SELECT 
  JSON_EXTRACT(plan_json, '$.weeks[0].days[0].exercises[0].exercise_name') as week1_ex1,
  JSON_EXTRACT(plan_json, '$.weeks[1].days[0].exercises[0].exercise_name') as week2_ex1,
  JSON_EXTRACT(plan_json, '$.weeks[0].days[0].exercises[0].reps') as week1_reps,
  JSON_EXTRACT(plan_json, '$.weeks[1].days[0].exercises[0].reps') as week2_reps
FROM workout_plan
WHERE id = (SELECT MAX(id) FROM workout_plan);
```

**Expected**: Different exercise names and/or different rep counts

---

## Why This Matters

### Progressive Overload Principles

1. **Adaptation**: Your body adapts to stress. Same exercises = no progress
2. **Variety**: Different exercises target muscles from different angles
3. **Periodization**: Structured progression prevents plateaus
4. **Injury Prevention**: Variation reduces repetitive strain

### Training Phases

**Week 1 (Foundation)**:
- Learn proper form
- Build base strength
- Prepare body for harder work

**Week 2 (Volume)**:
- Increase total work
- Build muscle endurance
- Prepare for intensity

**Week 3 (Intensity)**:
- Challenge muscles with harder variations
- Build strength
- Push limits

**Week 4 (Peak)**:
- Maximum performance
- Test improvements
- Prepare for next cycle

---

## Limitations

### Current Exercise Database

The quality of progression depends on having enough exercise variations in the database. For example:

**Good Progression (if database has these)**:
- Week 1: Push Ups
- Week 2: Diamond Push Ups
- Week 3: Decline Push Ups
- Week 4: Archer Push Ups

**Limited Progression (if database lacks variations)**:
- Week 1: Push Ups (3×12)
- Week 2: Push Ups (4×12)
- Week 3: Push Ups (4×10)
- Week 4: Push Ups (5×8)

### Solution: Add More Exercises

To improve progression, add exercise variations to the database:

```sql
-- Example: Add push-up variations
INSERT INTO exercise (name, muscle_group, difficulty, equipment_required, description, created_at, updated_at)
VALUES 
('Diamond Push Ups', 'chest', 'intermediate', '["none"]', 'Push ups with hands forming a diamond shape', NOW(), NOW()),
('Decline Push Ups', 'chest', 'intermediate', '["none"]', 'Push ups with feet elevated', NOW(), NOW()),
('Archer Push Ups', 'chest', 'advanced', '["none"]', 'One-arm push up variation', NOW(), NOW());
```

---

## Monitoring Plan Quality

### Check Exercise Diversity

```sql
-- Count unique exercises per week
SELECT 
  w.week_number,
  COUNT(DISTINCT e.exercise_name) as unique_exercises
FROM workout_plan wp
CROSS JOIN JSON_TABLE(
  wp.plan_json,
  '$.weeks[*]' COLUMNS(
    week_number INT PATH '$.week_number',
    days JSON PATH '$.days'
  )
) w
CROSS JOIN JSON_TABLE(
  w.days,
  '$[*].exercises[*]' COLUMNS(
    exercise_name VARCHAR(200) PATH '$.exercise_name'
  )
) e
WHERE wp.id = (SELECT MAX(id) FROM workout_plan)
GROUP BY w.week_number;
```

**Good Result**: Each week has different exercises
**Bad Result**: All weeks have the same exercises

---

## Future Improvements

### 1. Deload Week
Add a Week 5 with reduced volume for recovery:
```
Week 5 (Deload):
- Same exercises as Week 1
- 50% volume (fewer sets/reps)
- Active recovery
```

### 2. Exercise Substitution
If database lacks variations, use progressive overload:
```
Same exercise, but:
- Week 1: 3×12 @ 60% effort
- Week 2: 4×12 @ 70% effort
- Week 3: 4×10 @ 80% effort
- Week 4: 5×8 @ 90% effort
```

### 3. Periodization Models
Implement different training models:
- Linear Periodization (gradual increase)
- Undulating Periodization (varied intensity)
- Block Periodization (focused phases)

---

## Summary

✅ **Updated RAG prompt** with explicit progressive overload instructions
✅ **Rebuilt RAG service** with new prompt
✅ **New plans will have varied exercises** across weeks
⚠️ **Existing plans** still have old format (need regeneration)
📊 **Quality depends** on exercise database diversity

**Action Required**: Generate a new plan to see the improvements!

---

## Testing Checklist

- [ ] Generate a new workout plan
- [ ] Navigate to Week 1, Day 1 - note exercises
- [ ] Navigate to Week 2, Day 1 - verify different exercises
- [ ] Navigate to Week 3, Day 1 - verify progression
- [ ] Navigate to Week 4, Day 1 - verify peak difficulty
- [ ] Check rep ranges decrease across weeks
- [ ] Check sets increase across weeks
- [ ] Verify exercise variations are used

If all checks pass, the progressive overload is working! 🎉
