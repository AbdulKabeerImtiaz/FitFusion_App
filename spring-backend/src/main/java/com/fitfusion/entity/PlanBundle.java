package com.fitfusion.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "plan_bundle")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlanBundle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "preferences_snapshot", columnDefinition = "JSON", nullable = false)
    private Map<String, Object> preferencesSnapshot;
    
    @Column(name = "workout_plan_id")
    private Long workoutPlanId;
    
    @Column(name = "diet_plan_id")
    private Long dietPlanId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanStatus status = PlanStatus.active;
    
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @Column(name = "allowed_change_deadline", nullable = false)
    private LocalDate allowedChangeDeadline;
    
    @Column(name = "completed_at")
    private LocalDate completedAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (startDate == null) {
            startDate = LocalDate.now();
        }
    }
    
    public enum PlanStatus {
        active, completed, abandoned, restored
    }
}
