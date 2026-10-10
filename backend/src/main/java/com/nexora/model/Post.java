package com.nexora.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_likes", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "user_id")
    private Set<Long> likedByUserIds = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_comments", joinColumns = @JoinColumn(name = "post_id"))
    private List<PostComment> comments = new ArrayList<>();

    public Post() {
    }

    public Post(User user, String imageUrl, String caption) {
        this.user = user;
        this.imageUrl = imageUrl;
        this.caption = caption;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Set<Long> getLikedByUserIds() { return likedByUserIds; }
    public void setLikedByUserIds(Set<Long> likedByUserIds) { this.likedByUserIds = likedByUserIds; }

    public List<PostComment> getComments() { return comments; }
    public void setComments(List<PostComment> comments) { this.comments = comments; }

    @Embeddable
    public static class PostComment {
        @Column(name = "id", nullable = true)
        private String id;

        @Column(name = "user_id", nullable = false)
        private Long userId;

        @Column(name = "user_name", nullable = false)
        private String userName;

        @Column(nullable = false, columnDefinition = "TEXT")
        private String text;

        @Column(name = "created_at", nullable = false)
        private LocalDateTime createdAt;

        public PostComment() {
            this.id = java.util.UUID.randomUUID().toString();
        }

        public PostComment(Long userId, String userName, String text) {
            this.id = java.util.UUID.randomUUID().toString();
            this.userId = userId;
            this.userName = userName;
            this.text = text;
            this.createdAt = LocalDateTime.now();
        }

        public String getId() { 
            if (id == null) {
                id = java.util.UUID.randomUUID().toString();
            }
            return id; 
        }
        public void setId(String id) { this.id = id; }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            PostComment that = (PostComment) o;
            return getId().equals(that.getId());
        }

        @Override
        public int hashCode() {
            return java.util.Objects.hash(getId());
        }
    }
}
