package com.ewaste.management.controller;

import com.ewaste.management.dto.CreateEWasteRequestDTO;
import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.dto.UserProfileDTO;
import com.ewaste.management.dto.UserStatsDTO;
import com.ewaste.management.service.UserEWasteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@PreAuthorize("hasAnyRole('USER', 'COLLECTOR', 'RECYCLER', 'ADMIN')")
public class UserEWasteController {

    private final UserEWasteService userEWasteService;

    public UserEWasteController(UserEWasteService userEWasteService) {
        this.userEWasteService = userEWasteService;
    }

    @PostMapping(value = "/ewaste", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createEWasteRequestJson(
            @Valid @RequestBody CreateEWasteRequestDTO dto,
            Authentication authentication) {
        try {
            DisposalRequestDTO created = userEWasteService.createRequest(authentication.getName(), dto, null);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping(value = "/ewaste", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createEWasteRequestMultipart(
            @Valid @ModelAttribute CreateEWasteRequestDTO dto,
            @RequestParam(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        try {
            DisposalRequestDTO created = userEWasteService.createRequest(authentication.getName(), dto, image);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/ewaste")
    public ResponseEntity<List<DisposalRequestDTO>> getUserEWasteRequests(Authentication authentication) {
        List<DisposalRequestDTO> requests = userEWasteService.getUserRequests(authentication.getName());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/ewaste/{id}")
    public ResponseEntity<?> getEWasteRequestById(@PathVariable Long id, Authentication authentication) {
        try {
            DisposalRequestDTO request = userEWasteService.getRequestById(authentication.getName(), id);
            return ResponseEntity.ok(request);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    @PutMapping(value = "/ewaste/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateEWasteRequestJson(
            @PathVariable Long id,
            @Valid @RequestBody CreateEWasteRequestDTO dto,
            Authentication authentication) {
        try {
            DisposalRequestDTO updated = userEWasteService.updateRequest(authentication.getName(), id, dto, null);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (IllegalStateException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping(value = "/ewaste/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateEWasteRequestMultipart(
            @PathVariable Long id,
            @Valid @ModelAttribute CreateEWasteRequestDTO dto,
            @RequestParam(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        try {
            DisposalRequestDTO updated = userEWasteService.updateRequest(authentication.getName(), id, dto, image);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (IllegalStateException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @DeleteMapping("/ewaste/{id}")
    public ResponseEntity<?> cancelEWasteRequest(@PathVariable Long id, Authentication authentication) {
        try {
            userEWasteService.cancelRequest(authentication.getName(), id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Disposal request cancelled successfully.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (IllegalStateException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<UserStatsDTO> getUserStats(Authentication authentication) {
        UserStatsDTO stats = userEWasteService.getUserStats(authentication.getName());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getUserProfile(Authentication authentication) {
        UserProfileDTO profile = userEWasteService.getUserProfile(authentication.getName());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileDTO> updateUserProfile(@Valid @RequestBody UserProfileDTO dto, Authentication authentication) {
        UserProfileDTO updated = userEWasteService.updateUserProfile(authentication.getName(), dto);
        return ResponseEntity.ok(updated);
    }
}
