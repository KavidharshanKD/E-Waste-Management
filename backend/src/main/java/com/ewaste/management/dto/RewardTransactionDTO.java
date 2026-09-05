package com.ewaste.management.dto;

import java.time.LocalDateTime;

public class RewardTransactionDTO {
    private Long id;
    private Long userId;
    private Long disposalRequestId;
    private String trackingNumber;
    private Integer points;
    private String transactionType;
    private String description;
    private LocalDateTime createdAt;

    public RewardTransactionDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getDisposalRequestId() { return disposalRequestId; }
    public void setDisposalRequestId(Long disposalRequestId) { this.disposalRequestId = disposalRequestId; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
