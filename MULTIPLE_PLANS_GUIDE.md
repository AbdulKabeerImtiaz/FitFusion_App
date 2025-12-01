# Multiple Plans Support - Current Setup & Recommendations

## Answer: YES, Users CAN Have Multiple Plans! ✅

Your system **already supports multiple plans per user**. Every time a user generates a plan, a new `PlanBundle` is created and added to their plan history.

---

## Current Implementation

### Database Evidence
```sql
SELECT user_id, COUNT(*) as plan_count 
FROM plan_bundle 
GROUP BY user_id;

Results:
- User 5: 3 plans
- User 14-22: 1 plan each
```

### How It Works

**Plan Generation Flow:**
```
User clicks "Generate Plan"
    ↓
POST /api/users/{id}/generate-plan
    ↓
PlanService.generatePlan()
    ↓
Creates NEW WorkoutPlan
Creates NEW DietPlan
Creates NEW PlanBundle (status: active)
    ↓
Saves to database
    ↓
Returns plan data
```

**Key Point**: The system **does NOT check** for existing plans or mark old plans as inactive. It simply creates a new plan every time.

---

## Plan Structure

### PlanBundle Entity
```java
@Entity
public class PlanBundle {
    private Long id;
    private Long userId;
    private Long workoutPlanId;
    private Long dietPlanId;
    private PlanStatus status;  // active, completed, abandoned, restored
    private LocalDate startDate;
    private LocalDate allowedChangeDeadline;
    private LocalDate completedAt;
    private LocalDateTime createdAt;
}
```

### Plan Statuses
- **active**: Currently being followed
- **completed**: User finished the program
- **abandoned**: User stopped following it
- **restored**: Reactivated an old plan

---

## Current User Experience

### "My Plans" Page
Shows **all plans** in a grid:
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Fitness Plan    │  │ Fitness Plan    │  │ Fitness Plan    │
│ Created Nov 30  │  │ Created Nov 25  │  │ Created Nov 20  │
│ [Active]        │  │ [Active]        │  │ [Active]        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Issues with Current Setup

1. **Multiple "Active" Plans**: User can have 3+ plans all marked as "active"
2. **No Primary Plan**: Can't tell which plan user is currently following
3. **No Plan Management**: Can't mark plans as completed or delete them
4. **Confusing UX**: Which plan should I follow today?

---

## Recommendations

### Option 1: Auto-Archive Old Plans (Recommended) ⭐

**Behavior**: When generating a new plan, automatically mark old active plans as "abandoned"

**Benefits**:
- Only one active plan at a time
- Clear which plan to follow
- Keeps plan history
- Simple UX

**Implementation**:

```java
@Transactional
public Map<String, Object> generatePlan(Long userId) {
    log.info("Generating plan for user: {}", userId);
    
    // Mark old active plans as abandoned
    List<PlanBundle> oldActivePlans = planBundleRepository
        .findByUserIdAndStatus(userId, PlanBundle.PlanStatus.active);
    
    if (!oldActivePlans.isEmpty()) {
        log.info("Marking {} old active plans as abandoned", oldActivePlans.size());
        for (PlanBundle oldPlan : oldActivePlans) {
            oldPlan.setStatus(PlanBundle.PlanStatus.abandoned);
            planBundleRepository.save(oldPlan);
        }
    }
    
    // ... rest of existing code to create new plan ...
}
```

**Add Repository Method**:
```java
// In PlanBundleRepository.java
List<PlanBundle> findByUserIdAndStatus(Long userId, PlanStatus status);
```

---

### Option 2: Confirmation Dialog

**Behavior**: Ask user before generating new plan

**Frontend Change** (in Preferences.jsx):
```javascript
const handleGeneratePlan = async () => {
  // Check for existing active plans
  const activePlans = await api.get(`/users/${user.id}/plans/active`);
  
  if (activePlans.data.length > 0) {
    const confirmed = window.confirm(
      'You have an active plan. Generating a new plan will replace it. Continue?'
    );
    if (!confirmed) return;
  }
  
  // Generate new plan
  await generatePlan();
};
```

**Backend Endpoint**:
```java
@GetMapping("/{id}/plans/active")
public ResponseEntity<List<PlanBundle>> getActivePlans(@PathVariable Long id) {
    List<PlanBundle> activePlans = planBundleRepository
        .findByUserIdAndStatus(id, PlanBundle.PlanStatus.active);
    return ResponseEntity.ok(activePlans);
}
```

---

### Option 3: Plan Management UI

**Behavior**: Let users manage multiple active plans

**Features to Add**:

1. **Mark as Primary**
```
┌─────────────────────────────┐
│ Fitness Plan                │
│ Created Nov 30              │
│ [★ Primary] [Active]        │
└─────────────────────────────┘
```

2. **Plan Actions Menu**
```
┌─────────────────────────────┐
│ Fitness Plan                │
│ Created Nov 25              │
│ [Active]                    │
│                             │
│ [Mark Complete] [Archive]   │
│ [Delete]                    │
└─────────────────────────────┘
```

