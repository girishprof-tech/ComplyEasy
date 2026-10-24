package com.venture.health;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.venture.common.ItemStatus;
import java.util.List;
import org.junit.jupiter.api.Test;

class HealthSummaryCalculatorTest {

    private static HealthItem item(ItemStatus status, long days, String name, long clientId) {
        return new HealthItem(status, days, name, clientId);
    }

    @Test
    void scoreWeightsActiveFullyExpiringHalfExpiredZero() {
        List<HealthItem> items = List.of(
                item(ItemStatus.ACTIVE, 100, "A", 1),
                item(ItemStatus.EXPIRING_SOON, 10, "B", 1),
                item(ItemStatus.EXPIRED, -5, "C", 1),
                item(ItemStatus.ACTIVE, 200, "D", 1));
        HealthSummary s = HealthSummaryCalculator.forBusiness(items, 0, true);
        assertEquals(63, s.score()); // (2 + 0.5) / 4 = 62.5 -> rounds half up
        assertEquals("C expired 5 days ago — renew as soon as possible.", s.highestPriority());
        assertEquals(
                "Your business has 4 compliance records: 2 active, 1 expiring soon, 1 expired.", s.summary());
        assertNull(s.businessCount());
    }

    @Test
    void emptyBusinessScoresFullMarks() {
        HealthSummary s = HealthSummaryCalculator.forBusiness(List.of(), 2, false);
        assertEquals(100, s.score());
        assertEquals("No compliance records on file yet. 2 areas are recommended for review.", s.summary());
    }

    @Test
    void portfolioCountsBusinessesNeedingAttention() {
        List<HealthItem> items = List.of(
                item(ItemStatus.EXPIRED, -1, "X", 1),
                item(ItemStatus.EXPIRING_SOON, 3, "Y", 1),
                item(ItemStatus.ACTIVE, 90, "Z", 2));
        HealthSummary s = HealthSummaryCalculator.forPortfolio(items, 2, null, false);
        assertEquals(1, s.businessesNeedingAttention());
        assertEquals(
                "Across your client portfolio: 1 business requires immediate attention, 1 expired certificate was detected, and 1 renewal is due within 30 days.",
                s.summary());
    }
}
