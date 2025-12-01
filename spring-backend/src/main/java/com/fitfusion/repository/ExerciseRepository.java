package com.fitfusion.repository;

import com.fitfusion.entity.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    List<Exercise> findByMuscleGroup(String muscleGroup);
    List<Exercise> findByDifficulty(Exercise.Difficulty difficulty);
    Optional<Exercise> findByNameIgnoreCase(String name);
    
    @Query("SELECT e.muscleGroup, COUNT(e) FROM Exercise e GROUP BY e.muscleGroup")
    List<Object[]> countByMuscleGroup();
}
