package com.venture.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The embedded SQLite database (same file and schema as the original app).
 * SQLite allows one writer, so a single pooled connection keeps access
 * serialised and makes per-connection pragmas reliable.
 */
@Configuration
public class DatabaseConfig {

    @Bean
    public DataSource dataSource(VentureProperties props) throws IOException {
        Path dataDir = Path.of(props.storage().dataDir()).toAbsolutePath().normalize();
        Files.createDirectories(dataDir);

        HikariConfig cfg = new HikariConfig();
        cfg.setDriverClassName("org.sqlite.JDBC");
        cfg.setJdbcUrl("jdbc:sqlite:" + dataDir.resolve("venture.db"));
        cfg.setMaximumPoolSize(1);
        cfg.setConnectionInitSql("PRAGMA foreign_keys = ON");
        cfg.setPoolName("venture-sqlite");
        return new HikariDataSource(cfg);
    }

    /** Folder for uploaded certificate files. */
    @Bean
    public Path uploadDir(VentureProperties props) {
        Path dir = Path.of(props.storage().dataDir()).toAbsolutePath().normalize().resolve("uploads");
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return dir;
    }
}
