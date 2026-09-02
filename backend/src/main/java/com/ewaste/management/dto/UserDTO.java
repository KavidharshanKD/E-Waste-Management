package com.ewaste.management.dto;

import com.ewaste.management.model.enums.UserRole;
import java.time.LocalDateTime;

public class UserDTO {
    private Long id;
    private String email;
    private UserRole role;
    private boolean active;
    private Integer rewardPointsBalance;
    private UserProfileDTO profile;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UserDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Integer getRewardPointsBalance() { return rewardPointsBalance; }
    public void setRewardPointsBalance(Integer rewardPointsBalance) { this.rewardPointsBalance = rewardPointsBalance; }

    public UserProfileDTO getProfile() { return profile; }
    public void setProfile(UserProfileDTO profile) { this.profile = profile; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
