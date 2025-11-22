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
@Table(name = "food_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FoodItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 150)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FoodCategory category;
    
    @Column(name = "calories_per_100g")
    private Float caloriesPer100g;
    
    @Column(name = "protein_per_100g")
    private Float proteinPer100g;
    
    @Column(name = "carbs_per_100g")
    private Float carbsPer100g;
    
    @Column(name = "fats_per_100g")
    private Float fatsPer100g;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private Map<String, Object> vitamins;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private Map<String, Object> minerals;
    
    @Column(name = "serving_description", length = 200)
    private String servingDescription;
    
    @Column(name = "is_veg")
    private Boolean isVeg = false;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum FoodCategory {
        meat, veg, fruit, rice, bread, sabzi, drink, snack, other
    }
}
