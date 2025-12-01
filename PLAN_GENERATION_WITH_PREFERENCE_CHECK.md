# Plan Generation with Preference Update Requirement

## Implementation Summary

Successfully implemented **Option 1** with an additional requirement: users must update their preferences before generating a new plan.

---

## What Was Implemented

### 1. Auto-Archive Old Plans
When a user generates a new plan, all old "active" plans are automatically marked as "abandoned".

### 2. Preference Update Check ⭐ NEW
Before generating a new plan, the system checks if preferences have been updated since the last plan was created. If not, it rejects the request with a clear error message.

---

## How It Works

### Plan Generation Flow

```
User clicks "Generate Plan"
    ↓
Check if user has existing plans
    ↓
YES → Check if preferences were updated after last plan
    ↓
    ├─ Preferences NOT updated → ❌ REJECT with error message
    │                             "Please update your preferences first"
    │
    └─ Preferences WERE updated → ✅ CONTINUE
        ↓
        Mark all old "active" plans as "abandoned"
        ↓
        Generate new plan (status: active)
        ↓
        Save to database
        ↓
        Return plan data
```

### Timestamp Comparison

```java
// Get latest plan creation time
LocalDateTime latestPlanCreatedAt = latestPlan.getCreatedAt();

// Get preferences last updated time
LocalDateTime preferencesUpdatedAt = preferences.getUpdatedAt();

// Compare
if (preferencesUpdatedAt.isBefore(latestPlanCreatedAt)) {
    throw new RuntimeException("Please update your preferences first");
}
```

---

## Code Changes

### Backend Changes

#### 1. PlanBundleRepository.java
Added new query methods:

```java
@Repository
public interface PlanBundleRepository extends JpaRepository<PlanBundle, Long> {
    // Existing
    List<PlanBundle> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // NEW: Find latest plan for user
    Optional<PlanBundle> findFirstByUserIdOrderByCreatedAtDesc(Long userId);
    
    // NEW: Find all plans with specific status
    List<PlanBundle> findAllByUserIdAndStatus(Long userId, PlanBundle.PlanStatus status);
}
```

#### 2. PlanService.java
Updated `generatePlan()` method:

```java
@Transactional
public Map<String, Object> generatePlan(Long userId) {
    // ... existing user and preferences validation ...
    
    // NEW: Check if user has existing plan
    Optional<PlanBundle> latestPlanOpt = planBundleRepository
        .findFirstByUserIdOrderByCreatedAtDesc(userId);
    
    if (latestPlanOpt.isPresent()) {
        PlanBundle latestPlan = latestPlanOpt.get();
        LocalDateTime latestPlanCreatedAt = latestPlan.getCreatedAt();
        LocalDateTime preferencesUpdatedAt = preferences.getUpdatedAt();
        
        // Check if preferences were updated after last plan
        if (preferencesUpdatedAt != null && latestPlanCreatedAt != null) {
            if (preferencesUpdatedAt.isBefore(latestPlanCreatedAt) || 
                preferencesUpdatedAt.isEqual(latestPlanCreatedAt)) {
                throw new RuntimeException(
                    "Please update your preferences before generating a new plan. " +
                    "Your current preferences haven't changed since your last plan was created."
                );
            }
        }
    }
    
    // NEW: Mark old active plans as abandoned
    List<PlanBundle> oldActivePlans = planBundleRepository
        .findAllByUserIdAndStatus(userId, PlanBundle.PlanStatus.active);
    
    if (!oldActivePlans.isEmpty()) {
        for (PlanBundle oldPlan : oldActivePlans) {
            oldPlan.setStatus(PlanBundle.PlanStatus.abandoned);
            planBundleRepository.save(oldPlan);
        }
    }
    
    // ... rest of plan generation logic ...
}
```

### Frontend Changes

#### Preferences.jsx
Enhanced error handling:

```javascript
catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to generate plan';
    
    // Check if error is about preferences not being updated
    if (errorMessage.includes('update your preferences')) {
        setError('⚠️ ' + errorMessage);
    } else {
        setError(errorMessage);
    }
}
```

---

## User Experience

### Scenario 1: First Plan Generation ✅

```
User → Fills preferences → Clicks "Generate Plan"
    ↓
System → No existing plans found
    ↓
Result → ✅ Plan generated successfully
```

### Scenario 2: Generate Without Updating Preferences ❌

```
User → Has existing plan → Clicks "Generate Plan" (without updating preferences)
    ↓
System → Checks: preferences.updatedAt < lastPlan.createdAt
    ↓
Result → ❌ Error: "Please update your preferences before generating a new plan"
```

### Scenario 3: Generate After Updating Preferences ✅

```
User → Has existing plan → Updates preferences → Clicks "Generate Plan"
    ↓
System → Checks: preferences.updatedAt > lastPlan.createdAt
    ↓
System → Marks old plan as "abandoned"
    ↓
Result → ✅ New plan generated successfully
```

---

## Error Messages

### Backend Error
```json
{
  "message": "Please update your preferences before generating a new plan. Your current preferences haven't changed since your last plan was created."
}
```

### Frontend Display
```
⚠️ Please update your preferences before generating a new plan. 
Your current preferences haven't changed since your last plan was created.
```

---

## Testing

### Test Case 1: First Plan Generation

**Steps**:
1. Register new user
2. Fill preferences
3. Click "Generate Plan"

**Expected**: Plan generated successfully

