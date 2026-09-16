package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserIntention;

import java.time.LocalDateTime;
import java.util.List;

public class DisposalRequestDTO {
    private Long id;
    private String trackingNumber;
    private Long userId;
    private String userEmail;
    private String userName;
    private RequestStatus status;
    private DisposalAction recommendedAction;
    private UserIntention userIntention;
    private String recommendationExplanation;
    private String handlingAdvice;
    private Boolean pickupRequired = true;
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

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public DisposalAction getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(DisposalAction recommendedAction) { this.recommendedAction = recommendedAction; }

    public UserIntention getUserIntention() { return userIntention; }
    public void setUserIntention(UserIntention userIntention) { this.userIntention = userIntention; }

    public String getRecommendationExplanation() { return recommendationExplanation; }
    public void setRecommendationExplanation(String recommendationExplanation) { this.recommendationExplanation = recommendationExplanation; }

    public String getHandlingAdvice() { return handlingAdvice; }
    public void setHandlingAdvice(String handlingAdvice) { this.handlingAdvice = handlingAdvice; }

    public Boolean getPickupRequired() { return pickupRequired; }
    public void setPickupRequired(Boolean pickupRequired) { this.pickupRequired = pickupRequired; }

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

    // Module 6: ML Audit Fields in DTO
    private com.ewaste.management.model.enums.RecommendationSource recommendationSource;
    private String mlModelVersion;
    private String mlRecoveryStatus;
    private Double mlRecoveryProbability;
    private String mlRawPathway;
    private String mlDisplayRecommendation;
    private Double mlPathwayProbability;
    private String mlConfidenceLevel;
    private Boolean technicianReviewRequired;
    private Boolean inspectionRecommended;
    private String marketplaceEligibility;
    private String mlExplanation;

    public com.ewaste.management.model.enums.RecommendationSource getRecommendationSource() { return recommendationSource; }
    public void setRecommendationSource(com.ewaste.management.model.enums.RecommendationSource recommendationSource) { this.recommendationSource = recommendationSource; }

    public String getMlModelVersion() { return mlModelVersion; }
    public void setMlModelVersion(String mlModelVersion) { this.mlModelVersion = mlModelVersion; }

    public String getMlRecoveryStatus() { return mlRecoveryStatus; }
    public void setMlRecoveryStatus(String mlRecoveryStatus) { this.mlRecoveryStatus = mlRecoveryStatus; }

    public Double getMlRecoveryProbability() { return mlRecoveryProbability; }
    public void setMlRecoveryProbability(Double mlRecoveryProbability) { this.mlRecoveryProbability = mlRecoveryProbability; }

    public String getMlRawPathway() { return mlRawPathway; }
    public void setMlRawPathway(String mlRawPathway) { this.mlRawPathway = mlRawPathway; }

    public String getMlDisplayRecommendation() { return mlDisplayRecommendation; }
    public void setMlDisplayRecommendation(String mlDisplayRecommendation) { this.mlDisplayRecommendation = mlDisplayRecommendation; }

    public Double getMlPathwayProbability() { return mlPathwayProbability; }
    public void setMlPathwayProbability(Double mlPathwayProbability) { this.mlPathwayProbability = mlPathwayProbability; }

    public String getMlConfidenceLevel() { return mlConfidenceLevel; }
    public void setMlConfidenceLevel(String mlConfidenceLevel) { this.mlConfidenceLevel = mlConfidenceLevel; }

    public Boolean getTechnicianReviewRequired() { return technicianReviewRequired; }
    public void setTechnicianReviewRequired(Boolean technicianReviewRequired) { this.technicianReviewRequired = technicianReviewRequired; }

    public Boolean getInspectionRecommended() { return inspectionRecommended; }
    public void setInspectionRecommended(Boolean inspectionRecommended) { this.inspectionRecommended = inspectionRecommended; }

    public String getMarketplaceEligibility() { return marketplaceEligibility; }
    public void setMarketplaceEligibility(String marketplaceEligibility) { this.marketplaceEligibility = marketplaceEligibility; }

    public String getMlExplanation() { return mlExplanation; }
    public void setMlExplanation(String mlExplanation) { this.mlExplanation = mlExplanation; }
}
