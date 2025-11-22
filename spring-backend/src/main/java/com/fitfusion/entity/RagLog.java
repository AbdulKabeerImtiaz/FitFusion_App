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
@Table(name = "rag_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RagLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "plan_bundle_id")
    private Long planBundleId;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_payload", columnDefinition = "JSON")
    private Map<String, Object> requestPayload;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_payload", columnDefinition = "JSON")
    private Map<String, Object> responsePayload;
    
    @Column(name = "model_used", length = 100)
    private String modelUsed;
    
    @Column(name = "tokens_used")
    private Integer tokensUsed;
    
    @Column(name = "duration_ms")
    private Integer durationMs;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;
    
    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
