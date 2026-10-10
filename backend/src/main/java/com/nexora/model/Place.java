package com.nexora.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "places")
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(name = "entry_price", nullable = false)
    private Double entryPrice;

    @Column(name = "distance_km", nullable = false)
    private Double distanceKm;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "place_likes", joinColumns = @JoinColumn(name = "place_id"))
    @Column(name = "user_id")
    private Set<Long> likedByUserIds = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "place_comments", joinColumns = @JoinColumn(name = "place_id"))
    private List<PlaceComment> comments = new ArrayList<>();

    public Place() {
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Double getEntryPrice() { return entryPrice; }
    public void setEntryPrice(Double entryPrice) { this.entryPrice = entryPrice; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public Set<Long> getLikedByUserIds() { return likedByUserIds; }
    public void setLikedByUserIds(Set<Long> likedByUserIds) { this.likedByUserIds = likedByUserIds; }

    public List<PlaceComment> getComments() { return comments; }
    public void setComments(List<PlaceComment> comments) { this.comments = comments; }

    @Embeddable
    public static class PlaceComment {
        @Column(name = "user_id", nullable = false)
        private Long userId;

        @Column(name = "user_name", nullable = false)
        private String userName;

        @Column(nullable = false, columnDefinition = "TEXT")
        private String text;

        @Column(name = "created_at", nullable = false)
        private LocalDateTime createdAt;

        public PlaceComment() {
        }

        public PlaceComment(Long userId, String userName, String text) {
            this.userId = userId;
            this.userName = userName;
            this.text = text;
            this.createdAt = LocalDateTime.now();
        }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
}
