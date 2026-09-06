package com.ewaste.management.notification;

import com.ewaste.management.dto.NotificationDTO;
import com.ewaste.management.dto.NotificationListDTO;
import com.ewaste.management.entity.Notification;
import com.ewaste.management.entity.User;
import com.ewaste.management.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private List<NotificationChannel> notificationChannels;

    public NotificationService() {}

    public NotificationService(NotificationRepository notificationRepository, List<NotificationChannel> notificationChannels) {
        this.notificationRepository = notificationRepository;
        this.notificationChannels = notificationChannels;
    }


    public void sendNotification(User user, String title, String message, String type) {
        if (user == null) {
            return;
        }
        for (NotificationChannel channel : notificationChannels) {
            try {
                if (channel.isEnabled()) {
                    channel.sendNotification(user, title, message, type);
                }
            } catch (Exception e) {
                // Log and continue to other channels
            }
        }
    }

    public NotificationListDTO getUserNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        long unreadCount = notificationRepository.countByUserIdAndReadFalse(userId);

        List<NotificationDTO> dtos = notifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new NotificationListDTO(dtos, unreadCount);
    }

    public NotificationDTO markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to notification");
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return convertToDTO(saved);
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndReadFalse(userId);
        for (Notification n : unreadNotifications) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unreadNotifications);
    }

    private NotificationDTO convertToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setUserId(notification.getUser().getId());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }
}
