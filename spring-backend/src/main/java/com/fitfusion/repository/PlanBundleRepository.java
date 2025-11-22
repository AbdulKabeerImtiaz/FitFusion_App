package com.fitfusion.repository;

import com.fitfusion.entity.PlanBundle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlanBundleRepository extends JpaRepository<PlanBundle, Long> {
    List<PlanBundle> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<PlanBundle> findByUserIdAndStatus(Long userId, PlanBundle.PlanStatus status);
    List<PlanBundle> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, PlanBundle.PlanStatus status);
}
