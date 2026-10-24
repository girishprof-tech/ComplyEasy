package com.venture.compliance;

/** A compliance item as stored (one row of {@code compliance_items}). */
public record ComplianceItem(
        long id,
        long clientId,
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
        String category,
        String createdAt) {}
