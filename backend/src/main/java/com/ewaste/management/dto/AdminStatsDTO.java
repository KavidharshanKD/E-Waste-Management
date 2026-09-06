package com.ewaste.management.dto;

public class AdminStatsDTO {
    private long totalUsers;
    private long collectorsCount;
    private long recyclersCount;
    private long recyclingCentersCount;
    private long totalRequests;
    private long pendingPickupsCount;
    private long completedRecyclingCount;
    private long totalGreenPointsIssued;

    public AdminStatsDTO() {}

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getCollectorsCount() {
        return collectorsCount;
    }

    public void setCollectorsCount(long collectorsCount) {
        this.collectorsCount = collectorsCount;
    }

    public long getRecyclersCount() {
        return recyclersCount;
    }

    public void setRecyclersCount(long recyclersCount) {
        this.recyclersCount = recyclersCount;
    }

    public long getRecyclingCentersCount() {
        return recyclingCentersCount;
    }

    public void setRecyclingCentersCount(long recyclingCentersCount) {
        this.recyclingCentersCount = recyclingCentersCount;
    }

    public long getTotalRequests() {
        return totalRequests;
    }

    public void setTotalRequests(long totalRequests) {
        this.totalRequests = totalRequests;
    }

    public long getPendingPickupsCount() {
        return pendingPickupsCount;
    }

    public void setPendingPickupsCount(long pendingPickupsCount) {
        this.pendingPickupsCount = pendingPickupsCount;
    }

    public long getCompletedRecyclingCount() {
        return completedRecyclingCount;
    }

    public void setCompletedRecyclingCount(long completedRecyclingCount) {
        this.completedRecyclingCount = completedRecyclingCount;
    }

    public long getTotalGreenPointsIssued() {
        return totalGreenPointsIssued;
    }

    public void setTotalGreenPointsIssued(long totalGreenPointsIssued) {
        this.totalGreenPointsIssued = totalGreenPointsIssued;
    }
}
