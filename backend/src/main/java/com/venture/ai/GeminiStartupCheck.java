package com.venture.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Logs once at startup whether the Gemini key and model work, so problems are obvious in the console. */
@Component
public class GeminiStartupCheck implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(GeminiStartupCheck.class);

    private final GeminiClient gemini;

    public GeminiStartupCheck(GeminiClient gemini) {
        this.gemini = gemini;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Off the main thread so a slow network never delays startup.
        Thread t = new Thread(() -> {
            GeminiClient.Status s = gemini.diagnose();
            if (!s.configured()) {
                log.info("[gemini] no API key set - running in Demo AI Mode");
            } else if (!s.keyAccepted()) {
                log.warn("[gemini] AI will NOT work: {}", s.problem());
            } else if (s.problem() != null) {
                log.warn("[gemini] {}", s.problem());
            } else {
                log.info("[gemini] key accepted, model \"{}\" is available", s.configuredModel());
            }
        }, "gemini-startup-check");
        t.setDaemon(true);
        t.start();
    }
}
