# Preferences & Profile UX Improvements

## Overview
Major UX improvements to separate concerns between viewing preferences, generating new plans, and managing personal information.

## Changes Made

### 1. **New Preferences Page (View/Edit Mode)**

#### View Mode (Default)
- Shows current preferences in organized categories:
  - **Fitness Goals**: Goal, experience, location, duration, frequency, equipment
  - **Target Muscle Groups**: Selected muscles displayed as tags
  - **Diet & Health**: Dietary preference, allergies, medical conditions, excluded foods
- Clean, read-only display with category icons
- "Generate New Plan" button to enter edit mode
- Shows message if no preferences set yet

#### Edit Mode (Plan Generation)
- **Confirmation Dialog**: Before entering edit mode, asks user to confirm
  - "Generate New Plan?" with explanation
  - Clarifies that current plan remains in history
- **3-Step Process** (removed "About You" step):
  1. **Fitness Goals**: Goal, experience, location, duration, frequency, equipment
  2. **Target Muscles**: Interactive muscle selector
  3. **Diet & Health**: Dietary preferences, allergies, conditions, excluded foods
- **No Personal Info**: Age, weight, height, gender removed from preferences
- Progress indicator shows current step
- Can cancel at any time to return to view mode

### 2. **Enhanced Profile Page**

#### New Personal Details Section
- **Age**: Editable number field
- **Gender**: Dropdown (Male/Female/Other)
- **Weight**: Editable number field (kg)
- **Height**: Editable number field (cm)
- Edit mode allows updating all personal info
- Displays "Not set" if fields are empty

#### Existing Features
- Name and email management
- Password change functionality
- Member since date
- Stats cards (total plans, active plans, completed plans)
- Quick stats sidebar

### 3. **Backend Updates**

#### User Entity
Added personal information fields:
```java
@Column(name = "age")
private Integer age;

@Column(name = "weight")
private Double weight;

@Column(name = "height")
private Double height;

@Column(name = "gender", length = 20)
private String gender;
```

#### UserService
- `getUserProfile()`: Returns age, weight, height, gender
- `updateUser()`: Accepts and updates personal info fields
- Handles null values gracefully

#### Database Migration
New migration script: `04-user-personal-info.sql`
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS age INT,
ADD COLUMN IF NOT EXISTS weight DOUBLE,
ADD COLUMN IF NOT EXISTS height DOUBLE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
```

## User Flow

### Viewing Preferences
```
1. User clicks "My Preferences" tab
   ↓
2. Sees current preferences organized by category
   - Fitness Goals
   - Target Muscles
   - Diet & Health
   ↓
3. Can click "Generate New Plan" to create new plan
```

### Generating New Plan
```
1. User clicks "Generate New Plan"
   ↓
2. Confirmation dialog appears
   "Generate New Plan?"
   - Explains current plan stays in history
   - Cancel or Continue
   ↓
3. User clicks "Continue"
   ↓
4. Enters edit mode with 3 steps:
   Step 1: Fitness Goals
   Step 2: Target Muscles
   Step 3: Diet & Health
   ↓
5. User fills preferences
   ↓
6. Clicks "Save & Generate Plan"
   ↓
7. System:
   - Fetches personal info from profile
   - Combines with new preferences
   - Generates plan
   - Navigates to Plans page
```

### Updating Personal Info
```
1. User goes to Profile tab
   ↓
2. Clicks "Edit" button
   ↓
3. Updates:
   - Name
   - Age, Weight, Height, Gender
   - Password (optional)
   ↓
4. Clicks "Save"
   ↓
5. Personal info updated in database
```

## Benefits

### 1. **Clear Separation of Concerns**
- **Preferences**: Fitness and diet settings for plan generation
- **Profile**: Personal information and account settings
- No confusion about where to update what

### 2. **Better Plan Generation Flow**
- Confirmation dialog prevents accidental plan generation
- Focused 3-step process (no personal info clutter)
- Clear progress indication
- Easy to cancel and return

### 3. **Improved Preferences Viewing**
- Read-only view by default
- Organized by categories with icons
- Easy to see current settings
- No accidental edits

### 4. **Flexible Personal Info Management**
- Update personal info anytime from Profile
- Used automatically when generating plans
- No need to re-enter for each plan

## API Changes

### GET /api/users/{id}
**Response now includes:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-11-30T10:00:00",
  "age": 25,
  "weight": 75.5,
  "height": 180.0,
  "gender": "male"
}
```

### PUT /api/users/{id}
**Request body accepts:**
```json
{
  "name": "John Doe",
  "age": 26,
  "weight": 76.0,
  "height": 180.0,
  "gender": "male",
  "currentPassword": "old123",  // optional
  "newPassword": "new123"        // optional
}
```

## Files Modified/Created

### Frontend
- ✅ `PreferencesNew.jsx` - New preferences page with view/edit modes
- ✅ `Profile.jsx` - Added personal details section
- ✅ `App.jsx` - Updated to use new Preferences component

### Backend
- ✅ `User.java` - Added age, weight, height, gender fields
- ✅ `UserService.java` - Updated to handle personal info
- ✅ `UserController.java` - Updated method signature
- ✅ `04-user-personal-info.sql` - Database migration

## Testing Steps

### 1. Test Profile Updates
```
1. Go to Profile tab
2. Click "Edit"
3. Update:
   - Age: 25
   - Weight: 75
   - Height: 180
   - Gender: Male
4. Click "Save"
5. Verify fields are saved
6. Refresh page - fields should persist
```

### 2. Test Preferences View
```
1. Go to "My Preferences" tab
2. Should see current preferences (if any)
3. Organized in 3 categories
4. All fields read-only
5. "Generate New Plan" button visible
```

### 3. Test Plan Generation with Confirmation
```
1. Go to "My Preferences"
2. Click "Generate New Plan"
3. Confirmation dialog appears
4. Click "Cancel" - stays in view mode
5. Click "Generate New Plan" again
6. Click "Continue" - enters edit mode
7. Fill 3 steps (no personal info asked)
8. Click "Save & Generate Plan"
9. Plan generated with personal info from profile
10. Redirected to Plans page
```

### 4. Test Personal Info in Plan Generation
```
1. Set personal info in Profile (age, weight, height, gender)
2. Go to Preferences
3. Generate new plan (only fitness/diet preferences)
4. Plan should use personal info from profile
5. Check plan details - should reflect correct user data
```

## Migration Guide

### For Existing Users
1. **Rebuild containers** to apply database migration
2. **Update personal info** in Profile tab
3. **View preferences** in new Preferences tab
4. **Generate new plans** with improved flow

### Database Migration
```bash
# The migration runs automatically on container start
# Or run manually:
docker exec -i fitfusion-mysql mysql -u fitfusion_user -pfitfusion_pass_2024 fitfusion < mysql-init/04-user-personal-info.sql
```

## Summary

These improvements create a much cleaner UX:
- ✅ Preferences tab shows current settings (view mode)
- ✅ Confirmation dialog before generating new plan
- ✅ Streamlined 3-step plan generation (no personal info)
- ✅ Personal info managed in Profile tab
- ✅ Clear separation between preferences and profile
- ✅ Better user experience overall

Users now have a clear mental model:
- **Profile** = Who I am (personal info, account settings)
- **Preferences** = What I want (fitness goals, diet preferences)
- **Plans** = What I get (generated workout and diet plans)
