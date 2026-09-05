package com.ewaste.management.dto;

public class BadgeDTO {
    private String id;
    private String title;
    private String description;
    private String icon;
    private boolean unlocked;
    private String progressText;

    public BadgeDTO() {}

    public BadgeDTO(String id, String title, String description, String icon, boolean unlocked, String progressText) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.icon = icon;
        this.unlocked = unlocked;
        this.progressText = progressText;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public boolean isUnlocked() { return unlocked; }
    public void setUnlocked(boolean unlocked) { this.unlocked = unlocked; }

    public String getProgressText() { return progressText; }
    public void setProgressText(String progressText) { this.progressText = progressText; }
}
