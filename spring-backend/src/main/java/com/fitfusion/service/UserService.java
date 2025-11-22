package com.fitfusion.service;

import com.fitfusion.entity.User;
import com.fitfusion.entity.UserPreferencesTemplate;
import com.fitfusion.repository.UserPreferencesTemplateRepository;
import com.fitfusion.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserPreferencesTemplateRepository preferencesRepository;

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Map<String, Object> getUserProfile(Long userId) {
        User user = getUserById(userId);
        UserPreferencesTemplate preferences = preferencesRepository.findByUserId(userId).orElse(null);

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("created_at", user.getCreatedAt());
        profile.put("preferences", preferences);

        return profile;
    }

    @Transactional
    public UserPreferencesTemplate savePreferences(Long userId, UserPreferencesTemplate preferences) {
        // Verify user exists
        getUserById(userId);

        // Check if preferences already exist
        UserPreferencesTemplate existing = preferencesRepository.findByUserId(userId).orElse(null);

        if (existing != null) {
            // Update existing
            preferences.setId(existing.getId());
        }

        preferences.setUserId(userId);
        return preferencesRepository.save(preferences);
    }

    public UserPreferencesTemplate getUserPreferences(Long userId) {
        return preferencesRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User preferences not found"));
    }
}
