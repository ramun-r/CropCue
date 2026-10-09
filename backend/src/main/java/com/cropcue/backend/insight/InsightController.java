package com.cropcue.backend.insight;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class InsightController {

    @PostMapping("/get_insight")
    public ResponseEntity<InsightResponse> getInsight(@RequestBody(required = false) InsightRequest request) {
        String fieldId = request == null || request.fieldId() == null || request.fieldId().isBlank()
                ? "field-01"
                : request.fieldId().trim();

        return ResponseEntity.ok(new InsightResponse(
                "get_insight",
                fieldId,
                "Review soil moisture before planting and irrigate if the reading is below the recommended range."
        ));
    }
}
