package com.venture.health;

import com.venture.common.ItemStatus;
import com.venture.compliance.ComplianceInsightGenerator;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Deterministic business / portfolio health. Pure functions — no I/O, no model
 * call — so the score is always explainable: active counts fully, expiring
 * soon counts half, expired counts zero.
 */
public final class HealthSummaryCalculator {

    private HealthSummaryCalculator() {}

    /** One business (owner dashboard). */
    public static HealthSummary forBusiness(List<HealthItem> items, Integer reviewCount, boolean demoMode) {
        return compute(items, null, reviewCount, demoMode);
    }

    /** A whole client portfolio (accountant dashboard). */
    public static HealthSummary forPortfolio(
            List<HealthItem> items, int businessCount, Integer reviewCount, boolean demoMode) {
        return compute(items, businessCount, reviewCount, demoMode);
    }

    private static HealthSummary compute(
            List<HealthItem> items, Integer businessCount, Integer reviewCount, boolean demoMode) {
        int total = items.size();
        int active = count(items, ItemStatus.ACTIVE);
        int expiringSoon = count(items, ItemStatus.EXPIRING_SOON);
        int expired = count(items, ItemStatus.EXPIRED);
        int score = total == 0 ? 100 : (int) Math.round((active + expiringSoon * 0.5) / total * 100);

        HealthItem urgent = items.stream()
                .filter(i -> i.status() != ItemStatus.ACTIVE)
                .sorted(Comparator.comparingLong(HealthItem::daysUntilExpiry))
                .findFirst()
                .orElse(null);
        String highestPriority = null;
        if (urgent != null) {
            highestPriority = urgent.status() == ItemStatus.EXPIRED
                    ? urgent.name() + " expired " + ComplianceInsightGenerator.days(Math.abs(urgent.daysUntilExpiry()))
                            + " ago — renew as soon as possible."
                    : "Renew " + urgent.name() + " within the next "
                            + ComplianceInsightGenerator.days(urgent.daysUntilExpiry()) + ".";
        }

        boolean hasReview = reviewCount != null && reviewCount != 0;
        String reviewClause = hasReview
                ? " " + reviewCount + " area" + (reviewCount == 1 ? " is" : "s are") + " recommended for review."
                : "";

        if (businessCount != null) {
            // Count businesses with at least one non-active item: that is what "needs attention"
            // means to an accountant scanning client names.
            Set<Long> needingAttention = new HashSet<>();
            for (HealthItem item : items) {
                if (item.status() != ItemStatus.ACTIVE) needingAttention.add(item.clientId());
            }
            int attention = needingAttention.size();

            String summary = total == 0
                    ? "No compliance items on file yet across " + businessCount + " client"
                            + (businessCount == 1 ? "" : "s") + "." + reviewClause
                    : "Across your client portfolio: " + attention + " business" + (attention == 1 ? "" : "es")
                            + " require" + (attention == 1 ? "s" : "") + " immediate attention, " + expired
                            + " expired certificate" + (expired == 1 ? "" : "s") + " "
                            + (expired == 1 ? "was" : "were") + " detected, and " + expiringSoon + " renewal"
                            + (expiringSoon == 1 ? "" : "s") + " " + (expiringSoon == 1 ? "is" : "are")
                            + " due within 30 days." + reviewClause;
            return new HealthSummary(
                    score, total, active, expiringSoon, expired, businessCount, attention, reviewCount,
                    highestPriority, summary, demoMode);
        }

        String summary = total == 0
                ? "No compliance records on file yet." + reviewClause
                : "Your business has " + total + " compliance record" + (total == 1 ? "" : "s") + ": " + active
                        + " active, " + expiringSoon + " expiring soon, " + expired + " expired." + reviewClause;
        return new HealthSummary(
                score, total, active, expiringSoon, expired, null, null, reviewCount, highestPriority, summary,
                demoMode);
    }

    private static int count(List<HealthItem> items, ItemStatus status) {
        return (int) items.stream().filter(i -> i.status() == status).count();
    }
}
