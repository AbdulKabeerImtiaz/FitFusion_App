package com.fitfusion.controller;

import com.fitfusion.entity.PlanBundle;
import com.fitfusion.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @PostMapping("/{id}/generate-plan")
    public ResponseEntity<Map<String, Object>> generatePlan(@PathVariable Long id) {
        Map<String, Object> plan = planService.generatePlan(id);
        return ResponseEntity.ok(plan);
    }

    @GetMapping("/{id}/plans")
    public ResponseEntity<List<PlanBundle>> getUserPlans(@PathVariable Long id) {
        List<PlanBundle> plans = planService.getUserPlans(id);
        System.out.println("🔍 API: Returning plans for user " + id + ": " + plans);
        if (!plans.isEmpty()) {
            System.out.println("🔍 API: First plan ID: " + plans.get(0).getId());
        }
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/plans/{bundleId}")
    public ResponseEntity<PlanBundle> getPlanBundle(@PathVariable Long bundleId) {
        PlanBundle bundle = planService.getPlanBundle(bundleId);
        return ResponseEntity.ok(bundle);
    }
}
