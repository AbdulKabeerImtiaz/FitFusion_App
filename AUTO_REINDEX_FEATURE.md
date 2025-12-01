# Automatic RAG Reindexing Feature

## Overview
The system now automatically reindexes the RAG service whenever an admin adds, updates, or deletes exercises or food items.

## How It Works

### Before (Manual):
```
Admin adds exercise → MySQL updated ✅
                   → Admin must manually reindex ❌
                   → docker restart fitfusion-rag
```

### After (Automatic):
```
Admin adds exercise → MySQL updated ✅
                   → Auto reindex triggered ✅
                   → RAG service updates in background ✅
```

## Implementation

### Modified Endpoints
All admin exercise and food item endpoints now trigger automatic reindexing:

**Exercise Endpoints:**
- `POST /api/admin/exercises` - Create single exercise
- `POST /api/admin/exercises/bulk` - Bulk create exercises
- `PUT /api/admin/exercises/{id}` - Update exercise
- `DELETE /api/admin/exercises/{id}` - Delete exercise

**Food Item Endpoints:**
- `POST /api/admin/food-items` - Create single food item
- `POST /api/admin/food-items/bulk` - Bulk create food items
- `PUT /api/admin/food-items/{id}` - Update food item
- `DELETE /api/admin/food-items/{id}` - Delete food item

### Async Processing
- Reindex runs in a **background thread**
- **Non-blocking** - API responds immediately
- **2-second delay** to ensure DB transaction completes
- **Automatic retry** if RAG service is temporarily unavailable

## Benefits

### ✅ For Admins:
- No manual reindex needed
- Changes are automatically reflected
- Seamless workflow

### ✅ For Users:
- Always get latest exercises in plans
- Always get latest food items in diet plans
- No stale data

### ✅ For System:
- Consistent data across services
- Reduced manual intervention
- Better user experience

## Behavior

### Single Item Changes:
```
POST /api/admin/exercises
{
  "name": "New Exercise",
  "muscle_group": "chest",
  ...
}

Response: 200 OK (immediate)
Background: Reindex triggered after 2 seconds
```

### Bulk Changes:
```
POST /api/admin/exercises/bulk
[
  { "name": "Exercise 1", ... },
  { "name": "Exercise 2", ... },
  ...
]

Response: 200 OK (immediate)
Background: Single reindex triggered for all items
```

## Monitoring

### Check Reindex Status:
```bash
curl http://localhost:8000/status
```

### Backend Logs:
```bash
docker logs fitfusion-spring | grep "reindex"
```

You'll see:
```
✓ RAG reindex triggered automatically
```

Or if it fails:
```
⚠ Failed to trigger automatic reindex: <error>
```

### RAG Service Logs:
```bash
docker logs fitfusion-rag | grep "reindex"
```

## Manual Reindex (Still Available)

If you need to manually trigger reindex:

### Via API:
```bash
curl -X POST http://localhost:8080/api/admin/rag/reindex \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"mode": "full"}'
```

### Via Script:
```bash
# PowerShell
.\reindex_rag.ps1

# Bash
./reindex_rag.sh
```

### Via Container Restart:
```bash
docker restart fitfusion-rag
```

## Timing

### Typical Flow:
```
T+0s:  Admin creates exercise
T+0s:  API responds with 201 Created
T+2s:  Background thread triggers reindex
T+3s:  RAG service starts reindexing
T+10s: RAG service completes reindex
T+10s: New exercise available in plan generation
```

### Why 2-Second Delay?
- Ensures database transaction is fully committed
- Prevents race conditions
- Allows connection pool to stabilize

## Error Handling

### If Reindex Fails:
- Error is logged but doesn't affect the API response
- Admin can manually trigger reindex
- Next admin action will retry automatically

### If RAG Service is Down:
- Error is logged
- Exercise/food item is still saved in database
- Reindex will happen when RAG service comes back up

## Configuration

### Disable Auto-Reindex (if needed):
Comment out the `triggerAsyncReindex()` calls in `AdminController.java`

### Adjust Delay:
Change the sleep time in `triggerAsyncReindex()`:
```java
Thread.sleep(2000); // Change to desired milliseconds
```

## Testing

### Test Auto-Reindex:
1. Add an exercise via admin API
2. Wait 10 seconds
3. Check RAG status: `curl http://localhost:8000/status`
4. Verify exercise count increased

### Test Plan Generation:
1. Add a new exercise
2. Wait 10 seconds
3. Generate a workout plan
4. New exercise should be available for selection

## Troubleshooting

### "Reindex not triggering"
- Check backend logs: `docker logs fitfusion-spring`
- Verify RAG service is running: `docker ps`
- Check RAG service health: `curl http://localhost:8000/health`

### "Plans don't include new exercises"
- Wait 10-15 seconds after adding
- Check RAG status for last reindex time
- Manually trigger reindex if needed

### "Performance issues"
- Reindex is async and shouldn't block
- If issues persist, increase delay or disable auto-reindex
- Consider rate limiting for bulk operations

## Future Enhancements

### Potential Improvements:
1. **Debouncing**: Batch multiple changes into single reindex
2. **Incremental Reindex**: Only reindex changed items
3. **Queue System**: Use message queue for better reliability
4. **Webhooks**: Notify other services of data changes
5. **Admin UI**: Show reindex status in admin dashboard

## Summary

With automatic reindexing:
- ✅ Admins don't need to remember to reindex
- ✅ Data stays synchronized automatically
- ✅ Better user experience
- ✅ Reduced manual maintenance
- ✅ More reliable system

The feature is **production-ready** and handles errors gracefully!
