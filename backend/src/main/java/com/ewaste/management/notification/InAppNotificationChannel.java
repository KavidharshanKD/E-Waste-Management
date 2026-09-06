package com.ewaste.management.notification;

import com.ewaste.management.entity.Notification;
import com.ewaste.management.entity.User;
import com.ewaste.management.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class InAppNotificationChannel implements NotificationChannel {

    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public void sendNotification(User user, String title, String message, String type) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRead(false);
        notificationRepository.save(notification);
    }
}
