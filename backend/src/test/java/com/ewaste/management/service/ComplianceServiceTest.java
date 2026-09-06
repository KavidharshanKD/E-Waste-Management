package com.ewaste.management.service;

import com.ewaste.management.dto.ComplianceGuidelineDTO;
import com.ewaste.management.entity.ComplianceGuideline;
import com.ewaste.management.repository.ComplianceGuidelineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class ComplianceServiceTest {

    @Mock
    private ComplianceGuidelineRepository complianceGuidelineRepository;

    private ComplianceService complianceService;
    private ComplianceGuideline sampleGuideline;

    @BeforeEach
    void setUp() {
        complianceService = new ComplianceService(complianceGuidelineRepository);

        sampleGuideline = new ComplianceGuideline();
        sampleGuideline.setId(10L);
        sampleGuideline.setSectionKey("RESPONSIBLE_DISPOSAL");
        sampleGuideline.setTitle("Responsible E-Waste Disposal");
        sampleGuideline.setSummary("Overview of responsible e-waste disposal.");
        sampleGuideline.setDetailedContent("Detailed regulatory content on disposal.");
        sampleGuideline.setLegalFrameworkReference("E-Waste (Management) Rules, 2022");
        sampleGuideline.setDisclaimerText("Custom disclaimer text.");
        sampleGuideline.setLastUpdated(LocalDateTime.now());
    }

    @Test
    void getAllGuidelines_ReturnsGuidelinesWithMandatoryDisclaimer() {
        given(complianceGuidelineRepository.findAll()).willReturn(List.of(sampleGuideline));

        List<ComplianceGuidelineDTO> result = complianceService.getAllGuidelines();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("RESPONSIBLE_DISPOSAL", result.get(0).getSectionKey());
        assertTrue(result.get(0).getDisclaimerText().contains("Registration information should be independently verified with the relevant authority."));
    }

    @Test
    void getGuidelineBySectionKey_Success() {
        given(complianceGuidelineRepository.findBySectionKey("RESPONSIBLE_DISPOSAL")).willReturn(Optional.of(sampleGuideline));

        ComplianceGuidelineDTO result = complianceService.getGuidelineBySectionKey("RESPONSIBLE_DISPOSAL");

        assertNotNull(result);
        assertEquals("Responsible E-Waste Disposal", result.getTitle());
    }

    @Test
    void updateGuideline_Success() {
        given(complianceGuidelineRepository.findById(10L)).willReturn(Optional.of(sampleGuideline));
        given(complianceGuidelineRepository.save(any(ComplianceGuideline.class))).willAnswer(inv -> inv.getArgument(0));

        ComplianceGuidelineDTO updateDTO = new ComplianceGuidelineDTO();
        updateDTO.setTitle("Updated Title");
        updateDTO.setSummary("Updated Summary");

        ComplianceGuidelineDTO result = complianceService.updateGuideline(10L, updateDTO);

        assertNotNull(result);
        assertEquals("Updated Title", result.getTitle());
        assertEquals("Updated Summary", result.getSummary());
    }
}
