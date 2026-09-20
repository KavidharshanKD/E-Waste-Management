package com.ewaste.management.dto.marketplace;

import java.time.LocalDateTime;

public class DeviceJourneyEventDTO {
    private String stage;
    private String title;
    private String description;
    private String facilityName;
    private LocalDateTime timestamp;

    public DeviceJourneyEventDTO() {
    }

    public DeviceJourneyEventDTO(String stage, String title, String description, String facilityName, LocalDateTime timestamp) {
        this.stage = stage;
        this.title = title;
        this.description = description;
        this.facilityName = facilityName;
        this.timestamp = timestamp;
    }

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public void setFacilityName(String facilityName) {
        this.facilityName = facilityName;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
