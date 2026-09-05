package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.RequestStatus;

import java.time.LocalDateTime;
import java.util.List;

public class PublicTrackDTO {
    private String trackingNumber;
    private String category;
    private String deviceName;
    private Integer quantity;
    private String condition;
    private RequestStatus status;
    private String processingStage;
    private DisposalAction recommendedAction;
    private String recyclingCenterName;
    private boolean isCompleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String qrCodeDataUrl;
    private List<StatusTimelineItemDTO> statusTimeline;

    public PublicTrackDTO() {}

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public String getProcessingStage() { return processingStage; }
    public void setProcessingStage(String processingStage) { this.processingStage = processingStage; }

    public DisposalAction getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(DisposalAction recommendedAction) { this.recommendedAction = recommendedAction; }

    public String getRecyclingCenterName() { return recyclingCenterName; }
    public void setRecyclingCenterName(String recyclingCenterName) { this.recyclingCenterName = recyclingCenterName; }

    public boolean isCompleted() { return isCompleted; }
    public void setCompleted(boolean completed) { isCompleted = completed; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getQrCodeDataUrl() { return qrCodeDataUrl; }
    public void setQrCodeDataUrl(String qrCodeDataUrl) { this.qrCodeDataUrl = qrCodeDataUrl; }

    public List<StatusTimelineItemDTO> getStatusTimeline() { return statusTimeline; }
    public void setStatusTimeline(List<StatusTimelineItemDTO> statusTimeline) { this.statusTimeline = statusTimeline; }

    public static class StatusTimelineItemDTO {
        private RequestStatus status;
        private String stageLabel;
        private String comment;
        private LocalDateTime timestamp;

        public StatusTimelineItemDTO() {}

        public StatusTimelineItemDTO(RequestStatus status, String stageLabel, String comment, LocalDateTime timestamp) {
            this.status = status;
            this.stageLabel = stageLabel;
            this.comment = comment;
            this.timestamp = timestamp;
        }

        public RequestStatus getStatus() { return status; }
        public void setStatus(RequestStatus status) { this.status = status; }

        public String getStageLabel() { return stageLabel; }
        public void setStageLabel(String stageLabel) { this.stageLabel = stageLabel; }

        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }

        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }
}
