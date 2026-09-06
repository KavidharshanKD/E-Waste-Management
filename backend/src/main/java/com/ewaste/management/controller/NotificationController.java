package com.ewaste.management.controller;

import com.ewaste.management.dto.NotificationDTO;
import com.ewaste.management.dto.NotificationListDTO;
import com.ewaste.management.entity.User;
import com.ewaste.management.notification.NotificationService;
import com.ewaste.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("User not authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<NotificationListDTO> getNotifications(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        NotificationListDTO response = notificationService.getUserNotifications(user.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        NotificationDTO dto = notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}
