package com.ewaste.management.dto.marketplace;

public class ListingImageDTO {
    private Long id;
    private String imageUrl;
    private Integer sortOrder;
    private Boolean isPrimary;

    public ListingImageDTO() {
    }

    public ListingImageDTO(Long id, String imageUrl, Integer sortOrder, Boolean isPrimary) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.sortOrder = sortOrder;
        this.isPrimary = isPrimary;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean primary) {
        isPrimary = primary;
    }
}
