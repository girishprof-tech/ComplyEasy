package com.venture.security;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
    ACCOUNTANT("accountant"),
    OWNER("owner");

    private final String value;

    Role(String value) {
        this.value = value;
    }

    @JsonValue
    public String value() {
        return value;
    }

    /** The role for a stored/serialised value, or null if unknown. */
    public static Role fromValue(String value) {
        for (Role r : values()) {
            if (r.value.equals(value)) return r;
        }
        return null;
    }
}
