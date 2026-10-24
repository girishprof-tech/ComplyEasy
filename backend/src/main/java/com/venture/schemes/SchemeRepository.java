package com.venture.schemes;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SchemeRepository {

    private final JdbcTemplate jdbc;

    public SchemeRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Idempotent: seeds only an empty table, so the "last checked" date stays honest. */
    public void seedIfEmpty() {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM schemes", Integer.class);
        if (count != null && count > 0) return;
        for (SchemeSeedData.Seed s : SchemeSeedData.SCHEMES) {
            jdbc.update(
                    """
                    INSERT INTO schemes (id, name, category, description, benefit_summary, eligibility_json,
                                         source_name, source_url, last_checked_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))""",
                    s.id(),
                    s.name(),
                    s.category(),
                    s.description(),
                    s.benefitSummary(),
                    s.eligibilityJson(),
                    s.sourceName(),
                    s.sourceUrl());
        }
    }

    List<SchemeRow> listAll() {
        return jdbc.query(
                "SELECT * FROM schemes ORDER BY name",
                (rs, i) -> new SchemeRow(
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getString("category"),
                        rs.getString("description"),
                        rs.getString("benefit_summary"),
                        rs.getString("eligibility_json"),
                        rs.getString("source_name"),
                        rs.getString("source_url"),
                        rs.getString("last_checked_at")));
    }
}
