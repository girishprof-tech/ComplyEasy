package com.venture.compliance;

import com.fasterxml.jackson.annotation.JsonSetter;

/**
 * Body for creating or updating a compliance item.
 *
 * <p>{@code certificate} has three meaningful states on update, so we track
 * whether the key was present at all: absent = leave the stored certificate
 * alone, {@code null} = remove it, an object = replace it.
 */
public class ComplianceItemRequest {

    private String name;
    private String issueDate;
    private String expiryDate;
    private String notes;
    private CertificatePayload certificate;
    private boolean certificateProvided;
    private String extractedDocumentType;
    private String extractedCertificateNumber;
    private String extractedIssuingAuthority;
    private String category;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getIssueDate() { return issueDate; }
    public void setIssueDate(String issueDate) { this.issueDate = issueDate; }

    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public CertificatePayload getCertificate() { return certificate; }

    /** Jackson calls this for an explicit {@code "certificate": null} as well as for an object. */
    @JsonSetter("certificate")
    public void setCertificate(CertificatePayload certificate) {
        this.certificate = certificate;
        this.certificateProvided = true;
    }

    public boolean isCertificateProvided() { return certificateProvided; }

    public String getExtractedDocumentType() { return extractedDocumentType; }
    public void setExtractedDocumentType(String v) { this.extractedDocumentType = v; }

    public String getExtractedCertificateNumber() { return extractedCertificateNumber; }
    public void setExtractedCertificateNumber(String v) { this.extractedCertificateNumber = v; }

    public String getExtractedIssuingAuthority() { return extractedIssuingAuthority; }
    public void setExtractedIssuingAuthority(String v) { this.extractedIssuingAuthority = v; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
