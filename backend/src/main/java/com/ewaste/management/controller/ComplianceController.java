package com.ewaste.management.controller;

import com.ewaste.management.dto.ComplianceGuidelineDTO;
import com.ewaste.management.service.ComplianceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/compliance")
public class ComplianceController {

    private final ComplianceService complianceService;

    public ComplianceController(ComplianceService complianceService) {
        this.complianceService = complianceService;
    }

    @GetMapping("/guidelines")
    public ResponseEntity<List<ComplianceGuidelineDTO>> getAllGuidelines() {
        return ResponseEntity.ok(complianceService.getAllGuidelines());
    }

    @GetMapping("/guidelines/{sectionKey}")
    public ResponseEntity<ComplianceGuidelineDTO> getGuidelineBySectionKey(@PathVariable String sectionKey) {
        return ResponseEntity.ok(complianceService.getGuidelineBySectionKey(sectionKey));
    }

    @PutMapping("/guidelines/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComplianceGuidelineDTO> updateGuideline(@PathVariable Long id, @RequestBody ComplianceGuidelineDTO dto) {
        return ResponseEntity.ok(complianceService.updateGuideline(id, dto));
    }
}
