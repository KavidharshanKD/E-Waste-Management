package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class CreateEWasteRequestDTO {

    @NotNull(message = "Device category is required")
    private EWasteCategory category;

    @NotBlank(message = "Device name is required")
    private String deviceName;

    private String brand;

    @Min(value = 0, message = "Approximate age must be 0 or greater")
    private Integer approxAgeYears;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity = 1;

    @NotNull(message = "Condition is required")
    private DeviceCondition condition;

    private String workingStatus;

    private String description;

    @NotNull(message = "Pickup required status is required")
    private Boolean pickupRequired = true;

    @NotBlank(message = "Address is required")
    private String pickupAddress;

    @NotBlank(message = "City is required")
    private String pickupCity;

    @NotBlank(message = "State is required")
    private String pickupState;

    @NotBlank(message = "Pincode is required")
    @Pattern(regexp = "^[1-9][0-9]{5}$", message = "Pincode must be a valid 6-digit Indian PIN code")
    private String pickupPostalCode;

    public CreateEWasteRequestDTO() {}

    public EWasteCategory getCategory() { return category; }
    public void setCategory(EWasteCategory category) { this.category = category; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public Integer getApproxAgeYears() { return approxAgeYears; }
    public void setApproxAgeYears(Integer approxAgeYears) { this.approxAgeYears = approxAgeYears; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public DeviceCondition getCondition() { return condition; }
    public void setCondition(DeviceCondition condition) { this.condition = condition; }

    public String getWorkingStatus() { return workingStatus; }
    public void setWorkingStatus(String workingStatus) { this.workingStatus = workingStatus; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

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
}
