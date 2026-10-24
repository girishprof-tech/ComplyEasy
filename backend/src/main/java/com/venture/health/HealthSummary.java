package com.venture.health;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Compliance health score and plain-language summary. The two business-count
 * fields are only present for the accountant's portfolio framing.
 */
public record HealthSummary(
        int score,
        int totalItems,
        int active,
        int expiringSoon,
        int expired,
        @JsonInclude(JsonInclude.Include.NON_NULL) Integer businessCount,
        @JsonInclude(JsonInclude.Include.NON_NULL) Integer businessesNeedingAttention,
        Integer reviewCount,
        String highestPriority,
        String summary,
        boolean demoMode) {}
