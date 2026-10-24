package com.venture.ai;

import org.springframework.stereotype.Component;

/** Whether AI output is real (a Gemini key is configured) or clearly-labelled demo output. */
@Component
public class AiMode {

    private final GeminiClient gemini;

    public AiMode(GeminiClient gemini) {
        this.gemini = gemini;
    }

    public boolean isDemo() {
        return !gemini.isConfigured();
    }
}
