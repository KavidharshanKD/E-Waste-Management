package com.ewaste.management.dto;

import java.time.LocalDateTime;

public class ComplianceGuidelineDTO {
    private Long id;
    private String sectionKey;
    private String title;
    private String summary;
    private String detailedContent;
    private String legalFrameworkReference;
    private String disclaimerText;
    private LocalDateTime lastUpdated;

    public ComplianceGuidelineDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSectionKey() { return sectionKey; }
    public void setSectionKey(String sectionKey) { this.sectionKey = sectionKey; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getDetailedContent() { return detailedContent; }
    public void setDetailedContent(String detailedContent) { this.detailedContent = detailedContent; }

    public String getLegalFrameworkReference() { return legalFrameworkReference; }
    public void setLegalFrameworkReference(String legalFrameworkReference) { this.legalFrameworkReference = legalFrameworkReference; }

    public String getDisclaimerText() { return disclaimerText; }
    public void setDisclaimerText(String disclaimerText) { this.disclaimerText = disclaimerText; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}