**SQL Check**:
```sql
SELECT COUNT(*) FROM plan_bundle WHERE user_id = ?;
-- Should return: 1
```

### Test Case 2: Try to Generate Without Updating

**Steps**:
1. User with existing plan
2. Go to Preferences (don't change anything)
3. Click "Generate Plan"

**Expected**: Error message displayed

**SQL Check**:
```sql
SELECT 
  pb.created_at as plan_created,
  up.updated_at as prefs_updated
FROM plan_bundle pb
JOIN user_preferences_template up ON pb.user_id = up.user_id
WHERE pb.user_id = ?
ORDER BY pb.created_at DESC
LIMIT 1;

-- prefs_updated should be BEFORE plan_created
```

### Test Case 3: Generate After Updating

**Steps**:
1. User with existing plan
2. Go to Preferences
3. Change any field (e.g., weight: 70 → 72)
4. Click "Generate Plan"

**Expected**: New plan generated, old plan marked as abandoned

**SQL Check**:
```sql
-- Check plan statuses
SELECT id, status, created_at 
FROM plan_bundle 
WHERE user_id = ?
ORDER BY created_at DESC;

-- Latest should be 'active', older should be 'abandoned'
```

### Test Case 4: Multiple Old Plans

**Steps**:
1. User with 3 active plans (from before this fix)
2. Update preferences
3. Generate new plan

**Expected**: All 3 old plans marked as abandoned, 1 new active plan

**SQL Check**:
```sql
SELECT 
  status,
  COUNT(*) as count
FROM plan_bundle
WHERE user_id = ?
GROUP BY status;

-- Should show: active: 1, abandoned: 3
```

---

## Database Verification

### Check Preference Update Times
```sql
SELECT 
  u.id as user_id,
  u.name,
  up.updated_at as prefs_updated,
  pb.created_at as latest_plan_created,
  CASE 
    WHEN up.updated_at > pb.created_at THEN 'Can Generate'
    ELSE 'Must Update Prefs'
  END as status
FROM users u
LEFT JOIN user_preferences_template up ON u.id = up.user_id
LEFT JOIN (
  SELECT user_id, MAX(created_at) as created_at
  FROM plan_bundle
  GROUP BY user_id
) pb ON u.id = pb.user_id;
```

### Check Plan Status Distribution
```sql
SELECT 
  user_id,
  status,
  COUNT(*) as count,
  MAX(created_at) as latest_plan
FROM plan_bundle
GROUP BY user_id, status
ORDER BY user_id, status;
```

### Find Users with Multiple Active Plans (Should be 0 after fix)
```sql
SELECT 
  user_id,
  COUNT(*) as active_plan_count
FROM plan_bundle
WHERE status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Should return: 0 rows
```

---

## Benefits

### 1. Prevents Duplicate Plans
Users can't spam "Generate Plan" button without making changes.

### 2. Ensures Meaningful Changes
New plans are only generated when preferences actually change.

### 3. Clear Plan History
Only one "active" plan at a time, old plans are archived.

### 4. Better UX
Clear error messages guide users to update preferences first.

### 5. Data Integrity
Prevents database clutter with identical plans.

---

## Edge Cases Handled

### Case 1: First-Time User
- No existing plans → Preference check skipped
- Plan generated immediately

### Case 2: Null Timestamps
- If `updatedAt` or `createdAt` is null → Check skipped
- Allows plan generation (fail-safe)

### Case 3: Same Timestamp
- If `updatedAt == createdAt` → Rejected
- User must make a change

### Case 4: Multiple Active Plans (Legacy Data)
- All old active plans marked as abandoned
- Only newest plan stays active

---

## Future Enhancements

### 1. Show Last Updated Time
Display when preferences were last updated:
```
Preferences last updated: Nov 30, 2024 at 3:45 PM
Last plan generated: Nov 25, 2024 at 2:30 PM
✅ You can generate a new plan
```

### 2. Highlight Changed Fields
Show which preferences changed:
```
Changes since last plan:
- Weight: 70kg → 72kg
- Goal: Weight Loss → Muscle Gain
```

### 3. Plan Comparison
Allow users to compare old and new plans side-by-side.

### 4. Preference Diff
Store preference snapshots and show differences.

---

## Rollback Plan

If this causes issues, you can temporarily disable the check:

```java
// In PlanService.generatePlan(), comment out this block:
/*
if (latestPlanOpt.isPresent()) {
    // ... preference check logic ...
}
*/

// Keep the auto-archive logic:
List<PlanBundle> oldActivePlans = ...
```

---

## Summary

✅ **Implemented**: Auto-archive old plans when generating new ones
✅ **Implemented**: Require preference updates before new plan generation
✅ **Tested**: Compilation successful, services running
✅ **User-Friendly**: Clear error messages guide users
✅ **Data Integrity**: Only one active plan per user

**Result**: Users must update their preferences (indicating their goals/needs have changed) before generating a new plan. This ensures meaningful plan generation and prevents duplicate plans.

---

## Quick Reference

**To generate a new plan**:
1. Go to Preferences
2. Update ANY field (weight, goal, equipment, etc.)
3. Click "Generate Plan"
4. Old plan automatically archived
5. New plan created with status "active"

**Error if you don't update**:
> ⚠️ Please update your preferences before generating a new plan. Your current preferences haven't changed since your last plan was created.

**Solution**: Change at least one preference field, then try again! 🎯
