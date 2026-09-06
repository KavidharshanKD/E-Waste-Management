package com.ewaste.management.notification;

import com.ewaste.management.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class EmailNotificationChannel implements NotificationChannel {

    private static final Logger logger = LoggerFactory.getLogger(EmailNotificationChannel.class);

    @Override
    public boolean isEnabled() {
        // Disabled by default to avoid requiring paid or external email services for basic operations
        return false;
    }

    @Override
    public void sendNotification(User user, String title, String message, String type) {
        if (!isEnabled()) {
            logger.debug("Email notification skipped for user {}: {}", user.getEmail(), title);
            return;
        }
        // Pluggable email dispatch logic goes here (e.g., JavaMailSender / SendGrid API)
        logger.info("Sending email to {}: [{}] {}", user.getEmail(), title, message);
    }
}
