package com.fitfusion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutCompletionResponse {
    private Long id;
    private Long planBundleId;
    private Integer weekNumber;
    private Integer dayNumber;
    private String exerciseName;
    private Integer setsCompleted;
    private Integer repsCompleted;
    private Integer durationMinutes;
    private Integer caloriesBurned;
    private String notes;
    private LocalDateTime completedAt;
}
