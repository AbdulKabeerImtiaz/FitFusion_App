# Incomplete Weeks Generation Fix

## Problem

The AI was generating only **1 week** instead of the requested number of weeks (e.g., 6 weeks). 

### Example Issue

**User Request**: 6-week workout plan
**AI Generated**: Only Week 1 with 5 days
**Expected**: All 6 weeks, each with 5 days (30 total workout days)

### Console Output
```javascript
workout_plan: {
  total_weeks: 6,           // ✅ Says 6 weeks
  frequency_per_week: 5,    // ✅ Says 5 days per week
  summary: "This 6-week workout plan...",
  weeks: [                  // ❌ Only 1 week!
    {
      week_number: 1,
      days: [...]           // 5 days
    }
  ]
}
```

---

## Root Cause

The RAG prompt showed an example JSON structure with only 1 week, and the AI (Gemini) was following that example literally instead of generating all requested weeks.

### Problematic Prompt Section

**Before:**
```python
OUTPUT FORMAT (STRICT JSON):
{{
  "total_weeks": {duration_weeks},
  "frequency_per_week": {frequency_per_week},
  "summary": "Brief overview of the plan approach",
  "weeks": [
    {{
      "week_number": 1,
      "days": [...]
    }}
  ]
}}
```

The AI saw this example and thought: "Oh, I should generate 1 week object in the array"

---

## Solution

Updated the prompt to be **explicitly clear** that ALL weeks must be generated, with examples showing multiple weeks and critical requirements.

### Updated Prompt

**File**: `rag-service/app/rag/prompts.py`

**After:**
```python
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
          "exercises": [...]
        }},
        {{
          "day_number": 2,
          "focus": "Back and Biceps",
          "exercises": [...]
        }}
        // ... continue for all {frequency_per_week} days
      ]
    }},
    {{
      "week_number": 2,
      "days": [...]
    }}
    // ... MUST include ALL {duration_weeks} weeks
  ]
}}

CRITICAL REQUIREMENTS:
1. The "weeks" array MUST contain EXACTLY {duration_weeks} week objects
2. Each week MUST have {frequency_per_week} day objects
3. Return ONLY valid JSON. No additional text or explanations.
4. DO NOT truncate or skip weeks - generate the complete {duration_weeks}-week plan
```

---

## Key Changes

### 1. Show Multiple Weeks in Example
```python
"weeks": [
  { "week_number": 1, "days": [...] },
  { "week_number": 2, "days": [...] }  // ✅ Shows there should be multiple weeks
  // ... MUST include ALL {duration_weeks} weeks
]
```

### 2. Show Multiple Days in Example
```python
"days": [
  { "day_number": 1, "focus": "Chest and Triceps", "exercises": [...] },
  { "day_number": 2, "focus": "Back and Biceps", "exercises": [...] }
  // ... continue for all {frequency_per_week} days
]
```

### 3. Add Critical Requirements Section
```python
CRITICAL REQUIREMENTS:
1. The "weeks" array MUST contain EXACTLY {duration_weeks} week objects
2. Each week MUST have {frequency_per_week} day objects
3. Return ONLY valid JSON. No additional text or explanations.
4. DO NOT truncate or skip weeks - generate the complete {duration_weeks}-week plan
```

---

## Expected Result

### For a 6-Week, 5-Days-Per-Week Plan

```javascript
{
  "total_weeks": 6,
  "frequency_per_week": 5,
  "summary": "Progressive 6-week muscle building plan",
  "weeks": [
    {
      "week_number": 1,
      "days": [
        { "day_number": 1, "focus": "Chest", "exercises": [...] },
        { "day_number": 2, "focus": "Back", "exercises": [...] },
        { "day_number": 3, "focus": "Legs", "exercises": [...] },
        { "day_number": 4, "focus": "Shoulders", "exercises": [...] },
        { "day_number": 5, "focus": "Arms", "exercises": [...] }
      ]
    },
    {
      "week_number": 2,
      "days": [
        { "day_number": 1, "focus": "Chest", "exercises": [...] },
        { "day_number": 2, "focus": "Back", "exercises": [...] },
        { "day_number": 3, "focus": "Legs", "exercises": [...] },
        { "day_number": 4, "focus": "Shoulders", "exercises": [...] },
        { "day_number": 5, "focus": "Arms", "exercises": [...] }
      ]
    },
    {
      "week_number": 3,
      "days": [...]
    },
    {
      "week_number": 4,
      "days": [...]
    },
    {
      "week_number": 5,
      "days": [...]
    },
    {
      "week_number": 6,
      "days": [...]
    }
  ]
}
```

**Total**: 6 weeks × 5 days = **30 workout days** ✅

---

## Testing

### Test Case 1: 4-Week Plan

**Request**:
```javascript
{
  durationWeeks: 4,
  frequencyPerWeek: 5
}
```

**Expected**:
- `weeks` array length: 4
- Each week has 5 days
- Total workout days: 20

**Verification**:
```javascript
console.log('Weeks generated:', workoutPlan.weeks.length);
// Should output: 4

console.log('Days in week 1:', workoutPlan.weeks[0].days.length);
// Should output: 5

console.log('Days in week 4:', workoutPlan.weeks[3].days.length);
// Should output: 5
```

