package com.fitfusion.controller;

import com.fitfusion.entity.Exercise;
import com.fitfusion.entity.FoodItem;
import com.fitfusion.repository.ExerciseRepository;
import com.fitfusion.repository.FoodItemRepository;
import com.fitfusion.service.RagClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ExerciseRepository exerciseRepository;
    private final FoodItemRepository foodItemRepository;
    private final RagClientService ragClientService;

    // Exercise Management
    @GetMapping("/exercises")
    public ResponseEntity<List<Exercise>> getAllExercises() {
        return ResponseEntity.ok(exerciseRepository.findAll());
    }

    @PostMapping("/exercises")
    public ResponseEntity<Exercise> createExercise(@RequestBody Exercise exercise) {
        return ResponseEntity.ok(exerciseRepository.save(exercise));
    }

    @PutMapping("/exercises/{id}")
    public ResponseEntity<Exercise> updateExercise(@PathVariable Long id, @RequestBody Exercise exercise) {
        exercise.setId(id);
        return ResponseEntity.ok(exerciseRepository.save(exercise));
    }

    @DeleteMapping("/exercises/{id}")
    public ResponseEntity<Void> deleteExercise(@PathVariable Long id) {
        exerciseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Food Item Management
    @GetMapping("/food-items")
    public ResponseEntity<List<FoodItem>> getAllFoodItems() {
        return ResponseEntity.ok(foodItemRepository.findAll());
    }

    @PostMapping("/food-items")
    public ResponseEntity<FoodItem> createFoodItem(@RequestBody FoodItem foodItem) {
        return ResponseEntity.ok(foodItemRepository.save(foodItem));
    }

    @PutMapping("/food-items/{id}")
    public ResponseEntity<FoodItem> updateFoodItem(@PathVariable Long id, @RequestBody FoodItem foodItem) {
        foodItem.setId(id);
        return ResponseEntity.ok(foodItemRepository.save(foodItem));
    }

    @DeleteMapping("/food-items/{id}")
    public ResponseEntity<Void> deleteFoodItem(@PathVariable Long id) {
        foodItemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // RAG Management
    @GetMapping("/rag/status")
    public ResponseEntity<Map<String, Object>> getRagStatus() {
        return ResponseEntity.ok(ragClientService.getStatus());
    }

    @PostMapping("/rag/reindex")
    public ResponseEntity<Map<String, Object>> triggerReindex(
            @RequestBody(required = false) Map<String, Object> request) {
        if (request == null) {
            request = Map.of("mode", "full");
        }
        return ResponseEntity.ok(ragClientService.triggerReindex(request));
    }
}
