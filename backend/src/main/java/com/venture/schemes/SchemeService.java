package com.venture.schemes;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.venture.ai.GeminiClient;
import com.venture.ai.GeminiException;
import com.venture.business.Business;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

/**
 * Scheme / subsidy intelligence.
 *
 * <p><b>Product boundary:</b> Venture never guarantees eligibility or invents
 * a benefit amount. Every record traces to a named official source with a
 * last-checked date, and every match is "may be relevant" — never "you qualify
 * for". Matching is deterministic and rule-based; an LLM never decides it.
 */
@Service
public class SchemeService {

    static final String DISCOVERY_DISCLAIMER =
            "These results come from a live web search, not from Venture\u2019s verified scheme records. Confirm details with the official source before relying on them.";

    private static final String DISCOVERY_SYSTEM_INSTRUCTION =
            "You are a research assistant for an Indian MSME compliance tool. You only report what your web search actually returns — never invent scheme names, subsidy amounts, eligibility criteria, deadlines, or application links. Always favor official (.gov.in or state government) sources when citing.";

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Eligibility(List<String> businessTypes, List<String> industries, Number maxEmployees, Number maxTurnover) {}

    private final SchemeRepository repository;
    private final GeminiClient gemini;
    private final ObjectMapper mapper;

    public SchemeService(SchemeRepository repository, GeminiClient gemini, ObjectMapper mapper) {
        this.repository = repository;
        this.gemini = gemini;
        this.mapper = mapper;
    }

    /**
     * Matches stored records against the business's type and industry — fields
     * already collected at setup. Never guesses missing information: a scheme
     * that depends on turnover or headcount (which we don't collect) is still
     * surfaced, flagged {@code needsMoreInfo}, rather than silently matched or dropped.
     */
    public List<SchemeMatchDto> match(Business business) {
        repository.seedIfEmpty();
        String industry = business.industry() == null ? "" : business.industry().toLowerCase(Locale.ROOT);
        String businessType = business.businessType();

        List<SchemeMatchDto> matches = new ArrayList<>();
        for (SchemeRow row : repository.listAll()) {
            Eligibility eligibility = parseEligibility(row.eligibilityJson());
            boolean matched = true;

            if (eligibility.industries() != null) {
                matched = eligibility.industries().stream()
                        .anyMatch(i -> industry.contains(i.toLowerCase(Locale.ROOT)));
            }
            if (matched && eligibility.businessTypes() != null && businessType != null && !businessType.isEmpty()) {
                matched = eligibility.businessTypes().contains(businessType);
            }
            if (!matched) continue;

            boolean needsMoreInfo = isSet(eligibility.maxEmployees()) || isSet(eligibility.maxTurnover());
            matches.add(new SchemeMatchDto(
                    row.id(),
                    row.name(),
                    row.category(),
                    row.description(),
                    row.benefitSummary(),
                    row.sourceName(),
                    row.sourceUrl(),
                    row.lastCheckedAt(),
                    needsMoreInfo));
        }
        return matches;
    }

    /**
     * Search-grounded discovery. Deliberately separate from {@link #match}: it
     * asks Gemini to search the live web for anything current the curated
     * records don't cover, and its output is always shown distinctly labelled.
     *
     * @throws GeminiException if the call cannot be made or fails
     */
    public SchemeDiscoveryResult discover(Business business) {
        String industry = isBlank(business.industry()) ? "general business" : business.industry();
        String location = isBlank(business.location()) ? "India" : business.location();
        String prompt = "Search for current Indian government schemes, subsidies, or support programs for a " + industry
                + " MSME business located in " + location
                + ". Summarize what you find in 3-5 sentences, focused on programs an MSME owner might not already know about. "
                + "Do not invent scheme names, amounts, or eligibility criteria — only report what your search actually finds. "
                + "If you find nothing specific, say so plainly.";

        ArrayNode contents = mapper.createArrayNode();
        ObjectNode turn = contents.addObject();
        turn.put("role", "user");
        turn.putArray("parts").addObject().put("text", prompt);

        GeminiClient.GroundedResult result = gemini.generateGrounded(contents, DISCOVERY_SYSTEM_INSTRUCTION);
        String summary = result.text().isEmpty() ? "No specific current information was found." : result.text();
        return SchemeDiscoveryResult.found(
                summary,
                result.sources(),
                DISCOVERY_DISCLAIMER,
                Instant.now().truncatedTo(ChronoUnit.MILLIS).toString());
    }

    private Eligibility parseEligibility(String json) {
        try {
            return mapper.readValue(json, Eligibility.class);
        } catch (Exception e) {
            throw new IllegalStateException("Corrupt scheme eligibility JSON", e);
        }
    }

    private static boolean isSet(Number n) {
        return n != null && n.doubleValue() != 0;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isEmpty();
    }
}
