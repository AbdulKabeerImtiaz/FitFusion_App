package com.fitfusion.service;

import com.fitfusion.entity.*;
import com.fitfusion.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
                                                () -> new RuntimeException(
                                                                "User preferences not found. Please complete onboarding first."));

                // Check if user has an existing plan
                Optional<PlanBundle> latestPlanOpt = planBundleRepository.findFirstByUserIdOrderByCreatedAtDesc(userId);
                
                if (latestPlanOpt.isPresent()) {
                        PlanBundle latestPlan = latestPlanOpt.get();
                        LocalDateTime latestPlanCreatedAt = latestPlan.getCreatedAt();
                        LocalDateTime preferencesUpdatedAt = preferences.getUpdatedAt();
                        
                        // Check if preferences were updated after the last plan was created
                        if (preferencesUpdatedAt != null && latestPlanCreatedAt != null) {
                                if (preferencesUpdatedAt.isBefore(latestPlanCreatedAt) || 
                                    preferencesUpdatedAt.isEqual(latestPlanCreatedAt)) {
                                        log.warn("User {} attempted to generate plan without updating preferences", userId);
                                        throw new RuntimeException(
                                                "Please update your preferences before generating a new plan. " +
                                                "Your current preferences haven't changed since your last plan was created."
                                        );
                                }
                        }
                        
                        log.info("Preferences were updated after last plan. Proceeding with plan generation.");
                }

                // Mark old active plans as abandoned
                List<PlanBundle> oldActivePlans = planBundleRepository
                                .findAllByUserIdAndStatus(userId, PlanBundle.PlanStatus.active);
                
                if (!oldActivePlans.isEmpty()) {
                        log.info("Marking {} old active plans as abandoned for user {}", oldActivePlans.size(), userId);
                        for (PlanBundle oldPlan : oldActivePlans) {
                                oldPlan.setStatus(PlanBundle.PlanStatus.abandoned);
                                planBundleRepository.save(oldPlan);
                        }
                }

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
                                LocalDate.now().plusWeeks(
                                                preferences.getDurationWeeks() != null ? preferences.getDurationWeeks()
                                                                : 4));
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
                map.put("workout_location",
                                prefs.getWorkoutLocation() != null ? prefs.getWorkoutLocation().name() : "home");

                // Ensure lists are never null - use empty lists instead
                map.put("equipment_list",
                                prefs.getEquipmentList() != null ? prefs.getEquipmentList() : new ArrayList<>());
                map.put("target_muscle_groups", prefs.getTargetMuscleGroups() != null ? prefs.getTargetMuscleGroups()
                                : new ArrayList<>());
                map.put("excluded_foods",
                                prefs.getExcludedFoods() != null ? prefs.getExcludedFoods() : new ArrayList<>());
                map.put("allergies", prefs.getAllergies() != null ? prefs.getAllergies() : new ArrayList<>());
                map.put("medical_conditions", prefs.getMedicalConditions() != null ? prefs.getMedicalConditions()
                                : new ArrayList<>());

                map.put("duration_weeks", prefs.getDurationWeeks() != null ? prefs.getDurationWeeks() : 4);
                map.put("frequency_per_week", 5); // Default
                map.put("dietary_preference",
                                prefs.getDietaryPreference() != null ? prefs.getDietaryPreference().name() : "mixed");
                return map;
        }
}
