package com.venture.schemes;

/** One stored scheme record. {@code lastCheckedAt} is stamped once at seed time, not on every read. */
record SchemeRow(
        String id,
        String name,
        String category,
        String description,
        String benefitSummary,
        String eligibilityJson,
        String sourceName,
        String sourceUrl,
        String lastCheckedAt) {}
