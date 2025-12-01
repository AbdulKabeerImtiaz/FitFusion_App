package com.fitfusion.repository;

import com.fitfusion.entity.WorkoutCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutCompletionRepository extends JpaRepository<WorkoutCompletion, Long> {
    
    // Find specific completion
    Optional<WorkoutCompletion> findByUserIdAndPlanBundleIdAndWeekNumberAndDayNumberAndExerciseName(
        Long userId, Long planBundleId, Integer weekNumber, Integer dayNumber, String exerciseName
    );
    
    // Get all completions for a user's plan
    List<WorkoutCompletion> findByUserIdAndPlanBundleId(Long userId, Long planBundleId);
    
    // Get completions for a specific week
    List<WorkoutCompletion> findByUserIdAndPlanBundleIdAndWeekNumber(
        Long userId, Long planBundleId, Integer weekNumber
    );
    
    // Get completions within a date range
    List<WorkoutCompletion> findByUserIdAndCompletedAtBetween(
        Long userId, LocalDateTime startDate, LocalDateTime endDate
    );
    
    // Stats queries
    @Query("SELECT COUNT(wc) FROM WorkoutCompletion wc WHERE wc.user.id = :userId AND wc.completedAt >= :startDate")
    Long countWorkoutsByUserSince(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COALESCE(SUM(wc.caloriesBurned), 0) FROM WorkoutCompletion wc WHERE wc.user.id = :userId AND wc.completedAt >= :startDate")
    Long sumCaloriesByUserSince(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COALESCE(SUM(wc.durationMinutes), 0) FROM WorkoutCompletion wc WHERE wc.user.id = :userId AND wc.completedAt >= :startDate")
    Long sumMinutesByUserSince(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(DISTINCT wc.user.id) FROM WorkoutCompletion wc")
    Long countDistinctUsers();
}
