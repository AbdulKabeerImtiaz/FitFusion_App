package com.fitfusion.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "workout_completion", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "plan_bundle_id", "week_number", "day_number", "exercise_name"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutCompletion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_bundle_id", nullable = false)
    private PlanBundle planBundle;
    
    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;
    
    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;
    
    @Column(name = "exercise_name", nullable = false, length = 150)
    private String exerciseName;
    
    @Column(name = "sets_completed")
    private Integer setsCompleted;
    
    @Column(name = "reps_completed")
    private Integer repsCompleted;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes;
    
    @Column(name = "calories_burned")
    private Integer caloriesBurned;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;
    
    @PrePersist
    protected void onCreate() {
        if (completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }
}
