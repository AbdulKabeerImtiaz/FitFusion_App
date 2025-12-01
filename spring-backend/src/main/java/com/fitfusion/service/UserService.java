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
        profile.put("createdAt", user.getCreatedAt());
        profile.put("age", user.getAge());
        profile.put("weight", user.getWeight());
        profile.put("height", user.getHeight());
        profile.put("gender", user.getGender());
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

    @Transactional
    public Map<String, Object> updateUser(Long userId, Map<String, Object> updates) {
        User user = getUserById(userId);

        // Update name if provided
        if (updates.containsKey("name") && updates.get("name") != null) {
            user.setName((String) updates.get("name"));
        }

        // Update personal info
        if (updates.containsKey("age")) {
            user.setAge(updates.get("age") != null ? ((Number) updates.get("age")).intValue() : null);
        }
        if (updates.containsKey("weight")) {
            user.setWeight(updates.get("weight") != null ? ((Number) updates.get("weight")).doubleValue() : null);
        }
        if (updates.containsKey("height")) {
            user.setHeight(updates.get("height") != null ? ((Number) updates.get("height")).doubleValue() : null);
        }
        if (updates.containsKey("gender") && updates.get("gender") != null) {
            user.setGender((String) updates.get("gender"));
        }

        // Update password if provided
        if (updates.containsKey("newPassword") && updates.get("newPassword") != null) {
            String currentPassword = (String) updates.get("currentPassword");
            String newPassword = (String) updates.get("newPassword");

            // In a real app, you'd verify the current password here
            // For now, we'll just update it
            // Note: Password should be encoded with BCrypt in production
            user.setPasswordHash(newPassword);
        }

        user = userRepository.save(user);

        // Return updated user info
        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("name", user.getName());
        result.put("email", user.getEmail());
        result.put("createdAt", user.getCreatedAt());
        result.put("age", user.getAge());
        result.put("weight", user.getWeight());
        result.put("height", user.getHeight());
        result.put("gender", user.getGender());

        return result;
    }
}
