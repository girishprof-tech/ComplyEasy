package com.venture.db;

import com.venture.schemes.SchemeRepository;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;

/**
 * Creates the schema on a fresh database and upgrades older databases in
 * place. Everything here is idempotent and runs on every boot: each step
 * checks the current state before acting. See docs/DATA_MODEL.md.
 *
 * <p>{@code clients} is the historical table name; it now represents a
 * "Business" for both accountant-managed and self-managed (owner) cases.
 */
@Component
public class SchemaInitializer implements InitializingBean {

    private static final Logger log = LoggerFactory.getLogger(SchemaInitializer.class);

    private static final String SCHEMA = """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              role TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS accountant_profiles (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
              firm_name TEXT NOT NULL,
              phone TEXT
            );
            CREATE TABLE IF NOT EXISTS clients (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              accountant_id INTEGER REFERENCES users(id),
              business_name TEXT NOT NULL,
              business_type TEXT,
              industry TEXT,
              location TEXT,
              registration_id TEXT,
              contact_person TEXT,
              contact_email TEXT,
              contact_phone TEXT,
              linked_user_id INTEGER UNIQUE REFERENCES users(id),
              invite_token_hash TEXT,
              invite_expires_at TEXT,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS compliance_items (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              client_id INTEGER NOT NULL REFERENCES clients(id),
              name TEXT NOT NULL,
              issue_date TEXT,
              expiry_date TEXT NOT NULL,
              notes TEXT,
              certificate_filename TEXT,
              certificate_original_name TEXT,
              certificate_mime_type TEXT,
              certificate_size INTEGER,
              extracted_document_type TEXT,
              extracted_certificate_number TEXT,
              extracted_issuing_authority TEXT,
              category TEXT,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_clients_accountant ON clients(accountant_id);
            CREATE INDEX IF NOT EXISTS idx_items_client ON compliance_items(client_id);
            CREATE TABLE IF NOT EXISTS notifications (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL REFERENCES users(id),
              client_id INTEGER NOT NULL REFERENCES clients(id),
              compliance_item_id INTEGER NOT NULL REFERENCES compliance_items(id),
              type TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              read_at TEXT,
              email_sent_at TEXT,
              UNIQUE(user_id, compliance_item_id, type)
            );
            CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
            CREATE TABLE IF NOT EXISTS activity_log (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              client_id INTEGER NOT NULL REFERENCES clients(id),
              actor_user_id INTEGER REFERENCES users(id),
              event_type TEXT NOT NULL,
              description TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_activity_client ON activity_log(client_id);
            CREATE TABLE IF NOT EXISTS schemes (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              category TEXT NOT NULL,
              description TEXT NOT NULL,
              benefit_summary TEXT NOT NULL,
              eligibility_json TEXT NOT NULL,
              source_name TEXT NOT NULL,
              source_url TEXT NOT NULL,
              last_checked_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sustainability_inputs (
              client_id INTEGER PRIMARY KEY REFERENCES clients(id),
              electricity_notes TEXT,
              transport_notes TEXT,
              waste_notes TEXT,
              water_notes TEXT,
              updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            """;

    private final DataSource dataSource;
    private final SchemeRepository schemes;

    public SchemaInitializer(DataSource dataSource, SchemeRepository schemes) {
        this.dataSource = dataSource;
        this.schemes = schemes;
    }

    @Override
    public void afterPropertiesSet() throws SQLException {
        try (Connection con = dataSource.getConnection(); Statement st = con.createStatement()) {
            for (String ddl : SCHEMA.split(";\\s*\\n")) {
                if (!ddl.isBlank()) st.execute(ddl);
            }
            migrateUsersRole(con);
            migrateClientsAccountantNullable(con);
            addColumnIfMissing(con, "compliance_items", "certificate_filename", "TEXT");
            addColumnIfMissing(con, "compliance_items", "certificate_original_name", "TEXT");
            addColumnIfMissing(con, "compliance_items", "certificate_mime_type", "TEXT");
            addColumnIfMissing(con, "compliance_items", "certificate_size", "INTEGER");
            addColumnIfMissing(con, "compliance_items", "extracted_document_type", "TEXT");
            addColumnIfMissing(con, "compliance_items", "extracted_certificate_number", "TEXT");
            addColumnIfMissing(con, "compliance_items", "extracted_issuing_authority", "TEXT");
            addColumnIfMissing(con, "compliance_items", "category", "TEXT");
            // Free/Pro tier + lifetime AI-analysis counter.
            addColumnIfMissing(con, "users", "subscription_tier", "TEXT NOT NULL DEFAULT 'free'");
            addColumnIfMissing(con, "users", "ai_analyses_used", "INTEGER NOT NULL DEFAULT 0");
        }
        schemes.seedIfEmpty();
    }

