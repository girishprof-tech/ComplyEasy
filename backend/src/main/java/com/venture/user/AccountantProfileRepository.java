package com.venture.user;

import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AccountantProfileRepository {

    private final JdbcTemplate jdbc;

    public AccountantProfileRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(long userId, String firmName) {
        jdbc.update("INSERT INTO accountant_profiles (user_id, firm_name) VALUES (?, ?)", userId, firmName);
    }

    public void updateFirmName(long userId, String firmName) {
        int rows = jdbc.update("UPDATE accountant_profiles SET firm_name = ? WHERE user_id = ?", firmName, userId);
        if (rows == 0) {
            insert(userId, firmName);
        }
    }

    public Optional<String> findFirmName(long userId) {
        List<String> rows =
                jdbc.queryForList("SELECT firm_name FROM accountant_profiles WHERE user_id = ?", String.class, userId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }
}
