package com.ewaste.management.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.RequestStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "disposal_requests")
public class DisposalRequest extends BaseEntity {

    @NotBlank
    @Column(name = "tracking_number", nullable = false, unique = true, length = 50)
    private String trackingNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RequestStatus status = RequestStatus.SUBMITTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "recommended_action", length = 30)
    private DisposalAction recommendedAction;

    @Column(name = "pickup_address", nullable = false, length = 255)
    private String pickupAddress;

    @Column(name = "pickup_city", nullable = false, length = 100)
    private String pickupCity;

    @Column(name = "pickup_state", nullable = false, length = 100)
    private String pickupState;

    @Column(name = "pickup_postal_code", nullable = false, length = 20)
    private String pickupPostalCode;

    @Column(name = "preferred_pickup_date")
    private LocalDateTime preferredPickupDate;

    @Column(name = "pickup_required", nullable = false)
    private Boolean pickupRequired = true;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "recommendation_explanation", columnDefinition = "TEXT")
    private String recommendationExplanation;

    @Column(name = "handling_advice", columnDefinition = "TEXT")
    private String handlingAdvice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "center_id")
    private RecyclingCenter center;

    @OneToMany(mappedBy = "disposalRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<EWasteItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "disposalRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<DisposalStatusHistory> statusHistories = new ArrayList<>();

    public DisposalRequest() {}

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public DisposalAction getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(DisposalAction recommendedAction) {
        this.recommendedAction = recommendedAction;
    }

    public String getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }

    public String getPickupCity() {
        return pickupCity;
    }

    public void setPickupCity(String pickupCity) {
        this.pickupCity = pickupCity;
    }

    public String getPickupState() {
        return pickupState;
    }

    public void setPickupState(String pickupState) {
        this.pickupState = pickupState;
    }

    public String getPickupPostalCode() {
        return pickupPostalCode;
    }

    public void setPickupPostalCode(String pickupPostalCode) {
        this.pickupPostalCode = pickupPostalCode;
    }

    public LocalDateTime getPreferredPickupDate() {
        return preferredPickupDate;
    }

    public void setPreferredPickupDate(LocalDateTime preferredPickupDate) {
        this.preferredPickupDate = preferredPickupDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getRecommendationExplanation() {
        return recommendationExplanation;
    }

    public void setRecommendationExplanation(String recommendationExplanation) {
        this.recommendationExplanation = recommendationExplanation;
    }

    public String getHandlingAdvice() {
        return handlingAdvice;
    }

    public void setHandlingAdvice(String handlingAdvice) {
        this.handlingAdvice = handlingAdvice;
    }

    public Boolean getPickupRequired() {
        return pickupRequired;
    }

    public void setPickupRequired(Boolean pickupRequired) {
        this.pickupRequired = pickupRequired;
    }

    public RecyclingCenter getCenter() {
        return center;
    }

    public void setCenter(RecyclingCenter center) {
        this.center = center;
    }

    public List<EWasteItem> getItems() {
        return items;
    }

    public void setItems(List<EWasteItem> items) {
        this.items = items;
    }

    public void addItem(EWasteItem item) {
        items.add(item);
        item.setDisposalRequest(this);
    }

    public List<DisposalStatusHistory> getStatusHistories() {
        return statusHistories;
    }

    public void setStatusHistories(List<DisposalStatusHistory> statusHistories) {
        this.statusHistories = statusHistories;
    }

    public void addStatusHistory(DisposalStatusHistory history) {
        statusHistories.add(history);
        history.setDisposalRequest(this);
    }
}
