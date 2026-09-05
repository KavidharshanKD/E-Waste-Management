package com.ewaste.management.controller;

import com.ewaste.management.dto.PickupDTO;
import com.ewaste.management.dto.SchedulePickupRequestDTO;
import com.ewaste.management.entity.User;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.service.PickupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/pickups")
@PreAuthorize("hasAnyRole('USER', 'COLLECTOR', 'RECYCLER', 'ADMIN')")
public class UserPickupController {

    private final PickupService pickupService;
    private final UserRepository userRepository;

    public UserPickupController(PickupService pickupService, UserRepository userRepository) {
        this.pickupService = pickupService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> schedulePickup(
            @Valid @RequestBody SchedulePickupRequestDTO dto,
            Authentication authentication) {
        try {
            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + authentication.getName()));
            PickupDTO scheduled = pickupService.schedulePickup(dto, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(scheduled);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping
    public ResponseEntity<List<PickupDTO>> getUserPickups(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + authentication.getName()));
        return ResponseEntity.ok(pickupService.getUserPickups(user));
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<?> getPickupByRequestId(
            @PathVariable Long requestId,
            Authentication authentication) {
        try {
            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + authentication.getName()));
            PickupDTO pickup = pickupService.getPickupByRequestId(requestId, user);
            return ResponseEntity.ok(pickup);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }
}
