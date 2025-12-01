package com.fitfusion.controller;

import com.fitfusion.dto.UserStatsResponse;
import com.fitfusion.dto.WorkoutCompletionRequest;
import com.fitfusion.dto.WorkoutCompletionResponse;
import com.fitfusion.entity.User;
import com.fitfusion.repository.UserRepository;
import com.fitfusion.service.WorkoutCompletionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WorkoutCompletionController {
    
    private final WorkoutCompletionService completionService;
    private final UserRepository userRepository;
    
    private Long getAuthenticatedUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
    
    @PostMapping("/users/{userId}/workout-completions")
    public ResponseEntity<WorkoutCompletionResponse> markWorkoutComplete(
            @PathVariable Long userId,
            @RequestBody WorkoutCompletionRequest request,
            Authentication authentication) {
        
        // Verify user can only mark their own workouts
        Long authenticatedUserId = getAuthenticatedUserId(authentication);
        if (!authenticatedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        
        WorkoutCompletionResponse response = completionService.markWorkoutComplete(userId, request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/users/{userId}/workout-completions")
    public ResponseEntity<Void> unmarkWorkoutComplete(
            @PathVariable Long userId,
            @RequestParam Long planBundleId,
            @RequestParam Integer weekNumber,
            @RequestParam Integer dayNumber,
            @RequestParam String exerciseName,
            Authentication authentication) {
        
        Long authenticatedUserId = getAuthenticatedUserId(authentication);
        if (!authenticatedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        
        completionService.unmarkWorkoutComplete(userId, planBundleId, weekNumber, dayNumber, exerciseName);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/users/{userId}/workout-completions")
    public ResponseEntity<List<WorkoutCompletionResponse>> getUserPlanCompletions(
            @PathVariable Long userId,
            @RequestParam Long planBundleId,
            Authentication authentication) {
        
        Long authenticatedUserId = getAuthenticatedUserId(authentication);
        if (!authenticatedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        
        List<WorkoutCompletionResponse> completions = completionService.getUserPlanCompletions(userId, planBundleId);
        return ResponseEntity.ok(completions);
    }
    
    @GetMapping("/users/{userId}/workout-completions/week")
    public ResponseEntity<List<WorkoutCompletionResponse>> getUserWeekCompletions(
            @PathVariable Long userId,
            @RequestParam Long planBundleId,
            @RequestParam Integer weekNumber,
            Authentication authentication) {
        
        Long authenticatedUserId = getAuthenticatedUserId(authentication);
        if (!authenticatedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        
        List<WorkoutCompletionResponse> completions = completionService.getUserWeekCompletions(userId, planBundleId, weekNumber);
        return ResponseEntity.ok(completions);
    }
    
    @GetMapping("/users/{userId}/stats")
    public ResponseEntity<UserStatsResponse> getUserStats(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "week") String period,
            Authentication authentication) {
        
        Long authenticatedUserId = getAuthenticatedUserId(authentication);
        if (!authenticatedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        
        UserStatsResponse stats = completionService.getUserStats(userId, period);
        return ResponseEntity.ok(stats);
    }
}