    // ---- migrations for databases created before the current model -------------

    /** Old DBs have CHECK(role IN ('accountant','client')): rebuild without it and map client -> owner. */
    private void migrateUsersRole(Connection con) throws SQLException {
        String sql = tableSql(con, "users");
        if (sql == null || !sql.contains("'client'")) return;
        rebuild(con, () -> {
            try (Statement st = con.createStatement()) {
                st.execute("ALTER TABLE users RENAME TO users_old_migrating");
                st.execute("""
                        CREATE TABLE users (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          email TEXT UNIQUE NOT NULL,
                          password_hash TEXT NOT NULL,
                          role TEXT NOT NULL,
                          created_at TEXT NOT NULL DEFAULT (datetime('now'))
                        )""");
                st.execute("""
                        INSERT INTO users (id, email, password_hash, role, created_at)
                        SELECT id, email, password_hash,
                               CASE WHEN role = 'client' THEN 'owner' ELSE role END, created_at
                        FROM users_old_migrating""");
                st.execute("DROP TABLE users_old_migrating");
            }
        });
        log.info("[migrate] users.role: dropped CHECK constraint, remapped client -> owner");
    }

    /** Old DBs have accountant_id NOT NULL: rebuild nullable so a business can exist with no accountant. */
    private void migrateClientsAccountantNullable(Connection con) throws SQLException {
        String sql = tableSql(con, "clients");
        if (sql != null && sql.matches("(?is).*accountant_id\\s+INTEGER\\s+NOT\\s+NULL.*")) {
            rebuild(con, () -> {
                try (Statement st = con.createStatement()) {
                    st.execute("ALTER TABLE clients RENAME TO clients_old_migrating");
                    st.execute("""
                            CREATE TABLE clients (
                              id INTEGER PRIMARY KEY AUTOINCREMENT,
                              accountant_id INTEGER REFERENCES users(id),
                              business_name TEXT NOT NULL,
                              business_type TEXT,
                              industry TEXT,
                              location TEXT,
                              registration_id TEXT,
                              contact_person TEXT,
                              contact_email TEXT,
                              contact_phone TEXT,
                              linked_user_id INTEGER UNIQUE REFERENCES users(id),
                              invite_token_hash TEXT,
                              invite_expires_at TEXT,
                              created_at TEXT NOT NULL DEFAULT (datetime('now'))
                            )""");
                    st.execute("""
                            INSERT INTO clients (id, accountant_id, business_name, registration_id,
                                                 contact_person, contact_email, contact_phone,
                                                 linked_user_id, invite_token_hash, invite_expires_at, created_at)
                            SELECT id, accountant_id, business_name, registration_id,
                                   contact_person, contact_email, contact_phone,
                                   linked_user_id, invite_token_hash, invite_expires_at, created_at
                            FROM clients_old_migrating""");
                    st.execute("DROP TABLE clients_old_migrating");
                    st.execute("CREATE INDEX IF NOT EXISTS idx_clients_accountant ON clients(accountant_id)");
                }
            });
            log.info("[migrate] clients.accountant_id is now nullable; added business_type/industry/location");
        } else {
            addColumnIfMissing(con, "clients", "business_type", "TEXT");
            addColumnIfMissing(con, "clients", "industry", "TEXT");
            addColumnIfMissing(con, "clients", "location", "TEXT");
        }
    }

    @FunctionalInterface
    private interface SqlAction {
        void run() throws SQLException;
    }

    /**
     * Table rebuilds rename tables other tables reference, which trips SQLite's
     * FK checker mid-way. The pragma can only change outside a transaction.
     */
    private void rebuild(Connection con, SqlAction action) throws SQLException {
        try (Statement st = con.createStatement()) {
            st.execute("PRAGMA foreign_keys = OFF");
        }
        con.setAutoCommit(false);
        try {
            action.run();
            con.commit();
        } catch (SQLException | RuntimeException e) {
            con.rollback();
            throw e;
        } finally {
            con.setAutoCommit(true);
            try (Statement st = con.createStatement()) {
                st.execute("PRAGMA foreign_keys = ON");
            }
        }
    }

    private String tableSql(Connection con, String table) throws SQLException {
        try (var ps = con.prepareStatement("SELECT sql FROM sqlite_master WHERE type='table' AND name=?")) {
            ps.setString(1, table);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private void addColumnIfMissing(Connection con, String table, String column, String definition)
            throws SQLException {
        try (Statement st = con.createStatement(); ResultSet rs = st.executeQuery("PRAGMA table_info(" + table + ")")) {
            while (rs.next()) {
                if (column.equals(rs.getString("name"))) return;
            }
        }
        try (Statement st = con.createStatement()) {
            st.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
        }
    }
}
