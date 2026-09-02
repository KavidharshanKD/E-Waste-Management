package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.RequestStatus;

import java.time.LocalDateTime;
import java.util.List;

public class DisposalRequestDTO {
    private Long id;
    private String trackingNumber;
    private Long userId;
    private String userEmail;
    private RequestStatus status;
    private DisposalAction recommendedAction;
    private String pickupAddress;
    private String pickupCity;
    private String pickupState;
    private String pickupPostalCode;
    private LocalDateTime preferredPickupDate;
    private String notes;
    private Long centerId;
    private String centerName;
    private List<EWasteItemDTO> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DisposalRequestDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public DisposalAction getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(DisposalAction recommendedAction) { this.recommendedAction = recommendedAction; }

    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }

    public String getPickupCity() { return pickupCity; }
    public void setPickupCity(String pickupCity) { this.pickupCity = pickupCity; }

    public String getPickupState() { return pickupState; }
    public void setPickupState(String pickupState) { this.pickupState = pickupState; }

    public String getPickupPostalCode() { return pickupPostalCode; }
    public void setPickupPostalCode(String pickupPostalCode) { this.pickupPostalCode = pickupPostalCode; }

    public LocalDateTime getPreferredPickupDate() { return preferredPickupDate; }
    public void setPreferredPickupDate(LocalDateTime preferredPickupDate) { this.preferredPickupDate = preferredPickupDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Long getCenterId() { return centerId; }
    public void setCenterId(Long centerId) { this.centerId = centerId; }

    public String getCenterName() { return centerName; }
    public void setCenterName(String centerName) { this.centerName = centerName; }

    public List<EWasteItemDTO> getItems() { return items; }
    public void setItems(List<EWasteItemDTO> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
