package com.venture.dashboard;

import com.venture.common.ItemStatus;

/** An item that is expiring soon or already expired, with the client it belongs to. */
public record UrgentItem(
        long id,
        long clientId,
        String clientName,
        String name,
        String expiryDate,
        ItemStatus status,
        long daysUntilExpiry) {}
