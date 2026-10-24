package com.venture.suggestions;

/**
 * One "Area to Review". Always a possibility worth checking, never a
 * determination. {@code status} is review_recommended, documented,
 * expiring_soon or expired_document.
 */
public record Suggestion(
        String id,
        String name,
        String category,
        String reason,
        String status,
        String statusLabel,
        Long matchedItemId,
        String matchedItemName,
        Long daysUntilExpiry,
        String source) {}
