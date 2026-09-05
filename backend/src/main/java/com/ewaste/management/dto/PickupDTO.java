package com.ewaste.management.dto;

import com.ewaste.management.model.enums.PickupTimeSlot;
import java.time.LocalDateTime;
import java.util.List;

public class PickupDTO {
    private Long id;
    private Long disposalRequestId;
    private String trackingNumber;
    private Long collectorId;
    private String collectorName;
    private LocalDateTime scheduledDate;
    private PickupTimeSlot timeSlot;
    private String pickupAddress;
    private String contactNumber;
    private String notes;
    private LocalDateTime actualPickupDate;
    private String status;
    private String collectorNotes;
    private String verificationCode;

    // Device summary details for collector view
    private List<EWasteItemDTO> items;
    private String userName;

    public PickupDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDisposalRequestId() { return disposalRequestId; }
    public void setDisposalRequestId(Long disposalRequestId) { this.disposalRequestId = disposalRequestId; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public Long getCollectorId() { return collectorId; }
    public void setCollectorId(Long collectorId) { this.collectorId = collectorId; }

    public String getCollectorName() { return collectorName; }
    public void setCollectorName(String collectorName) { this.collectorName = collectorName; }

    public LocalDateTime getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDateTime scheduledDate) { this.scheduledDate = scheduledDate; }

    public PickupTimeSlot getTimeSlot() { return timeSlot; }
    public void setTimeSlot(PickupTimeSlot timeSlot) { this.timeSlot = timeSlot; }

    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getActualPickupDate() { return actualPickupDate; }
    public void setActualPickupDate(LocalDateTime actualPickupDate) { this.actualPickupDate = actualPickupDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCollectorNotes() { return collectorNotes; }
    public void setCollectorNotes(String collectorNotes) { this.collectorNotes = collectorNotes; }

    public String getVerificationCode() { return verificationCode; }
    public void setVerificationCode(String verificationCode) { this.verificationCode = verificationCode; }

    public List<EWasteItemDTO> getItems() { return items; }
    public void setItems(List<EWasteItemDTO> items) { this.items = items; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
}
