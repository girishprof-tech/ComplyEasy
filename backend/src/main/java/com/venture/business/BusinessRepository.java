package com.venture.business;

import com.venture.db.SqlSupport;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class BusinessRepository {

    private static final RowMapper<Business> MAPPER = (rs, i) -> new Business(
            rs.getLong("id"),
            SqlSupport.nullableLong(rs, "accountant_id"),
            rs.getString("business_name"),
            rs.getString("business_type"),
            rs.getString("industry"),
            rs.getString("location"),
            rs.getString("registration_id"),
            rs.getString("contact_person"),
            rs.getString("contact_email"),
            rs.getString("contact_phone"),
            SqlSupport.nullableLong(rs, "linked_user_id"),
            rs.getString("invite_token_hash"),
            rs.getString("invite_expires_at"),
            rs.getString("created_at"));

    private final JdbcTemplate jdbc;

    public BusinessRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Business> findById(long id) {
        return first(jdbc.query("SELECT * FROM clients WHERE id = ?", MAPPER, id));
    }

    public Optional<Business> findByIdForAccountant(long id, long accountantId) {
        return first(jdbc.query("SELECT * FROM clients WHERE id = ? AND accountant_id = ?", MAPPER, id, accountantId));
    }

    public Optional<Business> findByLinkedUser(long userId) {
        return first(jdbc.query("SELECT * FROM clients WHERE linked_user_id = ?", MAPPER, userId));
    }

    public Optional<Business> findByInviteTokenHash(String hash) {
        return first(jdbc.query("SELECT * FROM clients WHERE invite_token_hash = ?", MAPPER, hash));
    }

    public List<Business> listForAccountant(long accountantId) {
        return jdbc.query(
                "SELECT * FROM clients WHERE accountant_id = ? ORDER BY business_name COLLATE NOCASE",
                MAPPER,
                accountantId);
    }

    public int countForAccountant(long accountantId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM clients WHERE accountant_id = ?", Integer.class, accountantId);
        return n == null ? 0 : n;
    }

    public long insertForAccountant(long accountantId, BusinessDetails d) {
        return SqlSupport.insert(
                jdbc,
                """
                INSERT INTO clients (accountant_id, business_name, business_type, industry, location,
                                     registration_id, contact_person, contact_email, contact_phone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                accountantId,
                d.businessName(),
                d.businessType(),
                d.industry(),
                d.location(),
                d.registrationId(),
                d.contactPerson(),
                d.contactEmail(),
                d.contactPhone());
    }

    /** A self-managed business: no accountant, linked to the owner's login from the start. */
    public long insertForOwner(long ownerUserId, BusinessDetails d) {
        return SqlSupport.insert(
                jdbc,
                """
                INSERT INTO clients (accountant_id, business_name, business_type, industry, location,
                                     registration_id, contact_person, contact_email, contact_phone, linked_user_id)
                VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                d.businessName(),
                d.businessType(),
                d.industry(),
                d.location(),
                d.registrationId(),
                d.contactPerson(),
                d.contactEmail(),
                d.contactPhone(),
                ownerUserId);
    }

    public void updateDetails(long id, BusinessDetails d) {
        jdbc.update(
                """
                UPDATE clients SET business_name = ?, business_type = ?, industry = ?, location = ?,
                       registration_id = ?, contact_person = ?, contact_email = ?, contact_phone = ?
                WHERE id = ?""",
                d.businessName(),
                d.businessType(),
                d.industry(),
                d.location(),
                d.registrationId(),
                d.contactPerson(),
                d.contactEmail(),
                d.contactPhone(),
                id);
    }

    public void setInvite(long id, String tokenHash, String expiresAt) {
        jdbc.update("UPDATE clients SET invite_token_hash = ?, invite_expires_at = ? WHERE id = ?", tokenHash, expiresAt, id);
    }

    /** Links the activated owner's login and consumes the invite. */
    public void linkUser(long id, long userId) {
        jdbc.update(
                "UPDATE clients SET linked_user_id = ?, invite_token_hash = NULL, invite_expires_at = NULL WHERE id = ?",
                userId,
                id);
    }

    /** Deletes a business and everything that references it. */
    public void deleteCascade(long id) {
        jdbc.update("DELETE FROM notifications WHERE client_id = ?", id);
        jdbc.update("DELETE FROM activity_log WHERE client_id = ?", id);
        jdbc.update("DELETE FROM compliance_items WHERE client_id = ?", id);
        jdbc.update("DELETE FROM sustainability_inputs WHERE client_id = ?", id);
        jdbc.update("DELETE FROM clients WHERE id = ?", id);
    }

    private static <T> Optional<T> first(List<T> rows) {
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }
}
