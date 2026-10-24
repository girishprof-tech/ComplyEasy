package com.venture.activity;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * A lightweight activity log: which business, who did it, a short generic
 * description and a timestamp. Deliberately never records certificate
 * contents, file paths or field-level diffs — just "what kind of thing
 * happened" (e.g. "Certificate uploaded for Fire NOC").
 */
@Service
public class ActivityService {

    private static final int DEFAULT_LIMIT = 50;

    private final JdbcTemplate jdbc;

    public ActivityService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void log(long clientId, Long actorUserId, String eventType, String description) {
        jdbc.update(
                "INSERT INTO activity_log (client_id, actor_user_id, event_type, description) VALUES (?, ?, ?, ?)",
                clientId,
                actorUserId,
                eventType,
                description);
    }

    /** Newest first. */
    public List<ActivityEntryDto> listForClient(long clientId) {
        return jdbc.query(
                "SELECT * FROM activity_log WHERE client_id = ? ORDER BY created_at DESC, id DESC LIMIT ?",
                (rs, i) -> new ActivityEntryDto(
                        rs.getLong("id"),
                        rs.getString("event_type"),
                        rs.getString("description"),
                        rs.getString("created_at")),
                clientId,
                DEFAULT_LIMIT);
    }
}
