package com.venture.account;

/**
 * Subscription tiers. A deliberately simple gating layer: a tier flag on the
 * user row plus these limits. {@code null} means unlimited.
 */
public enum Plan {
    FREE("free", "Free", 2, 5, false),
    PRO("pro", "Pro", null, null, true);

    private final String tier;
    private final String label;
    private final Integer maxClients;
    private final Integer maxAiAnalyses;
    private final boolean csvExport;

    Plan(String tier, String label, Integer maxClients, Integer maxAiAnalyses, boolean csvExport) {
        this.tier = tier;
        this.label = label;
        this.maxClients = maxClients;
        this.maxAiAnalyses = maxAiAnalyses;
        this.csvExport = csvExport;
    }

    public String tier() {
        return tier;
    }

    public String label() {
        return label;
    }

    /** Accountant client cap, or null if unlimited. */
    public Integer maxClients() {
        return maxClients;
    }

    /** Lifetime AI certificate analyses, or null if unlimited. */
    public Integer maxAiAnalyses() {
        return maxAiAnalyses;
    }

    public boolean csvExport() {
        return csvExport;
    }

    /** The plan for a stored tier value; unknown or missing values fall back to Free. */
    public static Plan fromTier(String tier) {
        for (Plan p : values()) {
            if (p.tier.equals(tier)) return p;
        }
        return FREE;
    }

    public static boolean isValidTier(String tier) {
        for (Plan p : values()) {
            if (p.tier.equals(tier)) return true;
        }
        return false;
    }
}
