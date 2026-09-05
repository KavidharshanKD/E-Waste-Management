package com.ewaste.management.dto;

import java.util.List;

public class GamificationProfileDTO {
    private int totalPoints;
    private String currentLevel;
    private String nextLevel;
    private int pointsToNextLevel;
    private int nextLevelThreshold;
    private int progressPercentage;
    private List<BadgeDTO> badges;
    private List<RewardTransactionDTO> transactions;

    public GamificationProfileDTO() {}

    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }

    public String getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(String currentLevel) { this.currentLevel = currentLevel; }

    public String getNextLevel() { return nextLevel; }
    public void setNextLevel(String nextLevel) { this.nextLevel = nextLevel; }

    public int getPointsToNextLevel() { return pointsToNextLevel; }
    public void setPointsToNextLevel(int pointsToNextLevel) { this.pointsToNextLevel = pointsToNextLevel; }

    public int getNextLevelThreshold() { return nextLevelThreshold; }
    public void setNextLevelThreshold(int nextLevelThreshold) { this.nextLevelThreshold = nextLevelThreshold; }

    public int getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(int progressPercentage) { this.progressPercentage = progressPercentage; }

    public List<BadgeDTO> getBadges() { return badges; }
    public void setBadges(List<BadgeDTO> badges) { this.badges = badges; }

    public List<RewardTransactionDTO> getTransactions() { return transactions; }
    public void setTransactions(List<RewardTransactionDTO> transactions) { this.transactions = transactions; }
}
