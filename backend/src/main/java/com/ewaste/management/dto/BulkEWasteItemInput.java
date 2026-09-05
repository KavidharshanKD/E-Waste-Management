package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class BulkEWasteItemInput {

    @NotNull(message = "Category is required")
    private EWasteCategory category;

    private String deviceName;
    private String brand;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity = 1;

    private DeviceCondition condition = DeviceCondition.WORKING;
    private String workingStatus = "Working";
    private String description;

    public BulkEWasteItemInput() {}

    public EWasteCategory getCategory() { return category; }
    public void setCategory(EWasteCategory category) { this.category = category; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public DeviceCondition getCondition() { return condition; }
    public void setCondition(DeviceCondition condition) { this.condition = condition; }

    public String getWorkingStatus() { return workingStatus; }
    public void setWorkingStatus(String workingStatus) { this.workingStatus = workingStatus; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
