package com.venture.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.venture.ai.GeminiClient;
import com.venture.ai.GeminiException;
import com.venture.assistant.ChatModels.ChatResponse;
import com.venture.assistant.ChatModels.Turn;
import com.venture.business.Business;
import com.venture.compliance.ComplianceItemDto;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

/**
 * "Ask Venture" — the conversational layer.
 *
 * <ol>
 *   <li>A fast path answers simple database questions without calling Gemini.
 *   <li>A Gemini function-calling loop handles anything needing reasoning or
 *       personalisation; the model requests only the data it needs via named
 *       tools and never gets the whole database in the prompt.
 *   <li>A friendly deterministic fallback if Gemini is not configured or fails.
 * </ol>
 *
 * <p>Privacy: every tool is scoped to the one business already authorised for
 * this request — there is no tool that can be asked for another user's data.
 */
@Service
public class AssistantService {

    private static final int MAX_TOOL_ROUNDS = 4;

    private static final String NOT_CONFIGURED_REPLY =
            "The conversational assistant isn't configured on this deployment (no Gemini API key set), so I can't have a full conversation right now — but you can ask me things like \"when does my GST registration expire\" or \"what's expiring soon\" and I'll answer directly from your records.";

    private final GeminiClient gemini;
    private final AssistantTools tools;
    private final ObjectMapper mapper;
    private final String systemInstruction;

    public AssistantService(GeminiClient gemini, AssistantTools tools, ObjectMapper mapper) throws IOException {
        this.gemini = gemini;
        this.tools = tools;
        this.mapper = mapper;
        try (InputStream in = new ClassPathResource("assistant/system-instruction.txt").getInputStream()) {
            this.systemInstruction = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    public ChatResponse chat(Business business, String message, List<Turn> history) {
        if (FastPathAnswerer.matches(message)) {
            List<ComplianceItemDto> items = tools.complianceItems(business);
            Optional<String> fast = FastPathAnswerer.answer(message, items);
            if (fast.isPresent()) return ChatResponse.direct(fast.get());
        }

        if (!gemini.isConfigured()) {
            return new ChatResponse(NOT_CONFIGURED_REPLY, false, List.of(), true, null);
        }

        ArrayNode contents = mapper.createArrayNode();
        for (Turn turn : history) {
            ObjectNode node = contents.addObject();
            node.put("role", "assistant".equals(turn.role()) ? "model" : "user");
            node.putArray("parts").addObject().put("text", turn.text());
        }
        ObjectNode userTurn = contents.addObject();
        userTurn.put("role", "user");
        userTurn.putArray("parts").addObject().put("text", message);

        try {
            GeminiClient.GenerateResult result =
                    gemini.generateContent(contents, tools.declarations(), systemInstruction, null);

            int round = 0;
            while (!result.functionCalls().isEmpty() && round < MAX_TOOL_ROUNDS) {
                round++;

                ObjectNode modelTurn = contents.addObject();
                modelTurn.put("role", "model");
                ArrayNode modelParts = modelTurn.putArray("parts");
                // Echo the model's parts back untouched: newer Gemini models attach a
                // thoughtSignature to function calls and reject the follow-up without it.
                for (JsonNode part : result.modelParts()) {
                    modelParts.add(part);
                }

                ObjectNode toolTurn = contents.addObject();
                toolTurn.put("role", "user");
                ArrayNode toolParts = toolTurn.putArray("parts");
                for (JsonNode call : result.functionCalls()) {
                    Object toolResult = tools.run(call.path("name").asText(), business);
                    ObjectNode response = toolParts.addObject().putObject("functionResponse");
                    response.put("name", call.path("name").asText());
                    response.putObject("response").set("result", mapper.valueToTree(toolResult));
                }

                result = gemini.generateContent(contents, tools.declarations(), systemInstruction, null);
            }

            String reply = result.text().isEmpty()
                    ? "I wasn't able to form a response — could you rephrase that?"
                    : result.text();
            return new ChatResponse(reply, true, List.of(), null, null);
        } catch (Exception e) {
            String code = e instanceof GeminiException g ? g.code() : null;
            return new ChatResponse(
                    "I couldn't reach the AI model: " + explain(code)
                            + " You can still ask direct questions like \"what's expiring soon\" — those work without it.",
                    false,
                    List.of(),
                    null,
                    code == null ? "unknown" : code);
        }
    }

    /** A plain-language reason for a Gemini failure, aimed at whoever runs the server. */
    private static String explain(String code) {
        if (code == null) return "something unexpected went wrong (see the server log).";
        return switch (code) {
            case "invalid_key" -> "the Gemini API key was rejected — check GEMINI_API_KEY.";
            case "not_found" -> "the configured Gemini model wasn't found — check GEMINI_MODEL.";
            case "rate_limited" -> "Gemini's rate limit or quota was reached — try again in a minute.";
            case "network" -> "the server couldn't reach Gemini — check its internet access.";
            case "malformed" -> "Gemini sent back an unexpected response — try again.";
            default -> "Gemini returned an error (see the server log).";
        };
    }
}
