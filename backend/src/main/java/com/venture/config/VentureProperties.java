package com.venture.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Typed view of the {@code venture.*} settings in application.yml. */
@ConfigurationProperties(prefix = "venture")
public record VentureProperties(Storage storage, Security security, Gemini gemini, Web web) {

    public record Storage(@DefaultValue("./data") String dataDir) {}

    public record Security(@DefaultValue("") String sessionSecret) {}

    public record Gemini(@DefaultValue("") String apiKey, @DefaultValue("gemini-3.7-flash") String model) {
        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank();
        }
    }

    public record Web(@DefaultValue("../frontend/dist") String distDir) {}
}
