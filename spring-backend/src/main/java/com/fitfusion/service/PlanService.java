package com.fitfusion.service;

import com.fitfusion.entity.*;
import com.fitfusion.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanService {

    private final UserRepository userRepository;
    private final UserPreferencesTemplateRepository preferencesRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final DietPlanRepository dietPlanRepository;
    private final PlanBundleRepository planBundleRepository;
    private final RagLogRepository ragLogRepository;
    private final RagClientService ragClientService;
    private final ObjectMapper objectMapper;

    @Transactional
    public Map<String, Object> generatePlan(Long userId) {
        log.info("Generating plan for user: {}", userId);

        // Verify user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get user preferences
        UserPreferencesTemplate preferences = preferencesRepository.findByUserId(userId)
                .orElseThrow(
                        () -> new RuntimeException("User preferences not found. Please complete onboarding first."));

        // Convert preferences to map for RAG service
        Map<String, Object> preferencesMap = convertPreferencesToMap(preferences);

        // Call RAG service
        long startTime = System.currentTimeMillis();
        Map<String, Object> ragResponse = ragClientService.generatePlan(userId, preferencesMap);
        long duration = System.currentTimeMillis() - startTime;

        // Extract plans from response
        Map<String, Object> workoutPlanData = (Map<String, Object>) ragResponse.get("workout_plan");
        Map<String, Object> dietPlanData = (Map<String, Object>) ragResponse.get("diet_plan");
        Map<String, Object> metadata = (Map<String, Object>) ragResponse.get("metadata");

        // Save workout plan
        WorkoutPlan workoutPlan = new WorkoutPlan();
        workoutPlan.setPlanJson(workoutPlanData);
        workoutPlan.setTotalWeeks((Integer) workoutPlanData.get("total_weeks"));
        workoutPlan.setFrequencyPerWeek((Integer) workoutPlanData.get("frequency_per_week"));
        workoutPlan.setSummary((String) workoutPlanData.get("summary"));
        workoutPlan = workoutPlanRepository.save(workoutPlan);

        // Save diet plan
        DietPlan dietPlan = new DietPlan();
        dietPlan.setPlanJson(dietPlanData);
        Object caloriesObj = dietPlanData.get("total_daily_calories");
        dietPlan.setTotalDailyCalories(caloriesObj instanceof Number ? ((Number) caloriesObj).intValue() : 0);

        Object proteinObj = dietPlanData.get("total_daily_protein");
        dietPlan.setTotalDailyProtein(proteinObj instanceof Number ? ((Number) proteinObj).intValue() : 0);
        dietPlan.setSummary((String) dietPlanData.get("summary"));
        dietPlan = dietPlanRepository.save(dietPlan);

        // Create plan bundle
        PlanBundle planBundle = new PlanBundle();
        planBundle.setUserId(userId);
        planBundle.setWorkoutPlanId(workoutPlan.getId());
        planBundle.setDietPlanId(dietPlan.getId());
        planBundle.setPreferencesSnapshot(preferencesMap);
        planBundle.setStatus(PlanBundle.PlanStatus.active);
        planBundle.setStartDate(LocalDate.now());
        planBundle.setAllowedChangeDeadline(
                LocalDate.now().plusWeeks(preferences.getDurationWeeks() != null ? preferences.getDurationWeeks() : 4));
        planBundle = planBundleRepository.save(planBundle);

        // Log RAG request
        RagLog ragLog = new RagLog();
        ragLog.setUserId(userId);
        ragLog.setPlanBundleId(planBundle.getId());
        ragLog.setRequestPayload(Map.of("user_id", userId, "preferences", preferencesMap));
        ragLog.setResponsePayload(ragResponse);
        ragLog.setModelUsed((String) metadata.get("llm_model"));
        ragLog.setDurationMs((int) duration);
        ragLogRepository.save(ragLog);

        // Build response
        Map<String, Object> response = new HashMap<>();
        response.put("plan_bundle_id", planBundle.getId());
        response.put("workout_plan", workoutPlanData);
        response.put("diet_plan", dietPlanData);
        response.put("metadata", metadata);

        log.info("Plan generated successfully for user: {}", userId);
        return response;
    }

    public List<PlanBundle> getUserPlans(Long userId) {
        return planBundleRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public PlanBundle getPlanBundle(Long bundleId) {
        return planBundleRepository.findById(bundleId)
                .orElseThrow(() -> new RuntimeException("Plan bundle not found"));
    }

    private Map<String, Object> convertPreferencesToMap(UserPreferencesTemplate prefs) {
        Map<String, Object> map = new HashMap<>();
        map.put("age", prefs.getAge());
        map.put("weight", prefs.getWeight());
        map.put("height", prefs.getHeight());
        map.put("gender", prefs.getGender() != null ? prefs.getGender().name() : null);
        map.put("goal", prefs.getGoal() != null ? prefs.getGoal().name() : null);
        map.put("experience_level",
                prefs.getExperienceLevel() != null ? prefs.getExperienceLevel().name() : "beginner");
        map.put("workout_location", prefs.getWorkoutLocation() != null ? prefs.getWorkoutLocation().name() : "home");
        map.put("equipment_list", prefs.getEquipmentList());
        map.put("target_muscle_groups", prefs.getTargetMuscleGroups());
        map.put("duration_weeks", prefs.getDurationWeeks() != null ? prefs.getDurationWeeks() : 4);
        map.put("frequency_per_week", 5); // Default
        map.put("dietary_preference",
                prefs.getDietaryPreference() != null ? prefs.getDietaryPreference().name() : "mixed");
        map.put("excluded_foods", prefs.getExcludedFoods());
        map.put("allergies", prefs.getAllergies());
        map.put("medical_conditions", prefs.getMedicalConditions());
        return map;
    }
}
