package com.fitfusion.controller;

import com.fitfusion.entity.UserPreferencesTemplate;
import com.fitfusion.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable Long id) {
        Map<String, Object> profile = userService.getUserProfile(id);
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/{id}/preferences")
    public ResponseEntity<UserPreferencesTemplate> getUserPreferences(@PathVariable Long id) {
        UserPreferencesTemplate preferences = userService.getUserPreferences(id);
        return ResponseEntity.ok(preferences);
    }

    @PostMapping("/{id}/preferences")
    public ResponseEntity<UserPreferencesTemplate> savePreferences(
            @PathVariable Long id,
            @RequestBody UserPreferencesTemplate preferences) {
        UserPreferencesTemplate saved = userService.savePreferences(id, preferences);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/preferences")
    public ResponseEntity<UserPreferencesTemplate> updatePreferences(
            @PathVariable Long id,
            @RequestBody UserPreferencesTemplate preferences) {
        UserPreferencesTemplate updated = userService.savePreferences(id, preferences);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        Map<String, Object> updated = userService.updateUser(id, updates);
        return ResponseEntity.ok(updated);
    }
}
