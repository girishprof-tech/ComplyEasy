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
import com.venture.schemes.SchemeMatchDto;
import com.venture.sustainability.SustainabilityModels;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
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
            String fallback = buildDeterministicFallback(business, message);
            if (fallback != null) return new ChatResponse(fallback, false, List.of(), true, null);
            return new ChatResponse(NOT_CONFIGURED_REPLY, false, List.of(), true, null);
        }

        String contextualInstruction = buildContextualSystemInstruction(business);

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
                    gemini.generateContent(contents, tools.declarations(), contextualInstruction, null);

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

                result = gemini.generateContent(contents, tools.declarations(), contextualInstruction, null);
            }

            String reply = result.text().isEmpty()
                    ? "I wasn't able to form a response — could you rephrase that?"
                    : result.text();
            return new ChatResponse(reply, true, List.of(), null, null);
        } catch (Exception e) {
            String code = e instanceof GeminiException g ? g.code() : null;
            String fallback = buildDeterministicFallback(business, message);
            if (fallback != null) {
                return new ChatResponse(fallback, false, List.of(), null, null);
            }
            return new ChatResponse(
                    "I couldn't reach the AI model: " + explain(code)
                            + " You can still ask direct questions like \"what's expiring soon\" — those work without it.",
                    false,
                    List.of(),
                    null,
                    code == null ? "unknown" : code);
        }
    }

    private String buildContextualSystemInstruction(Business business) {
        StringBuilder sb = new StringBuilder(this.systemInstruction);
        if (business == null) return sb.toString();

        sb.append("\n\n--- CURRENT BUSINESS RECORDS ---\n");
        sb.append("Business Name: ").append(business.businessName()).append("\n");
        if (business.businessType() != null) sb.append("Type: ").append(business.businessType()).append("\n");
        if (business.industry() != null) sb.append("Industry: ").append(business.industry()).append("\n");
        if (business.location() != null) sb.append("Location: ").append(business.location()).append("\n");
        if (business.registrationId() != null) sb.append("Registration/GSTIN: ").append(business.registrationId()).append("\n");

        List<ComplianceItemDto> items = tools.complianceItems(business);
        if (!items.isEmpty()) {
            sb.append("\nCompliance Items on File:\n");
            for (ComplianceItemDto item : items) {
                sb.append("- ").append(item.name())
                        .append(" (Status: ").append(item.status().value())
                        .append(", Due: ").append(item.daysLabel())
                        .append(", Category: ").append(item.category())
                        .append(")\n");
            }
        } else {
            sb.append("\nCompliance Items: No items recorded yet.\n");
        }

        try {
            List<SchemeMatchDto> matches = tools.schemeMatches(business);
            if (matches != null && !matches.isEmpty()) {
                sb.append("\nVerified Relevant Government Schemes:\n");
                for (SchemeMatchDto m : matches) {
                    sb.append("- ").append(m.name())
                            .append(" [").append(m.category()).append("]: ")
                            .append(m.benefitSummary())
                            .append(" (Source: ").append(m.sourceName()).append(")\n");
                }
            }
        } catch (Exception ignored) {}

        try {
            SustainabilityModels.Response sus = tools.sustainabilityOverview(business);
            if (sus != null && sus.recommendations() != null && !sus.recommendations().isEmpty()) {
                sb.append("\nBaseline Sustainability Recommendations for this sector:\n");
                for (var r : sus.recommendations()) {
                    sb.append("- [").append(r.category()).append("] ").append(r.text()).append("\n");
                }
            }
        } catch (Exception ignored) {}

        sb.append("\nUse this context to answer directly, accurately, and concisely. Only invoke tools if the user specifically requests additional unverified web searches or actions.");
        return sb.toString();
    }

    private String buildDeterministicFallback(Business business, String message) {
        if (business == null || message == null) return null;
        String lower = message.toLowerCase(Locale.ROOT);

        if (lower.contains("scheme") || lower.contains("subsid") || lower.contains("grant")
                || lower.contains("incentive") || lower.contains("fund")) {
            List<SchemeMatchDto> matches = tools.schemeMatches(business);
            if (matches.isEmpty()) {
                return "Based on verified records for **" + business.businessName() + "** ("
                        + (business.industry() != null ? business.industry() : "general")
                        + "), we don't have matching government schemes on file yet. You can explore standard schemes like CGTMSE and Stand-Up India on their official portals.";
            }
            StringBuilder sb = new StringBuilder("Here are verified government schemes relevant to **")
                    .append(business.businessName()).append("**:\n\n");
            for (SchemeMatchDto m : matches) {
                sb.append("• **").append(m.name()).append("** (").append(m.category()).append(")\n")
                        .append("  ").append(m.benefitSummary()).append("\n")
                        .append("  *Source:* [").append(m.sourceName()).append("](").append(m.sourceUrl()).append(")\n\n");
            }
            sb.append("*Please confirm specific eligibility with the official portal before applying.*");
            return sb.toString();
        }

        if (lower.contains("sustainab") || lower.contains("green") || lower.contains("energy")
                || lower.contains("solar") || lower.contains("waste") || lower.contains("water")
                || lower.contains("eco") || lower.contains("carbon")) {
            SustainabilityModels.Response sus = tools.sustainabilityOverview(business);
            if (sus != null && sus.recommendations() != null && !sus.recommendations().isEmpty()) {
                StringBuilder sb = new StringBuilder("Here are baseline sustainability recommendations for **")
                        .append(business.businessName()).append("** (")
                        .append(business.industry() != null ? business.industry() : "MSME").append("):\n\n");
                for (var r : sus.recommendations()) {
                    sb.append("• **").append(r.category()).append(":** ").append(r.text()).append("\n\n");
                }
                return sb.toString();
            }
        }

        if (lower.contains("expir") || lower.contains("due") || lower.contains("deadlin")
                || lower.contains("gst") || lower.contains("license") || lower.contains("certificate")
                || lower.contains("status") || lower.contains("complian")) {
            List<ComplianceItemDto> items = tools.complianceItems(business);
            if (items.isEmpty()) {
                return "You currently have no compliance items on file for **" + business.businessName()
                        + "**. Add your licenses and certificates to track their expiry dates.";
            }
            StringBuilder sb = new StringBuilder("Here is the current compliance status for **")
                    .append(business.businessName()).append("**:\n\n");
            for (ComplianceItemDto i : items) {
                sb.append("• **").append(i.name()).append("**: ").append(i.daysLabel())
                        .append(" (Status: ").append(i.status().value()).append(")\n");
            }
            return sb.toString();
        }

        return null;
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
