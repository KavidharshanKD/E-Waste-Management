package com.ewaste.management.controller;

import com.ewaste.management.dto.PickupDTO;
import com.ewaste.management.dto.UpdatePickupStatusDTO;
import com.ewaste.management.entity.User;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.service.PickupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collector/pickups")
@PreAuthorize("hasAnyRole('COLLECTOR', 'ADMIN')")
public class CollectorPickupController {

    private final PickupService pickupService;
    private final UserRepository userRepository;

    public CollectorPickupController(PickupService pickupService, UserRepository userRepository) {
        this.pickupService = pickupService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<PickupDTO>> getAssignedPickups(Authentication authentication) {
        User collector = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Collector user not found: " + authentication.getName()));
        return ResponseEntity.ok(pickupService.getCollectorPickups(collector));
    }

    @PutMapping("/{pickupId}/status")
    public ResponseEntity<?> updatePickupStatus(
            @PathVariable Long pickupId,
            @Valid @RequestBody UpdatePickupStatusDTO dto,
            Authentication authentication) {
        try {
            User collector = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new IllegalArgumentException("Collector user not found: " + authentication.getName()));
            PickupDTO updated = pickupService.updatePickupStatus(pickupId, dto, collector);
            return ResponseEntity.ok(updated);
        } catch (AccessDeniedException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
