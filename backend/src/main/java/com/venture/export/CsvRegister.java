package com.venture.export;

import com.venture.common.ItemStatus;
import com.venture.compliance.ComplianceItem;
import java.util.List;

/** Builds the CSV compliance register (plain strings, CRLF line endings). */
final class CsvRegister {

    private CsvRegister() {}

    static final List<String> ACCOUNTANT_HEADER = List.of(
            "Business", "Registration ID", "Compliance Item", "Category", "Issue Date", "Expiry Date", "Status",
            "Days Until Expiry", "Certificate Available", "Review Status");

    static final List<String> OWNER_HEADER = List.of(
            "Compliance Item", "Category", "Issue Date", "Expiry Date", "Status", "Days Until Expiry",
            "Certificate Available", "Review Status");

    static String escape(String value) {
        if (value == null) return "";
        if (value.indexOf('"') >= 0 || value.indexOf(',') >= 0 || value.indexOf('\n') >= 0) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    static String row(List<String> fields) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < fields.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(escape(fields.get(i)));
        }
        return sb.append("\r\n").toString();
    }

    /** The columns shared by both registers, from "Compliance Item" through "Review Status". */
    static List<String> itemColumns(ComplianceItem r) {
        long days = ItemStatus.daysUntil(r.expiryDate());
        return List.of(
                r.name(),
                r.category() == null ? "" : r.category(),
                r.issueDate() == null ? "" : r.issueDate(),
                r.expiryDate(),
                ItemStatus.fromDays(days).value(),
                String.valueOf(days),
                r.certificateFilename() != null && !r.certificateFilename().isEmpty() ? "Yes" : "No",
                reviewStatus(r));
    }

    /** Whether the stored fields came from a reviewed AI extraction. */
    static String reviewStatus(ComplianceItem r) {
        boolean extracted = !isEmpty(r.extractedDocumentType())
                || !isEmpty(r.extractedCertificateNumber())
                || !isEmpty(r.extractedIssuingAuthority());
        return extracted ? "AI-Extracted — Verify" : "Manually Entered";
    }

    private static boolean isEmpty(String s) {
        return s == null || s.isEmpty();
    }
}
