package com.venture.common;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ItemStatusTest {

    @Test
    void classifiesByDaysUntilExpiry() {
        assertEquals(ItemStatus.EXPIRED, ItemStatus.fromDays(-1));
        assertEquals(ItemStatus.EXPIRING_SOON, ItemStatus.fromDays(0));
        assertEquals(ItemStatus.EXPIRING_SOON, ItemStatus.fromDays(30));
        assertEquals(ItemStatus.ACTIVE, ItemStatus.fromDays(31));
    }

    @Test
    void countsWholeDays() {
        LocalDate today = LocalDate.of(2026, 10, 23);
        assertEquals(0, ItemStatus.daysUntil("2026-10-23", today));
        assertEquals(8, ItemStatus.daysUntil("2026-10-31", today));
        assertEquals(-3, ItemStatus.daysUntil("2026-10-20", today));
    }

    @Test
    void labelsMatchTheOriginalWording() {
        assertEquals("Expires today", ItemStatus.daysLabel(0));
        assertEquals("1 day remaining", ItemStatus.daysLabel(1));
        assertEquals("247 days remaining", ItemStatus.daysLabel(247));
        assertEquals("1 day overdue", ItemStatus.daysLabel(-1));
        assertEquals("33 days overdue", ItemStatus.daysLabel(-33));
    }
}
