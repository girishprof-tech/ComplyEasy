package com.venture.common;

/** Small helpers that mirror the null/empty-string handling the API has always had. */
public final class Strings {

    private Strings() {}

    public static boolean isEmpty(String s) {
        return s == null || s.isEmpty();
    }

    /** {@code ""} becomes {@code null}; anything else (including whitespace) is kept as-is. */
    public static String emptyToNull(String s) {
        return isEmpty(s) ? null : s;
    }

    /** First argument if non-null, otherwise the fallback (an empty string counts as a value). */
    public static String coalesce(String value, String fallback) {
        return value != null ? value : fallback;
    }
}
