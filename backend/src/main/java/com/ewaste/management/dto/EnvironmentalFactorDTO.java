package com.ewaste.management.dto;

import java.math.BigDecimal;

public class EnvironmentalFactorDTO {
    private Long id;
    private String category;
    private BigDecimal landfillDiversionKgPerUnit;
    private BigDecimal co2ReductionKgPerUnit;
    private BigDecimal recoveredMetalsKgPerUnit;
    private BigDecimal recoveredPlasticsKgPerUnit;
    private String sourceReference;
    private boolean validFactor;

    public EnvironmentalFactorDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getLandfillDiversionKgPerUnit() { return landfillDiversionKgPerUnit; }
    public void setLandfillDiversionKgPerUnit(BigDecimal landfillDiversionKgPerUnit) { this.landfillDiversionKgPerUnit = landfillDiversionKgPerUnit; }

    public BigDecimal getCo2ReductionKgPerUnit() { return co2ReductionKgPerUnit; }
    public void setCo2ReductionKgPerUnit(BigDecimal co2ReductionKgPerUnit) { this.co2ReductionKgPerUnit = co2ReductionKgPerUnit; }

    public BigDecimal getRecoveredMetalsKgPerUnit() { return recoveredMetalsKgPerUnit; }
    public void setRecoveredMetalsKgPerUnit(BigDecimal recoveredMetalsKgPerUnit) { this.recoveredMetalsKgPerUnit = recoveredMetalsKgPerUnit; }

    public BigDecimal getRecoveredPlasticsKgPerUnit() { return recoveredPlasticsKgPerUnit; }
    public void setRecoveredPlasticsKgPerUnit(BigDecimal recoveredPlasticsKgPerUnit) { this.recoveredPlasticsKgPerUnit = recoveredPlasticsKgPerUnit; }

    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }

    public boolean isValidFactor() { return validFactor; }
    public void setValidFactor(boolean validFactor) { this.validFactor = validFactor; }
}
