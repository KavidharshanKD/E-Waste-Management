package com.ewaste.management.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Entity
@Table(name = "ewaste_items")
public class EWasteItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    @JsonBackReference
    private DisposalRequest disposalRequest;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private EWasteCategory category;

    @Column(name = "brand", length = 100)
    private String brand;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "condition", nullable = false, length = 30)
    private DeviceCondition condition;

    @Column(name = "weight_kg", precision = 8, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "estimated_reward_points")
    private Integer estimatedRewardPoints = 0;

    public EWasteItem() {}

    public DisposalRequest getDisposalRequest() {
        return disposalRequest;
    }

    public void setDisposalRequest(DisposalRequest disposalRequest) {
        this.disposalRequest = disposalRequest;
    }

    public EWasteCategory getCategory() {
        return category;
    }

    public void setCategory(EWasteCategory category) {
        this.category = category;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public DeviceCondition getCondition() {
        return condition;
    }

    public void setCondition(DeviceCondition condition) {
        this.condition = condition;
    }

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getEstimatedRewardPoints() {
        return estimatedRewardPoints;
    }

    public void setEstimatedRewardPoints(Integer estimatedRewardPoints) {
        this.estimatedRewardPoints = estimatedRewardPoints;
    }
}
