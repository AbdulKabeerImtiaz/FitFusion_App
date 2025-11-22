package com.fitfusion.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RagClientService {

    private final RestTemplate restTemplate;

    @Value("${rag.service.url}")
    private String ragServiceUrl;

    @Value("${rag.service.api-key}")
    private String apiKey;

    public Map<String, Object> generatePlan(Long userId, Map<String, Object> preferences) {
        log.info("Calling RAG service to generate plan for user: {}", userId);

        String url = ragServiceUrl + "/generate";

        // Build request payload
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("user_id", userId);
        requestBody.put("preferences", preferences);

        // Set headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("Successfully generated plan for user: {}", userId);
                return response.getBody();
            } else {
                throw new RuntimeException("RAG service returned non-OK status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error calling RAG service: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate plan: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getStatus() {
        String url = ragServiceUrl + "/status";

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Error getting RAG service status: {}", e.getMessage());
            Map<String, Object> errorStatus = new HashMap<>();
            errorStatus.put("status", "error");
            errorStatus.put("message", e.getMessage());
            return errorStatus;
        }
    }

    public Map<String, Object> triggerReindex(Map<String, Object> reindexRequest) {
        log.info("Triggering RAG service reindex");

        String url = ragServiceUrl + "/reindex";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(reindexRequest, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            log.info("Reindex triggered successfully");
            return response.getBody();

        } catch (Exception e) {
            log.error("Error triggering reindex: {}", e.getMessage());
            throw new RuntimeException("Failed to trigger reindex: " + e.getMessage(), e);
        }
    }
}
