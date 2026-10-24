package com.venture.notifications;

import java.util.List;

public record NotificationsResponse(List<NotificationDto> notifications, int unreadCount) {}
