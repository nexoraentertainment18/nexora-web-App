package com.nexora.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "games")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String genre;

    @Column(nullable = false)
    private String platform;

    @Column(name = "cover_url", columnDefinition = "TEXT")
    private String coverUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "game_likes", joinColumns = @JoinColumn(name = "game_id"))
    @Column(name = "user_id")
    private Set<Long> likedByUserIds = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "game_comments", joinColumns = @JoinColumn(name = "game_id"))
    private List<GameComment> comments = new ArrayList<>();

    public Game() {
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getCoverUrl() { return coverUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }

    public Set<Long> getLikedByUserIds() { return likedByUserIds; }
    public void setLikedByUserIds(Set<Long> likedByUserIds) { this.likedByUserIds = likedByUserIds; }

    public List<GameComment> getComments() { return comments; }
    public void setComments(List<GameComment> comments) { this.comments = comments; }

    @Embeddable
    public static class GameComment {
        @Column(name = "user_id", nullable = false)
        private Long userId;

        @Column(name = "user_name", nullable = false)
        private String userName;

        @Column(nullable = false, columnDefinition = "TEXT")
        private String text;

        @Column(name = "created_at", nullable = false)
        private LocalDateTime createdAt;

        public GameComment() {
        }

        public GameComment(Long userId, String userName, String text) {
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
