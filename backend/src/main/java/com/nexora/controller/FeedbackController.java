package com.nexora.controller;

import com.nexora.dto.FeedbackDto;
import com.nexora.dto.FeedbackReplyRequest;
import com.nexora.dto.FeedbackRequest;
import com.nexora.model.User;
import com.nexora.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedback")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<?> createFeedback(@RequestBody FeedbackRequest request, HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(401).body("Unauthorized: userId is null");
            return ResponseEntity.ok(feedbackService.createFeedback(userId, request));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error creating feedback: " + e.getMessage() + " | Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "none"));
        }
    }

    @GetMapping("/my-feedback")
    public ResponseEntity<List<FeedbackDto>> getMyFeedback(HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        return ResponseEntity.ok(feedbackService.getUserFeedback(userId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<FeedbackDto>> getAllFeedback() {
        return ResponseEntity.ok(feedbackService.getAllFeedback());
    }

    @PutMapping("/{id}/reply")
    public ResponseEntity<FeedbackDto> replyToFeedback(@PathVariable Long id, @RequestBody FeedbackReplyRequest request) {
        return ResponseEntity.ok(feedbackService.replyToFeedback(id, request));
    }
}
