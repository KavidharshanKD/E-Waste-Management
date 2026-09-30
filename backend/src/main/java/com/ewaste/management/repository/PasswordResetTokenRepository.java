package com.ewaste.management.repository;

import com.ewaste.management.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findFirstByEmailAndTokenAndUsedFalseOrderByCreatedAtDesc(String email, String token);
}
