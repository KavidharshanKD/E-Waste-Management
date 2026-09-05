package com.ewaste.management.dto;

import com.ewaste.management.model.enums.PickupStatus;
import jakarta.validation.constraints.NotNull;

public class UpdatePickupStatusDTO {

    @NotNull(message = "Pickup status is required")
    private PickupStatus status;

    private String collectorNotes;

    public UpdatePickupStatusDTO() {}

    public UpdatePickupStatusDTO(PickupStatus status, String collectorNotes) {
        this.status = status;
        this.collectorNotes = collectorNotes;
    }

    public PickupStatus getStatus() { return status; }
    public void setStatus(PickupStatus status) { this.status = status; }

    public String getCollectorNotes() { return collectorNotes; }
    public void setCollectorNotes(String collectorNotes) { this.collectorNotes = collectorNotes; }
}
