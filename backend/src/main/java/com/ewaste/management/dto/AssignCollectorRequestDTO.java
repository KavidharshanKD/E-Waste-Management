package com.ewaste.management.dto;

import jakarta.validation.constraints.NotNull;

public class AssignCollectorRequestDTO {

    @NotNull(message = "Collector ID is required")
    private Long collectorId;

    public AssignCollectorRequestDTO() {}

    public AssignCollectorRequestDTO(Long collectorId) {
        this.collectorId = collectorId;
    }

    public Long getCollectorId() { return collectorId; }
    public void setCollectorId(Long collectorId) { this.collectorId = collectorId; }
}
