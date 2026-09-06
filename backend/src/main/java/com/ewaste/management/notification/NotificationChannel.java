package com.ewaste.management.notification;

import com.ewaste.management.entity.User;

public interface NotificationChannel {
    boolean isEnabled();
    void sendNotification(User user, String title, String message, String type);
}
