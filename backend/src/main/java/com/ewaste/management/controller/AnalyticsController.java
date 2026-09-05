package com.ewaste.management.controller;

import com.ewaste.management.dto.AdminAnalyticsDTO;
import com.ewaste.management.dto.EnvironmentalFactorDTO;
import com.ewaste.management.dto.UserEnvironmentalImpactDTO;
import com.ewaste.management.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/user")
    public ResponseEntity<UserEnvironmentalImpactDTO> getUserImpact(@AuthenticationPrincipal UserDetails userDetails) {
        UserEnvironmentalImpactDTO dto = analyticsService.getUserImpact(userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminAnalyticsDTO> getAdminAnalytics() {
        AdminAnalyticsDTO dto = analyticsService.getAdminAnalytics();
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/factors")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EnvironmentalFactorDTO>> getFactors() {
        List<EnvironmentalFactorDTO> factors = analyticsService.getFactors();
        return ResponseEntity.ok(factors);
    }

    @PutMapping("/factors/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EnvironmentalFactorDTO> updateFactor(@PathVariable Long id,
                                                               @RequestBody EnvironmentalFactorDTO dto) {
        EnvironmentalFactorDTO updated = analyticsService.updateFactor(id, dto);
        return ResponseEntity.ok(updated);
    }
}
