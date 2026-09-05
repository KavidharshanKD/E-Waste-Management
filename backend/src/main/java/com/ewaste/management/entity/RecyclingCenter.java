package com.ewaste.management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

@Entity
@Table(name = "recycling_centers")
public class RecyclingCenter extends BaseEntity {

    @NotBlank
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "registration_number", length = 100)
    private String registrationNumber;

    @Column(name = "address", nullable = false, length = 255)
    private String address;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "state", nullable = false, length = 100)
    private String state;

    @Column(name = "postal_code", nullable = false, length = 20)
    private String postalCode;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    @Column(name = "accepted_waste_categories", length = 500)
    private String acceptedWasteCategories;

    @Column(name = "operating_hours", length = 150)
    private String operatingHours;

    @Column(name = "processing_capacity_kg_per_day", precision = 10, scale = 2)
    private BigDecimal processingCapacityKgPerDay;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "is_demo_facility", nullable = false)
    private boolean isDemoFacility = true;

    public RecyclingCenter() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

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

    public String getAcceptedWasteCategories() { return acceptedWasteCategories; }
    public void setAcceptedWasteCategories(String acceptedWasteCategories) { this.acceptedWasteCategories = acceptedWasteCategories; }

    public String getOperatingHours() { return operatingHours; }
    public void setOperatingHours(String operatingHours) { this.operatingHours = operatingHours; }

    public BigDecimal getProcessingCapacityKgPerDay() { return processingCapacityKgPerDay; }
    public void setProcessingCapacityKgPerDay(BigDecimal processingCapacityKgPerDay) { this.processingCapacityKgPerDay = processingCapacityKgPerDay; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isDemoFacility() { return isDemoFacility; }
    public void setDemoFacility(boolean isDemoFacility) { this.isDemoFacility = isDemoFacility; }
}