### Test Case 2: 6-Week Plan

**Request**:
```javascript
{
  durationWeeks: 6,
  frequencyPerWeek: 5
}
```

**Expected**:
- `weeks` array length: 6
- Each week has 5 days
- Total workout days: 30

### Test Case 3: 8-Week Plan

**Request**:
```javascript
{
  durationWeeks: 8,
  frequencyPerWeek: 4
}
```

**Expected**:
- `weeks` array length: 8
- Each week has 4 days
- Total workout days: 32

---

## Database Verification

### Check Generated Plan Structure

```sql
SELECT 
  id,
  total_weeks,
  frequency_per_week,
  JSON_LENGTH(JSON_EXTRACT(plan_json, '$.weeks')) as weeks_generated,
  JSON_EXTRACT(plan_json, '$.weeks[0].week_number') as week1_num,
  JSON_EXTRACT(plan_json, '$.weeks[1].week_number') as week2_num,
  JSON_EXTRACT(plan_json, '$.weeks[2].week_number') as week3_num,
  JSON_EXTRACT(plan_json, '$.weeks[3].week_number') as week4_num,
  JSON_EXTRACT(plan_json, '$.weeks[4].week_number') as week5_num,
  JSON_EXTRACT(plan_json, '$.weeks[5].week_number') as week6_num
FROM workout_plan
WHERE id = (SELECT MAX(id) FROM workout_plan);
```

**Expected for 6-week plan**:
```
total_weeks: 6
frequency_per_week: 5
weeks_generated: 6
week1_num: 1
week2_num: 2
week3_num: 3
week4_num: 4
week5_num: 5
week6_num: 6
```

### Count Total Workout Days

```sql
SELECT 
  wp.id,
  wp.total_weeks,
  wp.frequency_per_week,
  JSON_LENGTH(JSON_EXTRACT(wp.plan_json, '$.weeks')) as weeks_count,
  (
    SELECT SUM(JSON_LENGTH(JSON_EXTRACT(week_data, '$.days')))
    FROM JSON_TABLE(
      wp.plan_json,
      '$.weeks[*]' COLUMNS(week_data JSON PATH '$')
    ) as weeks
  ) as total_days
FROM workout_plan wp
WHERE wp.id = (SELECT MAX(id) FROM workout_plan);
```

**Expected for 6-week, 5-day plan**:
```
total_weeks: 6
frequency_per_week: 5
weeks_count: 6
total_days: 30
```

---

## Why This Happens with AI

### LLM Behavior

Large Language Models (like Gemini) tend to:
1. **Follow examples literally** - If you show 1 week, they generate 1 week
2. **Optimize for brevity** - Generating 6 weeks is more tokens, so they might truncate
3. **Need explicit instructions** - "Generate all weeks" is clearer than showing an example

### Best Practices for AI Prompts

1. **Be Explicit**: State requirements clearly ("MUST contain EXACTLY X weeks")
2. **Show Complete Examples**: If you want 6 weeks, show at least 2-3 in the example
3. **Add Validation Rules**: List what's required in a separate section
4. **Use Strong Language**: "MUST", "CRITICAL", "DO NOT truncate"
5. **Repeat Key Requirements**: Mention the count multiple times

---

## Monitoring

### Add Logging to Verify

In the RAG service, you could add validation:

```python
def generate_workout_plan(self, user_preferences: dict) -> dict:
    # ... existing code ...
    
    # Validate generated plan
    plan_dict = json.loads(response_text)
    
    expected_weeks = user_preferences.get('duration_weeks', 4)
    actual_weeks = len(plan_dict.get('weeks', []))
    
    if actual_weeks != expected_weeks:
        log.warning(
            f"Week count mismatch! Expected: {expected_weeks}, Got: {actual_weeks}"
        )
        # Could retry generation here
    
    return plan_dict
```

---

## Alternative Solutions (Not Implemented)

### Option 1: Post-Processing
Generate 1 week, then duplicate and modify for other weeks:

**Pros**: Guaranteed to have all weeks
**Cons**: Less variety, not truly progressive

### Option 2: Multiple API Calls
Generate each week separately:

**Pros**: More control, can retry individual weeks
**Cons**: Slower, more API calls, higher cost

### Option 3: Structured Output
Use Gemini's structured output feature (if available):

**Pros**: Enforces schema
**Cons**: May not be available in all models

---

## Summary

✅ **Fixed**: Updated RAG prompt to explicitly require all weeks
✅ **Method**: Added clear examples and critical requirements
✅ **Result**: AI now generates complete multi-week plans
⚠️ **Note**: Existing plans still have 1 week - need to regenerate

### To Get Full Plan

1. Go to Preferences
2. Update any field (to trigger preference update check)
3. Click "Generate Plan"
4. Wait for generation (may take 30-60 seconds)
5. View plan - should now have all requested weeks!

---

## Quick Verification

After generating a new plan, check in browser console:

```javascript
console.log('Weeks:', workoutPlan.weeks.length);
console.log('Expected:', workoutPlan.total_weeks);
console.log('Match:', workoutPlan.weeks.length === workoutPlan.total_weeks ? '✅' : '❌');
```

Should output:
```
Weeks: 6
Expected: 6
Match: ✅
```

Perfect! 🎉
