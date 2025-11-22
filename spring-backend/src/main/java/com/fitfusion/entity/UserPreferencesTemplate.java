package com.fitfusion.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "user_preferences_template")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferencesTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    // Personal Metrics
    private Integer age;
    private Float weight;
    private Float height;
    
    @Enumerated(EnumType.STRING)
    private Gender gender;
    
    // Fitness Goals
    @Enumerated(EnumType.STRING)
    private FitnessGoal goal;
    
    @Column(name = "experience_level")
    @Enumerated(EnumType.STRING)
    private ExperienceLevel experienceLevel;
    
    @Column(name = "workout_location")
    @Enumerated(EnumType.STRING)
    private WorkoutLocation workoutLocation;
    
    // Workout Preferences (JSON)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "equipment_list", columnDefinition = "JSON")
    private List<String> equipmentList;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "target_muscle_groups", columnDefinition = "JSON")
    private List<String> targetMuscleGroups;
    
    @Column(name = "duration_weeks")
    private Integer durationWeeks;
    
    // Diet Preferences
    @Column(name = "dietary_preference")
    @Enumerated(EnumType.STRING)
    private DietaryPreference dietaryPreference;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "excluded_foods", columnDefinition = "JSON")
    private List<String> excludedFoods;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private List<String> allergies;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "medical_conditions", columnDefinition = "JSON")
    private List<String> medicalConditions;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PreUpdate
    @PrePersist
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Enums
    public enum Gender {
        male, female, other
    }
    
    public enum FitnessGoal {
        weight_gain, weight_loss, maintain, strength, stamina
    }
    
    public enum ExperienceLevel {
        beginner, intermediate, advanced
    }
    
    public enum WorkoutLocation {
        home, gym
    }
    
    public enum DietaryPreference {
        veg, non_veg, mixed
    }
}
