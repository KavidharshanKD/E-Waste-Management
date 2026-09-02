package com.ewaste.management.dto;

import com.ewaste.management.model.enums.RequestStatus;
import java.time.LocalDateTime;

public class DisposalStatusHistoryDTO {
    private Long id;
    private Long disposalRequestId;
    private RequestStatus fromStatus;
    private RequestStatus toStatus;
    private Long changedById;
    private String changedByEmail;
    private String comment;
    private LocalDateTime timestamp;

    public DisposalStatusHistoryDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDisposalRequestId() { return disposalRequestId; }
    public void setDisposalRequestId(Long disposalRequestId) { this.disposalRequestId = disposalRequestId; }

    public RequestStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(RequestStatus fromStatus) { this.fromStatus = fromStatus; }

    public RequestStatus getToStatus() { return toStatus; }
    public void setToStatus(RequestStatus toStatus) { this.toStatus = toStatus; }

    public Long getChangedById() { return changedById; }
    public void setChangedById(Long changedById) { this.changedById = changedById; }

    public String getChangedByEmail() { return changedByEmail; }
    public void setChangedByEmail(String changedByEmail) { this.changedByEmail = changedByEmail; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
