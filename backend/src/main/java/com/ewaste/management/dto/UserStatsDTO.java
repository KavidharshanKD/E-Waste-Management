package com.ewaste.management.dto;

public class UserStatsDTO {
    private long totalSubmitted;
    private long awaitingPickup;
    private long collected;
    private long successfullyProcessed;
    private int greenPoints;

    public UserStatsDTO() {}

    public UserStatsDTO(long totalSubmitted, long awaitingPickup, long collected, long successfullyProcessed, int greenPoints) {
        this.totalSubmitted = totalSubmitted;
        this.awaitingPickup = awaitingPickup;
        this.collected = collected;
        this.successfullyProcessed = successfullyProcessed;
        this.greenPoints = greenPoints;
    }

    public long getTotalSubmitted() { return totalSubmitted; }
    public void setTotalSubmitted(long totalSubmitted) { this.totalSubmitted = totalSubmitted; }

    public long getAwaitingPickup() { return awaitingPickup; }
    public void setAwaitingPickup(long awaitingPickup) { this.awaitingPickup = awaitingPickup; }

    public long getCollected() { return collected; }
    public void setCollected(long collected) { this.collected = collected; }

    public long getSuccessfullyProcessed() { return successfullyProcessed; }
    public void setSuccessfullyProcessed(long successfullyProcessed) { this.successfullyProcessed = successfullyProcessed; }

    public int getGreenPoints() { return greenPoints; }
    public void setGreenPoints(int greenPoints) { this.greenPoints = greenPoints; }
}
