package com.venture.health;

import com.venture.common.ItemStatus;

/** The few facts about an item the health summary needs. {@code clientId} is used for portfolio framing. */
public record HealthItem(ItemStatus status, long daysUntilExpiry, String name, Long clientId) {}
