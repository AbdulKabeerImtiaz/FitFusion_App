package com.fitfusion.service;

import com.fitfusion.dto.UserStatsResponse;
import com.fitfusion.dto.WorkoutCompletionRequest;
import com.fitfusion.dto.WorkoutCompletionResponse;
import com.fitfusion.entity.PlanBundle;
import com.fitfusion.entity.User;
import com.fitfusion.entity.WorkoutCompletion;
import com.fitfusion.repository.PlanBundleRepository;
import com.fitfusion.repository.UserRepository;
import com.fitfusion.repository.WorkoutCompletionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutCompletionService {
    
    private final WorkoutCompletionRepository completionRepository;
    private final UserRepository userRepository;
    private final PlanBundleRepository planBundleRepository;
    
    @Transactional
    public WorkoutCompletionResponse markWorkoutComplete(Long userId, WorkoutCompletionRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        PlanBundle planBundle = planBundleRepository.findById(request.getPlanBundleId())
            .orElseThrow(() -> new RuntimeException("Plan not found"));
        
        // Check if already completed
        var existing = completionRepository.findByUserIdAndPlanBundleIdAndWeekNumberAndDayNumberAndExerciseName(
            userId, request.getPlanBundleId(), request.getWeekNumber(), 
            request.getDayNumber(), request.getExerciseName()
        );
        
        WorkoutCompletion completion;
        if (existing.isPresent()) {
            // Update existing completion
            completion = existing.get();
            completion.setSetsCompleted(request.getSetsCompleted());
            completion.setRepsCompleted(request.getRepsCompleted());
            completion.setDurationMinutes(request.getDurationMinutes());
            completion.setCaloriesBurned(request.getCaloriesBurned());
            completion.setNotes(request.getNotes());
            completion.setCompletedAt(LocalDateTime.now());
        } else {
            // Create new completion
            completion = new WorkoutCompletion();
            completion.setUser(user);
            completion.setPlanBundle(planBundle);
            completion.setWeekNumber(request.getWeekNumber());
            completion.setDayNumber(request.getDayNumber());
            completion.setExerciseName(request.getExerciseName());
            completion.setSetsCompleted(request.getSetsCompleted());
            completion.setRepsCompleted(request.getRepsCompleted());
            completion.setDurationMinutes(request.getDurationMinutes());
            completion.setCaloriesBurned(request.getCaloriesBurned());
            completion.setNotes(request.getNotes());
        }
        
        completion = completionRepository.save(completion);
        return mapToResponse(completion);
    }
    
    @Transactional
    public void unmarkWorkoutComplete(Long userId, Long planBundleId, Integer weekNumber, 
                                      Integer dayNumber, String exerciseName) {
        var completion = completionRepository.findByUserIdAndPlanBundleIdAndWeekNumberAndDayNumberAndExerciseName(
            userId, planBundleId, weekNumber, dayNumber, exerciseName
        );
        completion.ifPresent(completionRepository::delete);
    }
    
    public List<WorkoutCompletionResponse> getUserPlanCompletions(Long userId, Long planBundleId) {
        return completionRepository.findByUserIdAndPlanBundleId(userId, planBundleId)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    public List<WorkoutCompletionResponse> getUserWeekCompletions(Long userId, Long planBundleId, Integer weekNumber) {
        return completionRepository.findByUserIdAndPlanBundleIdAndWeekNumber(userId, planBundleId, weekNumber)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    public UserStatsResponse getUserStats(Long userId, String period) {
        LocalDateTime startDate = calculateStartDate(period);
        
        Long workouts = completionRepository.countWorkoutsByUserSince(userId, startDate);
        Long calories = completionRepository.sumCaloriesByUserSince(userId, startDate);
        Long minutes = completionRepository.sumMinutesByUserSince(userId, startDate);
        
        return new UserStatsResponse(workouts, calories, minutes, period);
    }
    
    private LocalDateTime calculateStartDate(String period) {
        LocalDateTime now = LocalDateTime.now();
        return switch (period.toLowerCase()) {
            case "week" -> now.minus(7, ChronoUnit.DAYS);
            case "month" -> now.minus(30, ChronoUnit.DAYS);
            case "year" -> now.minus(365, ChronoUnit.DAYS);
            default -> LocalDateTime.of(2000, 1, 1, 0, 0); // "all" time
        };
    }
    
    private WorkoutCompletionResponse mapToResponse(WorkoutCompletion completion) {
        return new WorkoutCompletionResponse(
            completion.getId(),
            completion.getPlanBundle().getId(),
            completion.getWeekNumber(),
            completion.getDayNumber(),
            completion.getExerciseName(),
            completion.getSetsCompleted(),
            completion.getRepsCompleted(),
            completion.getDurationMinutes(),
            completion.getCaloriesBurned(),
            completion.getNotes(),
            completion.getCompletedAt()
        );
    }
}
