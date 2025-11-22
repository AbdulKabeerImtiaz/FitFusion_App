package com.fitfusion.repository;

import com.fitfusion.entity.UserPreferencesTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserPreferencesTemplateRepository extends JpaRepository<UserPreferencesTemplate, Long> {
    Optional<UserPreferencesTemplate> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
