package com.ewaste.management.dto;

import com.ewaste.management.model.enums.OrganizationType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class BulkEWasteRequestDTO {

    private String organizationName;
    private OrganizationType organizationType;
    private String gstNumber;
    private String contactPerson;

    @NotBlank(message = "Contact phone number is required")
    private String contactPhone;

    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;

    @NotBlank(message = "City is required")
    private String pickupCity;

    @NotBlank(message = "State is required")
    private String pickupState;

    @NotBlank(message = "Postal code is required")
    private String pickupPostalCode;

    private LocalDateTime preferredDate;
    private String preferredTimeSlot = "MORNING";
    private String notes;

    @NotEmpty(message = "At least one bulk e-waste item is required")
    @Valid
    private List<BulkEWasteItemInput> items = new ArrayList<>();

    public BulkEWasteRequestDTO() {}

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public OrganizationType getOrganizationType() { return organizationType; }
    public void setOrganizationType(OrganizationType organizationType) { this.organizationType = organizationType; }

    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }

    public String getPickupCity() { return pickupCity; }
    public void setPickupCity(String pickupCity) { this.pickupCity = pickupCity; }

    public String getPickupState() { return pickupState; }
    public void setPickupState(String pickupState) { this.pickupState = pickupState; }

    public String getPickupPostalCode() { return pickupPostalCode; }
    public void setPickupPostalCode(String pickupPostalCode) { this.pickupPostalCode = pickupPostalCode; }

    public LocalDateTime getPreferredDate() { return preferredDate; }
    public void setPreferredDate(LocalDateTime preferredDate) { this.preferredDate = preferredDate; }

    public String getPreferredTimeSlot() { return preferredTimeSlot; }
    public void setPreferredTimeSlot(String preferredTimeSlot) { this.preferredTimeSlot = preferredTimeSlot; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<BulkEWasteItemInput> getItems() { return items; }
    public void setItems(List<BulkEWasteItemInput> items) { this.items = items; }
}
