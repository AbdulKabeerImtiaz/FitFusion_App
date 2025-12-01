# Preferences Field Mapping Fix

## Problem

The frontend was sending preferences with **snake_case** field names, but the backend entity expects **camelCase** field names. This caused fields to be saved as `null`.

### Example of the Issue

**Frontend sent:**
```json
{
  "dietary_preference": "mixed",
  "target_muscle_groups": ["Chest", "Biceps"],
  "workout_location": "gym",
  "experience_level": "intermediate"
}
```

**Backend received:**
```json
{
  "dietaryPreference": null,  // ❌ Not mapped
  "targetMuscleGroups": null,  // ❌ Not mapped
  "workoutLocation": null,     // ❌ Not mapped
  "experienceLevel": null      // ❌ Not mapped
}
```

---

## Root Cause

Jackson (Spring's JSON library) uses **camelCase** by default for Java field names, but the frontend was using **snake_case** naming convention.

### Field Name Mismatch

| Frontend (snake_case) | Backend (camelCase) | Status |
|----------------------|---------------------|--------|
| `dietary_preference` | `dietaryPreference` | ❌ Mismatch |
| `target_muscle_groups` | `targetMuscleGroups` | ❌ Mismatch |
| `workout_location` | `workoutLocation` | ❌ Mismatch |
| `experience_level` | `experienceLevel` | ❌ Mismatch |
| `duration_weeks` | `durationWeeks` | ❌ Mismatch |
| `equipment_list` | `equipmentList` | ❌ Mismatch |
| `excluded_foods` | `excludedFoods` | ❌ Mismatch |
| `medical_conditions` | `medicalConditions` | ❌ Mismatch |
| `age` | `age` | ✅ Match |
| `weight` | `weight` | ✅ Match |
| `height` | `height` | ✅ Match |
| `gender` | `gender` | ✅ Match |
| `goal` | `goal` | ✅ Match |
| `allergies` | `allergies` | ✅ Match |

---

## Solution

Transform the field names from snake_case to camelCase in the frontend before sending to the backend.

### Code Change

**File**: `fitfusion-frontend/src/pages/user/Preferences.jsx`

**Before:**
```javascript
const preferencesPayload = {
  ...formData,
  age: formData.age || null,
  weight: formData.weight || null,
  height: formData.height || null,
  duration_weeks: formData.duration_weeks || 4,
};
```

**After:**
```javascript
// Transform snake_case to camelCase for backend
const preferencesPayload = {
  age: formData.age || null,
  weight: formData.weight || null,
  height: formData.height || null,
  gender: formData.gender,
  goal: formData.goal,
  experienceLevel: formData.experience_level,        // ✅ Transformed
  workoutLocation: formData.workout_location,        // ✅ Transformed
  durationWeeks: formData.duration_weeks || 4,       // ✅ Transformed
  equipmentList: formData.equipment_list || [],      // ✅ Transformed
  targetMuscleGroups: formData.target_muscle_groups || [],  // ✅ Transformed
  dietaryPreference: formData.dietary_preference,    // ✅ Transformed
  allergies: formData.allergies || [],
  medicalConditions: formData.medical_conditions || [],  // ✅ Transformed
  excludedFoods: formData.excluded_foods || []       // ✅ Transformed
};
```

---

## Result

Now all fields are correctly mapped and saved to the database.

### Before Fix

```json
{
  "id": 23,
  "userId": 34,
  "age": 21,
  "weight": 66,
  "height": 171,
  "gender": "male",
  "goal": "weight_gain",
  "dietaryPreference": null,        // ❌ NULL
  "durationWeeks": null,            // ❌ NULL
  "equipmentList": null,            // ❌ NULL
  "excludedFoods": null,            // ❌ NULL
  "experienceLevel": null,          // ❌ NULL
  "targetMuscleGroups": null,       // ❌ NULL
  "workoutLocation": null,          // ❌ NULL
  "medicalConditions": null         // ❌ NULL
}
```

### After Fix

```json
{
  "id": 24,
  "userId": 34,
  "age": 21,
  "weight": 66,
  "height": 171,
  "gender": "male",
  "goal": "weight_gain",
  "dietaryPreference": "mixed",                    // ✅ SAVED
  "durationWeeks": 3,                              // ✅ SAVED
  "equipmentList": [],                             // ✅ SAVED
  "excludedFoods": [],                             // ✅ SAVED
  "experienceLevel": "intermediate",               // ✅ SAVED
  "targetMuscleGroups": ["Chest", "Biceps", ...],  // ✅ SAVED
  "workoutLocation": "gym",                        // ✅ SAVED
  "medicalConditions": []                          // ✅ SAVED
}
```

---

## Testing

### Test Case 1: Save Preferences

**Steps**:
1. Login to the app
2. Go to Preferences
3. Fill all fields:
   - Personal: Age, Weight, Height, Gender
   - Goals: Goal, Experience Level, Workout Location, Duration
   - Muscles: Select target muscle groups
   - Diet: Dietary Preference, Allergies, Medical Conditions

4. Click "Generate Plan"

**Expected Result**:
- All fields saved correctly
- No null values for selected fields
- Plan generation succeeds

**Verification Query**:
```sql
SELECT 
  id,
  user_id,
  age,
  weight,
  height,
  gender,
  goal,
  experience_level,
  workout_location,
  duration_weeks,
  dietary_preference,
  equipment_list,
  target_muscle_groups,
  excluded_foods,
  allergies,
  medical_conditions
FROM user_preferences_template
WHERE user_id = 34;
```

**Expected**: All fields have values (no nulls for selected options)

---

## Alternative Solutions (Not Implemented)

### Option 1: Backend Jackson Configuration
Configure Jackson to accept snake_case:

```java
@Configuration
public class JacksonConfig {
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        return mapper;
    }
}
```

**Pros**: No frontend changes needed
**Cons**: Affects all API endpoints, might break existing functionality

### Option 2: Entity Annotations
Add `@JsonProperty` annotations to entity fields:

```java
@Entity
public class UserPreferencesTemplate {
    @JsonProperty("dietary_preference")
    @Column(name = "dietary_preference")
    private DietaryPreference dietaryPreference;
    
    @JsonProperty("target_muscle_groups")
    @Column(name = "target_muscle_groups")
    private List<String> targetMuscleGroups;
    
    // ... etc
}
```

**Pros**: Explicit mapping, clear intent
**Cons**: Verbose, requires changes to all fields

### Option 3: DTO with Mapping
Create a DTO class for the request:

```java
public class PreferencesRequest {
    private String dietary_preference;
    private List<String> target_muscle_groups;
    // ... etc
    
    public UserPreferencesTemplate toEntity() {
        UserPreferencesTemplate entity = new UserPreferencesTemplate();
        entity.setDietaryPreference(this.dietary_preference);
        entity.setTargetMuscleGroups(this.target_muscle_groups);
        return entity;
    }
}
```

**Pros**: Clean separation, type-safe
**Cons**: More code, extra layer

---

## Why We Chose Frontend Transformation

1. **Minimal Changes**: Only one file modified
2. **No Breaking Changes**: Doesn't affect other endpoints
3. **Clear Intent**: Explicit transformation is easy to understand
4. **Fast Implementation**: Quick fix, immediate results
5. **No Backend Changes**: No need to rebuild backend

---

## Summary

✅ **Fixed**: Field name mismatch between frontend and backend
✅ **Method**: Transform snake_case to camelCase in frontend
✅ **Result**: All preferences now save correctly
✅ **Impact**: Plan generation now works with full user preferences

**Key Takeaway**: Always ensure frontend and backend use consistent field naming conventions, or explicitly transform between them!

---

## Quick Reference

### Frontend Form Data (Internal)
```javascript
{
  experience_level: "intermediate",
  workout_location: "gym",
  duration_weeks: 3,
  equipment_list: [],
  target_muscle_groups: ["Chest", "Biceps"],
  dietary_preference: "mixed",
  medical_conditions: [],
  excluded_foods: []
}
```

### API Payload (Sent to Backend)
```javascript
{
  experienceLevel: "intermediate",
  workoutLocation: "gym",
  durationWeeks: 3,
  equipmentList: [],
  targetMuscleGroups: ["Chest", "Biceps"],
  dietaryPreference: "mixed",
  medicalConditions: [],
  excludedFoods: []
}
```

### Backend Entity (Saved to Database)
```java
{
  experienceLevel: ExperienceLevel.intermediate,
  workoutLocation: WorkoutLocation.gym,
  durationWeeks: 3,
  equipmentList: [],
  targetMuscleGroups: ["Chest", "Biceps"],
  dietaryPreference: DietaryPreference.mixed,
  medicalConditions: [],
  excludedFoods: []
}
```

All three layers now align perfectly! 🎯
