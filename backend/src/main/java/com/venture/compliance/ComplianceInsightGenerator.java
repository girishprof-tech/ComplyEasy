package com.venture.compliance;

import com.venture.common.ItemStatus;

/**
 * Per-item risk insight. Fully rule-based (no model call, on purpose: a model
 * shouldn't be the one computing a status) and centralised here so no insight
 * text is ever duplicated elsewhere. Computed fresh on every read.
 */
public final class ComplianceInsightGenerator {

    private ComplianceInsightGenerator() {}

    public static ComplianceInsight generate(ItemStatus status, long daysUntilExpiry) {
        switch (status) {
            case ACTIVE:
                return new ComplianceInsight(
                        "Your records show this item is active, valid for another " + days(daysUntilExpiry) + ".",
                        "No action is needed right now.",
                        "ok");
            case EXPIRING_SOON:
                return new ComplianceInsight(
                        "Your records show this item expires in " + days(daysUntilExpiry) + ".",
                        "Consider starting the renewal process soon to avoid a gap in your records.",
                        "warn");
            default:
                return new ComplianceInsight(
                        "Your records show this item expired " + days(Math.abs(daysUntilExpiry)) + " ago.",
                        "Consider reviewing the renewal process. Verify current requirements with the relevant official authority.",
                        "risk");
        }
    }

    /** "1 day" / "N days". */
    public static String days(long n) {
        return n + " day" + (n == 1 ? "" : "s");
    }
}
