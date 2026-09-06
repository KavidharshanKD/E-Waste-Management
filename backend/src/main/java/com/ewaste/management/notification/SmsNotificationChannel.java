package com.ewaste.management.notification;

import com.ewaste.management.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SmsNotificationChannel implements NotificationChannel {

    private static final Logger logger = LoggerFactory.getLogger(SmsNotificationChannel.class);

    @Override
    public boolean isEnabled() {
        // Disabled by default to avoid requiring paid SMS gateway APIs for basic operations
        return false;
    }

    @Override
    public void sendNotification(User user, String title, String message, String type) {
        String phone = (user.getProfile() != null) ? user.getProfile().getPhoneNumber() : null;
        if (!isEnabled()) {
            logger.debug("SMS notification skipped for user {}: {}", phone, title);
            return;
        }
        // Pluggable SMS dispatch logic goes here (e.g., Twilio / AWS SNS / MSG91 API)
        logger.info("Sending SMS to {}: [{}] {}", phone, title, message);
    }
}
