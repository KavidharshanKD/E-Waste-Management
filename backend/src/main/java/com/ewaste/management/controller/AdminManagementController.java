package com.ewaste.management.controller;

import com.ewaste.management.dto.AdminStatsDTO;
import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.dto.RecyclingCertificateDTO;
import com.ewaste.management.dto.UserDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.RecyclingCertificate;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.RecyclingCertificateRepository;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.service.AdminDashboardService;
import com.ewaste.management.service.CertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminManagementController {

    @Autowired
    private AdminDashboardService adminDashboardService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DisposalRequestRepository disposalRequestRepository;

    @Autowired
    private RecyclingCertificateRepository certificateRepository;

    @Autowired
    private CertificateService certificateService;

    private User getAdminUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication required");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Admin user not found: " + authentication.getName()));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getAdminStats() {
        return ResponseEntity.ok(adminDashboardService.getAdminStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminDashboardService.getAllUsers(search, role, status));
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<UserDTO> toggleUserActive(@PathVariable Long id) {
        return ResponseEntity.ok(adminDashboardService.toggleUserActive(id));
    }

    @PutMapping("/users/{id}/verify")
    public ResponseEntity<UserDTO> verifyUserProfile(@PathVariable Long id) {
        return ResponseEntity.ok(adminDashboardService.verifyUserProfile(id));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<DisposalRequestDTO>> getRequests(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(adminDashboardService.getAllRequests(search, status, category));
    }

    @PutMapping("/requests/{id}/approve")
    public ResponseEntity<DisposalRequestDTO> approveRequest(@PathVariable Long id, Authentication authentication) {
        User admin = getAdminUser(authentication);
        return ResponseEntity.ok(adminDashboardService.approveRequest(id, admin));
    }

    @PutMapping("/requests/{id}/reject")
    public ResponseEntity<DisposalRequestDTO> rejectRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        User admin = getAdminUser(authentication);
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(adminDashboardService.rejectRequest(id, reason, admin));
    }

    @PutMapping("/requests/{id}/status")
    public ResponseEntity<DisposalRequestDTO> updateRequestStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        User admin = getAdminUser(authentication);
        String statusStr = body.get("status");
        String comment = body.get("comment");
        RequestStatus newStatus = RequestStatus.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(adminDashboardService.updateRequestLifecycleStatus(id, newStatus, comment, admin));
    }

    @GetMapping("/certificates")
    public ResponseEntity<List<RecyclingCertificateDTO>> getAllCertificates() {
        List<RecyclingCertificate> certificates = certificateRepository.findAll();
        List<RecyclingCertificateDTO> dtos = certificates.stream().map(cert -> {
            RecyclingCertificateDTO dto = new RecyclingCertificateDTO();
            dto.setId(cert.getId());
            dto.setCertificateNumber(cert.getCertificateNumber());
            if (cert.getDisposalRequest() != null) {
                dto.setDisposalRequestId(cert.getDisposalRequest().getId());
                dto.setTrackingNumber(cert.getDisposalRequest().getTrackingNumber());
                if (cert.getDisposalRequest().getUser() != null) {
                    dto.setUserName(cert.getDisposalRequest().getUser().getFullName());
                }
            }
            dto.setIssueDate(cert.getIssueDate());
            dto.setTotalWeightKg(cert.getTotalWeightKg());
            dto.setHazardousMaterialsDivertedKg(cert.getHazardousMaterialsDivertedKg());
            dto.setCertificateUrl(cert.getCertificateUrl());
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/certificates/generate/{requestId}")
    public ResponseEntity<RecyclingCertificateDTO> generateCertificate(
            @PathVariable Long requestId,
            Authentication authentication) {
        DisposalRequest request = disposalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Disposal request not found with ID: " + requestId));
        RecyclingCertificate cert = certificateService.generateOrGetCertificate(request);
        RecyclingCertificateDTO dto = certificateService.getCertificateById(cert.getId(), authentication.getName());
        return ResponseEntity.ok(dto);
    }
}
