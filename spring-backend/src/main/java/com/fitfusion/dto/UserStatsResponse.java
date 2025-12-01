package com.fitfusion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse {
    private Long workoutsCompleted;
    private Long caloriesBurned;
    private Long minutesExercised;
    private String period; // "week", "month", "all"
}
