package com.ewaste.management.service;

import com.ewaste.management.dto.ComplianceGuidelineDTO;
import com.ewaste.management.entity.ComplianceGuideline;
import com.ewaste.management.repository.ComplianceGuidelineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplianceService {

    private final ComplianceGuidelineRepository complianceGuidelineRepository;
    public static final String MANDATORY_STATUTORY_DISCLAIMER = 
            "Registration information should be independently verified with the relevant authority.";

    public ComplianceService(ComplianceGuidelineRepository complianceGuidelineRepository) {
        this.complianceGuidelineRepository = complianceGuidelineRepository;
    }

    @Transactional(readOnly = true)
    public List<ComplianceGuidelineDTO> getAllGuidelines() {
        return complianceGuidelineRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ComplianceGuidelineDTO getGuidelineBySectionKey(String sectionKey) {
        ComplianceGuideline guideline = complianceGuidelineRepository.findBySectionKey(sectionKey)
                .orElseThrow(() -> new IllegalArgumentException("Compliance guideline section not found: " + sectionKey));
        return mapToDTO(guideline);
    }

    @Transactional
    public ComplianceGuidelineDTO updateGuideline(Long id, ComplianceGuidelineDTO dto) {
        ComplianceGuideline guideline = complianceGuidelineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Compliance guideline not found with ID: " + id));

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            guideline.setTitle(dto.getTitle().trim());
        }
        if (dto.getSummary() != null) {
            guideline.setSummary(dto.getSummary());
        }
        if (dto.getDetailedContent() != null) {
            guideline.setDetailedContent(dto.getDetailedContent());
        }
        if (dto.getLegalFrameworkReference() != null) {
            guideline.setLegalFrameworkReference(dto.getLegalFrameworkReference());
        }
        if (dto.getDisclaimerText() != null && !dto.getDisclaimerText().isBlank()) {
            guideline.setDisclaimerText(dto.getDisclaimerText());
        }
        guideline.setLastUpdated(LocalDateTime.now());

        ComplianceGuideline updated = complianceGuidelineRepository.save(guideline);
        return mapToDTO(updated);
    }

    private ComplianceGuidelineDTO mapToDTO(ComplianceGuideline entity) {
        ComplianceGuidelineDTO dto = new ComplianceGuidelineDTO();
        dto.setId(entity.getId());
        dto.setSectionKey(entity.getSectionKey());
        dto.setTitle(entity.getTitle());
        dto.setSummary(entity.getSummary());
        dto.setDetailedContent(entity.getDetailedContent());
        dto.setLegalFrameworkReference(entity.getLegalFrameworkReference());

        String disclaimer = entity.getDisclaimerText();
        if (disclaimer == null || !disclaimer.contains(MANDATORY_STATUTORY_DISCLAIMER)) {
            disclaimer = (disclaimer == null ? "" : disclaimer + " ") + MANDATORY_STATUTORY_DISCLAIMER;
        }
        dto.setDisclaimerText(disclaimer);
        dto.setLastUpdated(entity.getLastUpdated());
        return dto;
    }
}
