package com.nexora.service;

import com.nexora.config.JwtUtil;
import com.nexora.dto.AuthResponse;
import com.nexora.dto.LoginRequest;
import com.nexora.dto.SignupRequest;
import com.nexora.dto.UserDto;
import com.nexora.model.User;
import com.nexora.model.PendingUser;
import com.nexora.repository.UserRepository;
import com.nexora.repository.PendingUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PendingUserRepository pendingUserRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @Autowired
    private FileStorageService fileStorageService;

    // Base URL for links in verification and reset-password emails
    @Value("${app.frontend-url}")
    private String frontendUrl;

    public UserDto signup(SignupRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            if (user.isVerified()) {
                throw new RuntimeException("Email already in use.");
            }

            String token = user.getVerificationToken();
            if (token == null || token.isBlank()) {
                token = UUID.randomUUID().toString();
                user.setVerificationToken(token);
            }
            userRepository.save(user);
            sendVerificationEmail(user.getEmail(), user.getFirstName() + " " + user.getLastName(), token);
            return new UserDto(user);
        }

        PendingUser pendingUser = pendingUserRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> new PendingUser(
                        request.getFirstName(),
                        request.getLastName(),
                        email,
                        request.getMobileNumber(),
                        request.getFavMovieGenre(),
                        request.getFavPlaceType(),
                        request.getFavSeriesGenre(),
                        request.getFavGameType(),
                        UUID.randomUUID().toString()
                ));

        pendingUser.setFirstName(request.getFirstName());
        pendingUser.setLastName(request.getLastName());
        pendingUser.setEmail(email);
        pendingUser.setMobileNumber(request.getMobileNumber());
        pendingUser.setFavMovieGenre(request.getFavMovieGenre());
        pendingUser.setFavPlaceType(request.getFavPlaceType());
        pendingUser.setFavSeriesGenre(request.getFavSeriesGenre());
        pendingUser.setFavGameType(request.getFavGameType());
        PendingUser savedPending = pendingUserRepository.save(pendingUser);

        sendVerificationEmail(
                savedPending.getEmail(),
                savedPending.getFirstName() + " " + savedPending.getLastName(),
                savedPending.getVerificationToken()
        );
        return new UserDto(savedPending);
    }

    private void sendVerificationEmail(String email, String fullName, String token) {
        String verificationUrl = frontendUrl + "/set-password?token=" + token;
        try {
            emailService.sendVerificationEmail(email, fullName, verificationUrl);
        } catch (Exception e) {
            LOGGER.error("Failed to send account verification email.", e);
            throw new RuntimeException(
                    "Your registration is saved, but the verification email could not be sent. Submit this form again with the same email to retry. If this keeps failing, contact support.",
                    e
            );
        }
    }

    public User verifyAndSetPassword(String token, String password) {
        Optional<PendingUser> pendingUserResult = pendingUserRepository.findByVerificationToken(token);
        if (pendingUserResult.isEmpty()) {
            User existingUser = userRepository.findByVerificationToken(token)
                    .orElseThrow(() -> new RuntimeException("Invalid or expired verification token."));
            if (existingUser.isVerified()) {
                throw new RuntimeException("Invalid or expired verification token.");
            }

            existingUser.setPasswordHash(passwordEncoder.encode(password));
            existingUser.setVerified(true);
            existingUser.setVerificationToken(null);
            return userRepository.save(existingUser);
        }
        PendingUser pendingUser = pendingUserResult.get();

        if (userRepository.findByEmail(pendingUser.getEmail()).isPresent()) {
            pendingUserRepository.delete(pendingUser);
            throw new RuntimeException("Email already in use.");
        }

        User user = new User(
                pendingUser.getFirstName(),
                pendingUser.getLastName(),
                pendingUser.getEmail(),
                pendingUser.getMobileNumber(),
                pendingUser.getFavMovieGenre(),
                pendingUser.getFavPlaceType(),
                pendingUser.getFavSeriesGenre(),
                pendingUser.getFavGameType()
        );

        user.setPasswordHash(passwordEncoder.encode(password));
        user.setVerified(true);

        User savedUser = userRepository.save(user);

        // Delete the pending registration details
        pendingUserRepository.delete(pendingUser);

        return savedUser;
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password."));

        if (!user.isVerified()) {
            throw new RuntimeException("Account email is not verified yet. Please set your password using the verification link.");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password.");
        }

        String fullName = user.getFirstName() + " " + user.getLastName();
        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), fullName, user.getRole());

        return new AuthResponse(token, new UserDto(user));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found."));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));
    }

    public List<UserDto> searchUsers(String query) {
        return userRepository.searchByName(query).stream()
                .filter(User::isVerified)
                .map(UserDto::new)
                .collect(Collectors.toList());
    }

    // For debugging: easily grab verification tokens for sandbox environment
    public List<PendingUser> getUnverifiedUsers() {
        return pendingUserRepository.findAll();
    }

    public User updateProfile(Long userId, String firstName, String lastName, String mobileNumber,
                               String favMovieGenre, String favPlaceType, String favSeriesGenre, String favGameType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (firstName != null && !firstName.trim().isEmpty()) user.setFirstName(firstName.trim());
        if (lastName != null && !lastName.trim().isEmpty()) user.setLastName(lastName.trim());
        if (mobileNumber != null) user.setMobileNumber(mobileNumber.trim());
        if (favMovieGenre != null) user.setFavMovieGenre(favMovieGenre.trim());
        if (favPlaceType != null) user.setFavPlaceType(favPlaceType.trim());
        if (favSeriesGenre != null) user.setFavSeriesGenre(favSeriesGenre.trim());
        if (favGameType != null) user.setFavGameType(favGameType.trim());

        return userRepository.save(user);
    }

    public User updateProfilePicture(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        try {
            String filename = fileStorageService.storeFile(file);
            user.setProfilePicture(filename);
            return userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to store profile picture.", e);
        }
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email address not found."));

        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        userRepository.save(user);

        String resetUrl = frontendUrl + "/set-password?token=" + token + "&action=reset";
        try {
            String fullName = user.getFirstName() + " " + user.getLastName();
            emailService.sendResetPasswordEmail(user.getEmail(), fullName, resetUrl);
        } catch (Exception e) {
            LOGGER.error("Failed to send password reset email.", e);
            throw new RuntimeException("Failed to send reset email. Please try again later.", e);
        }
    }

    public void resetPassword(String token, String password) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token."));

        user.setPasswordHash(passwordEncoder.encode(password));
        user.setResetPasswordToken(null);
        userRepository.save(user);
    }

    public boolean isTokenValid(String token, String action) {
        if ("reset".equalsIgnoreCase(action)) {
            return userRepository.findByResetPasswordToken(token).isPresent();
        } else {
            return pendingUserRepository.findByVerificationToken(token).isPresent()
                    || userRepository.findByVerificationToken(token)
                            .filter(user -> !user.isVerified())
                            .isPresent();
        }
    }
}
