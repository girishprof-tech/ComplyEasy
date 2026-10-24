package com.venture.notifications;

/** A notification joined with the item and business it is about. */
record NotificationRow(
        long id,
        long clientId,
        String type,
        String createdAt,
        String readAt,
        String itemName,
        String expiryDate,
        String businessName) {}
