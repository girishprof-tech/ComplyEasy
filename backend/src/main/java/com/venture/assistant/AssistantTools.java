package com.venture.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.venture.ai.GeminiException;
import com.venture.business.Business;
import com.venture.business.BusinessDto;
import com.venture.common.ItemStatus;
import com.venture.compliance.ComplianceItemDto;
import com.venture.compliance.ComplianceItemRepository;
import com.venture.schemes.SchemeService;
import com.venture.sustainability.SustainabilityService;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * The named tools Gemini may call. Every tool takes the already-authorised
 * {@link Business} resolved for this request, so no tool can be asked for
 * anyone else's data — scoping works exactly as it does for every other route.
 */
@Component
public class AssistantTools {

    private static final Map<String, String> NO_BUSINESS = Map.of("error", "No business found or not authorized.");

    private final ComplianceItemRepository items;
    private final SchemeService schemes;
    private final SustainabilityService sustainability;
    private final JsonNode declarations;

    public AssistantTools(
            ComplianceItemRepository items,
            SchemeService schemes,
            SustainabilityService sustainability,
            ObjectMapper mapper)
            throws IOException {
        this.items = items;
        this.schemes = schemes;
        this.sustainability = sustainability;
        try (InputStream in = new ClassPathResource("assistant/tools.json").getInputStream()) {
            this.declarations = mapper.readTree(in);
        }
    }

    /** The Gemini {@code tools} array (function declarations). */
    public JsonNode declarations() {
        return declarations;
    }

    /** All compliance items on file, in the order they were created. */
    public List<ComplianceItemDto> complianceItems(Business business) {
        return items.listByClientInCreationOrder(business.id()).stream().map(ComplianceItemDto::from).toList();
    }

    /** Runs one tool and returns something JSON-serialisable. */
    public Object run(String name, Business business) {
        if (business == null) return NO_BUSINESS;
        switch (name) {
            case "get_business_profile":
                return BusinessDto.from(business);
            case "get_compliance_items":
                return complianceItems(business);
            case "get_expiring_compliances":
                return complianceItems(business).stream().filter(i -> i.status() != ItemStatus.ACTIVE).toList();
            case "get_scheme_matches":
                return schemes.match(business);
            case "get_sustainability_profile":
                return sustainability.overview(business);
            case "discover_current_schemes":
                // A real, separate search-grounded call; never merged with the verified matches.
                try {
                    return schemes.discover(business);
                } catch (GeminiException e) {
                    return Map.of("error", "Search discovery unavailable right now (" + e.code() + ").");
                } catch (RuntimeException e) {
                    return Map.of("error", "Search discovery unavailable right now (unknown error).");
                }
            default:
                return Map.of("error", "Unknown tool: " + name);
        }
    }
}
