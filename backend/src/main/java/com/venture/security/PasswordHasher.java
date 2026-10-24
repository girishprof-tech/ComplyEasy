package com.venture.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;
import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.stereotype.Component;

/**
 * scrypt password hashing, byte-compatible with the original Node app
 * ({@code crypto.scryptSync(password, salt, 64)}), so existing accounts keep
 * working. Stored format: {@code <hex salt>:<hex hash>}. As in the original,
 * the salt string itself (not its decoded bytes) is the scrypt salt.
 */
@Component
public class PasswordHasher {

    private static final int N = 16384;
    private static final int R = 8;
    private static final int P = 1;
    private static final int KEY_LENGTH = 64;

    private final SecureRandom random = new SecureRandom();

    public String hash(String password) {
        byte[] saltBytes = new byte[16];
        random.nextBytes(saltBytes);
        String salt = HexFormat.of().formatHex(saltBytes);
        return salt + ":" + derive(password, salt);
    }

    public boolean verify(String password, String stored) {
        if (stored == null) return false;
        int idx = stored.indexOf(':');
        if (idx < 0) return false;
        String salt = stored.substring(0, idx);
        String expected = stored.substring(idx + 1);
        try {
            byte[] check = HexFormat.of().parseHex(derive(password, salt));
            byte[] want = HexFormat.of().parseHex(expected);
            return MessageDigest.isEqual(check, want);
        } catch (IllegalArgumentException e) {
            return false; // malformed stored hash
        }
    }

    private static String derive(String password, String salt) {
        byte[] key = SCrypt.generate(
                password.getBytes(StandardCharsets.UTF_8), salt.getBytes(StandardCharsets.UTF_8), N, R, P, KEY_LENGTH);
        return HexFormat.of().formatHex(key);
    }
}
