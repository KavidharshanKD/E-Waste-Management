package com.ewaste.management.service;

import com.ewaste.management.dto.NotificationDTO;
import com.ewaste.management.dto.NotificationListDTO;
import com.ewaste.management.entity.Notification;
import com.ewaste.management.entity.User;
import com.ewaste.management.notification.InAppNotificationChannel;
import com.ewaste.management.notification.NotificationChannel;
import com.ewaste.management.notification.NotificationService;
import com.ewaste.management.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationChannel inAppChannel;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testNotification = new Notification();
        testNotification.setId(10L);
        testNotification.setUser(testUser);
        testNotification.setTitle("Test Title");
        testNotification.setMessage("Test Message");
        testNotification.setType("DISPOSAL_SUBMITTED");
        testNotification.setRead(false);

        List<NotificationChannel> channels = new ArrayList<>();
        channels.add(inAppChannel);
        ReflectionTestUtils.setField(notificationService, "notificationChannels", channels);
    }

    @Test
    void sendNotification_ShouldCallEnabledChannels() {
        when(inAppChannel.isEnabled()).thenReturn(true);

        notificationService.sendNotification(testUser, "Test Title", "Test Message", "DISPOSAL_SUBMITTED");

        verify(inAppChannel, times(1)).sendNotification(testUser, "Test Title", "Test Message", "DISPOSAL_SUBMITTED");
    }

    @Test
    void getUserNotifications_ShouldReturnDTOListAndUnreadCount() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(testNotification));
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(1L);

        NotificationListDTO result = notificationService.getUserNotifications(1L);

        assertNotNull(result);
        assertEquals(1, result.getNotifications().size());
        assertEquals(1L, result.getUnreadCount());
        assertEquals("Test Title", result.getNotifications().get(0).getTitle());
    }

    @Test
    void markAsRead_ShouldSetReadTrue() {
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(testNotification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArguments()[0]);

        NotificationDTO updated = notificationService.markAsRead(10L, 1L);

        assertNotNull(updated);
        assertTrue(updated.isRead());
    }

    @Test
    void markAllAsRead_ShouldUpdateAllUnreadNotifications() {
        when(notificationRepository.findByUserIdAndReadFalse(1L)).thenReturn(List.of(testNotification));

        notificationService.markAllAsRead(1L);

        assertTrue(testNotification.isRead());
        verify(notificationRepository, times(1)).saveAll(any());
    }
}
