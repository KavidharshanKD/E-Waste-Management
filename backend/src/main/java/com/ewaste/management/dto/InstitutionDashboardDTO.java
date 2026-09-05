package com.ewaste.management.dto;

import java.util.ArrayList;
import java.util.List;

public class InstitutionDashboardDTO {
    private String organizationName;
    private String organizationType;
    private String contactPerson;
    private Long totalAssetsDisposed;
    private Long pendingCollections;
    private Long completedCollections;
    private Long totalBulkRequests;
    private List<DisposalRequestDTO> recentBulkRequests = new ArrayList<>();

    public InstitutionDashboardDTO() {}

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getOrganizationType() { return organizationType; }
    public void setOrganizationType(String organizationType) { this.organizationType = organizationType; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public Long getTotalAssetsDisposed() { return totalAssetsDisposed; }
    public void setTotalAssetsDisposed(Long totalAssetsDisposed) { this.totalAssetsDisposed = totalAssetsDisposed; }

    public Long getPendingCollections() { return pendingCollections; }
    public void setPendingCollections(Long pendingCollections) { this.pendingCollections = pendingCollections; }

    public Long getCompletedCollections() { return completedCollections; }
    public void setCompletedCollections(Long completedCollections) { this.completedCollections = completedCollections; }

    public Long getTotalBulkRequests() { return totalBulkRequests; }
    public void setTotalBulkRequests(Long totalBulkRequests) { this.totalBulkRequests = totalBulkRequests; }

    public List<DisposalRequestDTO> getRecentBulkRequests() { return recentBulkRequests; }
    public void setRecentBulkRequests(List<DisposalRequestDTO> recentBulkRequests) { this.recentBulkRequests = recentBulkRequests; }
}
