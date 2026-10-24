package com.venture.common;

import com.fasterxml.jackson.annotation.JsonValue;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/** Where a compliance item stands relative to today. Dates are compared as whole days. */
public enum ItemStatus {
    ACTIVE("active"),
    EXPIRING_SOON("expiring_soon"),
    EXPIRED("expired");

    /** Items expiring within this many days are "expiring soon". */
    public static final int SOON_WINDOW_DAYS = 30;

    private final String value;

    ItemStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String value() {
        return value;
    }

    public static long daysUntil(String isoDate) {
        return daysUntil(isoDate, LocalDate.now());
    }

    public static long daysUntil(String isoDate, LocalDate today) {
        return ChronoUnit.DAYS.between(today, LocalDate.parse(isoDate));
    }

    public static ItemStatus fromDays(long days) {
        if (days < 0) return EXPIRED;
        if (days <= SOON_WINDOW_DAYS) return EXPIRING_SOON;
        return ACTIVE;
    }

    public static ItemStatus of(String isoDate) {
        return fromDays(daysUntil(isoDate));
    }

    /** Human label such as "Expires today", "247 days remaining" or "33 days overdue". */
    public static String daysLabel(long days) {
        if (days == 0) return "Expires today";
        long n = Math.abs(days);
        String unit = n == 1 ? "day" : "days";
        return days > 0 ? n + " " + unit + " remaining" : n + " " + unit + " overdue";
    }
}
