package com.ewaste.management.dto.marketplace;

import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.EWasteCategory;

import java.util.ArrayList;
import java.util.List;

public class DeviceJourneyDTO {
    private String serialOrTrackingReference;
    private EWasteCategory category;
    private String brand;
    private String model;
    private CosmeticGrade cosmeticGrade;
    private List<DeviceJourneyEventDTO> events = new ArrayList<>();

    public DeviceJourneyDTO() {
    }

    public String getSerialOrTrackingReference() {
        return serialOrTrackingReference;
    }

    public void setSerialOrTrackingReference(String serialOrTrackingReference) {
        this.serialOrTrackingReference = serialOrTrackingReference;
    }

    public EWasteCategory getCategory() {
        return category;
    }

    public void setCategory(EWasteCategory category) {
        this.category = category;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public CosmeticGrade getCosmeticGrade() {
        return cosmeticGrade;
    }

    public void setCosmeticGrade(CosmeticGrade cosmeticGrade) {
        this.cosmeticGrade = cosmeticGrade;
    }

    public List<DeviceJourneyEventDTO> getEvents() {
        return events;
    }

    public void setEvents(List<DeviceJourneyEventDTO> events) {
        this.events = events;
    }

    public void addEvent(DeviceJourneyEventDTO event) {
        this.events.add(event);
    }
}
