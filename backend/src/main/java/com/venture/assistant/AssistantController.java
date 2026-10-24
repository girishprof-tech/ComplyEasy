package com.venture.assistant;

import com.venture.assistant.ChatModels.ChatRequest;
import com.venture.assistant.ChatModels.ChatResponse;
import com.venture.assistant.ChatModels.Turn;
import com.venture.business.Business;
import com.venture.business.BusinessResolver;
import com.venture.common.ApiException;
import com.venture.security.SessionUser;
import java.util.List;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Chat endpoint for either role, scoped like every other business route:
 * authorisation is checked first, before the message is even considered, so an
 * unauthorised request's text never reaches Gemini. Conversation history is
 * kept client-side and sent with each request — nothing is logged server-side.
 */
@RestController
public class AssistantController {

    private static final int MAX_MESSAGE_LENGTH = 2000;
    private static final int MAX_HISTORY_TURNS = 12;

    private final BusinessResolver resolver;
    private final AssistantService assistant;

    public AssistantController(BusinessResolver resolver, AssistantService assistant) {
        this.resolver = resolver;
        this.assistant = assistant;
    }

    @PostMapping({"/api/clients/{clientId}/assistant", "/api/business/assistant"})
    public ChatResponse chat(
            SessionUser user, @PathVariable(required = false) Long clientId, @RequestBody ChatRequest request) {
        Business business = resolver.require(user, clientId);

        String message = request.message();
        if (message == null || message.isEmpty()) throw ApiException.badRequest("message is required");
        if (message.length() > MAX_MESSAGE_LENGTH) throw ApiException.badRequest("Message is too long.");

        List<Turn> history = request.history() == null ? List.of() : request.history();
        if (history.size() > MAX_HISTORY_TURNS) {
            history = history.subList(history.size() - MAX_HISTORY_TURNS, history.size());
        }
        return assistant.chat(business, message, history);
    }
}
