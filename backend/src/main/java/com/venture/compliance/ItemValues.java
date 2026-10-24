package com.venture.compliance;

/** The writable columns of a compliance item, used for both insert and update. */
public record ItemValues(
        String name,
        String issueDate,
        String expiryDate,
        String notes,
        String certificateFilename,
        String certificateOriginalName,
        String certificateMimeType,
        Long certificateSize,
        String extractedDocumentType,
        String extractedCertificateNumber,
        String extractedIssuingAuthority,
        String category) {}
