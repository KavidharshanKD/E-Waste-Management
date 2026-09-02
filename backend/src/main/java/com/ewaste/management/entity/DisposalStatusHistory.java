package com.ewaste.management.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.ewaste.management.model.enums.RequestStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name = "disposal_status_histories")
public class DisposalStatusHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    @JsonBackReference
    private DisposalRequest disposalRequest;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private RequestStatus fromStatus;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private RequestStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_id")
    private User changedBy;

    @Column(name = "comment", length = 500)
    private String comment;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public DisposalStatusHistory() {}

    public DisposalRequest getDisposalRequest() {
        return disposalRequest;
    }

    public void setDisposalRequest(DisposalRequest disposalRequest) {
        this.disposalRequest = disposalRequest;
    }

    public RequestStatus getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(RequestStatus fromStatus) {
        this.fromStatus = fromStatus;
    }

    public RequestStatus getToStatus() {
        return toStatus;
    }

    public void setToStatus(RequestStatus toStatus) {
        this.toStatus = toStatus;
    }

    public User getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(User changedBy) {
        this.changedBy = changedBy;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
