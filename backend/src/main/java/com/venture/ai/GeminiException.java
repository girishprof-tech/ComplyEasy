package com.venture.ai;

/** A failed Gemini call. {@code code} is one of: not_configured, invalid_key, not_found, rate_limited, network, malformed, unknown. */
public class GeminiException extends RuntimeException {

    private final String code;

    public GeminiException(String message, String code) {
        super(message);
        this.code = code;
    }

    public String code() {
        return code;
    }
}
