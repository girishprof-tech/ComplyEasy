package com.venture.assistant;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.venture.ai.WebSource;
import java.util.List;

public final class ChatModels {

    private ChatModels() {}

    /** One earlier turn; {@code role} is "user" or "assistant". */
    public record Turn(String role, String text) {}

    public record ChatRequest(String message, List<Turn> history) {}

    public record ChatResponse(
            String reply,
            boolean usedGemini,
            List<WebSource> sources,
            @JsonInclude(JsonInclude.Include.NON_NULL) Boolean demoMode,
            @JsonInclude(JsonInclude.Include.NON_NULL) String error) {

        static ChatResponse direct(String reply) {
            return new ChatResponse(reply, false, List.of(), null, null);
        }
    }
}
