package com.ewaste.management.controller;

import com.ewaste.management.dto.GamificationProfileDTO;
import com.ewaste.management.entity.User;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.service.GamificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user/rewards")
@PreAuthorize("hasAnyRole('USER', 'COLLECTOR', 'RECYCLER', 'ADMIN')")
public class UserGamificationController {

    private final GamificationService gamificationService;
    private final UserRepository userRepository;

    public UserGamificationController(GamificationService gamificationService, UserRepository userRepository) {
        this.gamificationService = gamificationService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getUserRewardsProfile(Authentication authentication) {
        try {
            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + authentication.getName()));
            GamificationProfileDTO profile = gamificationService.getUserGamificationProfile(user);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
