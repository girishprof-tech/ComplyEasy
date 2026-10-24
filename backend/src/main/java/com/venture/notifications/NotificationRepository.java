package com.venture.notifications;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class NotificationRepository {

    private final JdbcTemplate jdbc;

    NotificationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * The UNIQUE(user_id, compliance_item_id, type) constraint is what actually
     * prevents duplicates — callers never need to track "did I already send this".
     */
    void insertIfAbsent(long userId, long clientId, long itemId, String type) {
        jdbc.update(
                "INSERT OR IGNORE INTO notifications (user_id, client_id, compliance_item_id, type) VALUES (?, ?, ?, ?)",
                userId,
                clientId,
                itemId,
                type);
    }

    List<NotificationRow> listForUser(long userId) {
        return jdbc.query(
                """
                SELECT n.*, ci.name AS item_name, ci.expiry_date, c.business_name
                FROM notifications n
                JOIN compliance_items ci ON ci.id = n.compliance_item_id
                JOIN clients c ON c.id = n.client_id
                WHERE n.user_id = ?
                ORDER BY n.created_at DESC, n.id DESC""",
                (rs, i) -> new NotificationRow(
                        rs.getLong("id"),
                        rs.getLong("client_id"),
                        rs.getString("type"),
                        rs.getString("created_at"),
                        rs.getString("read_at"),
                        rs.getString("item_name"),
                        rs.getString("expiry_date"),
                        rs.getString("business_name")),
                userId);
    }

    void markRead(long userId, long notificationId) {
        jdbc.update(
                "UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ?",
                notificationId,
                userId);
    }
}
