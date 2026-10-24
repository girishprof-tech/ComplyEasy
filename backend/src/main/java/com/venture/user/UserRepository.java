package com.venture.user;

import com.venture.db.SqlSupport;
import com.venture.security.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private static final RowMapper<UserAccount> MAPPER = (rs, i) -> new UserAccount(
            rs.getLong("id"),
            rs.getString("email"),
            rs.getString("password_hash"),
            Role.fromValue(rs.getString("role")),
            rs.getString("subscription_tier"),
            rs.getInt("ai_analyses_used"),
            rs.getString("created_at"));

    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<UserAccount> findById(long id) {
        return first(jdbc.query("SELECT * FROM users WHERE id = ?", MAPPER, id));
    }

    public Optional<UserAccount> findByEmail(String email) {
        return first(jdbc.query("SELECT * FROM users WHERE email = ?", MAPPER, email));
    }

    public boolean emailExists(String email) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email);
        return n != null && n > 0;
    }

    public long insert(String email, String passwordHash, Role role) {
        return SqlSupport.insert(
                jdbc, "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)", email, passwordHash, role.value());
    }

    public void updatePasswordHash(long userId, String passwordHash) {
        jdbc.update("UPDATE users SET password_hash = ? WHERE id = ?", passwordHash, userId);
    }

    public void updateSubscriptionTier(long userId, String tier) {
        jdbc.update("UPDATE users SET subscription_tier = ? WHERE id = ?", tier, userId);
    }

    public void incrementAiAnalysesUsed(long userId) {
        jdbc.update("UPDATE users SET ai_analyses_used = ai_analyses_used + 1 WHERE id = ?", userId);
    }

    private static <T> Optional<T> first(List<T> rows) {
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }
}