3. **Status Filters**
```
[All Plans] [Active] [Completed] [Archived]
```

---

## Implementation Guide

### Step 1: Add Repository Method

**File**: `spring-backend/src/main/java/com/fitfusion/repository/PlanBundleRepository.java`

```java
public interface PlanBundleRepository extends JpaRepository<PlanBundle, Long> {
    List<PlanBundle> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // Add this:
    List<PlanBundle> findByUserIdAndStatus(Long userId, PlanBundle.PlanStatus status);
}
```

### Step 2: Update PlanService

**File**: `spring-backend/src/main/java/com/fitfusion/service/PlanService.java`

Add at the beginning of `generatePlan()`:

```java
// Mark old active plans as abandoned
List<PlanBundle> oldActivePlans = planBundleRepository
    .findByUserIdAndStatus(userId, PlanBundle.PlanStatus.active);

for (PlanBundle oldPlan : oldActivePlans) {
    oldPlan.setStatus(PlanBundle.PlanStatus.abandoned);
    planBundleRepository.save(oldPlan);
}
```

### Step 3: Add Plan Management Endpoints

**File**: `spring-backend/src/main/java/com/fitfusion/controller/PlanController.java`

```java
@PutMapping("/plans/{bundleId}/status")
public ResponseEntity<PlanBundle> updatePlanStatus(
    @PathVariable Long bundleId,
    @RequestBody Map<String, String> request
) {
    PlanBundle plan = planService.getPlanBundle(bundleId);
    String newStatus = request.get("status");
    
    plan.setStatus(PlanBundle.PlanStatus.valueOf(newStatus));
    
    if (newStatus.equals("completed")) {
        plan.setCompletedAt(LocalDate.now());
    }
    
    planBundleRepository.save(plan);
    return ResponseEntity.ok(plan);
}

@DeleteMapping("/plans/{bundleId}")
public ResponseEntity<Void> deletePlan(@PathVariable Long bundleId) {
    planBundleRepository.deleteById(bundleId);
    return ResponseEntity.noContent().build();
}
```

### Step 4: Update Frontend Plans Page

**File**: `fitfusion-frontend/src/pages/user/Plans.jsx`

Add action buttons to each plan card:

```javascript
<div className="flex gap-2 mt-4">
  {plan.status === 'active' && (
    <button 
      onClick={(e) => {
        e.preventDefault();
        handleMarkComplete(plan.id);
      }}
      className="btn btn-sm btn-success"
    >
      Mark Complete
    </button>
  )}
  <button 
    onClick={(e) => {
      e.preventDefault();
      handleDeletePlan(plan.id);
    }}
    className="btn btn-sm btn-danger"
  >
    Delete
  </button>
</div>
```

---

## Testing Multiple Plans

### Test Scenario 1: Generate Multiple Plans

1. Login as a user
2. Go to Preferences
3. Generate a plan (Plan A)
4. Go back to Preferences
5. Change a setting
6. Generate another plan (Plan B)
7. Go to "My Plans"
8. **Expected**: See both Plan A and Plan B

### Test Scenario 2: Check Plan Status

```sql
-- Check user's plans
SELECT 
  id,
  user_id,
  status,
  created_at,
  start_date
FROM plan_bundle
WHERE user_id = 5
ORDER BY created_at DESC;
```

**Current Result**: All plans show `status = 'active'`
**After Fix**: Only newest plan shows `status = 'active'`, others show `status = 'abandoned'`

---

## Database Queries

### Count Plans Per User
```sql
SELECT 
  user_id,
  COUNT(*) as total_plans,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_plans,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_plans
FROM plan_bundle
GROUP BY user_id;
```

### Find Users with Multiple Active Plans
```sql
SELECT 
  user_id,
  COUNT(*) as active_plan_count
FROM plan_bundle
WHERE status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1;
```

### View Plan History for User
```sql
SELECT 
  id,
  status,
  created_at,
  start_date,
  allowed_change_deadline
FROM plan_bundle
WHERE user_id = 5
ORDER BY created_at DESC;
```

---

## Summary

### Current State ✅
- Users **CAN** have multiple plans
- All plans are saved in database
- Plans page shows all plans
- Each plan is viewable

### Issues ⚠️
- Multiple plans can be "active" simultaneously
- No way to mark plans as completed
- No way to delete old plans
- Confusing which plan to follow

### Recommended Fix 🔧
**Option 1** (Auto-archive) is the simplest and best UX:
1. Add `findByUserIdAndStatus()` to repository
2. Update `generatePlan()` to mark old plans as abandoned
3. Only one active plan at a time
4. Keeps full plan history

### Quick Win 🎯
Just add these 5 lines to `PlanService.generatePlan()`:

```java
List<PlanBundle> oldActivePlans = planBundleRepository
    .findByUserIdAndStatus(userId, PlanBundle.PlanStatus.active);
for (PlanBundle oldPlan : oldActivePlans) {
    oldPlan.setStatus(PlanBundle.PlanStatus.abandoned);
    planBundleRepository.save(oldPlan);
}
```

This ensures users always have one clear "active" plan to follow! 🎉
