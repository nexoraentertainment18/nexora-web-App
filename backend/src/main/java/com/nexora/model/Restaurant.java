package com.nexora.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "restaurants")
public class Restaurant {

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

    @Column(name = "special_items", nullable = false)
    private String specialItems;

    @Column(name = "price_range", nullable = false)
    private String priceRange;

    @Column(name = "menu_image_url", columnDefinition = "TEXT")
    private String menuImageUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "restaurant_likes", joinColumns = @JoinColumn(name = "restaurant_id"))
    @Column(name = "user_id")
    private Set<Long> likedByUserIds = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "restaurant_comments", joinColumns = @JoinColumn(name = "restaurant_id"))
    private List<RestaurantComment> comments = new ArrayList<>();

    public Restaurant() {
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

    public String getSpecialItems() { return specialItems; }
    public void setSpecialItems(String specialItems) { this.specialItems = specialItems; }

    public String getPriceRange() { return priceRange; }
    public void setPriceRange(String priceRange) { this.priceRange = priceRange; }

    public String getMenuImageUrl() { return menuImageUrl; }
    public void setMenuImageUrl(String menuImageUrl) { this.menuImageUrl = menuImageUrl; }

    public Set<Long> getLikedByUserIds() { return likedByUserIds; }
    public void setLikedByUserIds(Set<Long> likedByUserIds) { this.likedByUserIds = likedByUserIds; }

    public List<RestaurantComment> getComments() { return comments; }
    public void setComments(List<RestaurantComment> comments) { this.comments = comments; }

    @Embeddable
    public static class RestaurantComment {
        @Column(name = "user_id", nullable = false)
        private Long userId;

        @Column(name = "user_name", nullable = false)
        private String userName;

        @Column(nullable = false, columnDefinition = "TEXT")
        private String text;

        @Column(name = "created_at", nullable = false)
        private LocalDateTime createdAt;

        public RestaurantComment() {
        }

        public RestaurantComment(Long userId, String userName, String text) {
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
