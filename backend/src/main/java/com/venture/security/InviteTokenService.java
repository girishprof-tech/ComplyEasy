package com.venture.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

/** One-time invite links: the raw token goes in the URL, only its SHA-256 is stored. */
@Component
public class InviteTokenService {

    private static final Duration TTL = Duration.ofDays(3);

    private final SecureRandom random = new SecureRandom();

    /** A freshly minted invite. {@code expiresAt} is an ISO-8601 instant string. */
    public record Invite(String raw, String hash, String expiresAt) {}

    public Invite create() {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String expiresAt = Instant.now().truncatedTo(ChronoUnit.MILLIS).plus(TTL).toString();
        return new Invite(raw, hash(raw), expiresAt);
    }

    public String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public boolean isExpired(String expiresAt) {
        return expiresAt != null && Instant.parse(expiresAt).isBefore(Instant.now());
    }
}
