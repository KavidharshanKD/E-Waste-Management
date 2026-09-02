package com.ewaste.management.dto;

import java.math.BigDecimal;

public class RecyclingCenterDTO {
    private Long id;
    private String name;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    private Double latitude;
    private Double longitude;
    private String contactPhone;
    private String contactEmail;
    private BigDecimal processingCapacityKgPerDay;
    private boolean active;

    public RecyclingCenterDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public BigDecimal getProcessingCapacityKgPerDay() { return processingCapacityKgPerDay; }
    public void setProcessingCapacityKgPerDay(BigDecimal processingCapacityKgPerDay) { this.processingCapacityKgPerDay = processingCapacityKgPerDay; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
