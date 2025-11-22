package com.fitfusion.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "workout_plan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "plan_json", columnDefinition = "JSON", nullable = false)
    private Map<String, Object> planJson;
    
    @Column(name = "total_weeks")
    private Integer totalWeeks;
    
    @Column(name = "frequency_per_week")
    private Integer frequencyPerWeek;
    
    @Column(columnDefinition = "TEXT")
    private String summary;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
