package com.fitfusion.repository;

import com.fitfusion.entity.RagLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RagLogRepository extends JpaRepository<RagLog, Long> {
    List<RagLog> findByUserIdOrderByTimestampDesc(Long userId);
    List<RagLog> findByPlanBundleId(Long planBundleId);
}
