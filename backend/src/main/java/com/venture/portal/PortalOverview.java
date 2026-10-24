package com.venture.portal;

import com.venture.common.ItemStatus;
import java.util.List;

/** The original read-only owner view, kept for backward compatibility. */
public record PortalOverview(
        String businessName,
        String registrationId,
        String contactPerson,
        String contactEmail,
        String contactPhone,
        List<Item> items) {

    public record Item(
            long id,
            String name,
            String issueDate,
            String expiryDate,
            String notes,
            ItemStatus status,
            long daysUntilExpiry) {}
}
