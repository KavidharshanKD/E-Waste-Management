package com.ewaste.management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

    @Column(name = "actual_pickup_date")
    private LocalDateTime actualPickupDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "SCHEDULED";

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

    public LocalDateTime getActualPickupDate() {
        return actualPickupDate;
    }

    public void setActualPickupDate(LocalDateTime actualPickupDate) {
        this.actualPickupDate = actualPickupDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
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
