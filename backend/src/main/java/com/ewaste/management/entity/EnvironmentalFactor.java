package com.ewaste.management.entity;

import com.ewaste.management.model.enums.EWasteCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Entity
@Table(name = "environmental_factors")
public class EnvironmentalFactor extends BaseEntity {

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, unique = true, length = 50)
    private EWasteCategory category;

    @Column(name = "landfill_diversion_kg_per_unit", precision = 10, scale = 2, nullable = false)
    private BigDecimal landfillDiversionKgPerUnit = BigDecimal.ZERO;

    @Column(name = "co2_reduction_kg_per_unit", precision = 10, scale = 2, nullable = false)
    private BigDecimal co2ReductionKgPerUnit = BigDecimal.ZERO;

    @Column(name = "recovered_metals_kg_per_unit", precision = 10, scale = 2, nullable = false)
    private BigDecimal recoveredMetalsKgPerUnit = BigDecimal.ZERO;

    @Column(name = "recovered_plastics_kg_per_unit", precision = 10, scale = 2, nullable = false)
    private BigDecimal recoveredPlasticsKgPerUnit = BigDecimal.ZERO;

    @NotBlank
    @Column(name = "source_reference", nullable = false, length = 255)
    private String sourceReference;

    @Column(name = "is_valid_factor", nullable = false)
    private boolean validFactor = true;

    public EnvironmentalFactor() {}

    public EWasteCategory getCategory() {
        return category;
    }

    public void setCategory(EWasteCategory category) {
        this.category = category;
    }

    public BigDecimal getLandfillDiversionKgPerUnit() {
        return landfillDiversionKgPerUnit;
    }

    public void setLandfillDiversionKgPerUnit(BigDecimal landfillDiversionKgPerUnit) {
        this.landfillDiversionKgPerUnit = landfillDiversionKgPerUnit;
    }

    public BigDecimal getCo2ReductionKgPerUnit() {
        return co2ReductionKgPerUnit;
    }

    public void setCo2ReductionKgPerUnit(BigDecimal co2ReductionKgPerUnit) {
        this.co2ReductionKgPerUnit = co2ReductionKgPerUnit;
    }

    public BigDecimal getRecoveredMetalsKgPerUnit() {
        return recoveredMetalsKgPerUnit;
    }

    public void setRecoveredMetalsKgPerUnit(BigDecimal recoveredMetalsKgPerUnit) {
        this.recoveredMetalsKgPerUnit = recoveredMetalsKgPerUnit;
    }

    public BigDecimal getRecoveredPlasticsKgPerUnit() {
        return recoveredPlasticsKgPerUnit;
    }

    public void setRecoveredPlasticsKgPerUnit(BigDecimal recoveredPlasticsKgPerUnit) {
        this.recoveredPlasticsKgPerUnit = recoveredPlasticsKgPerUnit;
    }

    public String getSourceReference() {
        return sourceReference;
    }

    public void setSourceReference(String sourceReference) {
        this.sourceReference = sourceReference;
    }

    public boolean isValidFactor() {
        return validFactor;
    }

    public void setValidFactor(boolean validFactor) {
        this.validFactor = validFactor;
    }
}
