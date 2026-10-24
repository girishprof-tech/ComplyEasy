package com.venture.compliance;

import com.venture.common.ItemStatus;

/** API representation of a compliance item, with its computed status and insight. */
public record ComplianceItemDto(
        long id,
        long clientId,
        String name,
        String issueDate,
        String expiryDate,
        String notes,
        ItemStatus status,
        long daysUntilExpiry,
        String daysLabel,
        boolean hasCertificate,
        String certificateOriginalName,
        String certificateMimeType,
        Long certificateSize,
        String extractedDocumentType,
        String extractedCertificateNumber,
        String extractedIssuingAuthority,
        String category,
        ComplianceInsight aiInsight) {

    public static ComplianceItemDto from(ComplianceItem item) {
        long days = ItemStatus.daysUntil(item.expiryDate());
        ItemStatus status = ItemStatus.fromDays(days);
        return new ComplianceItemDto(
                item.id(),
                item.clientId(),
                item.name(),
                item.issueDate(),
                item.expiryDate(),
                item.notes(),
                status,
                days,
                ItemStatus.daysLabel(days),
                item.certificateFilename() != null && !item.certificateFilename().isEmpty(),
                item.certificateOriginalName(),
                item.certificateMimeType(),
                item.certificateSize(),
                item.extractedDocumentType(),
                item.extractedCertificateNumber(),
                item.extractedIssuingAuthority(),
                item.category(),
                ComplianceInsightGenerator.generate(status, days));
    }
}
