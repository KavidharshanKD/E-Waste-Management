package com.ewaste.management.dto.technician;

import com.ewaste.management.model.enums.RestorationStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class UpdateRestorationProgressDTO {

    @NotNull(message = "New restoration status is required")
    private RestorationStatus status;

    private String workPerformed;
    private String partsReplaced;
    private String technicianNotes;

    @DecimalMin(value = "0.0", inclusive = true, message = "Parts cost cannot be negative")
    private BigDecimal partsCost;

    @DecimalMin(value = "0.0", inclusive = true, message = "Labor cost cannot be negative")
    private BigDecimal laborCost;

    public UpdateRestorationProgressDTO() {}

    public RestorationStatus getStatus() {
        return status;
    }

    public void setStatus(RestorationStatus status) {
        this.status = status;
    }

    public String getWorkPerformed() {
        return workPerformed;
    }

    public void setWorkPerformed(String workPerformed) {
        this.workPerformed = workPerformed;
    }

    public String getPartsReplaced() {
        return partsReplaced;
    }

    public void setPartsReplaced(String partsReplaced) {
        this.partsReplaced = partsReplaced;
    }

    public String getTechnicianNotes() {
        return technicianNotes;
    }

    public void setTechnicianNotes(String technicianNotes) {
        this.technicianNotes = technicianNotes;
    }

    public BigDecimal getPartsCost() {
        return partsCost;
    }

    public void setPartsCost(BigDecimal partsCost) {
        this.partsCost = partsCost;
    }

    public BigDecimal getLaborCost() {
        return laborCost;
    }

    public void setLaborCost(BigDecimal laborCost) {
        this.laborCost = laborCost;
    }
}
