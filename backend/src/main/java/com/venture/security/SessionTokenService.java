package com.venture.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.venture.config.VentureProperties;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

/**
 * Stateless session tokens: {@code base64url(payload).base64url(hmac-sha256)}.
 * The secret comes from {@code SESSION_SECRET}; if unset a random one is
 * generated at startup, so sessions end when the server restarts.
 */
@Component
public class SessionTokenService {

    public static final Duration TTL = Duration.ofDays(7);

    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64_DECODE = Base64.getUrlDecoder();

    private final ObjectMapper mapper;
    private final byte[] secret;

    public SessionTokenService(VentureProperties props, ObjectMapper mapper) {
        this.mapper = mapper;
        String configured = props.security().sessionSecret();
        if (configured != null && !configured.isBlank()) {
            this.secret = configured.getBytes(StandardCharsets.UTF_8);
        } else {
            byte[] random = new byte[32];
            new SecureRandom().nextBytes(random);
            this.secret = random;
        }
    }

    public String sign(SessionUser user) {
        ObjectNode payload = mapper.createObjectNode();
        payload.put("userId", user.userId());
        payload.put("role", user.role().value());
        payload.put("exp", System.currentTimeMillis() + TTL.toMillis());
        String body = B64.encodeToString(payload.toString().getBytes(StandardCharsets.UTF_8));
        return body + "." + mac(body);
    }

    /** The user the token vouches for, or null if it is malformed, forged or expired. */
    public SessionUser verify(String token) {
        if (token == null) return null;
        int dot = token.indexOf('.');
        if (dot < 0) return null;
        String body = token.substring(0, dot);
        String sig = token.substring(dot + 1);
        String expected = mac(body);
        if (!MessageDigest.isEqual(sig.getBytes(StandardCharsets.UTF_8), expected.getBytes(StandardCharsets.UTF_8))) {
            return null;
        }
        try {
            JsonNode payload = mapper.readTree(B64_DECODE.decode(body));
            if (payload.path("exp").asLong(0) < System.currentTimeMillis()) return null;
            Role role = Role.fromValue(payload.path("role").asText(null));
            if (role == null || !payload.hasNonNull("userId")) return null;
            return new SessionUser(payload.get("userId").asLong(), role);
        } catch (Exception e) {
            return null;
        }
    }

    private String mac(String body) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return B64.encodeToString(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
