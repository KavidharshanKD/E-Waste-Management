package com.ewaste.management.dto;

import java.util.List;

public class NotificationListDTO {
    private List<NotificationDTO> notifications;
    private long unreadCount;

    public NotificationListDTO() {}

    public NotificationListDTO(List<NotificationDTO> notifications, long unreadCount) {
        this.notifications = notifications;
        this.unreadCount = unreadCount;
    }

    public List<NotificationDTO> getNotifications() {
        return notifications;
    }

    public void setNotifications(List<NotificationDTO> notifications) {
        this.notifications = notifications;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }
}
