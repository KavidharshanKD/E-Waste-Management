package com.ewaste.management.entity;

import com.ewaste.management.model.enums.PickupStatus;
import com.ewaste.management.model.enums.PickupTimeSlot;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "pickups")
public class Pickup extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private DisposalRequest disposalRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collector_id")
    private User collector;

    @Column(name = "scheduled_date")
    private LocalDateTime scheduledDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "time_slot", length = 30)
    private PickupTimeSlot timeSlot;

    @Column(name = "contact_number", length = 30)
    private String contactNumber;

    @Column(name = "pickup_address", length = 255)
    private String pickupAddress;

    @Column(name = "user_notes", length = 1000)
    private String userNotes;

    @Column(name = "actual_pickup_date")
    private LocalDateTime actualPickupDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PickupStatus status = PickupStatus.SCHEDULED;

    @Column(name = "collector_notes", length = 500)
    private String collectorNotes;

    @Column(name = "verification_code", length = 20)
    private String verificationCode;

    public Pickup() {}

    public DisposalRequest getDisposalRequest() {
        return disposalRequest;
    }

    public void setDisposalRequest(DisposalRequest disposalRequest) {
        this.disposalRequest = disposalRequest;
    }

    public User getCollector() {
        return collector;
    }

    public void setCollector(User collector) {
        this.collector = collector;
    }

    public LocalDateTime getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDateTime scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public PickupTimeSlot getTimeSlot() {
        return timeSlot;
    }

    public void setTimeSlot(PickupTimeSlot timeSlot) {
        this.timeSlot = timeSlot;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }

    public String getUserNotes() {
        return userNotes;
    }

    public void setUserNotes(String userNotes) {
        this.userNotes = userNotes;
    }

    public LocalDateTime getActualPickupDate() {
        return actualPickupDate;
    }

    public void setActualPickupDate(LocalDateTime actualPickupDate) {
        this.actualPickupDate = actualPickupDate;
    }

    public PickupStatus getStatus() {
        return status;
    }

    public void setStatus(PickupStatus status) {
        this.status = status;
    }

    public String getCollectorNotes() {
        return collectorNotes;
    }

    public void setCollectorNotes(String collectorNotes) {
        this.collectorNotes = collectorNotes;
    }

    public String getVerificationCode() {
        return verificationCode;
    }

    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }
}

