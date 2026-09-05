package com.ewaste.management.dto;

import com.ewaste.management.model.enums.PickupTimeSlot;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDateTime;

public class SchedulePickupRequestDTO {

    @NotNull(message = "Disposal request ID is required")
    private Long disposalRequestId;

    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;

    @NotNull(message = "Preferred date is required")
    private LocalDateTime preferredDate;

    @NotNull(message = "Preferred time slot is required")
    private PickupTimeSlot preferredTimeSlot;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Contact number must be a valid 10-digit mobile number")
    private String contactNumber;

    private String notes;

    public SchedulePickupRequestDTO() {}

    public Long getDisposalRequestId() { return disposalRequestId; }
    public void setDisposalRequestId(Long disposalRequestId) { this.disposalRequestId = disposalRequestId; }

    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }

    public LocalDateTime getPreferredDate() { return preferredDate; }
    public void setPreferredDate(LocalDateTime preferredDate) { this.preferredDate = preferredDate; }

    public PickupTimeSlot getPreferredTimeSlot() { return preferredTimeSlot; }
    public void setPreferredTimeSlot(PickupTimeSlot preferredTimeSlot) { this.preferredTimeSlot = preferredTimeSlot; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
