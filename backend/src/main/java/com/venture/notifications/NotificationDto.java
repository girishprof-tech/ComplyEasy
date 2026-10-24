package com.venture.notifications;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.venture.common.ItemStatus;

public record NotificationDto(
        long id,
        String type,
        long clientId,
        String businessName,
        String itemName,
        String message,
        @JsonProperty("isRead") boolean isRead,
        String createdAt,
        ItemStatus status) {}
