package com.fitfusion.controller;

import com.fitfusion.entity.Exercise;
import com.fitfusion.entity.FoodItem;
import com.fitfusion.entity.User;
import com.fitfusion.repository.ExerciseRepository;
import com.fitfusion.repository.FoodItemRepository;
import com.fitfusion.repository.UserRepository;
import com.fitfusion.repository.PlanBundleRepository;
import com.fitfusion.repository.WorkoutCompletionRepository;
import com.fitfusion.service.RagClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ExerciseRepository exerciseRepository;
    private final FoodItemRepository foodItemRepository;
    private final RagClientService ragClientService;
    private final UserRepository userRepository;
    private final PlanBundleRepository planBundleRepository;
    private final WorkoutCompletionRepository workoutCompletionRepository;

    // Exercise Management
    @GetMapping("/exercises")
    public ResponseEntity<List<Exercise>> getAllExercises() {
        return ResponseEntity.ok(exerciseRepository.findAll());
    }

    @PostMapping("/exercises")
    public ResponseEntity<Exercise> createExercise(@RequestBody Exercise exercise) {
        Exercise saved = exerciseRepository.save(exercise);
        // Trigger async reindex
        triggerAsyncReindex();
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/exercises/bulk")
    public ResponseEntity<Map<String, Object>> createExercisesBulk(@RequestBody List<Exercise> exercises) {
        List<Exercise> savedExercises = exerciseRepository.saveAll(exercises);
        // Trigger async reindex
        triggerAsyncReindex();
        return ResponseEntity.ok(Map.of(
                "message", "Exercises created successfully",
                "count", savedExercises.size(),
                "exercises", savedExercises));
    }

    @PutMapping("/exercises/{id}")
    public ResponseEntity<Exercise> updateExercise(@PathVariable Long id, @RequestBody Exercise exercise) {
        exercise.setId(id);
        Exercise updated = exerciseRepository.save(exercise);
        // Trigger async reindex
        triggerAsyncReindex();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/exercises/{id}")
    public ResponseEntity<Void> deleteExercise(@PathVariable Long id) {
        exerciseRepository.deleteById(id);
        // Trigger async reindex
        triggerAsyncReindex();
        return ResponseEntity.noContent().build();
    }

    // Food Item Management
    @GetMapping("/food-items")
    public ResponseEntity<List<FoodItem>> getAllFoodItems() {
        return ResponseEntity.ok(foodItemRepository.findAll());
    }

    @PostMapping("/food-items")
    public ResponseEntity<FoodItem> createFoodItem(@RequestBody FoodItem foodItem) {
        FoodItem saved = foodItemRepository.save(foodItem);
        // Trigger async reindex
        triggerAsyncReindex();
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/food-items/bulk")
    public ResponseEntity<Map<String, Object>> createFoodItemsBulk(@RequestBody List<FoodItem> foodItems) {
        List<FoodItem> savedFoodItems = foodItemRepository.saveAll(foodItems);
        // Trigger async reindex
        triggerAsyncReindex();
        return ResponseEntity.ok(Map.of(
                "message", "Food items created successfully",
                "count", savedFoodItems.size(),
                "foodItems", savedFoodItems));
    }

    @PutMapping("/food-items/{id}")
    public ResponseEntity<FoodItem> updateFoodItem(@PathVariable Long id, @RequestBody FoodItem foodItem) {
        foodItem.setId(id);
        FoodItem updated = foodItemRepository.save(foodItem);
        // Trigger async reindex
        triggerAsyncReindex();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/food-items/{id}")
    public ResponseEntity<Void> deleteFoodItem(@PathVariable Long id) {
        foodItemRepository.deleteById(id);
        // Trigger async reindex
        triggerAsyncReindex();
        return ResponseEntity.noContent().build();
    }

    // RAG Management
    @GetMapping("/rag/status")
    public ResponseEntity<Map<String, Object>> getRagStatus() {
        return ResponseEntity.ok(ragClientService.getStatus());
    }

    @PostMapping("/rag/reindex")
    public ResponseEntity<Map<String, Object>> triggerReindex(
            @RequestBody(required = false) Map<String, Object> request) {
        if (request == null) {
            request = Map.of("mode", "full");
        }
        return ResponseEntity.ok(ragClientService.triggerReindex(request));
    }

    // Dashboard Statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalExercises", exerciseRepository.count());
        stats.put("totalFoodItems", foodItemRepository.count());
        stats.put("totalPlans", planBundleRepository.count());
        stats.put("totalCompletions", workoutCompletionRepository.count());
        
        // Exercise breakdown by muscle group
        List<Object[]> exercisesByMuscle = exerciseRepository.countByMuscleGroup();
        Map<String, Long> muscleGroupStats = new HashMap<>();
        for (Object[] row : exercisesByMuscle) {
            muscleGroupStats.put((String) row[0], (Long) row[1]);
        }
        stats.put("exercisesByMuscleGroup", muscleGroupStats);
        
        return ResponseEntity.ok(stats);
    }

    // User Management
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String roleStr = request.get("role");
        User.Role role = User.Role.valueOf(roleStr);
        user.setRole(role);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Analytics
    @GetMapping("/analytics/popular-exercises")
    public ResponseEntity<List<Map<String, Object>>> getPopularExercises() {
        // This would require tracking exercise usage in workout plans
        // For now, return empty list - can be enhanced later
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/analytics/user-engagement")
    public ResponseEntity<Map<String, Object>> getUserEngagement() {
        Map<String, Object> engagement = new HashMap<>();
        long totalUsers = userRepository.count();
        long usersWithPlans = planBundleRepository.countDistinctUsers();
        long activeUsers = workoutCompletionRepository.countDistinctUsers();
        
        engagement.put("totalUsers", totalUsers);
        engagement.put("usersWithPlans", usersWithPlans);
        engagement.put("activeUsers", activeUsers);
        engagement.put("engagementRate", totalUsers > 0 ? (double) activeUsers / totalUsers * 100 : 0);
        
        return ResponseEntity.ok(engagement);
    }

    /**
     * Trigger async reindex after data changes
     * Runs in background to avoid blocking the response
     */
    private void triggerAsyncReindex() {
        new Thread(() -> {
            try {
                Thread.sleep(2000); // Wait 2 seconds for DB transaction to complete
                ragClientService.triggerReindex(Map.of("mode", "full"));
                System.out.println("✓ RAG reindex triggered automatically");
            } catch (Exception e) {
                System.err.println("⚠ Failed to trigger automatic reindex: " + e.getMessage());
            }
        }).start();
    }
}
