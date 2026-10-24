package com.venture.schemes;

public record SchemeMatchDto(
        String id,
        String name,
        String category,
        String description,
        String benefitSummary,
        String sourceName,
        String sourceUrl,
        String lastCheckedAt,
        boolean needsMoreInfo) {}
