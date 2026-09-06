package com.ewaste.management.dto;

import java.math.BigDecimal;

public class RecyclingCenterDTO {
    private Long id;
    private String name;
    private String registrationNumber;
    private String address;
    private String city;
    private String district;
    private String state;
    private String postalCode;
    private Double latitude;
    private Double longitude;
    private String contactPhone;
    private String contactEmail;
    private String acceptedWasteCategories;
    private String operatingHours;
    private BigDecimal processingCapacityKgPerDay;
    private boolean active;
    private boolean isDemoFacility = true;
    private Double distanceKm;
    private String cpcbRegistrationRef;
    private java.time.LocalDate registrationValidityDate;
    private Double authorizedCapacityTonsPerAnnum;
    private String verificationAuthority;

    public RecyclingCenterDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public String getCpcbRegistrationRef() { return cpcbRegistrationRef; }
    public void setCpcbRegistrationRef(String cpcbRegistrationRef) { this.cpcbRegistrationRef = cpcbRegistrationRef; }

    public java.time.LocalDate getRegistrationValidityDate() { return registrationValidityDate; }
    public void setRegistrationValidityDate(java.time.LocalDate registrationValidityDate) { this.registrationValidityDate = registrationValidityDate; }

    public Double getAuthorizedCapacityTonsPerAnnum() { return authorizedCapacityTonsPerAnnum; }
    public void setAuthorizedCapacityTonsPerAnnum(Double authorizedCapacityTonsPerAnnum) { this.authorizedCapacityTonsPerAnnum = authorizedCapacityTonsPerAnnum; }

    public String getVerificationAuthority() { return verificationAuthority; }
    public void setVerificationAuthority(String verificationAuthority) { this.verificationAuthority = verificationAuthority; }
}
