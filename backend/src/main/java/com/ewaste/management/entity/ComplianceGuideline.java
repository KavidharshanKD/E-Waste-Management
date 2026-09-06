package com.ewaste.management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "compliance_guidelines")
public class ComplianceGuideline extends BaseEntity {

    @NotBlank
    @Column(name = "section_key", nullable = false, unique = true, length = 50)
    private String sectionKey;

    @NotBlank
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "detailed_content", columnDefinition = "TEXT")
    private String detailedContent;

    @Column(name = "legal_framework_reference", length = 255)
    private String legalFrameworkReference;

    @Column(name = "disclaimer_text", columnDefinition = "TEXT")
    private String disclaimerText;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated = LocalDateTime.now();

    public ComplianceGuideline() {}

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
