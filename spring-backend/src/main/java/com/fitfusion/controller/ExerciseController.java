package com.fitfusion.controller;

import com.fitfusion.entity.Exercise;
import com.fitfusion.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseRepository exerciseRepository;

    @GetMapping
    public ResponseEntity<List<Exercise>> getAllExercises() {
        return ResponseEntity.ok(exerciseRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exercise> getExerciseById(@PathVariable Long id) {
        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise not found"));
        return ResponseEntity.ok(exercise);
    }

    @GetMapping("/by-name/{name}")
    public ResponseEntity<Exercise> getExerciseByName(@PathVariable String name) {
        Exercise exercise = exerciseRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new RuntimeException("Exercise not found: " + name));
        return ResponseEntity.ok(exercise);
    }
}
