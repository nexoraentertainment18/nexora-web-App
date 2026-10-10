package com.nexora.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified;

    @JsonIgnore
    @Column(name = "verification_token")
    private String verificationToken;

    @JsonIgnore
    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "fav_movie_genre")
    private String favMovieGenre;

    @Column(name = "fav_place_type")
    private String favPlaceType;

    @Column(name = "fav_series_genre")
    private String favSeriesGenre;

    @Column(name = "fav_game_type")
    private String favGameType;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "role")
    private String role = "USER";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "profile_picture", columnDefinition = "TEXT")
    private String profilePicture;

    public User() {
    }

    public User(String firstName, String lastName, String email, String mobileNumber, String favMovieGenre, String favPlaceType, String favSeriesGenre, String favGameType) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.mobileNumber = mobileNumber;
        this.favMovieGenre = favMovieGenre;
        this.favPlaceType = favPlaceType;
        this.favSeriesGenre = favSeriesGenre;
        this.favGameType = favGameType;
        this.isVerified = false;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public boolean isVerified() { return isVerified; }
    public void setVerified(boolean verified) { isVerified = verified; }

    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }

    public String getFavMovieGenre() { return favMovieGenre; }
    public void setFavMovieGenre(String favMovieGenre) { this.favMovieGenre = favMovieGenre; }

    public String getFavPlaceType() { return favPlaceType; }
    public void setFavPlaceType(String favPlaceType) { this.favPlaceType = favPlaceType; }

    public String getFavSeriesGenre() { return favSeriesGenre; }
    public void setFavSeriesGenre(String favSeriesGenre) { this.favSeriesGenre = favSeriesGenre; }

    public String getFavGameType() { return favGameType; }
    public void setFavGameType(String favGameType) { this.favGameType = favGameType; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public String getResetPasswordToken() { return resetPasswordToken; }
    public void setResetPasswordToken(String resetPasswordToken) { this.resetPasswordToken = resetPasswordToken; }
}
