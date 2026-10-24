package com.venture.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Fields read (or, in demo mode, invented) from an uploaded certificate. This
 * is only ever a suggestion for the user to review — nothing is saved until
 * they save the compliance item.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CertificateExtraction(
        String documentType,
        String certificateNumber,
        String businessName,
        String issuingAuthority,
        String issueDate,
        String expiryDate,
        String complianceCategory,
        int confidence,
        String summary,
        boolean demoMode,
        String provider,
        @JsonInclude(JsonInclude.Include.NON_NULL) String providerError) {

    public CertificateExtraction withProviderError(String error) {
        return new CertificateExtraction(
                documentType,
                certificateNumber,
                businessName,
                issuingAuthority,
                issueDate,
                expiryDate,
                complianceCategory,
                confidence,
                summary,
                demoMode,
                provider,
                error);
    }
}
