package com.venture.compliance;

import com.venture.db.SqlSupport;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class ComplianceItemRepository {

    /** An item together with the business it belongs to (for cross-client views). */
    public record ItemWithBusiness(ComplianceItem item, String businessName, String registrationId) {}

    static final RowMapper<ComplianceItem> MAPPER = (rs, i) -> new ComplianceItem(
            rs.getLong("id"),
            rs.getLong("client_id"),
            rs.getString("name"),
            rs.getString("issue_date"),
            rs.getString("expiry_date"),
            rs.getString("notes"),
            rs.getString("certificate_filename"),
            rs.getString("certificate_original_name"),
            rs.getString("certificate_mime_type"),
            SqlSupport.nullableLong(rs, "certificate_size"),
            rs.getString("extracted_document_type"),
            rs.getString("extracted_certificate_number"),
            rs.getString("extracted_issuing_authority"),
            rs.getString("category"),
            rs.getString("created_at"));

    private static final RowMapper<ItemWithBusiness> WITH_BUSINESS_MAPPER = (rs, i) ->
            new ItemWithBusiness(MAPPER.mapRow(rs, i), rs.getString("business_name"), rs.getString("registration_id"));

    private final JdbcTemplate jdbc;

    public ComplianceItemRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Soonest expiry first. */
    public List<ComplianceItem> listByClient(long clientId) {
        return jdbc.query(
                "SELECT * FROM compliance_items WHERE client_id = ? ORDER BY expiry_date ASC", MAPPER, clientId);
    }

    /** In creation order (the order rule matching has always seen items in). */
    public List<ComplianceItem> listByClientInCreationOrder(long clientId) {
        return jdbc.query("SELECT * FROM compliance_items WHERE client_id = ? ORDER BY id ASC", MAPPER, clientId);
    }

    public Optional<ComplianceItem> findByIdAndClient(long id, long clientId) {
        List<ComplianceItem> rows = jdbc.query(
                "SELECT * FROM compliance_items WHERE id = ? AND client_id = ?", MAPPER, id, clientId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public ComplianceItem getById(long id) {
        return jdbc.queryForObject("SELECT * FROM compliance_items WHERE id = ?", MAPPER, id);
    }

    /** Every item of every client of an accountant, unordered (dashboard aggregation). */
    public List<ItemWithBusiness> listForAccountant(long accountantId) {
        return jdbc.query(
                """
                SELECT ci.*, c.business_name, c.registration_id
                FROM compliance_items ci
                JOIN clients c ON c.id = ci.client_id
                WHERE c.accountant_id = ?
                ORDER BY ci.id""",
                WITH_BUSINESS_MAPPER,
                accountantId);
    }

    /** Same, ordered by business name then soonest expiry (CSV register). */
    public List<ItemWithBusiness> listForAccountantOrdered(long accountantId) {
        return jdbc.query(
                """
                SELECT ci.*, c.business_name, c.registration_id
                FROM compliance_items ci
                JOIN clients c ON c.id = ci.client_id
                WHERE c.accountant_id = ?
                ORDER BY c.business_name COLLATE NOCASE, ci.expiry_date ASC""",
                WITH_BUSINESS_MAPPER,
                accountantId);
    }

    public long insert(long clientId, ItemValues v) {
        return SqlSupport.insert(
                jdbc,
                """
                INSERT INTO compliance_items
                  (client_id, name, issue_date, expiry_date, notes,
                   certificate_filename, certificate_original_name, certificate_mime_type, certificate_size,
                   extracted_document_type, extracted_certificate_number, extracted_issuing_authority, category)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                clientId,
                v.name(),
                v.issueDate(),
                v.expiryDate(),
                v.notes(),
                v.certificateFilename(),
                v.certificateOriginalName(),
                v.certificateMimeType(),
                v.certificateSize(),
                v.extractedDocumentType(),
                v.extractedCertificateNumber(),
                v.extractedIssuingAuthority(),
                v.category());
    }

    public void update(long id, ItemValues v) {
        jdbc.update(
                """
                UPDATE compliance_items SET name = ?, issue_date = ?, expiry_date = ?, notes = ?,
                  certificate_filename = ?, certificate_original_name = ?, certificate_mime_type = ?, certificate_size = ?,
                  extracted_document_type = ?, extracted_certificate_number = ?, extracted_issuing_authority = ?, category = ?
                WHERE id = ?""",
                v.name(),
                v.issueDate(),
                v.expiryDate(),
                v.notes(),
                v.certificateFilename(),
                v.certificateOriginalName(),
                v.certificateMimeType(),
                v.certificateSize(),
                v.extractedDocumentType(),
                v.extractedCertificateNumber(),
                v.extractedIssuingAuthority(),
                v.category(),
                id);
    }

    public void deleteWithNotifications(long id) {
        jdbc.update("DELETE FROM notifications WHERE compliance_item_id = ?", id);
        jdbc.update("DELETE FROM compliance_items WHERE id = ?", id);
    }
}
