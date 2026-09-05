package com.ewaste.management.controller;

import com.ewaste.management.dto.AssignCollectorRequestDTO;
import com.ewaste.management.dto.PickupDTO;
import com.ewaste.management.dto.UserDTO;
import com.ewaste.management.dto.UserProfileDTO;

import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.service.PickupService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPickupController {

    private final PickupService pickupService;
    private final UserRepository userRepository;

    public AdminPickupController(PickupService pickupService, UserRepository userRepository) {
        this.pickupService = pickupService;
        this.userRepository = userRepository;
    }

    @GetMapping("/pickups/pending")
    public ResponseEntity<List<PickupDTO>> getPendingPickups() {
        return ResponseEntity.ok(pickupService.getPendingPickups());
    }

    @GetMapping("/pickups")
    public ResponseEntity<List<PickupDTO>> getAllPickups() {
        return ResponseEntity.ok(pickupService.getAllPickups());
    }

    @PutMapping("/pickups/{pickupId}/assign")
    public ResponseEntity<?> assignCollector(
            @PathVariable Long pickupId,
            @Valid @RequestBody AssignCollectorRequestDTO dto,
            Authentication authentication) {
        try {
            User admin = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new IllegalArgumentException("Admin user not found: " + authentication.getName()));
            PickupDTO updated = pickupService.assignCollector(pickupId, dto, admin);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/collectors")
    public ResponseEntity<List<UserDTO>> getCollectors() {
        List<User> collectors = userRepository.findByRole(UserRole.COLLECTOR);
        List<UserDTO> dtos = collectors.stream().map(c -> {
            UserDTO dto = new UserDTO();
            dto.setId(c.getId());
            dto.setEmail(c.getEmail());
            dto.setRole(c.getRole());
            dto.setActive(c.isActive());
            if (c.getProfile() != null) {
                UserProfileDTO profileDTO = new UserProfileDTO();
                profileDTO.setFirstName(c.getProfile().getFirstName());
                profileDTO.setLastName(c.getProfile().getLastName());
                profileDTO.setPhoneNumber(c.getProfile().getPhoneNumber());
                profileDTO.setCity(c.getProfile().getCity());
                profileDTO.setState(c.getProfile().getState());
                dto.setProfile(profileDTO);
            }
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

}
