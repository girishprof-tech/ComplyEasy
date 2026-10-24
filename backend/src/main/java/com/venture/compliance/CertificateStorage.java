package com.venture.compliance;

import com.venture.common.ApiException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Stores uploaded certificate files on disk, outside anything the web layer
 * serves directly: the only way to read one back is through the authenticated
 * certificate endpoint, which checks business ownership first. The stored
 * name is random and never derived from the user's file name.
 */
@Component
public class CertificateStorage {

    public static final Map<String, String> ALLOWED_MIME_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/jpg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "application/pdf", ".pdf");

    public static final long MAX_BYTES = 5L * 1024 * 1024;

    /** What to record in the database row for a saved file. */
    public record StoredCertificate(String filename, String originalName, String mimeType, long size) {}

    private final Path uploadDir;
    private final SecureRandom random = new SecureRandom();

    public CertificateStorage(Path uploadDir) {
        this.uploadDir = uploadDir;
    }

    public StoredCertificate save(CertificatePayload cert) {
        if (cert == null) throw ApiException.badRequest("Invalid certificate payload");
        String ext = cert.mimeType() == null ? null : ALLOWED_MIME_TYPES.get(cert.mimeType());
        if (ext == null) throw ApiException.badRequest("Unsupported file type. Use JPG, PNG, WEBP, or PDF.");
        if (cert.dataBase64() == null || cert.dataBase64().isEmpty()) throw ApiException.badRequest("Missing file data");

        byte[] bytes;
        try {
            bytes = Base64.getMimeDecoder().decode(cert.dataBase64());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Could not decode file data");
        }
        if (bytes.length == 0) throw ApiException.badRequest("The uploaded file is empty");
        if (bytes.length > MAX_BYTES) {
            throw ApiException.badRequest("File is too large. Maximum size is " + MAX_BYTES / (1024 * 1024) + "MB.");
        }

        byte[] nameBytes = new byte[24];
        random.nextBytes(nameBytes);
        String storedName = HexFormat.of().formatHex(nameBytes) + ext;
        try {
            Files.write(uploadDir.resolve(storedName), bytes);
        } catch (IOException e) {
            throw new IllegalStateException("Could not store certificate", e);
        }

        String original = cert.fileName() == null || cert.fileName().isEmpty() ? "certificate" : cert.fileName();
        original = original.replaceAll("[/\\\\]", "_");
        if (original.length() > 200) original = original.substring(0, 200);
        return new StoredCertificate(storedName, original, cert.mimeType(), bytes.length);
    }

    /**
     * Resolves a stored filename inside the upload folder. Only ever called
     * with names read back from the database, but still verified as a backstop.
     */
    public Path pathOf(String storedFilename) {
        Path resolved = uploadDir.resolve(Path.of(storedFilename).getFileName().toString()).normalize();
        if (!resolved.startsWith(uploadDir)) throw ApiException.badRequest("Invalid file reference");
        return resolved;
    }

    /** Best-effort delete; a missing file is not an error. */
    public void delete(String storedFilename) {
        if (storedFilename == null || storedFilename.isEmpty()) return;
        try {
            Files.deleteIfExists(pathOf(storedFilename));
        } catch (IOException | RuntimeException ignored) {
            // nothing to clean up
        }
    }
}
