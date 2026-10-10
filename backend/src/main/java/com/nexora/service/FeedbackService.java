package com.nexora.service;

import com.nexora.dto.FeedbackDto;
import com.nexora.dto.FeedbackReplyRequest;
import com.nexora.dto.FeedbackRequest;
import com.nexora.model.Feedback;
import com.nexora.model.User;
import com.nexora.repository.FeedbackRepository;
import com.nexora.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public FeedbackDto createFeedback(Long userId, FeedbackRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Feedback feedback = new Feedback();
        feedback.setUser(user);
        feedback.setMessage(request.getMessage());
        feedback.setStatus("PENDING");

        feedback = feedbackRepository.save(feedback);
        return mapToDto(feedback);
    }

    public List<FeedbackDto> getUserFeedback(Long userId) {
        return feedbackRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<FeedbackDto> getAllFeedback() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public FeedbackDto replyToFeedback(Long feedbackId, FeedbackReplyRequest request) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        feedback.setAdminResponse(request.getAdminResponse());
        feedback.setStatus("REPLIED");

        feedback = feedbackRepository.save(feedback);
        return mapToDto(feedback);
    }

    private FeedbackDto mapToDto(Feedback feedback) {
        FeedbackDto dto = new FeedbackDto();
        dto.setId(feedback.getId());
        dto.setUserId(feedback.getUser().getId());
        dto.setUsername(feedback.getUser().getFirstName() + " " + feedback.getUser().getLastName());
        dto.setMessage(feedback.getMessage());
        dto.setAdminResponse(feedback.getAdminResponse());
        dto.setStatus(feedback.getStatus());
        dto.setCreatedAt(feedback.getCreatedAt());
        dto.setUpdatedAt(feedback.getUpdatedAt());
        return dto;
    }
}
