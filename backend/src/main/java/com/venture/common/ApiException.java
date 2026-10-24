package com.venture.common;

import java.util.Map;
import org.springframework.http.HttpStatus;

/** An error that maps to an HTTP status and a {@code {"error": "..."}} JSON body. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final Map<String, Object> extra;

    public ApiException(HttpStatus status, String message) {
        this(status, message, Map.of());
    }

    public ApiException(HttpStatus status, String message, Map<String, Object> extra) {
        super(message);
        this.status = status;
        this.extra = extra;
    }

    public HttpStatus status() {
        return status;
    }

    /** Additional top-level JSON fields (e.g. {@code account} on a 402). */
    public Map<String, Object> extra() {
        return extra;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, message);
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }

    public static ApiException paymentRequired(String message, Map<String, Object> extra) {
        return new ApiException(HttpStatus.PAYMENT_REQUIRED, message, extra);
    }

    public static ApiException payloadTooLarge(String message) {
        return new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, message);
    }
}
