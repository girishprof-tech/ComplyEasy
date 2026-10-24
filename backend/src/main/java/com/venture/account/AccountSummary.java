package com.venture.account;

/** The caller's plan, its limits and their AI-analysis usage (API shape of {@code GET /api/account}). */
public record AccountSummary(
        String tier, String label, Limits limits, int aiAnalysesUsed, Integer aiAnalysesRemaining) {

    public record Limits(Integer maxClients, Integer maxAiAnalyses, boolean csvExport) {}
}
