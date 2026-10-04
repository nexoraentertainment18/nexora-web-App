package com.nexora.controller;

import com.nexora.dto.*;
import com.nexora.model.User;
import com.nexora.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/api/v1/auth/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest request) {
        try {
            UserDto user = userService.signup(request);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/api/v1/auth/verify")
    public ResponseEntity<?> verify(@Valid @RequestBody VerifyRequest request) {
        try {
            User user = userService.verifyAndSetPassword(request.getToken(), request.getPassword());
            return ResponseEntity.ok(new UserDto(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/api/v1/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @GetMapping("/api/v1/auth/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("Not authenticated.");
        }
        try {
            User user = userService.findById(userId);
            return ResponseEntity.ok(new UserDto(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @GetMapping("/api/v1/users/{id}")
    public ResponseEntity<?> getUserById(HttpServletRequest httpRequest, @PathVariable Long id) {
        try {
            User user = userService.findById(id);
            Long authUserId = (Long) httpRequest.getAttribute("userId");
            UserDto dto = new UserDto(user).sanitizeForOtherUser(authUserId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/api/v1/auth/profile")
    public ResponseEntity<?> updateProfile(HttpServletRequest request, @RequestBody java.util.Map<String, String> body) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("Not authenticated.");
        try {
            User user = userService.updateProfile(
                userId,
                body.get("firstName"),
                body.get("lastName"),
                body.get("mobileNumber"),
                body.get("favMovieGenre"),
                body.get("favPlaceType"),
                body.get("favSeriesGenre"),
                body.get("favGameType")
            );
            return ResponseEntity.ok(new UserDto(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/api/v1/auth/profile/picture")
    public ResponseEntity<?> updateProfilePicture(HttpServletRequest request, @RequestParam("file") MultipartFile file) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("Not authenticated.");
        try {
            User user = userService.updateProfilePicture(userId, file);
            return ResponseEntity.ok(new UserDto(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/api/v1/auth/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            userService.forgotPassword(request.getEmail());
            return ResponseEntity.ok("Reset password link has been sent to your email.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/api/v1/auth/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            userService.resetPassword(request.getToken(), request.getPassword());
            return ResponseEntity.ok("Password has been reset successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/api/v1/auth/check-token")
    public ResponseEntity<?> checkToken(@RequestParam("token") String token, @RequestParam(value = "action", required = false) String action) {
        boolean isValid = userService.isTokenValid(token, action);
        return ResponseEntity.ok(java.util.Map.of("valid", isValid));
    }
}
