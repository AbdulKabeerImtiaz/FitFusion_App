package com.fitfusion.dto;

import lombok.Data;

@Data
public class WorkoutCompletionRequest {
    private Long planBundleId;
    private Integer weekNumber;
    private Integer dayNumber;
    private String exerciseName;
    private Integer setsCompleted;
    private Integer repsCompleted;
    private Integer durationMinutes;
    private Integer caloriesBurned;
    private String notes;
}
