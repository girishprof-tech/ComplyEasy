package com.venture.schemes;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.venture.ai.WebSource;
import java.util.List;

/**
 * Result of a live web-search discovery. Either a summary with sources and a
 * disclaimer, or (when discovery cannot run) {@code unavailable=true} with a
 * {@code reason}. Never merged into the verified scheme matches.
 */
public record SchemeDiscoveryResult(
        String summary,
        List<WebSource> sources,
        String disclaimer,
        @JsonInclude(JsonInclude.Include.NON_NULL) Boolean unavailable,
        @JsonInclude(JsonInclude.Include.NON_NULL) String reason,
        @JsonInclude(JsonInclude.Include.NON_NULL) String discoveredAt) {

    public static SchemeDiscoveryResult found(String summary, List<WebSource> sources, String disclaimer, String at) {
        return new SchemeDiscoveryResult(summary, sources, disclaimer, null, null, at);
    }

    public static SchemeDiscoveryResult unavailable(String reason) {
        return new SchemeDiscoveryResult(null, List.of(), null, true, reason, null);
    }
}
