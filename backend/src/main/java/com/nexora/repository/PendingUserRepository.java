package com.nexora.repository;

import com.nexora.model.PendingUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PendingUserRepository extends JpaRepository<PendingUser, Long> {
    Optional<PendingUser> findByEmail(String email);
    Optional<PendingUser> findByEmailIgnoreCase(String email);
    Optional<PendingUser> findByVerificationToken(String token);
}
